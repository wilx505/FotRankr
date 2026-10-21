/*
============================================================
NATIONAL FLAGS
============================================================

Turns a player's nation ("Brazil", "Cote d'Ivoire") into a
flag emoji. Nation names come from Transfermarkt and from the
squad lists, so both spellings are listed where they differ.
Unknown nations return null (callers fall back to the
player's initial).
============================================================
*/

// Nation -> ISO 3166 two-letter code.
const COUNTRY_CODES = {
  Albania: 'AL',
  Algeria: 'DZ',
  Angola: 'AO',
  Argentina: 'AR',
  Armenia: 'AM',
  Australia: 'AU',
  Austria: 'AT',
  Belgium: 'BE',
  'Bosnia-Herzegovina': 'BA',
  'Bosnia and Herzegovina': 'BA',
  Brazil: 'BR',
  Bulgaria: 'BG',
  'Burkina Faso': 'BF',
  Cameroon: 'CM',
  Canada: 'CA',
  'Cape Verde': 'CV',
  'Central African Republic': 'CF',
  Chile: 'CL',
  China: 'CN',
  Colombia: 'CO',
  'Costa Rica': 'CR',
  "Cote d'Ivoire": 'CI',
  'Ivory Coast': 'CI',
  Croatia: 'HR',
  Curacao: 'CW',
  Cyprus: 'CY',
  'Czech Republic': 'CZ',
  Czechia: 'CZ',
  'DR Congo': 'CD',
  Congo: 'CG',
  Denmark: 'DK',
  'Dominican Republic': 'DO',
  Ecuador: 'EC',
  Egypt: 'EG',
  'Equatorial Guinea': 'GQ',
  Estonia: 'EE',
  Finland: 'FI',
  France: 'FR',
  Gabon: 'GA',
  'The Gambia': 'GM',
  Gambia: 'GM',
  Georgia: 'GE',
  Germany: 'DE',
  Ghana: 'GH',
  Greece: 'GR',
  Guinea: 'GN',
  'Guinea-Bissau': 'GW',
  Haiti: 'HT',
  Honduras: 'HN',
  Hungary: 'HU',
  Iceland: 'IS',
  Iran: 'IR',
  Iraq: 'IQ',
  Ireland: 'IE',
  'Republic of Ireland': 'IE',
  Israel: 'IL',
  Italy: 'IT',
  Jamaica: 'JM',
  Japan: 'JP',
  Kenya: 'KE',
  'Korea, South': 'KR',
  'South Korea': 'KR',
  Kosovo: 'XK',
  Latvia: 'LV',
  Liberia: 'LR',
  Lithuania: 'LT',
  Luxembourg: 'LU',
  Mali: 'ML',
  Malta: 'MT',
  Mexico: 'MX',
  Moldova: 'MD',
  Montenegro: 'ME',
  Morocco: 'MA',
  Mozambique: 'MZ',
  Netherlands: 'NL',
  'New Zealand': 'NZ',
  Nigeria: 'NG',
  'North Macedonia': 'MK',
  Norway: 'NO',
  Panama: 'PA',
  Paraguay: 'PY',
  Peru: 'PE',
  Poland: 'PL',
  Portugal: 'PT',
  Qatar: 'QA',
  Romania: 'RO',
  Russia: 'RU',
  'Saudi Arabia': 'SA',
  Senegal: 'SN',
  Serbia: 'RS',
  'Sierra Leone': 'SL',
  Slovakia: 'SK',
  Slovenia: 'SI',
  'South Africa': 'ZA',
  Spain: 'ES',
  Suriname: 'SR',
  Sweden: 'SE',
  Switzerland: 'CH',
  Togo: 'TG',
  Tunisia: 'TN',
  Turkey: 'TR',
  'Türkiye': 'TR',
  Ukraine: 'UA',
  'United States': 'US',
  USA: 'US',
  Uruguay: 'UY',
  Uzbekistan: 'UZ',
  Venezuela: 'VE',
  Zambia: 'ZM',
  Zimbabwe: 'ZW',
};

// Home nations have their own flags (no two-letter code).
const SPECIAL_FLAGS = {
  England: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  Scotland: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  Wales: '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
};

// No flag emoji, so these show as text instead.
const TEXT_MARKERS = {
  'Northern Ireland': 'N.I.',
};


// Shown when there's no flag: "N.I." or the player's initial.
export function getMarkerText(player) {
  return (
    TEXT_MARKERS[player?.nation] ||
    player?.name?.charAt(0)?.toUpperCase()
  );
}


export function getFlag(nation) {

  if (!nation) {
    return null;
  }

  if (SPECIAL_FLAGS[nation]) {
    return SPECIAL_FLAGS[nation];
  }

  const code = COUNTRY_CODES[nation];

  if (!code) {
    return null;
  }

  // Each letter becomes a "regional indicator" character;
  // two together render as that country's flag.
  return String.fromCodePoint(
    ...[...code].map(
      letter => 0x1f1e6 + letter.charCodeAt(0) - 65
    )
  );
}
