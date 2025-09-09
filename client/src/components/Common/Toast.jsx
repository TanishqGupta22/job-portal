import React, { useEffect, useState } from 'react';
import './Toast.css';

const Toast = ({
  message,
  type = 'info',
  duration = 5000,
  onClose,
  position = 'top-right',
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  if (!isVisible) return null;

  const typeClasses = {
    success: 'toast-success',
    error: 'toast-error',
    warning: 'toast-warning',
    info: 'toast-info'
  };

  const classes = [
    'toast',
    typeClasses[type],
    isLeaving ? 'toast-leaving' : ''
  ].filter(Boolean).join(' ');

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      case 'error':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      case 'warning':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18C1.64547 18.3024 1.5729 18.6453 1.61286 18.9873C1.65282 19.3293 1.80334 19.6507 2.04238 19.8999C2.28142 20.1491 2.59612 20.3123 2.93726 20.3645C3.2784 20.4167 3.62763 20.3554 3.93 20.19L12 16L20.07 20.19C20.3724 20.3554 20.7216 20.4167 21.0627 20.3645C21.4039 20.3123 21.7186 20.1491 21.9576 19.8999C22.1967 19.6507 22.3472 19.3293 22.3871 18.9873C22.4271 18.6453 22.3545 18.3024 22.18 18L13.71 3.86C13.5318 3.56631 13.2807 3.32312 12.9812 3.15447C12.6817 2.98582 12.3438 2.89746 12 2.89746C11.6562 2.89746 11.3183 2.98582 11.0188 3.15447C10.7193 3.32312 10.4682 3.56631 10.29 3.86Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      default:
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M13 16H12V12H11M12 8H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
    }
  };

  return (
    <div className={classes} {...props}>
      <div className="toast-icon">
        {getIcon()}
      </div>
      <div className="toast-content">
        <p className="toast-message">{message}</p>
      </div>
      <button
        className="toast-close"
        onClick={handleClose}
        aria-label="Close notification"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            d="M18 6L6 18M6 6L18 18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
};

export default Toast;
