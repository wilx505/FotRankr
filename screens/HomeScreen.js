import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import players from '../players';

import {
  getLock,
  lockMessage,
} from '../utils/progression';

export default function HomeScreen({
  navigation,
  myRankings,
}) {

  const popularNames = [
    'Lionel Messi',
    'Cristiano Ronaldo',
    'Kylian Mbappé',
    'Erling Haaland',
    'Mohamed Salah',
  ];

  const popularPlayers = popularNames
    .map(name =>
      players.find(
        player =>
          player.name.toLowerCase() ===
          name.toLowerCase()
      )
    )
    .filter(Boolean);

  // Start with the first great you're allowed to rank,
  // otherwise go and search for someone.
  const startRanking = () => {

    const firstUnlocked = popularPlayers.find(
      player => !getLock(player, myRankings)
    );

    if (firstUnlocked) {

      navigation.navigate(
        'Compare',
        {
          player:
            firstUnlocked,
          isFirstPlayer: true,
        }
      );

      return;
    }

    navigation.navigate('Search');

  };

  const selectPlayer = (
    player
  ) => {

    const lock = getLock(player, myRankings);

    if (lock) {

      Alert.alert(
        `🔒 ${player.name} is locked`,
        lockMessage(lock)
      );

      return;
    }

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
      showsVerticalScrollIndicator={false}
    >

      {/* BRAND */}

      <View style={styles.header}>

        <Text style={styles.brand}>
          FotRankr
        </Text>

        <View
          style={styles.brandLine}
        />

      </View>

      {/* HERO */}

      <View style={styles.hero}>

        <Text style={styles.heroTitle}>
          Rank Every
          {'\n'}
          Footballer In
          {'\n'}
          The World.
        </Text>

        <TouchableOpacity
          style={styles.startButton}
          onPress={startRanking}
          activeOpacity={0.8}
        >

          <Text
            style={styles.startButtonText}
          >
            START RANKING
          </Text>

          <Text
            style={styles.arrow}
          >
            →
          </Text>

        </TouchableOpacity>

      </View>

      {/* POPULAR PLAYERS */}

      <View style={styles.section}>

        <Text style={styles.sectionLabel}>
          START WITH THE GREATS
        </Text>

        <Text style={styles.sectionTitle}>
          Who are you ranking?
        </Text>

        {popularPlayers.map(
          (player, index) => (

            <TouchableOpacity
              key={player.id}
              style={styles.playerCard}
              onPress={() =>
                selectPlayer(player)
              }
              activeOpacity={0.75}
            >

              <View
                style={styles.playerNumber}
              >

                <Text
                  style={
                    styles.playerNumberText
                  }
                >
                  {String(
                    index + 1
                  ).padStart(2, '0')}
                </Text>

              </View>

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

                {getLock(player, myRankings) && (

                  <Text
                    style={styles.lockText}
                  >
                    {lockMessage(
                      getLock(player, myRankings)
                    )}
                  </Text>

                )}

              </View>

              <Text
                style={styles.playerArrow}
              >
                {getLock(player, myRankings)
                  ? '🔒'
                  : '→'}
              </Text>

            </TouchableOpacity>

          )
        )}

      </View>

      {/* FOOTER MESSAGE */}

      <View style={styles.footer}>

        <Text style={styles.footerText}>
          EVERY PLAYER.
          {'\n'}
          YOUR RANKING.
        </Text>

      </View>

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
    marginBottom: 55,
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

  hero: {
    marginBottom: 55,
  },

  heroTitle: {
    color: '#ffffff',
    fontSize: 48,
    lineHeight: 49,
    fontWeight: '900',
    letterSpacing: -2,
  },

  heroSubtitle: {
    color: '#8d8d8d',
    fontSize: 16,
    lineHeight: 23,
    marginTop: 22,
  },

  startButton: {
    backgroundColor: '#00ff66',
    borderRadius: 14,
    minHeight: 62,
    paddingHorizontal: 22,
    marginTop: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  startButtonText: {
    color: '#000000',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  arrow: {
    color: '#000000',
    fontSize: 27,
    fontWeight: 'bold',
  },

  section: {
    marginBottom: 45,
  },

  sectionLabel: {
    color: '#00ff66',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 7,
  },

  sectionTitle: {
    color: '#ffffff',
    fontSize: 25,
    fontWeight: '800',
    marginBottom: 18,
  },

  playerCard: {
    backgroundColor: '#111111',
    borderRadius: 14,
    minHeight: 76,
    paddingHorizontal: 16,
    marginBottom: 9,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1d1d1d',
  },

  playerNumber: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1b1b1b',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  playerNumberText: {
    color: '#00ff66',
    fontSize: 12,
    fontWeight: '900',
  },

  playerDetails: {
    flex: 1,
  },

  playerName: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },

  playerInfo: {
    color: '#777777',
    fontSize: 12,
    marginTop: 5,
  },

  lockText: {
    color: '#F39C12',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
  },

  playerArrow: {
    color: '#555555',
    fontSize: 22,
    marginLeft: 10,
  },

  footer: {
    paddingTop: 10,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
  },

  footerText: {
    color: '#333333',
    fontSize: 27,
    lineHeight: 28,
    fontWeight: '900',
    letterSpacing: -1,
  },

});

