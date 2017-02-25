import { Schema } from './schema'

export type Key = string | number
export type Path = Key[]

/**
 * Internal error object list exposed on the context.
 */
export interface ErrorObject {
  message: string
  dataPath: Path
  schemaPath: Path
}

/**
 * The context object is passed around for validation.
 */
export interface Context {
  errorCount: number
  errors?: ErrorObject[]
}

/**
 * Internal schema cache for internal ids.
 */
export interface SchemaCache {
  [id: string]: string | undefined
}

/**
 * A map of the already required scopes.
 */
export interface ScopeCache {
  [key: string]: string | ScopeCache | undefined
}

/**
 * Generated validators are of this type.
 */
export interface ValidatorFunction <T> {
  (data: any, dataPath: Path, context: Context): T | Promise<T>
}

/**
 * Global context for generating a validation function.
 */
export class Global {
  index = 0
  scopeName = this.sym()
  validators: Validator[] = []
  assertions: string[] = []
  schemaCache: SchemaCache = Object.create(null)
  declareCache: { [text: string]: string | undefined } = Object.create(null)
  scopeCache: ScopeCache = Object.create(null)

  branch (schema: Schema, schemaPath: Path) {
    const context = new Validator(this, this.sym(), schema, schemaPath)
    this.validators.push(context)
    return context
  }

  sym () {
    return `g${this.index++}`
  }

  declare (text: string | number) {
    if (this.declareCache[text]) {
      return this.declareCache[text]!
    }

    const name = this.sym()
    this.declareCache[text] = name
    return name
  }

  assert (check: string, message: string) {
    this.assertions.push(`if (!(${check})) throw new TypeError(${JSON.stringify(message)})`)
  }

  require (path: Path, typeOf: string, required = true) {
    let currentScope: string | ScopeCache = this.scopeCache
    let suffix = ''

    for (let i = 0; i < path.length; i++) {
      suffix += this.stringifyKey(path[i])

      if (typeof currentScope === 'string') {
        throw new TypeError(`Expected scope${suffix} to be an object, but got ${currentScope}`)
      }

      const key = path[i]
      const isLastKey = i === path.length - 1
      const childScope = currentScope[key]

      if (childScope === undefined) {
        const check = JSON.stringify(isLastKey ? typeOf : 'object')

        currentScope = currentScope[key] = (isLastKey ? typeOf : Object.create(null))

        const keyName = `${this.scopeName}${suffix}`
        const prefix = required ? '' : `${keyName} === undefined || `
        const typeCheck = `typeof ${this.scopeName}${suffix} === ${check}`

        this.assert(`${prefix}${typeCheck}`, `Expected scope${suffix} to be ${check}`)
      }
    }

    return this.declare(this.scopeName + suffix)
  }

  stringifyPath (path: Path) {
    return path.reduce((str, key) => str + this.stringifyKey(key), '')
  }

  stringifyKey (key: Key | boolean | null | undefined) {
    if (typeof key === 'string' && /^[$_A-Za-z][$_A-Za-z0-9]*$/.test(key)) {
      return `.${key}`
    }

    return `[${JSON.stringify(key)}]`
  }

  getDeclarations () {
    return Object.keys(this.declareCache).map(text => `var ${this.declareCache[text]} = ${text}`).join('\n')
  }

  getValidators () {
    return this.validators.map(x => x.toFunction()).join('\n')
  }

  getAssertions () {
    return this.assertions.join('\n')
  }
}

/**
 * Generate validation code for a single schema.
 */
export class Validator {
  vars: { [key: string]: number } = Object.create(null)
  indent = 1
  eol = '\n'
  code = ''
  dataName = this.sym('data')
  dataPathName = this.sym('path')
  contextName = this.sym('context')
  resultName = this.dataName
  params = [this.dataName, this.dataPathName, this.contextName]

  get indentation () {
    let code = ''

    for (let i = 0; i < this.indent; i++) {
      code += '  '
    }

    return code
  }

  constructor (public global: Global, public name: string, public schema: Schema, public schemaPath: Path) {}

  sym (key: string) {
    if (this.vars[key] === undefined) {
      this.vars[key] = 0
      return key
    }

    const count = this.vars[key]++
    return `${key}${count}`
  }

  push (text: string) {
    this.code += `${this.indentation}${text}${this.eol}`
  }

  var (name: string, value: string) {
    const key = this.sym(name)
    this.push(`var ${key} = ${value}`)
    return key
  }

  error (message: string, dataPathName: string, schemaPath: Path) {
    this.push(`${this.contextName}.errorCount++`)
    this.push(`if (${this.contextName}.errors === undefined) ${this.contextName}.errors = []`)
    this.push(`${this.contextName}.errors.push({ message: ${JSON.stringify(message)}, dataPath: ${dataPathName}, schemaPath: ${JSON.stringify(schemaPath)} })`)
    this.push(`return ${this.resultName}`)
  }

  createContext () {
    return this.var('context', '{ errorCount: 0 }')
  }

  mergeContext (childContext: string) {
    this.push(`${this.contextName}.errorCount += ${childContext}.errorCount`)
    this.doIf(`${this.contextName}.errors && ${childContext}.errors`)
    this.push(`${this.contextName}.errors.concat(${childContext}.errors)`)
    this.doElse()
    this.push(`${this.contextName}.errors = ${childContext}.errors`)
    this.doEnd()
  }

  doIf (statement: string) {
    this.push(`if (${statement}) {`)
    this.indent++
  }

  doElse () {
    this.indent--
    this.push(`} else {`)
    this.indent++
  }

  doElseIf (statement: string) {
    this.indent--
    this.push(`} else if (${statement}) {`)
    this.indent++
  }

  doEnd () {
    this.indent--
    this.push(`}`)
  }

  result (value: string) {
    const resultName = this.var('result', value)
    this.resultName = resultName
    return resultName
  }

  toFunction () {
    return `function ${this.name} (${this.params.join(', ')}) {\n${this.code}\n${this.indentation}return ${this.resultName}\n}\n`
  }
}

/**
 * Recursive visitor function.
 */
export type Visit = (schema: Schema, schemaPath: Path) => string

/**
 * The compiler function.
 */
export type Plugin = (schema: Schema, visit: Visit, next: () => void) => void

/**
 * Compile the schema into a function.
 */
export function compileSchema (schema: Schema, handler: Plugin): Global {
  const global = new Global()

  function visit (schema: Schema, schemaPath: Path): string {
    const id = schema['@id']
    const type = schema['@type']
    const cacheName = global.require(['cache'], 'object')

    // Detect references and break.
    if (id && !type) {
      return cacheName + global.stringifyKey(id)
    }

    const context = global.branch(schema, schemaPath)

    if (id) {
      global.declare(`${cacheName}${global.stringifyKey(id)} = ${context.name}`)
    }

    handler(context, visit, function () {
      throw new TypeError(`Unknown schema: ${context.schema['@type']}`)
    })

    return context.name
  }

  visit(schema, [])

  return global
}

/**
 * Compose schema compilers into a single function.
 */
export function compose (plugins: Plugin[]): Plugin {
  return function (schema, visit, done) {
    let index = -1

    function dispatch (pos: number): void {
      if (pos <= index) {
        throw new TypeError('`next()` called multiple times')
      }

      index = pos

      const fn = plugins[pos] || done

      return fn(schema, visit, function () {
        return dispatch(pos + 1)
      })
    }

    return dispatch(0)
  }
}
