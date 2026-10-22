import { getFlag } from './flags';

import {
  CLUB_BONUS_XP,
  MILESTONE_BADGE_XP,
  MILESTONE_EVERY,
  PATRIOT_TARGET,
  POSITION_BADGES,
  getCompletedClubs,
  getMilestonesEarned,
  getProgress,
} from './progression';

/*
============================================================
PROFILE BADGES
============================================================

Worked out live from myRankings, like XP.

  Milestones = one every MILESTONE_EVERY players properly
               ranked ("I DO NOT KNOW" players don't count):
               100 Centurion, then the Latin number
               (200 Ducenti, 300 Trecenti ... 1000 Mille).
               Each is worth MILESTONE_BADGE_XP.
  The Patriot = PATRIOT_TARGET players from one nation.
               Its icon becomes that nation's flag. Worth
               MILESTONE_BADGE_XP.
  Position   = The Wall (200 defenders), The Maestro (200
               midfielders), The Predator (200 attackers),
               The Buffon (100 goalkeepers). Set in
               POSITION_BADGES in progression.js. Each worth
               MILESTONE_BADGE_XP.
  Club badge = one for every club where every current
               player is ranked. Worth CLUB_BONUS_XP.

TO ADD A BADGE, ADD IT TO getBadges BELOW.
============================================================
*/

const LATIN_HUNDREDS = [
  '',
  'Centum',
  'Ducenti',
  'Trecenti',
  'Quadringenti',
  'Quingenti',
  'Sescenti',
  'Septingenti',
  'Octingenti',
  'Nongenti',
];

const LATIN_THOUSANDS = [
  '',
  'Mille',
  'Duo Milia',
  'Tria Milia',
  'Quattuor Milia',
  'Quinque Milia',
  'Sex Milia',
  'Septem Milia',
  'Octo Milia',
  'Novem Milia',
];

const ROMAN = [
  [1000, 'M'],
  [900, 'CM'],
  [500, 'D'],
  [400, 'CD'],
  [100, 'C'],
];


// 200 -> "Ducenti", 1300 -> "Mille Trecenti".
function latinName(number) {

  const thousands = Math.floor(number / 1000);
  const hundreds = Math.floor((number % 1000) / 100);

  return [
    LATIN_THOUSANDS[thousands],
    LATIN_HUNDREDS[hundreds],
  ]
    .filter(Boolean)
    .join(' ');
}


// 400 -> "CD" (works for multiples of 100).
function romanNumeral(number) {

  let remaining = number;
  let numeral = '';

  ROMAN.forEach(([value, letters]) => {
    while (remaining >= value) {
      numeral += letters;
      remaining -= value;
    }
  });

  return numeral;
}


function milestoneBadge(count, playersRanked) {

  const isCenturion = count === MILESTONE_EVERY;

  const earned = playersRanked >= count;

  return {
    id: `milestone|${count}`,
    icon: isCenturion ? '💯' : null,
    iconText: isCenturion ? null : romanNumeral(count),
    title: isCenturion ? 'Centurion' : latinName(count),
    description: `${count.toLocaleString()} players ranked`,
    bonus: `+${MILESTONE_BADGE_XP} XP badge bonus`,
    earned,
    progress: `${Math.min(playersRanked, count)} / ${count}`,
  };
}


// [{ id, icon | iconText | club, title, description,
//    bonus, earned, progress }]
// Shows every earned badge plus the next milestone to aim
// for. Earned badges first.
export function getBadges(myRankings) {

  const {
    playersRanked,
    topNation,
    patriotEarned,
    positionCounts,
  } = getProgress(myRankings);

  const milestonesEarned =
    getMilestonesEarned(playersRanked);

  const badges = [];

  for (let step = 1; step <= milestonesEarned + 1; step++) {
    badges.push(
      milestoneBadge(step * MILESTONE_EVERY, playersRanked)
    );
  }

  badges.push({
    id: 'patriot',
    icon: (patriotEarned && getFlag(topNation.nation)) || '🫡',
    iconText: null,
    title: 'The Patriot',
    description: patriotEarned
      ? `${PATRIOT_TARGET} players from one nation`
      : `Rank ${PATRIOT_TARGET} players from one nation`,
    bonus: `+${MILESTONE_BADGE_XP} XP badge bonus`,
    earned: patriotEarned,
    progress: `${Math.min(topNation.count, PATRIOT_TARGET)} / ${PATRIOT_TARGET} players`,
  });

  POSITION_BADGES.forEach(position => {

    const count = positionCounts[position.position] || 0;

    badges.push({
      id: position.id,
      icon: position.icon,
      iconText: null,
      title: position.title,
      description: `${position.target} ${position.label} ranked`,
      bonus: `+${MILESTONE_BADGE_XP} XP badge bonus`,
      earned: count >= position.target,
      progress: `${Math.min(count, position.target)} / ${position.target} ${position.label}`,
    });
  });

  getCompletedClubs(myRankings).forEach(club => {
    badges.push({
      id: `club|${club.league}|${club.club}`,
      icon: null,
      club: club.club,
      league: club.league,
      title: club.club,
      description: 'Every player ranked',
      bonus: `+${CLUB_BONUS_XP} XP club bonus`,
      earned: true,
      progress: null,
    });
  });

  return [
    ...badges.filter(badge => badge.earned),
    ...badges.filter(badge => !badge.earned),
  ];
}
