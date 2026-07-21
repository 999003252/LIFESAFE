const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function request(path, options) {
  const response = await fetch(`${API_BASE}${path}`, options)
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.detail || 'Something went wrong. Please try again.')
  }

  return data
}

export function upsertProfile(profile) {
  return request('/users/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  })
}

export function ensureProfile(email) {
  return request('/users/ensure', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
}

export function searchUsers(query, viewerId) {
  return request(`/users?query=${encodeURIComponent(query)}&viewerId=${encodeURIComponent(viewerId)}`)
}

export function fetchFriends(userId) {
  return request(`/friends?userId=${encodeURIComponent(userId)}`)
}

export function addFriend(userId, friendId) {
  return request('/friends', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, friendId }),
  })
}

export function fetchMessages(userId, friendId) {
  return request(`/messages?userId=${encodeURIComponent(userId)}&friendId=${encodeURIComponent(friendId)}`)
}

export function fetchRealtimeConfig() {
  return request('/realtime/config')
}
