# env-guard

Type-safe environment variable validation. Define a schema, validate at startup, get a typed and frozen config object. Zero dependencies.

## Install

```bash
npm install env-guard
```

## Usage

```ts
import { createEnv } from 'env-guard'

const env = createEnv({
  DATABASE_URL: { type: 'string', required: true },
  PORT: { type: 'port', default: 3000 },
  DEBUG: { type: 'boolean', default: false },
  NODE_ENV: { type: 'enum', values: ['development', 'production', 'test'], default: 'development' },
  ALLOWED_ORIGINS: { type: 'array', separator: ',', default: [] },
  API_URL: { type: 'url', required: true },
})

// env is fully typed and frozen
// env.PORT is number, env.DEBUG is boolean, etc.
```

If validation fails, all issues are reported at once:

```
Environment validation failed:

  DATABASE_URL             required but missing
  PORT                     expected a valid port (1-65535), got "abc"
  API_URL                  expected a valid URL, got "not-a-url"
```

## Field Types

| Type | Output | Accepts |
|------|--------|---------|
| `string` | `string` | Any non-empty string |
| `number` | `number` | Numeric strings, integers and decimals |
| `boolean` | `boolean` | `true/false`, `1/0`, `yes/no` (case-insensitive) |
| `port` | `number` | Integer between 1 and 65535 |
| `url` | `string` | Valid URL (parsed by `new URL()`) |
| `enum` | `string` | One of the specified `values` |
| `array` | `string[]` | Delimited string, split by `separator` (default `,`) |

## API

### `createEnv(schema, source?)`

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `schema` | `Schema` | required | Field definitions for each variable |
| `source` | `Record<string, string>` | `process.env` | Source object to read from |

Returns a frozen object with validated and coerced values. Throws `EnvValidationError` if any field fails validation.

### Field options

Every field supports:

| Option | Type | Description |
|--------|------|-------------|
| `type` | `string` | Field type (see table above) |
| `required` | `boolean` | Whether the field must be present. Default: `true` if no `default` is set |
| `default` | varies | Default value when the variable is missing |

### `EnvValidationError`

Thrown when one or more fields fail validation. Properties:

- `message` — Formatted error message listing all issues
- `issues` — Array of `{ key: string, message: string }`

## Examples

### Express server config

```ts
import { createEnv } from 'env-guard'

const env = createEnv({
  PORT: { type: 'port', default: 3000 },
  HOST: { type: 'string', default: '0.0.0.0' },
  DATABASE_URL: { type: 'string', required: true },
  REDIS_URL: { type: 'url', required: true },
  LOG_LEVEL: { type: 'enum', values: ['debug', 'info', 'warn', 'error'], default: 'info' },
  CORS_ORIGINS: { type: 'array', separator: ',', default: ['http://localhost:3000'] },
})

app.listen(env.PORT, env.HOST)
```

### Testing with custom source

```ts
const env = createEnv(schema, {
  DATABASE_URL: 'postgresql://test:test@localhost/test',
  PORT: '5555',
})
```

## License

MIT
