export const SUITS = ["C", "D", "H", "S"] as const;
export const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"] as const;
export type Suit = typeof SUITS[number];
export type CardCode = `${typeof RANKS[number]}${Suit}`;
export type Player = "you" | "opponent";
export type GameState = {
  deck: CardCode[]; hand: CardCode[]; opponentHand: CardCode[];
  discard: CardCode[]; turn: Player; activeSuit: Suit; status: "playing" | "won" | "lost";
  message: string; hints: boolean;
};

export const SYMBOL: Record<Suit, string> = { C: "♣", D: "♦", H: "♥", S: "♠" };
export const isRed = (s: Suit) => s === "D" || s === "H";
export const rankOf = (c: CardCode) => c.slice(0, -1);
export const suitOf = (c: CardCode) => c.slice(-1) as Suit;
export const shuffle = <T,>(items: T[]): T[] => {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
export function createGame(): GameState {
  const deck = shuffle(SUITS.flatMap(s => RANKS.map(r => `${r}${s}` as CardCode)));
  const hand = deck.splice(0, 7), opponentHand = deck.splice(0, 7);
  let first = deck.pop()!;
  while (rankOf(first) === "8") { deck.unshift(first); first = deck.pop()!; }
  return { deck, hand, opponentHand, discard: [first], turn: "you", activeSuit: suitOf(first), status: "playing", message: "Your turn. Match the suit or number, or play an eight.", hints: true };
}
export function canPlay(card: CardCode, state: GameState) {
  const top = state.discard[state.discard.length - 1];
  return rankOf(card) === "8" || suitOf(card) === state.activeSuit || rankOf(card) === rankOf(top);
}
function recycle(state: GameState) {
  if (state.deck.length || state.discard.length < 2) return;
  const top = state.discard[state.discard.length - 1];
  state.deck = shuffle(state.discard.slice(0, -1));
  state.discard = [top];
}
export function drawCard(state: GameState): GameState {
  const s = structuredClone(state);
  if (s.status !== "playing" || s.turn !== "you") return s;
  recycle(s);
  if (!s.deck.length) { s.turn = "opponent"; s.message = "No cards left to draw. Your turn is passed."; return opponentTurn(s); }
  const card = s.deck.pop()!; s.hand.push(card);
  if (canPlay(card, s)) s.message = `You drew ${rankOf(card)}${SYMBOL[suitOf(card)]}. You can play it now or pass.`;
  else { s.message = `You drew ${rankOf(card)}${SYMBOL[suitOf(card)]}. It doesn't match, so your turn is over.`; s.turn = "opponent"; return opponentTurn(s); }
  return s;
}
export function playCard(state: GameState, card: CardCode, chosenSuit?: Suit): GameState {
  const s = structuredClone(state);
  if (s.status !== "playing" || s.turn !== "you" || !s.hand.includes(card) || !canPlay(card, s)) return s;
  s.hand.splice(s.hand.indexOf(card), 1); s.discard.push(card);
  if (rankOf(card) === "8" && !chosenSuit) { s.message = "Choose the next suit."; return s; }
  s.activeSuit = rankOf(card) === "8" ? chosenSuit! : suitOf(card);
  if (!s.hand.length) { s.status = "won"; s.message = "You win! You got rid of every card."; return s; }
  s.turn = "opponent"; s.message = "Your partner's turn.";
  return opponentTurn(s);
}
export function opponentTurn(state: GameState): GameState {
  const s = structuredClone(state);
  if (s.status !== "playing") return s;
  const idx = s.opponentHand.findIndex(c => canPlay(c, s));
  if (idx >= 0) {
    const card = s.opponentHand.splice(idx, 1)[0]; s.discard.push(card);
    if (rankOf(card) === "8") {
      const counts: Record<Suit, number> = { C: 0, D: 0, H: 0, S: 0 };
      s.opponentHand.forEach(c => counts[suitOf(c)]++);
      s.activeSuit = (Object.keys(counts) as Suit[]).sort((a,b) => counts[b]-counts[a])[0];
    } else s.activeSuit = suitOf(card);
    if (!s.opponentHand.length) { s.status = "lost"; s.message = "Your partner wins this round. Fancy a rematch?"; return s; }
    s.turn = "you"; s.message = `Your partner played ${rankOf(card)}${SYMBOL[suitOf(card)]}. Your turn.`;
    return s;
  }
  recycle(s);
  if (s.deck.length) s.opponentHand.push(s.deck.pop()!);
  s.turn = "you"; s.message = "🚫 NO PLAY! Your partner can't match a card and has to draw. Your turn.";
  return s;
}
