/**
 * Contrôleur d'interface : relie le moteur (Game), l'IA et le DOM.
 * Tout l'état vit ici ; le DOM n'est qu'un rendu de cet état.
 */
(function () {
  'use strict';

  const { Game, AI, Sound, Storage, confetti, reducedMotion } = window.Morpion;

  const STORAGE_KEY = 'morpion:v2';
  const CPU_DELAY = 550;
  const MARKS = {
    x: '<svg class="mark mark-x" viewBox="0 0 100 100" aria-hidden="true"><path pathLength="1" d="M24 24 76 76"/><path pathLength="1" d="M76 24 24 76"/></svg>',
    o: '<svg class="mark mark-o" viewBox="0 0 100 100" aria-hidden="true"><circle pathLength="1" cx="50" cy="50" r="28"/></svg>',
  };
  const SYMBOL = { x: '✕', o: '◯' };

  /* ---------- État ---------- */
  const saved = Storage.load(STORAGE_KEY, {
    mode: 'cpu',
    level: 'medium',
    human: 'x',
    infinite: false,
    sound: true,
    scores: { x: 0, o: 0, draw: 0 },
    streak: { player: null, count: 0 },
    round: 0,
    seenHelp: false,
  });
  const settings = saved;
  Sound.enabled = settings.sound;

  let state = null;
  let cpuTimer = null;
  let hintTimer = null;
  let focusIndex = 4;

  /* ---------- DOM ---------- */
  const $ = (sel) => document.querySelector(sel);
  const boardEl = $('#board');
  const statusEl = $('#status');
  const resultEl = $('#result');
  const winLine = $('.win-line line');
  const form = $('#settings');
  const helpDialog = $('#help');

  const cells = Array.from({ length: 9 }, (_, i) => {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'cell';
    cell.dataset.index = i;
    cell.tabIndex = i === focusIndex ? 0 : -1;
    boardEl.appendChild(cell);
    return cell;
  });

  /* ---------- Helpers ---------- */
  const isCpuGame = () => settings.mode === 'cpu';
  const cpuPlayer = () => Game.other(settings.human);
  const isCpuTurn = () => isCpuGame() && !Game.status(state).over && Game.current(state) === cpuPlayer();
  const persist = () => Storage.save(STORAGE_KEY, settings);

  function playerName(player) {
    if (isCpuGame()) return player === settings.human ? 'Toi' : 'Ordi';
    return player === 'x' ? 'Joueur 1' : 'Joueur 2';
  }

  function cancelTimers() {
    clearTimeout(cpuTimer);
    clearTimeout(hintTimer);
    cpuTimer = null;
    cells.forEach((c) => c.classList.remove('hint'));
  }

  /* ---------- Cycle de jeu ---------- */
  function newRound({ advance = true } = {}) {
    cancelTimers();
    if (advance) settings.round += 1;
    // Le premier joueur alterne d'une manche à l'autre.
    const first = settings.round % 2 === 0 ? 'x' : 'o';
    state = Game.create({ first, infinite: settings.infinite });
    persist();
    render({ fresh: true });
    scheduleCpu();
  }

  function scheduleCpu() {
    if (!isCpuTurn()) return;
    cpuTimer = setTimeout(() => {
      cpuTimer = null;
      commit(AI.chooseMove(state, settings.level));
    }, reducedMotion() ? 150 : CPU_DELAY);
    render();
  }

  function commit(index) {
    const before = Game.evaluate(state);
    const next = Game.play(state, index);
    if (!next) {
      Sound.play('invalid');
      shake(cells[index]);
      return;
    }
    const mover = Game.current(state);
    state = next;
    cells.forEach((c) => c.classList.remove('hint'));

    const after = Game.evaluate(state);
    const vanished = before.board.some((p, i) => p && !after.board[i]);
    Sound.play(mover);
    if (vanished) setTimeout(() => Sound.play('vanish'), 90);

    if (after.over) finish(after);
    render();
    scheduleCpu();
  }

  function finish({ winner, line }) {
    const { scores, streak } = settings;
    if (winner) {
      scores[winner] += 1;
      if (streak.player === winner) streak.count += 1;
      else Object.assign(streak, { player: winner, count: 1 });
    } else {
      scores.draw += 1;
      Object.assign(streak, { player: null, count: 0 });
    }
    persist();
    bump(winner ? `#score-${winner}` : '#score-draw');

    const humanLost = isCpuGame() && winner === cpuPlayer();
    if (!winner) Sound.play('draw');
    else if (humanLost) Sound.play('lose');
    else Sound.play('win');

    if (winner && !humanLost) {
      const palette = winner === 'x' ? ['#ff5c8a', '#ff9ab6', '#ffd166', '#ffffff'] : ['#4de2d6', '#9ff5ee', '#b18cff', '#ffffff'];
      setTimeout(() => confetti($('#confetti'), palette), 350);
    }
    if (humanLost) shake(boardEl);
    if (line) drawWinLine(line);
  }

  function undo() {
    if (!canUndo()) return;
    cancelTimers();
    // Contre l'ordi, on annule aussi sa réponse pour revenir à ton tour.
    let count = 1;
    if (isCpuGame() && Game.current(state) === settings.human) count = 2;
    state = Game.undo(state, count);
    render({ fresh: true });
    scheduleCpu();
  }

  function canUndo() {
    if (Game.status(state).over || cpuTimer) return false;
    if (!isCpuGame()) return state.moves.length > 0;
    // Il faut qu'au moins un coup humain ait été joué.
    const humanStarts = state.first === settings.human;
    return state.moves.length >= (humanStarts ? 1 : 2);
  }

  function hint() {
    if (Game.status(state).over || isCpuTurn()) return;
    cancelTimers();
    const options = AI.bestMoves(state);
    const choice = options[Math.floor(Math.random() * options.length)];
    cells[choice].classList.add('hint');
    Sound.play('hint');
    hintTimer = setTimeout(() => cells[choice].classList.remove('hint'), 2200);
  }

  /* ---------- Rendu ---------- */
  function render({ fresh = false } = {}) {
    const info = Game.evaluate(state);
    const turn = Game.current(state);
    const fadingIndex = info.over ? null : Game.fading(state);
    const thinking = Boolean(cpuTimer);
    const locked = info.over || thinking || isCpuTurn();

    boardEl.dataset.turn = turn;
    boardEl.classList.toggle('locked', locked);
    boardEl.classList.toggle('over', info.over);

    cells.forEach((cell, i) => {
      const mark = info.board[i];
      if (cell.dataset.mark !== (mark || '')) {
        cell.dataset.mark = mark || '';
        cell.innerHTML = mark ? MARKS[mark] : '';
      }
      cell.classList.toggle('filled', Boolean(mark));
      cell.classList.toggle('fading', i === fadingIndex);
      cell.classList.toggle('win', Boolean(info.line && info.line.includes(i)));
      cell.setAttribute('aria-label', cellLabel(i, mark, i === fadingIndex));
      cell.setAttribute('aria-disabled', String(Boolean(mark) || locked));
    });

    if (fresh) clearWinLine();
    renderStatus(info, turn, thinking);
    renderResult(info);
    renderScores();

    $('#undo').disabled = !canUndo();
    $('#hint').disabled = info.over || isCpuTurn();
  }

  function cellLabel(i, mark, isFading) {
    const pos = `ligne ${Math.floor(i / 3) + 1}, colonne ${(i % 3) + 1}`;
    if (!mark) return `${pos}, vide`;
    return `${pos}, ${mark === 'x' ? 'croix' : 'rond'}${isFading ? ', va disparaître' : ''}`;
  }

  function renderStatus(info, turn, thinking) {
    const text = statusEl.querySelector('.status-text');
    const markEl = statusEl.querySelector('.status-mark');
    statusEl.dataset.player = info.winner || (info.draw ? '' : turn);
    statusEl.classList.toggle('thinking', thinking);

    if (info.over) {
      markEl.textContent = info.winner ? SYMBOL[info.winner] : '=';
      text.textContent = resultText(info).title;
      return;
    }
    markEl.textContent = SYMBOL[turn];
    if (!isCpuGame()) text.textContent = `Au tour de ${playerName(turn)}`;
    else text.textContent = turn === settings.human ? 'À toi de jouer' : "L'ordi réfléchit";
  }

  function resultText({ winner, draw }) {
    if (draw) return { title: 'Match nul', subtitle: 'Personne ne passe. Bien défendu.' };
    const streak = settings.streak.count;
    if (!isCpuGame()) {
      return { title: `${SYMBOL[winner]} gagne !`, subtitle: streak > 1 ? `${streak} manches d'affilée 🔥` : 'Belle manche.' };
    }
    if (winner === settings.human) {
      return {
        title: 'Victoire !',
        subtitle: streak > 1 ? `${streak} victoires d'affilée 🔥` : settings.level === 'hard' ? 'Attends… comment ?' : 'Bien joué.',
      };
    }
    return { title: "L'ordi gagne", subtitle: settings.level === 'hard' ? 'Il ne perd jamais. Vise le nul !' : 'Prends ta revanche.' };
  }

  function renderResult(info) {
    if (!info.over) {
      resultEl.hidden = true;
      resultEl.classList.remove('show');
      return;
    }
    const { title, subtitle } = resultText(info);
    resultEl.querySelector('.result-title').textContent = title;
    resultEl.querySelector('.result-subtitle').textContent = subtitle;
    resultEl.dataset.winner = info.winner || 'draw';
    if (resultEl.hidden) {
      resultEl.hidden = false;
      // Laisse le temps d'admirer la ligne gagnante avant d'afficher le résultat.
      setTimeout(() => resultEl.classList.add('show'), reducedMotion() ? 0 : 750);
    }
  }

  function renderScores() {
    const { scores, streak } = settings;
    $('#score-x').textContent = scores.x;
    $('#score-o').textContent = scores.o;
    $('#score-draw').textContent = scores.draw;
    $('#name-x').textContent = playerName('x');
    $('#name-o').textContent = playerName('o');
    $('.score-x').classList.toggle('active', !Game.status(state).over && Game.current(state) === 'x');
    $('.score-o').classList.toggle('active', !Game.status(state).over && Game.current(state) === 'o');
    $('#streak').textContent = streak.count > 1 ? `🔥 ${playerName(streak.player)} : ${streak.count} d'affilée` : '';
  }

  function drawWinLine(line) {
    const wrap = boardEl.parentElement.getBoundingClientRect();
    const center = (i) => {
      const r = cells[i].getBoundingClientRect();
      return { x: r.left + r.width / 2 - wrap.left, y: r.top + r.height / 2 - wrap.top };
    };
    const a = center(line[0]);
    const b = center(line[2]);
    // On prolonge un peu la ligne au-delà des centres des cases.
    const dx = (b.x - a.x) * 0.18;
    const dy = (b.y - a.y) * 0.18;
    winLine.setAttribute('x1', a.x - dx);
    winLine.setAttribute('y1', a.y - dy);
    winLine.setAttribute('x2', b.x + dx);
    winLine.setAttribute('y2', b.y + dy);
    winLine.parentElement.dataset.winner = Game.status(state).winner;
    winLine.parentElement.classList.add('show');
  }

  function clearWinLine() {
    winLine.parentElement.classList.remove('show');
  }

  function bump(selector) {
    const el = $(selector);
    el.classList.remove('bump');
    void el.offsetWidth; // relance l'animation
    el.classList.add('bump');
  }

  function shake(el) {
    if (reducedMotion()) return;
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
  }

  /* ---------- Réglages ---------- */
  function syncForm() {
    form.elements.mode.value = settings.mode;
    form.elements.level.value = settings.level;
    form.elements.human.value = settings.human;
    form.elements.infinite.checked = settings.infinite;
    $('#level-field').disabled = !isCpuGame();
    $('#side-field').disabled = !isCpuGame();
    document.body.classList.toggle('pvp', !isCpuGame());
    const soundBtn = $('#sound-toggle');
    soundBtn.setAttribute('aria-pressed', String(settings.sound));
    soundBtn.classList.toggle('muted', !settings.sound);
  }

  function resetScores() {
    settings.scores = { x: 0, o: 0, draw: 0 };
    settings.streak = { player: null, count: 0 };
    settings.round = 0;
  }

  form.addEventListener('change', (event) => {
    const { name } = event.target;
    if (name === 'infinite') settings.infinite = event.target.checked;
    else settings[name] = form.elements[name].value;
    // Changer les règles du jeu = nouveau match.
    resetScores();
    syncForm();
    newRound({ advance: false });
  });

  $('#reset-scores').addEventListener('click', () => {
    resetScores();
    newRound({ advance: false });
  });

  $('#sound-toggle').addEventListener('click', toggleSound);

  function toggleSound() {
    settings.sound = !settings.sound;
    Sound.enabled = settings.sound;
    persist();
    syncForm();
    Sound.play('x');
  }

  /* ---------- Interaction avec la grille ---------- */
  boardEl.addEventListener('click', (event) => {
    const cell = event.target.closest('.cell');
    if (!cell) return;
    const index = Number(cell.dataset.index);
    moveFocus(index, false);
    // En fin de partie, c'est la carte de résultat qui relance la manche.
    if (Game.status(state).over || isCpuTurn() || cpuTimer) return;
    commit(index);
  });

  function moveFocus(index, focus = true) {
    cells[focusIndex].tabIndex = -1;
    focusIndex = index;
    cells[focusIndex].tabIndex = 0;
    if (focus) cells[focusIndex].focus();
  }

  boardEl.addEventListener('keydown', (event) => {
    const deltas = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] };
    const delta = deltas[event.key];
    if (!delta) return;
    event.preventDefault();
    const row = (Math.floor(focusIndex / 3) + delta[0] + 3) % 3;
    const col = ((focusIndex % 3) + delta[1] + 3) % 3;
    moveFocus(row * 3 + col);
  });

  resultEl.addEventListener('click', () => newRound());
  $('#undo').addEventListener('click', undo);
  $('#hint').addEventListener('click', hint);
  $('#restart').addEventListener('click', () => newRound({ advance: false }));
  $('#help-toggle').addEventListener('click', openHelp);

  function openHelp() {
    helpDialog.showModal();
    $('#help-toggle').classList.remove('pulse');
    settings.seenHelp = true;
    persist();
  }
  helpDialog.addEventListener('click', (event) => {
    if (event.target === helpDialog) helpDialog.close(); // clic sur le fond
  });

  document.addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey || helpDialog.open) return;
    if (event.target.matches && event.target.matches('input[type="text"], textarea, select')) return;
    const key = event.key.toLowerCase();

    if (/^[1-9]$/.test(key)) {
      const index = Number(key) - 1;
      moveFocus(index);
      cells[index].click();
    } else if (key === 'u') undo();
    else if (key === 'h') hint();
    else if (key === 'm') toggleSound();
    else if (key === '?') openHelp();
    else if (key === 'n') newRound({ advance: Game.status(state).over });
    else if (key === 'enter' && Game.status(state).over && !event.target.closest('button')) newRound();
  });

  window.addEventListener('resize', () => {
    const { line } = Game.status(state);
    if (line) drawWinLine(line);
  });

  /* ---------- Démarrage ---------- */
  syncForm();
  newRound({ advance: false });
  if (!settings.seenHelp) $('#help-toggle').classList.add('pulse');
})();
