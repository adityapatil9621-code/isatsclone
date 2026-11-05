import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import WhatsAppButton from '@/components/WhatsAppButton.jsx';
import GoogleMapPlaceholder from '@/components/GoogleMapPlaceholder.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { CONTACT, whatsappLink, gmailComposeLink, mapsLink } from '@/data/contactInfo.js';

const ContactUsPage = () => {
  const contactInfo = [
    {
      icon: MapPin,
      title: 'Address',
      content: CONTACT.address,
      link: mapsLink,
      external: true,
    },
    {
      icon: Phone,
      title: 'Phone / WhatsApp',
      content: CONTACT.phoneDisplay,
      link: whatsappLink(),
      external: true,
    },
    {
      icon: Mail,
      title: 'Email',
      content: CONTACT.email,
      link: gmailComposeLink,
      external: true,
    },
    {
      icon: Clock,
      title: 'Office hours',
      content: CONTACT.hours,
    },
  ];

  return (
    <>
      <Helmet>
        <title>Contact us - ISATS</title>
        <meta
          name="description"
          content="Get in touch with ISATS. Visit our institute, call or WhatsApp us, or email us. We're here to help you start your career in healthcare aesthetics."
        />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/5 via-background to-accent/5 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6" style={{ letterSpacing: '-0.02em' }}>
                Contact us
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Have questions about our courses? We're here to help you take the first step toward your career
              </p>
            </motion.div>
          </div>
        </section>

        {/* Contact Information Cards */}
        <section className="py-16 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {contactInfo.map((info, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  {(() => {
                    const cardInner = (
                      <Card className="h-full shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl border-slate-200">
                        <CardHeader>
                          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-3">
                            <info.icon className="h-6 w-6 text-primary" />
                          </div>
                          <CardTitle className="text-base font-semibold">{info.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p
                            className={`text-sm leading-relaxed break-words ${
                              info.link
                                ? 'text-muted-foreground group-hover:text-primary transition-colors duration-200'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {info.content}
                          </p>
                        </CardContent>
                      </Card>
                    );
                    return info.link ? (
                      <a
                        href={info.link}
                        target={info.external ? '_blank' : undefined}
                        rel={info.external ? 'noopener noreferrer' : undefined}
                        className="group block h-full"
                      >
                        {cardInner}
                      </a>
                    ) : (
                      cardInner
                    );
                  })()}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Map */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl font-semibold mb-6">Find us on the map</h2>
              <GoogleMapPlaceholder />
            </motion.div>
          </div>
        </section>

        <Footer />
        <WhatsAppButton />
      </div>
    </>
  );
};

export default ContactUsPage;