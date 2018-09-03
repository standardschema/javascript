import { prop, invoke } from 'functools'
import { zip, map } from 'iterative'

export class AnyType {
  isAssignable(other: AnyType): other is AnyType {
    return other instanceof AnyType
  }

  getProperty(key: string) {
    return new UnknownType()
  }

  toJSON () {
    return { '@type': 'Any' }
  }

  static fromJSON(data: any) {
    return new AnyType()
  }
}

export class UnknownType extends AnyType {
  isAssignable(other: AnyType): other is UnknownType {
    return other instanceof UnknownType
  }

  toJSON () {
    return { '@type': 'Unknown' }
  }

  static fromJSON(data: any) {
    return new UnknownType()
  }
}

export class NullType extends AnyType {
  isAssignable(other: AnyType): other is NullType {
    return other instanceof NullType
  }

  toJSON () {
    return { '@type': 'Null' }
  }

  static fromJSON(data: any) {
    return new NullType()
  }
}

export class BooleanType extends AnyType {
  isAssignable(other: AnyType): other is BooleanType {
    return other instanceof BooleanType
  }

  toJSON () {
    return { '@type': 'Boolean' }
  }

  static fromJSON(data: any) {
    return new BooleanType()
  }
}

export class StringType extends AnyType {
  isAssignable(other: AnyType): other is StringType {
    return other instanceof StringType
  }

  toJSON () {
    return { '@type': 'String' }
  }

  static fromJSON(data: any) {
    return new StringType()
  }
}

export class NumberType extends AnyType {
  isAssignable(other: AnyType): other is NumberType {
    return other instanceof NumberType
  }

  toJSON () {
    return { '@type': 'Number' }
  }

  static fromJSON(data: any) {
    return new NumberType()
  }
}

export class IntegerType extends NumberType {
  isAssignable(other: AnyType): other is IntegerType {
    return other instanceof IntegerType
  }

  toJSON () {
    return { '@type': 'Integer' }
  }

  static fromJSON(data: any) {
    return new IntegerType()
  }
}

export class FloatType extends NumberType {
  isAssignable(other: AnyType): other is FloatType {
    return other instanceof FloatType
  }

  toJSON () {
    return { '@type': 'Float' }
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

  toJSON () {
    return { '@type': 'List', items: this.items.toJSON() }
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

  toJSON () {
    return {
      '@type': 'Property',
      key: this.key,
      value: this.value.toJSON(),
      required: this.required
    }
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

  toJSON() {
    return {
      '@type': 'Object',
      properties: Array.from(map(this.properties.values(), invoke('toJSON')))
    }
  }

  static fromJSON(data: any) {
    return new ObjectType(data.properties.map(fromJSON))
  }
}

export class DateType extends AnyType {
  isAssignable(other: AnyType): other is DateType {
    return other instanceof DateType
  }

  toJSON() {
    return { '@type': 'Date' }
  }

  static fromJSON(data: any) {
    return new DateType()
  }
}

export class DateTimeType extends DateType {
  isAssignable(other: AnyType): other is DateTimeType {
    return other instanceof DateTimeType
  }

  toJSON() {
    return { '@type': 'DateTime' }
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
