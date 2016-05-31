import { Any, AnyOptions } from './any'
import { skipEmpty, Context } from '../utils'

export interface WhitelistOptions extends AnyOptions {
  whitelist: any[]
}

export class Whitelist extends Any {

  type = 'Whitelist'
  whitelist: any[]

  constructor (options: WhitelistOptions) {
    super(options)

    if (options.whitelist != null) {
      this.whitelist = options.whitelist
    }

    this._tests.push(skipEmpty(toWhitelistTest(this.whitelist)))
  }

  _isType (value: any) {
    return this.whitelist.indexOf(value) > -1
  }

}

function toWhitelistTest (accept: any[]) {
  return function (value: any, path: string[], context: Context) {
    if (accept.indexOf(value) === -1) {
      throw context.error(path, 'whitelist', accept, value)
    }

    return value
  }
}
