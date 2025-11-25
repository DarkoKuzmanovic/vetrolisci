import React from 'react'
import './Toast.css'

const ToastStack = ({ toasts, onDismiss }) => {
  if (!toasts?.length) return null

  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.type || 'info'}`}>
          <span className="toast-dot" aria-hidden="true" />
          <div className="toast-copy">
            <p>{toast.message}</p>
            {toast.subtext && <small>{toast.subtext}</small>}
          </div>
          <button className="toast-close" onClick={() => onDismiss(toast.id)} aria-label="Dismiss notification">
            ×
          </button>
        </div>
      ))}
    </div>
  )
}

export default ToastStack
