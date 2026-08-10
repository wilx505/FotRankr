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
        isFirstPlayer: true,
      }
    );

  };

  return (

    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
      keyboardShouldPersistTaps="handled"
    >

      <View style={styles.header}>

        <Text style={styles.brand}>
          FotRankr
        </Text>

        <View
          style={styles.brandLine}
        />

      </View>

      <Text style={styles.title}>
        Find New Players
      </Text>

      <Text style={styles.subtitle}>
        Search for any footballer
        {' '}
        and start ranking them.
      </Text>

      <TextInput
        style={styles.search}
        placeholder="Search players..."
        placeholderTextColor="#666666"
        value={search}
        onChangeText={setSearch}
        autoCapitalize="words"
        autoCorrect={false}
      />

      {search.trim().length === 0 ? (

        <View style={styles.emptyState}>

          <Text style={styles.emptyTitle}>
            FIND YOUR NEXT PLAYER
          </Text>

          <Text style={styles.emptyText}>
            Search by name to start
            ranking a footballer.
          </Text>

        </View>

      ) : filteredPlayers.length === 0 ? (

        <View style={styles.emptyState}>

          <Text style={styles.emptyTitle}>
            NO PLAYERS FOUND
          </Text>

          <Text style={styles.emptyText}>
            Try searching for another
            footballer.
          </Text>

        </View>

      ) : (

        <View>

          <Text style={styles.resultsLabel}>
            RESULTS
          </Text>

          {filteredPlayers.map(
            player => (

              <TouchableOpacity
                key={player.id}
                style={styles.playerCard}
                onPress={() =>
                  selectPlayer(player)
                }
                activeOpacity={0.75}
              >

                <View
                  style={styles.playerDetails}
                >

                  <Text
                    style={styles.playerName}
                  >
                    {player.name}
                  </Text>

                  <Text
                    style={styles.playerInfo}
                  >
                    {player.nation}
                    {'  •  '}
                    {player.position}
                  </Text>

                </View>

                <Text
                  style={styles.arrow}
                >
                  →
                </Text>

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
    paddingBottom: 50,
  },

  header: {
    paddingTop: 55,
    marginBottom: 35,
  },

  brand: {
    color: '#00ff66',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
  },

  brandLine: {
    width: 38,
    height: 3,
    backgroundColor: '#00ff66',
    marginTop: 8,
    borderRadius: 2,
  },

  title: {
    color: '#ffffff',
    fontSize: 39,
    lineHeight: 42,
    fontWeight: '900',
    letterSpacing: -1.5,
  },

  subtitle: {
    color: '#888888',
    fontSize: 16,
    lineHeight: 23,
    marginTop: 12,
    marginBottom: 25,
  },

  search: {
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#242424',
    borderRadius: 14,
    color: '#ffffff',
    fontSize: 17,
    paddingHorizontal: 18,
    height: 58,
    marginBottom: 25,
  },

  resultsLabel: {
    color: '#00ff66',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 12,
  },

  playerCard: {
    backgroundColor: '#111111',
    borderRadius: 14,
    minHeight: 76,
    paddingHorizontal: 18,
    marginBottom: 9,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1d1d1d',
  },

  playerDetails: {
    flex: 1,
  },

  playerName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },

  playerInfo: {
    color: '#777777',
    fontSize: 13,
    marginTop: 5,
  },

  arrow: {
    color: '#555555',
    fontSize: 23,
    marginLeft: 10,
  },

  emptyState: {
    backgroundColor: '#0d0d0d',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#181818',
    padding: 28,
    alignItems: 'center',
    marginTop: 5,
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
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 9,
  },

});

