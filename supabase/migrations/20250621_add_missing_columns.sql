-- Add missing columns to songs table
ALTER TABLE songs 
ADD COLUMN IF NOT EXISTS mureka_task_id text,
ADD COLUMN IF NOT EXISTS mureka_data jsonb,
ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone;

-- Also ensure backup_audio_url exists
ALTER TABLE songs
ADD COLUMN IF NOT EXISTS backup_audio_url text;

-- Add song_title column if missing
ALTER TABLE songs
ADD COLUMN IF NOT EXISTS song_title text;