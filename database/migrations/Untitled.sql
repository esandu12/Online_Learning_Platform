use online_learning_platform;

SELECT
    course_id,
    course_name,
    level,
    duration,
    price,
    instructor_id,
    category_id
FROM course
ORDER BY course_id;