const COOKIE_NAME = 'lifesafe_auth'
const MAX_AGE_DAYS = 7

export function getAuth() {
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${COOKIE_NAME}=`))
  return match ? decodeURIComponent(match.split('=')[1]) : ''
}

export function setAuth(email) {
  const maxAge = MAX_AGE_DAYS * 24 * 60 * 60
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(email)}; path=/; max-age=${maxAge}`
}

export function clearAuth() {
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`
}

export function getCookieValue(name) {
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.split('=')[1]) : ''
}

export function setCookieValue(name, value) {
  const maxAge = 365 * 24 * 60 * 60
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}`
}
