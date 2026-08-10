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

  const { player } = route.params;

  const opponents = [...myRankings]
    .filter(
      ranking =>
        ranking.id !== player.id
    )
    .sort(
      (a, b) =>
        b.rating - a.rating
    );

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

  return (

    <ScrollView
      style={styles.container}
    >

      <Text style={styles.title}>
        CHALLENGE
      </Text>

      <Text style={styles.subtitle}>
        Who do you want {player.name}
        {' '}to challenge?
      </Text>

      <View style={styles.selectedBox}>

        <Text style={styles.selectedLabel}>
          YOUR PLAYER
        </Text>

        <Text style={styles.selectedName}>
          {player.name}
        </Text>

        <Text style={styles.selectedScore}>
          {typeof player.score === 'number'
            ? player.score.toFixed(2)
            : '—'}
          {' '} / 10
        </Text>

      </View>

      {opponents.map(
        (opponent) => (

          <TouchableOpacity
            key={opponent.id}
            style={styles.playerBox}
            onPress={() =>
              selectOpponent(
                opponent
              )
            }
          >

            <View
              style={styles.rankCircle}
            >

              <Text
                style={styles.rankNumber}
              >
                {myRankings
                  .sort(
                    (a, b) =>
                      b.rating -
                      a.rating
                  )
                  .findIndex(
                    ranking =>
                      ranking.id ===
                      opponent.id
                  ) + 1}
              </Text>

            </View>

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
                {opponent.position}
              </Text>

              <Text
                style={styles.category}
              >
                {opponent.category}
              </Text>

            </View>

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
    marginTop: 8,
    marginBottom: 25,
    textAlign: 'center',
  },

  selectedBox: {
    backgroundColor: '#00ff66',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },

  selectedLabel: {
    color: '#000000',
    fontSize: 12,
    fontWeight: 'bold',
  },

  selectedName: {
    color: '#000000',
    fontSize: 25,
    fontWeight: 'bold',
    marginTop: 5,
  },

  selectedScore: {
    color: '#000000',
    fontSize: 17,
    marginTop: 5,
  },

  playerBox: {
    backgroundColor: '#111111',
    borderRadius: 15,
    padding: 18,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: 18,
    fontWeight: 'bold',
  },

  playerDetails: {
    flex: 1,
  },

  playerName: {
    color: 'white',
    fontSize: 19,
    fontWeight: 'bold',
  },

  info: {
    color: '#aaaaaa',
    fontSize: 14,
    marginTop: 5,
  },

  category: {
    color: '#00ff66',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 5,
  },

  scoreBox: {
    alignItems: 'flex-end',
    marginLeft: 10,
  },

  score: {
    color: 'white',
    fontSize: 23,
    fontWeight: 'bold',
  },

  outOf: {
    color: '#777777',
    fontSize: 12,
  },

});