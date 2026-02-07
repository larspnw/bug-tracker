import { useState, useEffect, createContext, useContext } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || ''

// Auth Context
const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

function AdminPanel() {
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('products')
  const queryClient = useQueryClient()

  // Check for stored password on mount
  useEffect(() => {
    const storedPassword = localStorage.getItem('bugtracker_password')
    if (storedPassword) {
      setPassword(storedPassword)
      setIsAuthenticated(true)
    }
    setAuthLoading(false)
  }, [])

  // Store password when authenticated
  useEffect(() => {
    if (isAuthenticated && password) {
      localStorage.setItem('bugtracker_password', password)
    }
  }, [isAuthenticated, password])

  // Create axios instance with auth header
  const api = axios.create({
    baseURL: API_URL,
    headers: isAuthenticated ? { 'X-Admin-Password': password } : {}
  })

  // Products state
  const [newProduct, setNewProduct] = useState({ name: '', description: '', active: true })
  
  // Statuses state
  const [newStatus, setNewStatus] = useState({ name: '', color: '#3b82f6' })

  const { data: products, isLoading: productsLoading } = useQuery(
    ['admin-products', isAuthenticated],
    () => api.get('/api/admin/products').then(res => res.data),
    { enabled: isAuthenticated }
  )

  const { data: statuses, isLoading: statusesLoading } = useQuery(
    ['admin-statuses', isAuthenticated],
    () => api.get('/api/statuses').then(res => res.data),
    { enabled: isAuthenticated }
  )

  const productMutation = useMutation(
    (data) => api.post('/api/admin/products', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-products')
        queryClient.invalidateQueries('products')
        setNewProduct({ name: '', description: '', active: true })
      },
      onError: (err) => alert(err.response?.data?.detail || 'Failed to create product')
    }
  )

  const statusMutation = useMutation(
    (data) => api.post('/api/admin/statuses', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-statuses')
        queryClient.invalidateQueries('statuses')
        setNewStatus({ name: '', color: '#3b82f6' })
      },
      onError: (err) => alert(err.response?.data?.detail || 'Failed to create status')
    }
  )

  const deleteProductMutation = useMutation(
    (id) => api.delete(`/api/admin/products/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-products')
        queryClient.invalidateQueries('products')
      },
      onError: (err) => alert(err.response?.data?.detail || 'Failed to delete product')
    }
  )

  const deleteStatusMutation = useMutation(
    (id) => api.delete(`/api/admin/statuses/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-statuses')
        queryClient.invalidateQueries('statuses')
      },
      onError: (err) => alert(err.response?.data?.detail || 'Failed to delete status')
    }
  )

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const formData = new FormData()
      formData.append('password', password)
      await axios.post(`${API_URL}/api/auth/validate`, formData)
      setIsAuthenticated(true)
    } catch (err) {
      alert('Invalid password')
      setPassword('')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('bugtracker_password')
    setPassword('')
    setIsAuthenticated(false)
  }

  if (authLoading) return <div className="text-center p-8">Loading...</div>

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-xl font-bold mb-4">Login</h2>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                className="w-full border rounded px-3 py-2"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ password, api }}>
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Admin Panel</h2>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Logout
          </button>
        </div>
        
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded ${activeTab === 'products' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Products
          </button>
          <button
            onClick={() => setActiveTab('statuses')}
            className={`px-4 py-2 rounded ${activeTab === 'statuses' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Statuses
          </button>
        </div>

        {activeTab === 'products' && (
          <div>
            <div className="bg-white rounded shadow p-4 mb-4">
              <h3 className="font-bold mb-4">Add New Product</h3>
              <div className="flex flex-wrap gap-4">
                <input
                  type="text"
                  placeholder="Product name"
                  className="flex-1 min-w-[200px] border rounded px-3 py-2"
                  value={newProduct.name}
                  onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                />
                <input
                  type="text"
                  placeholder="Description (optional)"
                  className="flex-1 min-w-[200px] border rounded px-3 py-2"
                  value={newProduct.description}
                  onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                />
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newProduct.active}
                    onChange={e => setNewProduct({...newProduct, active: e.target.checked})}
                  />
                  Active
                </label>
                <button
                  onClick={() => productMutation.mutate(newProduct)}
                  disabled={!newProduct.name || productMutation.isLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="bg-white rounded shadow">
              <h3 className="font-bold p-4 border-b">Products</h3>
              {productsLoading ? (
                <p className="p-4">Loading...</p>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-left">Description</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products?.map(product => (
                      <tr key={product.id} className="border-t">
                        <td className="px-4 py-2">{product.name}</td>
                        <td className="px-4 py-2 text-gray-600">{product.description || '-'}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded text-xs ${product.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                            {product.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => {
                              if (confirm(`Delete ${product.name}?`)) {
                                deleteProductMutation.mutate(product.id)
                              }
                            }}
                            className="text-red-600 hover:underline text-sm"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === 'statuses' && (
          <div>
            <div className="bg-white rounded shadow p-4 mb-4">
              <h3 className="font-bold mb-4">Add New Status</h3>
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Status name"
                  className="flex-1 border rounded px-3 py-2"
                  value={newStatus.name}
                  onChange={e => setNewStatus({...newStatus, name: e.target.value})}
                />
                <input
                  type="color"
                  className="w-16 h-10 border rounded"
                  value={newStatus.color}
                  onChange={e => setNewStatus({...newStatus, color: e.target.value})}
                />
                <button
                  onClick={() => statusMutation.mutate(newStatus)}
                  disabled={!newStatus.name || statusMutation.isLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="bg-white rounded shadow">
              <h3 className="font-bold p-4 border-b">Statuses</h3>
              {statusesLoading ? (
                <p className="p-4">Loading...</p>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-left">Color</th>
                      <th className="px-4 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statuses?.map(status => (
                      <tr key={status.id} className="border-t">
                        <td className="px-4 py-2 flex items-center gap-2">
                          <span 
                            className="w-4 h-4 rounded inline-block"
                            style={{ backgroundColor: status.color }}
                          />
                          {status.name}
                        </td>
                        <td className="px-4 py-2 font-mono text-sm">{status.color}</td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => {
                              if (confirm(`Delete ${status.name}?`)) {
                                deleteStatusMutation.mutate(status.id)
                              }
                            }}
                            className="text-red-600 hover:underline text-sm"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </AuthContext.Provider>
  )
}

export default AdminPanel
