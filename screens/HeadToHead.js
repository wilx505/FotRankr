import { displayPosition } from '../utils/positions';

import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useIsFocused } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';

import {
  MARGINS,
  findCheckups,
  nextPlacementOpponent,
  promotionMatch,
} from '../engine/scoring';

import {
  getFlag,
  getMarkerText,
} from '../utils/flags';


// ======================================================
// HEAD TO HEAD
// ======================================================
//
// Automatic ranking (from Compare):
//   1. PLACEMENT  - narrowing-down head-to-heads inside the
//                   player's category (engine/scoring.js)
//   2. PROMOTION / RELEGATION match if they beat (or lost
//                   to) everyone in the category
//   3. CHECK-UPS  - re-ask contradictions / near-ties
//                   (skippable)
//
// Manual challenge (from Challenge): one head-to-head.
//
// Every answer is a winner + margin (slightly / clearly /
// much) or "equal". App saves it and recalculates scores.
// ======================================================

export default function HeadToHead({
  route,
  navigation,
  onResult,
  onMoveCategory,
  myRankings,
  comparisonHistory,
}) {
  const isFocused = useIsFocused();

  const {
    player,
    category: startCategory,
    comparisonPlayer: manualOpponent,
    manualChallenge,
  } = route.params || {};


  // ==================================================
  // CONSTANTS
  // ==================================================

  // Automatic placement head-to-heads per category.
  const MAX_H2HS = 6;

  // Closes the ranking screens (Compare or Challenge, then
  // this one) so the user lands back where they started:
  // Search, Home, a list, My Ranks...
  const finishedRef = useRef(false);

  const finishRanking = () => {

    // Effects can call this more than once; popping twice
    // would close the screen the user came from too.
    if (finishedRef.current) {
      return;
    }

    finishedRef.current = true;

    const { routes, index } = navigation.getState();

    const earlier = routes
      .slice(0, index)
      .map(route => route.name);

    const startIndex = Math.max(
      earlier.lastIndexOf('Compare'),
      earlier.lastIndexOf('Challenge')
    );

    if (startIndex > 0) {
      navigation.pop(index - startIndex + 1);
    } else {
      navigation.goBack();
    }
  };


  // ==================================================
  // STATE
  // ==================================================

  // Category being ranked in (changes on promotion).
  const [category, setCategory] =
    useState(startCategory);

  // This session's placement answers in `category`:
  // [{ opponentId, outcome: 'win' | 'loss' | 'draw' }]
  const [sessionResults, setSessionResults] =
    useState([]);

  // What's on screen:
  // { kind: 'placement' | 'special' | 'checkup' | 'challenge',
  //   opponent, special?, reason? }
  const [match, setMatch] = useState(null);

  // Winner tapped, waiting for "how much better".
  const [pendingWinner, setPendingWinner] =
    useState(null);

  // Answer sent; wait for App's updated rankings.
  const [waiting, setWaiting] = useState(false);

  const [specialDone, setSpecialDone] = useState(false);

  // null = not worked out yet.
  const [checkups, setCheckups] = useState(null);

  const [finished, setFinished] = useState(false);

  // Challenge only: the ball is shot into the winner's net,
  // then their card is highlighted, then the answer saves.
  // 'player' | 'comparison' | null
  const [scorer, setScorer] = useState(null);

  const [rowWidth, setRowWidth] = useState(0);

  const ballX = useRef(new Animated.Value(0)).current;
  const ballSpin = useRef(new Animated.Value(0)).current;

  // Goal celebration.
  const netShake = useRef(new Animated.Value(0)).current;
  const flash = useRef(new Animated.Value(0)).current;
  const goalPop = useRef(new Animated.Value(0)).current;
  const burst = useRef(new Animated.Value(0)).current;

  const NET_WIDTH = 24;

  const shootThenSubmit = (result, margin) => {

    if (
      match?.kind !== 'challenge' ||
      result === 'equal' ||
      !rowWidth
    ) {
      submit(result, margin);
      return;
    }

    // From the middle of the row to the middle of the net.
    const distance = rowWidth / 2 - NET_WIDTH / 2;

    setPendingWinner(null);
    setScorer(result);

    ballX.setValue(0);
    ballSpin.setValue(0);
    netShake.setValue(0);
    flash.setValue(0);
    goalPop.setValue(0);
    burst.setValue(0);

    const SHOT_MS = 260;

    Animated.parallel([
      Animated.timing(ballX, {
        toValue: result === 'player' ? -distance : distance,
        duration: SHOT_MS,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(ballSpin, {
        toValue: 1,
        duration: SHOT_MS,
        useNativeDriver: true,
      }),
    ]).start(() => {

      // GOAL: net ripples, screen flashes, GOAL! pops up,
      // confetti bursts out of the net.
      Animated.parallel([
        Animated.sequence(
          [6, -6, 5, -5, 3, -3, 0].map(offset =>
            Animated.timing(netShake, {
              toValue: offset,
              duration: 45,
              useNativeDriver: true,
            })
          )
        ),
        Animated.sequence([
          Animated.timing(flash, {
            toValue: 1,
            duration: 90,
            useNativeDriver: true,
          }),
          Animated.timing(flash, {
            toValue: 0,
            duration: 380,
            useNativeDriver: true,
          }),
        ]),
        Animated.spring(goalPop, {
          toValue: 1,
          friction: 4,
          tension: 120,
          useNativeDriver: true,
        }),
        Animated.timing(burst, {
          toValue: 1,
          duration: 750,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();

      // Let the goal sink in, then save.
      setTimeout(() => {
        setScorer(null);
        ballX.setValue(0);
        goalPop.setValue(0);
        burst.setValue(0);
        submit(result, margin);
      }, 1100);
    });
  };


  // ==================================================
  // TARGET (always the saved ranking)
  // ==================================================

  const targetPlayer =
    (myRankings || []).find(
      ranking =>
        String(ranking.id) === String(player?.id)
    ) || player;

  const placementCount =
    targetPlayer?.h2hCategory === category
      ? targetPlayer?.h2hCount ?? 0
      : 0;


  // ==================================================
  // WHAT'S NEXT
  // ==================================================

  const decideNext = () => {

    // ---- Manual challenge: one match only.
    if (manualChallenge === true) {

      const opponent = (myRankings || []).find(
        ranking =>
          String(ranking.id) === String(manualOpponent?.id)
      );

      if (!opponent || match) {
        setFinished(true);
        return;
      }

      setMatch({ kind: 'challenge', opponent });
      return;
    }


    // ---- 1. Placement
    if (placementCount < MAX_H2HS) {

      const opponent = nextPlacementOpponent({
        target: targetPlayer,
        category,
        rankings: myRankings,
        sessionResults,
      });

      if (opponent) {
        setMatch({ kind: 'placement', opponent });
        return;
      }
    }


    // ---- 2. Promotion / relegation
    if (!specialDone) {

      const special = promotionMatch({
        target: targetPlayer,
        category,
        rankings: myRankings,
        sessionResults,
      });

      if (special) {
        setMatch({
          kind: 'special',
          opponent: special.opponent,
          special,
        });
        return;
      }

      setSpecialDone(true);
    }


    // ---- 3. Check-ups
    const queue = checkups ?? findCheckups({
      target: targetPlayer,
      category,
      rankings: myRankings,
      comparisonHistory,
    });

    if (checkups === null) {
      setCheckups(queue);
    }

    if (queue.length > 0) {
      setMatch({
        kind: 'checkup',
        opponent: queue[0].opponent,
        reason: queue[0].reason,
      });
      return;
    }


    // ---- Done
    setMatch(null);
    setFinished(true);
  };


  // Pick the next match whenever we're free to.
  useEffect(() => {

    if (!isFocused || waiting || match || finished) {
      return;
    }

    decideNext();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isFocused,
    waiting,
    match,
    finished,
    category,
    specialDone,
    checkups,
  ]);


  // App has saved the answer and recalculated scores.
  useEffect(() => {

    if (waiting) {
      setWaiting(false);
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myRankings]);


  // Automatic ranking closes itself when finished.
  useEffect(() => {

    if (finished && manualChallenge !== true) {
      finishRanking();
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);


  // ==================================================
  // ANSWER
  // ==================================================

  // result: 'player' (target better) | 'comparison' |
  // 'equal'. margin: 'slight' | 'clear' | 'much' | null.
  const submit = (result, margin) => {

    if (!match || waiting) {
      return;
    }

    const current = match;

    setPendingWinner(null);
    setWaiting(true);
    setMatch(null);

    onResult({
      player: targetPlayer,
      comparisonPlayer: current.opponent,
      category,
      result,
      margin,
      kind: current.kind,
    });

    const outcome =
      result === 'player'
        ? 'win'
        : result === 'comparison'
          ? 'loss'
          : 'draw';


    if (current.kind === 'placement') {

      setSessionResults(previous => [
        ...previous,
        {
          opponentId: current.opponent.id,
          outcome,
        },
      ]);

    } else if (current.kind === 'special') {

      const { type, toCategory } = current.special;

      const moves =
        (type === 'promotion' && outcome === 'win') ||
        (type === 'relegation' && outcome === 'loss');

      if (moves) {

        // Start again in the new category.
        onMoveCategory({
          player: targetPlayer,
          toCategory,
        });

        setCategory(toCategory);

        // The promotion/relegation match already says where
        // they sit against that player: count it.
        setSessionResults([
          {
            opponentId: current.opponent.id,
            outcome,
          },
        ]);
        setCheckups(null);
        setSpecialDone(false);

      } else {

        setSpecialDone(true);

      }

    } else if (current.kind === 'checkup') {

      setCheckups(previous => (previous || []).slice(1));

    } else if (current.kind === 'challenge') {

      setFinished(true);

    }
  };


  const skipCheckups = () => {
    setMatch(null);
    setCheckups([]);
  };


  // ==================================================
  // DISPLAY DATA
  // ==================================================

  const opponent = match?.opponent;

  // Shown under the name. "Centre-Forward" reads as Striker.
  const positionOf = someone => {

    const position =
      someone?.specificPosition ||
      someone?.position ||
      'Footballer';

    return displayPosition(position);
  };

  const winnerName =
    pendingWinner === 'player'
      ? targetPlayer?.name
      : opponent?.name;


  const banner =
    match?.kind === 'special'
      ? match.special.type === 'promotion'
        ? {
            title: 'PROMOTION MATCH',
            text: `${targetPlayer?.name} beat everyone above them. Win this to move up to ${match.special.toCategory}.`,
          }
        : {
            title: 'RELEGATION MATCH',
            text: `${targetPlayer?.name} lost to everyone below them. Lose this and they drop to ${match.special.toCategory}.`,
          }
    : match?.kind === 'checkup'
      ? {
          title: 'QUICK CHECK',
          text:
            match.reason === 'contradiction'
              ? 'Your answers disagree here. Who is better?'
              : 'These two are almost tied. Who is better?',
        }
      : null;


  // A goal drawn with Views: posts + crossbar, open towards
  // the pitch, with a mesh of thin lines. Lights up on a goal.
  const renderNet = (side, scored) => (

    <Animated.View
      style={[
        styles.net,
        side === 'left' ? styles.netLeft : styles.netRight,
        scored && styles.netScored,
        scored && { transform: [{ translateX: netShake }] },
      ]}
    >

      {[0, 1, 2, 3, 4, 5, 6].map(row => (
        <View
          key={`h${row}`}
          style={[
            styles.netLineH,
            { top: `${(row + 1) * 12.5}%` },
            scored && styles.netLineScored,
          ]}
        />
      ))}

      {[0, 1].map(column => (
        <View
          key={`v${column}`}
          style={[
            styles.netLineV,
            { left: `${(column + 1) * 33}%` },
            scored && styles.netLineScored,
          ]}
        />
      ))}

    </Animated.View>

  );


  // Confetti flying out of the scoring net.
  const CONFETTI = [
    { icon: '⚽', x: 70, y: -80 },
    { icon: '🎉', x: 110, y: -20 },
    { icon: '✨', x: 90, y: 60 },
    { icon: '⭐', x: 40, y: 100 },
    { icon: '🎉', x: 50, y: -120 },
    { icon: '✨', x: 130, y: 30 },
    { icon: '⭐', x: 100, y: -60 },
    { icon: '⚽', x: 30, y: 70 },
  ];

  const renderConfetti = side => (

    <View
      pointerEvents="none"
      style={[
        styles.confettiOrigin,
        side === 'left' ? { left: 12 } : { right: 12 },
      ]}
    >

      {CONFETTI.map((piece, index) => {

        // Out from the net, towards the pitch.
        const direction = side === 'left' ? 1 : -1;

        return (
          <Animated.Text
            key={index}
            style={[
              styles.confetti,
              {
                opacity: burst.interpolate({
                  inputRange: [0, 0.15, 0.75, 1],
                  outputRange: [0, 1, 1, 0],
                }),
                transform: [
                  {
                    translateX: burst.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, piece.x * direction],
                    }),
                  },
                  {
                    translateY: burst.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, piece.y],
                    }),
                  },
                  {
                    scale: burst.interpolate({
                      inputRange: [0, 0.3, 1],
                      outputRange: [0.4, 1.3, 0.9],
                    }),
                  },
                ],
              },
            ]}
          >
            {piece.icon}
          </Animated.Text>
        );
      })}

    </View>

  );


  const renderCard = (someone, result) => (

    <View style={styles.playerColumn}>

      <TouchableOpacity
        style={[
          styles.playerCard,
          pendingWinner === result && styles.playerCardChosen,
          scorer === result && styles.playerCardScored,
        ]}
        onPress={() => setPendingWinner(result)}
        activeOpacity={0.8}
        disabled={waiting || !!scorer}
      >

        <View style={styles.playerInitial}>

          <Text
            style={
              getFlag(someone.nation)
                ? styles.initialFlag
                : styles.initialText
            }
          >
            {getFlag(someone.nation) ||
              getMarkerText(someone)}
          </Text>

        </View>

        <Text style={styles.playerName}>
          {someone.name}
        </Text>

        <Text style={styles.playerPosition}>
          {positionOf(someone)}
        </Text>

        <View style={styles.chooseBadge}>

          <Text style={styles.chooseText}>
            {scorer === result
              ? 'GOAL!'
              : pendingWinner === result
                ? 'CHOSEN'
                : 'CHOOSE'}
          </Text>

        </View>

      </TouchableOpacity>

    </View>

  );


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


      {opponent && targetPlayer ? (

        <View style={styles.mainContent}>

          {banner && (

            <View style={styles.banner}>

              <Text style={styles.bannerTitle}>
                {banner.title}
              </Text>

              <Text style={styles.bannerText}>
                {banner.text}
              </Text>

            </View>

          )}


          <Text style={styles.question}>
            {pendingWinner
              ? `HOW MUCH BETTER IS ${winnerName?.toUpperCase()}?`
              : 'WHO IS BETTER?'}
          </Text>

          <Text style={styles.instruction}>
            {pendingWinner
              ? 'Pick how decisive it is'
              : 'Tap the player you rate higher'}
          </Text>


          {/* PLAYER CARDS */}

          <View
            style={styles.playersRow}
            onLayout={event =>
              setRowWidth(event.nativeEvent.layout.width)
            }
          >

            {match.kind === 'challenge' &&
              renderNet('left', scorer === 'player')}

            {renderCard(targetPlayer, 'player')}


            {match.kind === 'challenge' ? (

              /* BALL */

              <View style={[styles.vsContainer, styles.ballLayer]}>

                <Animated.Text
                  style={[
                    styles.ball,
                    {
                      transform: [
                        { translateX: ballX },
                        {
                          rotate: ballSpin.interpolate({
                            inputRange: [0, 1],
                            outputRange: [
                              '0deg',
                              scorer === 'player'
                                ? '-720deg'
                                : '720deg',
                            ],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  ⚽
                </Animated.Text>

              </View>

            ) : (

              /* VS */

              <View style={styles.vsContainer}>

                <View style={styles.vsLine} />

                <View style={styles.vsCircle}>

                  <Text style={styles.vsText}>
                    VS
                  </Text>

                </View>

                <View style={styles.vsLine} />

              </View>

            )}


            {renderCard(opponent, 'comparison')}

            {match.kind === 'challenge' &&
              renderNet('right', scorer === 'comparison')}

            {scorer &&
              renderConfetti(
                scorer === 'player' ? 'left' : 'right'
              )}

          </View>


          {pendingWinner ? (

            /* HOW MUCH BETTER */

            <View>

              <View style={styles.marginRow}>

                {Object.entries(MARGINS).map(([key, info]) => (

                  <TouchableOpacity
                    key={key}
                    style={styles.marginButton}
                    onPress={() => shootThenSubmit(pendingWinner, key)}
                    disabled={waiting || !!scorer}
                    activeOpacity={0.8}
                  >

                    <Text style={styles.marginText}>
                      {info.label}
                    </Text>

                  </TouchableOpacity>

                ))}

              </View>

              <TouchableOpacity
                onPress={() => setPendingWinner(null)}
                activeOpacity={0.7}
              >

                <Text style={styles.changePick}>
                  ‹ CHANGE PICK
                </Text>

              </TouchableOpacity>

            </View>

          ) : (

            /* DRAW */

            <TouchableOpacity
              style={styles.drawButton}
              onPress={() => submit('equal', null)}
              disabled={waiting || !!scorer}
              activeOpacity={0.8}
            >

              <Text style={styles.drawTitle}>
                THEY'RE EQUAL
              </Text>

              <Text style={styles.drawSubtitle}>
                I can't separate them
              </Text>

            </TouchableOpacity>

          )}


          {match.kind === 'checkup' ? (

            <TouchableOpacity
              onPress={skipCheckups}
              activeOpacity={0.7}
            >

              <Text style={styles.skipText}>
                SKIP CHECK
              </Text>

            </TouchableOpacity>

          ) : (

            <Text style={styles.footerHint}>
              Your choice helps determine their position
              within the {category} category.
            </Text>

          )}

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
            {finished
              ? manualChallenge === true
                ? 'RESULT SAVED'
                : 'H2H COMPLETE'
              : 'FINDING MATCH'}
          </Text>


          <Text style={styles.statusText}>
            {finished
              ? manualChallenge === true
                ? 'Your rankings have been updated.'
                : `${targetPlayer?.name} has been placed.`
              : 'Finding the most useful comparison for you...'}
          </Text>


          <TouchableOpacity
            style={styles.backButton}
            onPress={finishRanking}
            activeOpacity={0.8}
          >

            <Text style={styles.backButtonText}>
              DONE
            </Text>

          </TouchableOpacity>

        </View>

      )}


      {/* GOAL! (challenge celebration) */}

      {scorer && (

        <View
          pointerEvents="none"
          style={styles.goalLayer}
        >

          <Animated.View
            style={[
              styles.goalFlash,
              { opacity: flash.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.35],
              }) },
            ]}
          />

          <Animated.Text
            style={[
              styles.goalText,
              {
                opacity: goalPop,
                transform: [
                  {
                    scale: goalPop.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            GOAL!
          </Animated.Text>

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
      color: '#555555',
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.2,
      lineHeight: 15,
      textTransform: 'uppercase',
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

    initialFlag: {
      fontSize: 32,
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
      color: '#555555',
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.2,
      lineHeight: 15,
      textTransform: 'uppercase',
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

    // ==================================================
    // V2: CHOSEN CARD, MARGIN, BANNERS
    // ==================================================

    playerCardScored: {
      borderColor: '#FFD700',
      backgroundColor: '#1f1a08',
    },

    ball: {
      fontSize: 30,
    },

    confettiOrigin: {
      position: 'absolute',
      top: '50%',
      width: 1,
      height: 1,
      zIndex: 20,
      elevation: 20,
    },

    confetti: {
      position: 'absolute',
      fontSize: 22,
      left: -11,
      top: -14,
    },

    goalLayer: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 30,
      elevation: 30,
    },

    goalFlash: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: -20,
      right: -20,
      backgroundColor: '#00ff66',
    },

    goalText: {
      color: '#FFD700',
      fontSize: 64,
      fontWeight: '900',
      letterSpacing: 2,
      textShadowColor: '#000000',
      textShadowRadius: 12,
      textShadowOffset: { width: 0, height: 3 },
    },

    ballLayer: {
      zIndex: 10,
      elevation: 10,
    },

    net: {
      width: 24,
      height: 120,
      borderColor: '#dddddd',
      borderTopWidth: 3,
      borderBottomWidth: 1,
      backgroundColor: '#0b0b0b',
      overflow: 'hidden',
    },

    netLeft: {
      borderLeftWidth: 3,
      borderTopLeftRadius: 3,
      marginRight: 4,
    },

    netRight: {
      borderRightWidth: 3,
      borderTopRightRadius: 3,
      marginLeft: 4,
    },

    netScored: {
      borderColor: '#00ff66',
      backgroundColor: '#0d2b18',
    },

    netLineH: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: 1,
      backgroundColor: '#333333',
    },

    netLineV: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: 1,
      backgroundColor: '#333333',
    },

    netLineScored: {
      backgroundColor: '#00ff66',
    },

    playerCardChosen: {
      borderColor: '#00ff66',
      backgroundColor: '#0d1f14',
    },

    marginRow: {
      flexDirection: 'row',
      marginTop: 16,
      marginHorizontal: -4,
    },

    marginButton: {
      flex: 1,
      backgroundColor: '#00ff66',
      borderRadius: 12,
      paddingVertical: 15,
      alignItems: 'center',
      marginHorizontal: 4,
    },

    marginText: {
      color: '#000000',
      fontSize: 12,
      fontWeight: '900',
      letterSpacing: 0.8,
    },

    changePick: {
      color: '#777777',
      fontSize: 11,
      fontWeight: '900',
      letterSpacing: 1,
      textAlign: 'center',
      marginTop: 14,
    },

    banner: {
      backgroundColor: '#14110a',
      borderWidth: 1,
      borderColor: '#D4AF37',
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 14,
      marginBottom: 18,
    },

    bannerTitle: {
      color: '#FFE58A',
      fontSize: 11,
      fontWeight: '900',
      letterSpacing: 1.3,
      textAlign: 'center',
    },

    bannerText: {
      color: '#cccccc',
      fontSize: 12,
      lineHeight: 17,
      textAlign: 'center',
      marginTop: 4,
    },

    skipText: {
      color: '#777777',
      fontSize: 11,
      fontWeight: '900',
      letterSpacing: 1,
      textAlign: 'center',
      marginTop: 16,
    },

  });
