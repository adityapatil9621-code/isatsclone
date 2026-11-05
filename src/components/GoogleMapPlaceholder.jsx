import React from 'react';
import { CONTACT, directionsLink, mapsLink } from '@/data/contactInfo.js';

// Uses the Google Maps Embed API when VITE_GOOGLE_MAPS_API_KEY is set
// (see .env.example). Without a key it falls back to the standard keyless
// Google Maps embed, so the map always works.
const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const query = encodeURIComponent('ISATS ' + CONTACT.address);

const embedSrc = apiKey
  ? `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${query}&zoom=16`
  : `https://www.google.com/maps?q=${query}&z=16&output=embed`;

export default function GoogleMapPlaceholder() {
  return (
    <div className="rounded-2xl border border-slate-200 shadow-lg overflow-hidden bg-white">
      <iframe
        title="ISATS location on Google Maps"
        src={embedSrc}
        className="w-full h-[320px] md:h-[420px] border-0"
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between p-4 border-t border-slate-200">
        <p className="text-sm text-muted-foreground">{CONTACT.address}</p>
        <div className="flex gap-3 shrink-0">
          <a
            href={mapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary hover:underline"
          >
            View larger map
          </a>
          <a
            href={directionsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary hover:underline"
          >
            Get directions
          </a>
        </div>
      </div>
    </div>
  );
}
