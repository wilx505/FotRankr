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
  useRef,
  useState,
} from 'react';

import AddPlayersToListScreen from './screens/AddPlayersToListScreen';
import BackupScreen from './screens/BackupScreen';
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
  comparePlayers,
  createPlayer,
} from './engine/rankingEngine.js';

import {
  getSourcePlayer,
  normaliseList,
} from './utils/listHelpers';

import {
  UNKNOWN_CATEGORY,
  clubKey,
  getClubsCompletedNow,
  getProgress,
  getRankedIdsNow,
  isUnknown,
  setEarnedHistory,
  unlockName,
} from './utils/progression';

import { getBadges } from './utils/badges';

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
};

const DATA_VERSION = '62';


export default function App() {

  // =====================================================
  // STATE
  // =====================================================

  const [myRankings, setMyRankings] = useState([]);

  const [lists, setLists] = useState([]);

  const [comparisonHistory, setComparisonHistory] =
    useState([]);

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
        // NEW DATA VERSION
        // =================================================

        if (savedVersion !== DATA_VERSION) {

          await AsyncStorage.removeItem(
            'myRankings'
          );

          await AsyncStorage.removeItem(
            'comparisonHistory'
          );

          await AsyncStorage.removeItem(
            'fotrankrLists'
          );

          await AsyncStorage.removeItem(
            'fotrankrProgress'
          );

          await AsyncStorage.setItem(
            'fotrankrDataVersion',
            DATA_VERSION
          );

          setMyRankings([]);
          setLists([]);
          setComparisonHistory([]);
          setDataLoaded(true);

          console.log(
            'FotRankr: Old ranking data cleared.'
          );

          return;
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

    const newIds = getRankedIdsNow(myRankings).filter(
      id => !rankedIds.has(id)
    );

    const newClubs = getClubsCompletedNow(myRankings)
      .map(clubKey)
      .filter(key => !clubKeys.has(key));

    if (newIds.length === 0 && newClubs.length === 0) {
      return;
    }

    const updated = {
      rankedIds: [...earnedHistory.rankedIds, ...newIds],
      clubKeys: [...earnedHistory.clubKeys, ...newClubs],
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

  const handleHeadToHeadResult = ({
    player,
    comparisonPlayer,
    category,
    result,
    opponentIsRanked,
    manualChallenge,
  }) => {

    console.log(
      'FOTRANKR COMPARISON:',
      player.name,
      'vs',
      comparisonPlayer.name,
      result
    );


    console.log(
      'FOTRANKR OPPONENT STATUS:',
      comparisonPlayer.name,
      'already ranked =',
      opponentIsRanked
    );


    setMyRankings(
      previousRankings => {

        const findExistingPlayer = (
          sourcePlayer
        ) => {

          return previousRankings.find(
            rankedPlayer =>
              String(rankedPlayer.id) ===
              String(sourcePlayer.id)
          );

        };


        // ---------------------------------------------
        // TARGET PLAYER
        // ---------------------------------------------

        let playerA =
          findExistingPlayer(player);


        if (!playerA) {

          playerA =
            createPlayer(
              player,
              category
            );

        }


        // ---------------------------------------------
        // OPPONENT
        // ---------------------------------------------

        let playerB =
          findExistingPlayer(
            comparisonPlayer
          );


        if (!playerB) {

          playerB =
            createPlayer(
              comparisonPlayer,
              category
            );

        }


        // ---------------------------------------------
        // RUN RANKING ENGINE
        // ---------------------------------------------

        const resultData =
          comparePlayers(
            playerA,
            playerB,
            result,
            manualChallenge !== true
          );


        const updatedA =
          resultData.playerA;

        const updatedB =
          resultData.playerB;


        console.log(
          'FOTRANKR UPDATED:',
          {
            player:
              updatedA.name,

            rating:
              updatedA.rating,

            score:
              updatedA.score,

            category:
              updatedA.category,
          }
        );


        console.log(
          'FOTRANKR OPPONENT UPDATED:',
          {
            player:
              updatedB.name,

            rating:
              updatedB.rating,

            score:
              updatedB.score,

            category:
              updatedB.category,

            wasAlreadyRanked:
              opponentIsRanked,
          }
        );


        // ---------------------------------------------
        // REMOVE OLD TARGET + OPPONENT
        // ---------------------------------------------

        const otherPlayers =
          previousRankings.filter(
            rankedPlayer =>
              String(rankedPlayer.id) !==
                String(player.id) &&
              String(rankedPlayer.id) !==
                String(comparisonPlayer.id)
          );


        // ---------------------------------------------
        // TARGET ALWAYS STAYS
        // ---------------------------------------------

        const updatedRankings = [
          ...otherPlayers,
          updatedA,
        ];


        // ---------------------------------------------
        // SAVE EXISTING RANKED OPPONENT
        // ---------------------------------------------

        if (
          opponentIsRanked === true
        ) {

          console.log(
            'FOTRANKR: Saving existing ranked opponent:',
            updatedB.name
          );


          return [
            ...updatedRankings,
            updatedB,
          ];

        }


        // ---------------------------------------------
        // TEMPORARY OPPONENT
        // ---------------------------------------------

        console.log(
          'FOTRANKR: NOT saving temporary H2H opponent:',
          updatedB.name
        );


        return updatedRankings;

      }
    );


    // -----------------------------------------------
    // SAVE HISTORY
    // -----------------------------------------------

    setComparisonHistory(
      previousHistory => [

        ...previousHistory,

        {
          playerA:
            player.id,

          playerB:
            comparisonPlayer.id,

          category:
            category,

          result,

          date:
            new Date().toISOString(),
        },

      ]
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
              dataVersion={DATA_VERSION}
              onRestore={handleRestoreBackup}
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