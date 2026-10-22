import { displayPosition } from '../utils/positions';

import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import ClubBadge from '../components/ClubBadge';

import {
  getFlag,
  getMarkerText,
} from '../utils/flags';

import { getSourcePlayer } from '../utils/listHelpers';

import { isUnknown } from '../utils/progression';


const CATEGORY_COLOURS = {
  Legendary: '#9B59B6',
  Elite: '#00ff66',
  'Very Good': '#4DA6FF',
  Good: '#FFD700',
  OK: '#F39C12',
  Bad: '#E74C3C',
  Unknown: '#777777',
};


// Every ranked player at one club, best first, whatever
// their position. Opened from a club badge on the profile.
export default function ClubRankingsScreen({
  route,
  navigation,
  myRankings,
}) {

  const {
    club,
    league,
  } = route.params || {};


  // Club comes from the live player data, so it is the
  // player's current club, not where they were when ranked.
  const clubPlayers = (myRankings || [])
    .filter(player => {

      const source = getSourcePlayer(player.id);

      return (
        source &&
        source.active !== false &&
        source.club === club &&
        (source.currentLeague || null) === (league || null)
      );
    })
    .sort((a, b) => {

      // Unknown players (0.00) go last.
      if (isUnknown(a) !== isUnknown(b)) {
        return isUnknown(a) ? 1 : -1;
      }

      return b.rating - a.rating;
    });


  const openPlayer = player => {

    navigation.navigate(
      isUnknown(player)
        ? 'Compare'
        : 'Challenge',
      {
        player,
      }
    );
  };


  return (

    <View style={styles.screen}>

      {/* -------------------------------------------- */}
      {/* TOP BAR */}
      {/* -------------------------------------------- */}

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
          CLUB RANKINGS
        </Text>


        <View style={styles.topBarSpacer} />

      </View>


      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        {/* CLUB HEADER */}

        <View style={styles.clubHeader}>

          <ClubBadge
            club={club}
            size={84}
          />

          <Text style={styles.clubName}>
            {club}
          </Text>

          <Text style={styles.clubMeta}>
            {league ? `${league.toUpperCase()}  ·  ` : ''}
            {clubPlayers.length}
            {clubPlayers.length === 1
              ? ' PLAYER RANKED'
              : ' PLAYERS RANKED'}
          </Text>

        </View>


        {clubPlayers.length > 0 && (

          <Text style={styles.hint}>
            TAP A PLAYER TO CHALLENGE FOR A HIGHER RANK
          </Text>

        )}


        {/* PLAYERS, BEST FIRST */}

        {clubPlayers.length === 0 ? (

          <View style={styles.emptyBox}>

            <Text style={styles.emptyText}>
              You haven't ranked anyone at {club} yet.
            </Text>

          </View>

        ) : (

          clubPlayers.map((player, index) => {

            const colour =
              CATEGORY_COLOURS[player.category] ||
              '#00ff66';

            return (

              <TouchableOpacity
                key={player.id}
                style={styles.playerBox}
                onPress={() => openPlayer(player)}
                activeOpacity={0.75}
              >

                {/* RANK */}

                <View
                  style={[
                    styles.rankCircle,
                    { backgroundColor: colour },
                  ]}
                >

                  <Text style={styles.rankNumber}>
                    {index + 1}
                  </Text>

                </View>


                {/* PLAYER */}

                <View style={styles.playerDetails}>

                  <Text
                    style={styles.playerName}
                    numberOfLines={1}
                  >
                    {getFlag(player.nation) || getMarkerText(player)}
                    {'  '}
                    {player.name}
                  </Text>

                  <Text style={styles.info}>
                    {displayPosition(player.specificPosition) ||
                      player.position}
                  </Text>

                  <Text
                    style={[
                      styles.category,
                      { color: colour },
                    ]}
                  >
                    {(player.category || '').toUpperCase()}
                  </Text>

                </View>


                {/* SCORE */}

                <View style={styles.scoreBox}>

                  <Text
                    style={[
                      styles.score,
                      { color: colour },
                    ]}
                  >
                    {typeof player.score === 'number'
                      ? player.score.toFixed(2)
                      : '—'}
                  </Text>

                  <Text style={styles.outOf}>
                    / 10
                  </Text>

                </View>


                <Text style={styles.arrow}>
                  ›
                </Text>

              </TouchableOpacity>

            );
          })

        )}

      </ScrollView>

    </View>

  );
}


// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({

  screen: {
    flex: 1,
    backgroundColor: '#050505',
  },


  // ==================================================
  // TOP BAR
  // ==================================================

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


  // ==================================================
  // SCREEN
  // ==================================================

  container: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  clubHeader: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 22,
  },

  clubName: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '900',
    marginTop: 14,
    textAlign: 'center',
  },

  clubMeta: {
    color: '#777777',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginTop: 6,
  },

  hint: {
    color: '#555555',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textAlign: 'center',
    marginBottom: 14,
  },


  // ==================================================
  // PLAYERS
  // ==================================================

  playerBox: {
    backgroundColor: '#0f0f0f',
    borderRadius: 14,
    minHeight: 78,
    paddingVertical: 12,
    paddingHorizontal: 13,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1b1b1b',
  },

  rankCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  rankNumber: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '900',
  },

  playerDetails: {
    flex: 1,
    minWidth: 0,
  },

  playerName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },

  info: {
    color: '#777777',
    fontSize: 12,
    marginTop: 3,
  },

  category: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginTop: 3,
  },

  scoreBox: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },

  score: {
    fontSize: 20,
    fontWeight: '900',
  },

  outOf: {
    color: '#444444',
    fontSize: 9,
    fontWeight: '700',
  },

  arrow: {
    color: '#333333',
    fontSize: 25,
    fontWeight: '300',
    marginLeft: 8,
  },

  emptyBox: {
    backgroundColor: '#0f0f0f',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1b1b1b',
    padding: 22,
  },

  emptyText: {
    color: '#777777',
    fontSize: 14,
    textAlign: 'center',
  },

});
