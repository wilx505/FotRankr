import { displayPosition } from '../utils/positions';

import { useState } from 'react';

import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  getActiveStatus,
  getListPlayers,
  hasStatusData,
} from '../utils/listHelpers';


export default function ListDetailScreen({
  navigation,
  route,
  lists,
  myRankings,
  onPlayersChanged,
  onDeleteList,
}) {

  const list = (lists || []).find(
    item =>
      String(item.id) ===
      String(route.params?.listId)
  );

  const [view, setView] = useState('ALL');

  // Always derived live from your rankings, best first.
  const allPlayers = getListPlayers(list, myRankings);

  const showViews = hasStatusData(allPlayers);

  const players =
    view === 'ALL'
      ? allPlayers
      : allPlayers.filter(
          player =>
            getActiveStatus(player.id) ===
            (view === 'ACTIVE')
        );


  const removePlayer = id => {

    onPlayersChanged({
      listId: list.id,
      playerIds: (list.playerIds || []).filter(
        item => String(item) !== String(id)
      ),
    });

  };

  // Opens the existing Challenge screen, limited to
  // the other players in this list.
  const challengePlayer = player => {

    navigation.navigate('Challenge', {
      player,
      opponentIds: allPlayers.map(item =>
        String(item.id)
      ),
    });

  };


  // Asks first, then leaves the screen and deletes.
  // Your player rankings are not affected.
  const confirmDelete = () => {

    Alert.alert(
      'Delete list?',
      `"${list?.name}" will be deleted. ` +
        'Your player rankings won\'t be affected.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            navigation.goBack();
            onDeleteList(list.id);
          },
        },
      ]
    );

  };


  if (!list) {

    return (
      <View style={styles.container}>
        <Text style={styles.missing}>
          List not found.
        </Text>
      </View>
    );

  }


  return (

    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >

      {/* HEADER */}

      <View style={styles.header}>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.back}>
            ← BACK
          </Text>
        </TouchableOpacity>

        <View style={styles.brandLine} />

      </View>


      {/* TITLE */}

      <Text style={styles.title}>
        {list.name || 'Your list'}
      </Text>

      <Text style={styles.subtitle}>
        {allPlayers.length} players, ordered by
        {' '}
        your scores.
      </Text>


      {/* ADD / AUTO-FILL */}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() =>
          navigation.navigate(
            'AddPlayersToList',
            { listId: list.id }
          )
        }
        activeOpacity={0.75}
      >

        <Text style={styles.addButtonText}>
          ADD PLAYERS / AUTO-FILL
        </Text>

        <Text style={styles.addArrow}>
          →
        </Text>

      </TouchableOpacity>


      {/* ACTIVE / RETIRED VIEW */}

      {showViews && (

        <View style={styles.viewRow}>

          {['ALL', 'ACTIVE', 'RETIRED'].map(
            option => (

              <TouchableOpacity
                key={option}
                style={[
                  styles.chip,
                  view === option &&
                    styles.chipActive,
                ]}
                onPress={() => setView(option)}
                activeOpacity={0.75}
              >

                <Text
                  style={[
                    styles.chipText,
                    view === option &&
                      styles.chipTextActive,
                  ]}
                >
                  {option}
                </Text>

              </TouchableOpacity>

            )
          )}

        </View>

      )}


      {/* SECTION */}

      <View style={styles.sectionHeader}>

        <Text style={styles.sectionTitle}>
          RANKING
        </Text>

        <Text style={styles.sectionCount}>
          {players.length}
        </Text>

      </View>


      {/* EMPTY */}

      {players.length === 0 && (

        <View style={styles.emptyState}>

          <Text style={styles.emptyTitle}>
            NO PLAYERS YET
          </Text>

          <Text style={styles.emptyText}>
            Add players, or auto-fill this list
            {' '}
            from your highest scores.
          </Text>

        </View>

      )}


      {/* PLAYERS */}

      {players.map((player, index) => {

        const active =
          getActiveStatus(player.id);

        return (

          <View
            key={player.id}
            style={styles.playerCard}
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

              <Text style={styles.playerInfo}>
                {player.nation}
                {' • '}
                {displayPosition(player.specificPosition) ||
                  player.position ||
                  'Footballer'}
                {active === null
                  ? ''
                  : active
                    ? ' • ACTIVE'
                    : ' • RETIRED'}
              </Text>

              <Text style={styles.playerCategory}>
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


            {allPlayers.length >= 2 && (

              <TouchableOpacity
                style={styles.iconButton}
                onPress={() =>
                  challengePlayer(player)
                }
                activeOpacity={0.7}
              >
                <Text style={styles.iconText}>
                  ⚔
                </Text>
              </TouchableOpacity>

            )}


            <TouchableOpacity
              style={styles.iconButton}
              onPress={() =>
                removePlayer(player.id)
              }
              activeOpacity={0.7}
            >
              <Text style={styles.removeText}>
                ✕
              </Text>
            </TouchableOpacity>

          </View>

        );

      })}


      {/* DELETE */}

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={confirmDelete}
        activeOpacity={0.75}
      >

        <Text style={styles.deleteText}>
          DELETE LIST
        </Text>

      </TouchableOpacity>

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

  missing: {
    color: '#777777',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 120,
  },

  // HEADER

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

  // TITLE

  title: {
    color: '#ffffff',
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '900',
    letterSpacing: -1.5,
  },

  subtitle: {
    color: '#777777',
    fontSize: 16,
    marginTop: 10,
    marginBottom: 25,
  },

  // ADD

  addButton: {
    height: 62,
    backgroundColor: '#00ff66',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },

  addButtonText: {
    color: '#050505',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  addArrow: {
    color: '#050505',
    fontSize: 20,
    fontWeight: '900',
    marginLeft: 10,
  },

  // VIEW CHIPS

  viewRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },

  chip: {
    height: 34,
    paddingHorizontal: 16,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    backgroundColor: '#101010',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },

  chipActive: {
    borderColor: '#00ff66',
    backgroundColor: '#00ff66',
  },

  chipText: {
    color: '#888888',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  chipTextActive: {
    color: '#050505',
  },

  // SECTION

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    fontSize: 12,
    fontWeight: '800',
  },

  // PLAYER

  playerCard: {
    minHeight: 80,
    backgroundColor: '#0d0d0d',
    borderWidth: 1,
    borderColor: '#1d1d1d',
    borderRadius: 16,
    paddingHorizontal: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  rankCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#00ff66',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  rankNumber: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '900',
  },

  playerDetails: {
    flex: 1,
    minWidth: 0,
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

  playerCategory: {
    color: '#00ff66',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 4,
  },

  scoreBox: {
    alignItems: 'flex-end',
    marginLeft: 8,
    marginRight: 4,
  },

  score: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },

  outOf: {
    color: '#555555',
    fontSize: 10,
  },

  iconButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },

  iconText: {
    color: '#00ff66',
    fontSize: 17,
  },

  removeText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '700',
  },

  // DELETE

  deleteButton: {
    height: 52,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#4a1f1f',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },

  deleteText: {
    color: '#ff5a5a',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.3,
  },

  // EMPTY

  emptyState: {
    backgroundColor: '#0d0d0d',
    borderWidth: 1,
    borderColor: '#1d1d1d',
    borderRadius: 16,
    padding: 25,
    alignItems: 'center',
  },

  emptyTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.3,
  },

  emptyText: {
    color: '#666666',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },

});