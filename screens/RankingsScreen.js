
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function RankingsScreen({
  navigation,
  myRankings,
}) {

  const showPosition =
    navigation
      .getState()
      ?.routes
      ?.find(
        route =>
          route.name === 'Rankings'
      )
      ?.params
      ?.position || 'All';

  const filteredPlayers =
    showPosition === 'All'
      ? myRankings
      : myRankings.filter(
          player =>
            player.position?.toLowerCase() ===
            showPosition.toLowerCase()
        );

  const sortedPlayers = [
    ...filteredPlayers,
  ].sort(
    (a, b) => b.rating - a.rating
  );

  const goToPosition = (position) => {

    navigation.setParams({
      position,
    });

  };

  return (

    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >

      <Text style={styles.title}>
        MY RANKINGS
      </Text>

      <Text style={styles.subtitle}>
        Your personal footballer rankings
      </Text>

      {/* RANK MORE PLAYERS */}

      <TouchableOpacity
        style={styles.rankMoreButton}
        onPress={() =>
          navigation.navigate('Home')
        }
      >

        <Text style={styles.rankMoreButtonText}>
          + RANK MORE PLAYERS
        </Text>

      </TouchableOpacity>

      {/* POSITION FILTERS */}

      <View style={styles.filterContainer}>

        <TouchableOpacity
          style={[
            styles.filterButton,
            showPosition === 'All' &&
              styles.filterButtonActive,
          ]}
          onPress={() =>
            goToPosition('All')
          }
        >
          <Text
            style={[
              styles.filterText,
              showPosition === 'All' &&
                styles.filterTextActive,
            ]}
          >
            ALL PLAYERS
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            showPosition === 'Attack' &&
              styles.filterButtonActive,
          ]}
          onPress={() =>
            goToPosition('Attack')
          }
        >
          <Text
            style={[
              styles.filterText,
              showPosition === 'Attack' &&
                styles.filterTextActive,
            ]}
          >
            ATTACKERS
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            showPosition === 'Midfielder' &&
              styles.filterButtonActive,
          ]}
          onPress={() =>
            goToPosition('Midfielder')
          }
        >
          <Text
            style={[
              styles.filterText,
              showPosition === 'Midfielder' &&
                styles.filterTextActive,
            ]}
          >
            MIDFIELDERS
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            showPosition === 'Defender' &&
              styles.filterButtonActive,
          ]}
          onPress={() =>
            goToPosition('Defender')
          }
        >
          <Text
            style={[
              styles.filterText,
              showPosition === 'Defender' &&
                styles.filterTextActive,
            ]}
          >
            DEFENDERS
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            showPosition === 'Goalkeeper' &&
              styles.filterButtonActive,
          ]}
          onPress={() =>
            goToPosition('Goalkeeper')
          }
        >
          <Text
            style={[
              styles.filterText,
              showPosition === 'Goalkeeper' &&
                styles.filterTextActive,
            ]}
          >
            GOALKEEPERS
          </Text>
        </TouchableOpacity>

      </View>

      {/* PLAYERS */}

      {sortedPlayers.length === 0 ? (

        <View style={styles.emptyBox}>

          <Text style={styles.emptyText}>
            No players ranked yet.
          </Text>

          <Text style={styles.emptySubtext}>
            Rank a player in this position to see them here.
          </Text>

        </View>

      ) : (

        sortedPlayers.map(
          (player, index) => (

            <TouchableOpacity
              key={player.id}
              style={styles.playerBox}
              onPress={() =>
                navigation.navigate(
                  'Challenge',
                  {
                  player,
                  positionFilter: showPosition,
                  }
                )
              }
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

                <Text style={styles.category}>
                  {player.category}
                </Text>

              </View>

              <View style={styles.scoreBox}>

                <Text style={styles.score}>
                  {typeof player.score === 'number'
                    ? player.score.toFixed(2)
                    : '—'}
                </Text>

                <Text style={styles.outOf}>
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
    marginTop: 8,
    marginBottom: 20,
  },

  rankMoreButton: {
    backgroundColor: '#00ff66',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 20,
  },

  rankMoreButtonText: {
    color: '#000000',
    fontSize: 17,
    fontWeight: 'bold',
  },

  filterContainer: {
    marginBottom: 20,
  },

  filterButton: {
    backgroundColor: '#111111',
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 15,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#222222',
  },

  filterButtonActive: {
    backgroundColor: '#00ff66',
    borderColor: '#00ff66',
  },

  filterText: {
    color: '#aaaaaa',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  filterTextActive: {
    color: '#000000',
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

  emptyBox: {
    backgroundColor: '#111111',
    padding: 25,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 10,
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

