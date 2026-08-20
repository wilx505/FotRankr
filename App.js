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

import ChallengeScreen from './screens/ChallengeScreen';
import CompareScreen from './screens/CompareScreen';
import HeadToHead from './screens/HeadToHead';
import HomeScreen from './screens/HomeScreen';
import RankingsScreen from './screens/RankingsScreen';
import SearchScreen from './screens/SearchScreen';

import {
  comparePlayers,
  createPlayer,
} from './engine/rankingEngine.js';

const Stack =
  createNativeStackNavigator();

const Tab =
  createBottomTabNavigator();

const DATA_VERSION = '53';

export default function App() {

 const [myRankings, setMyRankings] = useState([]);

const [comparisonHistory, setComparisonHistory] = useState([]);

// =====================================================
// SMART H2H SESSION
// =====================================================
// Tracks the current automatic placement session.
// This is separate from permanent comparisonHistory.
//
// A session:
// - starts when a player is newly ranked
// - can contain a maximum of 6 H2Hs
// - prevents opponents repeating within the session
// - ends after the player has been placed
// =====================================================
const [smartH2HSession, setSmartH2HSession] = useState(null);

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

  // Let the ranking engine create the new player
  // at the starting position for this category.
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

  // New category anchors are added to the
  // existing rankings — they do NOT replace them.
  const playerWithDisplay = {
    ...anchorPlayer,
    isAnchor: true,
  };

  setMyRankings(previousRankings => [
    ...previousRankings,
    playerWithDisplay,
  ]);

  // This new player starts a fresh automatic
  // H2H process.
  //
  // IMPORTANT:
  // We do NOT clear the entire comparison history
  // because other players' H2Hs still need to exist.
  setComparisonHistory(previousHistory => [
    ...previousHistory,
  ]);
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

  setMyRankings(previousRankings => {

    const existingPlayer =
      previousRankings.find(
        rankedPlayer =>
          String(rankedPlayer.id) ===
          String(player.id)
      );
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


  // ==================================================
  // REMOVE PLAYER'S CURRENT RANKING
  // ==================================================

  setMyRankings(
    previousRankings =>
      previousRankings.filter(
        rankedPlayer =>
          String(rankedPlayer.id) !==
          String(player.id)
      )
  );


  // ==================================================
  // REMOVE ALL H2H HISTORY INVOLVING THIS PLAYER
  // ==================================================

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
    // ==================================================
    // SAME CATEGORY = DO NOTHING
    // ==================================================
    //
    // If the player is already in this category,
    // we MUST NOT recreate them.
    //
    // This preserves:
    // - rating
    // - score
    // - H2H history
    // - automatic H2H count
    //
    // ==================================================

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


    // ==================================================
    // GENUINE CATEGORY CHANGE
    // ==================================================

    return previousRankings.map(
      rankedPlayer => {

        if (
          String(rankedPlayer.id) !==
          String(player.id)
        ) {
          return rankedPlayer;
        }


        // Create a completely fresh ranking
        // for the NEW category.

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

          // Keep the fact that this player
          // is already in My Rankings.
          isRanked: true,
        };

      }
    );

  });


  // ==================================================
  // ONLY REMOVE HISTORY FOR A GENUINE CATEGORY CHANGE
  // ==================================================

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


  // ==================================================
  // REMOVE PLAYER FROM MY RANKINGS
  // ==================================================

  setMyRankings(
    previousRankings =>
      previousRankings.filter(
        rankedPlayer =>
          String(rankedPlayer.id) !==
          String(player.id)
      )
  );


  // ==================================================
  // REMOVE ALL H2H HISTORY INVOLVING THIS PLAYER
  // ==================================================

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


  setMyRankings(previousRankings => {

    // --------------------------------------------------
    // FIND EXISTING PLAYERS
    // --------------------------------------------------

    const findExistingPlayer = (sourcePlayer) => {

      return previousRankings.find(
        rankedPlayer =>
          String(rankedPlayer.id) ===
            String(sourcePlayer.id)
      );

    };


    // --------------------------------------------------
    // GET TARGET PLAYER
    // --------------------------------------------------

    let playerA =
      findExistingPlayer(player);


    // --------------------------------------------------
    // CREATE TARGET IF NECESSARY
    // --------------------------------------------------

    if (!playerA) {

      playerA =
        createPlayer(
          player,
          category
        );

    }


    // --------------------------------------------------
    // GET OPPONENT
    // --------------------------------------------------

    let playerB =
      findExistingPlayer(
        comparisonPlayer
      );


    // --------------------------------------------------
    // CREATE TEMPORARY OPPONENT IF NECESSARY
    // --------------------------------------------------

    if (!playerB) {

  playerB =
    createPlayer(
      comparisonPlayer,
      category
    );

}


    // --------------------------------------------------
    // RUN RANKING ENGINE
    // --------------------------------------------------

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


    // --------------------------------------------------
    // REMOVE OLD TARGET
    // AND OLD OPPONENT
    // --------------------------------------------------

    const otherPlayers =
      previousRankings.filter(
        rankedPlayer =>
          String(rankedPlayer.id) !==
            String(player.id) &&
          String(rankedPlayer.id) !==
            String(comparisonPlayer.id)
      );


    // --------------------------------------------------
    // TARGET ALWAYS STAYS IN MY RANKINGS
    // --------------------------------------------------

    const updatedRankings = [
      ...otherPlayers,
      updatedA,
    ];


    // --------------------------------------------------
    // ONLY SAVE OPPONENT IF THEY WERE ALREADY
    // GENUINELY RANKED
    // --------------------------------------------------

    if (opponentIsRanked === true) {

      console.log(
        'FOTRANKR: Saving existing ranked opponent:',
        updatedB.name
      );

      return [
        ...updatedRankings,
        updatedB,
      ];

    }


    // --------------------------------------------------
    // TEMPORARY H2H OPPONENT
    // --------------------------------------------------
    //
    // Do NOT save them.
    //
    // Their temporary 2000 rating is only used for
    // calculating this comparison.
    //
    // This is the key fix for the fake 5.00 players.
    // --------------------------------------------------

    console.log(
      'FOTRANKR: NOT saving temporary H2H opponent:',
      updatedB.name
    );

    return updatedRankings;

  });


  // --------------------------------------------------
  // SAVE HISTORY
  // --------------------------------------------------

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
// NAVIGATION
// =====================================================

return (

  <NavigationContainer>

    <Stack.Navigator>

      {/* =================================================
          MAIN APP TABS
          ================================================= */}

      <Stack.Screen
        name="MainTabs"
        options={{
          headerShown: false,
        }}
      >

        {({ navigation }) => (

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
              tabBarActiveTintColor: '#00ff66',
              tabBarInactiveTintColor: '#666666',
              tabBarLabelStyle: {
                fontSize: 11,
                fontWeight: '800',
              },
            }}
          >

            {/* HOME */}

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


            {/* SEARCH */}

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


            {/* MY RANKS */}

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

          </Tab.Navigator>

        )}

      </Stack.Screen>


      {/* =================================================
          RANKING PROCESS
          ================================================= */}

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

