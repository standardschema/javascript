export class AnyType {
  type = 'Any'

  isAssignable(other: AnyType): other is AnyType {
    return other instanceof AnyType
  }

  getProperty(key: string) {
    return new UnknownType()
  }

  static fromJSON(data: any) {
    return new AnyType()
  }
}

export class UnknownType extends AnyType {
  type = 'Unknown'

  isAssignable(other: AnyType): other is UnknownType {
    return other instanceof UnknownType
  }

  static fromJSON(data: any) {
    return new UnknownType()
  }
}

export class NullType extends AnyType {
  type = 'Null'

  isAssignable(other: AnyType): other is NullType {
    return other instanceof NullType
  }

  static fromJSON(data: any) {
    return new NullType()
  }
}

export class BooleanType extends AnyType {
  type = 'Boolean'

  isAssignable(other: AnyType): other is BooleanType {
    return other instanceof BooleanType
  }

  static fromJSON(data: any) {
    return new BooleanType()
  }
}

export class StringType extends AnyType {
  type = 'String'

  isAssignable(other: AnyType): other is StringType {
    return other instanceof StringType
  }

  static fromJSON(data: any) {
    return new StringType()
  }
}

export class NumberType extends AnyType {
  type = 'Number'

  isAssignable(other: AnyType): other is NumberType {
    return other instanceof NumberType
  }

  static fromJSON(data: any) {
    return new NumberType()
  }
}

export class IntegerType extends NumberType {
  type = 'Integer'

  isAssignable(other: AnyType): other is IntegerType {
    return other instanceof IntegerType
  }

  static fromJSON(data: any) {
    return new IntegerType()
  }
}

export class FloatType extends NumberType {
  type = 'Float'

  isAssignable(other: AnyType): other is FloatType {
    return other instanceof FloatType
  }

  static fromJSON(data: any) {
    return new FloatType()
  }
}

export class DecimalType extends NumberType {
  type = 'Decimal'

  isAssignable(other: AnyType): other is DecimalType {
    return other instanceof DecimalType
  }

  static fromJSON(data: any) {
    return new DecimalType()
  }
}

export class ListType<T extends AnyType> extends AnyType {
  type = 'List'

  constructor(public items: T) {
    super()
  }

  isAssignable(other: AnyType): other is ListType<T> {
    if (!(other instanceof ListType)) return false

    return this.items.isAssignable(other.items)
  }

  getProperty(key: string) {
    // TODO(blakeembrey): Enable out-of-bounds indexes with min/max items.
    return this.items
  }

  static fromJSON(data: any) {
    return new ListType(schemaFromJSON(data.items || { '@type': 'Any' }))
  }
}

export class ObjectType extends AnyType {
  type = 'Object'

  constructor(
    public properties: Map<string, AnyType>,
    public optionalProperties: Map<string, AnyType>
  ) {
    super()
  }

  isAssignable(other: AnyType): other is ObjectType {
    if (!(other instanceof ObjectType)) return false

    for (const [key, type] of this.properties.entries()) {
      const otherType = other.properties.get(key)

      // Handle missing `other` property.
      if (!otherType) return false

      // Check assignability between `properties`.
      if (!type.isAssignable(otherType)) return false
    }

    for (const [key, type] of this.optionalProperties.entries()) {
      const otherType = other.optionalProperties.get(key)

      if (!otherType) continue

      if (other.properties.has(key)) {
        if (!type.isAssignable(other.properties.get(key)!)) return false
      }

      if (!type.isAssignable(otherType)) return false
    }

    return true
  }

  getProperty(key: string): AnyType | UnknownType {
    if (this.properties.has(key)) return this.properties.get(key)!

    if (this.optionalProperties.has(key)) {
      // TODO(blakeembrey): Union with `Null`.
      return this.optionalProperties.get(key)!
    }

    return super.getProperty(key)
  }

  static fromJSON(data: any) {
    const properties = new Map(
      Object.entries(data.properties || {}).map(
        ([key, value]): [string, AnyType] => [key, schemaFromJSON(value)]
      )
    )

    const optionalProperties = new Map(
      Object.entries(data.optionalProperties || {}).map(
        ([key, value]): [string, AnyType] => [key, schemaFromJSON(value)]
      )
    )

    return new ObjectType(properties, optionalProperties)
  }
}

export class DateType extends AnyType {
  type = 'Date'

  isAssignable(other: AnyType): other is DateType {
    return other instanceof DateType
  }

  static fromJSON(data: any) {
    return new DateType()
  }
}

export class DateTimeType extends DateType {
  type = 'DateTime'

  isAssignable(other: AnyType): other is DateTimeType {
    return other instanceof DateTimeType
  }

  static fromJSON(data: any) {
    return new DateTimeType()
  }
}

export const TYPES = {
  Any: AnyType,
  Unknown: UnknownType,
  Null: NullType,
  Boolean: BooleanType,
  String: StringType,
  Number: NumberType,
  Integer: IntegerType,
  Float: FloatType,
  Decimal: DecimalType,
  List: ListType,
  Object: ObjectType,
  Date: DateType,
  DateTime: DateTimeType
}

export type Type = keyof typeof TYPES

/**
 * Flat representation of all possible types.
 */
export interface TypeSchema {
  // `Any`.
  '@id'?: string
  '@type'?: Type
  description?: string
  // `List`.
  items?: TypeSchema[]
  // `Object`.
  properties?: { [key: string]: TypeSchema }
  optionalProperties?: { [key: string]: TypeSchema }
}

/**
 * Generic the model from a JSON object.
 */
export function schemaFromJSON(obj: any): AnyType {
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    const type: keyof typeof TYPES = obj['@type']

    if (!TYPES.hasOwnProperty(type)) {
      throw new TypeError(`Unknown type "${type}"`)
    }

    return TYPES[type].fromJSON(obj)
  }

  throw new TypeError(`Unknown JSON "${obj}"`)
}
