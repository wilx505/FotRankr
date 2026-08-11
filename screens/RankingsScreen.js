import { useState } from 'react';

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

  const [showPosition, setShowPosition] =
  useState('All');
  
  const [expandedPosition, setExpandedPosition] =
  useState(null);


const filteredPlayers =
showPosition === 'All'
  ? myRankings
  : showPosition === 'Attack'
    ? myRankings.filter(
        player =>
          player.position?.toLowerCase() ===
          'attack'
      )
    : myRankings.filter(
        player =>
          player.specificPosition
            ?.toLowerCase() ===
          showPosition.toLowerCase()
      );


  const sortedPlayers = [
    ...filteredPlayers,
  ].sort(
    (a, b) =>
      b.rating - a.rating
  );


  const goToPosition = (
    position
  ) => {

    setShowPosition(position);

  };


  return (

    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
    >

      {/* HEADER */}

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
          navigation.navigate('Search')
        }
      >

        <Text
          style={styles.rankMoreButtonText}
        >
          + RANK MORE PLAYERS
        </Text>

      </TouchableOpacity>


      {/* POSITION FILTERS */}

      <View
        style={styles.filterContainer}
      >

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
  onPress={() => {
    setExpandedPosition(
      expandedPosition === 'Attack'
        ? null
        : 'Attack'
    );

    goToPosition('Attack');
  }}
>
  <Text
    style={[
      styles.filterText,
      showPosition === 'Attack' &&
        styles.filterTextActive,
    ]}
  >
    ATTACKERS {expandedPosition === 'Attack' ? '▲' : '▼'}
  </Text>
</TouchableOpacity>

{expandedPosition === 'Attack' && (
  <View style={styles.subFilterContainer}>

    <TouchableOpacity
      style={styles.subFilterButton}
      onPress={() =>
        goToPosition('Attack')
      }
    >
      <Text style={styles.subFilterText}>
        ALL ATTACKERS
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.subFilterButton}
      onPress={() =>
        goToPosition('Striker')
      }
    >
      <Text style={styles.subFilterText}>
        STRIKERS
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.subFilterButton}
      onPress={() =>
        goToPosition('Left Winger')
      }
    >
      <Text style={styles.subFilterText}>
        LEFT WINGERS
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.subFilterButton}
      onPress={() =>
        goToPosition('Right Winger')
      }
    >
      <Text style={styles.subFilterText}>
        RIGHT WINGERS
      </Text>
    </TouchableOpacity>

  </View>
)}


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


      {/* PLAYER LIST */}

      {sortedPlayers.length === 0 ? (

        <View style={styles.emptyBox}>

          <Text style={styles.emptyText}>
            No players ranked yet.
          </Text>

          <Text
            style={styles.emptySubtext}
          >
            Rank a player in this
            position to see them here.
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
                    positionFilter:
                      showPosition,
                  }
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
                  {player.name}
                </Text>

                <Text
                  style={styles.info}
                >
                  {player.nation}
                  {' • '}
                  {player.position}
                </Text>

                <Text
                  style={styles.category}
                >
                  {player.category}
                </Text>

              </View>


              {/* SCORE */}

              <View
                style={styles.scoreBox}
              >

                <Text
                  style={styles.score}
                >
                  {typeof player.score ===
                  'number'
                    ? player.score.toFixed(2)
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
  },

  content: {
    padding: 20,
    paddingBottom: 50,
  },

  title: {
    color: '#00ff66',
    fontSize: 34,
    fontWeight: '900',
    marginTop: 25,
  },

  subtitle: {
    color: '#888888',
    fontSize: 15,
    marginTop: 6,
    marginBottom: 20,
  },

  rankMoreButton: {
    backgroundColor: '#00ff66',
    borderRadius: 12,
    paddingVertical: 15,
    marginBottom: 20,
  },

  rankMoreButtonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  filterContainer: {
  marginBottom: 20,
},
  
subFilterContainer: {
  backgroundColor: '#0d0d0d',
  borderRadius: 10,
  padding: 6,
  marginTop: -4,
  marginBottom: 8,
  borderWidth: 1,
  borderColor: '#1d1d1d',
},

subFilterButton: {
  paddingVertical: 11,
  paddingHorizontal: 14,
},

subFilterText: {
  color: '#aaaaaa',
  fontSize: 12,
  fontWeight: '800',
},

filterButton: {
  backgroundColor: '#111111',
  borderWidth: 1,
  borderColor: '#222222',
  borderRadius: 10,
  paddingVertical: 13,
  paddingHorizontal: 14,
  marginBottom: 8,
},

  filterButtonActive: {
    backgroundColor: '#00ff66',
    borderColor: '#00ff66',
  },

  filterText: {
    color: '#777777',
    fontSize: 11,
    fontWeight: '900',
  },

  filterTextActive: {
    color: '#000000',
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
    fontSize: 18,
    fontWeight: '800',
  },

  info: {
    color: '#777777',
    fontSize: 13,
    marginTop: 5,
  },

  category: {
    color: '#00ff66',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 5,
  },

  scoreBox: {
    alignItems: 'flex-end',
    marginLeft: 10,
  },

  score: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
  },

  outOf: {
    color: '#555555',
    fontSize: 11,
  },

  emptyBox: {
    backgroundColor: '#0d0d0d',
    borderRadius: 14,
    padding: 25,
    alignItems: 'center',
    marginTop: 5,
  },

  emptyText: {
    color: '#00ff66',
    fontSize: 15,
    fontWeight: '800',
  },

  emptySubtext: {
    color: '#666666',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },

});

