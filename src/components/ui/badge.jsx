import React from 'react';
export const Badge = ({ className='', variant='default', ...props }) => <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${variant === 'secondary' ? 'bg-secondary text-secondary-foreground' : 'bg-primary text-primary-foreground'} ${className}`} {...props} />;
