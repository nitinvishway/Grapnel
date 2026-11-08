import React, { useState } from 'react';
import { Anchor, Eye, EyeOff, AlertCircle, Shield, HardDrive } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function LoginWall() {
  const { isConfigured, login, setup, authError } = useAuth();

  // Login form state (1 single input box)
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Setup form state (Master + Guest)
  const [masterPassword, setMasterPassword] = useState('');
  const [guestPassword, setGuestPassword] = useState('');
  const [showSetupPasswords, setShowSetupPasswords] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginPassword.trim()) return;

    setSubmitting(true);
    setLocalError('');
    const result = await login(loginPassword.trim());
    setSubmitting(false);
    if (!result.success) {
      setLocalError(result.error || 'Invalid password');
    }
  };

  const handleSetupSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!masterPassword || masterPassword.trim().length < 3) {
      setLocalError('Master password must be at least 3 characters.');
      return;
    }
    if (guestPassword && guestPassword.trim().length < 3) {
      setLocalError('Guest password must be at least 3 characters.');
      return;
    }
    if (guestPassword && masterPassword.trim() === guestPassword.trim()) {
      setLocalError('Master and Guest passwords must be different.');
      return;
    }

    setSubmitting(true);
    const result = await setup(masterPassword.trim(), guestPassword.trim());
    setSubmitting(false);
    if (!result.success) {
      setLocalError(result.error || 'Setup failed');
    }
  };

  const errorMessage = localError || authError;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0c10',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          background: '#131720',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          padding: '36px 28px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          gap: '22px',
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(255, 69, 69, 0.1)',
              border: '1px solid rgba(255, 69, 69, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ff4545',
              marginBottom: '4px',
            }}
          >
            <Anchor style={{ width: '22px', height: '22px' }} />
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>
            {!isConfigured ? 'Set Up Passwords' : 'Sign In'}
          </h1>
          <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
            {!isConfigured
              ? 'Configure Master access (C, D, E) and optional Guest access (E only).'
              : 'Enter your password to unlock file storage.'}
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.25)',
              color: '#fb7185',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              lineHeight: 1.4,
            }}
          >
            <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ── MODE 1: SETUP SCREEN (Master + Optional Guest) ───────────── */}
        {!isConfigured ? (
          <form
            onSubmit={handleSetupSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '18px', margin: 0 }}
          >
            {/* Master Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: '0.76rem', fontWeight: 600, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Shield style={{ width: '13px', height: '13px', color: '#ff4545' }} />
                  Master Password
                </label>
                <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Unlocks C, D, E</span>
              </div>
              <input
                type={showSetupPasswords ? 'text' : 'password'}
                placeholder="Enter master password"
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                autoFocus
                style={{
                  height: '42px',
                  width: '100%',
                  boxSizing: 'border-box',
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  padding: '0 14px',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  outline: 'none',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(255, 69, 69, 0.6)')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)')}
              />
            </div>

            {/* Guest Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: '0.76rem', fontWeight: 600, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <HardDrive style={{ width: '13px', height: '13px', color: '#22d3ee' }} />
                  Guest Password (Optional)
                </label>
                <span style={{ fontSize: '0.68rem', color: '#64748b' }}>E: drive only</span>
              </div>
              <input
                type={showSetupPasswords ? 'text' : 'password'}
                placeholder="Enter guest password (optional)"
                value={guestPassword}
                onChange={(e) => setGuestPassword(e.target.value)}
                style={{
                  height: '42px',
                  width: '100%',
                  boxSizing: 'border-box',
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  padding: '0 14px',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  outline: 'none',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(34, 211, 238, 0.6)')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)')}
              />
            </div>

            {/* Show Password Toggle */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.74rem',
                color: '#94a3b8',
                cursor: 'pointer',
                userSelect: 'none',
                marginTop: '2px',
              }}
            >
              <input
                type="checkbox"
                checked={showSetupPasswords}
                onChange={(e) => setShowSetupPasswords(e.target.checked)}
                style={{ cursor: 'pointer', accentColor: '#ff4545' }}
              />
              Show passwords
            </label>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              style={{
                height: '42px',
                width: '100%',
                borderRadius: '12px',
                background: '#ff4545',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.84rem',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1,
                boxShadow: '0 4px 14px rgba(255, 69, 69, 0.25)',
                marginTop: '4px',
              }}
            >
              {submitting ? 'Saving...' : 'Save Passwords & Enter'}
            </button>
          </form>
        ) : (
          /* ── MODE 2: LOGIN SCREEN (1 Single Input Box) ───────────────── */
          <form
            onSubmit={handleLoginSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '18px', margin: 0 }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.76rem', fontWeight: 600, color: '#f1f5f9' }}>
                Password
              </label>

              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  autoFocus
                  style={{
                    height: '42px',
                    width: '100%',
                    boxSizing: 'border-box',
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    padding: '0 40px 0 14px',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    outline: 'none',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'rgba(255, 69, 69, 0.6)')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)')}
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px',
                  }}
                >
                  {showLoginPassword ? <EyeOff style={{ width: '16px', height: '16px' }} /> : <Eye style={{ width: '16px', height: '16px' }} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !loginPassword.trim()}
              style={{
                height: '42px',
                width: '100%',
                borderRadius: '12px',
                background: '#ff4545',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.84rem',
                cursor: submitting || !loginPassword.trim() ? 'not-allowed' : 'pointer',
                opacity: submitting || !loginPassword.trim() ? 0.6 : 1,
                boxShadow: '0 4px 14px rgba(255, 69, 69, 0.25)',
                marginTop: '4px',
              }}
            >
              {submitting ? 'Verifying...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* Footer info */}
        <div style={{ textAlign: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '14px' }}>
          <p style={{ fontSize: '0.68rem', color: '#64748b', margin: 0 }}>
            Shared links remain public and do not require this login.
          </p>
        </div>
      </div>
    </div>
  );
}
