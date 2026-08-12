import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { findBestOpponent } from '../engine/rankingEngine';
import players from '../players';


export default function HeadToHead({
  route,
  navigation,
  onResult,
  myRankings,
  comparisonHistory,
}) {

  const {
    player,
    category,
    comparisonPlayer: manualOpponent,
    manualChallenge,
  } = route.params || {};

  // --------------------------------------------------
  // BUILD THE SELECTED PLAYER
  // --------------------------------------------------

  const existingTarget = myRankings?.find(
    ranking =>
      ranking.id === player?.id ||
      ranking.playerId === player?.id
  );

const targetPlayer = {
  ...player,

  category,

  rating:
    existingTarget?.rating ??
    existingTarget?.internalRating ??
    (
      category === 'Legendary'
        ? 2960
        : category === 'Elite'
        ? 2800
        : category === 'Very Good'
        ? 2600
        : category === 'Good'
        ? 2200
        : category === 'OK'
        ? 1800
        : 1000
    ),


    uncertainty:
      existingTarget?.uncertainty ??
      350,

    comparisons:
      existingTarget?.comparisons ??
      0,

    wins:
      existingTarget?.wins ??
      0,

    losses:
      existingTarget?.losses ??
      0,

    draws:
      existingTarget?.draws ??
      0,
  };

  // --------------------------------------------------
// BUILD OPPONENT POOL
// --------------------------------------------------
// Use the full player database.
// Existing rankings are merged in so the ranking
// engine still has the player's current rating.

const rankedOpponents = players
  .filter(
    databasePlayer =>
      databasePlayer.id !== targetPlayer.id
  )
  .map(databasePlayer => {

    const existingRanking =
      (myRankings || []).find(
        ranking =>
          ranking.id === databasePlayer.id ||
          ranking.playerId === databasePlayer.id
      );

    if (existingRanking) {
      return {
        ...databasePlayer,
        ...existingRanking,

        rating:
          existingRanking.rating ??
          existingRanking.internalRating ??
          2000,

        uncertainty:
          existingRanking.uncertainty ??
          350,

        comparisons:
          existingRanking.comparisons ??
          0,

        wins:
          existingRanking.wins ??
          0,

        losses:
          existingRanking.losses ??
          0,

        draws:
          existingRanking.draws ??
          0,
      };
    }

    return {
      ...databasePlayer,

      rating: 2000,

      uncertainty: 350,

      comparisons: 0,

      wins: 0,

      losses: 0,

      draws: 0,
    };
  });
  console.log(
  'ALGORITHM TEST COUNT:',
  targetPlayer.name,
  'H2Hs:',
  (comparisonHistory || []).filter(
    comparison =>
      comparison.playerA === targetPlayer.id ||
      comparison.playerB === targetPlayer.id
  )
);

const automaticComparisonCount =
  (comparisonHistory || []).filter(
    comparison =>
      comparison.playerA === targetPlayer.id ||
      comparison.playerB === targetPlayer.id
  ).length;

const comparisonPlayer =
  manualChallenge && manualOpponent
    ? manualOpponent
    : automaticComparisonCount >= 6
    ? null
    : findBestOpponent(
        targetPlayer,
        rankedOpponents,
        comparisonHistory || []
      );
      
      console.log(
  'FOTRANKR DEBUG:',
  {
    target: targetPlayer.name,
    targetId: targetPlayer.id,
    specificPosition: targetPlayer.specificPosition,
    comparisons: targetPlayer.comparisons,
    historyCount: comparisonHistory?.length,
    history: comparisonHistory,
    goalkeeperCount: rankedOpponents.filter(
      p => p.specificPosition === targetPlayer.specificPosition
    ).length,
    goalkeeperNames: rankedOpponents
      .filter(
        p => p.specificPosition === targetPlayer.specificPosition
      )
      .map(p => p.name),
    selectedOpponent: comparisonPlayer?.name ?? 'NONE',
  }
);
      
  console.log(
    'FOTRANKR H2H:',
    'Selected =',
    targetPlayer?.name,
    targetPlayer?.id,
    '| Ranked opponents =',
    rankedOpponents.length,
    '| Opponent =',
    comparisonPlayer?.name ?? 'NONE'
  );

  // --------------------------------------------------
  // HANDLE RESULT
  // --------------------------------------------------

  const updateScores = (result) => {

    if (!comparisonPlayer) {

      console.log(
        'FOTRANKR H2H: No ranked opponent available.'
      );

      return;
    }

    console.log(
      'FOTRANKR H2H RESULT:',
      {
        player: targetPlayer.name,
        comparisonPlayer: comparisonPlayer.name,
        category,
        result,
      }
    );

    onResult({
      player: targetPlayer,
      comparisonPlayer,
      category,
      result,
    });

  
  };

  // --------------------------------------------------
  // SCREEN
  // --------------------------------------------------

  return (

    <View style={styles.container}>

      <Text style={styles.title}>
        HEAD TO HEAD
      </Text>

      <Text style={styles.category}>
        {category}
      </Text>

      {comparisonPlayer ? (

        <>

          <View style={styles.comparisonBox}>

            {/* SELECTED PLAYER */}

            <View style={styles.playerSide}>

              <Text style={styles.playerName}>
                {targetPlayer.name}
              </Text>

              <Text style={styles.info}>
                {targetPlayer.nation}
              </Text>

            </View>

            <Text style={styles.vs}>
              VS
            </Text>

            {/* RANKED OPPONENT */}

            <View style={styles.playerSide}>

              <Text style={styles.playerName}>
                {comparisonPlayer.name}
              </Text>

              <Text style={styles.info}>
                {comparisonPlayer.nation}
              </Text>

            </View>

          </View>

          <Text style={styles.question}>
            Who is the better footballer?
          </Text>

          <TouchableOpacity
            style={styles.playerButton}
            onPress={() =>
              updateScores('player')
            }
          >

            <Text style={styles.buttonText}>
              {targetPlayer.name}
            </Text>

            <Text style={styles.buttonSubtext}>
              is better
            </Text>

          </TouchableOpacity>

          <TouchableOpacity
            style={styles.drawButton}
            onPress={() =>
              updateScores('equal')
            }
          >

            <Text style={styles.drawText}>
              They are equal
            </Text>

          </TouchableOpacity>

          <TouchableOpacity
            style={styles.playerButton}
            onPress={() =>
              updateScores('comparison')
            }
          >

            <Text style={styles.buttonText}>
              {comparisonPlayer.name}
            </Text>

            <Text style={styles.buttonSubtext}>
              is better
            </Text>

          </TouchableOpacity>

        </>

      ) : (

        <View style={styles.noOpponentBox}>

          <Text style={styles.noOpponentTitle}>
            No ranked opponent available
          </Text>

          <Text style={styles.noOpponentText}>
            This player needs to be compared against someone already in your rankings.
          </Text>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() =>
              navigation.navigate('MainTabs', { screen: 'MyRanks' })
            }
          >

            <Text style={styles.backButtonText}>
              BACK TO MY RANKINGS
            </Text>

          </TouchableOpacity>

        </View>

      )}

    </View>

  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#050505',
    padding: 20,
  },

  title: {
    color: '#00ff66',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 30,
  },

  category: {
    color: '#aaaaaa',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 30,
  },

  comparisonBox: {
    backgroundColor: '#111111',
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  playerSide: {
    flex: 1,
    alignItems: 'center',
  },

  playerName: {
    color: '#00ff66',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  info: {
    color: '#aaaaaa',
    fontSize: 14,
    marginTop: 7,
    textAlign: 'center',
  },

  vs: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginHorizontal: 15,
  },

  question: {
    color: 'white',
    fontSize: 21,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 35,
    marginBottom: 20,
  },

  playerButton: {
    backgroundColor: '#111111',
    borderWidth: 2,
    borderColor: '#00ff66',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
  },

  buttonText: {
    color: '#00ff66',
    fontSize: 23,
    fontWeight: 'bold',
  },

  buttonSubtext: {
    color: '#888888',
    fontSize: 14,
    marginTop: 5,
  },

  drawButton: {
    backgroundColor: '#111111',
    borderWidth: 2,
    borderColor: '#777777',
    borderRadius: 15,
    padding: 18,
    marginBottom: 15,
    alignItems: 'center',
  },

  drawText: {
    color: '#dddddd',
    fontSize: 18,
    fontWeight: 'bold',
  },

  noOpponentBox: {
    backgroundColor: '#111111',
    borderRadius: 15,
    padding: 25,
    marginTop: 30,
    alignItems: 'center',
  },

  noOpponentTitle: {
    color: '#00ff66',
    fontSize: 21,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  noOpponentText: {
    color: '#999999',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
  },

  backButton: {
    backgroundColor: '#00ff66',
    borderRadius: 12,
    padding: 15,
    marginTop: 25,
  },

  backButtonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: 'bold',
  },

});

