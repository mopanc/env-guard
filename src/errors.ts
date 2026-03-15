export interface ValidationIssue {
  key: string
  message: string
}

export class EnvValidationError extends Error {
  public readonly issues: ValidationIssue[]

  constructor(issues: ValidationIssue[]) {
    const lines = issues.map(i => `  ${i.key.padEnd(24)} ${i.message}`)
    const message = `Environment validation failed:\n\n${lines.join('\n')}\n`

    super(message)
    this.name = 'EnvValidationError'
    this.issues = issues
  }
}
