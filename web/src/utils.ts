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

/** Formats an ISO date string to a localised short date, or returns null.
 *  Treats date-only strings (YYYY-MM-DD) as local midnight to avoid timezone off-by-one. */
export function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null
  // If it's a date-only string, parse as local midnight to avoid TZ shift
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso)
    ? new Date(`${iso}T00:00:00`)
    : new Date(iso)
  return d.toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
