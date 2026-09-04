import axios from 'axios'

const api = axios.create({
  baseURL: '/api'
  // NOTE: Do NOT set a default Content-Type here.
  // Axios auto-detects the correct Content-Type (including multipart
  // boundary for FormData). A default 'application/json' header would
  // override the auto-detected multipart boundary and break file uploads.
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('protolens_token')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

/**
 * Extract a render-safe STRING from an API/network error.
 *
 * React cannot render plain objects (Minified React error #31 — the cause of
 * the post-login black screen on Vercel: platform 404 bodies look like
 * { error: { code, message } }, and the old `err.response?.data?.error ||
 * fallback` pattern put that nested object straight into JSX).
 *
 * Handles, in order:
 *  - plain string bodies (skipping HTML error pages)
 *  - { error: 'string' }            — ProtoLens API shape
 *  - { error: { code, message } }   — Vercel platform error shape
 *  - { message: 'string' }          — flat { code, message } bodies
 *  - axios/network messages (e.g. 'Network Error')
 * Anything else falls back to the provided default.
 */
export function getApiErrorMessage(err, fallback = 'Something went wrong') {
  const asText = v => {
    if (typeof v !== 'string') return null
    const t = v.trim()
    return t && !t.startsWith('<') ? t : null
  }
  const data = err?.response?.data
  return (
    asText(data) ||
    asText(data?.error) ||
    asText(data?.error?.message) ||
    asText(data?.message) ||
    asText(err?.message) ||
    fallback
  )
}

export default api
