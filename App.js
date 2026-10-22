import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  NavigationContainer,
} from '@react-navigation/native';

import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';

import {
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import AddPlayersToListScreen from './screens/AddPlayersToListScreen';
import BackupScreen from './screens/BackupScreen';
import BestXIScreen from './screens/BestXIScreen';
import BestXIsScreen from './screens/BestXIsScreen';
import ChallengeScreen from './screens/ChallengeScreen';
import ClubRankingsScreen from './screens/ClubRankingsScreen';
import CompareScreen from './screens/CompareScreen';
import CreateListScreen from './screens/CreateListScreen';
import HeadToHead from './screens/HeadToHead';
import HomeScreen from './screens/HomeScreen';
import ListDetailScreen from './screens/ListDetailScreen';
import ListsScreen from './screens/ListsScreen';
import ProfileScreen from './screens/ProfileScreen';
import RankingsScreen from './screens/RankingsScreen';
import SearchScreen from './screens/SearchScreen';

import {
  Alert,
  View,
} from 'react-native';

import {
  createPlayer,
} from './engine/rankingEngine.js';

import {
  CATEGORY_ORDER,
  recomputeScores,
} from './engine/scoring';

import {
  getSourcePlayer,
  normaliseList,
} from './utils/listHelpers';

import {
  UNKNOWN_CATEGORY,
  clubKey,
  getClubsCompletedNow,
  getGoldClubsNow,
  getLeaguesCompletedNow,
  getProgress,
  getRankedIdsNow,
  isUnknown,
  setEarnedHistory,
  unlockName,
} from './utils/progression';

import { getBadges } from './utils/badges';

import { saveAutoBackup } from './utils/autoBackup';

import BadgeToast from './components/BadgeToast';


const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// A ranked player with position/club/nation updated from the
// current players data. Rating, score and category are kept.
const refreshPlayerDetails = rankedPlayer => {

  const source = getSourcePlayer(rankedPlayer.id);

  if (!source) {
    return rankedPlayer;
  }

  return {
    ...rankedPlayer,
    nation: source.nation || rankedPlayer.nation,
    position: source.position || rankedPlayer.position,
    specificPosition:
      source.specificPosition ||
      rankedPlayer.specificPosition,
    club: source.club ?? rankedPlayer.club,
  };
};

const EMPTY_EARNED = {
  rankedIds: [],
  clubKeys: [],
  goldClubKeys: [],
  leagueKeys: [],
};

const DATA_VERSION = '62';


export default function App() {

  // =====================================================
  // STATE
  // =====================================================

  // Saved rankings (category, counts...). Scores are NOT
  // trusted from here: see myRankings below.
  const [rankingsState, setMyRankings] = useState([]);

  const [lists, setLists] = useState([]);

  const [comparisonHistory, setComparisonHistory] =
    useState([]);

  // Every score is worked out from the categories + the
  // WHOLE head-to-head history (engine/scoring.js), so any
  // change to either (an answer, a category move, Rank Again,
  // "I do not know") rescores everyone automatically.
  const myRankings = useMemo(
    () => recomputeScores(rankingsState, comparisonHistory),
    [rankingsState, comparisonHistory]
  );

  const [smartH2HSession, setSmartH2HSession] =
    useState(null);

  const [dataLoaded, setDataLoaded] =
    useState(false);

  // { username, photoUri, createdAt } or null.
  // Not cleared by a DATA_VERSION change.
  const [profile, setProfile] =
    useState(null);

  // Badges waiting to be shown as notifications.
  const [badgeQueue, setBadgeQueue] =
    useState([]);

  // Every player ever properly ranked + every club ever
  // completed, so XP and badges can't be lost (Rank Again,
  // marking Unknown). Cleared with the rankings on a
  // DATA_VERSION change.
  const [earnedHistory, setEarnedHistoryState] =
    useState(EMPTY_EARNED);

  // Hand the record to utils/progression before any screen
  // (or alert) asks for XP in this render.
  const earnedRef = useRef(null);

  if (earnedRef.current !== earnedHistory) {
    setEarnedHistory(earnedHistory);
    earnedRef.current = earnedHistory;
  }


  // =====================================================
  // LOAD DATA
  // =====================================================

  useEffect(() => {

    const loadData = async () => {

      try {

        const savedProfile =
          await AsyncStorage.getItem(
            'fotrankrProfile'
          );

        if (savedProfile) {
          setProfile(JSON.parse(savedProfile));
        }


        const savedVersion =
          await AsyncStorage.getItem(
            'fotrankrDataVersion'
          );


        // =================================================
        // DATA VERSION
        // =================================================
        // A new version NEVER deletes data. (It used to wipe
        // everything, which is how rankings got lost.) Add
        // migrations here if the saved format ever changes.
        // To start fresh, use RESET ALL DATA on the Backup
        // screen.

        if (savedVersion !== DATA_VERSION) {

          console.log(
            'FotRankr: data version',
            savedVersion,
            '->',
            DATA_VERSION,
            '(data kept)'
          );

        }


        // =================================================
        // LOAD EARNED XP / BADGES RECORD
        // =================================================

        const savedProgress =
          await AsyncStorage.getItem(
            'fotrankrProgress'
          );

        if (savedProgress) {

          const parsedProgress =
            JSON.parse(savedProgress);

          setEarnedHistoryState({
            rankedIds: parsedProgress.rankedIds || [],
            clubKeys: parsedProgress.clubKeys || [],
            goldClubKeys: parsedProgress.goldClubKeys || [],
            leagueKeys: parsedProgress.leagueKeys || [],
          });

        }


        // =================================================
        // LOAD RANKINGS
        // =================================================

        const savedRankings =
          await AsyncStorage.getItem(
            'myRankings'
          );

        if (savedRankings) {

          const parsed =
            JSON.parse(savedRankings);

          if (Array.isArray(parsed)) {

            // Position, club and nation come from the latest
            // player data (squad updates, position fixes).
            // Score, category and rating are left alone.
            setMyRankings(
              parsed.map(refreshPlayerDetails)
            );

          }

        }


        // =================================================
        // LOAD LISTS
        // =================================================

        const savedLists =
          await AsyncStorage.getItem(
            'fotrankrLists'
          );

        if (savedLists) {

          const parsedLists =
            JSON.parse(savedLists);

          if (Array.isArray(parsedLists)) {

            // Converts old lists ({ players: [...] })
            // into the new shape ({ playerIds: [...] }).
            setLists(
              parsedLists.map(normaliseList)
            );

          }

        }


        // =================================================
        // LOAD COMPARISON HISTORY
        // =================================================

        const savedHistory =
          await AsyncStorage.getItem(
            'comparisonHistory'
          );

        if (savedHistory) {

          const parsedHistory =
            JSON.parse(savedHistory);

          if (Array.isArray(parsedHistory)) {

            setComparisonHistory(
              parsedHistory
            );

          }

        }


        // =================================================
        // AUTOMATIC SAFETY BACKUP
        // =================================================

        const parseOr = (text, fallback) => {
          try {
            return text ? JSON.parse(text) : fallback;
          } catch (error) {
            return fallback;
          }
        };

        const profileForBackup =
          parseOr(savedProfile, null);

        saveAutoBackup({
          myRankings: parseOr(savedRankings, []),
          fotrankrLists: parseOr(savedLists, []),
          comparisonHistory: parseOr(savedHistory, []),
          fotrankrProgress: parseOr(savedProgress, null),
          fotrankrProfile: profileForBackup
            ? {
                username: profileForBackup.username,
                createdAt: profileForBackup.createdAt,
              }
            : null,
        });


        setDataLoaded(true);

      } catch (error) {

        // dataLoaded stays false, so nothing is saved: an
        // empty list must never overwrite the stored data.
        console.log(
          'Error loading FotRankr:',
          error
        );

        Alert.alert(
          'Could not load your rankings',
          'Your saved data has not been changed. Close and reopen the app. If this keeps happening, take a screenshot of this message.\n\n' +
            String(error?.message || error)
        );

      }

    };


    loadData();

  }, []);


  // =====================================================
  // SAVE DATA
  // =====================================================

  useEffect(() => {

    if (!dataLoaded) {
      return;
    }


    const saveData = async () => {

      try {

        await AsyncStorage.setItem(
          'myRankings',
          JSON.stringify(myRankings)
        );


        await AsyncStorage.setItem(
          'fotrankrLists',
          JSON.stringify(lists)
        );


        await AsyncStorage.setItem(
          'comparisonHistory',
          JSON.stringify(
            comparisonHistory
          )
        );


        await AsyncStorage.setItem(
          'fotrankrDataVersion',
          DATA_VERSION
        );

      } catch (error) {

        console.log(
          'Error saving FotRankr:',
          error
        );

      }

    };


    saveData();

  }, [
    myRankings,
    lists,
    comparisonHistory,
    dataLoaded,
  ]);


  // =====================================================
  // GROW THE EARNED RECORD
  // =====================================================
  // Adds newly ranked players and newly completed clubs.
  // Never removes anything.

  useEffect(() => {

    if (!dataLoaded) {
      return;
    }

    const rankedIds = new Set(earnedHistory.rankedIds);
    const clubKeys = new Set(earnedHistory.clubKeys);
    const goldClubKeys = new Set(earnedHistory.goldClubKeys || []);
    const leagueKeys = new Set(earnedHistory.leagueKeys || []);

    const newIds = getRankedIdsNow(myRankings).filter(
      id => !rankedIds.has(id)
    );

    const newClubs = getClubsCompletedNow(myRankings)
      .map(clubKey)
      .filter(key => !clubKeys.has(key));

    const newGold = getGoldClubsNow(myRankings)
      .map(clubKey)
      .filter(key => !goldClubKeys.has(key));

    const newLeagues = getLeaguesCompletedNow(myRankings)
      .map(entry => entry.league)
      .filter(key => !leagueKeys.has(key));

    if (
      newIds.length === 0 &&
      newClubs.length === 0 &&
      newGold.length === 0 &&
      newLeagues.length === 0
    ) {
      return;
    }

    const updated = {
      rankedIds: [...earnedHistory.rankedIds, ...newIds],
      clubKeys: [...earnedHistory.clubKeys, ...newClubs],
      goldClubKeys: [
        ...(earnedHistory.goldClubKeys || []),
        ...newGold,
      ],
      leagueKeys: [
        ...(earnedHistory.leagueKeys || []),
        ...newLeagues,
      ],
    };

    setEarnedHistoryState(updated);

    AsyncStorage.setItem(
      'fotrankrProgress',
      JSON.stringify(updated)
    ).catch(error =>
      console.log(
        'Error saving FotRankr progress:',
        error
      )
    );

  }, [
    myRankings,
    dataLoaded,
    earnedHistory,
  ]);


  // =====================================================
  // SAVE PROFILE
  // =====================================================

  const handleSaveProfile = (newProfile) => {

    setProfile(newProfile);

    AsyncStorage.setItem(
      'fotrankrProfile',
      JSON.stringify(newProfile)
    ).catch(error =>
      console.log(
        'Error saving FotRankr profile:',
        error
      )
    );

  };


  // =====================================================
  // CLUB COMPLETE / LEVEL UP ALERT
  // =====================================================
  // Compares the rankings before and after a change and
  // tells the user about any club completed or level gained.

  const announceProgress = (
    rankingsBefore,
    rankingsAfter
  ) => {

    const before = getProgress(rankingsBefore);

    const after = getProgress(rankingsAfter);


    // New badges slide in as notifications, one at a time.
    const earnedBefore = new Set(
      getBadges(rankingsBefore)
        .filter(badge => badge.earned)
        .map(badge => badge.id)
    );

    const newBadges = getBadges(rankingsAfter)
      .filter(
        badge =>
          badge.earned &&
          !earnedBefore.has(badge.id)
      )
      .map(badge => ({
        ...badge,
        subtitle: `${badge.description} · ${badge.bonus}`,
      }));

    if (newBadges.length > 0) {
      setBadgeQueue(previousQueue => [
        ...previousQueue,
        ...newBadges,
      ]);
    }


    if (after.level > before.level) {

      const { current } = after;

      Alert.alert(
        'LEVEL UP!',
        `${current.badge} You're now Level ${after.level}: ${current.title}.` +
          (current.unlocks
            ? ` ${unlockName(current.unlocks)} players are now unlocked.`
            : '')
      );

    }

  };


  // =====================================================
  // FIRST PLAYER ANCHOR
  // =====================================================

  const handleAnchorSelected = ({
    player,
    category,
  }) => {

    const anchorPlayer =
      createPlayer(
        player,
        category
      );


    console.log(
      'FOTRANKR NEW PLAYER:',
      player.name,
      category,
      anchorPlayer.rating,
      anchorPlayer.score
    );


    const playerWithDisplay = {
      ...anchorPlayer,
      isAnchor: true,
    };


    setMyRankings(
      previousRankings => [
        ...previousRankings,
        playerWithDisplay,
      ]
    );


    setComparisonHistory(
      previousHistory => [
        ...previousHistory,
      ]
    );


    // -----------------------------------------------
    // CLUB COMPLETE? LEVEL UP?
    // -----------------------------------------------

    const rankingsBefore = myRankings.filter(
      rankedPlayer =>
        String(rankedPlayer.id) !==
        String(player.id)
    );

    announceProgress(
      rankingsBefore,
      [
        ...rankingsBefore,
        playerWithDisplay,
      ]
    );

  };


  // =====================================================
  // "I DO NOT KNOW"
  // =====================================================
  // Saves the player as Unknown with a score of 0. They
  // count towards completing a club but earn no player XP,
  // and can be ranked properly later from My Ranks.

  const handleMarkUnknown = ({
    player,
  }) => {

    console.log(
      'FOTRANKR UNKNOWN PLAYER:',
      player.name
    );


    const unknownPlayer = {
      id: player.id,
      name: player.name || 'Unknown Player',
      nation: player.nation || '',
      position: player.position || '',
      specificPosition: player.specificPosition || '',
      club: player.club || '',
      category: UNKNOWN_CATEGORY,
      initialCategory: UNKNOWN_CATEGORY,
      rating: 0,
      score: 0,
      comparisons: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      isAnchor: false,
      isRanked: true,
    };


    const rankingsBefore = myRankings.filter(
      rankedPlayer =>
        String(rankedPlayer.id) !==
        String(player.id)
    );


    setMyRankings(
      previousRankings => [
        ...previousRankings.filter(
          rankedPlayer =>
            String(rankedPlayer.id) !==
            String(player.id)
        ),
        unknownPlayer,
      ]
    );


    // Any old H2H results for them no longer apply.
    setComparisonHistory(
      previousHistory =>
        previousHistory.filter(
          comparison =>
            String(comparison.playerA) !==
              String(player.id) &&
            String(comparison.playerB) !==
              String(player.id)
        )
    );


    announceProgress(
      rankingsBefore,
      [
        ...rankingsBefore,
        unknownPlayer,
      ]
    );

  };


  // =====================================================
  // CHANGE PLAYER CATEGORY
  // =====================================================

  const handleCategoryChanged = ({
    player,
    category,
  }) => {


    // An Unknown player being ranked properly earns their
    // XP now, which may complete a level.
    const wasUnknown = myRankings.some(
      rankedPlayer =>
        String(rankedPlayer.id) ===
          String(player.id) &&
        isUnknown(rankedPlayer)
    );

    if (wasUnknown) {

      announceProgress(
        myRankings,
        myRankings.map(rankedPlayer =>
          String(rankedPlayer.id) ===
          String(player.id)
            ? { ...rankedPlayer, category }
            : rankedPlayer
        )
      );

    }


    console.log(
      'FOTRANKR CATEGORY CHANGE:',
      player.name,
      '->',
      category
    );


    setMyRankings(
      previousRankings => {

        const existingPlayer =
          previousRankings.find(
            rankedPlayer =>
              String(rankedPlayer.id) ===
              String(player.id)
          );


        // -----------------------------------------------
        // SAME CATEGORY
        // -----------------------------------------------

        if (
          existingPlayer &&
          existingPlayer.category === category
        ) {

          console.log(
            'FOTRANKR SAME CATEGORY: Keeping existing player',
            existingPlayer.name,
            category,
            existingPlayer.rating,
            existingPlayer.score
          );

          return previousRankings;

        }


        // -----------------------------------------------
        // GENUINE CATEGORY CHANGE
        // -----------------------------------------------

        return previousRankings.map(
          rankedPlayer => {

            if (
              String(rankedPlayer.id) !==
              String(player.id)
            ) {

              return rankedPlayer;

            }


            const newCategoryPlayer =
              createPlayer(
                player,
                category
              );


            console.log(
              'FOTRANKR NEW CATEGORY PLAYER:',
              newCategoryPlayer.name,
              category,
              newCategoryPlayer.rating,
              newCategoryPlayer.score
            );


            return {

              ...newCategoryPlayer,

              isAnchor: false,

              isRanked: true,

            };

          }
        );

      }
    );


    // -----------------------------------------------
    // REMOVE OLD H2H HISTORY
    // -----------------------------------------------

    setComparisonHistory(
      previousHistory =>
        previousHistory.filter(
          comparison =>
            String(comparison.playerA) !==
              String(player.id) &&
            String(comparison.playerB) !==
              String(player.id)
        )
    );

  };


  // =====================================================
  // RANK PLAYER AGAIN
  // =====================================================

  const handleRankAgain = ({
    player,
  }) => {

    console.log(
      'FOTRANKR RANK AGAIN:',
      player.name
    );


    setMyRankings(
      previousRankings =>
        previousRankings.filter(
          rankedPlayer =>
            String(rankedPlayer.id) !==
            String(player.id)
        )
    );


    setComparisonHistory(
      previousHistory =>
        previousHistory.filter(
          comparison =>
            String(comparison.playerA) !==
              String(player.id) &&
            String(comparison.playerB) !==
              String(player.id)
        )
    );


    console.log(
      'FOTRANKR RANK AGAIN COMPLETE:',
      player.name
    );

  };


  // =====================================================
  // HEAD-TO-HEAD RESULT
  // =====================================================
  // Saves the answer (winner + margin) to the history and
  // updates the win/loss counts. Scores follow automatically
  // (see myRankings).
  //
  // kind: 'placement' | 'special' | 'checkup' | 'challenge'
  // result: 'player' (target better) | 'comparison' | 'equal'

  const handleHeadToHeadResult = ({
    player,
    comparisonPlayer,
    category,
    result,
    margin = null,
    kind = 'placement',
    manualChallenge,
  }) => {

    const resultKind =
      manualChallenge === true ? 'challenge' : kind;

    console.log(
      'FOTRANKR H2H:',
      player.name,
      'vs',
      comparisonPlayer.name,
      result,
      margin || '',
      resultKind
    );


    setComparisonHistory(
      previousHistory => [
        ...previousHistory,
        {
          playerA: player.id,
          playerB: comparisonPlayer.id,
          category,
          result,
          margin,
          kind: resultKind,
          date: new Date().toISOString(),
        },
      ]
    );


    const targetWon = result === 'player';
    const opponentWon = result === 'comparison';

    const tally = (rankedPlayer, won, lost) => ({
      ...rankedPlayer,
      comparisons: (rankedPlayer.comparisons || 0) + 1,
      wins: (rankedPlayer.wins || 0) + (won ? 1 : 0),
      losses: (rankedPlayer.losses || 0) + (lost ? 1 : 0),
      draws:
        (rankedPlayer.draws || 0) + (!won && !lost ? 1 : 0),
    });

    setMyRankings(
      previousRankings =>
        previousRankings.map(rankedPlayer => {

          const id = String(rankedPlayer.id);

          if (id === String(player.id)) {

            const counted = tally(
              rankedPlayer,
              targetWon,
              opponentWon
            );

            // Placement head-to-heads count towards the
            // per-category limit.
            if (resultKind !== 'placement') {
              return counted;
            }

            return {
              ...counted,
              h2hCategory: category,
              h2hCount:
                (rankedPlayer.h2hCategory === category
                  ? rankedPlayer.h2hCount || 0
                  : 0) + 1,
            };
          }

          if (id === String(comparisonPlayer.id)) {
            return tally(
              rankedPlayer,
              opponentWon,
              targetWon
            );
          }

          return rankedPlayer;
        })
    );


    // A challenge win/loss against another category: ask
    // before moving anyone (never automatic).
    if (resultKind === 'challenge') {

      const mine = myRankings.find(
        ranked => String(ranked.id) === String(player.id)
      );

      const theirs = myRankings.find(
        ranked =>
          String(ranked.id) === String(comparisonPlayer.id)
      );

      const myLevel = CATEGORY_ORDER.indexOf(mine?.category);
      const theirLevel = CATEGORY_ORDER.indexOf(theirs?.category);

      const moveTo =
        targetWon && theirLevel > myLevel
          ? CATEGORY_ORDER[myLevel + 1]
          : opponentWon && theirLevel < myLevel && myLevel > 0
            ? CATEGORY_ORDER[myLevel - 1]
            : null;

      if (mine && theirs && myLevel >= 0 && moveTo) {

        Alert.alert(
          targetWon
            ? `Move ${player.name} up?`
            : `Move ${player.name} down?`,
          `${player.name} (${mine.category}) ${
            targetWon ? 'beat' : 'lost to'
          } ${comparisonPlayer.name} (${theirs.category}).\n\nMove ${player.name} to ${moveTo}?`,
          [
            {
              text: `Keep ${mine.category}`,
              style: 'cancel',
            },
            {
              text: `Move to ${moveTo}`,
              onPress: () =>
                handleMoveCategory({
                  player,
                  toCategory: moveTo,
                }),
            },
          ]
        );
      }
    }

  };


  // =====================================================
  // MOVE CATEGORY (promotion / relegation)
  // =====================================================
  // Keeps all head-to-head history; placement starts again
  // in the new category.

  const handleMoveCategory = ({
    player,
    toCategory,
  }) => {

    console.log(
      'FOTRANKR CATEGORY MOVE:',
      player.name,
      '->',
      toCategory
    );

    setMyRankings(
      previousRankings =>
        previousRankings.map(rankedPlayer =>
          String(rankedPlayer.id) === String(player.id)
            ? {
                ...rankedPlayer,
                category: toCategory,
                h2hCategory: toCategory,
                h2hCount: 0,
              }
            : rankedPlayer
        )
    );

  };


  // =====================================================
  // CREATE CUSTOM LIST
  // =====================================================

  const handleCreateList = (newList) => {

    console.log(
      'FOTRANKR NEW LIST:',
      newList
    );


    setLists(
      previousLists => [
        ...previousLists,
        newList,
      ]
    );

  };


  // =====================================================
  // SET PLAYERS IN A CUSTOM LIST (by ID)
  // =====================================================

  const handlePlayersAdded = ({
    listId,
    playerIds,
  }) => {

    console.log(
      'FOTRANKR LIST PLAYERS UPDATED:',
      listId,
      playerIds
    );


    setLists(
      previousLists =>
        previousLists.map(list => {

          if (
            String(list.id) !==
            String(listId)
          ) {

            return list;

          }


          return {
            ...list,
            playerIds: playerIds.map(String),
          };

        })
    );

  };


  // =====================================================
  // DELETE A CUSTOM LIST
  // =====================================================

  const handleDeleteList = (listId) => {

    console.log(
      'FOTRANKR LIST DELETED:',
      listId
    );


    setLists(
      previousLists =>
        previousLists.filter(
          list =>
            String(list.id) !==
            String(listId)
        )
    );

  };


  // =====================================================
  // RESET ALL DATA (Backup screen)
  // =====================================================

  const handleResetAll = async () => {

    saveAutoBackup({
      myRankings,
      fotrankrLists: lists,
      comparisonHistory,
      fotrankrProgress: earnedHistory,
      fotrankrProfile: profile
        ? {
            username: profile.username,
            createdAt: profile.createdAt,
          }
        : null,
    });

    await AsyncStorage.multiRemove([
      'myRankings',
      'fotrankrLists',
      'comparisonHistory',
      'fotrankrProgress',
    ]);

    setMyRankings([]);
    setLists([]);
    setComparisonHistory([]);
    setEarnedHistoryState(EMPTY_EARNED);

    console.log('FOTRANKR: all data reset by user');

  };


  // =====================================================
  // RESTORE FROM BACKUP
  // =====================================================

  const handleRestoreBackup = async ({
    myRankings: restoredRankings,
    lists: restoredLists,
    comparisonHistory: restoredHistory,
    profile: restoredProfile,
    earned: restoredEarned,
  }) => {

    // The backup's XP/badge record replaces this phone's
    // (restored rankings are added to it automatically).
    const earned = {
      rankedIds: restoredEarned?.rankedIds || [],
      clubKeys: restoredEarned?.clubKeys || [],
      goldClubKeys: restoredEarned?.goldClubKeys || [],
      leagueKeys: restoredEarned?.leagueKeys || [],
    };

    setEarnedHistoryState(earned);

    await AsyncStorage.setItem(
      'fotrankrProgress',
      JSON.stringify(earned)
    );

    const normalisedLists =
      restoredLists.map(normaliseList);


    // Backups carry the username only (the photo is a file
    // on the old phone), so this phone's photo is kept.
    if (restoredProfile?.username) {

      handleSaveProfile({
        ...profile,
        username: restoredProfile.username,
        createdAt:
          restoredProfile.createdAt ||
          profile?.createdAt,
      });

    }


    await AsyncStorage.setItem(
      'myRankings',
      JSON.stringify(restoredRankings)
    );

    await AsyncStorage.setItem(
      'fotrankrLists',
      JSON.stringify(normalisedLists)
    );

    await AsyncStorage.setItem(
      'comparisonHistory',
      JSON.stringify(restoredHistory)
    );

    // Always the CURRENT version, otherwise the next
    // launch would treat the data as old and clear it.
    await AsyncStorage.setItem(
      'fotrankrDataVersion',
      DATA_VERSION
    );


    setMyRankings(restoredRankings);
    setLists(normalisedLists);
    setComparisonHistory(restoredHistory);


    console.log(
      'FOTRANKR BACKUP RESTORED:',
      restoredRankings.length,
      'rankings,',
      normalisedLists.length,
      'lists'
    );

  };


  // =====================================================
  // NAVIGATION
  // =====================================================

  return (

    <View style={{ flex: 1 }}>

    <NavigationContainer>

      <Stack.Navigator>


        {/* =================================================
            MAIN TABS
            ================================================= */}

        <Stack.Screen
          name="MainTabs"
          options={{
            headerShown: false,
          }}
        >

          {() => (

            <Tab.Navigator

              screenOptions={{
                headerShown: false,

                tabBarStyle: {
                  backgroundColor: '#050505',
                  borderTopColor: '#1a1a1a',
                  height: 68,
                  paddingBottom: 8,
                  paddingTop: 8,
                },

                tabBarActiveTintColor:
                  '#00ff66',

                tabBarInactiveTintColor:
                  '#666666',

                // Five tabs share the width, so labels are
                // kept small, unpadded and unscaled, with a
                // little side padding so iOS doesn't clip
                // the last letter of bold text.
                tabBarLabelStyle: {
                  fontSize: 10,
                  fontWeight: '800',
                  paddingHorizontal: 2,
                },

                tabBarItemStyle: {
                  paddingHorizontal: 0,
                },

                tabBarAllowFontScaling: false,

              }}
            >


              {/* =================================================
                  HOME
                  ================================================= */}

              <Tab.Screen
                name="Home"
                options={{
                  tabBarLabel: 'HOME',
                  tabBarIcon: () => null,
                }}
              >

                {({ navigation }) => (

                  <HomeScreen
                    navigation={navigation}
                    isFirstPlayer={
                      myRankings.length === 0
                    }
                    myRankings={myRankings}
                  />

                )}

              </Tab.Screen>


              {/* =================================================
                  SEARCH
                  ================================================= */}

              <Tab.Screen
                name="Search"
                options={{
                  tabBarLabel: 'SEARCH',
                  tabBarIcon: () => null,
                }}
              >

                {({ navigation }) => (

                  <SearchScreen
                    navigation={navigation}
                    myRankings={myRankings}
                  />

                )}

              </Tab.Screen>


              {/* =================================================
                  MY RANKS
                  ================================================= */}

              <Tab.Screen
                name="MyRanks"
                options={{
                  tabBarLabel: 'MY RANKS',
                  tabBarIcon: () => null,
                }}
              >

                {({ navigation }) => (

                  <RankingsScreen
                    navigation={navigation}
                    myRankings={myRankings}
                  />

                )}

              </Tab.Screen>


              {/* =================================================
                  LISTS
                  ================================================= */}

              <Tab.Screen
                name="Lists"
                options={{
                  tabBarLabel: 'LISTS',
                  tabBarIcon: () => null,
                }}
              >

                {({ navigation }) => (

                  <ListsScreen
                    navigation={navigation}
                    lists={lists}
                  />

                )}

              </Tab.Screen>


              {/* =================================================
                  PROFILE
                  ================================================= */}

              <Tab.Screen
                name="Profile"
                options={{
                  tabBarLabel: 'PROFILE',
                  tabBarIcon: () => null,
                }}
              >

                {({ navigation }) => (

                  <ProfileScreen
                    navigation={navigation}
                    profile={profile}
                    onSaveProfile={handleSaveProfile}
                    myRankings={myRankings}
                  />

                )}

              </Tab.Screen>


            </Tab.Navigator>

          )}

        </Stack.Screen>


        {/* =================================================
            CREATE LIST
            ================================================= */}

        <Stack.Screen
          name="CreateList"
          options={{
            headerShown: false,
          }}
        >

          {({ navigation, route }) => (

            <CreateListScreen
              navigation={navigation}
              route={route}
              onCreateList={handleCreateList}
            />

          )}

        </Stack.Screen>


        {/* =================================================
            ADD PLAYERS TO LIST
            ================================================= */}

        <Stack.Screen
          name="AddPlayersToList"
          options={{
            headerShown: false,
          }}
        >

          {({ navigation, route }) => (

            <AddPlayersToListScreen
              navigation={navigation}
              route={route}
              lists={lists}
              myRankings={myRankings}
              onPlayersAdded={handlePlayersAdded}
            />

          )}

        </Stack.Screen>


        {/* =================================================
            LIST DETAIL
            ================================================= */}

        <Stack.Screen
          name="ListDetail"
          options={{
            headerShown: false,
          }}
        >

          {({ navigation, route }) => (

            <ListDetailScreen
              navigation={navigation}
              route={route}
              lists={lists}
              myRankings={myRankings}
              onPlayersChanged={handlePlayersAdded}
              onDeleteList={handleDeleteList}
            />

          )}

        </Stack.Screen>


        {/* =================================================
            MY BEST XI'S (from My Ranks)
            ================================================= */}

        <Stack.Screen
          name="BestXIs"
          options={{
            headerShown: false,
          }}
        >

          {({ navigation }) => (

            <BestXIsScreen
              navigation={navigation}
              myRankings={myRankings}
            />

          )}

        </Stack.Screen>

        <Stack.Screen
          name="BestXI"
          options={{
            headerShown: false,
          }}
        >

          {({ navigation, route }) => (

            <BestXIScreen
              navigation={navigation}
              route={route}
              myRankings={myRankings}
            />

          )}

        </Stack.Screen>


        {/* =================================================
            CLUB RANKINGS (from a club badge)
            ================================================= */}

        <Stack.Screen
          name="ClubRankings"
          options={{
            headerShown: false,
          }}
        >

          {({ navigation, route }) => (

            <ClubRankingsScreen
              navigation={navigation}
              route={route}
              myRankings={myRankings}
            />

          )}

        </Stack.Screen>


        {/* =================================================
            CHALLENGE
            ================================================= */}

        <Stack.Screen
          name="Challenge"
          options={{
            headerShown: false,
          }}
        >

          {({ navigation, route }) => (

            <ChallengeScreen
              navigation={navigation}
              route={route}
              myRankings={myRankings}
            />

          )}

        </Stack.Screen>


        {/* =================================================
            BACKUP
            ================================================= */}

        <Stack.Screen
          name="Backup"
          options={{
            headerShown: false,
          }}
        >

          {({ navigation }) => (

            <BackupScreen
              navigation={navigation}
              myRankings={myRankings}
              lists={lists}
              comparisonHistory={comparisonHistory}
              onRestore={handleRestoreBackup}
              onResetAll={handleResetAll}
            />

          )}

        </Stack.Screen>


        {/* =================================================
            COMPARE
            ================================================= */}

        <Stack.Screen
          name="Compare"
          options={{
            title: 'Rank Player',
          }}
        >

          {({ navigation, route }) => {

            const selectedPlayer =
              route.params?.player;


            const isPlayerRanked =
              myRankings.some(
                ranking =>
                  String(ranking.id) ===
                  String(selectedPlayer?.id)
              );


            return (

              <CompareScreen

                navigation={navigation}

                route={route}

                isFirstPlayer={
                  myRankings.length === 0
                }

                isPlayerRanked={
                  isPlayerRanked
                }

                myRankings={
                  myRankings
                }

                onAnchorSelected={
                  handleAnchorSelected
                }

                onCategoryChanged={
                  handleCategoryChanged
                }

                onRankAgain={
                  handleRankAgain
                }

                onMarkUnknown={
                  handleMarkUnknown
                }

              />

            );

          }}

        </Stack.Screen>


        {/* =================================================
            HEAD TO HEAD
            ================================================= */}

        <Stack.Screen
          name="HeadToHead"
        >

          {({ navigation, route }) => (

            <HeadToHead

              navigation={navigation}

              route={route}

              onResult={
                handleHeadToHeadResult
              }

              onMoveCategory={
                handleMoveCategory
              }

              myRankings={
                myRankings
              }

              comparisonHistory={
                comparisonHistory
              }

            />

          )}

        </Stack.Screen>


      </Stack.Navigator>

    </NavigationContainer>

    <BadgeToast
      key={badgeQueue[0]?.id}
      badge={badgeQueue[0]}
      onHide={() =>
        setBadgeQueue(previousQueue =>
          previousQueue.slice(1)
        )
      }
    />

    </View>

  );

}