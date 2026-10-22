import {
  useEffect,
  useRef,
} from 'react';

import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import ClubBadge from './ClubBadge';


const SHOW_FOR_MS = 4000;


// "BADGE UNLOCKED" banner that slides down from the top,
// then hides itself (or when tapped) and calls onHide so the
// next badge in the queue can show.
export default function BadgeToast({
  badge,
  onHide,
}) {

  const slide = useRef(new Animated.Value(-160)).current;

  // A tap and the timer can both try to hide it; only the
  // first counts, or the next badge would be skipped.
  const hidingRef = useRef(false);

  useEffect(() => {

    if (!badge) {
      return undefined;
    }

    hidingRef.current = false;

    slide.setValue(-160);

    Animated.spring(slide, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
    }).start();

    const timer = setTimeout(hide, SHOW_FOR_MS);

    return () => clearTimeout(timer);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [badge]);


  const hide = () => {

    if (hidingRef.current) {
      return;
    }

    hidingRef.current = true;

    Animated.timing(slide, {
      toValue: -160,
      duration: 220,
      useNativeDriver: true,
    }).start(() => onHide());
  };


  if (!badge) {
    return null;
  }


  return (

    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        { transform: [{ translateY: slide }] },
      ]}
    >

      <TouchableOpacity
        style={styles.toast}
        onPress={hide}
        activeOpacity={0.9}
      >

        {badge.club ? (

          <ClubBadge
            club={badge.club}
            size={46}
          />

        ) : (

          <View style={styles.iconCircle}>

            <Text
              style={
                badge.icon
                  ? styles.icon
                  : styles.iconText
              }
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {badge.icon || badge.iconText}
            </Text>

          </View>

        )}


        <View style={styles.details}>

          <Text style={styles.label}>
            🏅 BADGE UNLOCKED
          </Text>

          <Text
            style={styles.title}
            numberOfLines={1}
          >
            {badge.title}
          </Text>

          {badge.subtitle ? (

            <Text
              style={styles.subtitle}
              numberOfLines={2}
            >
              {badge.subtitle}
            </Text>

          ) : null}

        </View>

      </TouchableOpacity>

    </Animated.View>

  );
}


const styles = StyleSheet.create({

  wrapper: {
    position: 'absolute',
    top: 50,
    left: 14,
    right: 14,
    zIndex: 1000,
    elevation: 20,
  },

  toast: {
    backgroundColor: '#101010',
    borderWidth: 1,
    borderColor: '#00ff66',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },

  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#141414',
    borderWidth: 2,
    borderColor: '#00ff66',
    alignItems: 'center',
    justifyContent: 'center',
  },

  icon: {
    fontSize: 22,
  },

  // Roman numerals (CC, DCCC...)
  iconText: {
    color: '#00ff66',
    fontSize: 15,
    fontWeight: '900',
    paddingHorizontal: 4,
  },

  details: {
    flex: 1,
    marginLeft: 12,
  },

  label: {
    color: '#00ff66',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.3,
  },

  title: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 2,
  },

  subtitle: {
    color: '#999999',
    fontSize: 12,
    marginTop: 2,
  },

});
