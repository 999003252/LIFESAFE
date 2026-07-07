const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export async function fetchEntries(userId) {
  const res = await fetch(`${API_BASE}/entries?userId=${encodeURIComponent(userId)}`)
  if (!res.ok) {
    throw new Error('Failed to load entries')
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
