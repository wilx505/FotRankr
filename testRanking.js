import { comparePlayers, createPlayer } from './engine/rankingEngine.js';

let messi = createPlayer({
  id: 1,
  name: 'Lionel Messi',
  nation: 'Argentina',
  position: 'Attack'
});

let ronaldo = createPlayer({
  id: 2,
  name: 'Cristiano Ronaldo',
  nation: 'Portugal',
  position: 'Attack'
});

let mbappe = createPlayer({
  id: 3,
  name: 'Kylian Mbappe',
  nation: 'France',
  position: 'Attack'
});

let haaland = createPlayer({
  id: 4,
  name: 'Erling Haaland',
  nation: 'Norway',
  position: 'Attack'
});

console.log('\n--- STARTING RATINGS ---');

console.log(messi.name, messi.rating);
console.log(ronaldo.name, ronaldo.rating);
console.log(mbappe.name, mbappe.rating);
console.log(haaland.name, haaland.rating);

// Messi beats Ronaldo
let result = comparePlayers(messi, ronaldo, 'A');
messi = result.playerA;
ronaldo = result.playerB;

// Messi beats Mbappe
result = comparePlayers(messi, mbappe, 'A');
messi = result.playerA;
mbappe = result.playerB;

// Haaland beats Messi
result = comparePlayers(haaland, messi, 'A');
haaland = result.playerA;
messi = result.playerB;

// Ronaldo beats Mbappe
result = comparePlayers(ronaldo, mbappe, 'A');
ronaldo = result.playerA;
mbappe = result.playerB;

// Ronaldo beats Haaland
result = comparePlayers(haaland, ronaldo, 'B');
haaland = result.playerA;
ronaldo = result.playerB;

// Mbappe beats Haaland
result = comparePlayers(mbappe, haaland, 'A');
mbappe = result.playerA;
haaland = result.playerB;

const players = [
  messi,
  ronaldo,
  mbappe,
  haaland
];

console.log('\n--- FINAL RANKINGS ---');

players
  .sort((a, b) => b.rating - a.rating)
  .forEach((player, index) => {
    console.log(
      `${index + 1}. ${player.name} | Rating: ${player.rating.toFixed(2)} | Score: ${player.score} | Category: ${player.category} | W: ${player.wins} L: ${player.losses} D: ${player.draws} | Uncertainty: ${player.uncertainty.toFixed(2)}`
    );
  });
