import { Any, AnyOptions } from './any'
import { Rule } from './rule'
import { promiseEvery } from '../support/promises'
import { TestFn, identity, wrapIsType, extendSchema, merge, Context } from '../utils'

export interface IntersectionOptions extends AnyOptions {
  types: Rule[]
}

export class Intersection extends Any implements IntersectionOptions {

  type = 'Intersection'
  types: Rule[]
  _types: Rule[]

  constructor (options: IntersectionOptions) {
    super(options)

    this.types = options.types
    this._types = Intersection.flatten(this.types)

    this._tests.push(toIntersectionTest(this._types))
  }

  /**
   * Merge multiple schemas together.
   */
  static flatten (schemas: Rule[]): Rule[] {
    return schemas
      .reduce(
        function (result, schema) {
          if (schema) {
            for (let i = 0; i < result.length; i++) {
              const cur = result[i]

              if (cur._typeOf(schema)) {
                result[i] = extendSchema(schema, cur)
                return result
              }

              if (schema._typeOf(cur)) {
                result[i] = extendSchema(cur, schema)
                return result
              }
            }

            result.push(schema)
          }

          return result
        },
        [] as Rule[]
      )
  }

  /**
   * Intersection schemas together.
   */
  static intersect (...schemas: Rule[]): Rule {
    const types = Intersection.flatten(schemas)

    return types.length > 1 ? new Intersection({ types }) : types[0]
  }

  _isType (value: any, path: string[], context: Context) {
    return wrapIsType(this, value, path, context, super._isType, (value, path, context) => {
      let res = 0

      for (const type of this._types) {
        res += type._isType(value, path, context)
      }

      return res
    })
  }

  _extend (options: any) {
    const res = super._extend(options) as IntersectionOptions

    if (options.types) {
      res.types = this.types.concat(options.types)
    }

    return res
  }

  toJSON () {
    const json = super.toJSON()
    json.types = this.types.map(x => x.toJSON())
    delete json._types
    return json
    }

}

/**
 * Run all validation types.
 */
function toIntersectionTest (types: Rule[]): TestFn<any> {
  const tests = types.map(type => type._compile())

  return function (value, path, context, next) {
    const result = promiseEvery(tests.map((test) => {
      return function () {
        return test(value, path, context, identity)
          .then(result => {
            // Merge each result with the original value for subsequent tests.
            value = merge(value, result)

            return result
          })
      }
    }))

    return result.then(values => merge(...values)).then(res => next(res))
  }
}
