const BASE = 'https://api.todoist.com/api/v1'

export async function todoistFetch(path: string, options?: RequestInit) {
  const token = process.env.TODOIST_API_TOKEN
  if (!token) throw new Error('TODOIST_API_TOKEN is not set in .env.local')

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!res.ok) {
    throw new Error(`Todoist API error: ${res.status} ${res.statusText}`)
  }

  if (res.status === 204) return null
  return res.json()
}
