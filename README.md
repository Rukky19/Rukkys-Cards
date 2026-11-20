# Rukky's Card Table

A Next.js port of the Crazy Eights prototype for a custom 52-card deck.

## Run locally
```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Card artwork
Place the 52 optimized WebP card faces in `public/cards/` using the existing filenames (for example `AS.webp`, `10H.webp`, `JC.webp`, `QS.webp`), plus `BACK.webp`. The UI has a text fallback until artwork is present. Keep the corrected face-card mappings: `JC` is Jack of Clubs, `QS` is Queen of Spades, and `QC` is Queen of Clubs.

## Online rooms
Online room sync uses Supabase Realtime Broadcast. Create a Supabase project, copy its project URL and anon key into `.env.local` using the names in `.env.example`, and enable Realtime for anonymous public channels. For production, add server-authoritative validation and room access controls before using this for competitive play. The solo game works without Supabase.

## Current scope
- Solo Crazy Eights against a practice opponent.
- Private room-code interface and Supabase broadcast adapter scaffold.
- Mobile-friendly layout and custom card-art path support.
