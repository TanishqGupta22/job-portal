import React, { useContext, useMemo, useRef, useState } from 'react';
import { AuthContext } from '../../context/AuthContext.jsx';
import { resendOTP } from '../../services/authService';

export default function OTPVerification({ email, onVerified }) {
  const { verify } = useContext(AuthContext);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [counter, setCounter] = useState(60);
  const inputsRef = useRef([]);

  React.useEffect(() => {
    const t = setInterval(() => setCounter((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  const otp = useMemo(() => code.join(''), [code]);

  const handleChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...code];
    next[idx] = val;
    setCode(next);
    if (val && idx < 5) inputsRef.current[idx + 1]?.focus();
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await verify({ email, otp });
      if (onVerified) onVerified();
    } catch (e) {
      setError(e?.response?.data?.message || 'Verification failed');
    }
  };

  const onResend = async () => {
    if (counter > 0) return;
    try {
      await resendOTP(email);
      setCounter(60);
    } catch (_) {}
  };

  return (
    <form onSubmit={submit} className="card auth-card">
      <h2>Verify your email</h2>
      <p>Enter the 6-digit code sent to {email}</p>
      {error && <div className="error">{error}</div>}
      <div className="otp">
        {code.map((v, idx) => (
          <input
            key={idx}
            ref={(el) => (inputsRef.current[idx] = el)}
            inputMode="numeric"
            maxLength={1}
            value={v}
            onChange={(e) => handleChange(idx, e.target.value)}
          />
        ))}
      </div>
      <button type="submit" disabled={otp.length !== 6}>Verify</button>
      <button type="button" className="ghost" onClick={onResend} disabled={counter > 0}>
        Resend OTP {counter > 0 ? `(${counter})` : ''}
      </button>
      <p className="muted"><a href="/login" className="link">Back to login</a></p>
    </form>
  );
}

