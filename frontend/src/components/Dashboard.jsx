import { useEffect, useState } from "react"
import { API } from "../api"

function Dashboard({ showToast }) {
  const [leads, setLeads] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [leadsRes, statsRes] = await Promise.all([
        API.get("/leads"),
        API.get("/stats"),
      ])
      setLeads(leadsRes.data)
      setStats(statsRes.data)
    } catch {
      showToast?.("Failed to load dashboard data", "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleDelete = async (id) => {
    if (!confirm("Delete this lead?")) return
    try {
      await API.delete(`/leads/${id}`)
      showToast?.("Lead deleted")
      fetchData()
    } catch {
      showToast?.("Failed to delete lead", "error")
    }
  }

  const handleStatusChange = async (id, status) => {
    try {
      await API.patch(`/leads/${id}/status`, { status })
      showToast?.(`Status updated to ${status}`)
      fetchData()
    } catch {
      showToast?.("Failed to update status", "error")
    }
  }

  const exportCSV = () => {
    window.open(`${API.defaults.baseURL}/leads/export`, '_blank')
  }

  const formatDate = (iso) => {
    if (!iso) return "—"
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  const badgeClass = (status) => {
    const map = { new: 'badge-new', contacted: 'badge-contacted', converted: 'badge-converted' }
    return `badge ${map[status] || 'badge-new'}`
  }

  if (loading) {
    return (
      <div className="empty-state">
        <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }}></div>
        <div className="empty-title" style={{ marginTop: 16 }}>Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="section-header">
        <div className="section-title">📊 Admin Dashboard</div>
        <div className="section-desc">Monitor leads, track conversions, and manage your pipeline</div>
      </div>

      {/* ── Stats ── */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📥</div>
            <div className="stat-value">{stats.total_leads}</div>
            <div className="stat-label">Total Leads</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🕐</div>
            <div className="stat-value">{stats.leads_today}</div>
            <div className="stat-label">Today</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-value">{stats.leads_this_week}</div>
            <div className="stat-label">This Week</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-value">{stats.conversion_rate}%</div>
            <div className="stat-label">Conversion Rate</div>
          </div>
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="table-toolbar">
        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
          {leads.length} lead{leads.length !== 1 ? 's' : ''} total
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={fetchData}>🔄 Refresh</button>
          <button className="btn btn-ghost btn-sm" onClick={exportCSV}>📥 Export CSV</button>
        </div>
      </div>

      {/* ── Table ── */}
      {leads.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <div className="empty-title">No leads yet</div>
          <div className="empty-desc">Captured leads will appear here. Try submitting one from the Lead Capture tab!</div>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map(lead => (
                <tr key={lead.id}>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{lead.name}</td>
                  <td>{lead.email}</td>
                  <td>{lead.phone}</td>
                  <td>
                    <select
                      className={badgeClass(lead.status)}
                      value={lead.status}
                      onChange={e => handleStatusChange(lead.id, e.target.value)}
                      style={{
                        border: 'none', cursor: 'pointer',
                        fontFamily: 'var(--font-family)',
                        outline: 'none',
                      }}
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="converted">Converted</option>
                    </select>
                  </td>
                  <td style={{ fontSize: 'var(--font-size-xs)' }}>{formatDate(lead.created_at)}</td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm btn-icon"
                      onClick={() => handleDelete(lead.id)}
                      title="Delete lead"
                    >🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default Dashboard