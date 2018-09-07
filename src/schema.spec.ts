import {
  AnyType,
  StringType,
  IntegerType,
  schemaFromJSON,
  FloatType
} from './schema'

describe('schemaFromJSON', () => {
  it('should transform JSON to object model', () => {
    const type = schemaFromJSON({ '@type': 'Any' })

    expect(type).toBeInstanceOf(AnyType)
  })
})

describe('AnyType', () => {
  it('should create `Any` type', () => {
    const type = schemaFromJSON({ '@type': 'Any' })

    expect(type).toBeInstanceOf(AnyType)
    expect(type.isAssignable(new IntegerType())).toEqual(true)
    expect(new StringType().isAssignable(type)).toEqual(false)
  })
})

describe('IntegerType', () => {
  it('should create `Integer` type', () => {
    const type = schemaFromJSON({ '@type': 'Integer' })

    expect(type).toBeInstanceOf(IntegerType)
    expect(type.isAssignable(new StringType())).toEqual(false)
    expect(new StringType().isAssignable(type)).toEqual(false)
  })
})

describe('ListType', () => {
  it('should create `List` type', () => {
    const typeWithAny = schemaFromJSON({
      '@type': 'List',
      items: { '@type': 'Any' }
    })

    const typeWithString = schemaFromJSON({
      '@type': 'List',
      items: { '@type': 'String' }
    })

    expect(new AnyType().isAssignable(typeWithAny)).toEqual(true)
    expect(new AnyType().isAssignable(typeWithString)).toEqual(true)
    expect(new StringType().isAssignable(typeWithString)).toEqual(false)
    expect(typeWithAny.isAssignable(typeWithString)).toEqual(true)
    expect(typeWithString.isAssignable(typeWithAny)).toEqual(false)
    expect(typeWithAny.isAssignable(new StringType())).toEqual(false)
  })
})

describe('ObjectType', () => {
  it('should create `Object` type', () => {
    const typeWithFoo = schemaFromJSON({
      '@type': 'Object',
      properties: {
        foo: { '@type': 'Float' }
      }
    })

    const typeWithBar = schemaFromJSON({
      '@type': 'Object',
      properties: {
        bar: { '@type': 'String' }
      }
    })

    expect(typeWithFoo.isAssignable(new FloatType())).toEqual(false)
    expect(new FloatType().isAssignable(typeWithFoo)).toEqual(false)
    expect(typeWithFoo.isAssignable(typeWithBar)).toEqual(false)
    expect(typeWithBar.isAssignable(typeWithFoo)).toEqual(false)
  })
})
