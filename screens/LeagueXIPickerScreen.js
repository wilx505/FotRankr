import { useState } from 'react';

import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { leagueFlag } from '../utils/badges';

import { getLeagueSquad } from '../utils/bestXI';

import { getSourcePlayer } from '../utils/listHelpers';

import { LEVELS } from '../utils/progression';


// Top five first (unlock order), then the rest by size.
const TOP_LEAGUES = LEVELS
  .map(level => level.unlocks)
  .filter(
    unlocks =>
      unlocks &&
      unlocks !== 'REST_OF_WORLD' &&
      unlocks !== 'LEGENDS'
  );


// Every league you've ranked players in, each opening its
// League Best XI. COMBINE LEAGUES switches to picking two or
// more leagues for one XI.
export default function LeagueXIPickerScreen({
  navigation,
  myRankings,
}) {

  const [combining, setCombining] = useState(false);

  const [chosen, setChosen] = useState([]);

  const toggleCombining = () => {
    setCombining(!combining);
    setChosen([]);
  };

  const toggleLeague = name => {
    setChosen(previous =>
      previous.includes(name)
        ? previous.filter(item => item !== name)
        : [...previous, name]
    );
  };

  const leagueNames = [
    ...new Set(
      (myRankings || [])
        .map(player => getSourcePlayer(player.id))
        .filter(source => source && source.active !== false)
        .map(source => source.currentLeague)
        .filter(Boolean)
    ),
  ];

  const leagues = leagueNames
    .map(name => ({
      name,
      count: getLeagueSquad(name, myRankings).length,
    }))
    .filter(entry => entry.count > 0)
    .sort((a, b) => {

      const rank = name => {
        const index = TOP_LEAGUES.indexOf(name);
        return index === -1 ? TOP_LEAGUES.length : index;
      };

      return (
        rank(a.name) - rank(b.name) ||
        b.count - a.count ||
        a.name.localeCompare(b.name)
      );
    });


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
          LEAGUE BEST XI'S
        </Text>


        <View style={styles.topBarSpacer} />

      </View>


      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        {/* COMBINE LEAGUES */}

        <TouchableOpacity
          style={[
            styles.combineButton,
            combining && styles.combineButtonActive,
          ]}
          onPress={toggleCombining}
          activeOpacity={0.8}
        >

          <Text
            style={[
              styles.combineText,
              combining && styles.combineTextActive,
            ]}
          >
            {combining ? '✕  CANCEL COMBINING' : 'COMBINE LEAGUES'}
          </Text>

        </TouchableOpacity>


        <Text style={styles.subtitle}>
          {combining
            ? 'Pick two or more leagues. Each spot goes to your highest-rated player from any of them.'
            : 'Your highest-rated player in every position, from the whole league.'}
        </Text>


        {leagues.length === 0 ? (

          <View style={styles.emptyBox}>

            <Text style={styles.emptyTitle}>
              NO LEAGUES YET
            </Text>

            <Text style={styles.emptyText}>
              Rank some players to build a League Best XI.
            </Text>

          </View>

        ) : (

          leagues.map(entry => (

            <TouchableOpacity
              key={entry.name}
              style={[
                styles.leagueCard,
                combining &&
                  chosen.includes(entry.name) &&
                  styles.leagueCardChosen,
              ]}
              onPress={() =>
                combining
                  ? toggleLeague(entry.name)
                  : navigation.navigate('BestXI', {
                      leagueXI: entry.name,
                    })
              }
              activeOpacity={0.75}
            >

              <View style={styles.flagCircle}>
                <Text style={styles.flag}>
                  {leagueFlag(entry.name)}
                </Text>
              </View>

              <View style={styles.leagueDetails}>

                <Text style={styles.leagueName}>
                  {entry.name}
                </Text>

                <Text style={styles.leagueMeta}>
                  {entry.count}
                  {entry.count === 1
                    ? ' PLAYER RANKED'
                    : ' PLAYERS RANKED'}
                </Text>

              </View>

              {combining ? (

                <View
                  style={[
                    styles.tick,
                    chosen.includes(entry.name) && styles.tickChosen,
                  ]}
                >
                  <Text style={styles.tickText}>
                    {chosen.includes(entry.name) ? '✓' : ''}
                  </Text>
                </View>

              ) : (

                <Text style={styles.arrow}>
                  ›
                </Text>

              )}

            </TouchableOpacity>

          ))

        )}

      </ScrollView>


      {/* BUILD (combining) */}

      {combining && (

        <View style={styles.footer}>

          <TouchableOpacity
            style={[
              styles.buildButton,
              chosen.length < 2 && styles.buildButtonDisabled,
            ]}
            disabled={chosen.length < 2}
            onPress={() =>
              navigation.navigate('BestXI', {
                leagueXIs: chosen,
              })
            }
            activeOpacity={0.85}
          >

            <Text style={styles.buildText}>
              {chosen.length >= 2
                ? `BUILD COMBINED XI  ·  ${chosen.length} LEAGUES`
                : 'PICK AT LEAST 2 LEAGUES'}
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

  combineButton: {
    borderWidth: 1,
    borderColor: '#00ff66',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },

  combineButtonActive: {
    borderColor: '#555555',
  },

  combineText: {
    textAlign: 'center',
    color: '#00ff66',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },

  combineTextActive: {
    color: '#999999',
  },

  leagueCardChosen: {
    borderColor: '#00ff66',
    backgroundColor: '#0d1f14',
  },

  tick: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
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

  leagueCard: {
    backgroundColor: '#0f0f0f',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1b1b1b',
    padding: 13,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },

  flagCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#141414',
    borderWidth: 2,
    borderColor: '#00ff66',
    alignItems: 'center',
    justifyContent: 'center',
  },

  flag: {
    fontSize: 22,
  },

  leagueDetails: {
    flex: 1,
    marginLeft: 14,
  },

  leagueName: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },

  leagueMeta: {
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
