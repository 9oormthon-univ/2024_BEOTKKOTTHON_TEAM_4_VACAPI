export interface UserIdentity {
  date: string
  sex: 'M' | 'F'
}

export function formatDate (date: string): string {
  if (date.length !== 8) throw new Error('Invalid date format')

  return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`
}

export function parseIdentity (identityString: string): UserIdentity {
  const birth = identityString.slice(0, 6)
  const sexIdentityNo = identityString[7]
  const is90s = sexIdentityNo === '1' || sexIdentityNo === '2'

  return {
    date: formatDate(is90s ? `19${birth}` : `20${birth}`),
    sex: sexIdentityNo === '1' || sexIdentityNo === '3' ? 'M' : 'F'
  }
}
