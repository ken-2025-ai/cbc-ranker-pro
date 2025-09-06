-- Link existing institution with the authenticated user
UPDATE admin_institutions 
SET user_id = '452ea433-6df7-444e-906c-c9117d099163'
WHERE email = 'kenkendagor3@gmail.com' AND user_id IS NULL;