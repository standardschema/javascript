import { Any, AnyOptions } from './any'
import { TestFn, wrapIsType } from '../utils'

export interface LiteralOptions extends AnyOptions {
  value: any
}

export class Literal extends Any implements LiteralOptions {

  type = 'Literal'
  value: any

  constructor (options: LiteralOptions) {
    super(options)

    this.value = options.value

    this._tests.push(toValueTest(this.value))
  }

  _isType (value: any) {
    return wrapIsType(this, value, super._isType, (value) => {
      return value === this.value
    })
  }

}

function toValueTest (validValue: any): TestFn<any> {
  return function isString (value, path, context, next) {
    if (value !== validValue) {
      throw context.error(path, 'Literal', 'value', validValue, value)
    }

    return next(value)
  }
}
