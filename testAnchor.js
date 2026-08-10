import {
    comparePlayers,
    createPlayer,
} from './engine/rankingEngine.js';

console.log('\n--- ANCHOR TEST ---\n');

// Create Alisson normally
const alisson = createPlayer({
  id: 'alisson',
  name: 'Alisson Becker',
  nation: 'Brazil',
  position: 'Goalkeeper',
});

// Turn Alisson into a Legendary anchor
alisson.rating = 2980;
alisson.score = 9.90;
alisson.category = 'Legendary';

console.log(
  'ANCHOR:',
  alisson.name,
  '| Rating:',
  alisson.rating,
  '| Score:',
  alisson.score,
  '| Category:',
  alisson.category
);

// Create Ronaldo normally
const ronaldo = createPlayer({
  id: 'ronaldo',
  name: 'Cristiano Ronaldo',
  nation: 'Portugal',
  position: 'Attack',
});

console.log(
  '\nBEFORE COMPARISON:',
  ronaldo.name,
  '| Rating:',
  ronaldo.rating
);

// Ronaldo beats Alisson
const result = comparePlayers(
  ronaldo,
  alisson,
  'player'
);

console.log(
  '\nAFTER RONALDO WINS:'
);

console.log(
  result.playerA.name,
  '| Rating:',
  result.playerA.rating.toFixed(2),
  '| Score:',
  result.playerA.score.toFixed(2),
  '| Category:',
  result.playerA.category
);

console.log(
  result.playerB.name,
  '| Rating:',
  result.playerB.rating.toFixed(2),
  '| Score:',
  result.playerB.score.toFixed(2),
  '| Category:',
  result.playerB.category
);

