import React, { useContext, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { AuthContext } from '../../context/AuthContext.jsx';

const schema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Include uppercase, lowercase, and number')
    .required('Password is required'),
  role: yup.string().oneOf(['job_seeker', 'recruiter']).required('Role is required'),
  terms: yup.boolean().oneOf([true], 'Accept terms to continue'),
});

export default function RegisterForm({ onRegistered }) {
  const { register: apiRegister } = useContext(AuthContext);
  const [error, setError] = useState('');
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({ resolver: yupResolver(schema) });
  const password = watch('password');

  const onSubmit = async (values) => {
    setError('');
    try {
      await apiRegister({ name: values.name, email: values.email, password: values.password, role: values.role });
      if (onRegistered) onRegistered(values.email);
    } catch (e) {
      setError(e?.response?.data?.message || 'Registration failed');
    }
  };

  const strength = password ? Math.min(3, [/[a-z]/, /[A-Z]/, /\d/].filter((r) => r.test(password)).length) : 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card auth-card">
      <h2>Create account</h2>
      {error && <div className="error">{error}</div>}

      <label>Name</label>
      <input type="text" placeholder="Your name" {...register('name')} />
      {errors.name && <span className="hint">{errors.name.message}</span>}

      <label>Email</label>
      <input type="email" placeholder="you@example.com" {...register('email')} />
      {errors.email && <span className="hint">{errors.email.message}</span>}

      <label>Password</label>
      <input type="password" placeholder="••••••••" {...register('password')} />
      {errors.password && <span className="hint">{errors.password.message}</span>}
      <div className="password-strength">
        <div className={`bar ${strength >= 1 ? 'on' : ''}`}></div>
        <div className={`bar ${strength >= 2 ? 'on' : ''}`}></div>
        <div className={`bar ${strength >= 3 ? 'on' : ''}`}></div>
      </div>

      <label>Role</label>
      <div className="roles">
        <label className="role"><input type="radio" value="job_seeker" {...register('role')} /> Job Seeker</label>
        <label className="role"><input type="radio" value="recruiter" {...register('role')} /> Recruiter</label>
      </div>
      {errors.role && <span className="hint">{errors.role.message}</span>}

      <label className="terms"><input type="checkbox" {...register('terms')} /> I agree to Terms & Conditions</label>
      {errors.terms && <span className="hint">{errors.terms.message}</span>}

      <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating…' : 'Create account'}</button>
      <p className="muted">Already have an account? <a href="/login" className="link">Login</a></p>
    </form>
  );
}

