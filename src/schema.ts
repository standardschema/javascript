import { JavaScriptCodegen } from './codegen'

export const TYPES = {
  Any: false,
  Unknown: 'Unknown',
  Null: 'Any',
  Boolean: 'Any',
  String: 'Any',
  Number: 'Any',
  Float: 'Number',
  Integer: 'Number',
  Currency: 'Float',
  Percentage: 'Float',
  List: 'Any',
  Object: 'Any',
  Date: 'Any',
  DateTime: 'Date'
}

export interface Schema {
  // `Any`.
  '@id'?: string
  '@type'?: keyof typeof TYPES
  description?: string
  // `List`.
  items?: Schema
  // `Property`.
  key?: string
  value?: Schema
  // `Object`.
  properties?: {
    [key: string]: Schema
  }
}

function codegenSchemaCheck(codegen: JavaScriptCodegen, schema: Schema) {
  const type = schema['@type']

  if (type === 'Any') {
    codegen.result('true')
    return
  }

  const typeVar = codegen.var('type', codegen.ctxName + codegen.prop('@type'))

  if (type === 'Unknown') {
    codegen.result(`${typeVar} === 'Unknown'`)
    return
  }

  if (type === 'Null') {
    codegen.result(`${typeVar} === 'Null'`)
    return
  }

  if (type === 'Boolean') {
    codegen.result(`${typeVar} === 'Boolean'`)
    return
  }

  if (type === 'String') {
    codegen.result(`${typeVar} === 'String'`)
    return
  }

  if (type === 'Number') {
    codegen.result(
      `${typeVar} === 'Number' || ${typeVar} === 'Float' || ${typeVar} === 'Integer' || ${typeVar} === 'Currency' || ${typeVar} === 'Percentage'`
    )
    return
  }

  if (type === 'Integer') {
    codegen.result(`${typeVar} === 'Integer'`)
    return
  }

  if (type === 'Float') {
    codegen.result(
      `${typeVar} === 'Float' || ${typeVar} === 'Currency' || ${typeVar} === 'Percentage'`
    )
    return
  }

  if (type === 'Currency') {
    codegen.result(`${typeVar} === 'Currency'`)
    return
  }

  if (type === 'Percentage') {
    codegen.result(`${typeVar} === 'Percentage'`)
    return
  }

  if (type === 'Date') {
    codegen.result(`${typeVar} === 'Date'`)
    return
  }

  if (type === 'DateTime') {
    codegen.result(`${typeVar} === 'DateTime' || ${typeVar} === 'Date'`)
    return
  }

  if (type === 'List') {
    const isListVar = codegen.var('isList', `${typeVar} === 'List'`)

    if (schema.items) {
      const itemsCtx = codegen.ctx(codegen.ctxName + codegen.prop('items'))
      codegen.doIf(`${isListVar} && typeof ${itemsCtx} === 'object'`)
      codegenSchemaCheck(codegen, schema.items)
      codegen.doElse()
      codegen.result('false')
      codegen.doEnd()
      return
    }

    codegen.result(isListVar)
    return
  }

  if (type === 'Object') {
    codegen.doIf(`${typeVar} === 'Object'`)
    if (schema.properties) {
      const propertiesVar = codegen.var(
        'properties',
        codegen.ctxName + codegen.prop('properties')
      )
      const propCheckVar = codegen.var(
        'valid',
        `${propertiesVar} !== undefined`
      )

      codegen.resultNames.push(propCheckVar)

      codegen.doIf(propCheckVar)

      for (const [key, value] of Object.entries(schema.properties)) {
        codegen.doIf(propCheckVar)
        const propertyCtx = codegen.ctx(propertiesVar + codegen.prop(key))
        codegen.doIf(`${propertyCtx} === undefined`)
        codegen.assign(propCheckVar, 'false')
        codegen.doElse()
        codegenSchemaCheck(codegen, value)
        codegen.doEnd()
        codegen.doEnd()
      }

      codegen.doEnd()

      codegen.resultNames.pop()
      codegen.result(propCheckVar)
    } else {
      codegen.result('true')
    }
    codegen.doElse()
    codegen.result('false')
    codegen.doEnd()
    return
  }

  throw new TypeError(`Unknown schema type "${type}"`)
}

export function schemaToCheckString(schema: Schema, fnName = 'check'): string {
  const codegen = new JavaScriptCodegen(fnName)
  codegenSchemaCheck(codegen, schema)
  return codegen.toFunction()
}

export function compileSchemaCheck(schema: Schema): (schema: Schema) => true {
  return new Function(`return ${schemaToCheckString(schema)}`)()
}

export function getProperty(schema: Schema, key: string): Schema {
  return { '@type': 'Unknown' }
}
