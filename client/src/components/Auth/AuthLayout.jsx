import React from 'react';

export default function AuthLayout({ children }) {
  return (
    <div className="auth-layout">
      <div className="auth-card-wrapper">
        {children}
      </div>
    </div>
  );
}


