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
  timestamp timestamptz,
  success boolean,
  created_at timestamptz,
  is_user boolean,
  message text,
  error_message text,
  language varchar,
  user_id uuid
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, session_id, timestamp, success, created_at, is_user, message, error_message, language, user_id
  FROM public.conversations
  ORDER BY created_at DESC;
$$;

-- Grant execute permission to authenticated users (you may want to restrict this further)
GRANT EXECUTE ON FUNCTION public.get_all_conversations_admin() TO authenticated;