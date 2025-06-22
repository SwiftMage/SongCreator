#!/bin/bash

# Mureka API request to generate song with provided lyrics
# Make sure to set your MUREKA_API_KEY environment variable first

curl -X POST "https://api.mureka.ai/v1/song/generate" \
  -H "Authorization: Bearer $MUREKA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "lyrics": "I walked through the fire, barefoot and blind\nSearching for answers I couldn'\''t define\nBut every burned bridge lit a spark in my chest\nNow I carry the lessons, not the regret\n\nAnd I breathe again, stronger this time\nWith every scar, I draw the line\nThe dark tried to break me, but I wouldn'\''t bend\nNow I'\''m rising up — and I breathe again\n\nI held onto silence like it was gold\nAfraid of the truth my heart tried to hold\nBut the cracks let the light in, soft and sincere\nNow I sing through the noise, crystal clear\n\nAnd I breathe again, louder than fear\nEvery doubt fading year by year\nThe storm tried to drown me, but I learned to swim\nNow I'\''m rising up — and I breathe again\n\nHope'\''s not a whisper, it'\''s thunder inside\nI'\''m done running scared, I'\''m done trying to hide\n\nSo I breathe again, with fire in my soul\nA story reborn, a life made whole\nThe past tried to break me, but it couldn'\''t win\nNow I'\''m rising up — and I breathe again",
    "model": "mureka-6",
    "prompt": "pop rock, inspirational, uplifting, modern, high quality, studio production"
  }'