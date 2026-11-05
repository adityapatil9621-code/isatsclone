import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import WhatsAppButton from '@/components/WhatsAppButton.jsx';
import CourseGrid from '@/components/CourseGrid.jsx';
import { clinicalAestheticsCourses } from '@/data/coursesData.js';
import { useCourses } from '@/lib/coursesApi.js';
import { useAcademicStatus } from '@/lib/academicStatus.js';
import { coursesForStatus } from '@/lib/courseAccess.js';


const ClinicalAestheticsCourses = () => {
  const [academicStatus] = useAcademicStatus();
  const visibleCourses = coursesForStatus(clinicalAestheticsCourses, academicStatus);

  return (
    <>
      <Helmet>
        <title>Laser Certification Program - ISATS</title>
        <meta
          name="description"
          content="Laser Certification Program covering laser fundamentals, photo facial, Q-Switch, hair removal, machine knowledge and practical laser protocols."
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
                Laser Certification Program
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Complete knowledge. Clinical expertise. Confident care.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Courses Grid Section */}
        <section className="py-20 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <CourseGrid courses={visibleCourses} />
          </div>
        </section>

        <Footer />
        <WhatsAppButton />
      </div>
    </>
  );
};

export default ClinicalAestheticsCourses;