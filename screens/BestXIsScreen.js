import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import ClubBadge from '../components/ClubBadge';

import { getCompletedClubs } from '../utils/progression';


// Every completed club, each opening its Best XI.
export default function BestXIsScreen({
  navigation,
  myRankings,
}) {

  const clubs = getCompletedClubs(myRankings)
    .slice()
    .sort((a, b) => a.club.localeCompare(b.club));


  return (

    <View style={styles.screen}>

      {/* TOP BAR */}

      <View style={styles.topBar}>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >

          <Text style={styles.backArrow}>
            ‹
          </Text>

        </TouchableOpacity>


        <Text style={styles.topBarTitle}>
          MY BEST XI'S
        </Text>


        <View style={styles.topBarSpacer} />

      </View>


      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        <Text style={styles.subtitle}>
          Complete a club to unlock its Best XI, picked from your
          {' '}highest-rated players in any formation.
        </Text>


        {clubs.length === 0 ? (

          <View style={styles.emptyBox}>

            <Text style={styles.emptyTitle}>
              NO CLUBS YET
            </Text>

            <Text style={styles.emptyText}>
              Rank every player at a club to unlock its Best XI.
            </Text>

          </View>

        ) : (

          clubs.map(entry => (

            <TouchableOpacity
              key={`${entry.league}|${entry.club}`}
              style={styles.clubCard}
              onPress={() =>
                navigation.navigate('BestXI', {
                  club: entry.club,
                  league: entry.league,
                })
              }
              activeOpacity={0.75}
            >

              <ClubBadge
                club={entry.club}
                size={46}
              />

              <View style={styles.clubDetails}>

                <Text style={styles.clubName}>
                  {entry.club}
                </Text>

                <Text style={styles.clubMeta}>
                  {(entry.league || '').toUpperCase()}
                </Text>

              </View>

              <Text style={styles.arrow}>
                ›
              </Text>

            </TouchableOpacity>

          ))

        )}

      </ScrollView>

    </View>

  );
}


const styles = StyleSheet.create({

  screen: {
    flex: 1,
    backgroundColor: '#050505',
  },

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

  container: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  subtitle: {
    color: '#555555',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    lineHeight: 15,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 22,
  },

  clubCard: {
    backgroundColor: '#0f0f0f',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1b1b1b',
    padding: 13,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },

  clubDetails: {
    flex: 1,
    marginLeft: 14,
  },

  clubName: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },

  clubMeta: {
    color: '#777777',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginTop: 4,
  },

  arrow: {
    color: '#333333',
    fontSize: 25,
    fontWeight: '300',
    marginLeft: 8,
  },

  emptyBox: {
    backgroundColor: '#0f0f0f',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1b1b1b',
    padding: 24,
    alignItems: 'center',
  },

  emptyTitle: {
    color: '#00ff66',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.3,
  },

  emptyText: {
    color: '#777777',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },

});
