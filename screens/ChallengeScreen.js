import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ChallengeScreen({
  route,
  navigation,
  myRankings,
}) {

  const {
    player,
  } = route.params || {};

  // --------------------------------------------------
  // BUILD OPPONENT LIST
  // --------------------------------------------------
  // MANUAL CHALLENGE IS COMPLETELY UNRESTRICTED.
  //
  // A player can challenge ANY ranked player.
  //
  // No restrictions based on:
  // - Category
  // - Position
  // - Specific position
  // - H2H history
  // - Automatic H2H limit
  // --------------------------------------------------

  const opponents = [...(myRankings || [])]
    .filter(
      ranking =>
        String(ranking.id) !==
        String(player?.id)
    )
    .sort(
      (a, b) =>
        b.rating - a.rating
    );

  // --------------------------------------------------
  // SELECT OPPONENT
  // --------------------------------------------------

  const selectOpponent = (
    opponent
  ) => {

    navigation.navigate(
      'HeadToHead',
      {
        player,
        comparisonPlayer:
          opponent,
        category:
          player.category,
        manualChallenge: true,
      }
    );
  };

  // --------------------------------------------------
  // RANK ANOTHER PLAYER
  // --------------------------------------------------

  const rankAnotherPlayer = () => {

    navigation.navigate(
      'Search'
    );
  };

  // --------------------------------------------------
  // SCREEN
  // --------------------------------------------------

  return (

    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >

      <Text style={styles.title}>
        CHALLENGE
      </Text>

      <Text style={styles.subtitle}>
        Who do you want {player?.name}
        {' '}to challenge?
      </Text>

      {/* ALL PLAYERS */}

      <Text style={styles.positionLabel}>
        ALL RANKED PLAYERS
      </Text>

      {/* SELECTED PLAYER */}

      <View style={styles.selectedBox}>

        <Text style={styles.selectedLabel}>
          YOUR PLAYER
        </Text>

        <Text style={styles.selectedName}>
          {player?.name}
        </Text>

        <Text style={styles.selectedScore}>
          {typeof player?.score === 'number'
            ? player.score.toFixed(2)
            : '—'}
          {' '} / 10
        </Text>

      </View>

      {/* OPPONENTS */}

      {opponents.length === 0 ? (

        <View style={styles.emptyBox}>

          <Text style={styles.emptyTitle}>
            NO RANKED PLAYERS
          </Text>

          <Text style={styles.emptyText}>
            You need to rank another player
            before {player?.name} can challenge them.
          </Text>

          <TouchableOpacity
            style={styles.rankButton}
            onPress={
              rankAnotherPlayer
            }
          >

            <Text style={styles.rankButtonText}>
              + RANK ANOTHER PLAYER
            </Text>

          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() =>
              navigation.goBack()
            }
          >

            <Text style={styles.backButtonText}>
              GO BACK
            </Text>

          </TouchableOpacity>

        </View>

      ) : (

        opponents.map(
          (opponent, index) => (

            <TouchableOpacity
              key={opponent.id}
              style={styles.playerBox}
              onPress={() =>
                selectOpponent(
                  opponent
                )
              }
              activeOpacity={0.75}
            >

              {/* RANK */}

              <View
                style={styles.rankCircle}
              >

                <Text
                  style={styles.rankNumber}
                >
                  {index + 1}
                </Text>

              </View>

              {/* PLAYER */}

              <View
                style={styles.playerDetails}
              >

                <Text
                  style={styles.playerName}
                >
                  {opponent.name}
                </Text>

                <Text
                  style={styles.info}
                >
                  {opponent.nation}
                  {' '}•{' '}
                  {opponent.specificPosition ||
                    opponent.position}
                </Text>

                <Text
                  style={styles.category}
                >
                  {opponent.category}
                </Text>

              </View>

              {/* SCORE */}

              <View
                style={styles.scoreBox}
              >

                <Text
                  style={styles.score}
                >
                  {typeof opponent.score ===
                  'number'
                    ? opponent.score.toFixed(2)
                    : '—'}
                </Text>

                <Text
                  style={styles.outOf}
                >
                  / 10
                </Text>

              </View>

            </TouchableOpacity>

          )
        )

      )}

    </ScrollView>

  );

}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#050505',
    padding: 20,
  },

  content: {
    paddingBottom: 40,
  },

  title: {
    color: '#00ff66',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 30,
  },

  subtitle: {
    color: '#aaaaaa',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },

  positionLabel: {
    color: '#00ff66',
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 1,
  },

  selectedBox: {
    backgroundColor: '#111111',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#1d1d1d',
  },

  selectedLabel: {
    color: '#777777',
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 8,
  },

  selectedName: {
    color: '#00ff66',
    fontSize: 25,
    fontWeight: '900',
  },

  selectedScore: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 8,
  },

  playerBox: {
    backgroundColor: '#111111',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1d1d1d',
  },

  rankCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#00ff66',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  rankNumber: {
    color: '#000000',
    fontSize: 17,
    fontWeight: '900',
  },

  playerDetails: {
    flex: 1,
  },

  playerName: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },

  info: {
    color: '#777777',
    fontSize: 12,
    marginTop: 4,
  },

  category: {
    color: '#00ff66',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 5,
  },

  scoreBox: {
    alignItems: 'flex-end',
    marginLeft: 10,
  },

  score: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
  },

  outOf: {
    color: '#666666',
    fontSize: 11,
  },

  emptyBox: {
    backgroundColor: '#111111',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1d1d1d',
  },

  emptyTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },

  emptyText: {
    color: '#777777',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
  },

  rankButton: {
    backgroundColor: '#00ff66',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: '100%',
  },

  rankButtonText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
  },

  backButton: {
    backgroundColor: '#1d1d1d',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: '100%',
    marginTop: 10,
  },

  backButtonText: {
    color: '#aaaaaa',
    fontSize: 13,
    fontWeight: '900',
  },

});