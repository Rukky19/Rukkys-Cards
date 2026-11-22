"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { canPlay, createGame, drawCard, isRed, playCard, rankOf, suitOf, SYMBOL, type CardCode, type GameState, type Suit } from "@/lib/game";

function PlayingCard({ code, back = false, active = false, onClick }: { code?: CardCode; back?: boolean; active?: boolean; onClick?: () => void }) {
  const [failed, setFailed] = useState(false);
  const label = code ? `${rankOf(code)}${SYMBOL[suitOf(code)]}` : "Card back";
  return <button className={`playing-card ${back ? "back" : ""} ${active ? "playable" : ""}`} onClick={onClick} disabled={!onClick} aria-label={label}>
    {!back && code && !failed ? <img src={`/cards/${code}.webp`} alt={label} onError={() => setFailed(true)} /> : back ? <img src="/cards/BACK.webp" alt="Face-down card" onError={() => setFailed(true)} /> : null}
    {(failed || (!code && !back)) && <span className={`fallback ${code && isRed(suitOf(code)) ? "red" : ""}`}><b>{code ? rankOf(code) : "✦"}</b><strong>{code ? SYMBOL[suitOf(code)] : "RCT"}</strong></span>}
  </button>;
}

export default function Home() {
  const [game, setGame] = useState<GameState>(() => createGame());
  const [mode, setMode] = useState<"solo" | "online">("solo");
  const [room, setRoom] = useState("");
  const [roomInput, setRoomInput] = useState("");
  const [onlineStatus, setOnlineStatus] = useState("Solo table");
  const [pendingEight, setPendingEight] = useState<CardCode | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [showOpponentTile, setShowOpponentTile] = useState(false);
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const top = game.discard[game.discard.length - 1];
  const playableCount = useMemo(() => game.hand.filter(c => canPlay(c, game)).length, [game]);

  useEffect(() => {
    if (game.message.startsWith("🚫 NO PLAY!") || game.message.startsWith("Your partner played")) {
      setShowOpponentTile(true);
      const timeout = window.setTimeout(() => setShowOpponentTile(false), 2800);
      return () => window.clearTimeout(timeout);
    }
    setShowOpponentTile(false);
  }, [game.message]);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && key) setSupabase(createClient(url, key));
  }, []);

  useEffect(() => {
    if (mode !== "online" || !room || !supabase) return;
    const channel = supabase.channel(`card-table-${room}`, { config: { broadcast: { self: false }, presence: { key: crypto.randomUUID() } } });
    channel.on("broadcast", { event: "game-state" }, ({ payload }) => {
      if (payload?.state) setGame(payload.state as GameState);
    }).subscribe(status => setOnlineStatus(status === "SUBSCRIBED" ? `Room ${room} · connected` : status));
    return () => { void supabase.removeChannel(channel); };
  }, [mode, room, supabase]);

  const broadcast = async (next: GameState) => {
    setGame(next);
    if (mode === "online" && room && supabase) {
      const channel = supabase.channel(`card-table-${room}`);
      await channel.send({ type: "broadcast", event: "game-state", payload: { state: next } });
    }
  };
  const startOnline = () => {
    if (!supabase) { setOnlineStatus("Online play needs Supabase settings"); return; }
    const code = roomInput.trim().toUpperCase() || Math.random().toString(36).slice(2, 8).toUpperCase();
    setRoom(code); setRoomInput(code); setMode("online"); setGame(createGame()); setOnlineStatus(`Room ${code} · connecting`);
  };
  const newGame = () => { setPendingEight(null); setShowOpponentTile(false); setGame(createGame()); };
  const onPlay = (card: CardCode) => {
    if (rankOf(card) === "8") { setPendingEight(card); return; }
    void broadcast(playCard(game, card));
  };
  const chooseSuit = (suit: Suit) => {
    if (!pendingEight) return;
    void broadcast(playCard(game, pendingEight, suit)); setPendingEight(null);
  };
  const draw = () => void broadcast(drawCard(game));

  return <main className="shell">
    <header className="masthead">
      <div><div className="eyebrow">A PERSONAL DECK · 52 CARDS</div><h1>Rukky&apos;s card table</h1><p>First game: Crazy Eights. Learn as you play.</p></div>
      <span className="edition">✦ Teach-me playground</span>
    </header>
    <nav className="toolbar">
      <button className="pill primary" onClick={newGame}>↻ New game</button>
      <button className="pill" onClick={() => setGame(g => ({ ...g, hints: !g.hints }))}>Hints: {game.hints ? "on" : "off"}</button>
      <button className="pill" onClick={() => setShowRules(v => !v)}>{showRules ? "Hide" : "How to play"}</button>
      <div className="mode-switch"><button className={mode === "solo" ? "selected" : ""} onClick={() => { setMode("solo"); setRoom(""); newGame(); }}>Solo</button><button className={mode === "online" ? "selected" : ""} onClick={() => setMode("online")}>Play with a friend</button></div>
    </nav>
    {mode === "online" && <section className="online-panel">
      <div><b>Private table</b><small>{onlineStatus}</small></div>
      <input value={roomInput} onChange={e => setRoomInput(e.target.value.toUpperCase())} placeholder="Room code (e.g. RUKKY1)" maxLength={12} />
      <button className="pill primary" onClick={startOnline}>Create / join room</button>
      {room && <button className="pill" onClick={() => navigator.clipboard.writeText(`${location.origin}?room=${room}`)}>Copy invite link</button>}
    </section>}
    <section className="felt">
      <div className="opponent-row"><div><span className="who">Your playing partner</span><small>{game.opponentHand.length} cards · {mode === "solo" ? "practice opponent" : "online seat"}</small></div><span className="status">{game.turn === "opponent" ? "Playing…" : "Waiting"}</span></div>
      <div className="opponent-hand">{Array.from({ length: game.opponentHand.length }, (_, i) => <PlayingCard key={i} back />)}</div>
      {showOpponentTile && <section className={`opponent-notice-tile under-opponent ${game.message.startsWith("Your partner played") ? "played" : "no-play"}`} aria-live="polite"><span className="notice-kicker">OPPONENT ACTION</span><h2>{game.message.startsWith("Your partner played") ? "CARD PLAYED" : "NO PLAY!"}</h2><p>{game.message.startsWith("Your partner played") ? game.message.replace("Your partner played ", "Your partner played ").replace(" Your turn.", ".") : game.message.replace("🚫 NO PLAY! ", "")}</p></section>}
      <div className="table-middle">
        <div className="pile"><small>DRAW PILE · {game.deck.length}</small><PlayingCard back onClick={game.turn === "you" ? draw : undefined} /></div>
        <div className="turn-label">{game.status === "playing" ? game.turn === "you" ? "Your turn" : "Partner's turn" : "Round over"}<small>Match suit or number</small></div>
        <div className="pile"><small>TOP OF DISCARD</small><PlayingCard code={top} /><small>Current suit: {SYMBOL[game.activeSuit]}</small></div>
      </div>
      <div className={`message ${game.message.startsWith("🚫") ? "notice" : ""}`} aria-live="polite">{game.message}</div>
      <div className="hand-heading"><span className="who">Your hand</span><small>{game.hand.length} cards · {playableCount} playable</small></div>
      <div className="my-hand">{game.hand.map(card => <PlayingCard key={card} code={card} active={game.turn === "you" && game.status === "playing" && canPlay(card, game)} onClick={game.turn === "you" && game.status === "playing" && canPlay(card, game) ? () => onPlay(card) : undefined} />)}</div>
    </section>
    {game.hints && <aside className="hint"><b>Quick lesson:</b> Crazy Eights is a shedding game. Be the first to get rid of all your cards. Match the top card&apos;s suit or rank. Eights are wild and let you choose the next suit.</aside>}
    {showRules && <section className="rules"><h2>How to play Crazy Eights</h2><ol><li>Each player starts with seven cards.</li><li>Play a card matching the top discard&apos;s suit or rank.</li><li>An eight is wild. Play it anytime and choose the next suit.</li><li>If you cannot play, draw one card. If it is playable, you may play it immediately.</li><li>First player to empty their hand wins.</li></ol></section>}
    
    {pendingEight && <div className="modal-backdrop"><section className="modal"><h2>Choose the next suit</h2><p>Your eight is wild. Which suit should your partner play?</p><div className="suit-options">{(["S","H","D","C"] as Suit[]).map(s => <button key={s} className={isRed(s) ? "red" : ""} onClick={() => chooseSuit(s)}>{SYMBOL[s]}</button>)}</div></section></div>}
    {game.status !== "playing" && <div className="modal-backdrop"><section className="modal"><h2>{game.status === "won" ? "You win! 🎉" : "Your partner wins"}</h2><p>{game.message}</p><button className="pill primary" onClick={newGame}>Play again</button></section></div>}
    <footer>Your deck, your rules, your table. ♠ ♥ ♦ ♣</footer>
  </main>;
}
