Tables-- Additive authentication migration. Safe to apply to an existing database:
-- it does not alter or delete any existing platform rows or tables.
CREATE TABLE IF NOT EXISTS auth_user (
  account_id CHAR(36) NOT NULL,
  email VARCHAR(254) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student', 'instructor', 'admin') NOT NULL,
  status ENUM('pending', 'active', 'disabled') NOT NULL DEFAULT 'active',
  student_id VARCHAR(10) DEFAULT NULL,
  instructor_id VARCHAR(10) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (account_id),
  UNIQUE KEY uq_auth_user_email (email),
  UNIQUE KEY uq_auth_user_student (student_id),
  UNIQUE KEY uq_auth_user_instructor (instructor_id),
  CONSTRAINT fk_auth_user_student FOREIGN KEY (student_id)
    REFERENCES student (student_id) ON DELETE CASCADE,
  CONSTRAINT fk_auth_user_instructor FOREIGN KEY (instructor_id)
    REFERENCES instructor (instructor_id) ON DELETE CASCADE,
  CONSTRAINT chk_auth_user_profile CHECK (
    (role = 'student' AND student_id IS NOT NULL AND instructor_id IS NULL) OR
    (role = 'instructor' AND instructor_id IS NOT NULL AND student_id IS NULL) OR
    (role = 'admin' AND student_id IS NULL AND instructor_id IS NULL)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS auth_session (
  session_id CHAR(64) NOT NULL,
  account_id CHAR(36) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (session_id),
  KEY idx_auth_session_expiry (expires_at),
  CONSTRAINT fk_auth_session_user FOREIGN KEY (account_id)
    REFERENCES auth_user (account_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS instructor_invitation (
  invitation_id CHAR(36) NOT NULL,
  email VARCHAR(254) NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  accepted_at DATETIME DEFAULT NULL,
  created_by CHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (invitation_id),
  UNIQUE KEY uq_instructor_invitation_token (token_hash),
  KEY idx_instructor_invitation_email (email),
  CONSTRAINT fk_invitation_admin FOREIGN KEY (created_by)
    REFERENCES auth_user (account_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
