import React, { useContext, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { AuthContext } from '../../context/AuthContext.jsx';

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(8, 'Min 8 characters').required('Password is required'),
  remember: yup.boolean(),
});

export default function LoginForm({ onSuccess }) {
  const { login } = useContext(AuthContext);
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async (values) => {
    setError('');
    try {
      await login({ email: values.email, password: values.password });
      if (onSuccess) onSuccess();
    } catch (e) {
      setError(e?.response?.data?.message || 'Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card auth-card">
      <h2>Login</h2>
      {error && <div className="error">{error}</div>}
      <label>Email</label>
      <input type="email" placeholder="you@example.com" {...register('email')} />
      {errors.email && <span className="hint">{errors.email.message}</span>}

      <label>Password</label>
      <input type="password" placeholder="••••••••" {...register('password')} />
      {errors.password && <span className="hint">{errors.password.message}</span>}

      <div className="row-between">
        <label><input type="checkbox" {...register('remember')} /> Remember me</label>
      </div>

      <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Logging in…' : 'Login'}</button>
      <p className="muted">Don't have an account? <a href="/register" className="link">Register</a></p>
    </form>
  );
}

