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
  useState,
} from 'react';

import AddPlayersToListScreen from './screens/AddPlayersToListScreen';
import ChallengeScreen from './screens/ChallengeScreen';
import CompareScreen from './screens/CompareScreen';
import CreateListScreen from './screens/CreateListScreen';
import HeadToHead from './screens/HeadToHead';
import HomeScreen from './screens/HomeScreen';
import ListsScreen from './screens/ListsScreen';
import RankingsScreen from './screens/RankingsScreen';
import SearchScreen from './screens/SearchScreen';

import {
  comparePlayers,
  createPlayer,
} from './engine/rankingEngine.js';


const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const DATA_VERSION = '53';


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


  // =====================================================
  // LOAD DATA
  // =====================================================

  useEffect(() => {

    const loadData = async () => {

      try {

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

            setMyRankings(parsed);

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

            setLists(parsedLists);

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

        console.log(
          'Error loading FotRankr:',
          error
        );

        setMyRankings([]);
        setLists([]);
        setComparisonHistory([]);
        setDataLoaded(true);

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

  };


  // =====================================================
  // CHANGE PLAYER CATEGORY
  // =====================================================

  const handleCategoryChanged = ({
    player,
    category,
  }) => {

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
  // ADD PLAYERS TO CUSTOM LIST
  // =====================================================

  const handlePlayersAdded = ({
    listId,
    players,
  }) => {

    console.log(
      'FOTRANKR LIST PLAYERS UPDATED:',
      listId,
      players
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
            players: players,
          };

        })
    );

  };


  // =====================================================
  // NAVIGATION
  // =====================================================

  return (

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

                tabBarLabelStyle: {
                  fontSize: 11,
                  fontWeight: '800',
                },

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
              onPlayersAdded={handlePlayersAdded}
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

  );

}