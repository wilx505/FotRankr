/*
============================================================
CLUB BADGES
============================================================

Emoji shown instead of a club's first letter. Keys are the
club names exactly as they appear in players.js. Clubs not
listed here fall back to their first letter.
============================================================
*/

const CLUB_BADGES = {
  'AFC Bournemouth': '🍒',
  Arsenal: '🔴',
  'Aston Villa': '🦁',
  Brentford: '🐝',
  'Brighton & Hove Albion': '🐦',
  Chelsea: '🔵',
  'Coventry City': '🐘',
  'Crystal Palace': '🦅',
  Everton: '🔵',
  Fulham: '🏠',
  'Hull City': '🐯',
  'Ipswich Town': '🐴',
  'Leeds United': '⚪',
  Liverpool: '🔴',
  'Manchester City': '⛵',
  'Manchester United': '👹',
  'Newcastle United': '⚪',
  'Nottingham Forest': '🌳',
  Sunderland: '🐈‍⬛',
  'Tottenham Hotspur': '⚪',
};


export function getClubBadge(club) {
  return CLUB_BADGES[club] || null;
}
