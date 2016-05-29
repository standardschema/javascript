import { Any, AnyOptions } from './any'
import { skipEmpty, Context } from '../utils'

export interface BlacklistOptions extends AnyOptions {
  blacklist: any[]
}

export class Blacklist extends Any {

  type = 'Blacklist'
  blacklist: any[]

  constructor (options: BlacklistOptions) {
    super(options)

    if (options.blacklist != null) {
      this.blacklist = options.blacklist
    }

    this._tests.push(skipEmpty(toBlacklistTest(this.blacklist)))
  }

  _isType (value: any) {
    return this.blacklist.indexOf(value) === -1
  }

}

function toBlacklistTest (reject: any[]) {
  return function (value: any, path: string[], context: Context) {
    if (reject.indexOf(value) > -1) {
      throw context.error(path, 'blacklist', reject, value)
    }

    return value
  }
}
