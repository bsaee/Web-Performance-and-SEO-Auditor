// frontend/src/App.jsx
import { useState } from 'react'

function App() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleAudit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('http://127.0.0.1:8000/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url })
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ success: false, message: "Could not reach backend server." })
    } finally {
      setLoading(false)
    }
  }

  // Helper function to color code our statuses
  const getStatusClass = (status) => {
    if (status === 'Good') return 'bg-green-50 border-green-200 text-green-700'
    return 'bg-amber-50 border-amber-200 text-amber-700'
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-sm p-8 mt-10">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Web Performance & SEO Auditor</h1>
        <p className="text-gray-500 mt-1 mb-8 text-sm">Internal QA & Optimization Diagnostic Dashboard</p>
        
        <form onSubmit={handleAudit} className="flex gap-3 mb-8">
          <input 
            type="url" 
            required
            placeholder="https://example.com" 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-gray-800"
          />
          <button 
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-medium transition disabled:bg-blue-400 shadow-sm"
          >
            {loading ? 'Analyzing Site...' : 'Analyze URL'}
          </button>
        </form>

        {/* Error Handling */}
        {result && !result.success && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl">
            <p className="font-semibold">Audit Failed</p>
            <p className="text-sm mt-1">{result.message}</p>
          </div>
        )}

        {/* Structured Report UI */}
        {result && result.success && result.report && (
          <div className="space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-lg font-bold text-gray-800">Audit Results for:</h2>
              <p className="text-sm text-blue-600 truncate font-mono mt-1">{result.url}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title Card */}
              <div className={`p-5 rounded-xl border ${getStatusClass(result.report.title.status)}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Title Tag</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-white shadow-xs">
                    {result.report.title.status}
                  </span>
                </div>
                <p className="text-sm font-semibold break-words">
                  "{result.report.title.value || 'N/A'}"
                </p>
                <p className="text-xs mt-3 opacity-90">{result.report.title.message}</p>
              </div>

              {/* Description Card */}
              <div className={`p-5 rounded-xl border ${getStatusClass(result.report.description.status)}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Meta Description</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-white shadow-xs">
                    {result.report.description.status}
                  </span>
                </div>
                <p className="text-sm font-semibold truncate">
                  {result.report.description.value || 'Missing description'}
                </p>
                <p className="text-xs mt-3 opacity-90">{result.report.description.message}</p>
              </div>

              {/* H1 Count Card */}
              <div className={`p-5 rounded-xl border ${getStatusClass(result.report.h1_count.status)}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">H1 Headers</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-white shadow-xs">
                    {result.report.h1_count.status}
                  </span>
                </div>
                <p className="text-2xl font-black">
                  {result.report.h1_count.value}
                </p>
                <p className="text-xs mt-3 opacity-90">{result.report.h1_count.message}</p>
              </div>

              {/* Image Optimization Card */}
              <div className={`p-5 rounded-xl border ${getStatusClass(result.report.images.status)}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Image Alt & Formats</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-white shadow-xs">
                    {result.report.images.status}
                  </span>
                </div>
                <p className="text-2xl font-black">
                  {result.report.images.value}
                </p>
                <p className="text-xs mt-3 opacity-90">{result.report.images.message}</p>
              </div>

              {/* Link Health Validation Card */}
              <div className={`p-5 rounded-xl border ${getStatusClass(result.report.links.status)}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Hyperlink Health</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-white shadow-xs">
                    {result.report.links.status}
                  </span>
                </div>
                <p className="text-2xl font-black">
                  {result.report.links.value}
                </p>
                <p className="text-xs mt-3 opacity-90">{result.report.links.message}</p>
              </div>

              {/* Google Performance Metrics Card */}
              <div className={`p-5 rounded-xl border ${getStatusClass(result.report.performance.status)}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Page Speed Speed Score</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-white shadow-xs">
                    {result.report.performance.status}
                  </span>
                </div>
                <p className="text-2xl font-black">
                  {result.report.performance.value}
                </p>
                <p className="text-xs mt-3 opacity-90">{result.report.performance.message}</p>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App