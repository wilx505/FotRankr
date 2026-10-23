// Position names as shown to the user. The data keeps
// Transfermarkt's names (filters and head-to-head groups
// use those); this only changes what's displayed.
const DISPLAY_NAMES = {
  'Centre-Forward': 'Striker',
};


export function displayPosition(position) {
  return DISPLAY_NAMES[position] || position;
}


// Wide midfielders play on the same flank as wingers, so
// they share head-to-heads with them, and a winger filter
// also shows them. (A wide midfielder keeps their own
// position everywhere else.)
const SIDE_PARTNERS = {
  'Left Winger': ['Left Midfield'],
  'Right Winger': ['Right Midfield'],
  'Left Midfield': ['Left Winger'],
  'Right Midfield': ['Right Winger'],
};


// Positions that face each other in automatic head-to-heads.
export function headToHeadGroup(specificPosition) {
  return [
    specificPosition,
    ...(SIDE_PARTNERS[specificPosition] || []),
  ];
}


// Does a player's position pass a specific-position filter?
// "Left Winger" also lets left midfielders through; "Left
// Midfield" only shows left midfielders.
export function matchesSpecificFilter(filter, specificPosition) {

  if (filter === 'Left Winger' || filter === 'Right Winger') {
    return headToHeadGroup(filter).includes(specificPosition);
  }

  return filter === specificPosition;
}
