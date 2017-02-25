import arrify = require('arrify')
import { Schema, Primitive } from './schema'
import { formats } from './formats'
import { compileSchema, Visit, Validator, ValidatorFunction, compose, ErrorObject } from './compile'

/**
 * Passed in scope (can augment to require new types defined).
 */
export interface Options {
  ValidationError: typeof ValidationError
  formats?: typeof formats
  cache?: {
    [key: string]: ValidatorFunction<any>
  }
}

/**
 * Validation error.
 */
export class ValidationError extends Error {
  constructor (public errors: ErrorObject[]) {
    super('Validation failed')

    Object.setPrototypeOf(this, Error.prototype)
  }
}

/**
 * Merge function used in generated code.
 */
function merge (items: any[]) {
  let res: any

  for (let i = 0; i < items.length; i++) {
    if (typeof res === 'object' && typeof items[i] === 'object') {
      const keys = Object.keys(items[i])

      for (let j = 0; j < keys.length; j++) {
        res[keys[j]] = items[i][j]
      }
    } else {
      res = items[i]
    }
  }

  return res
}

/**
 * Primitive value check for schema.
 */
function isPrimitive (value: any): value is Primitive {
  if (value === null || value === undefined) {
    return true
  }

  const typeOf = typeof value

  return typeOf === 'string' || typeOf === 'number' || typeOf === 'boolean'
}

/**
 * Generate the `use` middleware pattern.
 */
function useCompiler (v: Validator, visit: Visit, next: () => void) {
  const { schema, schemaPath } = v

  if (schema.use) {
    // Compile the type information.
    next()

    const indent = v.indent
    const resolveName = v.sym('resolve')

    // Generate the `use` types to check next.
    const thenChain = arrify(schema.use)
      .map((schema, index) => visit(schema, schemaPath.concat(['use', index])))
      .reduceRight(function (suffix, fnName, index) {
        const fnCall = `${fnName}(${resolveName}, ${v.dataPathName}, ${v.contextName})`

        v.indent = indent + index

        let str = `.then(function (${resolveName}) {`
        v.indent++
        str += `${v.eol}${v.indentation}if (${v.contextName}.errorCount) return ${resolveName}`
        str += `${v.eol}${v.indentation}return ${suffix ? `Promise.resolve(${fnCall})${suffix}` : fnCall}`
        v.indent--
        str += `${v.eol}${v.indentation}})`
        return str
      }, '')

    v.result(`Promise.resolve(${v.dataName})${thenChain}`)

    return
  }

  return next()
}

/**
 * Generate code for built-in types.
 */
function typeCompiler (v: Validator, visit: Visit, next: () => void) {
  const { dataName, dataPathName, contextName, schema, schemaPath } = v

  // It Just Works™.
  if (schema['@type'] === 'Any') {
    return
  }

  if (schema['@type'] === 'Literal') {
    v.doIf(`${dataName} !== ${JSON.stringify(schema.value)}`)
    v.error(`not a literal`, dataPathName, schemaPath.concat('@type'))
    v.doEnd()
    return
  }

  if (schema['@type'] === 'String') {
    v.doIf(`typeof ${dataName} === 'string'`)

    if (schema.minLength > 0) {
      v.doIf(`${dataName}.length < ${schema.minLength}`)
      v.error(`min length`, dataPathName, schemaPath.concat('minLength'))
      v.doEnd()
    }

    if (schema.maxLength > 0) {
      v.doIf(`${dataName}.length > ${schema.maxLength}`)
      v.error(`max length`, dataPathName, schemaPath.concat('maxLength'))
      v.doEnd()
    }

    if (schema.min) {
      v.doIf(`${dataName} < ${schema.min}`)
      v.error(`min`, dataPathName, schemaPath.concat('min'))
      v.doEnd()
    }

    if (schema.max) {
      v.doIf(`${dataName} > ${schema.max}`)
      v.error(`max`, dataPathName, schemaPath.concat('max'))
      v.doEnd()
    }

    if (typeof schema.pattern === 'string') {
      const re = v.global.declare(`new RegExp(${JSON.stringify(schema.pattern)})`)

      v.doIf(`!${re}.test(${dataName})`)
      v.error(`invalid pattern`, dataPathName, schemaPath.concat('pattern'))
      v.doEnd()
    }

    if (typeof schema.format === 'string') {
      // Requires the RegExp to be pre-defined.
      const re = v.global.require(['formats', schema.format], 'object')

      v.doIf(`!${re}.test(${dataName})`)
      v.error(`invalid format`, dataPathName, schemaPath.concat('format'))
      v.doEnd()
    }

    v.doElse()
    v.error(`not a string`, dataPathName, schemaPath.concat('@type'))
    v.doEnd()
    return
  }

  if (schema['@type'] === 'Number') {
    v.doIf(`typeof ${dataName} === 'number'`)

    if (typeof schema.min === 'number') {
      v.doIf(`${dataName} < ${schema.min}`)
      v.error(`min`, dataPathName, schemaPath.concat('min'))
      v.doEnd()
    }

    if (typeof schema.max === 'number') {
      v.doIf(`${dataName} < ${schema.max}`)
      v.error(`max`, dataPathName, schemaPath.concat('max'))
      v.doEnd()
    }

    v.doElse()
    v.error(`not a number`, dataPathName, schemaPath.concat('@type'))
    v.doEnd()
    return
  }

  if (schema['@type'] === 'Boolean') {
    v.doIf(`typeof ${dataName} !== 'boolean'`)
    v.error(`not a boolean`, dataPathName, schemaPath.concat('@type'))
    v.doEnd()
    return
  }

  if (schema['@type'] === 'Null') {
    v.doIf(`${dataName} !== null`)
    v.error(`not null`, dataPathName, schemaPath.concat('@type'))
    v.doEnd()
    return
  }

  if (schema['@type'] === 'List') {
    const itemsPath = schemaPath.concat('items')

    if (isPrimitive(schema.items) || Array.isArray(schema.items)) {
      throw new TypeError(`Expected ${v.global.stringifyPath(itemsPath)} to be a schema`)
    }

    const itemName = visit(schema.items, itemsPath)

    v.doIf(`Array.isArray(${dataName})`)

    if (schema.minItems > 0) {
      v.doIf(`${dataName}.length < ${schema.minItems}`)
      v.error(`min items`, dataPathName, schemaPath.concat('minItems'))
      v.doEnd()
    }

    if (schema.maxItems > 0) {
      v.doIf(`${dataName}.length > ${schema.maxItems}`)
      v.error(`max length`, dataPathName, schemaPath.concat('maxItems'))
      v.doEnd()
    }

    v.result(`Promise.all(${v.dataName}.map(function (item, index) { return ${itemName}(item, ${dataPathName}.concat(index), ${contextName}) }))`)
    v.doElse()
    v.error(`not a list`, dataPathName, schemaPath.concat('@type'))
    v.doEnd()
    return
  }

  if (schema['@type'] === 'Tuple') {
    const fnNames = arrify(schema.tuple).map((schema, index) => visit(schema, schemaPath.concat(['tuple', index])))
    const fnCalls = fnNames.map((fnName, index) => `${fnName}(${dataName}[${index}], ${dataPathName}.concat(${index}), ${contextName})`)

    v.doIf(`Array.isArray(${dataName})`)
    v.result(`Promise.all([${fnCalls.join(', ')}])`)
    v.doElse()
    v.error(`not a tuple`, dataPathName, schemaPath.concat('@type'))
    v.doEnd()
    return
  }

  if (schema['@type'] === 'DateTime') {
    v.doIf(`Object.prototype.toString.call(${dataName}) === '[object Date]'`)

    if (schema.min) {
      const minDateName = v.global.declare(Date.parse(String(schema.min)))

      v.doIf(`${dataName}.getTime() < ${minDateName}`)
      v.error('min date', dataPathName, schemaPath.concat('min'))
      v.doEnd()
    }

    if (schema.max) {
      const maxDateName = v.global.declare(Date.parse(String(schema.max)))

      v.doIf(`${dataName}.getTime() > ${maxDateName}`)
      v.error('max date', dataPathName, schemaPath.concat('max'))
      v.doEnd()
    }

    v.doElse()
    v.error(`not a date`, dataPathName, schemaPath.concat('@type'))
    v.doEnd()
    return
  }

  if (schema['@type'] === 'Intersection') {
    const fnNames = arrify(schema.type).map((schema, index) => visit(schema, schemaPath.concat(['type', index])))
    const fnCalls = fnNames.map((fnName) => `${fnName}(${dataName}, ${dataPathName}, ${contextName})`)

    if (fnCalls.length === 0) {
      v.result(`undefined`)
      return
    }

    if (fnCalls.length === 1) {
      v.result(`${fnCalls[0]}`)
      return
    }

    const mergeName = v.global.require(['merge'], 'function')

    v.result(`Promise.all([${fnCalls.join(', ')}]).then(${mergeName})`)
    return
  }

  if (schema['@type'] === 'Union') {
    const counterName = v.var('counter', '0')
    const childContextName = v.createContext()
    const resolvedName = v.sym('resolved')
    const indent = v.indent

    const promiseChain = arrify(schema.type)
      .map((schema, index) => visit(schema, schemaPath.concat(['type', index])))
      .reduceRight(function (suffix, fnName, index) {
        v.indent = indent + index

        let str = `${fnName}(${dataName}, ${dataPathName}, ${childContextName})`

        if (suffix) {
          str = `Promise.resolve(${str})`
          v.indent++
          str += `${v.eol}${v.indentation}.then(function (${resolvedName}) {`
          v.indent++
          str += `${v.eol}${v.indentation}if (${childContextName}.errorCount === ${counterName}) return ${resolvedName}`
          str += `${v.eol}${v.indentation}${counterName} = ${childContextName}.errorCount`
          str += `${v.eol}${v.indentation}return ${suffix}`
          v.indent--
          str += `${v.eol}${v.indentation}})`
          v.indent--
        }

        return str
      }, '')

    const doneName = v.sym('done')
    const resultName = v.var('result', promiseChain)

    v.push(`${doneName} = ${resultName}.then(function (${resolvedName}) {`)
    v.indent++
    v.push(`if (${childContextName}.errorCount === ${counterName}) return ${resolvedName}`)
    v.mergeContext(childContextName)
    v.push(`return ${resolvedName}`)
    v.indent--
    v.push(`})`)
    v.result(doneName)
    return
  }

  if (schema['@type'] === 'Record') {
    const properties = arrify(schema.property)

    v.doIf(`typeof ${dataName} === 'object' && ${dataName} !== null`)

    const recordName = v.var('record', '{}')
    const keysName = v.var('keys', `Object.keys(${v.dataName})`)

    if (schema.minProperties > 0) {
      v.doIf(`${keysName}.length < ${schema.minProperties}`)
      v.error(`min properties`, dataPathName, schemaPath.concat('minProperties'))
      v.doEnd()
    }

    if (schema.maxProperties > 0) {
      v.doIf(`${keysName}.length > ${schema.maxProperties}`)
      v.error(`max properties`, dataPathName, schemaPath.concat('maxProperties'))
      v.doEnd()
    }

    if (schema.additionalProperties) {
      // const fnName = visit(schema.additionalProperties, schemaPath.concat('additionalProperties'))
    }

    const fns = properties.map((property, index) => {
      const typePath = schemaPath.concat(['property', index, 'type'])

      if (isPrimitive(property.type) || Array.isArray(property.type)) {
        throw new TypeError(`Unexpected ${v.global.stringifyPath(typePath)} to be a schema`)
      }

      const resolveName = v.sym('resolve')
      const valueFnName = visit(property.type, typePath)

      // Primitive property key checks can be easily optimised.
      if (isPrimitive(property.key)) {
        const keyProp = v.global.stringifyKey(property.key)
        const keyString = JSON.stringify(property.key)
        const fnCall = `${valueFnName}(${dataName}${keyProp}, ${dataPathName}.concat(${keyString}), ${contextName})`

        v.push(`var ${resolveName}`)
        v.doIf(`Object.prototype.hasOwnProperty.call(${dataName}, ${keyString})`)
        v.push(`${resolveName} = Promise.resolve(${fnCall}).then(function (data) { ${recordName}${keyProp} = data })`)

        if (schema.required !== false) {
          v.doElse()
          v.error(`required`, `${dataPathName}.concat(${keyString})`, schemaPath.concat(['property', index, 'required']))
        }

        v.doEnd()
      } else {
        const propsName = v.sym('props')
        const lengthName = v.sym('length')
        const keyFnName = visit(property.key, schemaPath.concat(['property', index, 'key']))

        v.push(`var ${lengthName} = ${contextName}.errorCount`)
        v.push(`var ${propsName} = ${keysName}.reduce(function (p, k) {`)
        v.indent++
        v.push(`return p.then(function (keys) {`)
        v.indent++
        v.push(`return Promise.resolve(${keyFnName}(k, ${dataPathName}, ${contextName})).then(function (k) {`)
        v.indent++
        v.doIf(`${contextName}.errorCount === ${lengthName}`)
        v.push(`keys.push(k)`)
        v.doElseIf(`${lengthName} === 0`)
        v.push(`${contextName}.errors = undefined`)
        v.doElse()
        v.push(`${contextName}.errors.length = ${lengthName}`)
        v.doEnd()
        v.push(`return keys`)
        v.indent--
        v.push(`})`)
        v.indent--
        v.push(`})`)
        v.indent--
        v.push(`}, Promise.resolve([]))`)

        v.push(`var ${resolveName} = ${propsName}.then(function (keys) {`)
        v.indent++

        if (property.minProperties > 0) {
          v.doIf(`keys.length < ${property.minProperties}`)
          v.error(`min properties`, dataPathName, schemaPath.concat(['property', index, 'minProperties']))
          v.doEnd()
        }

        if (property.maxProperties > 0) {
          v.doIf(`keys.length > ${property.maxProperties}`)
          v.error(`max properties`, dataPathName, schemaPath.concat(['property', index, 'maxProperties']))
          v.doEnd()
        }

        const fnCall = `${valueFnName}(${dataName}[key], ${dataPathName}.concat(key), ${contextName})`

        v.push(`return Promise.all(keys.map(function (key) {`)
        v.indent++
        v.push(`return Promise.resolve(${fnCall}).then(function (data) { ${recordName}[key] = data })`)
        v.indent--
        v.push(`}))`)

        v.indent--
        v.push(`})`)
      }

      return resolveName
    })

    if (schema.additionalProperties) {
      const resName = v.sym('res')
      const additionalKeysName = v.sym('additionalKeys')
      const fnName = visit(schema.additionalProperties, schemaPath.concat('additionalProperties'))
      const fnCall = `${fnName}(${dataName}[key], ${dataPathName}.concat(key), ${contextName})`

      v.push(`var ${resName} = Promise.all([${fns.join(', ')}]).then(function () {`)
      v.indent++
      v.push(`if (${contextName}.errorCount) return ${recordName}`)
      v.push(`const ${additionalKeysName} = ${keysName}.filter(function (key) { return !${recordName}.hasOwnProperty(key) })`)
      v.push(`return Promise.all(${additionalKeysName}.map(function (key) {`)
      v.indent++
      v.push(`return Promise.resolve(${fnCall}).then(function (data) { ${recordName}[key] = data })`)
      v.indent--
      v.push(`}))`)
      v.indent--
      v.push(`})`)
      v.result(`${resName}.then(function () { return ${recordName} })`)
    } else {
      v.result(`Promise.all([${fns.join(', ')}]).then(function () { return ${recordName} })`)
    }

    v.doElse()
    v.error(`not a record`, dataPathName, schemaPath.concat('@type'))
    v.doEnd()
    return
  }

  if (schema['@type'] === 'Eval') {
    v.result(String(schema.value))
    return
  }

  if (schema['@type'] === 'Constant') {
    v.result(JSON.stringify(schema.value))
    return
  }

  return next()
}

/**
 * The type of the returned validation function.
 */
export interface Validation <T> {
  (data: any): Promise<T>
  schema: ValidatorFunction<T>
}

/**
 * Compose and export the base validation compiler function.
 */
export const validationHandler = compose([useCompiler, typeCompiler])

/**
 * Export the default validation function scope.
 */
export function createValidationScope () {
  return {
    cache: Object.create(null),
    ValidationError,
    formats,
    merge
  }
}

/**
 * Compile the schema into a function.
 */
export function validation (schema: Schema, handler = validationHandler): string {
  const global = compileSchema(schema, handler)

  const entry = global.validators[0]
  const mainName = global.sym()
  const ValidationErrorName = global.require(['ValidationError'], 'function')

  return `function validation (${global.scopeName}) {
${global.getAssertions()}
${global.getDeclarations()}
${global.getValidators()}

function ${mainName} (data) {
  var context = { errorCount: 0 }
  var result = ${entry.name}(data, [], context)

  return Promise.resolve(result).then(function (data) {
    if (context.errorCount) {
      return Promise.reject(new ${ValidationErrorName}(context.errors))
    } else {
      return data
    }
  })
}

${mainName}.schema = ${entry.name}

return ${mainName}
}`
}

/**
 * Compile the schema into a function.
 */
export function validationFunction <T> (schema: Schema, options?: Options): Validation<T> {
  const code = validation(schema)
  const scope = Object.assign(createValidationScope(), options)

  return new Function('_', `return (${code})(_)`)(scope)
}
