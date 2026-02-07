import { useState } from 'react'
import { useQuery } from 'react-query'
import { useDropzone } from 'react-dropzone'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || ''

function BugSubmission() {
  const [formData, setFormData] = useState({
    product_id: '',
    summary: '',
    description: '',
    severity: 'Medium',
    reporter_name: '',
    reporter_email: ''
  })
  const [files, setFiles] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState(null)

  const { data: products, isLoading: productsLoading } = useQuery('products', () =>
    axios.get(`${API_URL}/api/products`).then(res => res.data)
  )

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': ['.png', '.jpg', '.jpeg'] },
    maxSize: 5 * 1024 * 1024,
    maxFiles: 5,
    onDrop: acceptedFiles => setFiles(acceptedFiles)
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const data = new FormData()
      Object.keys(formData).forEach(key => {
        if (formData[key]) data.append(key, formData[key])
      })
      files.forEach(file => data.append('screenshots', file))

      await axios.post(`${API_URL}/api/bugs`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setSuccess('Bug submitted successfully!')
      setFormData({
        product_id: '',
        summary: '',
        description: '',
        severity: 'Medium',
        reporter_name: '',
        reporter_email: ''
      })
      setFiles([])
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit bug')
    } finally {
      setSubmitting(false)
    }
  }

  if (productsLoading) return <div className="text-center p-8">Loading...</div>

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Submit a Bug</h2>
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Product *</label>
          <select
            required
            className="w-full border rounded px-3 py-2"
            value={formData.product_id}
            onChange={e => setFormData({...formData, product_id: e.target.value})}
          >
            <option value="">Select a product</option>
            {products?.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Summary *</label>
          <input
            type="text"
            required
            maxLength={200}
            className="w-full border rounded px-3 py-2"
            placeholder="Brief description of the bug"
            value={formData.summary}
            onChange={e => setFormData({...formData, summary: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description *</label>
          <textarea
            required
            rows={5}
            className="w-full border rounded px-3 py-2"
            placeholder="Detailed description of the bug, steps to reproduce, expected vs actual behavior"
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Severity</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={formData.severity}
            onChange={e => setFormData({...formData, severity: e.target.value})}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Screenshots</label>
          <div
            {...getRootProps()}
            className="border-2 border-dashed border-gray-300 rounded px-4 py-8 text-center cursor-pointer hover:border-blue-500"
          >
            <input {...getInputProps()} />
            <p>Drag & drop screenshots here, or click to select</p>
            <p className="text-sm text-gray-500">Max 5 files, 5MB each (PNG, JPG)</p>
          </div>
          {files.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Selected files ({files.length}):</p>
              <div className="flex flex-wrap gap-3">
                {files.map((file, i) => (
                  <div key={i} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-20 h-20 object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                      title="Remove"
                    >
                      ×
                    </button>
                    <p className="text-xs text-gray-500 mt-1 max-w-[80px] truncate" title={file.name}>
                      {file.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Your Name (optional)</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={formData.reporter_name}
              onChange={e => setFormData({...formData, reporter_name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Your Email (optional)</label>
            <input
              type="email"
              className="w-full border rounded px-3 py-2"
              value={formData.reporter_email}
              onChange={e => setFormData({...formData, reporter_email: e.target.value})}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit Bug'}
        </button>
      </form>
    </div>
  )
}

export default BugSubmission
