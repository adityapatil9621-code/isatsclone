import { useCallback } from 'react';
export function useToast() {
  const toast = useCallback(({ title, description }) => {
    if (typeof window !== 'undefined') window.alert(`${title || ''}${description ? `\n${description}` : ''}`);
  }, []);
  return { toast };
}
