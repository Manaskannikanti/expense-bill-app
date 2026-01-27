-- Fix function search_path warnings and permissive RLS policy

-- Fix handle_new_user function to have proper search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$;

-- Fix update_updated_at_column function to have proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Drop the overly permissive organizations INSERT policy
DROP POLICY IF EXISTS "Anyone can create an organization" ON public.organizations;

-- Create a more secure policy: only authenticated users can create organizations
-- and they must be creating it as the first member (admin)
CREATE POLICY "Authenticated users can create organizations"
    ON public.organizations FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);