import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';

import CompareScreen from './screens/CompareScreen';
import HeadToHead from './screens/HeadToHead';
import HomeScreen from './screens/HomeScreen';
import RankingsScreen from './screens/RankingsScreen';

const Stack = createNativeStackNavigator();


// ======================================================
// DATA VERSION
// ======================================================

// This forces the old broken ranking data to be removed
// once. After that, the new system will save normally.

const DATA_VERSION = '3';


// ======================================================
// CATEGORY SETTINGS
// ======================================================

const CATEGORIES = {
  Legendary: {
    score: 9.80,
    elo: 2000,
  },

  Elite: {
    score: 8.00,
    elo: 1800,
  },

  'Very Good': {
    score: 6.00,
    elo: 1500,
  },

  Good: {
    score: 4.00,
    elo: 1100,
  },

  OK: {
    score: 2.00,
    elo: 700,
  },

  Bad: {
    score: 0.00,
    elo: 300,
  },
};


// ======================================================
// CATEGORY FROM SCORE
// ======================================================

const getCategoryFromScore = (score) => {

  if (score >= 9.80) {
    return 'Legendary';
  }

  if (score >= 8.00) {
    return 'Elite';
  }

  if (score >= 6.00) {
    return 'Very Good';
  }

  if (score >= 4.00) {
    return 'Good';
  }

  if (score >= 2.00) {
    return 'OK';
  }

  return 'Bad';
};


// ======================================================
// SAFE NUMBER
// ======================================================

const safeNumber = (value, fallback = 0) => {

  const number = Number(value);

  if (Number.isFinite(number)) {
    return number;
  }

  return fallback;
};


// ======================================================
// ELO EXPECTED RESULT
// ======================================================

const expectedResult = (
  ratingA,
  ratingB
) => {

  return (
    1 /
    (
      1 +
      Math.pow(
        10,
        (ratingB - ratingA) / 400
      )
    )
  );

};


// ======================================================
// APP
// ======================================================

export default function App() {

  const [
    myRankings,
    setMyRankings
  ] = useState([]);


  const [
    comparisonHistory,
    setComparisonHistory
  ] = useState([]);


  const [
    dataLoaded,
    setDataLoaded
  ] = useState(false);


  // ====================================================
  // LOAD DATA
  // ====================================================

  useEffect(() => {

    loadData();

  }, []);


  // ====================================================
  // SAVE DATA
  // ====================================================

  useEffect(() => {

    // IMPORTANT:
    // Do not save anything until the old data has
    // finished loading.

    if (!dataLoaded) {
      return;
    }

    saveData();

  }, [
    myRankings,
    comparisonHistory,
    dataLoaded
  ]);


  // ====================================================
  // LOAD DATA
  // ====================================================

  const loadData = async () => {

    try {

      const savedVersion =
        await AsyncStorage.getItem(
          'fotrankrDataVersion'
        );


      // -----------------------------------------------
      // REMOVE OLD BROKEN DATA
      // -----------------------------------------------

      if (
        savedVersion !== DATA_VERSION
      ) {

        console.log(
          'FotRankr: Clearing old ranking data.'
        );


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

        return;
      }


      // -----------------------------------------------
      // LOAD CURRENT DATA
      // -----------------------------------------------

      const savedRankings =
        await AsyncStorage.getItem(
          'myRankings'
        );


      const savedHistory =
        await AsyncStorage.getItem(
          'comparisonHistory'
        );


      if (savedRankings) {

        try {

          const parsed =
            JSON.parse(
              savedRankings
            );


          if (
            Array.isArray(parsed)
          ) {

            setMyRankings(
              parsed
            );

          }

        } catch (error) {

          console.log(
            'Invalid ranking data. Resetting.'
          );

          setMyRankings([]);

        }

      }


      if (savedHistory) {

        try {

          const parsedHistory =
            JSON.parse(
              savedHistory
            );


          if (
            Array.isArray(
              parsedHistory
            )
          ) {

            setComparisonHistory(
              parsedHistory
            );

          }

        } catch (error) {

          setComparisonHistory([]);

        }

      }


      setDataLoaded(true);

    } catch (error) {

      console.log(
        'Error loading FotRankr data:',
        error
      );


      setMyRankings([]);

      setComparisonHistory([]);

      setDataLoaded(true);

    }

  };


  // ====================================================
  // SAVE DATA
  // ====================================================

  const saveData = async () => {

    try {

      await AsyncStorage.setItem(
        'myRankings',
        JSON.stringify(
          myRankings
        )
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
        'Error saving FotRankr data:',
        error
      );

    }

  };


  // ====================================================
  // HEAD TO HEAD
  // ====================================================

  const handleHeadToHeadResult = ({
    player,
    comparisonPlayer,
    category,
    result,
  }) => {

    console.log(
      'HEAD TO HEAD RESULT:',
      {
        player:
          player?.name,

        comparisonPlayer:
          comparisonPlayer?.name,

        category,

        result,
      }
    );


    // -----------------------------------------------
    // Make sure category is valid.
    // -----------------------------------------------

    const validCategory =
      Object.keys(
        CATEGORIES
      ).find(
        name =>
          name.toLowerCase() ===
          String(category)
            .trim()
            .toLowerCase()
      );


    if (!validCategory) {

      console.log(
        'Invalid category:',
        category
      );

      return;

    }


    setMyRankings(
      previousRankings => {

        let rankings =
          [...previousRankings];


        // ==================================================
        // FIND PLAYER
        // ==================================================

        let playerA =
          rankings.find(
            item =>
              item.playerId ===
              player.id
          );


        // ==================================================
        // FIND COMPARISON PLAYER
        // ==================================================

        let playerB =
          rankings.find(
            item =>
              item.playerId ===
              comparisonPlayer.id
          );


        // ==================================================
        // CREATE PLAYER A
        // ==================================================

        if (!playerA) {

          const categorySettings =
            CATEGORIES[
              validCategory
            ];


          playerA = {

            playerId:
              player.id,

            name:
              player.name,

            nation:
              player.nation,

            position:
              player.position,

            score:
              categorySettings.score,

            rating:
              validCategory,

            internalRating:
              categorySettings.elo,

            comparisons:
              0,

          };


          rankings.push(
            playerA
          );

        }


        // ==================================================
        // CREATE PLAYER B
        // ==================================================

        if (!playerB) {

          const categorySettings =
            CATEGORIES[
              validCategory
            ];


          playerB = {

            playerId:
              comparisonPlayer.id,

            name:
              comparisonPlayer.name,

            nation:
              comparisonPlayer.nation,

            position:
              comparisonPlayer.position,

            score:
              categorySettings.score,

            rating:
              validCategory,

            internalRating:
              categorySettings.elo,

            comparisons:
              0,

          };


          rankings.push(
            playerB
          );

        }


        // ==================================================
        // CURRENT RATINGS
        // ==================================================

        const ratingA =
          safeNumber(
            playerA.internalRating,
            CATEGORIES[
              validCategory
            ].elo
          );


        const ratingB =
          safeNumber(
            playerB.internalRating,
            CATEGORIES[
              validCategory
            ].elo
          );


        // ==================================================
        // EXPECTED RESULTS
        // ==================================================

        const expectedA =
          expectedResult(
            ratingA,
            ratingB
          );


        const expectedB =
          expectedResult(
            ratingB,
            ratingA
          );


        // ==================================================
        // ACTUAL RESULT
        // ==================================================

        let actualA = 0.5;
        let actualB = 0.5;


        if (
          result === 'player'
        ) {

          actualA = 1;
          actualB = 0;

        }


        if (
          result === 'comparison'
        ) {

          actualA = 0;
          actualB = 1;

        }


        // ==================================================
        // K FACTOR
        // ==================================================

        const comparisonsA =
          safeNumber(
            playerA.comparisons,
            0
          );


        const comparisonsB =
          safeNumber(
            playerB.comparisons,
            0
          );


        const kA =
          comparisonsA < 10
            ? 32
            : 16;


        const kB =
          comparisonsB < 10
            ? 32
            : 16;


        // ==================================================
        // NEW INTERNAL RATINGS
        // ==================================================

        const newRatingA =
          ratingA +
          kA *
          (
            actualA -
            expectedA
          );


        const newRatingB =
          ratingB +
          kB *
          (
            actualB -
            expectedB
          );


        // ==================================================
        // CONVERT INTERNAL RATING TO SCORE
        // ==================================================

        /*
         *
         * 2000 = 9.80
         *
         * 1900 = 9.79
         *
         * 1800 = 9.78
         *
         * etc.
         *
         * This gives us a very precise ranking system.
         *
         */

        const newScoreA =
          9.80 +
          (
            newRatingA -
            2000
          ) / 10000;


        const newScoreB =
          9.80 +
          (
            newRatingB -
            2000
          ) / 10000;


        // ==================================================
        // ROUND TO TWO DECIMAL PLACES
        // ==================================================

        const finalScoreA =
          Number(
            Math.max(
              0,
              Math.min(
                10,
                newScoreA
              )
            ).toFixed(2)
          );


        const finalScoreB =
          Number(
            Math.max(
              0,
              Math.min(
                10,
                newScoreB
              )
            ).toFixed(2)
          );


        console.log(
          'NEW SCORES:',
          {
            [player.name]:
              finalScoreA,

            [comparisonPlayer.name]:
              finalScoreB,
          }
        );


        // ==================================================
        // UPDATE PLAYERS
        // ==================================================

        rankings =
          rankings.map(
            item => {


              // --------------------------------------------
              // PLAYER A
              // --------------------------------------------

              if (
                item.playerId ===
                player.id
              ) {

                return {

                  ...item,

                  internalRating:
                    newRatingA,

                  score:
                    finalScoreA,

                  rating:
                    getCategoryFromScore(
                      finalScoreA
                    ),

                  comparisons:
                    comparisonsA + 1,

                };

              }


              // --------------------------------------------
              // PLAYER B
              // --------------------------------------------

              if (
                item.playerId ===
                comparisonPlayer.id
              ) {

                return {

                  ...item,

                  internalRating:
                    newRatingB,

                  score:
                    finalScoreB,

                  rating:
                    getCategoryFromScore(
                      finalScoreB
                    ),

                  comparisons:
                    comparisonsB + 1,

                };

              }


              return item;

            }
          );


        return rankings;

      }
    );


    // ==================================================
    // RECORD COMPARISON
    // ==================================================

    setComparisonHistory(
      previousHistory => [

        ...previousHistory,

        {

          playerA:
            player.id,

          playerB:
            comparisonPlayer.id,

          result,

          category:
            validCategory,

          date:
            new Date().toISOString(),

        },

      ]
    );

  };


  // ====================================================
  // NAVIGATION
  // ====================================================

  return (

    <NavigationContainer>

      <Stack.Navigator>


        {/* HOME */}

        <Stack.Screen
          name="Home"
          options={{
            title: 'FotRankr',
          }}
        >

          {({
            navigation
          }) => (

            <HomeScreen

              myRankings={
                myRankings
              }

              setMyRankings={
                setMyRankings
              }

              navigation={
                navigation
              }

            />

          )}

        </Stack.Screen>


        {/* MY RANKINGS */}

        <Stack.Screen
          name="Rankings"
          options={{
            title: 'My Rankings',
          }}
        >

          {() => (

            <RankingsScreen
              myRankings={
                myRankings
              }
            />

          )}

        </Stack.Screen>


        {/* CATEGORY */}

        <Stack.Screen
          name="Compare"
          component={
            CompareScreen
          }
        />


        {/* HEAD TO HEAD */}

        <Stack.Screen
          name="HeadToHead"
        >

          {({
            navigation,
            route
          }) => (

            <HeadToHead

              navigation={
                navigation
              }

              route={
                route
              }

              onResult={
                handleHeadToHeadResult
              }

            />

          )}

        </Stack.Screen>


      </Stack.Navigator>

    </NavigationContainer>

  );

}

