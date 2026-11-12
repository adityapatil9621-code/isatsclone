import './config.js';
import nodemailer from 'nodemailer';

const port = Number(process.env.TITAN_SMTP_PORT || 465);
const transporter = nodemailer.createTransport({
  host: process.env.TITAN_SMTP_HOST || 'smtp.titan.email',
  port,
  secure: port === 465,
  auth: { user: process.env.TITAN_SMTP_USER, pass: process.env.TITAN_SMTP_PASS },
});

console.log('User:', process.env.TITAN_SMTP_USER, '| Password set:', Boolean(process.env.TITAN_SMTP_PASS));
try {
  await transporter.verify();
  console.log('SMTP OK - Titan login works');
} catch (error) {
  console.log('SMTP FAILED:', error.code, '-', error.message);
}
process.exit(0);