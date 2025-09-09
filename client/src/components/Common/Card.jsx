import React from 'react';
import './Card.css';

const Card = ({
  children,
  title,
  subtitle,
  header,
  footer,
  className = '',
  hover = false,
  padding = 'medium',
  ...props
}) => {
  const paddingClasses = {
    none: 'card-padding-none',
    small: 'card-padding-small',
    medium: 'card-padding-medium',
    large: 'card-padding-large'
  };

  const classes = [
    'card',
    hover ? 'card-hover' : '',
    paddingClasses[padding],
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      {(title || subtitle || header) && (
        <div className="card-header">
          {header || (
            <>
              {title && <h3 className="card-title">{title}</h3>}
              {subtitle && <p className="card-subtitle">{subtitle}</p>}
            </>
          )}
        </div>
      )}
      
      <div className="card-content">
        {children}
      </div>
      
      {footer && (
        <div className="card-footer">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
