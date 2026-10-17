import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

export function Icon({ d, size = 18, stroke = 1.8, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

export const WARN_ICON = 'M12 3l10 18H2zM12 10v5M12 18h.01'
export const CHECK_ICON = 'M5 12l5 5 9-10'

export function PageHead({ title, sub, children }) {
  return (
    <header className="page-head">
      <div>
        <h1>{title}</h1>
        {sub ? <div className="sub">{sub}</div> : null}
      </div>
      {children ? <div className="head-actions">{children}</div> : null}
    </header>
  )
}

export function Card({ title, right, children, className = '' }) {
  return (
    <section className={`card ${className}`}>
      {title || right ? (
        <div className="card-head">
          {title ? <h2>{title}</h2> : <span />}
          {right}
        </div>
      ) : null}
      {children}
    </section>
  )
}

export function Stat({ label, value, sub, tone }) {
  return (
    <div className="stat">
      <div className="label">{label}</div>
      <div className={`value ${tone || ''}`}>{value}</div>
      {sub ? <div className="subtext">{sub}</div> : null}
    </div>
  )
}

export function Pill({ tone = 'muted', dot = true, children }) {
  return (
    <span className={`pill ${tone}`}>
      {dot ? <span className="dot" /> : null}
      {children}
    </span>
  )
}

export function Segmented({ value, onChange, options }) {
  return (
    <div className="segmented" role="group">
      {options.map((o) => (
        <button key={o.value} type="button" className={o.value === value ? 'on' : ''} aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Switch({ on, onChange, label, big = false, disabled = false }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} disabled={disabled}
      className={`switch ${big ? 'big' : ''} ${on ? 'on' : ''}`} onClick={() => onChange(!on)} />
  )
}

export function Stepper({ value, onChange, min, max, step = 1, format = (v) => v, changed = false }) {
  const bump = (dir) => {
    const next = Math.round((value + dir * step) * 1e6) / 1e6
    onChange(Math.min(max, Math.max(min, next)))
  }
  return (
    <div className="stepper">
      <button type="button" className="icon-btn" aria-label="Decrease" disabled={value <= min} onClick={() => bump(-1)}>−</button>
      <div className={`val ${changed ? 'changed' : ''}`} aria-live="polite">{format(value)}</div>
      <button type="button" className="icon-btn" aria-label="Increase" disabled={value >= max} onClick={() => bump(1)}>+</button>
    </div>
  )
}

export function Notice({ tone = 'info', children }) {
  const color = tone === 'warn' ? '#F5B94A' : tone === 'error' ? '#FF7B6B' : '#7C9CFF'
  const d = tone === 'info' ? 'M12 8h.01M11 12h1v5h1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' : WARN_ICON
  return (
    <div className={`notice ${tone}`} role={tone === 'error' ? 'alert' : undefined}>
      <Icon d={d} size={17} stroke={2} color={color} />
      <div>{children}</div>
    </div>
  )
}

export function Confirm({ title, children, confirmLabel, tone = 'danger', busy, onCancel, onConfirm }) {
  const cancelRef = useRef(null)
  useEffect(() => {
    cancelRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && onCancel()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])
  return (
    <div className="overlay" onClick={onCancel}>
      <div className="modal" role="alertdialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <div className="soft">{children}</div>
        <div className="btns">
          <button ref={cancelRef} type="button" className="btn" onClick={onCancel} disabled={busy}>Cancel</button>
          <button type="button" className={`btn ${tone === 'danger' ? 'danger' : 'primary'}`} onClick={onConfirm} disabled={busy}>
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

const ToastCtx = createContext(() => {})
export const useToast = () => useContext(ToastCtx)

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const timer = useRef(null)
  const show = useCallback((message, kind = 'ok') => {
    setToast({ message, kind })
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setToast(null), kind === 'error' ? 7000 : 3500)
  }, [])
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {toast ? <div className={`toast ${toast.kind}`} role="status">{toast.message}</div> : null}
    </ToastCtx.Provider>
  )
}
