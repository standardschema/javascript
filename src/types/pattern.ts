import { String, StringOptions } from './string'
import { TestFn, wrapIsType, Context } from '../utils'

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

  _isType (value: any, path: string[], context: Context) {
    return wrapIsType(this, value, path, context, super._isType, (value) => {
      if (this._regexp.test(value)) {
        return 1
      }

      throw context.error(path, 'Pattern', 'pattern', this.pattern, value)
    })
  }

  _extend (options: PatternOptions): PatternOptions {
    const res = super._extend(options) as PatternOptions
    delete (res as this)._regexp
    return res
  }

  toJSON () {
    const json = super.toJSON()
    delete json._regexp
    return json
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
