import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import players from '../players';

import {
  CLUB_BONUS_XP,
  LEVELS,
  XP_PER_LEVEL,
  XP_PER_PLAYER,
  getProgress,
  getUnlockLevel,
  unlockName,
} from '../utils/progression';


// Flag / icon for each unlock on the league ladder.
const UNLOCK_ICONS = {
  'Premier League': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'La Liga': '🇪🇸',
  'Ligue 1': '🇫🇷',
  'Serie A': '🇮🇹',
  Bundesliga: '🇩🇪',
  REST_OF_WORLD: '🌍',
  LEGENDS: '👑',
};


// How many players each level unlocks, worked out once.
const PLAYERS_PER_UNLOCK = players.reduce(
  (counts, player) => {
    const level = getUnlockLevel(player.id);
    counts[level] = (counts[level] || 0) + 1;
    return counts;
  },
  {}
);

const UNLOCK_LEVELS = LEVELS.filter(
  info => info.unlocks
);


const STEPS = [
  {
    title: 'Find a player',
    text: 'Search by name, or browse the clubs in every league you have unlocked.',
  },
  {
    title: 'Pick their tier',
    text: 'Legendary, Elite, Very Good, Good, OK or Bad.',
  },
  {
    title: 'Settle the head-to-heads',
    text: 'Tap who is better. FotRankr turns your answers into your rankings.',
  },
  {
    title: 'Level up',
    text: `+${XP_PER_PLAYER} XP for every player, +${CLUB_BONUS_XP} XP for every club you complete. Levels unlock new leagues.`,
  },
];


export default function HomeScreen({
  navigation,
  myRankings,
}) {

  const progress = getProgress(myRankings);

  const nextUnlock = UNLOCK_LEVELS.find(
    info => info.level > progress.level
  );

  const xpToNextUnlock = nextUnlock
    ? (nextUnlock.level - 1) * XP_PER_LEVEL -
      progress.xp
    : 0;

  const progressPercent = progress.isMaxLevel
    ? 100
    : (progress.xpIntoLevel / XP_PER_LEVEL) * 100;


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

        <Text style={styles.heroSubtitle}>
          Build your own rankings of the
          {' '}
          world's footballers, one
          {' '}
          head-to-head at a time.
        </Text>

        <TouchableOpacity
          style={styles.startButton}
          onPress={() =>
            navigation.navigate('Search')
          }
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


      {/* YOUR PROGRESS */}

      <TouchableOpacity
        style={styles.progressCard}
        onPress={() =>
          navigation.navigate('Profile')
        }
        activeOpacity={0.85}
      >

        <View style={styles.progressTop}>

          <Text style={styles.progressBadge}>
            {progress.current.badge}
          </Text>

          <View style={styles.progressDetails}>

            <Text style={styles.progressLevel}>
              LEVEL {progress.level}
            </Text>

            <Text style={styles.progressTitle}>
              {progress.current.title}
            </Text>

          </View>

          <Text style={styles.progressXp}>
            {progress.xp.toLocaleString()} XP
          </Text>

        </View>


        <View style={styles.progressTrack}>

          <View
            style={[
              styles.progressFill,
              { width: `${progressPercent}%` },
            ]}
          />

        </View>


        <Text style={styles.progressNext}>
          {nextUnlock
            ? `Next unlock: ${UNLOCK_ICONS[nextUnlock.unlocks]} ` +
              `${unlockName(nextUnlock.unlocks)} at Level ${nextUnlock.level}` +
              ` · ${xpToNextUnlock.toLocaleString()} XP to go`
            : 'Every league is unlocked. Keep climbing to GOAT.'}
        </Text>

      </TouchableOpacity>


      {/* HOW IT WORKS */}

      <View style={styles.section}>

        <Text style={styles.sectionLabel}>
          HOW IT WORKS
        </Text>

        {STEPS.map((step, index) => (

          <View
            key={step.title}
            style={styles.stepRow}
          >

            <View style={styles.stepNumber}>

              <Text style={styles.stepNumberText}>
                {index + 1}
              </Text>

            </View>

            <View style={styles.stepDetails}>

              <Text style={styles.stepTitle}>
                {step.title}
              </Text>

              <Text style={styles.stepText}>
                {step.text}
              </Text>

            </View>

          </View>

        ))}

      </View>


      {/* UNLOCK THE WORLD */}

      <View style={styles.section}>

        <Text style={styles.sectionLabel}>
          UNLOCK THE WORLD
        </Text>

        <Text style={styles.sectionTitle}>
          Rank players to open new leagues.
        </Text>

        {UNLOCK_LEVELS.map(info => {

          const unlocked =
            info.level <= progress.level;

          const isNext =
            info === nextUnlock;

          return (

            <View
              key={info.level}
              style={[
                styles.leagueRow,
                unlocked && styles.leagueRowUnlocked,
                isNext && styles.leagueRowNext,
              ]}
            >

              <Text style={styles.leagueIcon}>
                {UNLOCK_ICONS[info.unlocks]}
              </Text>

              <View style={styles.leagueDetails}>

                <Text
                  style={[
                    styles.leagueName,
                    !unlocked && styles.leagueNameLocked,
                  ]}
                >
                  {unlockName(info.unlocks)}
                </Text>

                <Text style={styles.leagueMeta}>
                  LEVEL {info.level}
                  {'  ·  '}
                  {(PLAYERS_PER_UNLOCK[info.level] || 0).toLocaleString()}
                  {' PLAYERS'}
                </Text>

              </View>

              <Text
                style={
                  unlocked
                    ? styles.leagueStatusUnlocked
                    : styles.leagueStatusLocked
                }
              >
                {unlocked
                  ? '✓ UNLOCKED'
                  : `🔒 ${((info.level - 1) * XP_PER_LEVEL).toLocaleString()} XP`}
              </Text>

            </View>

          );
        })}

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
    marginBottom: 45,
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


  // HERO

  hero: {
    marginBottom: 30,
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
    marginTop: 18,
  },

  startButton: {
    backgroundColor: '#00ff66',
    borderRadius: 14,
    minHeight: 62,
    paddingHorizontal: 22,
    marginTop: 26,
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


  // PROGRESS

  progressCard: {
    backgroundColor: '#0f0f0f',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1d1d1d',
    padding: 16,
    marginBottom: 40,
  },

  progressTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  progressBadge: {
    fontSize: 30,
    marginRight: 12,
  },

  progressDetails: {
    flex: 1,
  },

  progressLevel: {
    color: '#00ff66',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.3,
  },

  progressTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },

  progressXp: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    marginLeft: 8,
  },

  progressTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1b1b1b',
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: '#00ff66',
  },

  progressNext: {
    color: '#999999',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 12,
  },


  // SECTIONS

  section: {
    marginBottom: 40,
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
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 16,
  },


  // HOW IT WORKS

  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
  },

  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1b1b1b',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  stepNumberText: {
    color: '#00ff66',
    fontSize: 13,
    fontWeight: '900',
  },

  stepDetails: {
    flex: 1,
  },

  stepTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },

  stepText: {
    color: '#777777',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 3,
  },


  // LEAGUE LADDER

  leagueRow: {
    backgroundColor: '#0c0c0c',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#181818',
    minHeight: 64,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    opacity: 0.6,
  },

  leagueRowUnlocked: {
    backgroundColor: '#111111',
    borderColor: '#1d1d1d',
    opacity: 1,
  },

  leagueRowNext: {
    borderColor: '#00ff66',
    opacity: 1,
  },

  leagueIcon: {
    fontSize: 26,
    width: 40,
    textAlign: 'center',
    marginRight: 10,
  },

  leagueDetails: {
    flex: 1,
  },

  leagueName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },

  leagueNameLocked: {
    color: '#aaaaaa',
  },

  leagueMeta: {
    color: '#666666',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 4,
  },

  leagueStatusUnlocked: {
    color: '#00ff66',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginLeft: 8,
  },

  leagueStatusLocked: {
    color: '#F39C12',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginLeft: 8,
  },


  // FOOTER

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
