import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-lg', headerActions }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-sm animate-in fade-in duration-300"
        style={{ background: 'var(--border-glow, rgba(5, 15, 25, 0.8))' }}
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        className={`relative w-full ${maxWidth} rounded-2xl shadow-2xl p-0 overflow-hidden animate-scale-in flex flex-col max-h-[90vh]`}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between flex-shrink-0"
          style={{
            background: 'var(--grad-header)',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <h3
            className="text-sm font-black uppercase tracking-widest"
            style={{ color: 'var(--text-main)' }}
          >
            {title}
          </h3>
          <div className="flex items-center gap-3">
            {headerActions}
            <div className="w-[1px] h-4 bg-[var(--border-color)] mx-1" />
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition-all"
              style={{ color: 'var(--text-dim)' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'var(--nav-hover)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-dim)'; e.currentTarget.style.background = ''; }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div
          className="p-4 md:p-8 overflow-y-auto custom-scrollbar"
          style={{ color: 'var(--text-main)', background: 'transparent' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
