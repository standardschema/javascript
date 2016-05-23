const _hasOwnProperty = Object.prototype.hasOwnProperty

/**
 * Retrieve a value by path.
 */
export function getPath (value: any, path: string[]) {
  const normalized = normalizePath(path)
  let result = value

  for (const key of normalized) {
    if (!_hasOwnProperty.call(result, key)) {
      return
    }

    result = result[key]
  }

  return result
}

/**
 * Make a path relative to another.
 */
export function relativePath (a: string[], b: string[]) {
  return normalizePath([...a, '..', ...b])
}

/**
 * Normalize a path string.
 */
export function normalizePath (path: string[]) {
  const result: string[] = []

  for (const key of path) {
    if (key.charAt(0) === '.') {
      if (key === '..') {
        result.pop()
      }

      continue
    }

    result.push(key)
  }

  return result
}
