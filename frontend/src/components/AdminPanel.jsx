import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || ''

function AdminPanel() {
  const [adminPassword, setAdminPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeTab, setActiveTab] = useState('products')
  const queryClient = useQueryClient()

  // Products state
  const [newProduct, setNewProduct] = useState({ name: '', description: '', active: true })
  
  // Statuses state
  const [newStatus, setNewStatus] = useState({ name: '', color: '#3b82f6' })

  const { data: products, isLoading: productsLoading } = useQuery(
    ['admin-products', isAuthenticated],
    () => axios.get(`${API_URL}/api/admin/products?admin_password=${adminPassword}`).then(res => res.data),
    { enabled: isAuthenticated }
  )

  const { data: statuses, isLoading: statusesLoading } = useQuery(
    ['admin-statuses', isAuthenticated],
    () => axios.get(`${API_URL}/api/admin/statuses`).then(res => res.data),
    { enabled: isAuthenticated }
  )

  const productMutation = useMutation(
    (data) => axios.post(`${API_URL}/api/admin/products?admin_password=${adminPassword}`, data),
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
    (data) => axios.post(`${API_URL}/api/admin/statuses?admin_password=${adminPassword}`, data),
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
    (id) => axios.delete(`${API_URL}/api/admin/products/${id}?admin_password=${adminPassword}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-products')
        queryClient.invalidateQueries('products')
      },
      onError: (err) => alert(err.response?.data?.detail || 'Failed to delete product')
    }
  )

  const deleteStatusMutation = useMutation(
    (id) => axios.delete(`${API_URL}/api/admin/statuses/${id}?admin_password=${adminPassword}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-statuses')
        queryClient.invalidateQueries('statuses')
      },
      onError: (err) => alert(err.response?.data?.detail || 'Failed to delete status')
    }
  )

  const handleLogin = (e) => {
    e.preventDefault()
    // Just set authenticated - actual validation happens on API calls
    setIsAuthenticated(true)
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-xl font-bold mb-4">Admin Login</h2>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Admin Password</label>
              <input
                type="password"
                className="w-full border rounded px-3 py-2"
                value={adminPassword}
                onChange={e => setAdminPassword(e.target.value)}
                placeholder="Enter admin password"
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
    <div>
      <h2 className="text-2xl font-bold mb-4">Admin Panel</h2>
      
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
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Product name"
                className="flex-1 border rounded px-3 py-2"
                value={newProduct.name}
                onChange={e => setNewProduct({...newProduct, name: e.target.value})}
              />
              <input
                type="text"
                placeholder="Description (optional)"
                className="flex-1 border rounded px-3 py-2"
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
  )
}

export default AdminPanel
