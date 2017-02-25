export type Type = 'Any' |
  'Literal' |
  'Null' |
  'String' |
  'Boolean' |
  'Number' |
  'DateTime' |
  'Union' |
  'Intersection' |
  'List' |
  'Tuple' |
  'Record' |
  'Eval' |
  'Property' |
  'Constant'

/**
 * JSON-LD context.
 */
export const context = {
  '@vocab': 'https://standard-schema.org/'
}

/**
 * Supported primitive types in certain value positions.
 */
export type Primitive = string | number | boolean | null | undefined

/**
 * Definition for the schema (JSON-LD compatible).
 */
export interface Schema {
  // General properties.
  '@id'?: string
  '@type'?: Type
  description?: string
  // `Any`.
  use?: Schema | Schema[]
  // `String`.
  minLength?: number
  maxLength?: number
  pattern?: string
  format?: string
  // `Number`, `String`, `DateTime`.
  min?: number | string
  max?: number | string
  // `Union`, `Intersection`, `Property`.
  type?: Schema | Schema[]
  // `List`.
  items?: Schema
  minItems?: number
  maxItems?: number
  // `Record`.
  property?: Schema[]
  additionalProperties?: Schema
  // `Record`, `Property`.
  minProperties?: number
  maxProperties?: number
  // `Property`.
  key?: Primitive | Schema
  required?: boolean
  // `Tuple`.
  tuple?: Schema[]
  // `Literal`, `Eval`, `Constant`.
  value?: Primitive
}
