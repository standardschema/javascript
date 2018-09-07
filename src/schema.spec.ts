import { compileSchemaCheck, Schema, TYPES } from './schema'

describe('schema check', () => {
  describe('Any', () => {
    it('should validate schema', () => {
      const schemaCheck = compileSchemaCheck({ '@type': 'Any' })

      expect(schemaCheck({ '@type': 'Any' })).toEqual(true)
      expect(schemaCheck({ '@type': 'Unknown' })).toEqual(true)
      expect(schemaCheck({ '@type': 'Null' })).toEqual(true)
      expect(schemaCheck({ '@type': 'String' })).toEqual(true)
      expect(schemaCheck({ '@type': 'Integer' })).toEqual(true)
      expect(schemaCheck({ '@type': 'Float' })).toEqual(true)
      expect(schemaCheck({ '@type': 'Object' })).toEqual(true)
    })
  })

  describe('Unknown', () => {
    it('should validate schema', () => {
      const schemaCheck = compileSchemaCheck({ '@type': 'Unknown' })

      expect(schemaCheck({ '@type': 'Unknown' })).toEqual(true)
      expect(schemaCheck({ '@type': 'Any' })).toEqual(false)
      expect(schemaCheck({ '@type': 'String' })).toEqual(false)
      expect(schemaCheck({ '@type': 'Null' })).toEqual(false)
    })
  })

  describe('Null', () => {
    it('should validate schema', () => {
      const schemaCheck = compileSchemaCheck({ '@type': 'Null' })

      expect(schemaCheck({ '@type': 'Null' })).toEqual(true)
      expect(schemaCheck({ '@type': 'Any' })).toEqual(false)
      expect(schemaCheck({ '@type': 'String' })).toEqual(false)
      expect(schemaCheck({ '@type': 'Integer' })).toEqual(false)
    })
  })

  describe('Integer', () => {
    it('should validate schema', () => {
      const schemaCheck = compileSchemaCheck({ '@type': 'Integer' })

      expect(schemaCheck({ '@type': 'Integer' })).toEqual(true)
      expect(schemaCheck({ '@type': 'Any' })).toEqual(false)
      expect(schemaCheck({ '@type': 'String' })).toEqual(false)
    })
  })

  describe('Float', () => {
    it('should validate schema', () => {
      const schemaCheck = compileSchemaCheck({ '@type': 'Float' })

      expect(schemaCheck({ '@type': 'Float' })).toEqual(true)
      expect(schemaCheck({ '@type': 'Any' })).toEqual(false)
      expect(schemaCheck({ '@type': 'String' })).toEqual(false)
      expect(schemaCheck({ '@type': 'Integer' })).toEqual(false)
    })
  })

  describe('List', () => {
    it('should validate schema', () => {
      const schemaCheck = compileSchemaCheck({ '@type': 'List' })

      expect(schemaCheck({ '@type': 'Integer' })).toEqual(false)
      expect(schemaCheck({ '@type': 'List' })).toEqual(true)
    })

    it('should validate schema with items', () => {
      const schemaCheck = compileSchemaCheck({
        '@type': 'List',
        items: { '@type': 'String' }
      })

      expect(schemaCheck({ '@type': 'List' })).toEqual(false)
      expect(
        schemaCheck({ '@type': 'List', items: { '@type': 'Float' } })
      ).toEqual(false)
      expect(
        schemaCheck({ '@type': 'List', items: { '@type': 'String' } })
      ).toEqual(true)
    })
  })

  describe('Object', () => {
    it('should validate schema', () => {
      const schemaCheck = compileSchemaCheck({
        '@type': 'Object',
        properties: {
          foo: { '@type': 'Float' }
        }
      })

      expect(schemaCheck({ '@type': 'Object' })).toEqual(false)
      expect(
        schemaCheck({
          '@type': 'Object',
          properties: { foo: { '@type': 'Float' } }
        })
      ).toEqual(true)
      expect(
        schemaCheck({
          '@type': 'Object',
          properties: { foo: { '@type': 'String' } }
        })
      ).toEqual(false)
      expect(
        schemaCheck({
          '@type': 'Object',
          properties: { bar: { '@type': 'Float' } }
        })
      ).toEqual(false)
    })

    it('should validate schema with nested objects', () => {
      const nestedObjectSchema: Schema = {
        '@type': 'Object',
        properties: {
          property: {
            '@type': 'Object',
            properties: {
              property: {
                '@type': 'List',
                items: {
                  '@type': 'Object',
                  properties: {
                    property: {
                      '@type': 'String'
                    }
                  }
                }
              }
            }
          }
        }
      }

      const schemaCheck = compileSchemaCheck(nestedObjectSchema)

      expect(schemaCheck(nestedObjectSchema)).toEqual(true)
      expect(schemaCheck({ '@type': 'Object' })).toEqual(false)
      expect(
        schemaCheck({
          '@type': 'Object',
          properties: { property: { '@type': 'String' } }
        })
      ).toEqual(false)
    })
  })
})
