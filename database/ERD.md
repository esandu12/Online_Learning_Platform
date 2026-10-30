# Entity relationship diagram

This diagram summarizes the tables and foreign keys in `schema.sql`. The associative tables `enrollment`, `student_assignment`, and `quiz_attempt` connect students to learning activity. A student's phones are stored as separate rows.

```mermaid
erDiagram
  CATEGORY ||--o{ COURSE : classifies
  INSTRUCTOR ||--o{ COURSE : teaches
  INSTRUCTOR o|--o{ INSTRUCTOR : supervises
  COURSE ||--o{ LESSON : contains
  COURSE ||--o{ ASSIGNMENT : sets
  COURSE ||--o{ QUIZ : offers
  STUDENT ||--o{ ENROLLMENT : joins
  COURSE ||--o{ ENROLLMENT : has
  STUDENT ||--o{ CERTIFICATE : earns
  COURSE ||--o{ CERTIFICATE : awards
  STUDENT ||--o{ PAYMENT : makes
  STUDENT ||--o{ STUDENT_PHONE : has
  STUDENT ||--o{ STUDENT_ASSIGNMENT : submits
  ASSIGNMENT ||--o{ STUDENT_ASSIGNMENT : receives
  STUDENT ||--o{ QUIZ_ATTEMPT : takes
  QUIZ ||--o{ QUIZ_ATTEMPT : records
  AUTH_USER ||--o{ AUTH_SESSION : starts
  AUTH_USER o|--o| STUDENT : account_for
  AUTH_USER o|--o| INSTRUCTOR : account_for
  AUTH_USER ||--o{ INSTRUCTOR_INVITATION : creates
  AUTH_USER ||--o{ ADMIN_INVITATION : creates
  AUTH_ADMIN_OWNER ||--o{ ADMIN_ACCESS_REQUEST : decides
  ADMIN_INVITATION o|--o| ADMIN_ACCESS_REQUEST : issued_for

  CATEGORY {
    varchar category_id PK
    varchar category_name
  }
  INSTRUCTOR {
    varchar instructor_id PK
    varchar instructor_name
    varchar email UK
    varchar supervisor_id FK
  }
  COURSE {
    varchar course_id PK
    varchar course_name
    varchar level
    varchar duration
    decimal price
    varchar instructor_id FK
    varchar category_id FK
  }
  STUDENT {
    varchar student_id PK
    date student_bd
    varchar first_name
    varchar last_name
    varchar email UK
  }
  ENROLLMENT {
    varchar student_id PK, FK
    varchar course_id PK, FK
    date enrollment_date
  }
  LESSON {
    varchar lesson_id PK
    varchar course_id FK
    varchar lesson_title
    varchar lesson_url
  }
  ASSIGNMENT {
    varchar assignment_id PK
    varchar course_id FK
    varchar assignment_title
    date deadline
  }
  STUDENT_ASSIGNMENT {
    varchar student_id PK, FK
    varchar assignment_id PK, FK
    int obtained_marks
  }
  QUIZ {
    varchar quiz_id PK
    varchar course_id FK
    int total_marks
    date quiz_date
  }
  QUIZ_ATTEMPT {
    varchar quiz_attempt_id PK
    varchar student_id FK
    varchar quiz_id FK
    int score
  }
  CERTIFICATE {
    varchar certificate_id PK
    varchar student_id FK
    varchar course_id FK
    date issued_date
  }
  PAYMENT {
    varchar payment_id PK
    varchar student_id FK
    decimal fee
    date payment_date
  }
  STUDENT_PHONE {
    int phone_id PK
    varchar student_id FK
    varchar phone_number
  }
  AUTH_USER {
    char account_id PK
    varchar email UK
    varchar password_hash
    enum role
    enum status
    varchar student_id FK
    varchar instructor_id FK
  }
  AUTH_SESSION {
    char session_id PK
    char account_id FK
    datetime expires_at
  }
  INSTRUCTOR_INVITATION {
    char invitation_id PK
    varchar email
    char token_hash UK
    datetime expires_at
    char created_by FK
  }
  AUTH_ADMIN_OWNER {
    tinyint owner_id PK
    char account_id FK
    timestamp assigned_at
  }
  ADMIN_ACCESS_REQUEST {
    char request_id PK
    varchar name
    varchar email
    varchar phone
    varchar reason
    enum status
    char invitation_id FK
    char decided_by FK
  }
  ADMIN_INVITATION {
    char invitation_id PK
    varchar email
    char token_hash UK
    datetime expires_at
    datetime accepted_at
    char created_by FK
  }
```

Primary and foreign keys above follow the current SQL schema. The enrollment primary key is the `(student_id, course_id)` pair, which prevents a duplicate enrollment for the same student and course.

Authentication and invitation tables are added by `migrations/001_auth.sql`, `migrations/002_admin_invitations.sql`, and `migrations/003_admin_access_requests.sql`; the original schema dump remains unchanged.
