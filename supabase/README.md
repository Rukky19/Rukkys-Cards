# Supabase setup

The browser client uses Realtime Broadcast channels named `card-table-<ROOM_CODE>`. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

This is currently a prototype transport: the browser broadcasts full game state and does not yet provide authoritative server-side turn validation, seat ownership, or reconnect recovery. Do not expose sensitive data or use for money/prize games. Before production multiplayer, move game state mutations to an Edge Function or server and persist room state with row-level security.
