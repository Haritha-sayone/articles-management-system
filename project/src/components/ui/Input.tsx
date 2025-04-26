import React, { forwardRef, memo } from 'react';

type InputProps = {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={props.id} 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full rounded-md border border-gray-300 py-2 px-4
              ${icon ? 'pl-10' : ''}
              text-gray-900 placeholder:text-gray-500
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              transition-colors
              disabled:opacity-50 disabled:bg-gray-100
              ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default memo(Input);