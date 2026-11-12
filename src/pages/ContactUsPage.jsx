import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import WhatsAppButton from '@/components/WhatsAppButton.jsx';
import GoogleMapPlaceholder from '@/components/GoogleMapPlaceholder.jsx';
import { MapPin, Phone, Mail, Clock, ArrowUpRight, MessageCircle } from 'lucide-react';
import { CONTACT, whatsappLink, gmailComposeLink, mapsLink } from '@/data/contactInfo.js';

export default function ContactUsPage() {
  const contactInfo = [
    { icon: MapPin, title: 'Visit our institute', label: 'OUR LOCATION', content: CONTACT.address, link: mapsLink, external: true, action: 'Open directions' },
    { icon: Phone, title: 'Call or WhatsApp', label: 'SPEAK WITH OUR TEAM', content: CONTACT.phoneDisplay, link: whatsappLink(), external: true, action: 'Start a conversation' },
    { icon: Mail, title: 'Send an email', label: 'WRITE TO US', content: CONTACT.email, link: gmailComposeLink, external: true, action: 'Compose an email' },
    { icon: Clock, title: 'Office hours', label: 'WHEN WE ARE AVAILABLE', content: CONTACT.hours }
  ];

  return (
    <>
      <Helmet><title>Contact us - ISATS</title><meta name="description" content="Get in touch with ISATS. Visit our institute, call or WhatsApp us, or email us. We're here to help you start your career in healthcare aesthetics." /></Helmet>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="isats-inner-page isats-contact-page">
          <section className="isats-contact-hero">
            <div className="isats-contact-hero-pattern" />
            <motion.div className="isats-contact-hero-inner" initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }}>
              <span className="isats-section-kicker">WE'RE HERE TO HELP</span>
              <h1>Let's start a<br /><em>conversation.</em></h1>
              <p>Have questions about our courses? Reach out to our team and take the first step towards your learning journey.</p>
              <a href={whatsappLink('Hello ISATS, I would like to know more about your courses.')} target="_blank" rel="noopener noreferrer" className="isats-contact-hero-link"><MessageCircle size={17} /> Chat with our team <ArrowUpRight size={16} /></a>
            </motion.div>
            <div className="isats-contact-hero-side"><span>ISATS</span><small>INSTITUTE OF SKILL-BASED AESTHETIC & TRICHOLOGY SCIENCES</small></div>
          </section>

          <section className="isats-contact-details-section">
            <div className="isats-inner-container">
              <div className="isats-inner-section-heading"><div><span className="isats-section-kicker">GET IN TOUCH</span><h2>We'd love to<br /><em>hear from you.</em></h2></div><p>Choose the most convenient way to connect with ISATS. Our contact details and office hours are listed below.</p></div>
              <div className="isats-contact-grid">
                {contactInfo.map((info, index) => {
                  const content = <><div className="isats-contact-card-top"><span className="isats-contact-icon"><info.icon size={22} /></span><span className="isats-contact-card-index">0{index + 1}</span></div><span className="isats-contact-card-label">{info.label}</span><h3>{info.title}</h3><p>{info.content}</p>{info.link && <span className="isats-contact-card-action">{info.action} <ArrowUpRight size={15} /></span>}</>;
                  return <motion.article className="isats-contact-card" key={info.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: .45, delay: index * .07 }}>
                    {info.link ? <a href={info.link} target={info.external ? '_blank' : undefined} rel={info.external ? 'noopener noreferrer' : undefined}>{content}</a> : content}
                  </motion.article>;
                })}
              </div>
            </div>
          </section>

          <section className="isats-contact-map-section">
            <div className="isats-inner-container">
              <div className="isats-contact-map-heading"><div><h2>Find your way<br /><em>to ISATS.</em></h2></div><p>Use the map below to explore.</p></div>
              <div className="isats-contact-map-frame"><GoogleMapPlaceholder /></div>
            </div>
          </section>
        </main>
        <Footer />
        <WhatsAppButton />
      </div>
    </>
  );
}
