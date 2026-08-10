import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function CompareScreen({ route, navigation }) {

  const { player } = route.params;

  const categories = [
    {
      name: 'Legendary',
      description: 'The very best players in football history',
      colour: '#FFD700',
    },
    {
      name: 'Elite',
      description: 'World-class players at the highest level',
      colour: '#00ff66',
    },
    {
      name: 'Very Good',
      description: 'Excellent players who perform consistently',
      colour: '#4DA6FF',
    },
    {
      name: 'Good',
      description: 'Strong and reliable footballers',
      colour: '#9B59B6',
    },
    {
      name: 'OK',
      description: 'Solid professional-level players',
      colour: '#F39C12',
    },
    {
      name: 'Bad',
      description: 'Players currently below the standard',
      colour: '#E74C3C',
    },
  ];

  const chooseCategory = (category) => {

    navigation.navigate('HeadToHead', {
      player,
      category: category.name,
    });

  };

  return (
    <ScrollView style={styles.container}>

      <Text style={styles.title}>
        RATE PLAYER
      </Text>

      <View style={styles.playerBox}>

        <Text style={styles.playerName}>
          {player.name}
        </Text>

        <Text style={styles.info}>
          {player.nation} • {player.position}
        </Text>

      </View>

      <Text style={styles.question}>
        Which category does {player.name} belong in?
      </Text>

      {categories.map((category) => (

        <TouchableOpacity
          key={category.name}
          style={[
            styles.categoryBox,
            { borderColor: category.colour },
          ]}
          onPress={() => chooseCategory(category)}
        >

          <Text
            style={[
              styles.categoryName,
              { color: category.colour },
            ]}
          >
            {category.name}
          </Text>

          <Text style={styles.description}>
            {category.description}
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
    padding: 20,
  },

  title: {
    color: '#00ff66',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 30,
    marginBottom: 25,
  },

  playerBox: {
    backgroundColor: '#111111',
    borderRadius: 15,
    padding: 22,
    alignItems: 'center',
    marginBottom: 30,
  },

  playerName: {
    color: '#00ff66',
    fontSize: 28,
    fontWeight: 'bold',
  },

  info: {
    color: '#aaaaaa',
    fontSize: 16,
    marginTop: 8,
  },

  question: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },

  categoryBox: {
    backgroundColor: '#111111',
    borderWidth: 2,
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },

  categoryName: {
    fontSize: 23,
    fontWeight: 'bold',
  },

  description: {
    color: '#999999',
    fontSize: 14,
    marginTop: 7,
  },

});

