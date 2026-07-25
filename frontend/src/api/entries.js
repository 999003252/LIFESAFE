const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export async function fetchEntries(userId) {
  const res = await fetch(`${API_BASE}/entries?userId=${encodeURIComponent(userId)}`)
  if (!res.ok) {
    throw new Error('Failed to load entries')
  }
  return res.json()
}

export async function fetchTodayCheckIn(userId) {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  const params = new URLSearchParams({
    userId,
    start: start.toISOString(),
    end: end.toISOString(),
  })
  const res = await fetch(`${API_BASE}/entries/today?${params}`)
  if (!res.ok) {
    throw new Error('Failed to check today’s entry')
  }
  return res.json()
}

export async function createEntry(payload) {
  const res = await fetch(`${API_BASE}/entries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    throw new Error('Failed to save entry')
  }
  return res.json()
}

export async function updateEntry(entryId, timestamp, payload) {
  const params = new URLSearchParams({ timestamp })
  const res = await fetch(
    `${API_BASE}/entries/${encodeURIComponent(entryId)}?${params}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  )
  if (!res.ok) {
    throw new Error('Failed to update entry')
  }
  return res.json()
}
