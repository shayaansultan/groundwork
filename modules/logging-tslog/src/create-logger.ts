import { Logger } from 'tslog'

type LoggerSettings = NonNullable<ConstructorParameters<typeof Logger>[0]>

// Property names masked in every log record, matched case-insensitively.
const defaultMaskKeys = [
  'apikey',
  'api_key',
  'authorization',
  'cookie',
  'password',
  'secret',
  'session',
  'sessionid',
  'session_id',
  'token',
]

export interface CreateLoggerOptions {
  /** Emit newline-delimited JSON instead of pretty output, e.g. in production. */
  json?: boolean
  /** Static fields attached to every record, e.g. service or version. */
  bindings?: LoggerSettings['bindings']
  /** Lowest level that is emitted. */
  minLevel?: LoggerSettings['minLevel']
  /** Additional property names to mask on top of the defaults. */
  maskKeys?: string[]
}

export function createLogger(name: string, options: CreateLoggerOptions = {}) {
  return new Logger({
    name,
    ...(options.json ? { type: 'json' as const } : {}),
    ...(options.bindings === undefined ? {} : { bindings: options.bindings }),
    ...(options.minLevel === undefined ? {} : { minLevel: options.minLevel }),
    mask: {
      caseInsensitive: true,
      keys: [...defaultMaskKeys, ...(options.maskKeys ?? [])],
    },
  })
}
