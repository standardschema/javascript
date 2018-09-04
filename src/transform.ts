import { AnyType, schemaFromJSON, ObjectType, PropertyType } from './schema'
import { reduce, map, zip } from 'iterative'
import { invoke } from 'functools';

interface Transform {
  transformType(input: AnyType): AnyType
  transformData(input: any): any
  toJSON(): object
}

class ComposeTransform implements Transform {
  static input = schemaFromJSON({ '@type': 'Any' })

  constructor (public transforms: Transform[]) {}

  transformType(input: AnyType) {
    return this.transforms.reduce((input, transform) => transform.transformType(input), input)
  }

  transformData(input: any) {
    return this.transforms.reduce((input, transform) => transform.transformData(input), input)
  }

  toJSON() {
    return { '@type': 'Compose', transforms: this.transforms.map(invoke('toJSON')) }
  }

  static fromJSON(data: any) {
    return new ComposeTransform(data.transforms.map(transformFromJSON))
  }
}

class SelectTransform implements Transform {
  static input = schemaFromJSON({ '@type': 'Any' })

  constructor (public key: string) {}

  transformType(input: AnyType) {
    return input.getProperty(this.key)
  }

  transformData(input: any) {
    return input[this.key]
  }

  toJSON() {
    return { '@type': 'Select', key: this.key }
  }

  static fromJSON(data: any) {
    return new SelectTransform(data.key)
  }
}

class ConstantTransform implements Transform {
  static input = schemaFromJSON({ '@type': 'Any' })

  constructor(public value: any) {}

  transformType(input: AnyType) {
    return schemaFromJSON({ '@type': 'String' })
  }

  transformData(input: any) {
    return this.value
  }

  toJSON() {
    return { '@type': 'Constant', value: this.value }
  }

  static fromJSON(data: any) {
    return new ConstantTransform(data.value)
  }
}

class LookupTransform implements Transform {
  static input = schemaFromJSON({ '@type': 'String' })

  constructor (public mapping: Map<string, string>) {}

  transformType(input: AnyType) {
    // TODO: Support literal strings and unions.
    return input
  }

  transformData(input: string) {
    return this.mapping.get(input)
  }

  toJSON() {
    return {
      '@type': 'Lookup',
      mapping: reduce(this.mapping.entries(), (obj, [key, value]) => {
        obj[key] = value
        return obj
      }, Object.create(null))
    }
  }

  static fromJSON(data: any) {
    return new LookupTransform(new Map(Object.entries(data.mapping)))
  }
}

class ObjectTransform implements Transform {
  static input = schemaFromJSON({ '@type': 'Any' })

  constructor (public properties: Map<string, Transform>) {}

  transformType(input: AnyType) {
    return new ObjectType(Array.from(zip(
      this.properties.keys(),
      map(this.properties.values(), invoke('transformType', input))
    ), ([key, value]) => new PropertyType(key, value, false)))
  }

  transformData(input: any) {
    return reduce(this.properties.entries(), (obj, [key, transform]) => {
      obj[key] = transform.transformType(obj)
      return obj
    }, Object.create(null))
  }

  toJSON() {
    return {
      '@type': 'Object',
      properties: reduce(this.properties.entries(), (obj, [key, transform]) => {
        obj[key] = transform.toJSON()
        return obj
      }, Object.create(null))
    }
  }

  static fromJSON(data: any) {
    return new ObjectTransform(new Map(zip(Object.keys(data.properties), map(Object.values(data.properties), transformFromJSON))))
  }
}

class ContainsTransform implements Transform {
  static input = schemaFromJSON({ '@type': 'List', items: { '@type': 'Any' } })

  constructor(public value: any) {}

  transformType(input: AnyType) {
    return schemaFromJSON({ '@type': 'Boolean' })
  }

  transformData(input: any[]) {
    return input.indexOf(this.value) > -1
  }

  toJSON() {
    return { '@type': 'Contains', value: this.value }
  }

  static fromJSON(data: any) {
    return new ContainsTransform(data.value)
  }
}

class DateTimeToDateTransform implements Transform {
  static input = schemaFromJSON({ '@type': 'DateTime' })

  transformType(input: AnyType) {
    return schemaFromJSON({ '@type': 'Date' })
  }

  transformData(input: Date) {
    return new Date(input.getFullYear(), input.getMonth(), input.getDate())
  }

  toJSON() {
    return { '@type': 'DateTimeToDate' }
  }

  static fromJSON(data: any) {
    return new DateTimeToDateTransform()
  }
}

class IntegerToStringTransform implements Transform {
  static input = schemaFromJSON({ '@type': 'Integer' })

  transformType(input: AnyType) {
    return schemaFromJSON({ '@type': 'String' })
  }

  transformData(input: number) {
    return String(input)
  }

  toJSON() {
    return { '@type': 'IntegerToString' }
  }

  static fromJSON(data: any) {
    return new IntegerToStringTransform()
  }
}

class FloatToIntegerTransform implements Transform {
  static input = schemaFromJSON({ '@type': 'Float' })

  transformType(input: AnyType) {
    return schemaFromJSON({ '@type': 'Integer' })
  }

  transformData(input: number) {
    return input | 0
  }

  toJSON() {
    return { '@type': 'FloatToInteger' }
  }

  static fromJSON(data: any) {
    return new FloatToIntegerTransform()
  }
}

class FloatToStringTransform implements Transform {
  static input = schemaFromJSON({ '@type': 'Float' })

  transformType(input: AnyType) {
    return schemaFromJSON({ '@type': 'String' })
  }

  transformData(input: number) {
    return String(input)
  }

  toJSON() {
    return { '@type': 'FloatToString' }
  }

  static fromJSON(data: any) {
    return new FloatToStringTransform()
  }
}

class SizeOfTransform implements Transform {
  static input = schemaFromJSON({ '@type': 'Array' })

  transformType(input: AnyType) {
    return schemaFromJSON({ '@type': 'Integer' })
  }

  transformData(input: any[]) {
    return input.length
  }

  toJSON() {
    return { '@type': 'SizeOf' }
  }

  static fromJSON(data: any) {
    return new SizeOfTransform()
  }
}

export const TRANSFORMS = {
  Compose: ComposeTransform,
  Select: SelectTransform
}

export function transformFromJSON (obj: any): Transform {
  if (Array.isArray(obj)) {
    return TRANSFORMS['Compose'].fromJSON({ transforms: obj })
  }

  if (typeof obj === 'object' && obj !== null) {
    const type: keyof typeof TRANSFORMS = obj['@type']
    if (!TRANSFORMS.hasOwnProperty(type)) {
      throw new TypeError(`Unknown transform "${type}"`)
    }
    return TRANSFORMS[type].fromJSON(obj)
  }

  throw new TypeError(`Unknown JSON "${obj}"`)
}
