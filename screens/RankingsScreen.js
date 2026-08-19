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
  // CATEGORY COLOURS
  // ==================================================

  const categoryColours = {
    Legendary: '#9B59B6',
    Elite: '#00ff66',
    'Very Good': '#4DA6FF',
    Good:  '#FFD700',
    OK: '#F39C12',
    Bad: '#E74C3C',
  };


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

    const categoryColour =
      categoryColours[category] ||
      '#00ff66';


    return (

      <View
        key={category}
        style={styles.categorySection}
      >

        {/* CATEGORY HEADER */}

        <View
          style={styles.categoryHeader}
        >

          <View
            style={styles.categoryHeaderLeft}
          >

            <View
              style={[
                styles.categoryIndicator,
                {
                  backgroundColor:
                    categoryColour,
                },
              ]}
            />

            <Text
              style={[
                styles.categoryTitle,
                {
                  color:
                    categoryColour,
                },
              ]}
            >
              {category.toUpperCase()}
            </Text>

          </View>

          <View
            style={styles.categoryCountBox}
          >

            <Text
              style={styles.categoryCount}
            >
              {players.length}
            </Text>

            <Text
              style={styles.categoryCountLabel}
            >
              {players.length === 1
                ? 'PLAYER'
                : 'PLAYERS'}
            </Text>

          </View>

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

              {/* RANK */}

              <View
                style={[
                  styles.rankCircle,
                  {
                    backgroundColor:
                      categoryColour,
                  },
                ]}
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
                  numberOfLines={1}
                >
                  {player.name}
                </Text>


                <View
                  style={styles.playerMeta}
                >

                  <Text
                    style={styles.info}
                  >
                    {player.nation}
                  </Text>

                  <Text
                    style={styles.dot}
                  >
                    •
                  </Text>

                  <Text
                    style={styles.info}
                  >
                    {player.position}
                  </Text>

                </View>


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
                  style={[
                    styles.score,
                    {
                      color:
                        categoryColour,
                    },
                  ]}
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


              {/* ARROW */}

              <Text
                style={styles.arrow}
              >
                ›
              </Text>

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
      showsVerticalScrollIndicator={false}
    >

      {/* HEADER */}

      <View
        style={styles.header}
      >

        <View>

          <Text
            style={styles.title}
          >
            MY RANKINGS
          </Text>

          <Text
            style={styles.subtitle}
          >
            Your personal footballer rankings
          </Text>

        </View>

      </View>


      {/* RANK MORE PLAYERS */}

      <TouchableOpacity
        style={styles.rankMoreButton}
        onPress={() =>
          navigation.navigate(
            'MainTabs',
            {
              screen: 'Search',
            }
          )
        }
        activeOpacity={0.8}
      >

        <View
          style={styles.rankMoreIcon}
        >
          <Text
            style={styles.rankMoreIconText}
          >
            +
          </Text>
        </View>

        <View
          style={styles.rankMoreDetails}
        >

          <Text
            style={styles.rankMoreButtonText}
          >
            RANK MORE PLAYERS
          </Text>

          <Text
            style={styles.rankMoreSubtext}
          >
            Add another footballer to your rankings
          </Text>

        </View>

        <Text
          style={styles.rankMoreArrow}
        >
          ›
        </Text>

      </TouchableOpacity>


      {/* POSITION FILTERS */}

      <View
        style={styles.filterSection}
      >

        <Text
          style={styles.filterHeading}
        >
          FILTER BY POSITION
        </Text>


        {/* ALL */}

        <TouchableOpacity
          style={[
            styles.filterButton,
            showPosition === 'All' &&
              styles.filterButtonActive,
          ]}
          onPress={() => {
            setExpandedPosition(null);
            goToPosition('All');
          }}
          activeOpacity={0.8}
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
          activeOpacity={0.8}
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

          <Text
            style={[
              styles.filterArrow,
              showPosition === 'Attack' &&
                styles.filterArrowActive,
            ]}
          >
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
          activeOpacity={0.8}
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

          <Text
            style={[
              styles.filterArrow,
              showPosition === 'Midfielder' &&
                styles.filterArrowActive,
            ]}
          >
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
          activeOpacity={0.8}
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

          <Text
            style={[
              styles.filterArrow,
              showPosition === 'Defender' &&
                styles.filterArrowActive,
            ]}
          >
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
          activeOpacity={0.8}
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


      {/* RESULTS SUMMARY */}

      {filteredPlayers.length > 0 && (

        <View
          style={styles.resultsSummary}
        >

          <Text
            style={styles.resultsSummaryText}
          >
            {filteredPlayers.length}
            {' '}
            {filteredPlayers.length === 1
              ? 'PLAYER'
              : 'PLAYERS'}
            {' RANKED'}
          </Text>

          <View
            style={styles.summaryLine}
          />

        </View>

      )}

      {filteredPlayers.length > 0 && (
  <Text style={styles.challengeHint}>
    TAP A PLAYER TO COMPETE IN A CHALLENGE
  </Text>
)}


      {/* PLAYER LIST */}

      {filteredPlayers.length === 0 ? (

        <View
          style={styles.emptyBox}
        >

          <View
            style={styles.emptyIcon}
          >
            <Text
              style={styles.emptyIconText}
            >
              +
            </Text>
          </View>

          <Text
            style={styles.emptyTitle}
          >
            NO PLAYERS RANKED
          </Text>

          <Text
            style={styles.emptyText}
          >
            Rank a player in this position
            to start building your list.
          </Text>

          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() =>
              navigation.navigate(
                'MainTabs',
                {
                  screen: 'Search',
                }
              )
            }
            activeOpacity={0.8}
          >

            <Text
              style={styles.emptyButtonText}
            >
              FIND A PLAYER
            </Text>

          </TouchableOpacity>

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
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 60,
  },


  // ==================================================
  // HEADER
  // ==================================================

  header: {
    marginBottom: 25,
  },

  eyebrow: {
    color: '#00ff66',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2.5,
    marginBottom: 6,
  },

  title: {
    color: '#ffffff',
    fontSize: 36,
    lineHeight: 39,
    fontWeight: '900',
    letterSpacing: -1.2,
  },

  subtitle: {
    color: '#777777',
    fontSize: 14,
    marginTop: 7,
  },


  // ==================================================
  // RANK MORE
  // ==================================================

  rankMoreButton: {
    backgroundColor: '#00ff66',
    borderRadius: 14,
    minHeight: 70,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },

  rankMoreIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  rankMoreIconText: {
    color: '#00ff66',
    fontSize: 25,
    fontWeight: '500',
    lineHeight: 28,
  },

  rankMoreDetails: {
    flex: 1,
  },

  rankMoreButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  rankMoreSubtext: {
    color: '#174d2d',
    fontSize: 11,
    marginTop: 3,
  },

  rankMoreArrow: {
    color: '#000000',
    fontSize: 28,
    fontWeight: '300',
    marginLeft: 8,
  },


  // ==================================================
  // FILTERS
  // ==================================================

  filterSection: {
    marginBottom: 25,
  },

  filterHeading: {
    color: '#555555',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 10,
    paddingLeft: 2,
  },

  filterButton: {
    backgroundColor: '#0e0e0e',
    borderWidth: 1,
    borderColor: '#1d1d1d',
    borderRadius: 11,
    minHeight: 46,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 7,
  },

  filterButtonActive: {
    backgroundColor: '#00ff66',
    borderColor: '#00ff66',
  },

  filterText: {
    color: '#777777',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  filterTextActive: {
    color: '#000000',
  },

  filterArrow: {
    color: '#555555',
    fontSize: 10,
    fontWeight: '900',
  },

  filterArrowActive: {
    color: '#000000',
  },

  subFilterContainer: {
    backgroundColor: '#0a0a0a',
    borderRadius: 11,
    paddingVertical: 5,
    marginTop: -3,
    marginBottom: 7,
    borderWidth: 1,
    borderColor: '#181818',
  },

  subFilterButton: {
    paddingVertical: 11,
    paddingHorizontal: 15,
  },

  subFilterText: {
    color: '#999999',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },


  // ==================================================
  // SUMMARY
  // ==================================================

  resultsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },

  resultsSummaryText: {
    color: '#555555',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.3,
    marginRight: 10,
  },

  summaryLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#181818',
  },


  // ==================================================
  // CATEGORY
  // ==================================================

  categorySection: {
    marginBottom: 26,
  },

  categoryHeader: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 9,
    paddingHorizontal: 3,
  },

  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  categoryIndicator: {
    width: 4,
    height: 19,
    borderRadius: 2,
    marginRight: 9,
  },

  categoryTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  categoryCountBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },

  categoryCount: {
    color: '#777777',
    fontSize: 13,
    fontWeight: '900',
  },

  categoryCountLabel: {
    color: '#444444',
    fontSize: 9,
    fontWeight: '800',
    marginLeft: 4,
  },


  // ==================================================
  // PLAYER
  // ==================================================

  playerBox: {
    backgroundColor: '#0f0f0f',
    borderRadius: 14,
    minHeight: 78,
    paddingVertical: 13,
    paddingHorizontal: 13,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1b1b1b',
  },

  rankCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  rankNumber: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '900',
  },

  playerDetails: {
    flex: 1,
    minWidth: 0,
  },

  playerName: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },

  playerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },

  info: {
    color: '#777777',
    fontSize: 12,
  },

  dot: {
    color: '#444444',
    fontSize: 10,
    marginHorizontal: 6,
  },

  specificPosition: {
    color: '#555555',
    fontSize: 10,
    marginTop: 3,
  },

  scoreBox: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },

  score: {
    fontSize: 21,
    fontWeight: '900',
  },

  outOf: {
    color: '#444444',
    fontSize: 9,
    fontWeight: '700',
    marginTop: -1,
  },

  arrow: {
    color: '#333333',
    fontSize: 25,
    fontWeight: '300',
    marginLeft: 8,
  },


  // ==================================================
  // EMPTY
  // ==================================================

  emptyBox: {
    backgroundColor: '#0d0d0d',
    borderRadius: 15,
    paddingVertical: 30,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#181818',
  },

  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#242424',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },

  emptyIconText: {
    color: '#00ff66',
    fontSize: 27,
    fontWeight: '400',
  },

  emptyTitle: {
    color: '#00ff66',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.3,
  },

  emptyText: {
    color: '#666666',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 18,
  },

  emptyButton: {
    backgroundColor: '#00ff66',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 25,
  },

  challengeHint: {
  color: '#555555',
  fontSize: 10,
  fontWeight: '800',
  letterSpacing: 1.2,
  textAlign: 'center',
  marginBottom: 14,
},

  emptyButtonText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

});

