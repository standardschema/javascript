import { Any, AnyOptions } from './any'
import { skipEmpty, Context } from '../utils'

export interface AcceptedOptions extends AnyOptions {
  accept: any[]
}

export class Accepted extends Any {

  type = 'accepted'
  accept: any[]

  constructor (options: AcceptedOptions) {
    super(options)

    if (options.accept != null) {
      this.accept = options.accept
    }

    this._tests.push(skipEmpty(toAcceptTest(this.accept)))
  }

}

function toAcceptTest (accept: any[]) {
  return function (value: any, path: string[], context: Context) {
    if (accept.indexOf(value) === -1) {
      throw context.error(path, 'accept', accept, value)
    }

    return value
  }
}
