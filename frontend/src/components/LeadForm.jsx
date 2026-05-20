import { useState } from "react"
import { API } from "../api"

function LeadForm({ showToast }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = "Name is required"
    if (!form.email.trim()) errs.email = "Email is required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Invalid email format"
    if (!form.phone.trim()) errs.phone = "Phone is required"
    else if (!/^[0-9+\-\s()]{7,15}$/.test(form.phone)) errs.phone = "Invalid phone number"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate() || loading) return

    setLoading(true)
    try {
      await API.post("/lead", form)
      setSuccess(true)
      showToast?.("Lead submitted successfully!")
      setTimeout(() => {
        setSuccess(false)
        setForm({ name: "", email: "", phone: "", message: "" })
      }, 3000)
    } catch {
      showToast?.("Failed to submit lead. Please try again.", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <div className="section-header">
        <div className="section-title">📋 Lead Capture Form</div>
        <div className="section-desc">Submit your details and we'll get back to you within 24 hours</div>
      </div>

      {success && (
        <div className="success-overlay">
          <div className="success-check">✓</div>
          <div className="success-title">Submitted Successfully!</div>
          <div className="success-desc">We'll reach out to you shortly.</div>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ maxWidth: 520 }}>
        <div className="form-group">
          <label className="form-label">Full Name *</label>
          <input
            className={`form-input ${errors.name ? 'error' : ''}`}
            placeholder="Enter your full name"
            value={form.name}
            onChange={e => handleChange('name', e.target.value)}
          />
          {errors.name && <div className="form-error">{errors.name}</div>}
        </div>

        <div className="form-group">
          <label className="form-label">Email Address *</label>
          <input
            className={`form-input ${errors.email ? 'error' : ''}`}
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={e => handleChange('email', e.target.value)}
          />
          {errors.email && <div className="form-error">{errors.email}</div>}
        </div>

        <div className="form-group">
          <label className="form-label">Phone Number *</label>
          <input
            className={`form-input ${errors.phone ? 'error' : ''}`}
            placeholder="+91 9876543210"
            value={form.phone}
            onChange={e => handleChange('phone', e.target.value)}
          />
          {errors.phone && <div className="form-error">{errors.phone}</div>}
        </div>

        <div className="form-group">
          <label className="form-label">Message (Optional)</label>
          <textarea
            className="form-textarea"
            placeholder="Tell us about your interest..."
            value={form.message}
            onChange={e => handleChange('message', e.target.value)}
          />
        </div>

        <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', padding: '14px' }}>
          {loading ? <><div className="spinner"></div> Submitting...</> : "🚀 Submit Lead"}
        </button>
      </form>
    </div>
  )
}

export default LeadForm