import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  NavigationContainer,
} from '@react-navigation/native';
import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';

import ChallengeScreen from './screens/ChallengeScreen';
import CompareScreen from './screens/CompareScreen';
import HeadToHead from './screens/HeadToHead';
import HomeScreen from './screens/HomeScreen';
import RankingsScreen from './screens/RankingsScreen';

import {
  comparePlayers,
  createPlayer,
} from './engine/rankingEngine.js';

const Stack = createNativeStackNavigator();

const DATA_VERSION = '11';

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

  // Let the ranking engine determine the
  // correct starting rating for the category.
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

  // Add display information immediately.
  const score =
    5 +
    (anchorPlayer.rating - 2000) / 200;

  const limitedScore =
    Math.max(
      0,
      Math.min(
        10,
        score
      )
    );

  const playerWithDisplay =
    {
      ...anchorPlayer,

      score:
        Number(
          limitedScore.toFixed(2)
        ),

      category,

      isAnchor: true,
    };

  setMyRankings([
    playerWithDisplay
  ]);

  setComparisonHistory([]);
};
// =====================================================
// HEAD-TO-HEAD RESULT
// =====================================================

const handleHeadToHeadResult = ({
  player,
  comparisonPlayer,
  category,
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
    createPlayer(
      player,
      category
    );

}

if (!playerB) {

  playerB =
    createPlayer(
      comparisonPlayer,
      comparisonPlayer.category
    );

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
  {({ navigation }) => (
    <RankingsScreen
      navigation={navigation}
      myRankings={myRankings}
    />
  )}
</Stack.Screen>

<Stack.Screen
  name="Challenge"
  options={{
    title: 'Challenge',
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


<Stack.Screen
  name="Compare"
>
  {({ navigation, route }) => {

    const selectedPlayer =
      route.params?.player;

    const isPlayerRanked =
      myRankings.some(
        ranking =>
          ranking.id ===
          selectedPlayer?.id
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
        onAnchorSelected={
          handleAnchorSelected
        }
      />
    );
  }}
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
