import players from '../players';

import { getFlag } from './flags';

import { getSourcePlayer } from './listHelpers';

import { getGoldTitle } from './clubBadges';

import {
  CLUB_BONUS_XP,
  GOLD_BADGE_XP,
  LEVELS,
  MAX_LEVEL,
  XP_PER_LEVEL,
  MILESTONE_BADGE_XP,
  MILESTONE_EVERY,
  PATRIOT_TARGET,
  POSITION_BADGES,
  getCompletedClubs,
  getCompletedLeagues,
  getExtraBadgeList,
  getGoldClubs,
  getMilestonesEarned,
  getProgress,
  getRankedIdsEver,
  getRecordedBadgeIds,
  isUnlocked,
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
  Level      = one for every level finished, named after it
               (Plastic Fan for finishing Level 1 ... The
               Oracle for reaching Level 12). Worth
               MILESTONE_BADGE_XP.
  League     = "<League> Expert" for ranking every player in
               a league with LEAGUE_EXPERT_MIN+ players
               ("I DO NOT KNOW" counts). Worth
               MILESTONE_BADGE_XP.
  Gold badge = "TRUE ..." (e.g. TRUE RED), Premier League
               clubs only, for ranking every player properly
               (no "I DO NOT KNOW"). Worth GOLD_BADGE_XP.

TO ADD A BADGE, ADD IT TO getBadges BELOW.
============================================================
*/

// League -> country, for the Expert badge's flag.
const LEAGUE_COUNTRIES = {
  'Premier League': 'England',
  Championship: 'England',
  'La Liga': 'Spain',
  'Segunda División': 'Spain',
  'Ligue 1': 'France',
  'Serie A': 'Italy',
  Bundesliga: 'Germany',
  'Saudi Pro League': 'Saudi Arabia',
  Brasileirao: 'Brazil',
  'Super Lig': 'Turkey',
  'Primeira Liga': 'Portugal',
  Eredivisie: 'Netherlands',
  MLS: 'United States',
  'Super League Greece': 'Greece',
};


// "Premier League" -> 🏴󠁧󠁢󠁥󠁮󠁧󠁿 (🏆 if unknown).
export function leagueFlag(league) {
  return getFlag(LEAGUE_COUNTRIES[league]) || '🏆';
}


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
    level,
    isMaxLevel,
    xpIntoLevel,
  } = getProgress(myRankings);

  const milestonesEarned =
    getMilestonesEarned(playersRanked);

  const badges = [];


  // Level badges: one for every level finished (Plastic Fan
  // for finishing Level 1...), The Oracle for reaching the
  // top. Plus the current level as the next one to aim for.
  LEVELS.forEach(info => {

    const finished =
      info.level < level ||
      (info.level === MAX_LEVEL && isMaxLevel);

    const isNext = info.level === level && !isMaxLevel;

    if (!finished && !isNext) {
      return;
    }

    badges.push({
      id: `level|${info.level}`,
      icon: info.badge,
      iconText: null,
      title: info.title,
      description:
        info.level === MAX_LEVEL
          ? `Reached Level ${MAX_LEVEL}`
          : `Level ${info.level} complete`,
      bonus: `+${MILESTONE_BADGE_XP} XP badge bonus`,
      earned: finished,
      progress: `${xpIntoLevel.toLocaleString()} / ${XP_PER_LEVEL.toLocaleString()} XP`,
    });
  });

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

  getGoldClubs(myRankings).forEach(club => {
    badges.push({
      id: `gold|${club.league}|${club.club}`,
      icon: null,
      club: club.club,
      league: club.league,
      gold: true,
      title: getGoldTitle(club.club),
      description: 'Every player properly ranked',
      bonus: `+${GOLD_BADGE_XP} XP gold badge bonus`,
      earned: true,
      progress: null,
    });
  });

  getCompletedLeagues(myRankings).forEach(entry => {
    badges.push({
      id: `league|${entry.league}`,
      icon: getFlag(LEAGUE_COUNTRIES[entry.league]) || '🏆',
      iconText: null,
      title: `${entry.league} Expert`,
      description: 'Every player ranked',
      bonus: `+${MILESTONE_BADGE_XP} XP badge bonus`,
      earned: true,
      progress: null,
    });
  });

  // Big Five, categories, positions, nations... (extraBadges.js)
  badges.push(...getExtraBadgeList(myRankings));


  const recorded = getRecordedBadgeIds();


  // UNITED NATIONS: a player from every nation you can rank
  // at your level.
  const rankedNations = new Set(
    [...getRankedIdsEver(myRankings)]
      .map(id => getSourcePlayer(id)?.nation)
      .filter(Boolean)
  );

  const availableNations = [
    ...new Set(
      players
        .filter(player => isUnlocked(player.id, level))
        .map(player => player.nation)
        .filter(Boolean)
    ),
  ];

  const nationsCovered = availableNations.filter(
    nation => rankedNations.has(nation)
  ).length;

  badges.push({
    id: 'united-nations',
    icon: '🇺🇳',
    iconText: null,
    title: 'United Nations',
    description: 'A player from every available nation',
    bonus: `+${MILESTONE_BADGE_XP} XP badge bonus`,
    earned:
      recorded.has('united-nations') ||
      (availableNations.length > 0 &&
        nationsCovered === availableNations.length),
    progress: `${nationsCovered} / ${availableNations.length}`,
  });


  // SCOUTS HONOR: 50 other badges.
  const SCOUTS_TARGET = 50;

  const othersEarned = badges.filter(badge => badge.earned).length;

  badges.push({
    id: 'scouts-honor',
    icon: '🎖️',
    iconText: null,
    title: 'Scouts Honor',
    description: `${SCOUTS_TARGET} badges collected`,
    bonus: `+${MILESTONE_BADGE_XP} XP badge bonus`,
    earned:
      recorded.has('scouts-honor') ||
      othersEarned >= SCOUTS_TARGET,
    progress: `${Math.min(othersEarned, SCOUTS_TARGET)} / ${SCOUTS_TARGET}`,
  });


  return [
    ...badges.filter(badge => badge.earned),
    ...badges.filter(badge => !badge.earned),
  ];
}
