import { schemaFromJSON, StringType, UnknownType } from './schema'
import { transformFromJSON } from './transform'

describe('Select', () => {
  const schema = schemaFromJSON({ '@type': 'Object', properties: { foo: { '@type': 'String' }}})

  it('should select property type', () => {
    const transform = transformFromJSON({ '@type': 'Select', key: 'foo' })

    expect(transform.transformType(schema)).toBeInstanceOf(StringType)
  })

  it('should return unknown with missing property type', () => {
    const transform = transformFromJSON({ '@type': 'Select', key: 'bar' })

    expect(transform.transformType(schema)).toBeInstanceOf(UnknownType)
  })
})
