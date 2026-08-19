import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useEffect, useState } from 'react';

import {
  createPlayer,
  findBestOpponent,
} from '../engine/rankingEngine';

import players from '../players';


// ======================================================
// HEAD TO HEAD
// ======================================================

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
    smartH2H,
    startSmartH2H,
  } = route.params || {};


  // ==================================================
  // CONSTANTS
  // ==================================================

  const MAX_H2HS = 6;


  // ==================================================
  // STATE
  // ==================================================

  const [resultSubmitted, setResultSubmitted] =
    useState(false);

  const [comparisonPlayer, setComparisonPlayer] =
    useState(null);

  const [sessionFinished, setSessionFinished] =
    useState(false);


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

          h2hCount:
            existingTarget.h2hCount ??
            0,

          h2hCategory:
            existingTarget.h2hCategory ??
            category,

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
  // CURRENT AUTOMATIC H2H COUNT
  // ==================================================

  const automaticComparisonCount =
    targetPlayer.h2hCategory === category
      ? (
          targetPlayer.h2hCount ??
          0
        )
      : 0;


  console.log(
    'FOTRANKR SMART H2H STATE:',
    {
      player:
        targetPlayer.name,

      category,

      h2hCount:
        automaticComparisonCount,

      maximumH2Hs:
        MAX_H2HS,

      resultSubmitted,

      sessionFinished,
    }
  );


  // ==================================================
  // BUILD OPPONENT POOL
  // ==================================================

  const buildOpponentPool = () => {

    return players
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

  };


  // ==================================================
  // CATEGORY HISTORY
  // ==================================================

  const categoryHistory =
    (comparisonHistory || []).filter(
      comparison => {

        if (!comparison) {
          return false;
        }

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


  // ==================================================
  // FIND AUTOMATIC OPPONENT
  // ==================================================

  const getNextAutomaticOpponent = () => {

    // ----------------------------------------------
    // SIX H2H LIMIT
    // ----------------------------------------------

    if (
      automaticComparisonCount >=
      MAX_H2HS
    ) {

      console.log(
        'FOTRANKR SMART H2H: Six H2Hs completed.',
        {
          player:
            targetPlayer.name,

          h2hCount:
            automaticComparisonCount,
        }
      );

      return null;
    }


    // ----------------------------------------------
    // BUILD POOL
    // ----------------------------------------------

    const opponentPool =
      buildOpponentPool();


    // ----------------------------------------------
    // ASK ENGINE FOR BEST OPPONENT
    // ----------------------------------------------

    const opponent =
      findBestOpponent(
        targetPlayer,
        opponentPool,
        comparisonHistory || []
      );


    if (!opponent) {

      console.log(
        'FOTRANKR SMART H2H: No valid opponent available.',
        {
          player:
            targetPlayer.name,

          category,

          position:
            targetPlayer.position,

          specificPosition:
            targetPlayer.specificPosition,
        }
      );

      return null;
    }


    console.log(
      'FOTRANKR SMART H2H: NEXT OPPONENT',
      {
        player:
          targetPlayer.name,

        opponent:
          opponent.name,

        targetRating:
          targetPlayer.rating,

        opponentRating:
          opponent.rating,

        h2hNumber:
          automaticComparisonCount + 1,

        maximumH2Hs:
          MAX_H2HS,
      }
    );


    return opponent;

  };


  // ==================================================
  // START AUTOMATIC H2H SESSION
  // ==================================================

  useEffect(() => {

    // ----------------------------------------------
    // MANUAL CHALLENGE
    // ----------------------------------------------

    if (
      manualChallenge === true
    ) {

      if (
        !manualOpponent
      ) {

        setComparisonPlayer(
          null
        );

        setSessionFinished(
          true
        );

        return;
      }


      const manualRankedPlayer =
        (myRankings || []).find(
          ranking =>
            String(ranking.id) ===
              String(manualOpponent.id) ||
            String(ranking.playerId) ===
              String(manualOpponent.id)
        );


     if (
  manualRankedPlayer &&
  manualRankedPlayer.position ===
    targetPlayer.position &&
  manualRankedPlayer.specificPosition ===
    targetPlayer.specificPosition
) {

        setComparisonPlayer({
          ...manualOpponent,
          ...manualRankedPlayer,

          category,

          isRanked:
            true,
        });

        setSessionFinished(
          false
        );

      } else {

        console.log(
          'FOTRANKR MANUAL H2H: Invalid opponent.'
        );

        setComparisonPlayer(
          null
        );

        setSessionFinished(
          true
        );
      }

      return;
    }


    // ----------------------------------------------
    // AUTOMATIC / SMART H2H
    // ----------------------------------------------

    if (
      smartH2H !== true &&
      startSmartH2H !== true
    ) {

      return;
    }


    // ----------------------------------------------
    // IF RESULT WAS JUST SUBMITTED
    // WAIT FOR APP STATE TO UPDATE
    // ----------------------------------------------

    if (
      resultSubmitted
    ) {

      return;
    }


    // ----------------------------------------------
    // ALREADY FINISHED
    // ----------------------------------------------

    if (
      sessionFinished
    ) {

      return;
    }


    // ----------------------------------------------
    // SIX H2H LIMIT
    // ----------------------------------------------

    if (
      automaticComparisonCount >=
      MAX_H2HS
    ) {

      setComparisonPlayer(
        null
      );

      setSessionFinished(
        true
      );

      return;
    }


    // ----------------------------------------------
    // FIND NEXT OPPONENT
    // ----------------------------------------------

    const nextOpponent =
      getNextAutomaticOpponent();


    if (!nextOpponent) {

      setComparisonPlayer(
        null
      );

      setSessionFinished(
        true
      );

      return;
    }


    setComparisonPlayer(
      nextOpponent
    );


  }, [
    targetPlayer.id,
    targetPlayer.h2hCount,
    targetPlayer.h2hCategory,
    category,
    comparisonHistory,
    myRankings,
    resultSubmitted,
    sessionFinished,
    manualChallenge,
    manualOpponent,
    smartH2H,
    startSmartH2H,
  ]);


  // ==================================================
  // HANDLE RESULT
  // ==================================================

  const updateScores =
    result => {

      // ----------------------------------------------
      // PREVENT DOUBLE TAP
      // ----------------------------------------------

      if (
        resultSubmitted
      ) {

        console.log(
          'FOTRANKR: Result already submitted.'
        );

        return;
      }


      // ----------------------------------------------
      // VALIDATE OPPONENT
      // ----------------------------------------------

      if (
        !comparisonPlayer
      ) {

        console.log(
          'FOTRANKR SMART H2H: No opponent.'
        );

        return;
      }


      // ----------------------------------------------
      // LOCK CURRENT H2H
      // ----------------------------------------------

      setResultSubmitted(
        true
      );


      console.log(
        'FOTRANKR SMART H2H RESULT:',
        {
          player:
            targetPlayer.name,

          opponent:
            comparisonPlayer.name,

          category,

          result,

          h2hNumber:
            automaticComparisonCount + 1,

          maximumH2Hs:
            MAX_H2HS,

          opponentIsRanked:
            comparisonPlayer.isRanked,
        }
      );


      // ----------------------------------------------
      // SEND RESULT TO APP
      // ----------------------------------------------

      onResult({

        player:
          targetPlayer,

        comparisonPlayer,

        category,

        result,

        opponentIsRanked:
          comparisonPlayer.isRanked === true,

        manualChallenge:
          manualChallenge === true,
      });

    };


  // ==================================================
  // AFTER RESULT
  // ==================================================

  useEffect(() => {

    if (
      !resultSubmitted
    ) {

      return;
    }


    // ----------------------------------------------
    // MANUAL CHALLENGE
    // ----------------------------------------------

    if (
      manualChallenge === true
    ) {

      return;
    }


    // ----------------------------------------------
    // WAIT FOR UPDATED PLAYER DATA
    //
    // App.js updates myRankings.
    // Once h2hCount changes, this component
    // will re-render and the next opponent
    // will be selected by the effect above.
    // ----------------------------------------------

    const updatedPlayer =
      (myRankings || []).find(
        ranking =>
          String(ranking.id) ===
          String(player?.id)
      );


    if (!updatedPlayer) {
      return;
    }


    const updatedCount =
      updatedPlayer.h2hCategory === category
        ? (
            updatedPlayer.h2hCount ??
            0
          )
        : 0;


    console.log(
      'FOTRANKR SMART H2H: RESULT PROCESSED',
      {
        player:
          updatedPlayer.name,

        h2hCount:
          updatedCount,

        maximumH2Hs:
          MAX_H2HS,
      }
    );


    // ----------------------------------------------
    // SIX COMPLETED
    // ----------------------------------------------

    if (
      updatedCount >=
      MAX_H2HS
    ) {

      console.log(
        'FOTRANKR SMART H2H: SESSION COMPLETE.'
      );

      setComparisonPlayer(
        null
      );

      setSessionFinished(
        true
      );

      return;
    }


    // ----------------------------------------------
    // PREPARE NEXT H2H
    // ----------------------------------------------

    setComparisonPlayer(
      null
    );

    setResultSubmitted(
      false
    );

  }, [
    myRankings,
    resultSubmitted,
    category,
    manualChallenge,
    player?.id,
  ]);


  // ==================================================
  // H2H NUMBER FOR DISPLAY
  // ==================================================

  const currentH2HNumber =
    Math.min(
      automaticComparisonCount + 1,
      MAX_H2HS
    );


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


      {manualChallenge !== true && (
        <Text style={styles.h2hCount}>
          H2H {currentH2HNumber} OF {MAX_H2HS}
        </Text>
      )}


      {comparisonPlayer &&
      !resultSubmitted &&
      !sessionFinished ? (

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
              ? 'PROCESSING H2H...'
              : sessionFinished
                ? (
                    automaticComparisonCount >=
                    MAX_H2HS
                      ? 'SMART H2H COMPLETE'
                      : 'NO MORE H2Hs AVAILABLE'
                  )
                : 'LOADING H2H...'}

          </Text>


          <Text style={styles.noOpponentText}>

            {resultSubmitted
              ? 'Calculating the next comparison...'
              : sessionFinished
                ? (
                    automaticComparisonCount >=
                    MAX_H2HS
                      ? `FotRankr has completed ${MAX_H2HS} intelligent comparisons for ${targetPlayer.name}.`
                      : 'There are no more eligible same-category opponents available.'
                  )
                : 'Finding the most useful comparison...'}

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
      textAlign: 'center',
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