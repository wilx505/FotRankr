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
  } = route.params || {};

  // --------------------------------------------------
  // BUILD PLAYERS WITH THEIR CURRENT RANKINGS
  // --------------------------------------------------

  const rankedPlayers = players.map((p) => {

    const existingRanking = myRankings?.find(
      ranking =>
        ranking.id === p.id ||
        ranking.playerId === p.id
    );

    return {
      ...p,

      rating:
        existingRanking?.rating ??
        existingRanking?.internalRating ??
        2000,

      uncertainty:
        existingRanking?.uncertainty ??
        350,

      comparisons:
        existingRanking?.comparisons ??
        0,

      wins:
        existingRanking?.wins ??
        0,

      losses:
        existingRanking?.losses ??
        0,

      draws:
        existingRanking?.draws ??
        0,
    };

  });


  // --------------------------------------------------
  // SELECTED PLAYER
  // --------------------------------------------------

  const targetRanking = myRankings?.find(
    ranking =>
      ranking.id === player?.id ||
      ranking.playerId === player?.id
  );


  const targetPlayer = {

    ...player,

    rating:
      targetRanking?.rating ??
      targetRanking?.internalRating ??
      2000,

    uncertainty:
      targetRanking?.uncertainty ??
      350,

    comparisons:
      targetRanking?.comparisons ??
      0,

    wins:
      targetRanking?.wins ??
      0,

    losses:
      targetRanking?.losses ??
      0,

    draws:
      targetRanking?.draws ??
      0,

  };


  // --------------------------------------------------
  // REMOVE THE SELECTED PLAYER FROM OPPONENTS
  // --------------------------------------------------

  const availableOpponents = rankedPlayers.filter(
    rankedPlayer =>
      rankedPlayer.id !== targetPlayer.id
  );


  // --------------------------------------------------
  // FIND OPPONENT
  // --------------------------------------------------

  const comparisonPlayer = findBestOpponent(
    targetPlayer,
    availableOpponents,
    comparisonHistory || []
  );


  console.log(
    'FOTRANKR H2H:',
    'Selected =',
    targetPlayer?.name,
    targetPlayer?.id,
    '| Opponent =',
    comparisonPlayer?.name ?? 'NONE',
    comparisonPlayer?.id ?? 'NONE'
  );


  // --------------------------------------------------
  // HANDLE RESULT
  // --------------------------------------------------

  const updateScores = (result) => {

    if (!comparisonPlayer) {

      console.log(
        'FOTRANKR H2H: Cannot submit result because there is no opponent.'
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


    navigation.navigate('Rankings');

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


      <View style={styles.comparisonBox}>


        {/* SELECTED PLAYER */}

        <View style={styles.playerSide}>

          <Text style={styles.playerName}>
            {targetPlayer?.name ?? 'Unknown player'}
          </Text>

          <Text style={styles.info}>
            {targetPlayer?.nation ?? ''}
          </Text>

        </View>


        <Text style={styles.vs}>
          VS
        </Text>


        {/* COMPARISON PLAYER */}

        <View style={styles.playerSide}>

          <Text style={styles.playerName}>
            {comparisonPlayer?.name ?? 'No opponent'}
          </Text>

          <Text style={styles.info}>
            {comparisonPlayer?.nation ?? ''}
          </Text>

        </View>


      </View>


      <Text style={styles.question}>
        Who is better?
      </Text>


      {/* SELECTED PLAYER WINS */}

      <TouchableOpacity
        style={styles.greenButton}
        onPress={() =>
          updateScores('player')
        }
        disabled={!comparisonPlayer}
      >

        <Text style={styles.buttonText}>
          {targetPlayer?.name ?? 'Player'} is better
        </Text>

      </TouchableOpacity>


      {/* DRAW */}

      <TouchableOpacity
        style={styles.greyButton}
        onPress={() =>
          updateScores('equal')
        }
        disabled={!comparisonPlayer}
      >

        <Text style={styles.buttonText}>
          They are equally good
        </Text>

      </TouchableOpacity>


      {/* COMPARISON PLAYER WINS */}

      <TouchableOpacity
        style={styles.redButton}
        onPress={() =>
          updateScores('comparison')
        }
        disabled={!comparisonPlayer}
      >

        <Text style={styles.buttonText}>
          {comparisonPlayer?.name ?? 'Opponent'} is better
        </Text>

      </TouchableOpacity>


    </View>

  );

}


// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#050505',
    padding: 20,
    justifyContent: 'center',
  },


  title: {
    color: '#00ff66',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },


  category: {
    color: '#aaaaaa',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 35,
  },


  comparisonBox: {
    backgroundColor: '#111111',
    borderRadius: 18,
    padding: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },


  playerSide: {
    width: '38%',
    alignItems: 'center',
  },


  playerName: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },


  info: {
    color: '#aaaaaa',
    fontSize: 15,
    textAlign: 'center',
  },


  vs: {
    color: '#00ff66',
    fontSize: 22,
    fontWeight: 'bold',
  },


  question: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 35,
    marginBottom: 20,
  },


  greenButton: {
    backgroundColor: '#00a84f',
    padding: 17,
    borderRadius: 12,
    marginBottom: 12,
  },


  greyButton: {
    backgroundColor: '#555555',
    padding: 17,
    borderRadius: 12,
    marginBottom: 12,
  },


  redButton: {
    backgroundColor: '#c0392b',
    padding: 17,
    borderRadius: 12,
    marginBottom: 12,
  },


  buttonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: 'bold',
    textAlign: 'center',
  },

});