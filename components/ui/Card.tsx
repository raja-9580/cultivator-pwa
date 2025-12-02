import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'light';
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', className = '', ...props }, ref) => {
    const variantStyles = {
      default: 'bg-dark-surface border border-gray-700/50 shadow-card',
      light: 'bg-dark-surface-light border border-gray-700/50 shadow-card',
    };

    return (
      <div
        ref={ref}
        className={`rounded-xl p-5 ${variantStyles[variant]} ${className}`}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

export default Card;
