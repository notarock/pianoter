/** Maps a piece status to a Mantine color name. */
export function statusColor(status: string): string {
  switch (status) {
    case 'wishlist': return 'gray'
    case 'learning': return 'yellow'
    case 'active':   return 'teal'
    case 'shelved':  return 'gray'
    default:         return 'gray'
  }
}

/** Formats an ISO date string to a localised short date, or returns null. */
export function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
