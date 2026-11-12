import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import WhatsAppButton from '@/components/WhatsAppButton.jsx';
import AcademicPrompt from '@/components/AcademicPrompt.jsx';
import { useAcademicStatus } from '@/lib/academicStatus.js';
import { Button } from '@/components/ui/button.jsx';
import { ArrowRight, Scissors, Sparkles, Syringe, GraduationCap, MoveUpRight } from 'lucide-react';

const CoursesPage = () => {
  const [academicStatus] = useAcademicStatus();
  const courseCategories = [
    {
      icon: Sparkles, number: '01', eyebrow: 'AESTHETICS & TRICHOLOGY',
      title: 'Advanced CTL program',
      description: 'Advanced cosmetology, trichology, skin aesthetics and laser training with extensive hands-on practice, live demonstrations, real patient exposure, clinic setup support and business guidance.',
      path: '/courses/aesthetics', courses: '1 catalogue program', injection: true,
      image: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=1000&q=85',
      imageAlt: 'Professional skin care and aesthetics treatment environment'
    },
    {
      icon: Scissors, number: '02', eyebrow: 'HAIR & SCALP SCIENCE',
      title: 'Trichology certification',
      description: 'A dedicated hair and scalp certification covering anatomy, scalp diseases, hair analysis, hair fall, treatment protocols, hair care routines, trichoscopy and practical trichology skills.',
      path: '/courses/trichology', courses: '1 catalogue program',
      image: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=1000&q=85',
      imageAlt: 'Professional hair and scalp care'
    },
    {
      icon: Syringe, number: '03', eyebrow: 'LASER SCIENCE & TECHNOLOGY',
      title: 'Laser certification',
      description: 'A focused laser certification covering laser fundamentals, photo facial, Q-Switch, laser hair removal, machine knowledge, consumables, LLT hair treatment and pre/post care.',
      path: '/courses/clinical-aesthetics', courses: '1 catalogue program',
      image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1000&q=85',
      imageAlt: 'Modern aesthetic laser treatment room'
    }
  ];

  const visibleCategories = courseCategories
    .filter((course) => !(academicStatus === 'tenth' && course.injection))
    .map((course) => academicStatus === 'tenth' && course.path === '/courses/clinical-aesthetics'
      ? { ...course, title: 'Laser hair reduction course', description: 'A focused course on laser hair reduction, covering the technique, safety and practical skills.' }
      : course);

  return (
    <>
      <Helmet>
        <title>Courses - ISATS</title>
        <meta name="description" content="Explore the Advanced CTL, Trichology Certification and Laser Certification programs from the current ISATS course catalogue." />
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="isats-inner-page isats-courses-page">
          <section className="isats-page-hero isats-courses-hero">
            <div className="isats-page-hero-orb" />
            <div className="isats-page-hero-inner">
              <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }}>
                <span className="isats-section-kicker">LEARN · PRACTICE · GROW</span>
                <h1>Find your path<br /><em>to expertise.</em></h1>
                <p>Explore focused programmes in aesthetics, trichology and laser technology. Build practical knowledge for the next stage of your professional journey.</p>
                <div className="isats-course-hero-meta"><span><GraduationCap size={17} /> Skill-based programmes</span><span>Current course catalogue</span></div>
              </motion.div>
              <motion.div className="isats-course-hero-art" initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .75, delay: .1 }}>
                <img src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1100&q=85" alt="Clinical education and practical learning" />
                <div className="isats-course-art-caption"><span>ISATS</span><strong>Knowledge meets practice.</strong></div>
              </motion.div>
            </div>
          </section>

          <section className="isats-course-list-section">
            <div className="isats-inner-container">
              <div className="isats-inner-section-heading">
                <div><span className="isats-section-kicker">EXPLORE THE CATALOGUE</span><h2>Programmes designed<br /><em>around practical skills.</em></h2></div>
                <p>Choose an area of interest to explore its programme details, curriculum and learning outcomes.</p>
              </div>
              <AcademicPrompt />
              <div className="isats-course-category-list">
                {visibleCategories.map((course, index) => (
                  <motion.article className="isats-course-category" key={course.path} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .18 }} transition={{ duration: .5, delay: index * .08 }}>
                    <div className="isats-course-category-image">
                      <img src={course.image} alt={course.imageAlt} loading="lazy" />
                      <span>{course.number}</span>
                    </div>
                    <div className="isats-course-category-copy">
                      <div className="isats-course-category-kicker"><course.icon size={17} /> {course.eyebrow}</div>
                      <h3>{course.title}</h3>
                      <p>{course.description}</p>
                      <div className="isats-course-category-bottom"><span>{course.courses}</span><Button asChild className="isats-course-link"><Link to={course.path}>Explore programme <ArrowRight size={16} /></Link></Button></div>
                    </div>
                  </motion.article>
                ))}
              </div>
            </div>
          </section>

          <section className="isats-course-guidance">
            <div className="isats-guidance-inner">
              <div><span className="isats-section-kicker">NEED A LITTLE GUIDANCE?</span><h2>Not sure where<br /><em>to begin?</em></h2></div>
              <div><p>Talk with our admissions team about your interests, eligibility and the programme that may suit your goals.</p><Button asChild className="isats-cta-button"><Link to="/contact">Speak to our team <MoveUpRight size={17} /></Link></Button></div>
            </div>
          </section>
        </main>
        <Footer />
        <WhatsAppButton />
      </div>
    </>
  );
};

export default CoursesPage;
