import type { Schema, InferEnv } from './types.js'
import type { ValidationIssue } from './errors.js'
import { EnvValidationError } from './errors.js'
import { validateField } from './validate.js'

/**
 * Validate environment variables against a schema.
 * Returns a frozen, typed object with all validated values.
 * Throws EnvValidationError listing all issues if validation fails.
 *
 * @param schema - Field definitions for each expected variable
 * @param source - Source object to read from (defaults to process.env)
 */
export function createEnv<S extends Schema>(
  schema: S,
  source: Record<string, string | undefined> = process.env,
): InferEnv<S> {
  const issues: ValidationIssue[] = []
  const result: Record<string, unknown> = {}

  for (const [key, field] of Object.entries(schema)) {
    result[key] = validateField(key, source[key], field, issues)
  }

  if (issues.length > 0) {
    throw new EnvValidationError(issues)
  }

  return Object.freeze(result) as InferEnv<S>
}
