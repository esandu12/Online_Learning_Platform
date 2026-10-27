-- Allow an authenticated administrator to invite another administrator without public admin signup.
CREATE TABLE IF NOT EXISTS admin_invitation (
  invitation_id CHAR(36) NOT NULL,
  email VARCHAR(100) NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  accepted_at DATETIME DEFAULT NULL,
  created_by CHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (invitation_id),
  UNIQUE KEY uq_admin_invitation_token (token_hash),
  KEY idx_admin_invitation_email (email),
  CONSTRAINT fk_admin_invitation_creator FOREIGN KEY (created_by)
    REFERENCES auth_user (account_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
