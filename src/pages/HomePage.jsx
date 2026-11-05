import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import WhatsAppButton from '@/components/WhatsAppButton.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Award, Users, Briefcase, IndianRupee, ArrowRight } from 'lucide-react';

const HomePage = () => {
  const highlights = [
    {
      icon: Award,
      title: 'Govt. recognized courses',
      description: 'All our programs are certified and recognized by government authorities'
    },
    {
      icon: Users,
      title: '100% practical training',
      description: 'Hands-on experience with modern equipment and real-world scenarios'
    },
    {
      icon: Briefcase,
      title: 'Placement assistance',
      description: 'Dedicated support to help you launch your career in healthcare aesthetics'
    },
    {
      icon: IndianRupee,
      title: 'Affordable fees',
      description: 'Quality education at competitive prices with flexible payment options'
    }
  ];


  return (
    <>
      <Helmet>
        <title>ISATS - Institute of Skill-based Aesthetic & Trichology Sciences</title>
        <meta
          name="description"
          content="ISATS offers government-recognized courses in Trichology, Aesthetics, and Clinical Aesthetics with 100% practical training and placement assistance."
        />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />

        {/* Hero Section */}
        <section className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1552693673-1bf958298935"
              alt="Professional healthcare training environment"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/85 via-slate-900/80 to-primary/60" />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
                style={{ letterSpacing: '-0.02em', textWrap: 'balance' }}
              >
                ISATS - Institute of Skill-based Aesthetic & Trichology Sciences
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed">
                Empowering Skills, Building Careers
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-base transition-all duration-200 active:scale-95">
                  <Link to="/courses">Browse courses <ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />
        </section>

        {/* Quick Highlights Section */}
        <section className="py-20 bg-background">
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
                Join thousands of successful graduates who have built rewarding careers in healthcare aesthetics
              </p>
            </motion.div>

            {/* 2+2 Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {highlights.map((highlight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="h-full shadow-lg hover:shadow-2xl transition-all duration-300 rounded-2xl border-slate-200">
                    <CardHeader>
                      <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                        <highlight.icon className="h-7 w-7 text-primary" />
                      </div>
                      <CardTitle className="text-xl font-semibold">{highlight.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base leading-relaxed">
                        {highlight.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* CTA Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-center mt-16"
            >
              <Button size="lg" asChild className="transition-all duration-200 active:scale-95">
                <Link to="/about">
                  Learn more about us
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

export default HomePage;