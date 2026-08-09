import { Text, TouchableOpacity } from 'react-native';

export default function PlayerCard({ player, onPress }) {

  return (
    <TouchableOpacity
      style={styles.playerBox}
      onPress={onPress}
    >

      <Text style={styles.player}>
        {player.name}
      </Text>

      <Text style={styles.info}>
        {player.nation} • {player.position}
      </Text>

    </TouchableOpacity>
  );
}

const styles = {
  playerBox: {
    backgroundColor: '#111',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
  },

  player: {
    color: 'white',
    fontSize: 20,
  },

  info: {
    color: '#cccccc',
    fontSize: 16,
    marginTop: 6,
  },
};
