-- Add user_id column to conversations table to associate conversations with users
ALTER TABLE public.conversations 
ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Allow all operations on conversations" ON public.conversations;

-- Create secure RLS policies that only allow users to access their own conversations
CREATE POLICY "Users can view their own conversations" 
ON public.conversations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations" 
ON public.conversations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" 
ON public.conversations 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create a security definer function for admin access to all conversations
CREATE OR REPLACE FUNCTION public.get_all_conversations_admin()
RETURNS TABLE (
  id uuid,
  session_id uuid,
  created_at timestamp with time zone,
  is_user boolean,
  message text,
  error_message text,
  language character varying,
  user_id uuid,
  success boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, session_id, created_at, is_user, message, error_message, language, user_id, success
  FROM public.conversations
  ORDER BY created_at DESC;
$$;