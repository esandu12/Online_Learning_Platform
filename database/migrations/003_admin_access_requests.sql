-- Additive administrator access workflow. Safe to re-run; existing accounts and courses remain unchanged.
CREATE TABLE IF NOT EXISTS auth_admin_owner (
  owner_id TINYINT UNSIGNED NOT NULL,
  account_id CHAR(36) NOT NULL,
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (owner_id),
  UNIQUE KEY uq_auth_admin_owner_account (account_id),
  CONSTRAINT chk_auth_admin_owner_singleton CHECK (owner_id = 1),
  CONSTRAINT fk_auth_admin_owner_account FOREIGN KEY (account_id)
    REFERENCES auth_user (account_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- The first active admin is the main admin unless ownership has already been recorded.
INSERT IGNORE INTO auth_admin_owner (owner_id, account_id)
SELECT 1, account_id FROM auth_user
WHERE role='admin' AND status='active'
ORDER BY created_at, account_id
LIMIT 1;

CREATE TABLE IF NOT EXISTS admin_access_request (
  request_id CHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  reason VARCHAR(1000) DEFAULT NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  pending_email VARCHAR(100) GENERATED ALWAYS AS (
    CASE WHEN status='pending' THEN email ELSE NULL END
  ) STORED,
  invitation_id CHAR(36) DEFAULT NULL,
  decided_by CHAR(36) DEFAULT NULL,
  decided_at DATETIME DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (request_id),
  UNIQUE KEY uq_admin_request_pending_email (pending_email),
  UNIQUE KEY uq_admin_request_invitation (invitation_id),
  KEY idx_admin_request_created (created_at),
  CONSTRAINT fk_admin_request_invitation FOREIGN KEY (invitation_id)
    REFERENCES admin_invitation (invitation_id) ON DELETE SET NULL,
  CONSTRAINT fk_admin_request_decider FOREIGN KEY (decided_by)
    REFERENCES auth_admin_owner (account_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
