import * as coursesData from '@/data/coursesData.js';

// Topics a 10th-pass student may see in the Laser program.
const TENTH_LASER_TOPICS = ['Laser Hair Removal'];

export function coursesForStatus(courses, status) {
  if (status !== 'tenth') return courses;
  return courses.map((course) =>
    course.category === 'clinical_aesthetics'
      ? {
          ...course,
          name: 'Laser Hair Reduction Course',
          title: 'Laser Hair Reduction Course',
          syllabus: (course.syllabus || []).filter((topic) => TENTH_LASER_TOPICS.includes(topic)),
          outcomes: [
            'Understand laser hair reduction and safety protocols',
            'Perform laser hair reduction with confidence',
            'Ensure client safety & satisfaction',
          ],
        }
      : course,
  );
}

// Every course in the catalogue (works whatever the exports are called)
const seen = new Map();
Object.values(coursesData)
  .filter(Array.isArray)
  .flat()
  .filter((c) => c && c.category && (c.title || c.name))
  .forEach((c) => seen.set(c.title || c.name, c));
export const ALL_COURSES = [...seen.values()];

export const courseLabel = (c) => c.title || c.name;

// Courses a student may enquire about, by academic background.
// 10th pass: no injection program (Advanced CTL).
export function coursesAvailableFor(status) {
  if (status === 'tenth') {
    return ALL_COURSES.filter((c) => c.category !== 'aesthetics' && !/CTL/i.test(courseLabel(c)));
  }
  return ALL_COURSES;
}