import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createEnv, EnvValidationError } from '../src/index.js'

describe('createEnv', () => {
  it('returns validated values from source', () => {
    const env = createEnv({
      HOST: { type: 'string', required: true },
      PORT: { type: 'port', default: 3000 },
    }, { HOST: 'localhost', PORT: '8080' })

    assert.strictEqual(env.HOST, 'localhost')
    assert.strictEqual(env.PORT, 8080)
  })

  it('uses defaults for missing optional fields', () => {
    const env = createEnv({
      DEBUG: { type: 'boolean', default: false },
      PORT: { type: 'port', default: 3000 },
      NAME: { type: 'string', default: 'app' },
    }, {})

    assert.strictEqual(env.DEBUG, false)
    assert.strictEqual(env.PORT, 3000)
    assert.strictEqual(env.NAME, 'app')
  })

  it('throws on missing required fields', () => {
    assert.throws(
      () => createEnv({ DB_URL: { type: 'string', required: true } }, {}),
      (err: unknown) => {
        assert.ok(err instanceof EnvValidationError)
        assert.strictEqual(err.issues.length, 1)
        assert.strictEqual(err.issues[0].key, 'DB_URL')
        assert.ok(err.issues[0].message.includes('required'))
        return true
      },
    )
  })

  it('reports all issues at once', () => {
    assert.throws(
      () => createEnv({
        A: { type: 'string', required: true },
        B: { type: 'string', required: true },
        C: { type: 'number', required: true },
      }, {}),
      (err: unknown) => {
        assert.ok(err instanceof EnvValidationError)
        assert.strictEqual(err.issues.length, 3)
        return true
      },
    )
  })

  it('returns frozen object', () => {
    const env = createEnv({ X: { type: 'string', default: 'val' } }, {})
    assert.ok(Object.isFrozen(env))
  })
})

describe('string type', () => {
  it('passes through string values', () => {
    const env = createEnv({ S: { type: 'string', required: true } }, { S: 'hello' })
    assert.strictEqual(env.S, 'hello')
  })

  it('treats empty string as missing', () => {
    assert.throws(
      () => createEnv({ S: { type: 'string', required: true } }, { S: '' }),
    )
  })
})

describe('number type', () => {
  it('coerces string to number', () => {
    const env = createEnv({ N: { type: 'number', required: true } }, { N: '42' })
    assert.strictEqual(env.N, 42)
  })

  it('handles decimals', () => {
    const env = createEnv({ N: { type: 'number', required: true } }, { N: '3.14' })
    assert.strictEqual(env.N, 3.14)
  })

  it('rejects non-numeric strings', () => {
    assert.throws(
      () => createEnv({ N: { type: 'number', required: true } }, { N: 'abc' }),
      (err: unknown) => {
        assert.ok(err instanceof EnvValidationError)
        assert.ok(err.issues[0].message.includes('expected a number'))
        return true
      },
    )
  })
})

describe('boolean type', () => {
  it('accepts true values', () => {
    for (const val of ['true', '1', 'yes', 'TRUE', 'Yes']) {
      const env = createEnv({ B: { type: 'boolean', required: true } }, { B: val })
      assert.strictEqual(env.B, true, `"${val}" should be true`)
    }
  })

  it('accepts false values', () => {
    for (const val of ['false', '0', 'no', 'FALSE', 'No']) {
      const env = createEnv({ B: { type: 'boolean', required: true } }, { B: val })
      assert.strictEqual(env.B, false, `"${val}" should be false`)
    }
  })

  it('rejects invalid boolean', () => {
    assert.throws(
      () => createEnv({ B: { type: 'boolean', required: true } }, { B: 'maybe' }),
    )
  })
})

describe('port type', () => {
  it('accepts valid ports', () => {
    const env = createEnv({ P: { type: 'port', required: true } }, { P: '8080' })
    assert.strictEqual(env.P, 8080)
  })

  it('rejects port 0', () => {
    assert.throws(() => createEnv({ P: { type: 'port', required: true } }, { P: '0' }))
  })

  it('rejects port > 65535', () => {
    assert.throws(() => createEnv({ P: { type: 'port', required: true } }, { P: '70000' }))
  })

  it('rejects non-integer ports', () => {
    assert.throws(() => createEnv({ P: { type: 'port', required: true } }, { P: '80.5' }))
  })
})

describe('url type', () => {
  it('accepts valid URLs', () => {
    const env = createEnv({ U: { type: 'url', required: true } }, { U: 'https://example.com' })
    assert.strictEqual(env.U, 'https://example.com')
  })

  it('rejects invalid URLs', () => {
    assert.throws(
      () => createEnv({ U: { type: 'url', required: true } }, { U: 'not-a-url' }),
      (err: unknown) => {
        assert.ok(err instanceof EnvValidationError)
        assert.ok(err.issues[0].message.includes('expected a valid URL'))
        return true
      },
    )
  })
})

describe('enum type', () => {
  it('accepts valid enum values', () => {
    const env = createEnv({
      E: { type: 'enum', values: ['dev', 'prod', 'test'], required: true },
    }, { E: 'prod' })
    assert.strictEqual(env.E, 'prod')
  })

  it('rejects invalid enum values', () => {
    assert.throws(
      () => createEnv({
        E: { type: 'enum', values: ['dev', 'prod'], required: true },
      }, { E: 'staging' }),
      (err: unknown) => {
        assert.ok(err instanceof EnvValidationError)
        assert.ok(err.issues[0].message.includes('dev, prod'))
        return true
      },
    )
  })
})

describe('array type', () => {
  it('splits by comma by default', () => {
    const env = createEnv({
      A: { type: 'array', required: true },
    }, { A: 'one, two, three' })
    assert.deepStrictEqual(env.A, ['one', 'two', 'three'])
  })

  it('uses custom separator', () => {
    const env = createEnv({
      A: { type: 'array', separator: '|', required: true },
    }, { A: 'a|b|c' })
    assert.deepStrictEqual(env.A, ['a', 'b', 'c'])
  })

  it('filters empty entries', () => {
    const env = createEnv({
      A: { type: 'array', required: true },
    }, { A: 'a,,b,,' })
    assert.deepStrictEqual(env.A, ['a', 'b'])
  })

  it('uses default when missing', () => {
    const env = createEnv({
      A: { type: 'array', default: ['x'] },
    }, {})
    assert.deepStrictEqual(env.A, ['x'])
  })
})
