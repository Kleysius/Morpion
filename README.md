# Morpion

Le jeu du morpion, revisité : IA imbattable, variante « infinie », animations néon et sons synthétisés.
Aucune dépendance, aucun build : ouvre `index.html` dans un navigateur et joue.

## Fonctionnalités

- **Contre l'ordi** en 3 niveaux : *Facile*, *Moyen* (gagne et bloque quand il peut) et *Impossible* (negamax + alpha-bêta : il ne perd jamais).
- **2 joueurs** en local.
- **Variante infinie** : 3 pions max par joueur, le plus ancien disparaît (et clignote juste avant).
- **Annuler**, **Indice** (le meilleur coup calculé par l'IA), alternance du premier joueur à chaque manche.
- Scores (victoires, défaites, nuls) et séries sauvegardés dans le navigateur.
- Symboles tracés en SVG animé, ligne gagnante, confettis et sons (Web Audio, sans fichier audio).
- Accessible : navigation clavier complète, annonces pour lecteur d'écran, respect de `prefers-reduced-motion`.

## Raccourcis

| Touche | Action |
| --- | --- |
| `1`–`9` | Jouer une case (de gauche à droite, de haut en bas) |
| Flèches | Se déplacer dans la grille |
| `U` | Annuler |
| `H` | Indice |
| `N` / `Entrée` | Nouvelle manche |
| `M` | Son on/off |
| `?` | Aide |

## Architecture

```
assets/js/game.js     Moteur pur (aucun DOM) : état immuable, plateau dérivé de la liste des coups
assets/js/ai.js       IA negamax avec élagage alpha-bêta ; difficulté = profondeur de recherche
assets/js/effects.js  Sons, confettis, persistance localStorage
assets/js/main.js     Contrôleur d'interface : état → rendu
assets/css/style.css  Thème (variables CSS), responsive fluide avec clamp()
tests/                Tests Node (node:test), sans dépendance
```

## Tests

```sh
npm test
```

Inclut une recherche exhaustive qui vérifie que l'IA « Impossible » ne perd contre aucune séquence de coups.
