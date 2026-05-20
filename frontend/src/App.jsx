import { useState } from 'react'
import './App.css'

import Chatbot from './components/Chatbot'
import LeadForm from './components/LeadForm'
import Dashboard from './components/Dashboard'

const TABS = [
  { id: 'chat', label: 'AI Assistant', icon: '🤖' },
  { id: 'leads', label: 'Lead Capture', icon: '📋' },
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
]

function App() {
  const [activeTab, setActiveTab] = useState('chat')
  const [toasts, setToasts] = useState([])

  const showToast = (message, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }

  return (
    <>
      {/* ── Navbar ── */}
      <nav className="navbar">
        <div className="navbar-brand">
          <div className="navbar-logo">C</div>
          <div>
            <div className="navbar-title">AI Business Assistant</div>
            <div className="navbar-subtitle">POWERED BY CODENIXIA</div>
          </div>
        </div>
        <div className="navbar-status">System Online</div>
      </nav>

      {/* ── Tabs ── */}
      <div className="tab-nav">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <main className="main-content">
        <div className="tab-panel">
          {activeTab === 'chat' && <Chatbot />}
          {activeTab === 'leads' && <LeadForm showToast={showToast} />}
          {activeTab === 'dashboard' && <Dashboard showToast={showToast} />}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="footer">
        Built with ❤️ by <span className="footer-accent">Pratik Patil</span> • Codenixia AI Internship Assessment 2026
      </footer>

      {/* ── Toasts ── */}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map(t => (
            <div key={t.id} className={`toast toast-${t.type}`}>
              {t.type === 'success' ? '✅' : '❌'} {t.message}
            </div>
          ))}
        </div>
      )}
    </>
  )
}

export default App