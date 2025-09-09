import React, { useContext } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AuthLayout from '../components/Auth/AuthLayout'
import LoginForm from '../components/Auth/LoginForm'
import RegisterForm from '../components/Auth/RegisterForm'
import ProtectedRoute from '../components/Auth/ProtectedRoute'
import { AuthContext } from '../context/AuthContext.jsx'
import RecruiterDashboard from '../pages/RecruiterDashboard'
import JobSeekerDashboard from '../pages/JobSeekerDashboard'
import JobSearch from '../pages/JobSearch'

function Dashboard() {
  const { user } = useContext(AuthContext)
  
  // Route to appropriate dashboard based on user role
  if (user?.role === 'recruiter') {
    return <RecruiterDashboard />
  } else if (user?.role === 'job_seeker') {
    return <JobSeekerDashboard />
  }
  
  // Fallback for users without role
  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginTop: 0 }}>Welcome{user?.name ? `, ${user.name}` : ''}</h2>
      <p style={{ color: '#9aa4b2' }}>You are logged in as {user?.email || 'user'}.</p>
      <div style={{ marginTop: 16 }}>
        <a className="link" href="/profile">Go to profile</a>
      </div>
    </div>
  )
}

function Profile() {
  const { user } = useContext(AuthContext)
  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginTop: 0 }}>Your Profile</h2>
      <div style={{ marginTop: 12 }}>
        <div><strong>Name:</strong> {user?.name || '—'}</div>
        <div><strong>Email:</strong> {user?.email || '—'}</div>
        <div><strong>Role:</strong> {user?.role || '—'}</div>
        {user?.location && <div><strong>Location:</strong> {user.location}</div>}
      </div>
    </div>
  )
}

// OTP flow removed

function LoginPage() {
  return (
    <AuthLayout>
      <LoginForm onSuccess={() => (window.location.href = '/dashboard')} />
    </AuthLayout>
  )
}

function RegisterPage() {
  return (
    <AuthLayout>
      <RegisterForm onRegistered={() => (window.location.href = '/login')} />
    </AuthLayout>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      {/* OTP/Forgot/Reset routes removed for simplified auth */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/jobs" element={<ProtectedRoute><JobSearch /></ProtectedRoute>} />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

// Reset route removed
