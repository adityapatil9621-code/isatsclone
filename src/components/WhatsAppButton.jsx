import React, { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { CONTACT, whatsappLink } from '@/data/contactInfo.js';

const QUICK_QUESTIONS = [
  'I want to know about course fees',
  'What are the upcoming batch dates?',
  'What are the eligibility criteria?',
  'Do you provide certification?',
];

export default function WhatsAppButton() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');

  const openChat = (text) => {
    const finalText = (text || message).trim() || CONTACT.whatsappMessage;
    window.open(whatsappLink(finalText), '_blank', 'noopener,noreferrer');
    setMessage('');
    setOpen(false);
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {open && (
        <div className="w-[320px] max-w-[calc(100vw-2.5rem)] rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
          <div className="bg-green-600 text-white px-4 py-3 flex items-start justify-between">
            <div>
              <p className="font-semibold">Chat with ISATS</p>
              <p className="text-xs text-green-50">Typically replies within a few hours</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="p-1 rounded hover:bg-green-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4 space-y-3 bg-slate-50">
            <div className="bg-white rounded-xl rounded-tl-none border border-slate-200 px-3 py-2 text-sm text-slate-700 w-fit max-w-[90%]">
              Hi 👋 How can we help you today? Pick a question or type your own.
            </div>

            <div className="flex flex-wrap gap-2">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => openChat(q)}
                  className="text-xs px-3 py-1.5 rounded-full border border-green-600 text-green-700 bg-white hover:bg-green-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              openChat();
            }}
            className="flex items-center gap-2 p-3 border-t border-slate-200 bg-white"
          >
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              aria-label="Type your message"
              className="flex-1 text-sm px-3 py-2 rounded-full border border-slate-300 bg-white text-gray-900 outline-none focus:border-green-600"
            />
            <button
              type="submit"
              aria-label="Send on WhatsApp"
              className="h-9 w-9 rounded-full bg-green-600 text-white flex items-center justify-center hover:bg-green-700"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close WhatsApp chat' : 'Chat with ISATS on WhatsApp'}
        className="rounded-full bg-green-600 text-white px-4 py-3 shadow-lg font-semibold flex items-center gap-2 hover:bg-green-700 transition"
      >
        <MessageCircle className="h-5 w-5" />
        {open ? 'Close' : 'Chat with us'}
      </button>
    </div>
  );
}
