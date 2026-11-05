import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import WhatsAppButton from '@/components/WhatsAppButton.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Target, Lightbulb, Users, Award, BookOpen, Building2, Briefcase } from 'lucide-react';

const AboutUsPage = () => {
  const missionPillars = [
    {
      icon: BookOpen,
      title: 'Industry-oriented training',
      description: 'Our curriculum is designed in collaboration with industry experts to ensure you learn the most relevant and up-to-date skills demanded by employers.'
    },
    {
      icon: Award,
      title: 'Affordable education',
      description: 'We believe quality education should be accessible to all. Our competitive fee structure and flexible payment options make professional training achievable for everyone.'
    },
    {
      icon: Users,
      title: 'Practical exposure',
      description: 'Learn by doing with our 100% hands-on training approach. Work with modern equipment and real-world scenarios to build confidence and competence.'
    }
  ];

  const whyChoose = [
    {
      icon: Users,
      title: 'Experienced faculty',
      description: 'Learn from industry professionals with years of practical experience in trichology and aesthetic sciences'
    },
    {
      icon: Award,
      title: 'Certification',
      description: 'Receive government-recognized certificates that are valued by employers across the healthcare industry'
    },
    {
      icon: Building2,
      title: 'Modern labs',
      description: 'Train in state-of-the-art facilities equipped with the latest technology and equipment'
    },
    {
      icon: Briefcase,
      title: 'Placement support',
      description: 'Benefit from our dedicated placement cell that connects you with leading clinics and healthcare facilities'
    }
  ];

  return (
    <>
      <Helmet>
        <title>About us - ISATS</title>
        <meta
          name="description"
          content="Learn about ISATS - Institute of Skill-based Aesthetic & Trichology Sciences. Our vision, mission, and commitment to providing quality healthcare education."
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
                About ISATS
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Building the future of healthcare aesthetics through skill-based education and practical training
              </p>
            </motion.div>
          </div>
        </section>

        {/* Introduction Section */}
        <section className="py-16 bg-background">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="prose prose-lg max-w-none"
            >
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                ISATS (Institute of Skill-based Aesthetic & Trichology Sciences) is a premier educational institution dedicated to providing comprehensive training in the fields of trichology, aesthetics, and clinical aesthetics. Established with the vision of creating skilled professionals for the rapidly growing healthcare and beauty industry, we have successfully trained thousands of students who are now thriving in their careers.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Our institute combines theoretical knowledge with extensive practical training, ensuring that our graduates are job-ready from day one. With government-recognized certifications, modern infrastructure, and experienced faculty, ISATS stands as a trusted name in skill-based healthcare education.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Vision Section */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Card className="shadow-lg rounded-2xl border-slate-200 bg-gradient-to-br from-primary/5 to-accent/5">
                <CardHeader>
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Target className="h-7 w-7 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-semibold">Our vision</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    To provide skill-based education for employment generation in the healthcare and aesthetic industry, creating a workforce of competent professionals who contribute to the growth and development of the sector while achieving personal and professional success.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-20 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Lightbulb className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-3xl md:text-4xl font-semibold text-foreground">Our mission</h2>
              </div>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                We are committed to excellence in education through three core pillars
              </p>
            </motion.div>

            {/* Asymmetric Layout for 3 Pillars */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {missionPillars.map((pillar, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={index === 1 ? 'lg:mt-8' : ''}
                >
                  <Card className="h-full shadow-lg hover:shadow-2xl transition-all duration-300 rounded-2xl border-slate-200">
                    <CardHeader>
                      <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                        <pillar.icon className="h-7 w-7 text-primary" />
                      </div>
                      <CardTitle className="text-xl font-semibold">{pillar.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">{pillar.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose ISATS Section */}
        <section className="py-20 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-4" style={{ textWrap: 'balance' }}>
                Why choose ISATS
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Discover what makes us the preferred choice for aspiring healthcare professionals
              </p>
            </motion.div>

            {/* 2+2 Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {whyChoose.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="h-full bg-white shadow-lg hover:shadow-2xl transition-all duration-300 rounded-2xl border-slate-200">
                    <CardHeader>
                      <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                        <item.icon className="h-7 w-7 text-primary" />
                      </div>
                      <CardTitle className="text-xl font-semibold">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <Footer />
        <WhatsAppButton />
      </div>
    </>
  );
};

export default AboutUsPage;