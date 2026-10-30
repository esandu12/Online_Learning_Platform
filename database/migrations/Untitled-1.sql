SELECT
    email,
    role,
    status,
    created_at
FROM auth_user
ORDER BY created_at DESC;