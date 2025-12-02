import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs md:text-sm font-medium text-gray-400 mb-1">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`w-full px-2.5 py-1.5 md:px-3 md:py-2 text-sm bg-dark-surface border border-gray-700/40 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-leaf/40 focus:border-accent-leaf/40 appearance-none cursor-pointer transition-all ${className}`}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
