import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { useState } from 'react';

export default function CreateListScreen({
  navigation,
  onCreateList,
}) {

  const [listName, setListName] = useState('');

  const createList = () => {

    const trimmedName = listName.trim();

    if (trimmedName.length === 0) {
      return;
    }

 const newList = {
  id: Date.now().toString(),
  name: listName,
  players: [],
  createdAt: new Date().toISOString(),
};

onCreateList(newList);

navigation.navigate('AddPlayersToList', {
  list: newList,
});
  };

  return (

    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >

      {/* HEADER */}

      <View style={styles.header}>

        <Text style={styles.brand}>
          FotRankr
        </Text>

        <View style={styles.brandLine} />

      </View>


      {/* TITLE */}

      <Text style={styles.title}>
        Create a list.
      </Text>

      <Text style={styles.subtitle}>
        Build your own football
        {' '}
        ranking list.
      </Text>


      {/* NAME */}

      <View style={styles.section}>

        <Text style={styles.sectionTitle}>
          LIST NAME
        </Text>

        <TextInput
          style={styles.input}
          placeholder="e.g. Top 10 Premier League Players"
          placeholderTextColor="#555555"
          value={listName}
          onChangeText={setListName}
          autoCapitalize="sentences"
          autoCorrect={false}
        />

      </View>


      {/* EXAMPLE */}

      <View style={styles.exampleBox}>

        <Text style={styles.exampleLabel}>
          EXAMPLE
        </Text>

        <Text style={styles.exampleTitle}>
          Top 10 Premier League Players
        </Text>

        <Text style={styles.exampleText}>
          Create a personal list of your
          favourite players, best players,
          club legends or anything else
          you want to rank.
        </Text>

      </View>


      {/* CREATE */}

      <TouchableOpacity
        style={[
          styles.createButton,
          listName.trim().length === 0 &&
            styles.createButtonDisabled,
        ]}
        onPress={createList}
        activeOpacity={0.75}
      >

        <Text style={styles.createButtonText}>
          CREATE LIST
        </Text>

        <Text style={styles.arrow}>
          →
        </Text>

      </TouchableOpacity>


      {/* CANCEL */}

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() =>
          navigation.goBack()
        }
        activeOpacity={0.7}
      >

        <Text style={styles.cancelText}>
          CANCEL
        </Text>

      </TouchableOpacity>

    </ScrollView>

  );

}


const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#050505',
  },

  content: {
    paddingHorizontal: 22,
    paddingBottom: 60,
  },

  header: {
    paddingTop: 55,
    marginBottom: 42,
  },

  brand: {
    color: '#00ff66',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
  },

  brandLine: {
    width: 38,
    height: 3,
    backgroundColor: '#00ff66',
    marginTop: 8,
    borderRadius: 2,
  },

  title: {
    color: '#ffffff',
    fontSize: 40,
    lineHeight: 43,
    fontWeight: '900',
    letterSpacing: -1.8,
  },

  subtitle: {
    color: '#777777',
    fontSize: 16,
    lineHeight: 23,
    marginTop: 11,
    marginBottom: 32,
  },

  section: {
    marginBottom: 25,
  },

  sectionTitle: {
    color: '#00ff66',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 12,
  },

  input: {
    height: 62,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#242424',
    borderRadius: 16,
    paddingHorizontal: 17,
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  exampleBox: {
    backgroundColor: '#0d0d0d',
    borderWidth: 1,
    borderColor: '#1d1d1d',
    borderRadius: 16,
    padding: 18,
    marginBottom: 25,
  },

  exampleLabel: {
    color: '#555555',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 9,
  },

  exampleTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },

  exampleText: {
    color: '#666666',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
  },

  createButton: {
    height: 62,
    backgroundColor: '#00ff66',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  createButtonDisabled: {
    opacity: 0.3,
  },

  createButtonText: {
    color: '#050505',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  arrow: {
    color: '#050505',
    fontSize: 20,
    fontWeight: '900',
    marginLeft: 10,
  },

  cancelButton: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },

  cancelText: {
    color: '#555555',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

});