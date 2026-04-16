-- ============================================
-- AI INTERVIEWER — DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Interviews
CREATE TABLE IF NOT EXISTS public.interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    difficulty TEXT NOT NULL DEFAULT 'medium',
    status TEXT NOT NULL DEFAULT 'in_progress',
    metadata JSONB DEFAULT '{}',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questions
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID NOT NULL REFERENCES public.interviews(id) ON DELETE CASCADE,
    question_order INT NOT NULL,
    question_text TEXT NOT NULL,
    question_type TEXT DEFAULT 'technical',
    difficulty TEXT DEFAULT 'medium',
    is_followup BOOLEAN DEFAULT FALSE,
    parent_question_id UUID REFERENCES public.questions(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Responses
CREATE TABLE IF NOT EXISTS public.responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID NOT NULL REFERENCES public.interviews(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    answer_text TEXT,
    audio_url TEXT,
    time_taken_seconds INT,
    ai_evaluation JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Results
CREATE TABLE IF NOT EXISTS public.results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID NOT NULL REFERENCES public.interviews(id) ON DELETE CASCADE,
    overall_score INT CHECK (overall_score >= 0 AND overall_score <= 100),
    overall_feedback TEXT,
    strengths JSONB DEFAULT '[]',
    weaknesses JSONB DEFAULT '[]',
    category_scores JSONB DEFAULT '{}',
    detailed_analysis JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(interview_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_interviews_user ON public.interviews(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_interview ON public.questions(interview_id);
CREATE INDEX IF NOT EXISTS idx_responses_interview ON public.responses(interview_id);
CREATE INDEX IF NOT EXISTS idx_results_interview ON public.results(interview_id);

-- Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users manage own interviews" ON public.interviews
    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own questions" ON public.questions
    FOR ALL USING (
        interview_id IN (SELECT id FROM public.interviews WHERE user_id = auth.uid())
    );
CREATE POLICY "Users manage own responses" ON public.responses
    FOR ALL USING (
        interview_id IN (SELECT id FROM public.interviews WHERE user_id = auth.uid())
    );
CREATE POLICY "Users manage own results" ON public.results
    FOR ALL USING (
        interview_id IN (SELECT id FROM public.interviews WHERE user_id = auth.uid())
    );

-- Function to auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
