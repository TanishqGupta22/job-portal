import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { resetPassword } from '../../services/authService';

const schema = yup.object({
  password: yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Include uppercase, lowercase, and number')
    .required('Password is required'),
  confirm: yup.string().oneOf([yup.ref('password')], 'Passwords do not match').required('Confirm your password'),
});

export default function ResetPassword({ token }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: yupResolver(schema) });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const onSubmit = async ({ password }) => {
    setError('');
    setMessage('');
    try {
      await resetPassword(token, password);
      setMessage('Password has been reset. You may now log in.');
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to reset password');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card auth-card" aria-label="reset-password-form">
      <h2>Set a new password</h2>
      {message && <div className="success" role="status">{message}</div>}
      {error && <div className="error" role="alert">{error}</div>}

      <label htmlFor="password">New password</label>
      <input id="password" type="password" {...register('password')} aria-invalid={!!errors.password} aria-describedby="password-error" />
      {errors.password && <span id="password-error" className="hint">{errors.password.message}</span>}

      <label htmlFor="confirm">Confirm password</label>
      <input id="confirm" type="password" {...register('confirm')} aria-invalid={!!errors.confirm} aria-describedby="confirm-error" />
      {errors.confirm && <span id="confirm-error" className="hint">{errors.confirm.message}</span>}

      <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Updating…' : 'Update password'}</button>
      <p className="muted"><a href="/login" className="link">Back to login</a></p>
    </form>
  );
}


