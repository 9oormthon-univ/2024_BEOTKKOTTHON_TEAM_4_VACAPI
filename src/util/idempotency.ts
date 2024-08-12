import * as crypto from 'crypto'

export function hashRequest (request: Request): string {
  const payload = request.method + request.url + JSON.stringify(request.body)
  return crypto.createHash('sha256').update(payload).digest('hex')
}
