-- Seed data for development
-- This file creates initial data for testing

-- Note: Admin users should be created through the Supabase Auth API or dashboard
-- This is just an example of how to manually create one if needed

-- You can create an admin user by:
-- 1. Registering a user normally through your app
-- 2. Then updating their role to ADMIN in the profiles table

-- Example: Update a user to admin role (replace with actual user ID)
-- UPDATE public.profiles SET role = 'ADMIN' WHERE email = 'admin@example.com';

-- For testing, you can also create test users through the Supabase dashboard:
-- Go to Authentication > Users > Invite User
-- Set email: admin@luminrank.com, password: admin123
-- After they sign up, update their profile role to ADMIN
