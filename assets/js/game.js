/**
 * Moteur du morpion — logique pure, sans DOM.
 *
 * Un état de partie est immuable : { first, infinite, moves }.
 * Le plateau est toujours *dérivé* de la liste des coups, ce qui rend
 * l'annulation triviale (on retire des coups) et évite toute désynchronisation.
 *
 * Variante « infinie » : chaque joueur n'a que 3 pions sur la grille.
 * Au 4e, son plus ancien pion disparaît. Pas de match nul possible.
 */
(function (root) {
  'use strict';

  const LINES = Object.freeze([
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // lignes
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // colonnes
    [0, 4, 8], [2, 4, 6],            // diagonales
  ]);
  const MAX_MARKS = 3;

  const other = (player) => (player === 'x' ? 'o' : 'x');

  function create({ first = 'x', infinite = false } = {}) {
    return Object.freeze({ first, infinite, moves: Object.freeze([]) });
  }

  function current(state) {
    return state.moves.length % 2 === 0 ? state.first : other(state.first);
  }

  /** Rejoue les coups pour obtenir le plateau et les pions vivants de chacun (du plus ancien au plus récent). */
  function snapshot(state) {
    const board = new Array(9).fill(null);
    const live = { x: [], o: [] };
    let player = state.first;
    for (const i of state.moves) {
      board[i] = player;
      live[player].push(i);
      if (state.infinite && live[player].length > MAX_MARKS) board[live[player].shift()] = null;
      player = other(player);
    }
    return { board, live };
  }

  function findWin(board) {
    for (const line of LINES) {
      const [a, b, c] = line;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) return { winner: board[a], line };
    }
    return null;
  }

  function evaluate(state) {
    const { board, live } = snapshot(state);
    const win = findWin(board);
    const draw = !win && !state.infinite && board.every(Boolean);
    return {
      board,
      live,
      winner: win ? win.winner : null,
      line: win ? win.line : null,
      draw,
      over: Boolean(win) || draw,
    };
  }

  function board(state) {
    return snapshot(state).board;
  }

  function status(state) {
    const { winner, line, draw, over } = evaluate(state);
    return { winner, line, draw, over };
  }

  function legalMoves(state) {
    const info = evaluate(state);
    if (info.over) return [];
    const moves = [];
    for (let i = 0; i < 9; i++) if (!info.board[i]) moves.push(i);
    return moves;
  }

  /** Renvoie le nouvel état, ou null si le coup est illégal. */
  function play(state, index) {
    if (!Number.isInteger(index) || index < 0 || index > 8) return null;
    const info = evaluate(state);
    if (info.over || info.board[index]) return null;
    return Object.freeze({ ...state, moves: Object.freeze([...state.moves, index]) });
  }

  function undo(state, count = 1) {
    const length = Math.max(0, state.moves.length - count);
    return Object.freeze({ ...state, moves: Object.freeze(state.moves.slice(0, length)) });
  }

  /** Variante infinie : index du pion qui disparaîtra au prochain coup du joueur courant (ou null). */
  function fading(state) {
    if (!state.infinite) return null;
    const { live } = snapshot(state);
    const queue = live[current(state)];
    return queue.length === MAX_MARKS ? queue[0] : null;
  }

  const Game = Object.freeze({
    LINES, MAX_MARKS, other, create, current, board, status, evaluate, legalMoves, play, undo, fading, findWin,
  });

  root.Morpion = root.Morpion || {};
  root.Morpion.Game = Game;
})(typeof window !== 'undefined' ? window : globalThis);
