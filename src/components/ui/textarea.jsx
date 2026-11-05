import React from 'react';
export const Textarea = React.forwardRef(({ className='', ...props }, ref) => <textarea ref={ref} className={`min-h-28 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring ${className}`} {...props} />);
Textarea.displayName = 'Textarea';
