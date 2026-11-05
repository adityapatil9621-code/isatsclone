import React from 'react';
import { Link } from 'react-router-dom';

export const Button = React.forwardRef(({ asChild=false, className='', children, ...props }, ref) => {
  if (asChild && React.isValidElement(children)) return React.cloneElement(children, { ref, className: `inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition ${className}`, ...props });
  return <button ref={ref} className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition ${className}`} {...props}>{children}</button>;
});
Button.displayName = 'Button';
