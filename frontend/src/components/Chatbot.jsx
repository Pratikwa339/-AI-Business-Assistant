import { useState, useRef, useEffect } from "react"
import { API } from "../api"

const QUICK_QUESTIONS = [
  "What courses does Codenixia offer?",
  "Tell me about the AI internship",
  "How can AI help my business?",
  "What is your pricing model?",
]

/* ── Simple markdown-to-JSX renderer ── */
function renderMarkdown(text) {
  if (!text) return null
  const lines = text.split('\n')
  const elements = []
  let listItems = []
  let listType = null

  const flushList = () => {
    if (listItems.length > 0) {
      const Tag = listType === 'ol' ? 'ol' : 'ul'
      elements.push(<Tag key={`list-${elements.length}`}>{listItems}</Tag>)
      listItems = []
      listType = null
    }
  }

  lines.forEach((line, i) => {
    const trimmed = line.trim()
    if (!trimmed) { flushList(); return }

    // Bullet list
    if (/^[-*•]\s/.test(trimmed)) {
      listType = 'ul'
      listItems.push(<li key={i} dangerouslySetInnerHTML={{ __html: inlineFormat(trimmed.replace(/^[-*•]\s/, '')) }} />)
      return
    }
    // Numbered list
    if (/^\d+[.)]\s/.test(trimmed)) {
      listType = 'ol'
      listItems.push(<li key={i} dangerouslySetInnerHTML={{ __html: inlineFormat(trimmed.replace(/^\d+[.)]\s/, '')) }} />)
      return
    }

    flushList()
    // Heading
    if (trimmed.startsWith('### ')) {
      elements.push(<strong key={i} style={{ display: 'block', marginTop: 8 }}>{trimmed.slice(4)}</strong>)
    } else if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
      elements.push(<strong key={i} style={{ display: 'block', marginTop: 8 }}>{trimmed.replace(/^#+\s/, '')}</strong>)
    } else {
      elements.push(<p key={i} dangerouslySetInnerHTML={{ __html: inlineFormat(trimmed) }} />)
    }
  })
  flushList()
  return elements
}

function inlineFormat(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
}

function Chatbot() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  const sendMessage = async (text) => {
    const msg = (text || input).trim()
    if (!msg || loading) return

    setMessages(prev => [...prev, { role: "user", content: msg }])
    setInput("")
    setLoading(true)

    try {
      const res = await API.post("/chat", { message: msg })
      setMessages(prev => [...prev, { role: "bot", content: res.data.reply }])
    } catch {
      setMessages(prev => [...prev, { role: "bot", content: "Sorry, I encountered an error. Please try again." }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div>
      <div className="section-header">
        <div className="section-title">🤖 AI Business Assistant</div>
        <div className="section-desc">Ask anything about our courses, internships, or business solutions</div>
      </div>

      <div className="chat-container">
        <div className="chat-messages">
          {messages.length === 0 && !loading && (
            <div className="chat-welcome">
              <div className="chat-welcome-icon">💬</div>
              <div className="chat-welcome-title">How can I help you today?</div>
              <div className="chat-welcome-desc">
                Ask me about courses, internships, business automation, or anything tech-related.
              </div>
              <div className="quick-questions">
                {QUICK_QUESTIONS.map((q, i) => (
                  <button key={i} className="quick-q" onClick={() => sendMessage(q)}>{q}</button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i}>
              <div className={`chat-label`} style={{ textAlign: m.role === 'user' ? 'right' : 'left' }}>
                {m.role === 'user' ? 'You' : 'AI Assistant'}
              </div>
              <div className={`chat-bubble ${m.role}`}>
                {m.role === 'bot' ? renderMarkdown(m.content) : m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="typing-indicator">
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-row">
          <input
            className="form-input"
            placeholder="Type your message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button className="btn btn-primary" onClick={() => sendMessage()} disabled={loading || !input.trim()}>
            {loading ? <div className="spinner"></div> : "Send"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Chatbot