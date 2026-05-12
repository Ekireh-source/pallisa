'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 form-input-clear',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-white hover:bg-primary/80',
        secondary:
          'border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200',
        destructive:
          'border-transparent bg-red-600 text-white hover:bg-red-700',
        outline: 
          'border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50',
        success:
          'border-transparent bg-green-100 text-green-800 hover:bg-green-200',
        warning:  
          'border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge: React.FC<BadgeProps> = ({ className, variant, ...props }) => {
  return (
    <div className={badgeVariants({ variant, className })} {...props} />
  );
}; 