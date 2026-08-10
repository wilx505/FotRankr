
/*
 * ============================================================
 * FOTRANKR RANKING ENGINE
 * ============================================================
 *
 * This file contains the mathematical ranking system.
 *
 * IMPORTANT:
 * The app should never directly change a player's score.
 *
 * The user only gives us a comparison:
 *
 *   PLAYER A is better
 *   EQUAL
 *   PLAYER B is better
 *
 * The engine then calculates the new ratings.
 *
 * ============================================================
 */


// ============================================================
// SETTINGS
// ============================================================

const SETTINGS = {

  // Starting rating for a completely new player.
  startingRating: 2000,

  // Starting uncertainty.
  //
  // A new player has a large amount of uncertainty because
  // we don't know where they belong yet.
  startingUncertainty: 350,

  // Minimum uncertainty.
  //
  // A player who has been compared many times should still
  // retain a small amount of flexibility.
  minimumUncertainty: 45,

  // Maximum rating.
  maxRating: 3000,

  // Minimum rating.
  minRating: 0,

};


// ============================================================
// CATEGORY BOUNDARIES
// ============================================================
//
// These are DISPLAY categories.
// They are not separate ranking systems.
//
// There is one continuous rating underneath.
//

const CATEGORY_BOUNDARIES = [

  {
    name: 'Legendary',
    minimumScore: 9.80,
  },

  {
    name: 'Elite',
    minimumScore: 9.00,
  },

  {
    name: 'Very Good',
    minimumScore: 8.00,
  },

  {
    name: 'Good',
    minimumScore: 6.00,
  },

  {
    name: 'OK',
    minimumScore: 4.00,
  },

  {
    name: 'Bad',
    minimumScore: 0.00,
  },

];

// ============================================================
// INTERNAL RATING → DISPLAY SCORE
// ============================================================
//
// 2000 = 9.80
//
// The hidden rating is continuous and precise.
// The displayed score is deliberately rounded to TWO decimals.
//

function ratingToScore(rating) {

  const rawScore =
    5.00 +
    (rating - 2000) / 200;

  const limitedScore =
    Math.max(
      0,
      Math.min(
        10,
        rawScore
      )
    );

  return Number(
    limitedScore.toFixed(2)
  );

}

// ============================================================
// DISPLAY SCORE → CATEGORY
// ============================================================

function scoreToCategory(score) {

  for (
    const category of CATEGORY_BOUNDARIES
  ) {

    if (
      score >=
      category.minimumScore
    ) {

      return category.name;

    }

  }

  return 'Bad';

}


// ============================================================
// CREATE PLAYER
// ============================================================
//
// We keep the internal rating separate from the displayed
// score.
//

function createPlayer(player) {

  return {

    id: player.id,

    name: player.name,

    nation:
      player.nation || '',

    position:
      player.position || '',

    rating:
      SETTINGS.startingRating,

    uncertainty:
      SETTINGS.startingUncertainty,

    comparisons: 0,

    wins: 0,

    losses: 0,

    draws: 0,

  };

}


// ============================================================
// EXPECTED RESULT
// ============================================================
//
// Standard Elo expectation.
//
// If both players are 2000:
//
// Expected result = 0.50
//
// If Player A is much higher:
//
// Expected result approaches 1.00
//

function expectedResult(
  ratingA,
  ratingB
) {

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

}


// ============================================================
// ADAPTIVE K FACTOR
// ============================================================
//
// New players need to move relatively quickly because
// we know very little about them.
//
// Established players move more slowly.
//

function getKFactor(player) {

  if (
    player.comparisons < 5
  ) {

    return 40;

  }

  if (
    player.comparisons < 15
  ) {

    return 28;

  }

  return 18;

}


// ============================================================
// UPDATE UNCERTAINTY
// ============================================================
//
// Every comparison gives us more information.
//
// Therefore uncertainty falls.
//
// It never falls below the minimum.
//

function updateUncertainty(
  player
) {

  const newUncertainty =
    player.uncertainty * 0.88;

  return Math.max(
    SETTINGS.minimumUncertainty,
    newUncertainty
  );

}


// ============================================================
// NORMALISE RESULT
// ============================================================

function normaliseResult(
  result
) {

  if (
    result === 'player' ||
    result === 'A' ||
    result === 'a'
  ) {

    return 'A';

  }

  if (
    result === 'comparison' ||
    result === 'B' ||
    result === 'b'
  ) {

    return 'B';

  }

  if (
    result === 'equal' ||
    result === 'draw' ||
    result === 'DRAW'
  ) {

    return 'DRAW';

  }

  throw new Error(
    `Unknown comparison result: ${result}`
  );

}


// ============================================================
// UPDATE A HEAD-TO-HEAD
// ============================================================
//
// This is the most important function in the engine.
//
// It takes:
//
//   Player A
//   Player B
//   Result
//
// and returns:
//
//   updated Player A
//   updated Player B
//

function comparePlayers(
  playerA,
  playerB,
  result
) {

  const outcome =
    normaliseResult(
      result
    );


  // ----------------------------------------------------------
  // Current ratings
  // ----------------------------------------------------------

  const ratingA =
    playerA.rating;

  const ratingB =
    playerB.rating;


  // ----------------------------------------------------------
  // Expected results
  // ----------------------------------------------------------

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


  // ----------------------------------------------------------
  // Actual results
  // ----------------------------------------------------------

  let actualA;
  let actualB;


  if (
    outcome === 'A'
  ) {

    actualA = 1;
    actualB = 0;

  }

  else if (
    outcome === 'B'
  ) {

    actualA = 0;
    actualB = 1;

  }

  else {

    actualA = 0.5;
    actualB = 0.5;

  }


  // ----------------------------------------------------------
  // K factors
  // ----------------------------------------------------------

  const kA =
    getKFactor(
      playerA
    );

  const kB =
    getKFactor(
      playerB
    );


  // ----------------------------------------------------------
  // Rating movement
  // ----------------------------------------------------------

  const changeA =
    kA *
    (
      actualA -
      expectedA
    );

  const changeB =
    kB *
    (
      actualB -
      expectedB
    );


  // ----------------------------------------------------------
  // New ratings
  // ----------------------------------------------------------

  const newRatingA =
    Math.max(
      SETTINGS.minRating,
      Math.min(
        SETTINGS.maxRating,
        ratingA + changeA
      )
    );

  const newRatingB =
    Math.max(
      SETTINGS.minRating,
      Math.min(
        SETTINGS.maxRating,
        ratingB + changeB
      )
    );


  // ----------------------------------------------------------
  // Update player statistics
  // ----------------------------------------------------------

  const updatedA = {

    ...playerA,

    rating:
      newRatingA,

    uncertainty:
      updateUncertainty(
        playerA
      ),

    comparisons:
      playerA.comparisons + 1,

    wins:
      playerA.wins +
      (
        outcome === 'A'
          ? 1
          : 0
      ),

    losses:
      playerA.losses +
      (
        outcome === 'B'
          ? 1
          : 0
      ),

    draws:
      playerA.draws +
      (
        outcome === 'DRAW'
          ? 1
          : 0
      ),

  };


  const updatedB = {

    ...playerB,

    rating:
      newRatingB,

    uncertainty:
      updateUncertainty(
        playerB
      ),

    comparisons:
      playerB.comparisons + 1,

    wins:
      playerB.wins +
      (
        outcome === 'B'
          ? 1
          : 0
      ),

    losses:
      playerB.losses +
      (
        outcome === 'A'
          ? 1
          : 0
      ),

    draws:
      playerB.draws +
      (
        outcome === 'DRAW'
          ? 1
          : 0
      ),

  };


  // ----------------------------------------------------------
  // Return the updated players
  // ----------------------------------------------------------

  return {

    playerA:
      addDisplayInformation(
        updatedA
      ),

    playerB:
      addDisplayInformation(
        updatedB
      ),

    expectedA,

    expectedB,

    changeA,

    changeB,

  };

}


// ============================================================
// ADD DISPLAY INFORMATION
// ============================================================
//
// This does NOT affect the mathematical rating.
//
// It simply calculates what the user should see.
//

function addDisplayInformation(
  player
) {

  const score =
    ratingToScore(
      player.rating
    );


  const category =
    scoreToCategory(
      score
    );


  return {

    ...player,

    score,

    category,

  };

}


// ============================================================
// FIND BEST NEXT OPPONENT
// ============================================================
//
// This is where FotRankr becomes smarter.
//
// We don't randomly choose an opponent.
//
// We want a player whose rating is close to the target player's
// rating.
//
// The closer the ratings, the more useful the comparison tends
// to be for establishing the player's position.
//

function findBestOpponent(
targetPlayer,
availablePlayers,
comparisonHistory = []
) {

if (
!availablePlayers ||
availablePlayers.length === 0
) {
return null;
}

const candidates =
availablePlayers.filter(
player => {

if (
player.id === targetPlayer.id
) {
return false;
}

const hasCompared =
comparisonHistory.some(
comparison =>

(
comparison.playerA === targetPlayer.id &&
comparison.playerB === player.id
) ||

(
comparison.playerB === targetPlayer.id &&
comparison.playerA === player.id
)

);

return !hasCompared;

}
);



if (candidates.length === 0) {
return null;
}

// Prefer players in the same position.
const samePosition =
candidates.filter(
player =>
player.position ===
targetPlayer.position
);

const pool =
samePosition.length > 0
? samePosition
: candidates;

// Find the player whose rating is closest.
pool.sort(
(a, b) => {

const distanceA =
Math.abs(
a.rating -
targetPlayer.rating
);

const distanceB =
Math.abs(
b.rating -
targetPlayer.rating
);

return (
distanceA -
distanceB
);

}
);

return pool[0];

}


// ============================================================
// SHOULD CONTINUE COMPARING?
// ============================================================
//
// We don't want to ask endless questions.
//
// A player with lots of comparisons and low uncertainty can
// normally stop.
//
// A new player should continue.
//
// For now this is intentionally conservative.
//
// ============================================================
// CONFIDENCE
// ============================================================
//
// Converts mathematical uncertainty into a simple label that
// the app can show to the user.
//
// Lower uncertainty = higher confidence.
//

function getConfidence(player) {

  if (player.uncertainty <= 100) {
    return 'High';
  }

  if (player.uncertainty <= 200) {
    return 'Medium';
  }

  return 'Low';

}

function shouldContinueComparing(
  player
) {

  if (
    player.comparisons < 3
  ) {

    return true;

  }


  if (
    player.uncertainty > 150
  ) {

    return true;

  }


  return false;

}


// ============================================================
// PUBLIC API
// ============================================================
//
// These are the functions the React Native app will eventually
// import.
//

export {
  CATEGORY_BOUNDARIES,
  comparePlayers,
  createPlayer,
  findBestOpponent,
  getConfidence,
  ratingToScore,
  scoreToCategory,
  SETTINGS,
  shouldContinueComparing
};

