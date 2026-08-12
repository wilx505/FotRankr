const players = [
  {
    id: 1,
    name: "Lionel Messi",
    nation: "Argentina",
    position: "Attack",
    specificPosition: "Right Winger",
    club: "Inter Miami",
  },

  {
    id: 2,
    name: "Cristiano Ronaldo",
    nation: "Portugal",
    position: "Attack",
    specificPosition: "Left Winger",
    club: "Al Nassr",
  },

  {
    id: 3,
    name: "Virgil van Dijk",
    nation: "Netherlands",
    position: "Defender",
    specificPosition: "Centre-Back",
    club: "Liverpool",
  },

  {
    id: 4,
    name: "Jude Bellingham",
    nation: "England",
    position: "Midfielder",
    specificPosition: "Central Midfielder",
    club: "Real Madrid",
  },

  {
    id: 5,
    name: "Alisson Becker",
    nation: "Brazil",
    position: "Goalkeeper",
    specificPosition: "Goalkeeper",
    club: "Liverpool",
  },

{
  id: 'salah',
  name: 'Mohamed Salah',
  nation: 'Egypt',
  position: 'Attack',
  specificPosition: 'Right Winger',
},

{
  id: 'mbappe',
  name: 'Kylian Mbappe',
  nation: 'France',
  position: 'Attack',
  specificPosition: 'Striker',
},

{
  id: 'de-bruyne',
  name: 'Kevin De Bruyne',
  nation: 'Belgium',
  position: 'Midfielder',  specificPosition: 'Central Midfielder',
},

{
  id: 'rodri',
  name: 'Rodri',
  nation: 'Spain',
  position: 'Midfielder',
  specificPosition: 'Defensive Midfielder',
},

{
  id: 'saliba',
  name: 'William Saliba',
  nation: 'France',
  position: 'Defender',
  specificPosition: 'Centre-Back',
},

{
  id: 'kane',
  name: 'Harry Kane',
  nation: 'England',
  position: 'Attack',
  specificPosition: 'Striker',
},

{
  id: 'yamal',
  name: 'Lamine Yamal',
  nation: 'Spain',
  position: 'Attack',
  specificPosition: 'Right Winger',
},

{
  id: 'saka',
  name: 'Bukayo Saka',
  nation: 'England',
  position: 'Attack',
  specificPosition: 'Right Winger',
},

{
  id: 'odegaard',
  name: 'Martin Odegaard',
  nation: 'Norway',
  position: 'Midfielder',
  specificPosition: 'Central Midfielder',
},

{
  id: 'palmer',
  name: 'Cole Palmer',
  nation: 'England',
  position: 'Midfielder',
  specificPosition: 'Attacking Midfielder',
},

{
  id: 'hakimi',
  name: 'Achraf Hakimi',
  nation: 'Morocco',
  position: 'Defender',
  specificPosition: 'Right-Back',
},
{
  id: 'courtois',
  name: 'Thibaut Courtois',
  nation: 'Belgium',
  position: 'Goalkeeper',
  specificPosition: 'Goalkeeper',
},

{
  id: 'donnarumma',
  name: 'Gianluigi Donnarumma',
  nation: 'Italy',
  position: 'Goalkeeper',
  specificPosition: 'Goalkeeper',
},

{
  id: 'neuer',
  name: 'Manuel Neuer',
  nation: 'Germany',
  position: 'Goalkeeper',
  specificPosition: 'Goalkeeper',
},

{
  id: 'rudiger',
  name: 'Antonio Rudiger',
  nation: 'Germany',
  position: 'Defender',
  specificPosition: 'Centre-Back',
},

{
  id: 'trent',
  name: 'Trent Alexander-Arnold',
  nation: 'England',
  position: 'Defender',
  specificPosition: 'Right-Back',
},

{
  id: 'walker',
  name: 'Kyle Walker',
  nation: 'England',
  position: 'Defender',
  specificPosition: 'Right-Back',
},

{
  id: 'reece-james',
  name: 'Reece James',
  nation: 'England',
  position: 'Defender',
  specificPosition: 'Right-Back',
},

{
  id: 'theo-hernandez',
  name: 'Theo Hernandez',
  nation: 'France',
  position: 'Defender',
  specificPosition: 'Left-Back',
},

{
  id: 'davies',
  name: 'Alphonso Davies',
  nation: 'Canada',
  position: 'Defender',
  specificPosition: 'Left-Back',
},

{
  id: 'robertson',
  name: 'Andrew Robertson',
  nation: 'Scotland',
  position: 'Defender',
  specificPosition: 'Left-Back',
},

{
  id: 'modric',
  name: 'Luka Modric',
  nation: 'Croatia',
  position: 'Midfielder',
  specificPosition: 'Central Midfielder',
},

{
  id: 'kroos',
  name: 'Toni Kroos',
  nation: 'Germany',
  position: 'Midfielder',
  specificPosition: 'Central Midfielder',
},

{
  id: 'valverde',
  name: 'Federico Valverde',
  nation: 'Uruguay',
  position: 'Midfielder',
  specificPosition: 'Central Midfielder',
},

{
  id: 'declan-rice',
  name: 'Declan Rice',
  nation: 'England',
  position: 'Midfielder',
  specificPosition: 'Defensive Midfielder',
},

{
  id: 'kimmich',
  name: 'Joshua Kimmich',
  nation: 'Germany',
  position: 'Midfielder',
  specificPosition: 'Defensive Midfielder',
},

{
  id: 'bruno',
  name: 'Bruno Fernandes',
  nation: 'Portugal',
  position: 'Midfielder',
  specificPosition: 'Attacking Midfielder',
},

{
  id: 'musiala',
  name: 'Jamal Musiala',
  nation: 'Germany',
  position: 'Midfielder',
  specificPosition: 'Attacking Midfielder',
},

{
  id: 'wirtz',
  name: 'Florian Wirtz',
  nation: 'Germany',
  position: 'Midfielder',
  specificPosition: 'Attacking Midfielder',
},

{
  id: 'haaland',
  name: 'Erling Haaland',
  nation: 'Norway',
  position: 'Attack',
  specificPosition: 'Striker',
},

{
  id: 'lewandowski',
  name: 'Robert Lewandowski',
  nation: 'Poland',
  position: 'Attack',
  specificPosition: 'Striker',
},

{
  id: 'lautaro',
  name: 'Lautaro Martinez',
  nation: 'Argentina',
  position: 'Attack',
  specificPosition: 'Striker',
},

{
  id: 'vinicius',
  name: 'Vinicius Junior',
  nation: 'Brazil',
  position: 'Attack',
  specificPosition: 'Left Winger',
},

{
  id: 'leao',
  name: 'Rafael Leao',
  nation: 'Portugal',
  position: 'Attack',
  specificPosition: 'Left Winger',
},

{
  id: 'kvaratskhelia',
  name: 'Khvicha Kvaratskhelia',
  nation: 'Georgia',
  position: 'Attack',
  specificPosition: 'Left Winger',
},


];

export default players;