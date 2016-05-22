import { String, StringOptions } from './string'

export interface KeyOptions extends StringOptions {
  table: string
}

export class Key extends String {

  type = 'key'
  table: string

  constructor (options: KeyOptions) {
    super(options)

    this.table = options.table
  }

}
