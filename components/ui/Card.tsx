import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'light';
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', className = '', ...props }, ref) => {
    const variantStyles = {
      default: 'glass-panel',
      light: 'bg-white/5 border border-white/10 shadow-card backdrop-blur-md',
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
