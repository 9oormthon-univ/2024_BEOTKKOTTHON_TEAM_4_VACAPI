export function parseUserIdFromDesc (desc: string): string | null {
  const matches = desc.match(/\[(.*?)\]/)
  if (matches === null) return null

  return matches[1]
}
