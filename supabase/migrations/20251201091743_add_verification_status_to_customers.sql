-- Create the new enum type for verification status
CREATE TYPE public.verification_status AS ENUM ('verified', 'unverified', 'rejected');

-- Add the new column to the customers table
ALTER TABLE public.customers
ADD COLUMN verification_status public.verification_status DEFAULT 'unverified' NOT NULL;

-- Add a comment to the new column
COMMENT ON COLUMN public.customers.verification_status IS '人工驗證狀態';
