const _hasOwnProperty = Object.prototype.hasOwnProperty

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

export function relativePath (a: string[], b: string[]) {
  return normalizePath([...a, '..', ...b])
}

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
