import { consumeNdjsonStream } from './streaming'

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

export function markFriendRead(userId, friendId) {
  return request('/friends/read', {
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

export async function streamAiMessage(userId, text, onEvent) {
  const response = await fetch(`${API_BASE}/ai-support/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, text }),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.detail || 'Therapist could not start a response.')
  }
  if (!response.body) {
    throw new Error('Streaming is not supported by this browser.')
  }

  let terminalEventReceived = false
  await consumeNdjsonStream(response.body, (event) => {
    if (['aiMessageCompleted', 'aiMessageError', 'messageError'].includes(event.type)) {
      terminalEventReceived = true
    }
    onEvent(event)
  })

  if (!terminalEventReceived) {
    throw new Error('Therapist response ended unexpectedly. Please try again.')
  }
}
