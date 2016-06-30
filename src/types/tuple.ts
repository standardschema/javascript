import assert = require('assert')
import { Rule } from './rule'
import { Any, AnyOptions } from './any'
import { Intersection } from './intersection'
import { promiseEvery } from '../support/promises'
import { TestFn, identity, wrapIsType, Context } from '../utils'

export interface TupleOptions extends AnyOptions {
  tuple: Rule[]
}

export class Tuple extends Any implements TupleOptions {

  type = 'Tuple'
  tuple: Rule[]

  constructor (options: TupleOptions) {
    super(options)

    assert.ok(Array.isArray(options.tuple), 'Expected "tuple" to be a list of types')

    this.tuple = options.tuple

    this._tests.push(toTupleTest(options.tuple))
  }

  _isType (value: any, path: string[], context: Context) {
    return wrapIsType(this, value, path, context, super._isType, (value) => {
      if (value.length === this.tuple.length) {
        let res = 1

        for (let i = 0; i < this.tuple.length; i++) {
          res += this.tuple[i]._isType(value[i], path.concat(String(i)), context)
        }

        return res
      }

      throw context.error(path, 'Tuple', 'tuple', this.tuple.length, value)
    })
  }

  _extend (options: TupleOptions): TupleOptions {
    const res = super._extend(options) as TupleOptions

    if (options.tuple) {
      const len = Math.max(this.tuple.length, options.tuple.length)

      res.tuple = new Array(len)

      for (let i = 0; i < len; i++) {
        res.tuple[i] = Intersection.intersect(this.tuple[i], options.tuple[i])
      }
    }

    return res
  }

  toJSON () {
    const json = super.toJSON()
    json.tuple = this.tuple.map(x => x.toJSON())
    return json
  }

}

function toTupleTest (tuple: Rule[]): TestFn<any[]> {
  const tests = tuple.map(type => type._compile())

  return function (values, path, context, next) {
    return promiseEvery(tests.map(function (test, index) {
      return function () {
        const value = values[index]
        const valuePath = path.concat(String(index))

        return test(value, valuePath, context, identity)
      }
    })).then(res => next(res))
  }
}
