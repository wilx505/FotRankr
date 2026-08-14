const players = require('./players').default;

const {
  createPlayer,
  findBestOpponent
} = require('./engine/rankingEngine');

// ==========================================================
// CREATE A TEST PLAYER
// ==========================================================

const alissonData = players.find(
  player => player.name === 'Alisson Becker'
);

const alisson = createPlayer(
  alissonData,
  'Elite'
);

alisson.rating = 2840;

// ==========================================================
// ONLY GIVE THE ALGORITHM 3 OPPONENTS
// ==========================================================

const selectedNames = [
  'Thibaut Courtois',
  'Gianluigi Donnarumma',
  'Jan Oblak'
];

const opponents = players
  .filter(
    player =>
      selectedNames.includes(player.name)
  )
  .map(
    player => {

      const created =
        createPlayer(
          player,
          'Elite'
        );

      created.rating = 2840;

      return created;
    }
  );

// ==========================================================
// TEST
// ==========================================================

let history = [];

console.log('\n========================================');
console.log(' FOTRANKR EDGE CASE TEST');
console.log('========================================\n');

console.log(
  'Starting player:',
  alisson.name
);

console.log(
  'Available opponents:',
  opponents.length
);

opponents.forEach(
  player =>
    console.log(
      '-',
      player.name
    )
);

console.log('');

for (let i = 0; i < 5; i++) {

  const target = {
    ...alisson,
    comparisons: i
  };

  const opponent =
    findBestOpponent(
      target,
      opponents,
      history
    );

  console.log(
    `H2H ${i + 1}:`,
    opponent
      ? opponent.name
      : 'NONE'
  );

  if (opponent) {

    history.push({
      playerA: alisson.id,
      playerB: opponent.id
    });

  }

}

console.log('\n========================================');
console.log(' TEST COMPLETE');
console.log('========================================\n');
