-- Add updated_by column to todos table
BEGIN;

-- Add updated_by column if not exists
ALTER TABLE public.todos
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add comment
COMMENT ON COLUMN public.todos.updated_by IS 'User who last updated this todo';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_todos_updated_by ON public.todos(updated_by);

COMMIT;
