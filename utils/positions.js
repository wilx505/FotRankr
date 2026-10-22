// Position names as shown to the user. The data keeps
// Transfermarkt's names (filters and head-to-head groups
// use those); this only changes what's displayed.
const DISPLAY_NAMES = {
  'Centre-Forward': 'Striker',
};


export function displayPosition(position) {
  return DISPLAY_NAMES[position] || position;
}
