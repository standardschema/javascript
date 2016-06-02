import Promise = require('any-promise')

import { Rule } from '../types/rule'
import { MultiError } from './error'

/**
 * Try all promises and collect any failures.
 */
export function promiseEvery <T> (fns: Array<() => Promise<T>>): Promise<T[]> {
  return new Promise((resolve, reject) => {
    let len = fns.length
    const errors: Error[] = []
    const results: Rule[] = new Array(len)

    // Exit with empty length.
    if (len === 0) {
      return resolve(results)
    }

    // Handle each completed promise.
    function done () {
      len--

      // Promises still remain unresolved.
      if (len > 0) {
        return
      }

      // Something errored.
      if (errors.length) {
        return reject(new MultiError(errors))
      }

      return resolve(results)
    }

    // Handle each of the function results.
    function handle (result: Promise<any>, index: number) {
      return Promise.resolve(result).then(
        function (result) {
          results[index] = result

          done()
        },
        function (error) {
          errors.push(error)

          done()
        }
      )
    }

    fns.forEach((fn, index) => handle(fn(), index))
  })
}

/**
 * Try and resolve any promise.
 */
export function promiseAny <T> (fns: Array<() => Promise<T>>): Promise<T> {
  return fns.reduce(
    function (result, next) {
      return result.catch(function (err) {
        return next()
      })
    },
    Promise.reject<T>(new TypeError('Promise array is empty'))
  )
}
