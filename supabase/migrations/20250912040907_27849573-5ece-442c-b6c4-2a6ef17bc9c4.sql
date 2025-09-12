-- Create conversations table to store all chat interactions
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  is_user BOOLEAN NOT NULL,
  language VARCHAR(10) DEFAULT 'en',
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (since this is an admin feature)
CREATE POLICY "Allow all operations on conversations" 
ON public.conversations 
FOR ALL 
USING (true);

-- Create index for better performance on common queries
CREATE INDEX idx_conversations_timestamp ON public.conversations(timestamp);
CREATE INDEX idx_conversations_language ON public.conversations(language);
CREATE INDEX idx_conversations_session_id ON public.conversations(session_id);
CREATE INDEX idx_conversations_is_user ON public.conversations(is_user);