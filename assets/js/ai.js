/**
 * Intelligence artificielle : negamax avec élagage alpha-bêta.
 *
 * La difficulté est simplement la profondeur de réflexion :
 *  - facile      : ne voit qu'un coup devant elle, et joue souvent au hasard
 *  - moyen       : gagne si elle peut, bloque si elle doit, sinon improvise
 *  - impossible  : calcule tout. Au mieux, vous ferez match nul.
 *
 * Parmi plusieurs coups de même valeur, elle choisit au hasard pour varier les parties.
 */
(function (root) {
  'use strict';

  const { Game } = root.Morpion;
  const WIN = 100;

  // Ordre d'exploration : centre, coins, bords — accélère l'élagage.
  const ORDER = [4, 0, 2, 6, 8, 1, 3, 5, 7];

  const LEVELS = Object.freeze({
    easy:   { depth: 1, blunder: 0.55 },
    medium: { depth: 2, blunder: 0 },
    hard:   { depth: Infinity, blunder: 0 },
  });

  // En variante infinie, la partie peut boucler : on borne la recherche.
  const INFINITE_MAX_DEPTH = 7;

  /** Score du point de vue du joueur qui doit jouer dans `state`. */
  function negamax(state, depth, alpha, beta, ply) {
    const info = Game.evaluate(state);
    let best;
    if (info.winner) best = -(WIN - ply); // le joueur précédent vient de gagner
    else if (info.draw || depth === 0) best = 0;
    else {
      best = -Infinity;
      for (const i of ORDER) {
        if (info.board[i]) continue;
        const score = -negamax(Game.play(state, i), depth - 1, -beta, -alpha, ply + 1);
        if (score > best) best = score;
        if (best > alpha) alpha = best;
        if (alpha >= beta) break;
      }
    }
    return best;
  }

  /** Évalue chaque coup légal (valeur exacte, sans élagage à la racine). */
  function scoreMoves(state, depth) {
    const limit = state.infinite ? Math.min(depth, INFINITE_MAX_DEPTH) : Math.min(depth, 9);
    return Game.legalMoves(state).map((i) => ({
      index: i,
      score: -negamax(Game.play(state, i), limit - 1, -Infinity, Infinity, 1),
    }));
  }

  function pick(list, rng) {
    return list[Math.floor(rng() * list.length)];
  }

  function bestMoves(state, depth = Infinity) {
    const scored = scoreMoves(state, depth);
    const top = Math.max(...scored.map((m) => m.score));
    return scored.filter((m) => m.score === top).map((m) => m.index);
  }

  function chooseMove(state, level = 'hard', rng = Math.random) {
    const legal = Game.legalMoves(state);
    if (legal.length === 0) return null;
    const { depth, blunder } = LEVELS[level] || LEVELS.hard;
    if (blunder && rng() < blunder) return pick(legal, rng);
    return pick(bestMoves(state, depth), rng);
  }

  root.Morpion.AI = Object.freeze({ LEVELS, chooseMove, bestMoves, scoreMoves });
})(typeof window !== 'undefined' ? window : globalThis);
