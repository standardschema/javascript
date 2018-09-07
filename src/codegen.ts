export class Codegen {
  vars = new Map<string, number>()
  indent = 0
  eol = '\n'
  output = ''

  get indentation() {
    let code = ''
    for (let i = 0; i < this.indent; i++) code += '  '
    return code
  }

  sym(key: string) {
    if (!this.vars.has(key)) {
      this.vars.set(key, 0)
      return key
    }

    const count = this.vars.get(key)!
    this.vars.set(key, count + 1)
    return `${key}${count}`
  }

  push(text: string) {
    this.output += `${this.indentation}${text}${this.eol}`
  }

  toString() {
    return this.output
  }
}

export class JavaScriptCodegen extends Codegen {
  indent = 1
  ctxNames = [this.sym('ctx')]
  resultNames = [this.var('result', 'undefined')]
  params = [this.ctxNames[0]]

  constructor(public fnName: string) {
    super()
  }

  get ctxName() {
    return this.ctxNames[this.ctxNames.length - 1]
  }

  get resultName() {
    return this.resultNames[this.resultNames.length - 1]
  }

  var(name: string, value: string) {
    const key = this.sym(name)
    this.push(`var ${key} = ${value}`)
    return key
  }

  ctx(value: string) {
    const ctxName = this.var('ctx', value)
    this.ctxNames.push(ctxName)
    return ctxName
  }

  result(value: string) {
    return this.assign(this.resultName, value)
  }

  assign(name: string, value: string) {
    this.push(`${name} = ${value}`)
    return name
  }

  quote(str: string) {
    return `'${str.replace(/'/g, "\\'")}'`
  }

  prop(key: string | number) {
    if (typeof key === 'string') {
      if (/^[$_a-z][$_\w]*$/i.test(key)) return `.${key}`

      return `[${this.quote(key)}]`
    }

    return `[${key}]`
  }

  return(value: string) {
    this.push(`return ${value}`)
  }

  doIf(statement: string) {
    this.push(`if (${statement}) {`)
    this.indent++
  }

  doElse() {
    this.indent--
    this.push(`} else {`)
    this.indent++
  }

  doElseIf(statement: string) {
    this.indent--
    this.push(`} else if (${statement}) {`)
    this.indent++
  }

  doEnd() {
    this.indent--
    this.push(`}`)
  }

  toFunction() {
    return [
      `function ${this.fnName} (${this.params.join(',')}) {`,
      this.toString(),
      `${this.indentation}return ${this.resultName}`,
      `}`
    ].join(this.eol)
  }
}
