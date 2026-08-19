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


  // ==================================================
  // POSITION FILTER
  // ==================================================

  const filteredPlayers =
    showPosition === 'All'
      ? myRankings
      : showPosition === 'Attack' ||
        showPosition === 'Midfielder' ||
        showPosition === 'Defender' ||
        showPosition === 'Goalkeeper'

        ? myRankings.filter(
            player =>
              player.position?.toLowerCase() ===
              showPosition.toLowerCase()
          )

        : myRankings.filter(
            player =>
              player.specificPosition
                ?.toLowerCase() ===
              showPosition.toLowerCase()
          );


  // ==================================================
  // CATEGORY ORDER
  // ==================================================

  const categoryOrder = [
    'Legendary',
    'Elite',
    'Very Good',
    'Good',
    'OK',
    'Bad',
  ];


  // ==================================================
  // GROUP PLAYERS BY CATEGORY
  // ==================================================

  const playersByCategory = {};

  categoryOrder.forEach(
    category => {
      playersByCategory[category] =
        filteredPlayers
          .filter(
            player =>
              player.category === category
          )
          .sort(
            (a, b) =>
              b.rating - a.rating
          );
    }
  );


  // ==================================================
  // POSITION NAVIGATION
  // ==================================================

  const goToPosition = (
    position
  ) => {

    setShowPosition(position);

  };


  // ==================================================
  // CATEGORY SECTION
  // ==================================================

  const renderCategory = (
    category
  ) => {

    const players =
      playersByCategory[category] || [];

    if (players.length === 0) {
      return null;
    }


    return (

      <View
        key={category}
        style={styles.categorySection}
      >

        {/* CATEGORY HEADER */}

        <View
          style={styles.categoryHeader}
        >

          <Text
            style={styles.categoryTitle}
          >
            {category.toUpperCase()}
          </Text>

          <Text
            style={styles.categoryCount}
          >
            {players.length}
            {' '}
            {players.length === 1
              ? 'PLAYER'
              : 'PLAYERS'}
          </Text>

        </View>


        {/* PLAYERS */}

        {players.map(
          (player, index) => (

            <TouchableOpacity
              key={player.id}
              style={styles.playerBox}
              onPress={() =>
                navigation.navigate(
                  'Challenge',
                  {
                    player,

                   
                  }
                )
              }
              activeOpacity={0.75}
            >

              {/* CATEGORY RANK */}

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


                {player.specificPosition && (

                  <Text
                    style={styles.specificPosition}
                  >
                    {player.specificPosition}
                  </Text>

                )}

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
        )}

      </View>

    );

  };


  // ==================================================
  // SCREEN
  // ==================================================

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
  navigation.navigate('MainTabs', {
    screen: 'Search',
  })
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

        {/* ALL */}

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


        {/* ATTACK */}

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
            ATTACKERS
            {' '}
            {expandedPosition === 'Attack'
              ? '▲'
              : '▼'}
          </Text>

        </TouchableOpacity>


        {expandedPosition === 'Attack' && (

          <View
            style={styles.subFilterContainer}
          >

            <TouchableOpacity
              style={styles.subFilterButton}
              onPress={() =>
                goToPosition('Attack')
              }
            >

              <Text
                style={styles.subFilterText}
              >
                ALL ATTACKERS
              </Text>

            </TouchableOpacity>


            <TouchableOpacity
              style={styles.subFilterButton}
              onPress={() =>
                goToPosition('Striker')
              }
            >

              <Text
                style={styles.subFilterText}
              >
                STRIKERS
              </Text>

            </TouchableOpacity>


            <TouchableOpacity
              style={styles.subFilterButton}
              onPress={() =>
                goToPosition('Left Winger')
              }
            >

              <Text
                style={styles.subFilterText}
              >
                LEFT WINGERS
              </Text>

            </TouchableOpacity>


            <TouchableOpacity
              style={styles.subFilterButton}
              onPress={() =>
                goToPosition('Right Winger')
              }
            >

              <Text
                style={styles.subFilterText}
              >
                RIGHT WINGERS
              </Text>

            </TouchableOpacity>

          </View>

        )}


        {/* MIDFIELD */}

        <TouchableOpacity
          style={[
            styles.filterButton,
            showPosition === 'Midfielder' &&
              styles.filterButtonActive,
          ]}
          onPress={() => {

            setExpandedPosition(
              expandedPosition === 'Midfielder'
                ? null
                : 'Midfielder'
            );

            goToPosition('Midfielder');

          }}
        >

          <Text
            style={[
              styles.filterText,
              showPosition === 'Midfielder' &&
                styles.filterTextActive,
            ]}
          >
            MIDFIELDERS
            {' '}
            {expandedPosition === 'Midfielder'
              ? '▲'
              : '▼'}
          </Text>

        </TouchableOpacity>


        {expandedPosition === 'Midfielder' && (

          <View
            style={styles.subFilterContainer}
          >

            <TouchableOpacity
              style={styles.subFilterButton}
              onPress={() =>
                goToPosition('Midfielder')
              }
            >

              <Text
                style={styles.subFilterText}
              >
                ALL MIDFIELDERS
              </Text>

            </TouchableOpacity>


            <TouchableOpacity
              style={styles.subFilterButton}
              onPress={() =>
                goToPosition(
                  'Defensive Midfielder'
                )
              }
            >

              <Text
                style={styles.subFilterText}
              >
                DEFENSIVE MIDFIELDERS
              </Text>

            </TouchableOpacity>


            <TouchableOpacity
              style={styles.subFilterButton}
              onPress={() =>
                goToPosition(
                  'Central Midfielder'
                )
              }
            >

              <Text
                style={styles.subFilterText}
              >
                CENTRAL MIDFIELDERS
              </Text>

            </TouchableOpacity>


            <TouchableOpacity
              style={styles.subFilterButton}
              onPress={() =>
                goToPosition(
                  'Attacking Midfielder'
                )
              }
            >

              <Text
                style={styles.subFilterText}
              >
                ATTACKING MIDFIELDERS
              </Text>

            </TouchableOpacity>

          </View>

        )}


        {/* DEFENDERS */}

        <TouchableOpacity
          style={[
            styles.filterButton,
            showPosition === 'Defender' &&
              styles.filterButtonActive,
          ]}
          onPress={() => {

            setExpandedPosition(
              expandedPosition === 'Defender'
                ? null
                : 'Defender'
            );

            goToPosition('Defender');

          }}
        >

          <Text
            style={[
              styles.filterText,
              showPosition === 'Defender' &&
                styles.filterTextActive,
            ]}
          >
            DEFENDERS
            {' '}
            {expandedPosition === 'Defender'
              ? '▲'
              : '▼'}
          </Text>

        </TouchableOpacity>


        {expandedPosition === 'Defender' && (

          <View
            style={styles.subFilterContainer}
          >

            <TouchableOpacity
              style={styles.subFilterButton}
              onPress={() =>
                goToPosition('Defender')
              }
            >

              <Text
                style={styles.subFilterText}
              >
                ALL DEFENDERS
              </Text>

            </TouchableOpacity>


            <TouchableOpacity
              style={styles.subFilterButton}
              onPress={() =>
                goToPosition('Centre-Back')
              }
            >

              <Text
                style={styles.subFilterText}
              >
                CENTRE-BACKS
              </Text>

            </TouchableOpacity>


            <TouchableOpacity
              style={styles.subFilterButton}
              onPress={() =>
                goToPosition('Right-Back')
              }
            >

              <Text
                style={styles.subFilterText}
              >
                RIGHT-BACKS
              </Text>

            </TouchableOpacity>


            <TouchableOpacity
              style={styles.subFilterButton}
              onPress={() =>
                goToPosition('Left-Back')
              }
            >

              <Text
                style={styles.subFilterText}
              >
                LEFT-BACKS
              </Text>

            </TouchableOpacity>

          </View>

        )}


        {/* GOALKEEPERS */}

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

      {filteredPlayers.length === 0 ? (

        <View
          style={styles.emptyBox}
        >

          <Text
            style={styles.emptyText}
          >
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

        categoryOrder.map(
          category =>
            renderCategory(category)
        )

      )}

    </ScrollView>

  );

}


// ======================================================
// STYLES
// ======================================================

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

  // ==================================================
  // CATEGORY
  // ==================================================

  categorySection: {
    marginBottom: 25,
  },

  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },

  categoryTitle: {
    color: '#00ff66',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 1,
  },

  categoryCount: {
    color: '#555555',
    fontSize: 11,
    fontWeight: '800',
  },

  // ==================================================
  // PLAYER
  // ==================================================

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

  specificPosition: {
    color: '#555555',
    fontSize: 11,
    marginTop: 3,
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

  // ==================================================
  // EMPTY
  // ==================================================

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