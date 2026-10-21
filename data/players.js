/*
Fields used by lists:

active:  true = still playing, false = retired
leagues: every league the player has played in (used for
         filters like "Premier League")

Keep league names spelled the same everywhere,
e.g. always 'Premier League', never 'EPL'.
*/

const PLAYERS = [
  {
    id: 1,
    name: 'Lionel Messi',
    nation: 'Argentina',
    position: 'Attack',
    active: true,
    leagues: ['La Liga', 'Ligue 1', 'MLS'],
  },
  {
    id: 2,
    name: 'Cristiano Ronaldo',
    nation: 'Portugal',
    position: 'Attack',
    active: true,
    leagues: [
      'Primeira Liga',
      'Premier League',
      'La Liga',
      'Serie A',
      'Saudi Pro League',
    ],
  },
  {
    id: 3,
    name: 'Kylian Mbappe',
    nation: 'France',
    position: 'Attack',
    active: true,
    leagues: ['Ligue 1', 'La Liga'],
  },
  {
    id: 4,
    name: 'Erling Haaland',
    nation: 'Norway',
    position: 'Attack',
    active: true,
    leagues: [
      'Eliteserien',
      'Austrian Bundesliga',
      'Bundesliga',
      'Premier League',
    ],
  },
  {
    id: 5,
    name: 'Mohamed Salah',
    nation: 'Egypt',
    position: 'Attack',
    active: true,
    leagues: [
      'Egyptian Premier League',
      'Swiss Super League',
      'Premier League',
      'Serie A',
    ],
  },
  {
    id: 6,
    name: 'Vinicius Junior',
    nation: 'Brazil',
    position: 'Attack',
    active: true,
    leagues: ['Brasileirao', 'La Liga'],
  },
  {
    id: 7,
    name: 'Jude Bellingham',
    nation: 'England',
    position: 'Midfield',
    active: true,
    leagues: ['Championship', 'Bundesliga', 'La Liga'],
  },
  {
    id: 8,
    name: 'Kevin De Bruyne',
    nation: 'Belgium',
    position: 'Midfield',
    active: true,
    leagues: [
      'Belgian Pro League',
      'Bundesliga',
      'Premier League',
      'Serie A',
    ],
  },
  {
    id: 9,
    name: 'Harry Kane',
    nation: 'England',
    position: 'Attack',
    active: true,
    leagues: ['Premier League', 'Bundesliga'],
  },
  {
    id: 10,
    name: 'Rodri',
    nation: 'Spain',
    position: 'Midfield',
    active: true,
    leagues: ['La Liga', 'Premier League'],
  },
  {
    id: 11,
    name: 'Virgil van Dijk',
    nation: 'Netherlands',
    position: 'Defence',
    active: true,
    leagues: [
      'Eredivisie',
      'Scottish Premiership',
      'Premier League',
    ],
  },
  {
    id: 12,
    name: 'Lamine Yamal',
    nation: 'Spain',
    position: 'Attack',
    active: true,
    leagues: ['La Liga'],
  },
  {
    id: 13,
    name: 'Bukayo Saka',
    nation: 'England',
    position: 'Attack',
    active: true,
    leagues: ['Premier League'],
  },
  {
    id: 14,
    name: 'Cole Palmer',
    nation: 'England',
    position: 'Attack',
    active: true,
    leagues: ['Premier League'],
  },
  {
    id: 15,
    name: 'Florian Wirtz',
    nation: 'Germany',
    position: 'Midfield',
    active: true,
    leagues: ['Bundesliga', 'Premier League'],
  },
  {
    id: 16,
    name: 'Pedri',
    nation: 'Spain',
    position: 'Midfield',
    active: true,
    leagues: ['La Liga'],
  },
  {
    id: 17,
    name: 'Federico Valverde',
    nation: 'Uruguay',
    position: 'Midfield',
    active: true,
    leagues: ['Uruguayan Primera Division', 'La Liga'],
  },
  {
    id: 18,
    name: 'William Saliba',
    nation: 'France',
    position: 'Defence',
    active: true,
    leagues: ['Ligue 1', 'Premier League'],
  },
  {
    id: 19,
    name: 'Ruben Dias',
    nation: 'Portugal',
    position: 'Defence',
    active: true,
    leagues: ['Primeira Liga', 'Premier League'],
  },
  {
    // Was id 5, which clashed with Mohamed Salah.
    id: 20,
    name: 'Alisson Becker',
    nation: 'Brazil',
    position: 'Goalkeeper',
    specificPosition: 'Goalkeeper',
    club: 'Liverpool',
    active: true,
    leagues: ['Brasileirao', 'Serie A', 'Premier League'],
  },
];

export default PLAYERS;