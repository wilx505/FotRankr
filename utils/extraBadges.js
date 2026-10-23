import { getFlag } from './flags';

import { getSourcePlayer } from './listHelpers';

/*
============================================================
EXTRA BADGES
============================================================

Each is worth MILESTONE_BADGE_XP and, once earned, is kept
for good (App records earned badge ids).

Counts use players PROPERLY ranked at any point ("I DO NOT
KNOW" doesn't count), except the category badges (players in
that category now) and HIT THE BOOKS (Unknown players now).

UNITED NATIONS and SCOUTS HONOR need the user's level / the
full badge list, so they live in badges.js; their XP comes
from the record (RECORD_ONLY_IDS).
============================================================
*/

const BADGE_XP_TEXT = '+10 XP badge bonus';

export const RECORD_ONLY_IDS = ['united-nations', 'scouts-honor'];

const BIG_FIVE = [
  'Premier League',
  'La Liga',
  'Ligue 1',
  'Serie A',
  'Bundesliga',
];

// "Rank N players as <category>": players in it right now.
const CATEGORY_BADGES = [
  { id: 'the-legends', title: 'The Legends', category: 'Legendary', target: 50, icon: '🟣' },
  { id: 'the-elite', title: 'The Elite', category: 'Elite', target: 100, icon: '🟢' },
  { id: 'the-very-goods', title: 'The Very-Goods', category: 'Very Good', target: 150, icon: '🔵' },
  { id: 'the-goods', title: 'The Goods', category: 'Good', target: 200, icon: '🟡' },
  { id: 'the-ok', title: 'The OK', category: 'OK', target: 250, icon: '🟠' },
  { id: 'the-bad', title: 'The Bad', category: 'Bad', target: 300, icon: '🔴' },
];

// Specific positions (wide midfielders count as wingers).
const POSITION_BADGES = [
  { id: 'wingmen', title: 'Wingmen', target: 100, label: 'wingers', icon: '🪽', positions: ['Left Winger', 'Right Winger', 'Left Midfield', 'Right Midfield'] },
  { id: 'strike-force', title: 'Strike Force', target: 100, label: 'strikers', icon: '🎯', positions: ['Centre-Forward'] },
  { id: 'bullet-men', title: 'Bullet-Men', target: 100, label: 'full-backs', icon: '🚀', positions: ['Left-Back', 'Right-Back'] },
  { id: 'sentinels', title: 'Sentinels', target: 100, label: 'centre-backs', icon: '🛡️', positions: ['Centre-Back'] },
  { id: 'anchors', title: 'Anchors', target: 100, label: 'defensive midfielders', icon: '⚓', positions: ['Defensive Midfield'] },
  { id: 'trequartistas', title: 'Trequartistas', target: 100, label: 'attacking midfielders', icon: '🪄', positions: ['Attacking Midfield'] },
  { id: 'engines', title: 'Engines', target: 100, label: 'central midfielders', icon: '⚙️', positions: ['Central Midfield'] },
];

// Nation badges show that nation's flag.
const NATION_BADGES = [
  { id: 'roast-beef', title: 'Roast Beef', nations: ['England'], target: 50, label: 'English' },
  { id: 'oui-oui', title: 'Oui Oui', nations: ['France'], target: 50, label: 'French' },
  { id: 'gabagool', title: 'Gabagool', nations: ['Italy'], target: 50, label: 'Italian' },
  { id: 'amigos', title: 'Amigos', nations: ['Spain'], target: 50, label: 'Spanish' },
  { id: 'shouting', title: '*Shouting*', nations: ['Germany'], target: 50, label: 'German' },
  { id: 'this-is-brazil', title: 'This Is Brazil', nations: ['Brazil'], target: 50, label: 'Brazilian' },
  { id: 'piombos', title: 'Piombos', nations: ['Argentina'], target: 50, label: 'Argentinian' },
  { id: 'flying-dutchmen', title: 'Flying Dutchmen', nations: ['Netherlands'], target: 50, label: 'Dutch' },
  { id: 'cr7-homelander', title: 'CR7 Homeland(er)', nations: ['Portugal'], target: 50, label: 'Portuguese' },
  { id: 'lakaka', title: 'Lakaka', nations: ['Belgium'], target: 50, label: 'Belgian' },
  { id: 'soccer-players', title: 'Soccer Players', nations: ['United States', 'USA'], target: 20, label: 'USA' },
  { id: 'crowders', title: 'Crowders', nations: ['Wales'], target: 20, label: 'Welsh' },
  { id: 'braveheart', title: 'Braveheart', nations: ['Scotland'], target: 20, label: 'Scottish' },
  { id: 'skinty-fia', title: 'Skinty Fia', nations: ['Ireland', 'Republic of Ireland'], target: 20, label: 'Irish' },
  { id: 'camille', title: 'Camille', nations: ['Switzerland'], target: 20, label: 'Swiss' },
  { id: 'six-god', title: '6 God', nations: ['Canada'], target: 20, label: 'Canadian' },
];

const UNKNOWN_TARGET = 300;
const RERANK_TARGET = 20;
const CHALLENGE_TARGET = 50;


function badge(id, icon, title, description, count, target, recorded) {

  return {
    id,
    icon,
    iconText: null,
    title,
    description,
    bonus: BADGE_XP_TEXT,
    earned: count >= target || recorded.has(id),
    progress: `${Math.min(count, target)} / ${target}`,
  };
}


// Every extra badge except UNITED NATIONS / SCOUTS HONOR.
// rankedIds: Set of ids ever properly ranked.
// recorded: Set of badge ids already earned.
export function getExtraBadges({
  rankings,
  rankedIds,
  challengeCount,
  rerankCount,
  recorded,
}) {

  const sources = [...rankedIds]
    .map(id => getSourcePlayer(id))
    .filter(Boolean);

  const count = test => sources.filter(test).length;

  const current = rankings || [];

  const badges = [];


  // THE BIG FIVE
  const leaguesRanked = new Set(
    sources.map(source => source.currentLeague)
  );

  badges.push(badge(
    'big-five',
    '🖐️',
    'The Big Five',
    'A player from all five big leagues',
    BIG_FIVE.filter(league => leaguesRanked.has(league)).length,
    BIG_FIVE.length,
    recorded
  ));


  // THE LEGENDS ... THE BAD (players in the category now)
  CATEGORY_BADGES.forEach(entry => {
    badges.push(badge(
      entry.id,
      entry.icon,
      entry.title,
      `${entry.target} players ranked ${entry.category}`,
      current.filter(player => player.category === entry.category).length,
      entry.target,
      recorded
    ));
  });


  // HIT THE BOOKS (Unknown players now)
  badges.push(badge(
    'hit-the-books',
    '📖',
    'Hit The Books',
    `${UNKNOWN_TARGET} players marked "I do not know"`,
    current.filter(player => player.category === 'Unknown').length,
    UNKNOWN_TARGET,
    recorded
  ));


  // POSITIONS
  POSITION_BADGES.forEach(entry => {
    badges.push(badge(
      entry.id,
      entry.icon,
      entry.title,
      `${entry.target} ${entry.label} ranked`,
      count(source => entry.positions.includes(source.specificPosition)),
      entry.target,
      recorded
    ));
  });


  // SECOND THOUGHTS / CHALLENGER
  badges.push(badge(
    'second-thoughts',
    '🔄',
    'Second Thoughts',
    `${RERANK_TARGET} players re-ranked`,
    rerankCount || 0,
    RERANK_TARGET,
    recorded
  ));

  badges.push(badge(
    'challenger',
    '⚔️',
    'Challenger',
    `${CHALLENGE_TARGET} challenges played`,
    challengeCount || 0,
    CHALLENGE_TARGET,
    recorded
  ));


  // NATIONS (flag in the circle)
  NATION_BADGES.forEach(entry => {
    badges.push(badge(
      entry.id,
      getFlag(entry.nations[0]) || '🏳️',
      entry.title,
      `${entry.target} ${entry.label} players ranked`,
      count(source => entry.nations.includes(source.nation)),
      entry.target,
      recorded
    ));
  });


  return badges;
}
