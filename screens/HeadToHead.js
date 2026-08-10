import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { findBestOpponent } from '../engine/rankingEngine';
import players from '../players';

export default function HeadToHead({
  route,
  navigation,
  onResult,
  myRankings,
  comparisonHistory,
}) {

  const {
    player,
    category,
  } = route.params;


  // --------------------------------------------------
  // TEMPORARY COMPARISON PLAYER
  // --------------------------------------------------

const rankedPlayers = players.map(p => {

  const existingRanking = myRankings?.find(
    ranking =>
      ranking.id === p.id ||
      ranking.playerId === p.id
  );

  return {
    ...p,

    rating:
      existingRanking?.rating ??
      existingRanking?.internalRating ??
      2000,

    uncertainty:
      existingRanking?.uncertainty ??
      350,

    comparisons:
      existingRanking?.comparisons ??
      0,

    wins:
      existingRanking?.wins ??
      0,

    losses:
      existingRanking?.losses ??
      0,

    draws:
      existingRanking?.draws ??
      0,
  };

});

const targetPlayer = {
  ...player,

  rating:
    myRankings?.find(
      ranking =>
        ranking.id === player.id ||
        ranking.playerId === player.id
    )?.rating ??
    myRankings?.find(
      ranking =>
        ranking.id === player.id ||
        ranking.playerId === player.id
    )?.internalRating ??
    2000,

  uncertainty:
    350,

  comparisons:
    0,

  wins:
    0,

  losses:
    0,

  draws:
    0,
};


const availableOpponents = rankedPlayers.filter(
  rankedPlayer =>
    rankedPlayer.id !== player.id
);

const comparisonPlayer = findBestOpponent(
  targetPlayer,
  availableOpponents,
  comparisonHistory
);
console.log(
  'HEAD TO HEAD DEBUG:',
  {
    selected: {
      id: player.id,
      name: player.name,
    },
    opponent: comparisonPlayer
      ? {
          id: comparisonPlayer.id,
          name: comparisonPlayer.name,
        }
      : null,
  }
);


  // --------------------------------------------------
  // HANDLE RESULT
  // --------------------------------------------------

  const updateScores = (result) => {

    console.log(
      'SENDING HEAD TO HEAD:',
      {
        player: player.name,
        comparisonPlayer: comparisonPlayer.name,
        category: category,
        result: result,
      }
    );


    onResult({

      player,

      comparisonPlayer,

      // THIS WAS MISSING BEFORE
      category,

      result,

    });


    navigation.navigate(
      'Rankings'
    );

  };


  return (

    <View style={styles.container}>

      <Text style={styles.title}>
        HEAD TO HEAD
      </Text>


      <Text style={styles.category}>
        {category}
      </Text>


      <View style={styles.comparisonBox}>


        {/* PLAYER */}

        <View style={styles.playerSide}>


          <Text style={styles.playerName}>
            {comparisonPlayer?.name}
          </Text>

          <Text style={styles.info}>
            {comparisonPlayer?.nation}
          </Text>

        </View>


        <Text style={styles.vs}>
          VS
        </Text>


{/* COMPARISON PLAYER */}

<View style={styles.playerSide}>

  <Text style={styles.playerName}>
    {comparisonPlayer?.name ?? 'No opponent'}
  </Text>

  <Text style={styles.info}>
    {comparisonPlayer?.nation ?? ''}
  </Text>

</View>

</View>

<Text style={styles.question}>
  Who is better?
</Text>

      {/* PLAYER WINS */}

      <TouchableOpacity
        style={styles.greenButton}
        onPress={() =>
          updateScores('player')
        }
      >

        <Text style={styles.buttonText}>
          {player.name} is better
        </Text>

      </TouchableOpacity>


      {/* DRAW */}

      <TouchableOpacity
        style={styles.greyButton}
        onPress={() =>
          updateScores('equal')
        }
      >

        <Text style={styles.buttonText}>
          They are equally good
        </Text>

      </TouchableOpacity>


      {/* COMPARISON PLAYER WINS */}

      <TouchableOpacity
        style={styles.redButton}
        onPress={() =>
          updateScores('comparison')
        }
      >

        <Text style={styles.buttonText}>
          {comparisonPlayer.name} is better
        </Text>

      </TouchableOpacity>

    </View>

  );

}


const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#050505',
    padding: 20,
    justifyContent: 'center',
  },

  title: {
    color: '#00ff66',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },

  category: {
    color: '#aaaaaa',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 35,
  },

  comparisonBox: {
    backgroundColor: '#111111',
    borderRadius: 18,
    padding: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  playerSide: {
    width: '38%',
    alignItems: 'center',
  },

  flag: {
    fontSize: 35,
    marginBottom: 10,
  },

  playerName: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  info: {
    color: '#888888',
    fontSize: 14,
    marginTop: 5,
  },

  vs: {
    color: '#00ff66',
    fontSize: 22,
    fontWeight: 'bold',
  },

  question: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 35,
    marginBottom: 20,
  },

  greenButton: {
    backgroundColor: '#00ff66',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },

  greyButton: {
    backgroundColor: '#333333',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },

  redButton: {
    backgroundColor: '#e74c3c',
    padding: 16,
    borderRadius: 12,
  },

  buttonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },

});

