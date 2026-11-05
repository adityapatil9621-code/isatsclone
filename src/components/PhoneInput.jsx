import { useEffect, useState } from 'react';
import { COUNTRIES, splitPhone } from '@/lib/phone.js';

export default function PhoneInput({ id, value, onChange, error }) {
  const initial = splitPhone(value);
  const [iso, setIso] = useState(initial.iso);
  const [number, setNumber] = useState(initial.number);

  const country = COUNTRIES.find((c) => c.iso === iso);
  const compose = (c, num) => (num ? `${c.dial}${num}` : '');

  // Profile data loads after the page opens, so sync when a saved value arrives
  useEffect(() => {
    if (value && value !== compose(country, number)) {
      const s = splitPhone(value);
      setIso(s.iso);
      setNumber(s.number);
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  function changeCountry(code) {
    const next = COUNTRIES.find((c) => c.iso === code);
    const trimmed = number.slice(0, next.max); // keep only as many digits as the new country allows
    setIso(code);
    setNumber(trimmed);
    onChange(compose(next, trimmed));
  }

  function changeNumber(raw) {
    const digits = raw.replace(/\D/g, '').slice(0, country.max); // stop typing at the country's limit
    setNumber(digits);
    onChange(compose(country, digits));
  }

  const placeholder = '0'.repeat(country.max).replace(/(\d{5})(?=\d)/, '$1 ');

  return (
    <>
      <div className="phone-field">
        <select aria-label="Country code" value={iso} onChange={(e) => changeCountry(e.target.value)}>
          {COUNTRIES.map((c) => (
            <option key={c.iso} value={c.iso}>{c.name} ({c.dial})</option>
          ))}
        </select>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          maxLength={country.max}
          placeholder={placeholder}
          value={number}
          onChange={(e) => changeNumber(e.target.value)}
        />
      </div>
      <small className="phone-hint">{country.min === country.max ? `${country.max} digits` : `${country.min}-${country.max} digits`} · {number.length}/{country.max}</small>
      {error && <p className="phone-error">{error}</p>}
    </>
  );
}