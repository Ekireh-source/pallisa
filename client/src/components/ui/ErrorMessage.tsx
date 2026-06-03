'use client';

import React from 'react';

interface ErrorMessageProps {
  message?: string;
  errors?: Record<string, string>;
  className?: string;
  variant?: 'default' | 'inline' | 'toast';
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  errors,
  className = '',
  variant = 'default'
}) => {
  const hasErrors = message || (errors && Object.keys(errors).length > 0);

  if (!hasErrors) return null;

  const baseClasses = "rounded-md p-3";
  const variantClasses = {
    default: "bg-red-50 border border-red-200",
    inline: "bg-red-50 border-l-4 border-red-400",
    toast: "bg-red-500 text-white "
  };

  const textClasses = {
    default: "text-red-800",
    inline: "text-red-700",
    toast: "text-white"
  };

  const iconClasses = {
    default: "text-red-400",
    inline: "text-red-400",
    toast: "text-red-200"
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className={`h-5 w-5 ${iconClasses[variant]}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          {message && (
            <p className={`text-sm font-medium ${textClasses[variant]}`}>
              {message}
            </p>
          )}

          {errors && Object.keys(errors).length > 0 && (
            <div className="mt-2">
              <ul className={`text-sm ${textClasses[variant]} space-y-1`}>
                {Object.entries(errors).map(([field, error]) => (
                  <li key={field} className="flex items-start">
                    <span className="font-medium capitalize mr-1">
                      {field.replace(/_/g, ' ')}:
                    </span>
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 