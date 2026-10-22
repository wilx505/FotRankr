import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  GOLD_STYLE,
  getClubStyle,
} from '../utils/clubBadges';


// A club shown as a circle in its colours with a short code.
// gold = the all-gold "TRUE ..." version.
export default function ClubBadge({
  club,
  size = 48,
  gold = false,
}) {

  const clubStyle = getClubStyle(club);

  const colours = gold ? GOLD_STYLE : clubStyle;

  return (

    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: Math.max(2, size / 18),
          backgroundColor: colours.fill,
          borderColor: colours.ring,
        },
        gold && styles.goldGlow,
      ]}
    >

      <Text
        style={[
          styles.code,
          {
            color: colours.text,
            fontSize: size * 0.3,
          },
        ]}
        numberOfLines={1}
        allowFontScaling={false}
      >
        {clubStyle.code}
      </Text>

    </View>

  );
}


const styles = StyleSheet.create({

  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  code: {
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  goldGlow: {
    shadowColor: '#FFD700',
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },

});
