-- Add missing DELETE policy for songs table
create policy "Users can delete own songs" on songs
  for delete using (auth.uid() = user_id);