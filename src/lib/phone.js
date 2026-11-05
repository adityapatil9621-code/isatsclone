// Lengths are of the number WITHOUT the country code (approximate rules).
export const COUNTRIES = [
  { iso: 'IN', name: 'India', dial: '+91', min: 10, max: 10, start: /^[6-9]/ },
  { iso: 'US', name: 'United States', dial: '+1', min: 10, max: 10 },
  { iso: 'CA', name: 'Canada', dial: '+1', min: 10, max: 10 },
  { iso: 'GB', name: 'United Kingdom', dial: '+44', min: 10, max: 10 },
  { iso: 'AE', name: 'UAE', dial: '+971', min: 9, max: 9 },
  { iso: 'SA', name: 'Saudi Arabia', dial: '+966', min: 9, max: 9 },
  { iso: 'QA', name: 'Qatar', dial: '+974', min: 8, max: 8 },
  { iso: 'KW', name: 'Kuwait', dial: '+965', min: 8, max: 8 },
  { iso: 'OM', name: 'Oman', dial: '+968', min: 8, max: 8 },
  { iso: 'BH', name: 'Bahrain', dial: '+973', min: 8, max: 8 },
  { iso: 'SG', name: 'Singapore', dial: '+65', min: 8, max: 8 },
  { iso: 'MY', name: 'Malaysia', dial: '+60', min: 9, max: 10 },
  { iso: 'AU', name: 'Australia', dial: '+61', min: 9, max: 9 },
  { iso: 'NZ', name: 'New Zealand', dial: '+64', min: 8, max: 10 },
  { iso: 'PK', name: 'Pakistan', dial: '+92', min: 10, max: 10 },
  { iso: 'BD', name: 'Bangladesh', dial: '+880', min: 10, max: 10 },
  { iso: 'NP', name: 'Nepal', dial: '+977', min: 10, max: 10 },
  { iso: 'LK', name: 'Sri Lanka', dial: '+94', min: 9, max: 9 },
  { iso: 'DE', name: 'Germany', dial: '+49', min: 10, max: 11 },
  { iso: 'FR', name: 'France', dial: '+33', min: 9, max: 9 },
  { iso: 'ZA', name: 'South Africa', dial: '+27', min: 9, max: 9 },
  { iso: 'NG', name: 'Nigeria', dial: '+234', min: 10, max: 10 },
];

// "+919876543210" or "98765 43210" -> { iso, number }
export function splitPhone(value) {
  const clean = String(value || '').replace(/[^\d+]/g, '');
  if (!clean) return { iso: 'IN', number: '' };
  if (clean.startsWith('+')) {
    const digits = clean.slice(1);
    const match = [...COUNTRIES]
      .sort((a, b) => b.dial.length - a.dial.length)
      .find((c) => digits.startsWith(c.dial.slice(1)));
    if (match) return { iso: match.iso, number: digits.slice(match.dial.length - 1) };
    return { iso: 'IN', number: digits };
  }
  return { iso: 'IN', number: clean.replace(/^0+/, '') };
}

// Returns '' when valid (an empty phone is allowed, it is optional)
export function validatePhone(value) {
  if (!value) return '';
  const { iso, number } = splitPhone(value);
  const country = COUNTRIES.find((c) => c.iso === iso);
  if (!number) return '';
  if (number.length < country.min || number.length > country.max) {
    return country.min === country.max
      ? `Enter a ${country.min}-digit ${country.name} phone number.`
      : `Enter a ${country.min}-${country.max} digit ${country.name} phone number.`;
  }
  if (country.start && !country.start.test(number)) return 'Indian mobile numbers start with 6, 7, 8 or 9.';
  return '';
}