import { prop } from 'functools'
import { zip, map } from 'iterative'

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
  constructor(public items: T) {
    super()
  }

  isAssignable(other: AnyType): other is ListType<T> {
    if (!(other instanceof ListType)) return false

    return this.items.isAssignable(other.items)
  }

  getProperty(key: string) {
    return this.items // TODO: Enable out-of-bounds indexes with min/max items.
  }

  static fromJSON(data: any) {
    return new ListType(fromJSON(data.items))
  }
}

export class PropertyType<V extends AnyType> extends UnknownType {
  constructor(public key: string, public value: V, public required: boolean) {
    super()
  }

  isAssignable(other: AnyType): other is PropertyType<V> {
    if (!(other instanceof PropertyType)) return false
    if (this.key !== other.key) return false
    if (this.required && !other.required) return false
    return this.value.isAssignable(other.value)
  }

  static fromJSON(data: any) {
    return new PropertyType(
      String(data.key),
      fromJSON(data.value),
      !!data.required
    )
  }
}

export class ObjectType extends AnyType {
  properties: Map<string, PropertyType<AnyType>>

  constructor(properties: Array<PropertyType<AnyType>>) {
    super()

    this.properties = new Map(zip(map(properties, prop('key')), properties))
  }

  isAssignable(other: AnyType): other is ObjectType {
    if (!(other instanceof ObjectType)) return false

    for (const property of this.properties.values()) {
      const otherProperty = other.properties.get(property.key)

      // Handle missing `other` property.
      if (!otherProperty) {
        if (!property.required) continue

        return false
      }

      // Check matching properties are assignable.
      if (!property.isAssignable(otherProperty)) return false
    }

    return true
  }

  getProperty(key: string): PropertyType<AnyType> | UnknownType {
    const property = this.properties.get(key)
    if (property) return property
    return super.getProperty(key)
  }

  static fromJSON(data: any) {
    return new ObjectType(data.properties.map(fromJSON))
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

export const NATIVE_TYPES = {
  Any: AnyType,
  Null: NullType,
  Unknown: UnknownType,
  Boolean: BooleanType,
  String: StringType,
  Number: NumberType,
  Integer: IntegerType,
  Float: FloatType,
  List: ListType,
  Property: PropertyType,
  Object: ObjectType,
  Date: DateType,
  DateTime: DateTimeType
}

/**
 * Generic the model from a JSON object.
 */
export function fromJSON(obj: any): AnyType {
  if (!Array.isArray(obj)) {
    const type: keyof typeof NATIVE_TYPES = obj['@type']

    if (!NATIVE_TYPES.hasOwnProperty(type)) {
      throw new TypeError(`Unknown type "${type}"`)
    }

    return NATIVE_TYPES[type].fromJSON(obj)
  }

  throw new TypeError(`Unknown JSON "${obj}"`)
}
