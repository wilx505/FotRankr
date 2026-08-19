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

  const goToRankings = () => {
    navigation.navigate('MainTabs', {
      screen: 'MyRanks',
    });
  };


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

          isRanked: true,
        }
      : {
          ...createPlayer(
            player,
            category
          ),

          category,

          isRanked: true,
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

              isRanked: true,
            };

          }


          return {
            ...databasePlayer,

            category: null,

            rating: 500,

            comparisons: 0,

            wins: 0,

            losses: 0,

            draws: 0,

            isRanked: false,
          };

        }
      );

  };


  // ==================================================
  // FIND AUTOMATIC OPPONENT
  // ==================================================

  const getNextAutomaticOpponent = () => {

    if (
      automaticComparisonCount >=
      MAX_H2HS
    ) {
      return null;
    }


    const opponentPool =
      buildOpponentPool();


    const opponent =
      findBestOpponent(
        targetPlayer,
        opponentPool,
        comparisonHistory || []
      );


    if (!opponent) {
      return null;
    }


    return opponent;

  };


  // ==================================================
  // START H2H SESSION
  // ==================================================

  useEffect(() => {

    // --------------------------------------------------
    // MANUAL CHALLENGE
    // --------------------------------------------------

    if (
      manualChallenge === true
    ) {

      if (!manualOpponent) {

        setComparisonPlayer(null);
        setSessionFinished(true);

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


      if (manualRankedPlayer) {

        setComparisonPlayer({
          ...manualOpponent,
          ...manualRankedPlayer,

          category,

          isRanked: true,
        });

        setSessionFinished(false);

      } else {

        setComparisonPlayer(null);
        setSessionFinished(true);

      }

      return;
    }


    // --------------------------------------------------
    // SMART H2H
    // --------------------------------------------------

    if (
      smartH2H !== true &&
      startSmartH2H !== true
    ) {
      return;
    }


    if (resultSubmitted) {
      return;
    }


    if (sessionFinished) {
      return;
    }


    if (
      automaticComparisonCount >=
      MAX_H2HS
    ) {

      goToRankings();

      return;
    }


    const nextOpponent =
      getNextAutomaticOpponent();


    if (!nextOpponent) {

      goToRankings();

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

      if (resultSubmitted) {
        return;
      }


      if (!comparisonPlayer) {
        return;
      }


      setResultSubmitted(true);


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

    if (!resultSubmitted) {
      return;
    }


    // Manual challenge ends immediately
    if (
      manualChallenge === true
    ) {
      return;
    }


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


    if (
      updatedCount >=
      MAX_H2HS
    ) {

      goToRankings();

      return;
    }


    setComparisonPlayer(null);

    setResultSubmitted(false);

  }, [
    myRankings,
    resultSubmitted,
    category,
    manualChallenge,
    player?.id,
  ]);


  // ==================================================
  // DISPLAY DATA
  // ==================================================

  const currentH2HNumber =
    Math.min(
      automaticComparisonCount + 1,
      MAX_H2HS
    );


  const targetPosition =
    targetPlayer.specificPosition ||
    targetPlayer.position ||
    'Footballer';


  const opponentPosition =
    comparisonPlayer?.specificPosition ||
    comparisonPlayer?.position ||
    'Footballer';


  // ==================================================
  // SCREEN
  // ==================================================

  return (

    <View style={styles.container}>

      {/* HEADER */}

      <View style={styles.header}>

        <Text style={styles.brand}>
          FotRankr
        </Text>

        <View style={styles.brandLine} />

      </View>


      {/* H2H LABEL */}

      <Text style={styles.headline}>
        HEAD TO HEAD
      </Text>


      <View style={styles.categoryPill}>

        <Text style={styles.categoryText}>
          {category?.toUpperCase()}
        </Text>

      </View>


      {/* PROGRESS */}

      {manualChallenge !== true && (

        <View style={styles.progressContainer}>

          <Text style={styles.progressLabel}>
            RANKING PROGRESS
          </Text>

          <Text style={styles.progressCount}>
            {currentH2HNumber} / {MAX_H2HS}
          </Text>

          <View style={styles.progressTrack}>

            <View
              style={[
                styles.progressFill,
                {
                  width:
                    `${(currentH2HNumber / MAX_H2HS) * 100}%`,
                },
              ]}
            />

          </View>

        </View>

      )}


      {/* COMPARISON */}

      {comparisonPlayer &&
      !resultSubmitted &&
      !sessionFinished ? (

        <View style={styles.mainContent}>

          <Text style={styles.question}>
            WHO IS BETTER?
          </Text>

          <Text style={styles.instruction}>
            Tap the player you rate higher
          </Text>


          {/* PLAYER CARDS */}

          <View style={styles.playersRow}>

            {/* TARGET */}

            <View style={styles.playerColumn}>

              <TouchableOpacity
                style={styles.playerCard}
                onPress={() =>
                  updateScores('player')
                }
                activeOpacity={0.8}
                disabled={resultSubmitted}
              >

                <View style={styles.playerInitial}>

                  <Text style={styles.initialText}>
                    {targetPlayer.name
                      ?.charAt(0)
                      ?.toUpperCase()}
                  </Text>

                </View>

                <Text style={styles.playerName}>
                  {targetPlayer.name}
                </Text>

                <Text style={styles.playerPosition}>
                  {targetPosition}
                </Text>

                <View style={styles.chooseBadge}>

                  <Text style={styles.chooseText}>
                    CHOOSE
                  </Text>

                </View>

              </TouchableOpacity>

            </View>


            {/* VS */}

            <View style={styles.vsContainer}>

              <View style={styles.vsLine} />

              <View style={styles.vsCircle}>

                <Text style={styles.vsText}>
                  VS
                </Text>

              </View>

              <View style={styles.vsLine} />

            </View>


            {/* OPPONENT */}

            <View style={styles.playerColumn}>

              <TouchableOpacity
                style={styles.playerCard}
                onPress={() =>
                  updateScores('comparison')
                }
                activeOpacity={0.8}
                disabled={resultSubmitted}
              >

                <View style={styles.playerInitial}>

                  <Text style={styles.initialText}>
                    {comparisonPlayer.name
                      ?.charAt(0)
                      ?.toUpperCase()}
                  </Text>

                </View>

                <Text style={styles.playerName}>
                  {comparisonPlayer.name}
                </Text>

                <Text style={styles.playerPosition}>
                  {opponentPosition}
                </Text>

                <View style={styles.chooseBadge}>

                  <Text style={styles.chooseText}>
                    CHOOSE
                  </Text>

                </View>

              </TouchableOpacity>

            </View>

          </View>


          {/* DRAW */}

          <TouchableOpacity
            style={styles.drawButton}
            onPress={() =>
              updateScores('equal')
            }
            disabled={resultSubmitted}
            activeOpacity={0.8}
          >

            <Text style={styles.drawTitle}>
              THEY'RE EQUAL
            </Text>

            <Text style={styles.drawSubtitle}>
              I can't separate them
            </Text>

          </TouchableOpacity>


          <Text style={styles.footerHint}>
            Your choice helps determine their position
            within the {category} category.
          </Text>

        </View>

      ) : (

        /* PROCESSING / COMPLETE */

        <View style={styles.statusContainer}>

          <View style={styles.statusIcon}>

            <Text style={styles.statusIconText}>
              ✓
            </Text>

          </View>


          <Text style={styles.statusTitle}>

            {resultSubmitted
              ? 'PROCESSING'
              : sessionFinished
                ? (
                    automaticComparisonCount >=
                    MAX_H2HS
                      ? 'H2H COMPLETE'
                      : 'NO MORE COMPARISONS'
                  )
                : 'FINDING MATCH'}

          </Text>


          <Text style={styles.statusText}>

            {resultSubmitted
              ? 'Updating your rankings and finding the next comparison...'
              : sessionFinished
                ? (
                    automaticComparisonCount >=
                    MAX_H2HS
                      ? `FotRankr has completed ${MAX_H2HS} intelligent comparisons for ${targetPlayer.name}.`
                      : 'There are no more eligible opponents available.'
                  )
                : 'Finding the most useful comparison for you...'}

          </Text>


          <TouchableOpacity
            style={styles.backButton}
            onPress={goToRankings}
            activeOpacity={0.8}
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
      paddingHorizontal: 20,
    },


    // ==================================================
    // HEADER
    // ==================================================

    header: {
      paddingTop: 45,
      marginBottom: 20,
    },

    brand: {
      color: '#00ff66',
      fontSize: 25,
      fontWeight: '900',
      letterSpacing: -1,
    },

    brandLine: {
      width: 32,
      height: 3,
      backgroundColor: '#00ff66',
      marginTop: 7,
      borderRadius: 2,
    },


    // ==================================================
    // TITLE
    // ==================================================

    headline: {
      color: '#ffffff',
      fontSize: 34,
      fontWeight: '900',
      letterSpacing: -1.5,
      textAlign: 'center',
    },

    categoryPill: {
      alignSelf: 'center',
      backgroundColor: '#0d0d0d',
      borderWidth: 1,
      borderColor: '#00ff66',
      borderRadius: 20,
      paddingHorizontal: 15,
      paddingVertical: 7,
      marginTop: 10,
    },

    categoryText: {
      color: '#00ff66',
      fontSize: 11,
      fontWeight: '900',
      letterSpacing: 1.2,
    },


    // ==================================================
    // PROGRESS
    // ==================================================

    progressContainer: {
      marginTop: 25,
      marginBottom: 20,
    },

    progressLabel: {
      color: '#666666',
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 1.2,
    },

    progressCount: {
      color: '#ffffff',
      fontSize: 13,
      fontWeight: '800',
      position: 'absolute',
      right: 0,
      top: -3,
    },

    progressTrack: {
      height: 5,
      backgroundColor: '#1b1b1b',
      borderRadius: 5,
      marginTop: 9,
      overflow: 'hidden',
    },

    progressFill: {
      height: '100%',
      backgroundColor: '#00ff66',
      borderRadius: 5,
    },


    // ==================================================
    // MAIN
    // ==================================================

    mainContent: {
      flex: 1,
      justifyContent: 'center',
      paddingBottom: 25,
    },

    question: {
      color: '#ffffff',
      fontSize: 27,
      fontWeight: '900',
      textAlign: 'center',
      letterSpacing: -0.5,
    },

    instruction: {
      color: '#666666',
      fontSize: 14,
      textAlign: 'center',
      marginTop: 7,
      marginBottom: 25,
    },


    // ==================================================
    // PLAYER CARDS
    // ==================================================

    playersRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    playerColumn: {
      flex: 1,
    },

    playerCard: {
      backgroundColor: '#111111',
      borderRadius: 18,
      borderWidth: 1,
      borderColor: '#252525',
      minHeight: 220,
      padding: 15,
      alignItems: 'center',
      justifyContent: 'center',
    },

    playerInitial: {
      width: 62,
      height: 62,
      borderRadius: 31,
      backgroundColor: '#00ff66',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },

    initialText: {
      color: '#000000',
      fontSize: 27,
      fontWeight: '900',
    },

    playerName: {
      color: '#ffffff',
      fontSize: 18,
      fontWeight: '900',
      textAlign: 'center',
    },

    playerPosition: {
      color: '#666666',
      fontSize: 11,
      fontWeight: '700',
      textAlign: 'center',
      marginTop: 6,
      textTransform: 'uppercase',
    },

    chooseBadge: {
      borderWidth: 1,
      borderColor: '#00ff66',
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
      marginTop: 16,
    },

    chooseText: {
      color: '#00ff66',
      fontSize: 9,
      fontWeight: '900',
      letterSpacing: 1,
    },


    // ==================================================
    // VS
    // ==================================================

    vsContainer: {
      width: 42,
      alignItems: 'center',
      justifyContent: 'center',
    },

    vsLine: {
      width: 1,
      height: 25,
      backgroundColor: '#252525',
    },

    vsCircle: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: '#050505',
      borderWidth: 1,
      borderColor: '#333333',
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 7,
    },

    vsText: {
      color: '#ffffff',
      fontSize: 11,
      fontWeight: '900',
    },


    // ==================================================
    // DRAW
    // ==================================================

    drawButton: {
      backgroundColor: '#0d0d0d',
      borderWidth: 1,
      borderColor: '#292929',
      borderRadius: 13,
      paddingVertical: 15,
      alignItems: 'center',
      marginTop: 16,
    },

    drawTitle: {
      color: '#dddddd',
      fontSize: 14,
      fontWeight: '900',
    },

    drawSubtitle: {
      color: '#555555',
      fontSize: 11,
      marginTop: 4,
    },


    // ==================================================
    // FOOTER
    // ==================================================

    footerHint: {
      color: '#444444',
      fontSize: 11,
      lineHeight: 17,
      textAlign: 'center',
      marginTop: 15,
      paddingHorizontal: 20,
    },


    // ==================================================
    // STATUS
    // ==================================================

    statusContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },

    statusIcon: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: '#00ff66',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },

    statusIconText: {
      color: '#000000',
      fontSize: 32,
      fontWeight: '900',
    },

    statusTitle: {
      color: '#ffffff',
      fontSize: 25,
      fontWeight: '900',
      textAlign: 'center',
    },

    statusText: {
      color: '#777777',
      fontSize: 14,
      lineHeight: 21,
      textAlign: 'center',
      marginTop: 10,
      maxWidth: 320,
    },

    backButton: {
      backgroundColor: '#00ff66',
      borderRadius: 12,
      paddingVertical: 15,
      paddingHorizontal: 25,
      marginTop: 25,
    },

    backButtonText: {
      color: '#000000',
      fontSize: 13,
      fontWeight: '900',
      letterSpacing: 0.4,
    },

  });


