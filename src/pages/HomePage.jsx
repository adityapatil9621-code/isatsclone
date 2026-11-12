import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import WhatsAppButton from '@/components/WhatsAppButton.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Award, Users, Briefcase, IndianRupee, ArrowRight, Sparkles, MoveUpRight } from 'lucide-react';

const highlights = [
  { icon: Award, number: '01', title: 'Recognised learning', description: 'Structured programmes designed around professional standards and practical skills.' },
  { icon: Users, number: '02', title: 'Hands-on training', description: 'Build confidence through guided practice, demonstrations and modern equipment.' },
  { icon: Briefcase, number: '03', title: 'Career direction', description: 'Get guidance to take your next step in the aesthetics and trichology industry.' },
  { icon: IndianRupee, number: '04', title: 'Accessible education', description: 'Explore focused training options and speak with our team about your goals.' }
];

const reveal = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } }
};

export default function HomePage() {
  return (
    <>
      <Helmet>
        <title>ISATS | Skill-based Aesthetic & Trichology Sciences</title>
        <meta name="description" content="Explore skill-based education in aesthetics, clinical aesthetics and trichology at ISATS. Discover courses and practical training opportunities." />
      </Helmet>
      <div className="isats-site-shell">
        <Header />
        <main>
          <section className="isats-hero">
            <div className="isats-hero-glow isats-hero-glow-one" />
            <div className="isats-hero-glow isats-hero-glow-two" />
            <div className="isats-hero-grid">
              <motion.div className="isats-hero-copy" initial="hidden" animate="visible" variants={reveal}>
                <div className="isats-eyebrow"><span /> INSTITUTE OF SKILL-BASED LEARNING</div>
                <h1>Build skills.<br /><em>Shape futures.</em></h1>
                <p className="isats-hero-lead">Professional education for the evolving world of aesthetics and trichology.</p>
                <p className="isats-hero-description">Discover focused learning pathways, practical training and the confidence to take your next career step.</p>
                <div className="isats-hero-actions">
                  <Button asChild size="lg" className="isats-primary-button"><Link to="/courses">Explore courses <ArrowRight size={18} /></Link></Button>
                  <Link to="/about" className="isats-text-link">Discover ISATS <MoveUpRight size={16} /></Link>
                </div>
                <div className="isats-hero-note"><span className="isats-note-mark"><Sparkles size={15} /></span><span>Learn with purpose. Practice with confidence.</span></div>
              </motion.div>
              <motion.div className="isats-hero-visual" initial={{ opacity: 0, scale: 0.96, y: 18 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.12 }}>
                <div className="isats-visual-frame">
                  <img src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1100&q=85" alt="Modern clinical learning and professional training environment" />
                  <div className="isats-visual-overlay" />
                  <div className="isats-visual-caption"><span className="isats-caption-dot" /><div><strong>Learn by doing</strong><small>Practical skills. Real confidence.</small></div></div>
                </div>
                <div className="isats-visual-index">ISATS <span> / </span> LEARN · PRACTICE · GROW</div>
              </motion.div>
            </div>
            <div className="isats-hero-bottom"><span>01 — 03</span><span>SKILL-BASED EDUCATION</span><span>SCROLL TO EXPLORE ↓</span></div>
          </section>

          <section className="isats-intro-section">
            <motion.div className="isats-section-heading" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.35 }} variants={reveal}>
              <span className="isats-section-kicker">THE ISATS APPROACH</span>
              <h2>Education that moves<br /><em>you forward.</em></h2>
            </motion.div>
            <motion.div className="isats-intro-copy" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.35 }} variants={reveal}>
              <p>Build a strong foundation through focused learning, expert guidance and practical exposure. Explore programmes created for people ready to grow in the aesthetics and trichology space.</p>
              <Link to="/about" className="isats-inline-link">More about our institute <ArrowRight size={16} /></Link>
            </motion.div>
          </section>

          <section className="isats-highlights-section">
            <div className="isats-highlights-top">
              <div><span className="isats-section-kicker">WHY LEARN WITH US</span><h2>A stronger foundation<br /><em>for what comes next.</em></h2></div>
              <p>Professional learning is more than a certificate. It is the knowledge, practice and support that help you move forward.</p>
            </div>
            <div className="isats-highlight-grid">
              {highlights.map((item, index) => (
                <motion.article className="isats-highlight-card" key={item.number} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={reveal} transition={{ delay: index * 0.08 }}>
                  <div className="isats-highlight-meta"><span>{item.number}</span><item.icon size={22} strokeWidth={1.6} /></div>
                  <h3>{item.title}</h3><p>{item.description}</p>
                  <span className="isats-card-rule" />
                </motion.article>
              ))}
            </div>
          </section>

          <section className="isats-course-cta">
            <div className="isats-cta-orb" />
            <div className="isats-cta-content"><span className="isats-section-kicker">YOUR NEXT STEP STARTS HERE</span><h2>Find the learning path<br />that fits <em>your ambition.</em></h2><p>Explore our current programmes or connect with the admissions team for guidance.</p><Button asChild size="lg" className="isats-cta-button"><Link to="/courses">View all courses <ArrowRight size={18} /></Link></Button></div>
            <div className="isats-cta-mark">ISATS<span>®</span></div>
          </section>
        </main>
        <Footer />
        <WhatsAppButton />
      </div>
    </>
  );
}
