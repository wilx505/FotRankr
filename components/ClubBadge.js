import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getClubStyle } from '../utils/clubBadges';


// A club shown as a circle in its colours with a short code.
export default function ClubBadge({
  club,
  size = 48,
}) {

  const clubStyle = getClubStyle(club);

  return (

    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: Math.max(2, size / 18),
          backgroundColor: clubStyle.fill,
          borderColor: clubStyle.ring,
        },
      ]}
    >

      <Text
        style={[
          styles.code,
          {
            color: clubStyle.text,
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

});
