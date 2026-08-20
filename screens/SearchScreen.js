import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useState } from 'react';

import players from '../players';

export default function SearchScreen({
  navigation,
}) {

  const [search, setSearch] =
    useState('');

  const filteredPlayers =
    search.trim().length === 0
      ? []
      : players.filter(
          player =>
            player.name
              .toLowerCase()
              .includes(
                search
                  .toLowerCase()
                  .trim()
              )
        );

  const selectPlayer = (
  player
) => {

  navigation.navigate(
    'Compare',
    {
      player,
    }
  );

};

  const getPositionLabel = (
    player
  ) => {

    if (
      player.specificPosition
    ) {
      return `${player.specificPosition} • ${player.position}`;
    }

    return player.position || 'Footballer';
  };

  return (

    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >

      {/* =================================================
          HEADER
          ================================================= */}

      <View style={styles.header}>

        <View style={styles.brandRow}>

          <Text style={styles.brand}>
            FotRankr
          </Text>

        </View>

        <View
          style={styles.brandLine}
        />

      </View>


      {/* =================================================
          TITLE
          ================================================= */}

      <Text style={styles.title}>
        Find a player.
      </Text>

      <Text style={styles.subtitle}>
        Search any footballer to
        {' '}
        start ranking them.
      </Text>


      {/* =================================================
          SEARCH
          ================================================= */}

      <View
        style={styles.searchContainer}
      >

        <Text
          style={styles.searchIcon}
        >
          ⌕
        </Text>

        <TextInput
          style={styles.search}
          placeholder="Search player..."
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

            <Text
              style={styles.clearText}
            >
              ×
            </Text>

          </TouchableOpacity>

        )}

      </View>


      {/* =================================================
          EMPTY SEARCH
          ================================================= */}

      {search.trim().length === 0 ? (

        <View style={styles.emptyState}>

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
            FIND YOUR NEXT PLAYER
          </Text>

          <Text
            style={styles.emptyText}
          >
            Search by name to begin
            {' '}
            building your rankings.
          </Text>

        </View>

      ) : filteredPlayers.length === 0 ? (

        /* =================================================
           NO RESULTS
           ================================================= */

        <View style={styles.emptyState}>

          <View
            style={styles.emptyIcon}
          >

            <Text
              style={styles.emptyIconText}
            >
              ?
            </Text>

          </View>

          <Text
            style={styles.emptyTitle}
          >
            NO PLAYERS FOUND
          </Text>

          <Text
            style={styles.emptyText}
          >
            We couldn't find a footballer
            {' '}
            matching "{search.trim()}".
          </Text>

        </View>

      ) : (

        /* =================================================
           RESULTS
           ================================================= */

        <View>

          <View
            style={styles.resultsHeader}
          >

            <Text
              style={styles.resultsLabel}
            >
              PLAYERS
            </Text>

            <Text
              style={styles.resultCount}
            >
              {filteredPlayers.length}
            </Text>

          </View>


          {filteredPlayers.map(
            (player, index) => (

              <TouchableOpacity
                key={player.id}
                style={styles.playerCard}
                onPress={() =>
                  selectPlayer(player)
                }
                activeOpacity={0.7}
              >

                {/* PLAYER MARKER */}

                <View
                  style={styles.playerMarker}
                >

                  <Text
                    style={
                      styles.playerMarkerText
                    }
                  >
                    {player.name
                      ?.charAt(0)
                      ?.toUpperCase()}
                  </Text>

                </View>


                {/* PLAYER INFORMATION */}

                <View
                  style={
                    styles.playerDetails
                  }
                >

                  <Text
                    style={
                      styles.playerName
                    }
                  >
                    {player.name}
                  </Text>

                  <View
                    style={
                      styles.infoRow
                    }
                  >

                    <Text
                      style={
                        styles.playerNation
                      }
                    >
                      {player.nation}
                    </Text>

                    <View
                      style={
                        styles.infoDot
                      }
                    />

                    <Text
                      style={
                        styles.playerInfo
                      }
                    >
                      {getPositionLabel(
                        player
                      )}
                    </Text>

                  </View>

                </View>


                {/* ARROW */}

                <View
                  style={
                    styles.arrowContainer
                  }
                >

                  <Text
                    style={styles.arrow}
                  >
                    →
                  </Text>

                </View>

              </TouchableOpacity>

            )
          )}

        </View>

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
    paddingHorizontal: 22,
    paddingBottom: 60,
  },


  // =====================================================
  // HEADER
  // =====================================================

  header: {
    paddingTop: 55,
    marginBottom: 42,
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  brand: {
    color: '#00ff66',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
  },

  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00ff66',
    marginLeft: 6,
    marginTop: 15,
  },

  brandLine: {
    width: 38,
    height: 3,
    backgroundColor: '#00ff66',
    marginTop: 8,
    borderRadius: 2,
  },


  // =====================================================
  // TITLE
  // =====================================================

  title: {
    color: '#ffffff',
    fontSize: 40,
    lineHeight: 43,
    fontWeight: '900',
    letterSpacing: -1.8,
  },

  subtitle: {
    color: '#777777',
    fontSize: 16,
    lineHeight: 23,
    marginTop: 11,
    marginBottom: 25,
  },


  // =====================================================
  // SEARCH
  // =====================================================

  searchContainer: {
    height: 62,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#242424',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 17,
    marginBottom: 28,
  },

  searchIcon: {
    color: '#00ff66',
    fontSize: 28,
    fontWeight: '300',
    marginRight: 10,
    marginTop: -3,
  },

  search: {
    flex: 1,
    height: '100%',
    color: '#ffffff',
    fontSize: 17,
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


  // =====================================================
  // RESULTS HEADER
  // =====================================================

  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  resultsLabel: {
    color: '#00ff66',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  resultCount: {
    color: '#555555',
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 8,
  },


  // =====================================================
  // PLAYER CARD
  // =====================================================

  playerCard: {
    backgroundColor: '#101010',
    borderRadius: 15,
    minHeight: 82,
    paddingHorizontal: 15,
    paddingVertical: 13,
    marginBottom: 9,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1d1d1d',
  },

  playerMarker: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: '#292929',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  playerMarkerText: {
    color: '#00ff66',
    fontSize: 18,
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

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },

  playerNation: {
    color: '#777777',
    fontSize: 12,
  },

  infoDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#555555',
    marginHorizontal: 7,
  },

  playerInfo: {
    color: '#777777',
    fontSize: 12,
  },

  arrowContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#171717',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },

  arrow: {
    color: '#00ff66',
    fontSize: 19,
    fontWeight: '500',
  },


  // =====================================================
  // EMPTY STATE
  // =====================================================

  emptyState: {
    backgroundColor: '#0d0d0d',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#181818',
    paddingVertical: 32,
    paddingHorizontal: 25,
    alignItems: 'center',
    marginTop: 3,
  },

  emptyIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#242424',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 17,
  },

  emptyIconText: {
    color: '#00ff66',
    fontSize: 25,
    fontWeight: '300',
  },

  emptyTitle: {
    color: '#00ff66',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.3,
    textAlign: 'center',
  },

  emptyText: {
    color: '#666666',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 9,
  },

});