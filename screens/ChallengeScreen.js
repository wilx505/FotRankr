import { displayPosition } from '../utils/positions';

import { useState } from 'react';

import { isUnknown } from '../utils/progression';

import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';


// Lowercase + strip accents, so "mbappe" finds "Mbappé".
const simplify = (text) =>
  String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

// Category colours, as in My Ranks and lists.
const CATEGORY_COLOURS = {
  Legendary: '#9B59B6',
  Elite: '#00ff66',
  'Very Good': '#4DA6FF',
  Good: '#FFD700',
  OK: '#F39C12',
  Bad: '#E74C3C',
};


export default function ChallengeScreen({
  route,
  navigation,
  myRankings,
}) {

  const {
    player,
    opponentIds,
    opponentLabel,
  } = route.params || {};

  const [search, setSearch] =
    useState('');


  // --------------------------------------------------
  // BACK
  // --------------------------------------------------

  const goBack = () => {
    navigation.goBack();
  };


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
  //
  // The only optional limit: when opened from a list,
  // opponentIds restricts it to that list's players.
  // --------------------------------------------------

  const opponents = [...(myRankings || [])]
    .filter(
      ranking =>
        String(ranking.id) !==
          String(player?.id) &&
        !isUnknown(ranking)
    )
    .filter(
      ranking =>
        !opponentIds ||
        opponentIds.includes(
          String(ranking.id)
        )
    )
    .sort(
      (a, b) =>
        b.rating - a.rating
    );


  // --------------------------------------------------
  // SEARCH
  // --------------------------------------------------
  // Each opponent keeps their rank from the full list,
  // so searching doesn't renumber them.
  // --------------------------------------------------

  const searchText = simplify(search);

  const searchResults = opponents
    .map((opponent, index) => ({
      opponent,
      rank: index + 1,
    }))
    .filter(
      ({ opponent }) =>
        simplify(opponent.name).includes(
          searchText
        )
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

    <View style={styles.screen}>

      {/* -------------------------------------------- */}
      {/* TOP BAR */}
      {/* -------------------------------------------- */}

      <View style={styles.topBar}>

        <TouchableOpacity
          style={styles.backButton}
          onPress={goBack}
          activeOpacity={0.7}
        >

          <Text style={styles.backArrow}>
            ‹
          </Text>

        </TouchableOpacity>


        <Text style={styles.topBarTitle}>
          CHALLENGE
        </Text>


        <View style={styles.topBarSpacer} />

      </View>


      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ALL PLAYERS / LIST PLAYERS */}

        <Text style={styles.positionLabel}>
          {opponentIds
            ? opponentLabel || 'PLAYERS IN THIS LIST'
            : 'ALL RANKED PLAYERS'}
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


        {/* SEARCH */}

        {opponents.length > 0 && (

          <View style={styles.searchContainer}>

            <Text style={styles.searchIcon}>
              ⌕
            </Text>

            <TextInput
              style={styles.search}
              placeholder={`Who is ${player?.name} challenging?`}
              placeholderTextColor="#555555"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="search"
            />

            {search.length > 0 && (

              <TouchableOpacity
                style={styles.clearButton}
                onPress={() =>
                  setSearch('')
                }
                activeOpacity={0.7}
              >

                <Text style={styles.clearText}>
                  ×
                </Text>

              </TouchableOpacity>

            )}

          </View>

        )}


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
              activeOpacity={0.8}
            >

              <Text style={styles.rankButtonText}>
                + RANK ANOTHER PLAYER
              </Text>

            </TouchableOpacity>

          </View>

        ) : searchResults.length === 0 ? (

          <View style={styles.emptyBox}>

            <Text style={styles.emptyTitle}>
              NO MATCHES
            </Text>

            <Text style={styles.noMatchText}>
              None of your ranked players match
              {' '}"{search.trim()}".
            </Text>

          </View>

        ) : (

          searchResults.map(
            ({ opponent, rank }) => (

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
                  style={[
                    styles.rankCircle,
                    {
                      backgroundColor:
                        CATEGORY_COLOURS[opponent.category] ||
                        '#00ff66',
                    },
                  ]}
                >

                  <Text
                    style={styles.rankNumber}
                  >
                    {rank}
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
                    {displayPosition(opponent.specificPosition) ||
                      opponent.position}
                  </Text>

                  <Text
                    style={[
                      styles.category,
                      {
                        color:
                          CATEGORY_COLOURS[opponent.category] ||
                        '#00ff66',
                      },
                    ]}
                  >
                    {opponent.category}
                  </Text>

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
                          CATEGORY_COLOURS[opponent.category] ||
                        '#00ff66',
                      },
                    ]}
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


                {/* ARROW */}

                <Text style={styles.playerArrow}>
                  ›
                </Text>

              </TouchableOpacity>

            )
          )

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


  positionLabel: {
    color: '#00ff66',
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 15,
    letterSpacing: 1.4,
  },


  // ==================================================
  // SELECTED PLAYER
  // ==================================================

  selectedBox: {
    backgroundColor: '#0f0f0f',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#1d1d1d',
  },

  selectedLabel: {
    color: '#555555',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 8,
  },

  selectedName: {
    color: '#00ff66',
    fontSize: 25,
    fontWeight: '900',
  },

  selectedScore: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 8,
  },


  // ==================================================
  // SEARCH
  // ==================================================

  searchContainer: {
    height: 56,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#242424',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 20,
  },

  searchIcon: {
    color: '#00ff66',
    fontSize: 26,
    fontWeight: '300',
    marginRight: 10,
    marginTop: -3,
  },

  search: {
    flex: 1,
    height: '100%',
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#222222',
    justifyContent: 'center',
    alignItems: 'center',
  },

  clearText: {
    color: '#888888',
    fontSize: 21,
    lineHeight: 22,
    marginTop: -2,
  },


  // ==================================================
  // PLAYERS
  // ==================================================

  playerBox: {
    backgroundColor: '#0f0f0f',
    borderRadius: 14,
    padding: 14,
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
    backgroundColor: '#00ff66',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
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

  info: {
    color: '#777777',
    fontSize: 12,
    marginTop: 4,
  },

  category: {
    color: '#00ff66',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 5,
  },

  scoreBox: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },

  score: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
  },

  outOf: {
    color: '#555555',
    fontSize: 10,
  },

  playerArrow: {
    color: '#333333',
    fontSize: 25,
    fontWeight: '300',
    marginLeft: 8,
  },


  // ==================================================
  // EMPTY
  // ==================================================

  emptyBox: {
    backgroundColor: '#0f0f0f',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1d1d1d',
  },

  emptyTitle: {
    color: '#ffffff',
    fontSize: 17,
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

  noMatchText: {
    color: '#777777',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 12,
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

});