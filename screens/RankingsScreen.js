import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function RankingsScreen({ myRankings }) {

  const categories = [
    'Legendary',
    'Elite',
    'Very Good',
    'Good',
    'OK',
    'Bad',
  ];

  return (
    <ScrollView style={styles.container}>

      <Text style={styles.title}>
        MY RANKINGS
      </Text>

      <Text style={styles.subtitle}>
        Your personal footballer rankings
      </Text>

      {myRankings.length === 0 ? (

        <View style={styles.emptyBox}>

          <Text style={styles.emptyText}>
            You haven't ranked anyone yet.
          </Text>

          <Text style={styles.emptySubtext}>
            Go back and start ranking players!
          </Text>

        </View>

      ) : (

        categories.map(category => {

          const categoryPlayers = myRankings
            .filter(player => player.rating === category)
            .sort((a, b) => b.score - a.score);

          if (categoryPlayers.length === 0) {
            return null;
          }

          return (

            <View
              key={category}
              style={styles.categorySection}
            >

              <Text style={styles.categoryTitle}>
                {category}
              </Text>

              {categoryPlayers.map((player, index) => (

                <View
                  key={player.playerId}
                  style={styles.playerBox}
                >

                  <View style={styles.rankCircle}>

                    <Text style={styles.rankNumber}>
                      {index + 1}
                    </Text>

                  </View>

                  <View style={styles.playerDetails}>

                    <Text style={styles.playerName}>
                      {player.name}
                    </Text>

                    <Text style={styles.info}>
                      {player.nation} • {player.position}
                    </Text>

                  </View>

                  <View style={styles.scoreBox}>

                    <Text style={styles.score}>
                      {player.score.toFixed(2)}
                    </Text>

                    <Text style={styles.outOf}>
                      / 10
                    </Text>

                  </View>

                </View>

              ))}

            </View>

          );

        })

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
    marginBottom: 30,
    textAlign: 'center',
  },

  categorySection: {
    marginBottom: 30,
  },

  categoryTitle: {
    color: '#00ff66',
    fontSize: 25,
    fontWeight: 'bold',
    marginBottom: 12,
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

  emptyBox: {
    backgroundColor: '#111111',
    padding: 25,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 20,
  },

  emptyText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  emptySubtext: {
    color: '#888888',
    fontSize: 15,
    marginTop: 10,
    textAlign: 'center',
  },

});




