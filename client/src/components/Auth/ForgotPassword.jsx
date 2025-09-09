import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { forgotPassword } from '../../services/authService';

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
});

export default function ForgotPassword() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: yupResolver(schema) });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const onSubmit = async ({ email }) => {
    setError('');
    setMessage('');
    try {
      await forgotPassword(email);
      setMessage('If that email exists, a reset link was sent.');
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to request reset');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card auth-card" aria-label="forgot-password-form">
      <h2>Forgot password</h2>
      {message && <div className="success" role="status">{message}</div>}
      {error && <div className="error" role="alert">{error}</div>}
      <label htmlFor="email">Email</label>
      <input id="email" type="email" placeholder="you@example.com" {...register('email')} aria-invalid={!!errors.email} aria-describedby="email-error" />
      {errors.email && <span id="email-error" className="hint">{errors.email.message}</span>}
      <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Sending…' : 'Send reset link'}</button>
      <p className="muted"><a href="/login" className="link">Back to login</a></p>
    </form>
  );
}


