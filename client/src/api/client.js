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

export default api
