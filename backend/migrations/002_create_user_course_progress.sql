-- Migration: create user_course_progress table

CREATE TABLE IF NOT EXISTS user_course_progress (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

  user_id BIGINT UNSIGNED NOT NULL,
  course_id BIGINT UNSIGNED NOT NULL,

  -- played seconds / duration of current course/video, from 0-100
  progress_percent TINYINT UNSIGNED NOT NULL DEFAULT 0,

  -- aggregated practice stats for this course
  total_answered INT UNSIGNED NOT NULL DEFAULT 0,
  total_correct INT UNSIGNED NOT NULL DEFAULT 0,

  -- percentage of correct answers, 0.00–100.00
  correct_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,

  -- last submit time for this course
  submit_at DATETIME(3) NULL,

  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (id),
  UNIQUE KEY uk_user_course (user_id, course_id),
  INDEX idx_ucp_course (course_id),
  INDEX idx_ucp_user (user_id),

  CONSTRAINT fk_ucp_user
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
