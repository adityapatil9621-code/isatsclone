import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Clock, GraduationCap, MessageCircle, Target, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import CourseEnquiryModal from '@/components/CourseEnquiryModal.jsx';

const CurriculumList = ({ title, items }) => {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <div className="mt-5">
      <p className="font-semibold mb-2">{title}</p>
      <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
        {items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
      </ul>
    </div>
  );
};

export default function CourseGrid({ courses = [] }) {
  const [selectedCourse, setSelectedCourse] = useState(null);

  return (
    <div className="grid grid-cols-1 gap-6">
      {courses.map((course, index) => (
        <motion.div
          key={course.id || index}
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.04 }}
        >
          <Card className="h-full hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="text-2xl">{course.title || course.name}</CardTitle>
              {(course.duration || course.eligibility) && (
                <div className="flex gap-2 flex-wrap">
                  {course.duration && (
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      {course.duration}
                    </Badge>
                  )}
                  {course.eligibility && (
                    <Badge variant="secondary">
                      <GraduationCap className="h-3 w-3 mr-1" />
                      {course.eligibility}
                    </Badge>
                  )}
                </div>
              )}
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <p className="font-semibold">Modules covered</p>
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                    {(course.syllabus || []).map((item, itemIndex) => (
                      <li key={`${item}-${itemIndex}`}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-5 w-5 text-primary" />
                    <p className="font-semibold">Course outcomes</p>
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                    {(course.outcomes || []).map((item, itemIndex) => (
                      <li key={`${item}-${itemIndex}`}>{item}</li>
                    ))}
                  </ul>

                  {Array.isArray(course.who_can_enroll) && course.who_can_enroll.length > 0 && (
                    <div className="mt-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Users className="h-5 w-5 text-primary" />
                        <p className="font-semibold">Who can enrol?</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {course.who_can_enroll.map((item, itemIndex) => (
                          <Badge key={`${item}-${itemIndex}`} variant="secondary">{item}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {Array.isArray(course.highlights) && course.highlights.length > 0 && (
                    <div className="mt-6">
                      <p className="font-semibold mb-2">Training highlights</p>
                      <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                        {course.highlights.map((item, itemIndex) => (
                          <li key={`${item}-${itemIndex}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {course.curriculum && (
                <div className="mt-8 border-t pt-6">
                  <p className="font-semibold text-lg mb-3">Advanced CTL curriculum</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {Object.entries(course.curriculum).map(([section, value]) => {
                      if (section === 'basic_vs_advanced') {
                        return (
                          <div key={section} className="md:col-span-2 xl:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-5">
                            {Object.entries(value).map(([comparison, items]) => (
                              <div key={comparison} className="rounded-xl border p-4">
                                <p className="font-semibold capitalize mb-2">
                                  {comparison.replaceAll('_', ' ')}
                                </p>
                                <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                                  {items.map((item, itemIndex) => <li key={`${item}-${itemIndex}`}>{item}</li>)}
                                </ul>
                              </div>
                            ))}
                          </div>
                        );
                      }

                      return (
                        <div key={section} className="rounded-xl border p-4">
                          <p className="font-semibold capitalize mb-2">
                            {section.replaceAll('_', ' ')}
                          </p>
                          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                            {(Array.isArray(value) ? value : []).map((item, itemIndex) => (
                              <li key={`${item}-${itemIndex}`}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {Array.isArray(course.career_options) && course.career_options.length > 0 && (
                <CurriculumList title="Career options" items={course.career_options} />
              )}
              <button
                type="button"
                onClick={() => setSelectedCourse(course)}
                aria-label={`Enquire about ${course.title || course.name}`}
                className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition active:scale-95"
              >
                <MessageCircle className="h-4 w-4" />
                Enquire now
              </button>
            </CardContent>
          </Card>
        </motion.div>
      ))}
      <CourseEnquiryModal course={selectedCourse} open={Boolean(selectedCourse)} onClose={() => setSelectedCourse(null)} />
    </div>
  );
}
