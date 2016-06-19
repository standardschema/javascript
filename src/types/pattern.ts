import { String, StringOptions } from './string'
import { TestFn, wrapIsType } from '../utils'

export interface PatternOptions extends StringOptions {
  pattern: string
}

export class Pattern extends String implements PatternOptions {

  type = 'Email'
  pattern: string

  _regexp: RegExp

  constructor (options: PatternOptions) {
    super(options)

    this.pattern = options.pattern
    this._regexp = new RegExp(this.pattern)

    this._tests.push(toPatternTest(this.pattern, this._regexp))
  }

  _isType (value: any) {
    return wrapIsType(this, value, super._isType, (value) => {
      return this._regexp.test(value) ? 1 : 0
    })
  }

}

function toPatternTest (pattern: string, re: RegExp): TestFn<string> {
  return function (value, path, context, next) {
    if (!re.test(value)) {
      throw context.error(path, 'Pattern', 'pattern', pattern, value)
    }

    return next(value)
  }
}
