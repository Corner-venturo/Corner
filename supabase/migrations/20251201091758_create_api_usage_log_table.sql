-- Create the api_usage_log table
CREATE TABLE public.api_usage_log (
    id bigserial PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    api_service text NOT NULL,
    notes text
);

-- Add a comment to the table and columns
COMMENT ON TABLE public.api_usage_log IS '紀錄對外部 API 的呼叫';
COMMENT ON COLUMN public.api_usage_log.api_service IS '被呼叫的 API 服務名稱，例如：Mindee OCR';
COMMENT ON COLUMN public.api_usage_log.notes IS '其他備註';

-- Enable Row Level Security
ALTER TABLE public.api_usage_log ENABLE ROW LEVEL SECURITY;

-- This policy allows service_role users (like backend functions) to insert into the log.
CREATE POLICY "Allow service_role to insert" ON public.api_usage_log FOR INSERT WITH CHECK (auth.role() = 'service_role');
-- This policy allows authenticated users to read the log (for the dashboard).
-- You might want to restrict this further depending on who can see the dashboard.
CREATE POLICY "Allow authenticated users to read" ON public.api_usage_log FOR SELECT USING (auth.role() = 'authenticated');
