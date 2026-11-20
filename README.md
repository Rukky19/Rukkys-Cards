# Rukky's Card Table

A Next.js App Router port of the Crazy Eights practice prototype.

## Run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000.

## Current status
- **Implemented in this commit:** Next.js + TypeScript app shell, responsive Crazy Eights table, local solo practice logic, suit picker, hints, rules, win/loss state, and the prominent NO PLAY notice.
- **Not yet implemented:** functional online multiplayer. The room UI is a placeholder; it does not currently create a playable shared room. Supabase setup notes are a future integration guide, not a working multiplayer service.
- **Artwork:** the original 52-card WebP deck and hills background are not yet committed to `public/cards/`. The interface currently falls back to simple card placeholders. The source archive is `rukky-crazy-eights-v0.6-hills.zip`; preserve its corrected filenames (`JC` = Jack of Clubs, `QS` = Queen of Spades, `QC` = Queen of Clubs) when adding the assets.

## Next steps
1. Add the original WebP deck and background to the public assets folder.
2. Implement authoritative private rooms, seat assignment, state sync, and reconnect handling with Supabase Realtime plus server-side validation.
3. Run a production build and test desktop/mobile gameplay.
