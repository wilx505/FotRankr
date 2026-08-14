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
      String(ranking.id) === String(player?.id) ||
      String(ranking.playerId) === String(player?.id)
  );

  const targetPlayer = {
    ...player,

    ...(existingTarget || {}),

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

    // The selected player is genuinely ranked.
    isRanked: true,
  };


  // --------------------------------------------------
  // BUILD OPPONENT POOL
  // --------------------------------------------------
  //
  // Every player in the database can be used as an
  // H2H reference.
  //
  // IMPORTANT:
  // An opponent who has NOT been ranked gets a
  // temporary rating of 2000, but is marked:
  //
  //     isRanked: false
  //
  // This allows the algorithm to use them for the
  // comparison without treating them as a real
  // member of My Rankings.
  // --------------------------------------------------

  const rankedOpponents = players
    .filter(
      databasePlayer =>
        String(databasePlayer.id) !==
        String(targetPlayer.id)
    )
    .map(databasePlayer => {

      const existingRanking =
        (myRankings || []).find(
          ranking =>
            String(ranking.id) ===
              String(databasePlayer.id) ||
            String(ranking.playerId) ===
              String(databasePlayer.id)
        );


      // ------------------------------------------------
      // GENUINELY RANKED PLAYER
      // ------------------------------------------------

      if (existingRanking) {

        console.log(
          'FOTRANKR EXISTING RANKED OPPONENT:',
          existingRanking.name,
          'ID:',
          existingRanking.id,
          'RATING:',
          existingRanking.rating
        );

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

          // This player really exists in My Rankings.
          isRanked: true,
        };
      }


      // ------------------------------------------------
      // UNRANKED H2H REFERENCE
      // ------------------------------------------------
      //
      // This player can still appear in a H2H.
      //
      // BUT:
      //
      // isRanked = false
      //
      // This tells App.js that this player should NOT
      // automatically become part of My Rankings just
      // because they were used as an opponent.
      // ------------------------------------------------

      return {
        ...databasePlayer,

        rating: 2000,

        uncertainty: 350,

        comparisons: 0,

        wins: 0,

        losses: 0,

        draws: 0,

        isRanked: false,
      };
    });


  // --------------------------------------------------
  // COUNT H2Hs FOR SELECTED PLAYER
  // --------------------------------------------------

  const playerHistory =
    (comparisonHistory || []).filter(
      comparison =>
        String(comparison.playerA) ===
          String(targetPlayer.id) ||
        String(comparison.playerB) ===
          String(targetPlayer.id)
    );


  const automaticComparisonCount =
    playerHistory.length;


  console.log(
    'ALGORITHM TEST COUNT:',
    targetPlayer.name,
    'H2Hs:',
    playerHistory
  );


  // --------------------------------------------------
  // SELECT OPPONENT
  // --------------------------------------------------

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
      target:
        targetPlayer.name,

      targetId:
        targetPlayer.id,

      specificPosition:
        targetPlayer.specificPosition,

      comparisons:
        targetPlayer.comparisons,

      historyCount:
        comparisonHistory?.length,

      h2hCount:
        automaticComparisonCount,

      goalkeeperCount:
        rankedOpponents.filter(
          p =>
            p.specificPosition ===
            targetPlayer.specificPosition
        ).length,

      goalkeeperNames:
        rankedOpponents
          .filter(
            p =>
              p.specificPosition ===
              targetPlayer.specificPosition
          )
          .map(
            p => p.name
          ),

      selectedOpponent:
        comparisonPlayer?.name ??
        'NONE',

      selectedOpponentRanked:
        comparisonPlayer?.isRanked ??
        false,
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
    comparisonPlayer?.name ?? 'NONE',
    '| Opponent genuinely ranked =',
    comparisonPlayer?.isRanked ?? false
  );


  // --------------------------------------------------
  // HANDLE RESULT
  // --------------------------------------------------

  const updateScores = (result) => {

    if (!comparisonPlayer) {

      console.log(
        'FOTRANKR H2H: No opponent available.'
      );

      return;
    }


    console.log(
      'FOTRANKR H2H RESULT:',
      {
        player:
          targetPlayer.name,

        comparisonPlayer:
          comparisonPlayer.name,

        category,

        result,

        opponentIsRanked:
          comparisonPlayer.isRanked,
      }
    );


    onResult({

      player:
        targetPlayer,

      comparisonPlayer:
        comparisonPlayer,

      category,

      result,

      // ------------------------------------------------
      // IMPORTANT
      // ------------------------------------------------
      //
      // App.js can use this to determine whether the
      // opponent should actually be saved in My Rankings.
      //
      opponentIsRanked:
        comparisonPlayer.isRanked === true,

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


            {/* OPPONENT */}

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


          {/* SELECTED PLAYER WINS */}

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


          {/* DRAW */}

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


          {/* OPPONENT WINS */}

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
            No more H2Hs available
          </Text>


          <Text style={styles.noOpponentText}>
            You have completed the six head-to-head
            comparisons for this player.
          </Text>


          <TouchableOpacity
            style={styles.backButton}
            onPress={() =>
              navigation.navigate(
                'MainTabs',
                {
                  screen: 'MyRanks',
                }
              )
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


// ======================================================
// STYLES
// ======================================================

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