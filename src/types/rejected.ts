import { Any, AnyOptions } from './any'
import { skipEmpty, Context } from '../utils'

export interface RejectedOptions extends AnyOptions {
  reject: any[]
}

export class Rejected extends Any {

  type = 'rejected'
  reject: any[]

  constructor (options: RejectedOptions) {
    super(options)

    if (options.reject != null) {
      this.reject = options.reject
    }

    this._tests.push(skipEmpty(toRejectTest(this.reject)))
  }

}

function toRejectTest (reject: any[]) {
  return function (value: any, path: string[], context: Context) {
    if (reject.indexOf(value) > -1) {
      throw context.error(path, 'reject', reject, value)
    }

    return value
  }
}
