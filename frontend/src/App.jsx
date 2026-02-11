import { Routes, Route, Link } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import BugSubmission from './components/BugSubmission'
import BugList from './components/BugList'
import BugDetail from './components/BugDetail'
import AdminPanel from './components/AdminPanel'

function App() {
  const { isAuthenticated, logout, setShowLoginModal } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-blue-600 text-white p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Bug Tracker</h1>
          <div className="flex items-center space-x-4">
            <Link to="/" className="hover:underline">Submit Bug</Link>
            <Link to="/bugs" className="hover:underline">All Bugs</Link>
            <Link to="/admin" className="hover:underline">Admin</Link>
            {isAuthenticated ? (
              <button onClick={logout} className="hover:underline text-blue-200">Logout</button>
            ) : (
              <button onClick={() => setShowLoginModal(true)} className="hover:underline text-blue-200">Login</button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4">
        <Routes>
          <Route path="/" element={<BugSubmission />} />
          <Route path="/bugs" element={<BugList />} />
          <Route path="/bugs/:id" element={<BugDetail />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </main>

      <footer className="text-center text-xs text-gray-400 py-4">v1.1.0</footer>
    </div>
  )
}

export default App
