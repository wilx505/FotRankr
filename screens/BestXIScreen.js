import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import ClubBadge from '../components/ClubBadge';

import {
  lastName,
  pickBestXI,
} from '../utils/bestXI';

import {
  getFlag,
  getMarkerText,
} from '../utils/flags';


const CATEGORY_COLOURS = {
  Legendary: '#9B59B6',
  Elite: '#00ff66',
  'Very Good': '#4DA6FF',
  Good: '#FFD700',
  OK: '#F39C12',
  Bad: '#E74C3C',
};


// One club's Best XI on a pitch, in a 4-3-3.
export default function BestXIScreen({
  route,
  navigation,
  myRankings,
}) {

  const {
    club,
    league,
  } = route.params || {};

  const rows = pickBestXI(club, league, myRankings);


  const renderSpot = (spot, index) => {

    const player = spot.player;

    const ring = player
      ? CATEGORY_COLOURS[player.category] || '#00ff66'
      : '#333333';

    return (

      <TouchableOpacity
        key={`${spot.slot}-${index}`}
        style={styles.spot}
        disabled={!player}
        onPress={() =>
          navigation.navigate('Challenge', { player })
        }
        activeOpacity={0.75}
      >

        <View
          style={[
            styles.flagCircle,
            { borderColor: ring },
          ]}
        >

          <Text
            style={
              player && getFlag(player.nation)
                ? styles.flag
                : styles.flagText
            }
          >
            {player
              ? getFlag(player.nation) || getMarkerText(player)
              : '?'}
          </Text>

        </View>

        <Text
          style={styles.name}
          numberOfLines={1}
        >
          {player ? lastName(player.name) : spot.slot}
        </Text>

      </TouchableOpacity>

    );
  };


  return (

    <View style={styles.screen}>

      {/* TOP BAR */}

      <View style={styles.topBar}>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >

          <Text style={styles.backArrow}>
            ‹
          </Text>

        </TouchableOpacity>


        <Text style={styles.topBarTitle}>
          BEST XI
        </Text>


        <View style={styles.topBarSpacer} />

      </View>


      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        {/* CLUB */}

        <View style={styles.clubHeader}>

          <ClubBadge
            club={club}
            size={56}
          />

          <View style={styles.clubDetails}>

            <Text style={styles.clubName}>
              {club}
            </Text>

            <Text style={styles.formation}>
              4-3-3  ·  YOUR HIGHEST-RATED XI
            </Text>

          </View>

        </View>


        {/* PITCH */}

        <View style={styles.pitch}>

          {/* Markings */}
          <View style={styles.halfwayLine} />
          <View style={styles.centreCircle} />
          <View style={styles.penaltyBox} />
          <View style={styles.sixYardBox} />


          {rows.map((row, rowIndex) => (

            <View
              key={rowIndex}
              style={styles.row}
            >
              {row.map(renderSpot)}
            </View>

          ))}

        </View>


        <Text style={styles.hint}>
          Tap a player to challenge for a higher rank
        </Text>

      </ScrollView>

    </View>

  );
}


const styles = StyleSheet.create({

  screen: {
    flex: 1,
    backgroundColor: '#050505',
  },

  topBar: {
    height: 78,
    paddingHorizontal: 20,
    paddingTop: 35,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#050505',
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#1d1d1d',
    alignItems: 'center',
    justifyContent: 'center',
  },

  backArrow: {
    color: '#00ff66',
    fontSize: 32,
    fontWeight: '300',
    lineHeight: 34,
    marginTop: -2,
  },

  topBarTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  topBarSpacer: {
    width: 42,
  },

  container: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },


  // CLUB

  clubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 16,
    paddingHorizontal: 4,
  },

  clubDetails: {
    marginLeft: 14,
    flex: 1,
  },

  clubName: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
  },

  formation: {
    color: '#555555',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 4,
  },


  // PITCH

  pitch: {
    backgroundColor: '#0b3d1e',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#1f6b3a',
    paddingVertical: 22,
    paddingHorizontal: 6,
    minHeight: 520,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },

  halfwayLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#2f8a4f',
  },

  centreCircle: {
    position: 'absolute',
    top: -50,
    alignSelf: 'center',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#2f8a4f',
  },

  penaltyBox: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
    width: '56%',
    height: 90,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: '#2f8a4f',
  },

  sixYardBox: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
    width: '28%',
    height: 36,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: '#2f8a4f',
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginVertical: 8,
  },


  // PLAYER SPOT

  spot: {
    width: 78,
    alignItems: 'center',
  },

  flagCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    backgroundColor: '#050505',
    alignItems: 'center',
    justifyContent: 'center',
  },

  flag: {
    fontSize: 24,
  },

  flagText: {
    color: '#00ff66',
    fontSize: 14,
    fontWeight: '900',
  },

  name: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 5,
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowRadius: 4,
  },

  hint: {
    color: '#555555',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    lineHeight: 15,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: 16,
  },

});
