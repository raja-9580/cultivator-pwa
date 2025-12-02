import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'warning' | 'info' | 'danger' | 'neutral';
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ variant = 'neutral', className = '', ...props }, ref) => {
    const variantStyles = {
      success: 'bg-accent-leaf/8 text-accent-leaf border border-accent-leaf/20 rounded-full',
      warning: 'bg-amber-600/8 text-amber-300 border border-amber-600/20 rounded-full',
      info: 'bg-accent-sky/8 text-accent-sky border border-accent-sky/20 rounded-full',
      danger: 'bg-red-600/8 text-red-300 border border-red-600/20 rounded-full',
      neutral: 'bg-gray-600/8 text-gray-400 border border-gray-600/20 rounded-full',
    };

    return (
      <div
        ref={ref}
        className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${variantStyles[variant]} badge-animate ${className}`}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
