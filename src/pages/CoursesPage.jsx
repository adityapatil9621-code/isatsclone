import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import WhatsAppButton from '@/components/WhatsAppButton.jsx';
import AcademicPrompt from '@/components/AcademicPrompt.jsx';
import { useAcademicStatus } from '@/lib/academicStatus.js';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { ArrowRight, Scissors, Sparkles, Syringe } from 'lucide-react';

const CoursesPage = () => {
  const [academicStatus] = useAcademicStatus();

  const courseCategories = [
    {
      icon: Sparkles,
      title: 'Advanced CTL program',
      description: 'Advanced cosmetology, trichology, skin aesthetics and laser training with extensive hands-on practice, live demonstrations, real patient exposure, clinic setup support and business guidance.',
      path: '/courses/aesthetics',
      courses: '1 catalogue program',
      color: 'from-orange-500/10 to-fuchsia-600/10',
      injection: true // includes injection training: hidden for 10th pass
    },
    {
      icon: Scissors,
      title: 'Trichology certification',
      description: 'A dedicated hair and scalp certification covering anatomy, scalp diseases, hair analysis, hair fall, treatment protocols, hair care routines, trichoscopy and practical trichology skills.',
      path: '/courses/trichology',
      courses: '1 catalogue program',
      color: 'from-emerald-500/10 to-teal-600/10'
    },
    {
      icon: Syringe,
      title: 'Laser certification',
      description: 'A focused laser certification covering laser fundamentals, photo facial, Q-Switch, laser hair removal, machine knowledge, consumables, LLT hair treatment and pre/post care.',
      path: '/courses/clinical-aesthetics',
      courses: '1 catalogue program',
      color: 'from-blue-500/10 to-purple-600/10'
    }
  ];

  // 10th pass: no injection program, and Laser is shown as hair reduction only
  const visibleCategories = courseCategories
    .filter((c) => !(academicStatus === 'tenth' && c.injection))
    .map((c) =>
      academicStatus === 'tenth' && c.path === '/courses/clinical-aesthetics'
        ? {
            ...c,
            title: 'Laser hair reduction course',
            description: 'A focused course on laser hair reduction, covering the technique, safety and practical skills.'
          }
        : c
    );

  return (
    <>
      <Helmet>
        <title>Courses - ISATS</title>
        <meta
          name="description"
          content="Explore the Advanced CTL, Trichology Certification and Laser Certification programs from the current ISATS course catalogue."
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
                Our courses
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Explore the three current ISATS programs exactly as presented in the supplied course catalogue
              </p>
              <AcademicPrompt />
            </motion.div>
          </div>
        </section>

        {/* Course Categories Section */}
        <section className="py-20 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {visibleCategories.map((category, index) => (
                <motion.div
                  key={category.path}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className={`h-full flex flex-col shadow-lg hover:shadow-2xl transition-all duration-300 rounded-2xl border-slate-200 bg-gradient-to-br ${category.color}`}>
                    <CardHeader>
                      <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                        <category.icon className="h-8 w-8 text-primary" />
                      </div>
                      <CardTitle className="text-2xl font-semibold">{category.title}</CardTitle>
                      <CardDescription className="text-sm font-medium text-primary">
                        {category.courses}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <p className="text-muted-foreground leading-relaxed">{category.description}</p>
                    </CardContent>
                    <CardFooter>
                      <Button asChild className="w-full transition-all duration-200 active:scale-95">
                        <Link to={category.path}>
                          View courses
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl font-semibold text-foreground mb-4" style={{ textWrap: 'balance' }}>
                Not sure which course is right for you?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Our admissions team is here to help you choose the perfect program based on your interests and career goals
              </p>
              <Button size="lg" asChild className="transition-all duration-200 active:scale-95">
                <Link to="/contact">
                  Contact us for guidance
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>

        <Footer />
        <WhatsAppButton />
      </div>
    </>
  );
};

export default CoursesPage;