export class AnyType {
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
  isAssignable(other: AnyType): other is UnknownType {
    return other instanceof UnknownType
  }

  static fromJSON(data: any) {
    return new UnknownType()
  }
}

export class NullType extends AnyType {
  isAssignable(other: AnyType): other is NullType {
    return other instanceof NullType
  }

  static fromJSON(data: any) {
    return new NullType()
  }
}

export class BooleanType extends AnyType {
  isAssignable(other: AnyType): other is BooleanType {
    return other instanceof BooleanType
  }

  static fromJSON(data: any) {
    return new BooleanType()
  }
}

export class StringType extends AnyType {
  isAssignable(other: AnyType): other is StringType {
    return other instanceof StringType
  }

  static fromJSON(data: any) {
    return new StringType()
  }
}

export class NumberType extends AnyType {
  isAssignable(other: AnyType): other is NumberType {
    return other instanceof NumberType
  }

  static fromJSON(data: any) {
    return new NumberType()
  }
}

export class IntegerType extends NumberType {
  isAssignable(other: AnyType): other is IntegerType {
    return other instanceof IntegerType
  }

  static fromJSON(data: any) {
    return new IntegerType()
  }
}

export class FloatType extends NumberType {
  isAssignable(other: AnyType): other is FloatType {
    return other instanceof FloatType
  }

  static fromJSON(data: any) {
    return new FloatType()
  }
}

export class ListType<T extends AnyType> extends AnyType {
  constructor(public items?: T) {
    super()
  }

  isAssignable(other: AnyType): other is ListType<T> {
    if (!(other instanceof ListType)) return false

    if (this.items) {
      if (!other.items) return false
      return this.items.isAssignable(other.items)
    }

    return true
  }

  getProperty(key: string) {
    // TODO(blakeembrey): Enable out-of-bounds indexes with min/max items.
    return this.items || new AnyType()
  }

  static fromJSON(data: any) {
    return new ListType(schemaFromJSON(data.items))
  }
}

export class ObjectType extends AnyType {
  constructor(public properties?: Record<string, AnyType>) {
    super()
  }

  isAssignable(other: AnyType): other is ObjectType {
    if (!(other instanceof ObjectType)) return false

    if (this.properties) {
      if (!other.properties) return false

      for (const [key, type] of Object.entries(this.properties)) {
        // Handle missing `other` property.
        if (!other.properties.hasOwnProperty(key)) return false

        // Check assignability between `properties`.
        if (!type.isAssignable(other.properties[key])) return false
      }
    }

    return true
  }

  getProperty(key: string): AnyType | UnknownType {
    if (this.properties && this.properties.hasOwnProperty(key)) {
      return this.properties[key]
    }

    return new AnyType()
  }

  static fromJSON(data: any) {
    const properties = Object.entries(data.properties || {}).reduce<
      Record<string, AnyType>
    >((obj, [key, value]) => {
      obj[key] = schemaFromJSON(value)
      return obj
    }, {})

    return new ObjectType(properties)
  }
}

export class DateType extends AnyType {
  isAssignable(other: AnyType): other is DateType {
    return other instanceof DateType
  }

  static fromJSON(data: any) {
    return new DateType()
  }
}

export class DateTimeType extends DateType {
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
  properties?: {
    [key: string]: TypeSchema
  }
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
