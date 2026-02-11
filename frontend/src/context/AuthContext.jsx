import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || ''
const AuthContext = createContext(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function AuthProvider({ children }) {
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showLoginModal, setShowLoginModal] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('bugtracker_password')
    if (stored) {
      // Validate the stored password is still correct
      const formData = new FormData()
      formData.append('password', stored)
      axios.post(`${API_URL}/api/auth/validate`, formData)
        .then(() => {
          setPassword(stored)
          setIsAuthenticated(true)
        })
        .catch(() => {
          localStorage.removeItem('bugtracker_password')
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (pwd) => {
    const formData = new FormData()
    formData.append('password', pwd)
    await axios.post(`${API_URL}/api/auth/validate`, formData)
    setPassword(pwd)
    setIsAuthenticated(true)
    localStorage.setItem('bugtracker_password', pwd)
    setShowLoginModal(false)
  }

  const logout = () => {
    localStorage.removeItem('bugtracker_password')
    setPassword('')
    setIsAuthenticated(false)
  }

  const api = axios.create({
    baseURL: API_URL,
    headers: isAuthenticated ? { 'X-Admin-Password': password } : {}
  })

  return (
    <AuthContext.Provider value={{ isAuthenticated, password, api, login, logout, showLoginModal, setShowLoginModal, loading }}>
      {children}
      {showLoginModal && <LoginModal />}
    </AuthContext.Provider>
  )
}

function LoginModal() {
  const { login, setShowLoginModal } = useAuth()
  const [pwd, setPwd] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(pwd)
    } catch {
      setError('Invalid password')
      setPwd('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
        <h3 className="text-lg font-bold mb-4">Admin Login</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            className="w-full border rounded px-3 py-2 mb-2"
            value={pwd}
            onChange={e => setPwd(e.target.value)}
            placeholder="Enter admin password"
            autoFocus
          />
          {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting || !pwd}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setShowLoginModal(false)}
              className="flex-1 border py-2 px-4 rounded hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
