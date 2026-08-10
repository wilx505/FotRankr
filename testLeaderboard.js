import PLAYERS from './data/players.js';
import {
  comparePlayers,
  createPlayer,
  getConfidence
} from './engine/rankingEngine.js';

let players = PLAYERS.map(player => createPlayer(player));

function getPlayer(id) {
  return players.find(player => player.id === id);
}

function updatePlayers(result) {
  players = players.map(player => {
    if (player.id === result.playerA.id) {
      return result.playerA;
    }

    if (player.id === result.playerB.id) {
      return result.playerB;
    }

    return player;
  });
}

function compare(playerAId, playerBId, result) {
  const playerA = getPlayer(playerAId);
  const playerB = getPlayer(playerBId);

  const comparison = comparePlayers(
    playerA,
    playerB,
    result
  );

  updatePlayers(comparison);
}

// --------------------------------------------------
// SIMULATED FOTRANKR COMPARISONS
// --------------------------------------------------

compare(1, 2, 'A');   // Messi beats Ronaldo
compare(1, 3, 'A');   // Messi beats Mbappe
compare(4, 1, 'A');   // Haaland beats Messi
compare(2, 3, 'A');   // Ronaldo beats Mbappe
compare(5, 6, 'A');   // Salah beats Vinicius
compare(7, 8, 'A');   // Bellingham beats De Bruyne
compare(10, 7, 'A');  // Rodri beats Bellingham
compare(11, 18, 'A'); // Van Dijk beats Saliba
compare(9, 4, 'A');   // Kane beats Haaland
compare(12, 13, 'A'); // Yamal beats Saka
compare(14, 15, 'A'); // Palmer beats Wirtz
compare(17, 16, 'A'); // Valverde beats Pedri
compare(2, 5, 'A');   // Ronaldo beats Salah
compare(3, 4, 'A');   // Mbappe beats Haaland
compare(6, 12, 'A');  // Vinicius beats Yamal
compare(7, 17, 'A');  // Bellingham beats Valverde
compare(10, 8, 'A');  // Rodri beats De Bruyne
compare(11, 19, 'A'); // Van Dijk beats Ruben Dias
compare(20, 11, 'A'); // Alisson beats Van Dijk
compare(5, 14, 'A');  // Salah beats Palmer

// --------------------------------------------------
// LEADERBOARD
// --------------------------------------------------

const leaderboard = [...players]
  .sort((a, b) => b.rating - a.rating);

console.log('\n========================================');
console.log('         FOTRANKR LEADERBOARD');
console.log('========================================\n');

leaderboard.forEach((player, index) => {
  console.log(
   `${index + 1}. ${player.name.padEnd(22)} | ` +
`Rating: ${player.rating.toFixed(2)} | ` +
`Score: ${player.score.toFixed(2)} | ` +
`${player.category.padEnd(10)} | ` +
`Confidence: ${getConfidence(player).padEnd(6)} | ` +
`W:${player.wins} L:${player.losses} D:${player.draws}`
  );
});

console.log('\n========================================');
console.log(`Total players: ${leaderboard.length}`);
console.log('========================================\n');
