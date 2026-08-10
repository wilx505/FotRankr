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

const DATA_VERSION = '6';

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
// FIRST PLAYER ANCHOR
// =====================================================

const handleAnchorSelected = ({
  player,
  category,
}) => {

  // Convert the chosen category into a starting score.
  const categoryScores = {
    Legendary: 9.90,
    Elite: 9.40,
    'Very Good': 8.50,
    Good: 7.00,
    OK: 5.00,
    Bad: 1.00,
  };

  const anchorScore =
    categoryScores[category];

  // Convert the display score into the
  // hidden internal rating.
  const anchorRating =
    2000 + ((anchorScore - 5) * 200);

  const anchorPlayer = {
    id: player.id,
    name: player.name,
    nation: player.nation || '',
    position: player.position || '',

    rating: anchorRating,
    score: anchorScore,
    category: category,
    isAnchor: true,

    uncertainty: 200,

    comparisons: 0,

    wins: 0,
    losses: 0,
    draws: 0,
  };

  setMyRankings([
    anchorPlayer
  ]);

  setComparisonHistory([]);
};

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
    // Find existing players
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
    // Create players if they don't exist
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
    // FIRST COMPARISON AGAINST ANCHOR
    // -----------------------------------------------

    const isPlayerANew =
      playerA.comparisons === 0 &&
      !playerA.isAnchor;

    const isPlayerBNew =
      playerB.comparisons === 0 &&
      !playerB.isAnchor;

    const playerAIsAnchor =
      playerA.isAnchor === true;

    const playerBIsAnchor =
      playerB.isAnchor === true;


    // -----------------------------------------------
    // New Player A vs Anchor Player B
    // -----------------------------------------------

    if (
      isPlayerANew &&
      playerBIsAnchor
    ) {

      if (result === 'player') {

        playerA.rating =
          playerB.rating + 80;

      }

      else if (result === 'comparison') {

        playerA.rating =
          playerB.rating - 80;

      }

      else {

        playerA.rating =
          playerB.rating;

      }

    }


    // -----------------------------------------------
    // New Player B vs Anchor Player A
    // -----------------------------------------------

    else if (
      isPlayerBNew &&
      playerAIsAnchor
    ) {

      if (result === 'comparison') {

        playerB.rating =
          playerA.rating + 80;

      }

      else if (result === 'player') {

        playerB.rating =
          playerA.rating - 80;

      }

      else {

        playerB.rating =
          playerA.rating;

      }

    }


    // -----------------------------------------------
    // Run ranking engine
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
    // Remove old versions
    // -----------------------------------------------

    const otherPlayers =
      previousRankings.filter(
        rankedPlayer =>
          rankedPlayer.id !== player.id &&
          rankedPlayer.id !== comparisonPlayer.id
      );


    // -----------------------------------------------
    // Save updated players
    // -----------------------------------------------

    return [
      ...otherPlayers,
      updatedA,
      updatedB,
    ];

  });


  // -----------------------------------------------
  // SAVE HISTORY
  // -----------------------------------------------

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
            isFirstPlayer={myRankings.length === 0}
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
>
  {({ navigation, route }) => (
    <CompareScreen
      navigation={navigation}
      route={route}
      isFirstPlayer={myRankings.length === 0}
      onAnchorSelected={handleAnchorSelected}
    />
  )}
</Stack.Screen>


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
