CREATE TABLE IF NOT EXISTS course_enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(120) NOT NULL,
  phone VARCHAR(16) NOT NULL,
  interested_course VARCHAR(180) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'follow_up', 'converted', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS course_enquiries_created_at_idx
  ON course_enquiries (created_at DESC);
CREATE INDEX IF NOT EXISTS course_enquiries_status_idx
  ON course_enquiries (status, created_at DESC);
