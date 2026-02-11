import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Link, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL || ''

function BugList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { isAuthenticated, api, setShowLoginModal } = useAuth()
  const queryClient = useQueryClient()

  // Read filters from URL search params
  const filters = {
    status_id: searchParams.get('status_id') || '',
    product_id: searchParams.get('product_id') || '',
    severity: searchParams.get('severity') || ''
  }
  const sort = {
    by: searchParams.get('sort_by') || 'created_at',
    order: searchParams.get('sort_order') || 'desc'
  }
  const page = parseInt(searchParams.get('page') || '0', 10)
  const limit = 20

  const updateParams = (updates) => {
    const params = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    setSearchParams(params, { replace: true })
  }

  const setFilters = (newFilters) => {
    updateParams({
      status_id: newFilters.status_id,
      product_id: newFilters.product_id,
      severity: newFilters.severity,
      page: ''
    })
  }

  const handleSort = (column) => {
    const newOrder = sort.by === column && sort.order === 'asc' ? 'desc' : 'asc'
    updateParams({ sort_by: column, sort_order: newOrder })
  }

  const setPage = (newPage) => {
    const p = typeof newPage === 'function' ? newPage(page) : newPage
    updateParams({ page: p > 0 ? String(p) : '' })
  }

  const clearFilters = () => {
    setSearchParams({}, { replace: true })
  }

  const { data: bugsData, isLoading } = useQuery(
    ['bugs', filters, sort, page],
    () => axios.get(`${API_URL}/api/bugs`, {
      params: {
        ...filters,
        sort_by: sort.by,
        sort_order: sort.order,
        skip: page * limit,
        limit
      }
    }).then(res => res.data),
    { keepPreviousData: true }
  )

  const { data: statuses } = useQuery('statuses', () =>
    axios.get(`${API_URL}/api/statuses`).then(res => res.data)
  )

  const { data: products } = useQuery('products', () =>
    axios.get(`${API_URL}/api/products`).then(res => res.data)
  )

  const updateStatusMutation = useMutation(
    ({ bugId, statusId }) => api.patch(`/api/bugs/${bugId}`, { status_id: statusId }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('bugs')
      },
      onError: (err) => {
        if (err.response?.status === 403) {
          setShowLoginModal(true)
        } else {
          alert(err.response?.data?.detail || 'Failed to update status')
        }
      }
    }
  )

  const handleStatusChange = (bugId, statusId) => {
    if (!isAuthenticated) {
      setShowLoginModal(true)
      return
    }
    updateStatusMutation.mutate({ bugId, statusId })
  }

  const getSeverityColor = (severity) => {
    const colors = {
      Low: 'bg-gray-100 text-gray-800',
      Medium: 'bg-yellow-100 text-yellow-800',
      High: 'bg-orange-100 text-orange-800',
      Critical: 'bg-red-100 text-red-800'
    }
    return colors[severity] || 'bg-gray-100'
  }

  if (isLoading) return <div className="text-center p-8">Loading bugs...</div>

  const bugs = bugsData?.bugs || []
  const total = bugsData?.total || 0
  const totalPages = Math.ceil(total / limit)

  const returnUrl = `/bugs${searchParams.toString() ? `?${searchParams.toString()}` : ''}`

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">All Bugs ({total})</h2>

      {/* Filters */}
      <div className="bg-white p-4 rounded shadow mb-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              className="border rounded px-3 py-2"
              value={filters.status_id}
              onChange={e => setFilters({...filters, status_id: e.target.value})}
            >
              <option value="">All Statuses</option>
              {statuses?.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Product</label>
            <select
              className="border rounded px-3 py-2"
              value={filters.product_id}
              onChange={e => setFilters({...filters, product_id: e.target.value})}
            >
              <option value="">All Products</option>
              {products?.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Severity</label>
            <select
              className="border rounded px-3 py-2"
              value={filters.severity}
              onChange={e => setFilters({...filters, severity: e.target.value})}
            >
              <option value="">All Severities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <button
            onClick={clearFilters}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Bug Table */}
      <div className="bg-white rounded shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('created_at')}
                >
                  ID {sort.by === 'created_at' && (sort.order === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">Product</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Summary</th>
                <th
                  className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('severity')}
                >
                  Severity {sort.by === 'severity' && (sort.order === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                <th
                  className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('created_at')}
                >
                  Date {sort.by === 'created_at' && (sort.order === 'asc' ? '↑' : '↓')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {bugs.map(bug => (
                <tr key={bug.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    <Link to={`/bugs/${bug.id}`} state={{ returnUrl }} className="text-blue-600 hover:underline">
                      #{bug.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm">{bug.product?.name}</td>
                  <td className="px-4 py-3 text-sm">
                    <Link to={`/bugs/${bug.id}`} state={{ returnUrl }} className="hover:text-blue-600">
                      {bug.summary}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(bug.severity)}`}>
                      {bug.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {isAuthenticated ? (
                      <select
                        className="text-xs font-medium rounded px-2 py-1 border cursor-pointer"
                        style={{
                          backgroundColor: bug.status?.color + '20',
                          color: bug.status?.color
                        }}
                        value={bug.status_id}
                        onChange={e => handleStatusChange(bug.id, e.target.value)}
                      >
                        {statuses?.map(s => (
                          <option key={s.id} value={s.id} style={{ color: '#000', backgroundColor: '#fff' }}>{s.name}</option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{
                          backgroundColor: bug.status?.color + '20',
                          color: bug.status?.color
                        }}
                      >
                        {bug.status?.name}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(bug.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {bugs.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No bugs found matching your filters.
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default BugList
