import { Rule, RuleOptions } from './rule'
import { Context, NextFunction } from '../utils'

export interface OmitOptions extends RuleOptions {}

export class Omit extends Rule implements OmitOptions {

  type = 'Omit'

  constructor (options: OmitOptions = {}) {
    super(options)

    this._tests.push(omitTest)
  }

}

/**
 * Omit a value on the returned output.
 */
function omitTest (value: any, path: string[], context: Context, next: NextFunction<any>) {
  return next(value).then(() => undefined)
}
