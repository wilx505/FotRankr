
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ListDetailScreen({
  navigation,
  route,
}) {
  const list = route.params?.list;

  const players = list?.players || [];

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
        {list?.name || 'Your list'}
      </Text>

      <Text style={styles.subtitle}>
        {players.length} players in this list.
      </Text>


      {/* ADD PLAYERS */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() =>
          navigation.navigate(
            'AddPlayersToList',
            {
              list,
            }
          )
        }
        activeOpacity={0.75}
      >
        <Text style={styles.addButtonText}>
          ADD PLAYERS
        </Text>

        <Text style={styles.addArrow}>
          →
        </Text>
      </TouchableOpacity>


      {/* PLAYERS */}
      <View style={styles.sectionHeader}>

        <Text style={styles.sectionTitle}>
          PLAYERS
        </Text>

        <Text style={styles.sectionCount}>
          {players.length}
        </Text>

      </View>


      {/* EMPTY STATE */}
      {players.length === 0 && (
        <View style={styles.emptyState}>

          <Text style={styles.emptyTitle}>
            NO PLAYERS YET
          </Text>

          <Text style={styles.emptyText}>
            Add players to start building
            this list.
          </Text>

        </View>
      )}


      {/* PLAYER LIST */}
      {players.map(player => (

        <View
          key={player.id}
          style={styles.playerCard}
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
                player.position ||
                'Footballer'}
            </Text>

          </View>

        </View>

      ))}

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


  // ADD BUTTON

  addButton: {
    height: 62,
    backgroundColor: '#00ff66',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
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
    minHeight: 76,
    backgroundColor: '#0d0d0d',
    borderWidth: 1,
    borderColor: '#1d1d1d',
    borderRadius: 16,
    paddingHorizontal: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#161616',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 12,
    marginTop: 5,
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