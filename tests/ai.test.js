const test = require('node:test');
const assert = require('node:assert/strict');
require('../assets/js/game.js');
require('../assets/js/ai.js');

const { Game, AI } = globalThis.Morpion;
const playAll = (state, moves) => moves.reduce((s, i) => Game.play(s, i), state);
const firstPick = () => 0;

test('gagne immédiatement quand il le peut (moyen et impossible)', () => {
  // X : 0, 1 — O : 3, 4 — X doit jouer 2.
  const s = playAll(Game.create(), [0, 3, 1, 4]);
  for (const level of ['medium', 'hard']) assert.equal(AI.chooseMove(s, level, firstPick), 2);
});

test('bloque une menace immédiate (moyen et impossible)', () => {
  // X : 0, 1 — O : 4 — O doit bloquer en 2.
  const s = playAll(Game.create(), [0, 4, 1]);
  for (const level of ['medium', 'hard']) assert.equal(AI.chooseMove(s, level, firstPick), 2);
});

test('préfère la victoire la plus rapide', () => {
  // X peut gagner tout de suite en 2 : les autres gains plus lents doivent être écartés.
  const s = playAll(Game.create(), [0, 3, 1, 5, 4, 7]);
  assert.deepEqual(AI.bestMoves(s), [2, 8].filter((i) => Game.status(Game.play(s, i)).winner === 'x'));
});

test('renvoie null quand la partie est finie', () => {
  const s = playAll(Game.create(), [0, 3, 1, 4, 2]);
  assert.equal(AI.chooseMove(s, 'hard'), null);
});

test('« Impossible » ne perd jamais, quel que soit l\'adversaire (recherche exhaustive)', () => {
  let games = 0;
  function explore(state, ai) {
    const status = Game.status(state);
    if (status.over) {
      games++;
      assert.notEqual(status.winner, Game.other(ai), `défaite après ${state.moves.join(',')}`);
      return;
    }
    if (Game.current(state) === ai) {
      // On vérifie *tous* les coups que l'IA considère optimaux.
      for (const i of AI.bestMoves(state)) explore(Game.play(state, i), ai);
    } else {
      for (const i of Game.legalMoves(state)) explore(Game.play(state, i), ai);
    }
  }
  for (const first of ['x', 'o']) explore(Game.create({ first }), 'o');
  assert.ok(games > 100);
});

test('la variante infinie répond rapidement', () => {
  const start = Date.now();
  let s = Game.create({ infinite: true });
  for (let n = 0; n < 20 && !Game.status(s).over; n++) s = Game.play(s, AI.chooseMove(s, 'hard'));
  assert.ok(Date.now() - start < 3000);
});
