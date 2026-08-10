import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  NavigationContainer,
} from '@react-navigation/native';
import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';

import CompareScreen from './screens/CompareScreen';
import HeadToHead from './screens/HeadToHead';
import HomeScreen from './screens/HomeScreen';
import RankingsScreen from './screens/RankingsScreen';

import {
  comparePlayers,
  createPlayer,
} from './engine/rankingEngine.js';

const Stack = createNativeStackNavigator();

const DATA_VERSION = '4';

export default function App() {

  const [myRankings, setMyRankings] = useState([]);
  const [comparisonHistory, setComparisonHistory] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);

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

        // New engine = clear old incompatible data
        if (savedVersion !== DATA_VERSION) {

          await AsyncStorage.removeItem(
            'myRankings'
          );

          await AsyncStorage.removeItem(
            'comparisonHistory'
          );

          await AsyncStorage.setItem(
            'fotrankrDataVersion',
            DATA_VERSION
          );

          setMyRankings([]);
          setComparisonHistory([]);
          setDataLoaded(true);

          console.log(
            'FotRankr: Old ranking data cleared.'
          );

          return;
        }

        const savedRankings =
          await AsyncStorage.getItem(
            'myRankings'
          );

        const savedHistory =
          await AsyncStorage.getItem(
            'comparisonHistory'
          );

        if (savedRankings) {

          const parsed =
            JSON.parse(savedRankings);

          if (Array.isArray(parsed)) {
            setMyRankings(parsed);
          }

        }

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
    comparisonHistory,
    dataLoaded,
  ]);

  // =====================================================
  // HEAD-TO-HEAD RESULT
  // =====================================================

  const handleHeadToHeadResult = ({
    player,
    comparisonPlayer,
    result,
  }) => {

    console.log(
      'FOTRANKR COMPARISON:',
      player.name,
      'vs',
      comparisonPlayer.name,
      result
    );

    setMyRankings(previousRankings => {

      // -----------------------------------------------
      // Convert saved ranking data back into
      // ranking-engine players
      // -----------------------------------------------

      const findExistingPlayer = (sourcePlayer) => {

        return previousRankings.find(
          rankedPlayer =>
            rankedPlayer.id === sourcePlayer.id
        );

      };

      let playerA =
        findExistingPlayer(player);

      let playerB =
        findExistingPlayer(comparisonPlayer);

      // -----------------------------------------------
      // Create player if they don't exist yet
      // -----------------------------------------------

      if (!playerA) {

        playerA =
          createPlayer(player);

      }

      if (!playerB) {

        playerB =
          createPlayer(comparisonPlayer);

      }

      // -----------------------------------------------
      // Run the actual ranking engine
      // -----------------------------------------------

      const resultData =
        comparePlayers(
          playerA,
          playerB,
          result
        );

      const updatedA =
        resultData.playerA;

      const updatedB =
        resultData.playerB;

      // -----------------------------------------------
      // Remove old versions of these players
      // -----------------------------------------------

      const otherPlayers =
        previousRankings.filter(
          rankedPlayer =>
            rankedPlayer.id !== player.id &&
            rankedPlayer.id !== comparisonPlayer.id
        );

      // -----------------------------------------------
      // Save the new engine results
      // -----------------------------------------------

      return [
        ...otherPlayers,
        updatedA,
        updatedB,
      ];

    });

    // =================================================
    // SAVE HISTORY
    // =================================================

    setComparisonHistory(
      previousHistory => [

        ...previousHistory,

        {
          playerA: player.id,
          playerB: comparisonPlayer.id,
          result,
          date: new Date().toISOString(),
        },

      ]
    );

  };

  // =====================================================
  // NAVIGATION
  // =====================================================

  return (

    <NavigationContainer>

      <Stack.Navigator>

        <Stack.Screen
          name="Home"
          options={{
            title: 'FotRankr',
          }}
        >

          {({ navigation }) => (

            <HomeScreen
              navigation={navigation}
            />

          )}

        </Stack.Screen>

        <Stack.Screen
          name="Rankings"
          options={{
            title: 'My Rankings',
          }}
        >

          {() => (

            <RankingsScreen
              myRankings={myRankings}
            />

          )}

        </Stack.Screen>

        <Stack.Screen
          name="Compare"
          component={CompareScreen}
        />

        <Stack.Screen
          name="HeadToHead"
        >

          {({ navigation, route }) => (

            <HeadToHead
              navigation={navigation}
              route={route}
              onResult={handleHeadToHeadResult}
              myRankings={myRankings}
              comparisonHistory={comparisonHistory}
            />

          )}

        </Stack.Screen>

      </Stack.Navigator>

    </NavigationContainer>

  );

}
