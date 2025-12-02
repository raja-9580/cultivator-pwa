import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs md:text-sm font-medium text-gray-400 mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-2.5 py-1.5 md:px-3 md:py-2 text-sm bg-dark-surface border border-gray-700/40 rounded-lg text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-accent-leaf/40 focus:border-accent-leaf/40 transition-all ${className}`}
          {...props}
        />
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
