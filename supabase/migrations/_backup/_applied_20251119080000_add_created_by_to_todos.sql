-- Add created_by column to todos table
BEGIN;

-- Add created_by column if not exists
ALTER TABLE public.todos
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add comment
COMMENT ON COLUMN public.todos.created_by IS 'User who created this todo';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_todos_created_by ON public.todos(created_by);

COMMIT;
