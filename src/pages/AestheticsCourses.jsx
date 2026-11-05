import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import WhatsAppButton from '@/components/WhatsAppButton.jsx';
import CourseGrid from '@/components/CourseGrid.jsx';
import { aestheticsCourses } from '@/data/coursesData.js';
import { useCourses } from '@/lib/coursesApi.js';

const AestheticsCourses = () => {
  const { courses, connected } = useCourses('aesthetics', aestheticsCourses);


  return (
    <>
      <Helmet>
        <title>Advanced CTL Program - ISATS</title>
        <meta
          name="description"
          content="Advanced cosmetology, trichology, skin aesthetics and laser training with practical exposure, clinic setup support and business guidance."
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
                Advanced CTL Program
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Advanced cosmetology, trichology, skin aesthetics and laser training — complete knowledge, clinical expertise and confident care.{connected && <span className="block mt-2 text-xs font-medium text-emerald-600">Live course data • PostgreSQL</span>}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Courses Grid Section */}
        <section className="py-20 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <CourseGrid courses={courses} />
          </div>
        </section>

        <Footer />
        <WhatsAppButton />
      </div>
    </>
  );
};

export default AestheticsCourses;