import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, BookOpen, CheckCircle2, Clock3, GraduationCap, Layers3, MessageCircle, Sparkles, Target, Users } from 'lucide-react';
import CourseEnquiryModal from '@/components/CourseEnquiryModal.jsx';

const safeList = (value) => Array.isArray(value) ? value : [];
const labelize = (value) => value.replaceAll('_', ' ');

function TopicGrid({ items }) {
  const topics = safeList(items);
  if (!topics.length) return <p className="isats-module-muted">Course topics will be updated soon.</p>;
  return <div className="isats-topic-grid">{topics.map((topic, index) => <div className="isats-topic-item" key={index}><span>{String(index + 1).padStart(2, '0')}</span><p>{topic}</p></div>)}</div>;
}

function CurriculumGrid({ curriculum }) {
  if (!curriculum || typeof curriculum !== 'object') return <TopicGrid items={[]} />;
  const sections = Object.entries(curriculum).flatMap(([section, value]) => {
    if (section === 'basic_vs_advanced' && value && typeof value === 'object') {
      return Object.entries(value).map(([name, items]) => ({ name, items }));
    }
    return [{ name: section, items: value }];
  }).filter(({ items }) => Array.isArray(items) && items.length);
  return <div className="isats-curriculum-grid">{sections.map(({ name, items }, index) => <motion.article className="isats-curriculum-tile" key={name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * .045, .2) }}><span className="isats-curriculum-index">0{index + 1}</span><h4>{labelize(name)}</h4><p>{items.length} learning areas</p><ul>{items.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}</ul></motion.article>)}</div>;
}

function InfoPanel({ tab, course, syllabus }) {
  const outcomes = safeList(course.outcomes);
  const eligible = safeList(course.who_can_enroll);
  const highlights = safeList(course.highlights);
  const careers = safeList(course.career_options || course.careerOptions);
  if (tab === 'modules') return course.curriculum ? <CurriculumGrid curriculum={course.curriculum} /> : <TopicGrid items={syllabus} />;
  if (tab === 'outcomes') return <div className="isats-info-grid">{outcomes.map((item, index) => <article className="isats-info-tile" key={index}><CheckCircle2 size={18}/><p>{item}</p></article>)}</div>;
  if (tab === 'eligibility') return <div className="isats-info-grid">{eligible.map((item, index) => <article className="isats-info-tile" key={index}><Users size={18}/><p>{item}</p></article>)}</div>;
  return <div className="isats-info-grid">{highlights.map((item, index) => <article className="isats-info-tile" key={index}><Sparkles size={18}/><p>{item}</p></article>)}{careers.map((item, index) => <article className="isats-info-tile" key={`career-${index}`}><Target size={18}/><p>{item}</p></article>)}</div>;
}

export default function CourseGrid({ courses = [], category = 'programme' }) {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [activeTab, setActiveTab] = useState('modules');
  const course = (Array.isArray(courses) ? courses : [])[0];
  if (!course) return <div className="isats-module-empty"><BookOpen size={26}/><h3>Course details are being updated</h3><p>Please contact our admissions team for the latest programme information.</p></div>;
  const title = course.title || course.name || 'ISATS course';
  const syllabus = safeList(course.syllabus);
  const tabs = [
    { id: 'modules', label: 'Course modules', icon: Layers3, count: course.curriculum ? Object.keys(course.curriculum).length : syllabus.length },
    { id: 'outcomes', label: 'What you’ll learn', icon: Target, count: safeList(course.outcomes).length },
    { id: 'eligibility', label: 'Who can enrol', icon: Users, count: safeList(course.who_can_enroll).length },
    { id: 'overview', label: 'Training benefits', icon: Sparkles, count: safeList(course.highlights).length },
  ].filter((tab) => tab.id === 'modules' || tab.count > 0);

  return <>
    <motion.section className="isats-course-overview" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: .5 }}>
      <div className="isats-course-overview-icon"><BookOpen size={26}/></div>
      <div className="isats-course-overview-copy"><span className="isats-section-kicker">{category.replaceAll('-', ' ').toUpperCase()} PROGRAMME</span><h2>{title}</h2><p>{course.description || 'A focused, skill-based learning pathway combining subject knowledge with practical training.'}</p><div className="isats-course-facts">{course.duration && <span><Clock3 size={15}/>{course.duration}</span>}{course.eligibility && <span><GraduationCap size={15}/>{course.eligibility}</span>}<span><Layers3 size={15}/>{syllabus.length || 'Multiple'} topics</span></div></div>
      <button type="button" className="isats-course-overview-cta" onClick={() => setSelectedCourse(course)}><MessageCircle size={17}/> Enquire now <ArrowUpRight size={15}/></button>
    </motion.section>

    <section className="isats-course-information">
      <div className="isats-course-information-heading"><div><span className="isats-section-kicker">PROGRAMME DETAILS</span><h3>Explore the learning path</h3></div><p>Choose a section to view the information you need.</p></div>
      <div className="isats-course-tabs" role="tablist" aria-label="Course information">
        {tabs.map(({ id, label, icon: Icon, count }) => <button key={id} type="button" role="tab" aria-selected={activeTab === id} className={activeTab === id ? 'is-active' : ''} onClick={() => setActiveTab(id)}><Icon size={16}/><span>{label}</span><small>{count}</small></button>)}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} role="tabpanel" className="isats-course-tab-panel" initial={{ opacity: 0, y: 9 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: .22 }}>
          <InfoPanel tab={activeTab} course={course} syllabus={syllabus}/>
        </motion.div>
      </AnimatePresence>
    </section>
    <CourseEnquiryModal course={selectedCourse} open={Boolean(selectedCourse)} onClose={() => setSelectedCourse(null)}/>
  </>;
}
