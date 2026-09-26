const test = require('node:test');
const assert = require('node:assert/strict');
require('../assets/js/game.js');

const { Game } = globalThis.Morpion;
const playAll = (state, moves) => moves.reduce((s, i) => Game.play(s, i), state);

test('X commence par défaut et les tours alternent', () => {
  let s = Game.create();
  assert.equal(Game.current(s), 'x');
  s = Game.play(s, 0);
  assert.equal(Game.current(s), 'o');
  assert.equal(Game.current(Game.create({ first: 'o' })), 'o');
});

test('un coup sur une case occupée ou hors grille est refusé', () => {
  const s = Game.play(Game.create(), 4);
  assert.equal(Game.play(s, 4), null);
  assert.equal(Game.play(s, 9), null);
  assert.equal(Game.play(s, -1), null);
  assert.equal(Game.play(s, 1.5), null);
});

test('détecte les 8 alignements gagnants', () => {
  for (const line of Game.LINES) {
    const others = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter((i) => !line.includes(i));
    // X joue la ligne, O joue ailleurs sans jamais aligner.
    const s = playAll(Game.create(), [line[0], others[0], line[1], others[1], line[2]]);
    const status = Game.status(s);
    assert.equal(status.winner, 'x', `ligne ${line}`);
    assert.deepEqual(status.line, line);
    assert.equal(status.over, true);
  }
});

test('plus aucun coup possible après une victoire', () => {
  const s = playAll(Game.create(), [0, 3, 1, 4, 2]);
  assert.deepEqual(Game.legalMoves(s), []);
  assert.equal(Game.play(s, 8), null);
});

test('match nul quand la grille est pleine sans alignement', () => {
  // x o x / x o o / o x x
  const s = playAll(Game.create(), [0, 1, 2, 4, 3, 5, 7, 6, 8]);
  assert.deepEqual(Game.status(s), { winner: null, line: null, draw: true, over: true });
});

test('annuler retire les derniers coups sans muter l\'état', () => {
  const s = playAll(Game.create(), [0, 4, 8]);
  const back = Game.undo(s, 2);
  assert.deepEqual(back.moves, [0]);
  assert.deepEqual(s.moves, [0, 4, 8]);
  assert.deepEqual(Game.undo(s, 10).moves, []);
});

test('variante infinie : le 4e pion efface le plus ancien', () => {
  let s = playAll(Game.create({ infinite: true }), [0, 4, 1, 8, 5, 3]);
  // X : 0, 1, 5 — O : 4, 8, 3. X a 3 pions : le 0 va disparaître.
  assert.equal(Game.fading(s), 0);
  s = Game.play(s, 6);
  const board = Game.board(s);
  assert.equal(board[0], null);
  assert.equal(board[6], 'x');
  assert.equal(board.filter((c) => c === 'x').length, 3);
  assert.equal(Game.fading(s), 4); // au tour de O, son plus ancien est le 4
});

test('variante infinie : jamais de match nul', () => {
  let s = Game.create({ infinite: true });
  for (let n = 0; n < 60 && !Game.status(s).over; n++) s = Game.play(s, Game.legalMoves(s)[0]);
  assert.equal(Game.status(s).draw, false);
  assert.ok(Game.board(s).filter(Boolean).length <= 6);
});

test('pas de pion qui s\'efface en mode classique', () => {
  const s = playAll(Game.create(), [0, 4, 1, 8]);
  assert.equal(Game.fading(s), null);
});
