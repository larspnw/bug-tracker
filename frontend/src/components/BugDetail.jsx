import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || ''

function BugDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showAdminControls, setShowAdminControls] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')

  // Check for stored password on mount
  useEffect(() => {
    const storedPassword = localStorage.getItem('bugtracker_password')
    if (storedPassword) {
      setPassword(storedPassword)
      setIsAuthenticated(true)
    }
  }, [])

  // Create axios instance with auth header
  const api = axios.create({
    baseURL: API_URL,
    headers: isAuthenticated ? { 'X-Admin-Password': password } : {}
  })

  const { data: bug, isLoading } = useQuery(['bug', id], () =>
    axios.get(`${API_URL}/api/bugs/${id}`).then(res => res.data)
  )

  const { data: statuses } = useQuery('statuses', () =>
    axios.get(`${API_URL}/api/statuses`).then(res => res.data)
  )

  const updateMutation = useMutation(
    (data) => api.patch(`/api/bugs/${id}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['bug', id])
        alert('Bug updated!')
      },
      onError: (err) => alert(err.response?.data?.detail || 'Update failed')
    }
  )

  const deleteMutation = useMutation(
    () => api.delete(`/api/bugs/${id}`),
    {
      onSuccess: () => {
        navigate('/bugs')
      },
      onError: (err) => alert(err.response?.data?.detail || 'Delete failed')
    }
  )

  if (isLoading) return <div className="text-center p-8">Loading...</div>
  if (!bug) return <div className="text-center p-8">Bug not found</div>

  const getSeverityColor = (severity) => {
    const colors = {
      Low: 'bg-gray-100 text-gray-800',
      Medium: 'bg-yellow-100 text-yellow-800',
      High: 'bg-orange-100 text-orange-800',
      Critical: 'bg-red-100 text-red-800'
    }
    return colors[severity] || 'bg-gray-100'
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/bugs')}
        className="mb-4 text-blue-600 hover:underline"
      >
        ← Back to Bug List
      </button>

      <div className="bg-white rounded shadow p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold">{bug.summary}</h2>
            <p className="text-gray-600">Bug #{bug.id}</p>
          </div>
          <div className="flex gap-2">
            <span className={`px-3 py-1 rounded text-sm font-medium ${getSeverityColor(bug.severity)}`}>
              {bug.severity}
            </span>
            <span 
              className="px-3 py-1 rounded text-sm font-medium"
              style={{ 
                backgroundColor: bug.status?.color + '20',
                color: bug.status?.color 
              }}
            >
              {bug.status?.name}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <span className="font-medium">Product:</span> {bug.product?.name}
          </div>
          <div>
            <span className="font-medium">Submitted:</span> {new Date(bug.created_at).toLocaleString()}
          </div>
          {bug.reporter_name && (
            <div>
              <span className="font-medium">Reporter:</span> {bug.reporter_name}
            </div>
          )}
          {bug.reporter_email && (
            <div>
              <span className="font-medium">Email:</span> {bug.reporter_email}
            </div>
          )}
        </div>

        <div className="mb-6">
          <h3 className="font-medium mb-2">Description</h3>
          <div className="bg-gray-50 p-4 rounded whitespace-pre-wrap">
            {bug.description}
          </div>
        </div>

        {bug.screenshots?.length > 0 && (
          <div className="mb-6">
            <h3 className="font-medium mb-2">Screenshots ({bug.screenshots.length})</h3>
            <div className="flex flex-wrap gap-4">
              {bug.screenshots.map(screenshot => (
                <a 
                  key={screenshot.id}
                  href={`${API_URL}/api/bugs/${id}/screenshots/${screenshot.filename}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                  title={screenshot.original_filename}
                >
                  <img
                    src={`${API_URL}/api/bugs/${id}/screenshots/${screenshot.filename}`}
                    alt={screenshot.original_filename}
                    className="w-32 h-32 object-cover rounded border hover:border-blue-500"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.nextSibling.style.display = 'flex'
                    }}
                  />
                  <div className="w-32 h-32 bg-gray-100 rounded flex items-center justify-center border hidden">
                    <span className="text-xs text-gray-500 text-center px-2">
                      {screenshot.original_filename}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Admin Controls */}
        <div className="border-t pt-4 mt-6">
          <button
            onClick={() => setShowAdminControls(!showAdminControls)}
            className="text-sm text-blue-600 hover:underline"
          >
            {showAdminControls ? 'Hide' : 'Show'} Admin Controls
          </button>

          {showAdminControls && (
            <div className="mt-4 p-4 bg-gray-50 rounded">
              {!isAuthenticated ? (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Please login from Admin Panel first</p>
                  <button
                    onClick={() => navigate('/admin')}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Go to Admin Panel →
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Change Status</label>
                      <select
                        className="border rounded px-3 py-2"
                        onChange={e => updateMutation.mutate({ status_id: e.target.value })}
                        value={bug.status_id}
                      >
                        {statuses?.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Change Severity</label>
                      <select
                        className="border rounded px-3 py-2"
                        onChange={e => updateMutation.mutate({ severity: e.target.value })}
                        value={bug.severity}
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this bug?')) {
                        deleteMutation.mutate()
                      }
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete Bug
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BugDetail
