import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import WhatsAppButton from '@/components/WhatsAppButton.jsx';
import { Target, Lightbulb, Users, Award, BookOpen, Building2, Briefcase, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';

const missionPillars = [
  { icon: BookOpen, number: '01', title: 'Industry-oriented training', description: 'Our curriculum is designed in collaboration with industry experts to ensure you learn the most relevant and up-to-date skills demanded by employers.' },
  { icon: Award, number: '02', title: 'Affordable education', description: 'We believe quality education should be accessible to all. Our competitive fee structure and flexible payment options make professional training achievable for everyone.' },
  { icon: Users, number: '03', title: 'Practical exposure', description: 'Learn by doing with our 100% hands-on training approach. Work with modern equipment and real-world scenarios to build confidence and competence.' }
];
const whyChoose = [
  { icon: Users, title: 'Experienced faculty', description: 'Learn from industry professionals with years of practical experience in trichology and aesthetic sciences' },
  { icon: Award, title: 'Certification', description: 'Receive government-recognized certificates that are valued by employers across the healthcare industry' },
  { icon: Building2, title: 'Modern labs', description: 'Train in state-of-the-art facilities equipped with the latest technology and equipment' },
  { icon: Briefcase, title: 'Placement support', description: 'Benefit from our dedicated placement cell that connects you with leading clinics and healthcare facilities' }
];

export default function AboutUsPage() {
  return (
    <>
      <Helmet><title>About us - ISATS</title><meta name="description" content="Learn about ISATS - Institute of Skill-based Aesthetic & Trichology Sciences. Our vision, mission, and commitment to providing quality healthcare education." /></Helmet>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="isats-inner-page isats-about-page">
          <section className="isats-page-hero isats-about-hero">
            <div className="isats-page-hero-orb" />
            <div className="isats-about-hero-inner">
              <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }}>
                <span className="isats-section-kicker">WHO WE ARE</span>
                <h1>Learning with purpose.<br /><em>Growing with skill.</em></h1>
                <p>Building the future of healthcare aesthetics through skill-based education and practical training.</p>
                <Button asChild className="isats-about-hero-button"><Link to="/courses">Explore our courses <ArrowRight size={17} /></Link></Button>
              </motion.div>
              <motion.div className="isats-about-hero-image" initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .7, delay: .1 }}>
                <img src="https://images.openai.com/static-rsc-4/HoVjiCmaU3Ebg8TY_M7bioPa3Hlman1dQOyJdYM7QtNxAG3-IhJWE2QmosUCC8n_sSs_EmH-nHDgxQob38ovEi8moE6NCEbPxt1S4LpycOMu2wlMYBD27RsNkdD3KXXGHnkVVvpO3hrK63rMDLg1Ek_G2-VzxkHhaH8sNazr4Ju578Fiv7_VzOj91C5896bv?purpose=inline" alt="Laboratory glassware and cosmetic bottles representing aesthetic science research and development" />
                <div className="isats-about-image-label"><span>ISATS</span><strong>Institute of Skill-based Aesthetic & Trichology Sciences</strong></div>
              </motion.div>
            </div>
          </section>

          <section className="isats-about-intro">
            <div className="isats-about-intro-label"><span className="isats-section-kicker">OUR INSTITUTE</span></div>
            <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: .55 }}>
              <h2>Where knowledge<br />becomes <em>capability.</em></h2>
              <p>ISATS (Institute of Skill-based Aesthetic & Trichology Sciences) is a premier educational institution dedicated to providing comprehensive training in the fields of trichology, aesthetics, and clinical aesthetics. Established with the vision of creating skilled professionals for the rapidly growing healthcare and beauty industry, we have successfully trained thousands of students who are now thriving in their careers.</p>
              <p>Our institute combines theoretical knowledge with extensive practical training, ensuring that our graduates are job-ready from day one. With government-recognized certifications, modern infrastructure, and experienced faculty, ISATS stands as a trusted name in skill-based healthcare education.</p>
            </motion.div>
          </section>

          <section className="isats-vision-section">
            <motion.div className="isats-vision-panel" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: .55 }}>
              <div className="isats-vision-icon"><Target size={27} /></div>
              <div><span className="isats-section-kicker">OUR VISION</span><h2>Creating a skilled<br /><em>professional future.</em></h2><p>To provide skill-based education for employment generation in the healthcare and aesthetic industry, creating a workforce of competent professionals who contribute to the growth and development of the sector while achieving personal and professional success.</p></div>
            </motion.div>
          </section>

          <section className="isats-mission-section">
            <div className="isats-inner-container">
              <div className="isats-inner-section-heading"><div><span className="isats-section-kicker"><Lightbulb size={15} /> OUR MISSION</span><h2>Three pillars.<br /><em>One commitment.</em></h2></div><p>We are committed to excellence in education through three core pillars.</p></div>
              <div className="isats-mission-grid">
                {missionPillars.map((item, index) => <motion.article className="isats-mission-card" key={item.number} initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: .5, delay: index * .08 }}><div className="isats-mission-card-top"><span>{item.number}</span><item.icon size={23} /></div><h3>{item.title}</h3><p>{item.description}</p></motion.article>)}
              </div>
            </div>
          </section>

          <section className="isats-why-section">
            <div className="isats-inner-container">
              <div className="isats-inner-section-heading"><div><h2>Why choose <em>ISATS?</em></h2></div><p>Discover what makes us the preferred choice for aspiring healthcare professionals.</p></div>
              <div className="isats-why-grid">{whyChoose.map((item, index) => <motion.article className="isats-why-card" key={item.title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: .45, delay: index * .07 }}><span className="isats-why-icon"><item.icon size={22} /></span><h3>{item.title}</h3><p>{item.description}</p></motion.article>)}</div>
            </div>
          </section>

          <section className="isats-about-bottom-cta"><span className="isats-section-kicker">TAKE THE NEXT STEP</span><h2>Ready to build your<br /><em>next chapter?</em></h2><Button asChild className="isats-cta-button"><Link to="/contact">Connect with ISATS <ArrowRight size={17} /></Link></Button></section>
        </main>
        <Footer />
        <WhatsAppButton />
      </div>
    </>
  );
}
