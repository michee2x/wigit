-- Add email and password hash to businesses for authentication
ALTER TABLE businesses 
ADD COLUMN email text UNIQUE,
ADD COLUMN password_hash text;
