import {
  AnyType,
  schemaFromJSON,
  ObjectType,
  UnknownType,
  StringType,
  BooleanType,
  NullType,
  NumberType,
  IntegerType,
  FloatType,
  ListType,
  DateType,
  DateTimeType,
  DecimalType
} from './schema'

function createDate(time: number) {
  const date = new Date(time)
  date.setHours(0)
  date.setMinutes(0)
  date.setSeconds(0)
  date.setMilliseconds(0)
  return date
}

export class IdentityTransform {
  static inputSchema = schemaFromJSON({ '@type': 'Any' })

  constructor(public description: string, public comment: string) {}

  transformType(input: AnyType): AnyType {
    return input
  }

  transformData(input: any): any {
    return input
  }

  static fromJSON(data: any) {
    return new IdentityTransform(data.description, data.comment)
  }
}

export class ComposeTransform extends IdentityTransform {
  static inputSchema = schemaFromJSON({ '@type': 'Any' })

  constructor(
    public transforms: IdentityTransform[],
    description: string,
    comment: string
  ) {
    super(description, comment)
  }

  transformType(input: AnyType) {
    return this.transforms.reduce(
      (input, transform) => transform.transformType(input),
      input
    )
  }

  transformData(input: any) {
    return this.transforms.reduce(
      (input, transform) => transform.transformData(input),
      input
    )
  }

  static fromJSON(data: any) {
    const transforms = data.transforms.map(transformFromJSON)

    return new ComposeTransform(transforms, data.description, data.comment)
  }
}

export class SelectTransform extends IdentityTransform {
  static inputSchema = schemaFromJSON({ '@type': 'Object' })

  constructor(public key: string, description: string, comment: string) {
    super(description, comment)
  }

  transformType(input: AnyType) {
    return input.getProperty(this.key)
  }

  transformData(input: any) {
    return input[this.key]
  }

  static fromJSON(data: any) {
    return new SelectTransform(data.key, data.description, data.comment)
  }
}

export class ConstantTransform extends IdentityTransform {
  static inputSchema = schemaFromJSON({ '@type': 'Any' })

  constructor(public value: any, description: string, comment: string) {
    super(description, comment)
  }

  transformType(input: AnyType) {
    return schemaFromJSON({ '@type': 'String' })
  }

  transformData(input: any) {
    return this.value
  }

  static fromJSON(data: any) {
    return new ConstantTransform(data.value, data.description, data.comment)
  }
}

export class LookupTransform extends IdentityTransform {
  static inputSchema = schemaFromJSON({ '@type': 'String' })

  constructor(
    public mapping: Record<string, string>,
    description: string,
    comment: string
  ) {
    super(description, comment)
  }

  transformType(input: AnyType) {
    // TODO: Support literal strings and unions.
    return new StringType()
  }

  transformData(input: string) {
    return this.mapping.hasOwnProperty(input) ? this.mapping[input] : null
  }

  static fromJSON(data: any) {
    return new LookupTransform(data.mapping, data.description, data.comment)
  }
}

export class ObjectTransform extends IdentityTransform {
  static inputSchema = schemaFromJSON({ '@type': 'Any' })

  constructor(
    public properties: Record<string, IdentityTransform>,
    description: string,
    comment: string
  ) {
    super(description, comment)
  }

  transformType(input: AnyType) {
    return new ObjectType(
      new Map(
        Object.entries(this.properties).map(
          ([key, transform]): [string, AnyType] => [
            key,
            transform.transformType(input)
          ]
        )
      ),
      new Map()
    )
  }

  transformData(input: any) {
    return Object.entries(this.properties).reduce<Record<string, any>>(
      (obj, [key, transform]) => {
        obj[key] = transform.transformData(input)
        return obj
      },
      {}
    )
  }

  static fromJSON(data: any) {
    const properties = Object.entries(data.properties).reduce<
      Record<string, IdentityTransform>
    >((obj, [key, value]) => {
      obj[key] = transformFromJSON(value)
      return obj
    }, {})

    return new ObjectTransform(properties, data.description, data.comment)
  }
}

export class ContainsTransform extends IdentityTransform {
  static inputSchema = schemaFromJSON({
    '@type': 'List',
    items: { '@type': 'Any' }
  })

  constructor(public value: any, description: string, comment: string) {
    super(description, comment)
  }

  transformType(input: AnyType) {
    return new BooleanType()
  }

  transformData(input: any[]) {
    return input.indexOf(this.value) > -1
  }

  static fromJSON(data: any) {
    return new ContainsTransform(data.value, data.description, data.comment)
  }
}

export class CoerceTransform extends IdentityTransform {
  static inputSchema = schemaFromJSON({ '@type': 'Any' })

  constructor(public type: string, description: string, comment: string) {
    super(description, comment)
  }

  transformType(input: AnyType) {
    if (this.type === 'Null') return new NullType()
    if (this.type === 'Boolean') return new BooleanType()
    if (this.type === 'String') return new StringType()
    if (this.type === 'Number') return new NumberType()
    if (this.type === 'Integer') return new IntegerType()
    if (this.type === 'Float') return new FloatType()
    if (this.type === 'Decimal') return new DecimalType()
    if (this.type === 'List') return new ListType(new AnyType())
    if (this.type === 'Object') return new ObjectType(new Map(), new Map())
    if (this.type === 'Date') return new DateType()
    if (this.type === 'DateTime') return new DateTimeType()

    return new UnknownType()
  }

  transformData(input: any) {
    if (this.type === 'Null') return null

    if (this.type === 'Boolean') {
      if (typeof input === 'boolean') return input
      if (input === '' || input === 0) return false
      return true
    }

    if (this.type === 'String') {
      if (typeof input === 'string') return input
      if (input instanceof Date) return input.toISOString()
      if (typeof input === 'number') return String(input)

      return ''
    }

    if (
      this.type === 'Number' ||
      this.type === 'Integer' ||
      this.type === 'Float' ||
      this.type === 'Decimal'
    ) {
      if (input instanceof Date) {
        if (this.type === 'Integer') return ~~(input.getTime() / 1000)
        return input.getTime() / 1000
      }

      if (typeof input === 'string') {
        if (this.type === 'Integer') return ~~Number(input)
        return Number(input) || 0
      }

      if (typeof input === 'number') return input
      if (typeof input === 'boolean') return Number(input)

      return 0
    }

    if (this.type === 'List') {
      if (Array.isArray(input)) return Array.from(input)

      if (
        typeof input === 'boolean' ||
        typeof input === 'string' ||
        typeof input === 'number'
      ) {
        return [input]
      }

      return []
    }

    if (this.type === 'Object') {
      if (
        input !== null &&
        typeof input === 'object' &&
        !Array.isArray(input)
      ) {
        return input
      }

      return {}
    }

    if (this.type === 'Date') {
      if (typeof input === 'string') return createDate(Date.parse(input) || 0)
      if (typeof input === 'number') return createDate(input * 1000)

      if (input instanceof Date) {
        return new Date(input.getFullYear(), input.getMonth(), input.getDate())
      }

      return new Date(0)
    }

    if (this.type === 'DateTime') {
      if (typeof input === 'string') return new Date(Date.parse(input) || 0)
      if (typeof input === 'number') return new Date(input * 1000)
      if (input instanceof Date) return new Date(input.getTime())

      return new Date(0)
    }

    return null
  }

  static fromJSON(data: any) {
    return new CoerceTransform(data.type, data.description, data.comment)
  }
}

export class SizeOfTransform extends IdentityTransform {
  static inputSchema = schemaFromJSON({ '@type': 'List' })

  transformType(input: AnyType) {
    return new IntegerType()
  }

  transformData(input: any[]) {
    return input.length
  }

  static fromJSON(data: any) {
    return new SizeOfTransform(data.description, data.comment)
  }
}

export class CompareTransform extends IdentityTransform {
  static inputSchema = schemaFromJSON({ '@type': 'Number' })

  constructor(
    public operator: string,
    public value: number,
    description: string,
    comment: string
  ) {
    super(description, comment)
  }

  transformType(input: AnyType) {
    return new BooleanType()
  }

  transformData(input: number) {
    if (this.operator === 'gt') return input > this.value
    if (this.operator === 'lt') return input < this.value
    if (this.operator === 'eq') return input === this.value
    if (this.operator === 'ne') return input !== this.value

    throw new TypeError(`Operator not implemented: ${this.operator}`)
  }

  static fromJSON(data: any) {
    return new CompareTransform(
      data.operator,
      data.value,
      data.description,
      data.comment
    )
  }
}

export class ForEachTransform extends IdentityTransform {
  static inputSchema = schemaFromJSON({ '@type': 'List' })

  constructor(
    public transform: IdentityTransform,
    description: string,
    comment: string
  ) {
    super(description, comment)
  }

  transformType(input: AnyType) {
    return new ListType(this.transform.transformType(input))
  }

  transformData(input: any[]) {
    return input.map(x => this.transform.transformData(x))
  }

  static fromJSON(data: any) {
    return new ForEachTransform(transformFromJSON(data.transform), data.description, data.comment)
  }
}

export class FilterTransform extends IdentityTransform {
  static inputSchema = schemaFromJSON({ '@type': 'List' })

  constructor(
    public condition: IdentityTransform,
    description: string,
    comment: string
  ) {
    super(description, comment)
  }

  transformType(input: ListType<AnyType>) {
    return new ListType(input.items)
  }

  transformData(input: any[]) {
    return input.filter(x => this.condition.transformData(x))
  }

  static fromJSON(data: any) {
    return new FilterTransform(transformFromJSON(data.condition), data.description, data.comment)
  }
}

export class AnyTransform extends IdentityTransform {
  static inputSchema = schemaFromJSON({ '@type': 'List' })

  constructor(
    public condition: IdentityTransform,
    description: string,
    comment: string
  ) {
    super(description, comment)
  }

  transformType(input: ListType<AnyType>) {
    return new BooleanType()
  }

  transformData(input: any[]) {
    return input.some(x => this.condition.transformData(x))
  }

  static fromJSON(data: any) {
    return new AnyTransform(transformFromJSON(data.condition), data.description, data.comment)
  }
}

export class InTransform extends IdentityTransform {
  static inputSchema = schemaFromJSON({ '@type': 'Any' })

  constructor(public values: any[], description: string, comment: string) {
    super(description, comment)
  }

  transformType(input: ListType<AnyType>) {
    return new BooleanType()
  }

  transformData(input: any[]) {
    return this.values.indexOf(input) > -1
  }

  static fromJSON(data: any) {
    return new InTransform(data.values, data.description, data.comment)
  }
}

export class OrTransform extends IdentityTransform {
  static inputSchema = schemaFromJSON({ '@type': 'Any' })

  constructor(
    public selects: IdentityTransform[],
    description: string,
    comment: string
  ) {
    super(description, comment)
  }

  transformType(input: ListType<AnyType>) {
    return new BooleanType()
  }

  transformData(input: any[]) {
    return this.selects.some(condition => condition.transformData(input))
  }

  static fromJSON(data: any) {
    const selects = data.selects.map(transformFromJSON)

    return new OrTransform(selects, data.description, data.comment)
  }
}

export class NotTransform extends IdentityTransform {
  static inputSchema = schemaFromJSON({ '@type': 'Boolean' })

  transformType(input: BooleanType) {
    return new BooleanType()
  }

  transformData(input: boolean) {
    return !input
  }

  static fromJSON(data: any) {
    return new NotTransform(data.description, data.comment)
  }
}

export class UnknownTransform extends IdentityTransform {
  static inputSchema = schemaFromJSON({ '@type': 'Any' })

  transformType(input: AnyType): AnyType {
    return new UnknownType()
  }

  transformData(input: any): any {
    return undefined
  }

  static fromJSON(data: any) {
    return new IdentityTransform(data.description, data.comment)
  }
}

export class IfTransform extends IdentityTransform {
  static inputSchema = schemaFromJSON({ '@type': 'Any' })

  constructor(
    public condition: IdentityTransform,
    public then: IdentityTransform,
    public _else: IdentityTransform,
    description: string,
    comment: string
  ) {
    super(description, comment)
  }

  transformType(input: AnyType) {
    // TODO(blakeembrey): Union of then/else types.
    return input
  }

  transformData(input: any) {
    const result = this.condition.transformData(input)
    const transform = result ? this.then : this._else
    return transform.transformData(input)
  }

  static fromJSON(data: any) {
    return new IfTransform(
      transformFromJSON(data.condition),
      transformFromJSON(data.then || { '@type': 'Identity' }),
      transformFromJSON(data.else || { '@type': 'Identity' }),
      data.description,
      data.comment
    )
  }
}

export class MathTransform extends IdentityTransform {
  static inputSchema = schemaFromJSON({ '@type': 'Number' })

  constructor(
    public operator: string,
    public value: number,
    description: string,
    comment: string
  ) {
    super(description, comment)
  }

  transformType(input: NumberType) {
    return input
  }

  transformData(input: any) {
    if (this.operator === 'multiply') return input * this.value

    throw new TypeError(`Operator not implemented: ${this.operator}`)
  }

  static fromJSON(data: any) {
    return new MathTransform(
      data.operator,
      data.value,
      data.description,
      data.comment
    )
  }
}

export class ConcatTransform extends IdentityTransform {
  static inputSchema = schemaFromJSON({ '@type': 'Any' })

  constructor(
    public selects: IdentityTransform[],
    description: string,
    comment: string
  ) {
    super(description, comment)
  }

  transformType(input: NumberType) {
    // TODO(blakeembrey): Union of `selects` types.
    return new AnyType()
  }

  transformData(input: any) {
    return [].concat(...this.selects.map(select => select.transformData(input)))
  }

  static fromJSON(data: any) {
    const selects = data.selects.map(transformFromJSON)

    return new ConcatTransform(selects, data.description, data.comment)
  }
}

export class DedupeTransform extends IdentityTransform {
  static inputSchema = schemaFromJSON({ '@type': 'List' })

  transformType(input: ListType<AnyType>) {
    return input
  }

  transformData(input: any[]) {
    return input.filter((x, i, a) => a.indexOf(x) === i)
  }

  static fromJSON(data: any) {
    return new DedupeTransform(data.description, data.comment)
  }
}

export const TRANSFORMS = {
  Any: AnyTransform,
  Coerce: CoerceTransform,
  Compare: CompareTransform,
  Compose: ComposeTransform,
  Concat: ConcatTransform,
  Constant: ConstantTransform,
  Contains: ContainsTransform,
  Dedupe: DedupeTransform,
  Filter: FilterTransform,
  ForEach: ForEachTransform,
  Identity: IdentityTransform,
  If: IfTransform,
  In: InTransform,
  Lookup: LookupTransform,
  Math: MathTransform,
  Not: NotTransform,
  Object: ObjectTransform,
  Or: OrTransform,
  Select: SelectTransform,
  SizeOf: SizeOfTransform,
  Unknown: UnknownTransform
}

export type Transform = keyof typeof TRANSFORMS

/**
 * Flat representation of all possible transform configurations.
 */
export interface TransformSchema {
  // `Unknown`.
  '@id'?: string
  '@type'?: Transform
  description?: string
  comment?: string
  // `Math`, `Compare`.
  operator?: string
  // `Contains`, `Math`, `Compare`.
  value?: string | number | boolean | null
  values?: Array<string | number | boolean | null>
  // `Lookup`.
  mapping?: { [key: string]: string }
  // `Object`.
  properties?: { [key: string]: TransformSchema }
  // `ForEach`.
  transform?: TransformSchema
  // `Any`, `Filter`, `If`.
  condition?: TransformSchema
  // `If`.
  then?: TransformSchema
  else?: TransformSchema
  // `Or`, `Concat`.
  selects?: TransformSchema[]
}

/**
 * Create a transform instance from JSON.
 */
export function transformFromJSON(obj: any): IdentityTransform {
  if (Array.isArray(obj)) {
    return ComposeTransform.fromJSON({ transforms: obj })
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
