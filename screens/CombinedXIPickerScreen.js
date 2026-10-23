import { useState } from 'react';

import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import ClubBadge from '../components/ClubBadge';

import { getCompletedClubs } from '../utils/progression';


const keyOf = entry => `${entry.league || ''}|${entry.club}`;


// Pick two or more completed clubs for a Combined XI.
export default function CombinedXIPickerScreen({
  navigation,
  myRankings,
}) {

  const clubs = getCompletedClubs(myRankings)
    .slice()
    .sort((a, b) => a.club.localeCompare(b.club));

  const [chosen, setChosen] = useState([]);

  const toggle = entry => {

    const key = keyOf(entry);

    setChosen(previous =>
      previous.includes(key)
        ? previous.filter(item => item !== key)
        : [...previous, key]
    );
  };

  const chosenClubs = clubs
    .filter(entry => chosen.includes(keyOf(entry)))
    .map(entry => ({ club: entry.club, league: entry.league }));

  const canBuild = chosenClubs.length >= 2;


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
          COMBINED XI'S
        </Text>


        <View style={styles.topBarSpacer} />

      </View>


      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        <Text style={styles.subtitle}>
          Pick two or more clubs. Each spot goes to your
          {' '}highest-rated player from any of them.
        </Text>


        {clubs.length < 2 ? (

          <View style={styles.emptyBox}>

            <Text style={styles.emptyTitle}>
              NOT ENOUGH CLUBS YET
            </Text>

            <Text style={styles.emptyText}>
              Complete at least two clubs to build a Combined XI.
            </Text>

          </View>

        ) : (

          clubs.map(entry => {

            const isChosen = chosen.includes(keyOf(entry));

            return (

              <TouchableOpacity
                key={keyOf(entry)}
                style={[
                  styles.clubCard,
                  isChosen && styles.clubCardChosen,
                ]}
                onPress={() => toggle(entry)}
                activeOpacity={0.75}
              >

                <ClubBadge
                  club={entry.club}
                  size={44}
                />

                <View style={styles.clubDetails}>

                  <Text style={styles.clubName}>
                    {entry.club}
                  </Text>

                  <Text style={styles.clubMeta}>
                    {(entry.league || '').toUpperCase()}
                  </Text>

                </View>

                <View
                  style={[
                    styles.tick,
                    isChosen && styles.tickChosen,
                  ]}
                >

                  <Text style={styles.tickText}>
                    {isChosen ? '✓' : ''}
                  </Text>

                </View>

              </TouchableOpacity>

            );
          })

        )}

      </ScrollView>


      {/* BUILD */}

      {clubs.length >= 2 && (

        <View style={styles.footer}>

          <TouchableOpacity
            style={[
              styles.buildButton,
              !canBuild && styles.buildButtonDisabled,
            ]}
            disabled={!canBuild}
            onPress={() =>
              navigation.navigate('BestXI', {
                clubs: chosenClubs,
              })
            }
            activeOpacity={0.85}
          >

            <Text style={styles.buildText}>
              {canBuild
                ? `BUILD COMBINED XI  ·  ${chosenClubs.length} CLUBS`
                : 'PICK AT LEAST 2 CLUBS'}
            </Text>

          </TouchableOpacity>

        </View>

      )}

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
    paddingBottom: 30,
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
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },

  clubCardChosen: {
    borderColor: '#00ff66',
    backgroundColor: '#0d1f14',
  },

  clubDetails: {
    flex: 1,
    marginLeft: 14,
  },

  clubName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },

  clubMeta: {
    color: '#777777',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginTop: 4,
  },

  tick: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
  },

  tickChosen: {
    backgroundColor: '#00ff66',
    borderColor: '#00ff66',
  },

  tickText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '900',
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

  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
    backgroundColor: '#050505',
    borderTopWidth: 1,
    borderTopColor: '#141414',
  },

  buildButton: {
    backgroundColor: '#00ff66',
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
  },

  buildButtonDisabled: {
    backgroundColor: '#1d1d1d',
  },

  buildText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.6,
  },

});
