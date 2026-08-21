import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ListsScreen({
  navigation,
  lists,
}) {

  return (

    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
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

        <View style={styles.brandLine} />

      </View>


      {/* =================================================
          TITLE
          ================================================= */}

      <Text style={styles.title}>
        Your lists.
      </Text>

      <Text style={styles.subtitle}>
        Build your own football
        {' '}
        rankings and collections.
      </Text>


      {/* =================================================
          CREATE LIST
          ================================================= */}

      <TouchableOpacity
        style={styles.createButton}
        onPress={() =>
          navigation.navigate('CreateList')
        }
        activeOpacity={0.75}
          onPress={() =>
    navigation.navigate('ListDetail', {
      list,
    })
  }
      >

        <View style={styles.createIcon}>
          <Text style={styles.createIconText}>
            +
          </Text>
        </View>

        <View style={styles.createDetails}>

          <Text style={styles.createTitle}>
            CREATE A LIST
          </Text>

          <Text style={styles.createDescription}>
            Build your own ranked list.
          </Text>

        </View>

        <Text style={styles.createArrow}>
          →
        </Text>

      </TouchableOpacity>


      {/* =================================================
          EXISTING LISTS
          ================================================= */}

      {lists.length > 0 && (

        <View style={styles.section}>

          <View style={styles.sectionHeader}>

            <Text style={styles.sectionTitle}>
              YOUR LISTS
            </Text>

            <Text style={styles.sectionCount}>
              {lists.length}
            </Text>

          </View>


          {lists.map(list => (

            <TouchableOpacity
              key={list.id}
              style={styles.listCard}
              activeOpacity={0.75}
              onPress={() =>
                navigation.navigate('ListDetail', {
                  list,
                })
              }
            >

              <View style={styles.listIcon}>

                <Text style={styles.listIconText}>
                  {list.name
                    ?.charAt(0)
                    ?.toUpperCase()}
                </Text>

              </View>


              <View style={styles.listDetails}>

                <Text style={styles.listName}>
                  {list.name}
                </Text>

                <Text style={styles.listMeta}>
                  {list.players?.length || 0}
                  {' '}
                  players
                </Text>

              </View>


              <Text style={styles.listArrow}>
                →
              </Text>

            </TouchableOpacity>

          ))}

        </View>

      )}


      {/* =================================================
          EMPTY STATE
          ================================================= */}

      {lists.length === 0 && (

        <View style={styles.emptyState}>

          <View style={styles.emptyIcon}>

            <Text style={styles.emptyIconText}>
              +
            </Text>

          </View>

          <Text style={styles.emptyTitle}>
            NO LISTS YET
          </Text>

          <Text style={styles.emptyText}>
            Create your first list and
            {' '}
            start building your own
            {' '}
            football rankings.
          </Text>

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
  // CREATE
  // =====================================================

  createButton: {
    backgroundColor: '#101010',
    borderWidth: 1,
    borderColor: '#00ff66',
    borderRadius: 16,
    minHeight: 82,
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },

  createIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#151515',
    borderWidth: 1,
    borderColor: '#00ff66',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  createIconText: {
    color: '#00ff66',
    fontSize: 27,
    fontWeight: '300',
  },

  createDetails: {
    flex: 1,
  },

  createTitle: {
    color: '#00ff66',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  createDescription: {
    color: '#666666',
    fontSize: 12,
    marginTop: 4,
  },

  createArrow: {
    color: '#00ff66',
    fontSize: 20,
    fontWeight: '700',
  },


  // =====================================================
  // SECTION
  // =====================================================

  section: {
    marginTop: 2,
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


  // =====================================================
  // LIST CARD
  // =====================================================

  listCard: {
    backgroundColor: '#101010',
    borderRadius: 15,
    minHeight: 78,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 9,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1d1d1d',
  },

  listIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: '#292929',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  listIconText: {
    color: '#00ff66',
    fontSize: 17,
    fontWeight: '900',
  },

  listDetails: {
    flex: 1,
  },

  listName: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },

  listMeta: {
    color: '#666666',
    fontSize: 12,
    marginTop: 5,
  },

  listArrow: {
    color: '#00ff66',
    fontSize: 19,
    marginLeft: 10,
  },


  // =====================================================
  // EMPTY
  // =====================================================

  emptyState: {
    backgroundColor: '#0d0d0d',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#181818',
    paddingVertical: 32,
    paddingHorizontal: 25,
    alignItems: 'center',
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