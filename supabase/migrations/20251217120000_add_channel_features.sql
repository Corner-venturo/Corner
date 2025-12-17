-- Add channel_type column for categorizing channels (PUBLIC, PRIVATE, DIRECT)
ALTER TABLE public.channels
ADD COLUMN channel_type TEXT NOT NULL DEFAULT 'PUBLIC';

-- Add a check constraint to ensure data integrity for channel_type
ALTER TABLE public.channels
ADD CONSTRAINT channels_channel_type_check CHECK (channel_type IN ('PUBLIC', 'PRIVATE', 'DIRECT'));

-- Add is_announcement column to flag announcement channels
ALTER TABLE public.channels
ADD COLUMN is_announcement BOOLEAN NOT NULL DEFAULT FALSE;

-- Add an index for faster lookups on the new columns
CREATE INDEX IF NOT EXISTS idx_channels_channel_type ON public.channels(channel_type);
CREATE INDEX IF NOT EXISTS idx_channels_is_announcement ON public.channels(is_announcement);

-- Comment on the new columns for clarity
COMMENT ON COLUMN public.channels.channel_type IS 'The type of the channel, e.g., PUBLIC, PRIVATE, or DIRECT (for DMs).';
COMMENT ON COLUMN public.channels.is_announcement IS 'Flag to identify if this is a workspace-wide announcement channel.';

