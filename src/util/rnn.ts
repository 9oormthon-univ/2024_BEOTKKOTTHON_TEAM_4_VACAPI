import { parseIdentity } from '../dto/common/identity'

export function rnnToIdentity (rnn: string): string {
  const identity = parseIdentity(rnn)
  const birthday = identity.date.replace(/-/g, '')

  return `${birthday}${rnn[7]}`
}
