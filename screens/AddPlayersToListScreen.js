import React from 'react';

import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import players from '../players';

export default function AddPlayersToListScreen({
  navigation,
  route,
  onPlayersAdded,
}) {

  const list = route.params?.list;

  const [search, setSearch] = React.useState('');
  const [selectedPlayers, setSelectedPlayers] =
    React.useState(list?.players || []);

  const filteredPlayers =
    players.filter(player =>
      player.name
        ?.toLowerCase()
        .includes(search.toLowerCase())
    );

  const togglePlayer = player => {

    const alreadySelected =
      selectedPlayers.some(
        selected =>
          String(selected.id) ===
          String(player.id)
      );

    if (alreadySelected) {

      setSelectedPlayers(
        previous =>
          previous.filter(
            selected =>
              String(selected.id) !==
              String(player.id)
          )
      );

      return;
    }

    setSelectedPlayers(
      previous => [
        ...previous,
        player,
      ]
    );
  };


  const savePlayers = () => {

    onPlayersAdded({
      listId: list.id,
      players: selectedPlayers,
    });

    navigation.goBack();
  };


  return (

    <View style={styles.container}>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        {/* HEADER */}

        <View style={styles.header}>

          <TouchableOpacity
            onPress={() =>
              navigation.goBack()
            }
          >

            <Text style={styles.back}>
              ← BACK
            </Text>

          </TouchableOpacity>

          <View style={styles.brandLine} />

        </View>


        {/* TITLE */}

        <Text style={styles.title}>
          Add players.
        </Text>

        <Text style={styles.subtitle}>
          Choose the players you want
          {' '}
          in this list.
        </Text>


        {/* LIST NAME */}

        <View style={styles.listBox}>

          <Text style={styles.listLabel}>
            LIST
          </Text>

          <Text style={styles.listName}>
            {list?.name}
          </Text>

          <Text style={styles.playerCount}>
            {selectedPlayers.length} players selected
          </Text>

        </View>


        {/* SEARCH */}

        <TextInput
          style={styles.search}
          placeholder="Search players..."
          placeholderTextColor="#555555"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />


        {/* PLAYERS */}

        <View style={styles.sectionHeader}>

          <Text style={styles.sectionTitle}>
            PLAYERS
          </Text>

          <Text style={styles.sectionCount}>
            {selectedPlayers.length}
          </Text>

        </View>


        {filteredPlayers.map(player => {

          const selected =
            selectedPlayers.some(
              item =>
                String(item.id) ===
                String(player.id)
            );

          return (

            <TouchableOpacity
              key={player.id}
              style={[
                styles.playerCard,
                selected &&
                  styles.playerCardSelected,
              ]}
              onPress={() =>
                togglePlayer(player)
              }
              activeOpacity={0.75}
            >

              <View style={styles.avatar}>

                <Text style={styles.avatarText}>
                  {player.name
                    ?.charAt(0)
                    ?.toUpperCase()}
                </Text>

              </View>


              <View style={styles.playerDetails}>

                <Text style={styles.playerName}>
                  {player.name}
                </Text>

                <Text style={styles.playerInfo}>
                  {player.nation}
                  {' • '}
                  {player.specificPosition ||
                    player.position}
                </Text>

              </View>


              <View
                style={[
                  styles.check,
                  selected &&
                    styles.checkSelected,
                ]}
              >

                <Text
                  style={[
                    styles.checkText,
                    selected &&
                      styles.checkTextSelected,
                  ]}
                >
                  {selected ? '✓' : '+'}
                </Text>

              </View>

            </TouchableOpacity>

          );

        })}

      </ScrollView>


      {/* SAVE BUTTON */}

      <View style={styles.bottom}>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={savePlayers}
          activeOpacity={0.75}
        >

          <Text style={styles.saveText}>
            SAVE PLAYERS
          </Text>

          <Text style={styles.saveArrow}>
            →
          </Text>

        </TouchableOpacity>

      </View>

    </View>

  );

}


const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#050505',
  },

  content: {
    paddingHorizontal: 22,
    paddingBottom: 120,
  },

  header: {
    paddingTop: 55,
    marginBottom: 35,
  },

  back: {
    color: '#00ff66',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.3,
  },

  brandLine: {
    width: 38,
    height: 3,
    backgroundColor: '#00ff66',
    marginTop: 12,
    borderRadius: 2,
  },

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

  listBox: {
    backgroundColor: '#101010',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#1d1d1d',
    padding: 16,
    marginBottom: 18,
  },

  listLabel: {
    color: '#00ff66',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
  },

  listName: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 6,
  },

  playerCount: {
    color: '#666666',
    fontSize: 12,
    marginTop: 5,
  },

  search: {
    backgroundColor: '#101010',
    borderWidth: 1,
    borderColor: '#1d1d1d',
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 16,
    color: '#ffffff',
    fontSize: 15,
    marginBottom: 25,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  sectionTitle: {
    color: '#00ff66',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  sectionCount: {
    color: '#555555',
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 8,
  },

  playerCard: {
    backgroundColor: '#101010',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#1d1d1d',
    minHeight: 72,
    paddingHorizontal: 13,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 9,
  },

  playerCardSelected: {
    borderColor: '#00ff66',
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: '#292929',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },

  avatarText: {
    color: '#00ff66',
    fontSize: 16,
    fontWeight: '900',
  },

  playerDetails: {
    flex: 1,
  },

  playerName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },

  playerInfo: {
    color: '#666666',
    fontSize: 11,
    marginTop: 4,
  },

  check: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },

  checkSelected: {
    borderColor: '#00ff66',
    backgroundColor: '#00ff66',
  },

  checkText: {
    color: '#666666',
    fontSize: 19,
    fontWeight: '700',
  },

  checkTextSelected: {
    color: '#050505',
  },

  bottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#050505',
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 25,
  },

  saveButton: {
    height: 54,
    borderRadius: 15,
    backgroundColor: '#00ff66',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  saveText: {
    color: '#050505',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.3,
  },

  saveArrow: {
    color: '#050505',
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 12,
  },

});