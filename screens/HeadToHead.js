import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useState } from 'react';

import {
  createPlayer,
  findBestOpponent,
} from '../engine/rankingEngine';

import players from '../players';


export default function HeadToHead({
  route,
  navigation,
  onResult,
  myRankings,
  comparisonHistory,
}) {

  const [resultSubmitted, setResultSubmitted] =
    useState(false);


  const {
    player,
    category,
    comparisonPlayer: manualOpponent,
    manualChallenge,
  } = route.params || {};


  // ==================================================
  // FIND EXISTING TARGET
  // ==================================================

  const existingTarget =
    (myRankings || []).find(
      ranking =>
        String(ranking.id) ===
          String(player?.id) ||
        String(ranking.playerId) ===
          String(player?.id)
    );


  // ==================================================
  // BUILD TARGET
  // ==================================================

  const targetPlayer =
    existingTarget
      ? {
          ...player,
          ...existingTarget,

          category,

          rating:
            existingTarget.rating ??
            500,

          comparisons:
            existingTarget.comparisons ??
            0,

          wins:
            existingTarget.wins ??
            0,

          losses:
            existingTarget.losses ??
            0,

          draws:
            existingTarget.draws ??
            0,

          isRanked:
            true,
        }

      : {
          ...createPlayer(
            player,
            category
          ),

          category,

          isRanked:
            true,
        };


  // ==================================================
  // CATEGORY H2H HISTORY
  // ==================================================

  const categoryHistory =
    (comparisonHistory || []).filter(
      comparison => {

        const involvesPlayer =
          String(comparison.playerA) ===
            String(targetPlayer.id) ||
          String(comparison.playerB) ===
            String(targetPlayer.id);

        const sameCategory =
          comparison.category ===
          category;

        return (
          involvesPlayer &&
          sameCategory
        );

      }
    );


 const automaticComparisonCount =
  targetPlayer.h2hCategory === category
    ? (targetPlayer.h2hCount ?? 0)
    : 0;


  console.log(
    'FOTRANKR BIG CHANGE:',
    {
      player:
        targetPlayer.name,

      category,

      h2hCount:
        automaticComparisonCount,

      maximumH2Hs:
        6,
    }
  );


  // ==================================================
  // BUILD SAME-CATEGORY OPPONENT POOL
  // ==================================================

  const rankedOpponents =
    players

      .filter(
        databasePlayer =>
          String(databasePlayer.id) !==
          String(targetPlayer.id)
      )

      .map(
        databasePlayer => {

          const existingRanking =
            (myRankings || []).find(
              ranking =>
                String(ranking.id) ===
                  String(databasePlayer.id) ||
                String(ranking.playerId) ===
                  String(databasePlayer.id)
            );


          // ------------------------------------------
          // EXISTING RANKED PLAYER
          // ------------------------------------------

          if (existingRanking) {

            return {

              ...databasePlayer,

              ...existingRanking,

              category:
                existingRanking.category ??
                existingRanking.initialCategory,

              rating:
                existingRanking.rating ??
                500,

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

              isRanked:
                true,

            };

          }


          // ------------------------------------------
          // UNRANKED PLAYER
          // ------------------------------------------

          return {

            ...databasePlayer,

            category:
              null,

            rating:
              500,

            comparisons:
              0,

            wins:
              0,

            losses:
              0,

            draws:
              0,

            isRanked:
              false,

          };

        }
      );


  // ==================================================
  // AUTOMATIC OPPONENT
  // ==================================================

 const automaticOpponent =
  manualChallenge

    ? null

    : automaticComparisonCount >= 6

      ? null

      : findBestOpponent(
          targetPlayer,
          rankedOpponents,
          comparisonHistory || []
        );


  // ==================================================
  // MANUAL CHALLENGE
  // ==================================================

  let comparisonPlayer =
    automaticOpponent;


  if (
    manualChallenge &&
    manualOpponent
  ) {

    const manualRankedPlayer =
      (myRankings || []).find(
        ranking =>
          String(ranking.id) ===
            String(manualOpponent.id) ||
          String(ranking.playerId) ===
            String(manualOpponent.id)
      );


    // Manual challenge is only allowed
    // inside the same category.

    if (
      manualRankedPlayer &&
      manualRankedPlayer.category ===
        category
    ) {

      comparisonPlayer = {

        ...manualOpponent,

        ...manualRankedPlayer,

        category,

        isRanked:
          true,

      };

    }
    else {

      comparisonPlayer =
        null;

      console.log(
        'FOTRANKR BIG CHANGE: Manual H2H blocked because opponent is not in the same category.'
      );

    }

  }


  // ==================================================
  // HANDLE RESULT
  // ==================================================

  const updateScores =
    result => {

      // Prevent duplicate submissions.

      if (resultSubmitted) {

        console.log(
          'FOTRANKR: Result already submitted. Ignoring duplicate tap.'
        );

        return;

      }


      // Make sure a valid opponent exists.

      if (!comparisonPlayer) {

        console.log(
          'FOTRANKR BIG CHANGE: No valid same-category opponent.'
        );

        return;

      }


      // Lock this H2H immediately.

      setResultSubmitted(true);


      console.log(
        'FOTRANKR BIG CHANGE RESULT:',
        {
          player:
            targetPlayer.name,

          opponent:
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

        comparisonPlayer,

        category,

        result,

        opponentIsRanked:
          comparisonPlayer.isRanked === true,

      });

    };


  // ==================================================
  // SCREEN
  // ==================================================

  return (

    <View style={styles.container}>

      <Text style={styles.title}>
        HEAD TO HEAD
      </Text>


      <Text style={styles.category}>
        {category}
      </Text>


      <Text style={styles.h2hCount}>
        {automaticComparisonCount} / 6
      </Text>


      {comparisonPlayer && !resultSubmitted ? (

        <>

          <View style={styles.comparisonBox}>

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
            disabled={resultSubmitted}
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
            disabled={resultSubmitted}
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
            disabled={resultSubmitted}
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
            {resultSubmitted
              ? 'H2H SUBMITTED'
              : 'NO MORE H2Hs AVAILABLE'}
          </Text>


          <Text style={styles.noOpponentText}>
            {resultSubmitted
              ? 'Your comparison has been recorded.'
              : 'This player has completed the available same-category head-to-head comparisons, or there are no other ranked players in this category yet.'}
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

const styles =
  StyleSheet.create({

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
      marginBottom: 5,
    },

    h2hCount: {
      color: '#00ff66',
      fontSize: 15,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 25,
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