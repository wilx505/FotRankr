/*
============================================================
CLUB BADGES
============================================================

Each club is shown as a circle in its colours with a short
code (ARS, AVL...). Official crests are trademarks, so they
are deliberately not used.

Keys are the club names exactly as they appear in
players.js. Clubs not listed get a neutral badge with a code
made from their name.

  code   = 3 letters shown in the badge
  fill   = circle colour
  ring   = border colour
  text   = code colour
============================================================
*/

const CLUB_STYLES = {
  'AFC Bournemouth': { code: 'BOU', fill: '#DA291C', ring: '#111111', text: '#FFFFFF' },
  Arsenal: { code: 'ARS', fill: '#EF0107', ring: '#FFFFFF', text: '#FFFFFF' },
  'Aston Villa': { code: 'AVL', fill: '#670E36', ring: '#95BFE5', text: '#95BFE5' },
  Brentford: { code: 'BRE', fill: '#E30613', ring: '#FFFFFF', text: '#FFFFFF' },
  'Brighton & Hove Albion': { code: 'BHA', fill: '#0057B8', ring: '#FFFFFF', text: '#FFFFFF' },
  Chelsea: { code: 'CHE', fill: '#034694', ring: '#FFFFFF', text: '#FFFFFF' },
  'Coventry City': { code: 'COV', fill: '#59CBE8', ring: '#FFFFFF', text: '#002B5C' },
  'Crystal Palace': { code: 'CRY', fill: '#1B458F', ring: '#C4122E', text: '#FFFFFF' },
  Everton: { code: 'EVE', fill: '#003399', ring: '#FFFFFF', text: '#FFFFFF' },
  Fulham: { code: 'FUL', fill: '#FFFFFF', ring: '#111111', text: '#111111' },
  'Hull City': { code: 'HUL', fill: '#F5A12D', ring: '#111111', text: '#111111' },
  'Ipswich Town': { code: 'IPS', fill: '#0044A9', ring: '#FFFFFF', text: '#FFFFFF' },
  'Leeds United': { code: 'LEE', fill: '#FFFFFF', ring: '#FFCD00', text: '#1D428A' },
  Liverpool: { code: 'LIV', fill: '#C8102E', ring: '#F6EB61', text: '#FFFFFF' },
  'Manchester City': { code: 'MCI', fill: '#6CABDD', ring: '#FFFFFF', text: '#1C2C5B' },
  'Manchester United': { code: 'MUN', fill: '#DA291C', ring: '#FBE122', text: '#FFFFFF' },
  'Newcastle United': { code: 'NEW', fill: '#241F20', ring: '#FFFFFF', text: '#FFFFFF' },
  'Nottingham Forest': { code: 'NFO', fill: '#DD0000', ring: '#FFFFFF', text: '#FFFFFF' },
  Sunderland: { code: 'SUN', fill: '#EB172B', ring: '#FFFFFF', text: '#FFFFFF' },
  'Tottenham Hotspur': { code: 'TOT', fill: '#FFFFFF', ring: '#132257', text: '#132257' },
};

// Gold "TRUE ..." badges: Premier League clubs only, for
// properly ranking every player (no "I DO NOT KNOW").
const CLUB_NICKNAMES = {
  'AFC Bournemouth': 'Cherry',
  Arsenal: 'Gunner',
  'Aston Villa': 'Villan',
  Brentford: 'Bee',
  'Brighton & Hove Albion': 'Seagull',
  Chelsea: 'Blue',
  'Coventry City': 'Sky Blue',
  'Crystal Palace': 'Eagle',
  Everton: 'Toffee',
  Fulham: 'Cottager',
  'Hull City': 'Tiger',
  'Ipswich Town': 'Tractor Boy',
  'Leeds United': 'White',
  Liverpool: 'Red',
  'Manchester City': 'Citizen',
  'Manchester United': 'Red Devil',
  'Newcastle United': 'Magpie',
  'Nottingham Forest': 'Tricky Tree',
  Sunderland: 'Black Cat',
  'Tottenham Hotspur': 'Spur',
};


// "True Red" for Liverpool, or null if the club has no
// gold badge.
export function getGoldTitle(club) {
  const nickname = CLUB_NICKNAMES[club];
  return nickname ? `True ${nickname}` : null;
}


export const GOLD_STYLE = {
  fill: '#D4AF37',
  ring: '#FFE58A',
  text: '#3B2A00',
};


// Words skipped when making a code from a club name.
const SKIP_WORDS = new Set([
  'fc', 'afc', 'cf', 'sc', 'ac', 'as', 'ssc', 'club', 'de',
  'del', 'la', 'the', 'real', 'clube',
]);


function codeFromName(club) {

  const words = (club || '')
    .split(/[\s.-]+/)
    .filter(word => word && !SKIP_WORDS.has(word.toLowerCase()));

  const base = words[0] || club || '?';

  return base.slice(0, 3).toUpperCase();
}


// Always returns a style, so every club can show a badge.
export function getClubStyle(club) {

  return CLUB_STYLES[club] || {
    code: codeFromName(club),
    fill: '#1b1b1b',
    ring: '#3a3a3a',
    text: '#cccccc',
  };
}
