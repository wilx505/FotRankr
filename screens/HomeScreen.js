import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';

import players from '../players';

export default function HomeScreen({
  navigation,
}) {

  const [search, setSearch] = useState('');

  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ScrollView style={styles.container}>

      <Text style={styles.title}>
        FOTRANKR
      </Text>

      <Text style={styles.subtitle}>
        Rank every footballer in the world
      </Text>

      <TouchableOpacity
        style={styles.rankingsButton}
        onPress={() => navigation.navigate('Rankings')}
      >
        <Text style={styles.rankingsButtonText}>
          MY RANKINGS
        </Text>
      </TouchableOpacity>

      <TextInput
        style={styles.search}
        placeholder="Search any footballer..."
        placeholderTextColor="#777"
        value={search}
        onChangeText={setSearch}
      />

      {filteredPlayers.map(player => (

        <TouchableOpacity
          key={player.id}
          style={styles.playerBox}
          onPress={() =>
            navigation.navigate('Compare', {
              player: player,
              isFirstPlayer: true,
            })
          }
        >

          <Text style={styles.player}>
            {player.name}
          </Text>

          <Text style={styles.info}>
            {player.nation} • {player.position}
          </Text>

        </TouchableOpacity>

      ))}

    </ScrollView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#050505',
    padding: 25,
  },

  title: {
    color: '#00ff66',
    fontSize: 42,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 70,
  },

  subtitle: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    marginTop: 10,
    marginBottom: 25,
  },

  rankingsButton: {
    backgroundColor: '#00ff66',
    padding: 15,
    borderRadius: 12,
    marginBottom: 25,
  },

  rankingsButtonText: {
    color: 'black',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  search: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    fontSize: 18,
    marginBottom: 15,
  },

  playerBox: {
    backgroundColor: '#111',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
  },

  player: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },

  info: {
    color: '#cccccc',
    fontSize: 14,
    marginTop: 5,
  },

});

