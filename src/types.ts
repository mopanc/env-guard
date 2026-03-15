export interface StringField {
  type: 'string'
  required?: boolean
  default?: string
}

export interface NumberField {
  type: 'number'
  required?: boolean
  default?: number
}

export interface BooleanField {
  type: 'boolean'
  required?: boolean
  default?: boolean
}

export interface PortField {
  type: 'port'
  required?: boolean
  default?: number
}

export interface UrlField {
  type: 'url'
  required?: boolean
  default?: string
}

export interface EnumField {
  type: 'enum'
  values: readonly string[]
  required?: boolean
  default?: string
}

export interface ArrayField {
  type: 'array'
  separator?: string
  required?: boolean
  default?: string[]
}

export type FieldDef =
  | StringField
  | NumberField
  | BooleanField
  | PortField
  | UrlField
  | EnumField
  | ArrayField

export type Schema = Record<string, FieldDef>

/** Infer the output type from a schema definition */
export type InferEnv<S extends Schema> = {
  readonly [K in keyof S]: S[K] extends { type: 'string' } ? string
    : S[K] extends { type: 'number' } ? number
    : S[K] extends { type: 'port' } ? number
    : S[K] extends { type: 'boolean' } ? boolean
    : S[K] extends { type: 'url' } ? string
    : S[K] extends { type: 'enum' } ? string
    : S[K] extends { type: 'array' } ? string[]
    : never
}
