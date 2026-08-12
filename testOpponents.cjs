const players = require('./players').default;
const {
  createPlayer,
  findBestOpponent
} = require('./engine/rankingEngine');

const alissonData = players.find(
  player => player.name === 'Alisson Becker'
);

const goalkeeperData = players.filter(
  player => player.specificPosition === 'Goalkeeper'
);

const alisson = createPlayer(
  alissonData,
  'Elite'
);

const opponents = goalkeeperData
  .filter(
    player => player.id !== alisson.id
  )
  .map(
    player => createPlayer(
      player,
      'Elite'
    )
  );

let history = [];

console.log('\n--- SIX AUTOMATIC H2H TEST ---\n');

console.log(
  'Goalkeepers available:',
  goalkeeperData.length
);

console.log(
  'Automatic opponents available:',
  opponents.length
);

console.log('');

for (let i = 0; i < 7; i++) {

  const target = {
    ...alisson,
    comparisons: i
  };

  const opponent = findBestOpponent(
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
