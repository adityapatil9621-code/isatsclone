import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import ApplyModal from '@/components/ApplyModal.jsx';

export default function ApplyNowButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        size="lg"
        className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-base transition-all duration-200 active:scale-95"
        onClick={() => setOpen(true)}
      >
        Apply now
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
      <ApplyModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}