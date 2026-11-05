-- ISATS course catalogue — PostgreSQL source of truth.
-- The catalogue does not publish duration/eligibility, so those fields are nullable
-- instead of inventing values that are not present in the supplied catalogue.

CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL CHECK (
    category IN ('trichology', 'aesthetics', 'clinical_aesthetics')
  ),
  name TEXT NOT NULL,
  duration TEXT,
  eligibility TEXT,
  syllabus TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  career_options TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  highlights TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  outcomes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  who_can_enroll TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  curriculum JSONB
);

ALTER TABLE courses ADD COLUMN IF NOT EXISTS duration TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS eligibility TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS syllabus TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE courses ADD COLUMN IF NOT EXISTS career_options TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE courses ADD COLUMN IF NOT EXISTS highlights TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE courses ADD COLUMN IF NOT EXISTS outcomes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE courses ADD COLUMN IF NOT EXISTS who_can_enroll TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE courses ADD COLUMN IF NOT EXISTS curriculum JSONB;

-- Remove the previous generic course records from this project so PostgreSQL
-- reflects the three programs shown in the supplied ISATS catalogue.
DELETE FROM courses
WHERE id IN (
  'cert-trichology', 'diploma-trichology', 'adv-diploma-trichology', 'clinical-trichology',
  'hair-fall-treatment', 'scalp-treatment', 'hair-transplant-assistant', 'hair-prp-training',
  'cert-aesthetics', 'diploma-aesthetic-science', 'adv-diploma-aesthetics', 'skin-specialist',
  'cosmetology', 'facial-skin-treatment', 'chemical-peel', 'skin-whitening', 'anti-aging',
  'prp-therapy', 'botox-fillers', 'laser-hair-removal', 'microneedling', 'hydra-facial',
  'advanced-skin-therapy', 'clinical-cosmetology'
);

INSERT INTO courses (
  id, category, name, duration, eligibility, syllabus, career_options,
  highlights, outcomes, who_can_enroll, curriculum
)
VALUES
(
  'advanced-ctl-program',
  'aesthetics',
  'Advanced CTL Program',
  NULL,
  NULL,
  ARRAY[
    'Foundation of Cosmetology', 'Basic Trichology', 'Laser Fundamentals',
    'Skin Analysis', 'Facials & Peels', 'Hair Science', 'Laser Basics',
    'MNRF', 'PRP & GFC', 'Derma Pen', 'Botox', 'Fillers', 'Threads',
    'Advanced Peels', 'Hi-Fu', 'Cryolipolysis', 'Cavitation & RF',
    'LED Therapy', 'Exosomes', 'Tattoo Removal', 'Laser Toning',
    'Injection 360, QR678', 'Hair Fillers', 'Social Media Marketing',
    'Clinic Setup Training', 'Medico-Legal Aspects', 'IV Drips (Complimentary)'
  ],
  ARRAY[]::TEXT[],
  ARRAY[
    'International Standard Training',
    'Expert Dermatologists & Industry Professionals',
    'State-of-the-Art Infrastructure & Equipment',
    '100% Practical & Hands-on Learning',
    'Placement Assistance & Business Support'
  ],
  ARRAY[
    'Learn. Practice. Perform. Lead.',
    'Transform Your Skills',
    'Transform Lives'
  ],
  ARRAY[]::TEXT[],
  '{
    "basic_ctl_program": [
      "Foundation of Cosmetology", "Basic Trichology", "Laser Fundamentals",
      "Skin Analysis", "Facials & Peels", "Hair Science", "Laser Basics"
    ],
    "advanced_ctl_program_includes_everything_in_basic_plus": [
      "MNRF", "PRP & GFC", "Derma Pen", "Botox", "Fillers", "Threads",
      "Advanced Peels", "Hi-Fu", "Cryolipolysis", "Cavitation & RF",
      "LED Therapy", "Exosomes", "Tattoo Removal", "Laser Toning",
      "Injection 360, QR678", "Hair Fillers", "Social Media Marketing",
      "Clinic Setup Training", "Medico-Legal Aspects", "IV Drips (Complimentary)"
    ],
    "cosmetology_and_skin_aesthetics": [
      "MNRF (Microneedling Radio Frequency)", "PRP", "Derma Pen (Microneedling)",
      "Botox", "Fillers", "Threads", "Advanced Peels", "Hi-Fu", "Cryolipolysis",
      "Cavitation & RF (Body Contouring)", "LED Light Therapy", "Exosomes",
      "Injections 360, QR678", "Tattoo Removal", "Laser Toning",
      "Pre/Post Care for All Treatments", "Home Care Products"
    ],
    "trichology": [
      "PRP & GFC Benefits", "Plasma Preparation", "Hair Fillers", "Exosomes for Hair",
      "Injection 360, QR678", "Anatomy & Physiology of Hair", "Hair Growth Cycles",
      "Hair Fall Analysis", "Scalp Disorders & Treatments", "Hair Volume Enhancement",
      "Pre/Post Care for Hair Treatments", "Home Care Products"
    ],
    "laser_science_and_technology": [
      "Nd:YAG Laser", "Pico Laser", "Triple Diode Laser", "CO2 Laser",
      "Laser Hair Reduction", "Laser Toning", "Tattoo Removal Laser",
      "Pigmentation Treatments", "Skin Rejuvenation Lasers", "Pre/Post Laser Care",
      "Laser Safety & Protocols", "Complication Management"
    ],
    "additional_knowledge": [
      "Pre/Post Care for All Treatments", "IV Drips (Complimentary)",
      "Medico Legalities & Ethical Aspects", "Social Media Marketing & Management",
      "Help with Setting Up New Practice", "Home Care Products", "Client Consultation & Management"
    ],
    "basic_vs_advanced": {
      "basic_ctl_program": [
        "Basic Theory & Fundamentals", "Limited Practical Exposure", "Basic Facials & Peels",
        "Basic Laser Knowledge", "Basic Hair Care & Treatments", "Standard Certification",
        "Limited Business Guidance"
      ],
      "advanced_ctl_program": [
        "Advanced Concepts + Latest Technologies", "Extensive Hands-on Practice",
        "Advanced Aesthetic, Hair & Laser Treatments",
        "Social Media, Marketing & Clinic Setup Support", "Industry Recognized Certification",
        "Live Demonstrations + Real Patient Practice"
      ]
    }
  }'::jsonb
),
(
  'trichology-certification',
  'trichology',
  'Trichology Certification Program',
  NULL,
  NULL,
  ARRAY[
    'Professional Ethics', 'Sanitization & Sterilization', 'Self Hygiene / Centre Hygiene',
    'Client Handling', 'Anatomy & Physiology of Hair', 'Diseases of Scalp',
    'Hair Shaft Repair', 'Hair Volume Enhancement', 'Stem Cell Therapy',
    'Diet & Nutrition for Hair', 'Hair Care Routine', 'Hair Care Product Knowledge',
    'Hair Care Daily Routine as per Hair Type', 'HI Frequency Treatment',
    'Dandruff Treatment', 'Hair Panel', 'Hair Regrowth Treatment', 'Light Therapy for Hair',
    'Consumables', 'Vendor Details', 'Pre / Post Care', 'Scalp Peel',
    'Causes of Hair Fall', 'Hair Analysis Machine (Tricoscope)',
    'Hair Thinning Causes and Treatments'
  ],
  ARRAY[]::TEXT[],
  ARRAY[
    'Expert Faculty — Learn from experienced trichology professionals',
    'Practical Training — Hands-on clinical training & live practice',
    'Industry Relevant — Curriculum designed as per industry standards',
    'Career Focused — Build skills for a successful trichology career'
  ],
  ARRAY[
    'Understand hair & scalp anatomy and conditions in-depth',
    'Diagnose scalp & hair issues using advanced tools',
    'Perform trichology treatments with confidence',
    'Plan customized treatment protocols for effective results',
    'Build a successful trichology practice'
  ],
  ARRAY[
    'Beauty & Salon Professionals', 'Cosmetologists & Estheticians', 'Medical Professionals',
    'Aspiring Trichologists', 'Anyone passionate about hair & scalp care'
  ],
  NULL
),
(
  'laser-certification',
  'clinical_aesthetics',
  'Laser Certification Program',
  NULL,
  NULL,
  ARRAY[
    'Professional Ethics', 'Sanitization & Sterilization', 'Self Hygiene / Centre Hygiene',
    'Client Handling', 'Laser Fundamentals & Scope', 'Introduction to Laser',
    'Photo Facial', 'Pre / Post Care', 'Carbon', 'Q - Switch Laser',
    'Laser Hair Removal', 'Vendor Details', 'Machine Knowledge', 'Consumables',
    'Hair Panel (LLT Low Level Laser Treatment) for Hair Growth'
  ],
  ARRAY[]::TEXT[],
  ARRAY[
    'Expert Faculty — Learn from experienced professionals',
    'Practical Training — Hands-on clinical training & live practice',
    'Industry Relevant — Curriculum designed as per industry standards',
    'Career Focused — Build skills for a successful career in laser technology'
  ],
  ARRAY[
    'Understand laser science & safety protocols',
    'Perform laser treatments with confidence',
    'Ensure client safety & satisfaction',
    'Master advanced laser procedures',
    'Build a successful laser practice'
  ],
  ARRAY[
    'Beauty & Salon Professionals', 'Cosmetologists & Estheticians', 'Medical Professionals',
    'Aspiring Laser Technicians', 'Anyone passionate about laser technology'
  ],
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  name = EXCLUDED.name,
  duration = EXCLUDED.duration,
  eligibility = EXCLUDED.eligibility,
  syllabus = EXCLUDED.syllabus,
  career_options = EXCLUDED.career_options,
  highlights = EXCLUDED.highlights,
  outcomes = EXCLUDED.outcomes,
  who_can_enroll = EXCLUDED.who_can_enroll,
  curriculum = EXCLUDED.curriculum;

SELECT id, category, name, duration, eligibility, syllabus, highlights, outcomes, who_can_enroll
FROM courses
ORDER BY CASE category
  WHEN 'aesthetics' THEN 1
  WHEN 'trichology' THEN 2
  WHEN 'clinical_aesthetics' THEN 3
END, name;
