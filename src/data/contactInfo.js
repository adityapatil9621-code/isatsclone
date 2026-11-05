// Single source of truth for ISATS contact details.
// Change values here and every page (Contact, WhatsApp button, map) updates.

export const CONTACT = {
  address:
    'Makhija Royale Building, 404, Swami Vivekanand Rd, above Noble Chemist, Govind Dham, Ram Krishna Nagar, Khar West, Mumbai, Maharashtra 400052',
  phoneDisplay: '+91 98674 20241',
  // Digits only, with country code (used by wa.me)
  whatsappNumber: '919867420241',
  whatsappMessage: 'Hello ISATS, I would like to know more about your courses.',
  email: 'admin@isatscosmetology.com',
  hours: 'Monday - Saturday: 9:00 AM - 6:00 PM',
};

export const whatsappLink = (message = CONTACT.whatsappMessage) =>
  `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(message)}`;

// Visitor's Gmail compose window, addressed to ISATS, with the subject pre-filled
export const gmailComposeLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
  CONTACT.email
)}&su=${encodeURIComponent('Course enquiry - ISATS')}`;

// Opens the location in the Google Maps app / website
export const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  'ISATS ' + CONTACT.address
)}`;

export const directionsLink = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
  CONTACT.address
)}`;

// WhatsApp chat pre-filled with the course the visitor is interested in
export const courseEnquiryMessage = (course) => {
  const title = course.title || course.name;
  return (
    `Hello ISATS, I would like to know more about the "${title}" course` +
    (course.duration ? ` (${course.duration})` : '') +
    `. Please share the fees, upcoming batch dates, eligibility and admission process.`
  );
};

export const courseEnquiryLink = (course) => whatsappLink(courseEnquiryMessage(course));

// WhatsApp chat with a STUDENT's number (used in the admin page)
export function studentWhatsappLink(phone, name = '', course = '') {
  let digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 10) digits = `91${digits}`; // 10-digit Indian number without country code
  if (!digits) return '';
  const first = String(name).trim().split(' ')[0] || 'there';
  const text =
    `Hello ${first}, this is ISATS. Thank you for your interest in ` +
    `${course || 'our courses'}. How can we help you?`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

// ADMIN page: a standard email link. Windows hands it to whichever mail app is the
// default for "mailto" (set this to the Titan desktop app), which sends from
// admin@isatscosmetology.com to the student.
export function titanMailLink(email, name = '', course = '') {
  if (!email) return '';
  const first = String(name).trim().split(' ')[0] || 'there';
  const subject = course ? `Your enquiry at ISATS - ${course}` : 'Your ISATS account';
  const body =
    `Hello ${first},\n\nThank you for your interest in ${course || 'ISATS'}.\n\n` +
    `Regards,\nISATS Admissions\nadmin@isatscosmetology.com`;
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}