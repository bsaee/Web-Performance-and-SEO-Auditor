// frontend/src/App.jsx
import { useState, useEffect } from 'react'

function App() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [togglingSave, setTogglingSave] = useState(false)

  // Fetch the pinned audit logs from the database history on component load
  const fetchHistory = async () => {
    try {
      const response = await fetch('https://web-performance-and-seo-auditor.onrender.com/api/history')
      const data = await response.json()
      setHistory(data)
    } catch (error) {
      console.error("Error fetching audit history log:", error)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  const handleAudit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('https://web-performance-and-seo-auditor.onrender.com/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url })
      })
      const data = await response.json()
      setResult(data)
      // If this URL was fetched from the cache and was already pinned, it will let us know
    } catch (error) {
      setResult({ success: false, message: "Could not reach backend server." })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleSave = async () => {
    if (!result || !result.log_id) return
    setTogglingSave(true)

    try {
      const response = await fetch('https://web-performance-and-seo-auditor.onrender.com/api/history/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ log_id: result.log_id })
      })
      const data = await response.json()
      if (data.success) {
        // Update local state display so the user sees the button change instantly
        setResult(prev => ({ ...prev, is_saved: data.is_saved }))
        // Refresh the sidebar history list log
        fetchHistory()
      }
    } catch (error) {
      console.error("Failed to toggle pin state:", error)
    } finally {
      setTogglingSave(false)
    }
  }

  const getStatusClass = (status) => {
    if (status === 'Good') return 'bg-green-50 border-green-200 text-green-700'
    return 'bg-amber-50 border-amber-200 text-amber-700'
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      
      {/* ─── LEFT SIDEBAR: SHARED RECENT HISTORY LOG ─── */}
      <div className="w-80 bg-white border-r border-gray-200 p-6 flex flex-col hidden md:flex">
        <h2 className="text-xl font-bold text-gray-800 tracking-tight">Portal Dashboard</h2>
        <p className="text-xs text-gray-400 mt-0.5 mb-6 font-medium">Shared Team Audits Log</p>
        
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">📌 Pinned Audits ({history.length})</h3>
          
          {history.length === 0 ? (
            <div className="text-xs text-gray-400 italic p-4 border border-dashed border-gray-200 rounded-xl text-center bg-gray-50">
              No pinned reports yet. Run an audit and pin it to save it here!
            </div>
          ) : (
            history.map((log) => (
              <div 
                key={log.id} 
                className="p-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-xl transition shadow-2xs group flex justify-between items-start gap-2"
              >
                <div onClick={() => setUrl(log.url)} className="flex-1 cursor-pointer min-w-0">
                  <p className="text-xs font-bold text-gray-700 truncate group-hover:text-blue-700">{log.url}</p>
                  <div className="flex justify-between items-center mt-2 text-[10px] text-gray-400">
                    <span>{log.timestamp}</span>
                    <span className="bg-white px-1.5 py-0.5 rounded border border-gray-200 font-bold text-gray-600">{log.perf_value}</span>
                  </div>
                </div>
                
                {/* Quick Inline Delete Action Button */}
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation(); // Prevents clicking the trash can from typing the URL in the input box
                    try {
                      const response = await fetch('https://web-performance-and-seo-auditor.onrender.com/api/history/toggle', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ log_id: log.id })
                      });
                      const data = await response.json();
                      if (data.success) {
                        fetchHistory(); // Instantly re-render sidebar list cleanly
                        if (result && result.log_id === log.id) {
                          setResult(prev => ({ ...prev, is_saved: false }));
                        }
                      }
                    } catch (err) {
                      console.error("Failed to delete log item:", err);
                    }
                  }}
                  className="text-gray-300 hover:text-red-500 p-1 rounded-md transition opacity-0 group-hover:opacity-100 self-center"
                  title="Remove from history"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ─── MAIN WORKSPACE PANEL ─── */}
      <div className="flex-1 p-8 overflow-y-auto flex justify-center">
        <div className="max-w-4xl w-full mt-4">
          
          {/* Header Banner */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Web Performance & SEO Auditor</h1>
            <p className="text-gray-500 mt-1 text-sm">Automated Asynchronous Optimization & Hyperlink Diagnostic Suite</p>
          </div>

          {/* Form Processing Entry */}
          <form onSubmit={handleAudit} className="flex gap-3 mb-8 bg-white p-3 rounded-2xl shadow-xs border border-gray-200">
            <input 
              type="url" 
              required
              placeholder="Enter target url to profile (e.g., https://python.org)" 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 text-sm font-medium"
            />
            <button 
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold text-sm transition disabled:bg-blue-400 shadow-xs"
            >
              {loading ? 'Analyzing Pipeline...' : 'Run Diagnostics'}
            </button>
          </form>

          {/* Error Message Box */}
          {result && !result.success && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl shadow-xs animate-pulse">
              <p className="font-semibold text-sm">Execution Interrupted</p>
              <p className="text-xs mt-1">{result.message}</p>
            </div>
          )}

          {/* Detailed Audit Display Report Cards */}
          {result && result.success && result.report && (
            <div className="space-y-6 animate-fade-in">
              
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">Target Profile URL</h2>
                  <p className="text-base font-bold text-blue-600 font-mono truncate mt-1">{result.url}</p>
                </div>
                
                {/* 📌 MANUAL SAVE TOGGLE ACTION BUTTON */}
                <button
                  type="button"
                  onClick={handleToggleSave}
                  disabled={togglingSave}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center border shadow-2xs ${
                    result.is_saved 
                      ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600' 
                      : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
                  }`}
                >
                  {result.is_saved ? '★ Pinned in History' : '☆ Pin to Team History'}
                </button>
              </div>

              {/* Data Grid Displays */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Performance Core Vital metric */}
                <div className={`p-5 rounded-xl border ${getStatusClass(result.report.performance.status)} shadow-2xs`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Page Load Metrics</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-extrabold bg-white shadow-3xs">{result.report.performance.status}</span>
                  </div>
                  <p className="text-2xl font-black">{result.report.performance.value}</p>
                  <p className="text-xs mt-3 opacity-90 leading-relaxed">{result.report.performance.message}</p>
                </div>

                {/* Hyperlink Quality Verification metric */}
                <div className={`p-5 rounded-xl border ${getStatusClass(result.report.links.status)} shadow-2xs`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Hyperlink Health</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-extrabold bg-white shadow-3xs">{result.report.links.status}</span>
                  </div>
                  <p className="text-2xl font-black">{result.report.links.value}</p>
                  <p className="text-xs mt-3 opacity-90 leading-relaxed">{result.report.links.message}</p>
                </div>

                {/* DOM Image Format metric */}
                <div className={`p-5 rounded-xl border ${getStatusClass(result.report.images.status)} shadow-2xs`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Image Asset Auditing</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-extrabold bg-white shadow-3xs">{result.report.images.status}</span>
                  </div>
                  <p className="text-2xl font-black">{result.report.images.value}</p>
                  <p className="text-xs mt-3 opacity-90 leading-relaxed">{result.report.images.message}</p>
                </div>

                {/* Title Tags Validation metric */}
                <div className={`p-5 rounded-xl border ${getStatusClass(result.report.title.status)} shadow-2xs`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Title Element</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-extrabold bg-white shadow-3xs">{result.report.title.status}</span>
                  </div>
                  <p className="text-sm font-bold truncate">"{result.report.title.value || 'N/A'}"</p>
                  <p className="text-xs mt-3 opacity-90 leading-relaxed">{result.report.title.message}</p>
                </div>

                {/* Meta Description Validation metric */}
                <div className={`p-5 rounded-xl border ${getStatusClass(result.report.description.status)} shadow-2xs`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Meta Description</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-extrabold bg-white shadow-3xs">{result.report.description.status}</span>
                  </div>
                  <p className="text-sm font-bold truncate">{result.report.description.value || 'Missing descriptive parameters'}</p>
                  <p className="text-xs mt-3 opacity-90 leading-relaxed">{result.report.description.message}</p>
                </div>

                {/* Document Header Structuring metric */}
                <div className={`p-5 rounded-xl border ${getStatusClass(result.report.h1_count.status)} shadow-2xs`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">H1 Header Hierarchy</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-extrabold bg-white shadow-3xs">{result.report.h1_count.status}</span>
                  </div>
                  <p className="text-2xl font-black">{result.report.h1_count.value}</p>
                  <p className="text-xs mt-3 opacity-90 leading-relaxed">{result.report.h1_count.message}</p>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App