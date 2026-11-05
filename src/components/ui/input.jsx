import React from 'react';
export const Input = React.forwardRef(({ className='', ...props }, ref) => <input ref={ref} className={`flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring ${className}`} {...props} />);
Input.displayName = 'Input';
