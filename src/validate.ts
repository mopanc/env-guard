import type { FieldDef } from './types.js'
import type { ValidationIssue } from './errors.js'

/**
 * Validate and coerce a single environment variable value.
 * Returns the coerced value or undefined if missing.
 * Pushes issues to the provided array on validation failure.
 */
export function validateField(
  key: string,
  raw: string | undefined,
  field: FieldDef,
  issues: ValidationIssue[],
): unknown {
  const isRequired = field.required !== false && field.default === undefined
  const hasValue = raw !== undefined && raw !== ''

  if (!hasValue) {
    if (isRequired) {
      issues.push({ key, message: 'required but missing' })
      return undefined
    }
    return field.default
  }

  const value = raw as string

  switch (field.type) {
    case 'string':
      return value

    case 'number': {
      const num = Number(value)
      if (isNaN(num)) {
        issues.push({ key, message: `expected a number, got "${value}"` })
        return undefined
      }
      return num
    }

    case 'boolean': {
      const lower = value.toLowerCase()
      if (['true', '1', 'yes'].includes(lower)) return true
      if (['false', '0', 'no'].includes(lower)) return false
      issues.push({ key, message: `expected a boolean (true/false/1/0/yes/no), got "${value}"` })
      return undefined
    }

    case 'port': {
      const port = Number(value)
      if (isNaN(port) || !Number.isInteger(port) || port < 1 || port > 65535) {
        issues.push({ key, message: `expected a valid port (1-65535), got "${value}"` })
        return undefined
      }
      return port
    }

    case 'url': {
      try {
        new URL(value)
        return value
      } catch {
        issues.push({ key, message: `expected a valid URL, got "${value}"` })
        return undefined
      }
    }

    case 'enum': {
      if (!field.values.includes(value)) {
        issues.push({ key, message: `expected one of [${field.values.join(', ')}], got "${value}"` })
        return undefined
      }
      return value
    }

    case 'array': {
      const separator = field.separator ?? ','
      return value.split(separator).map(s => s.trim()).filter(Boolean)
    }

    default:
      issues.push({ key, message: 'unknown field type' })
      return undefined
  }
}
