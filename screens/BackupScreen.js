import AsyncStorage from '@react-native-async-storage/async-storage';

import * as DocumentPicker from 'expo-document-picker';

import * as Sharing from 'expo-sharing';

import {
  File,
  Paths,
} from 'expo-file-system';

import { useState } from 'react';

import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';


const BACKUP_KEYS = [
  'myRankings',
  'fotrankrLists',
  'comparisonHistory',
  'fotrankrDataVersion',
];


export default function BackupScreen({
  navigation,
  myRankings,
  lists,
  comparisonHistory,
  dataVersion,
  onRestore,
}) {

  const [busy, setBusy] = useState(false);


  // --------------------------------------------------
  // BACK
  // --------------------------------------------------

  const goBack = () => {
    navigation.goBack();
  };


  // --------------------------------------------------
  // BACKUP
  // --------------------------------------------------
  // Reads the saved keys, writes one JSON file to the
  // cache directory, then opens the share sheet.
  // --------------------------------------------------

  const handleBackup = async () => {

    setBusy(true);

    try {

      const data = {};

      for (const key of BACKUP_KEYS) {

        const value =
          await AsyncStorage.getItem(key);

        if (key === 'fotrankrDataVersion') {
          data[key] = value;
          continue;
        }

        const parsed =
          value ? JSON.parse(value) : [];

        data[key] =
          Array.isArray(parsed) ? parsed : [];
      }


      // Username only: the photo is a file on this phone.
      const savedProfile =
        await AsyncStorage.getItem('fotrankrProfile');

      if (savedProfile) {

        const { username, createdAt } =
          JSON.parse(savedProfile);

        data.fotrankrProfile = {
          username,
          createdAt,
        };
      }


      const backup = {
        app: 'FotRankr',
        version: 1,
        exportedAt: new Date().toISOString(),
        data,
      };


      const date =
        backup.exportedAt.slice(0, 10);

      const file = new File(
        Paths.cache,
        `fotrankr-backup-${date}.json`
      );

      // Same-day backups replace the earlier file.
      if (file.exists) {
        file.delete();
      }

      file.create();

      file.write(
        JSON.stringify(backup, null, 2)
      );


      if (!(await Sharing.isAvailableAsync())) {

        Alert.alert(
          'Sharing unavailable',
          'Sharing is not available on this device.'
        );

        return;
      }


      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/json',
        UTI: 'public.json',
        dialogTitle: 'Save FotRankr backup',
      });

    } catch (error) {

      console.log(
        'FOTRANKR BACKUP ERROR:',
        error
      );

      Alert.alert(
        'Backup failed',
        'Could not create the backup file.'
      );

    } finally {

      setBusy(false);

    }
  };


  // --------------------------------------------------
  // RESTORE
  // --------------------------------------------------

  const handleRestore = async () => {

    let backup;

    try {

      const result =
        await DocumentPicker.getDocumentAsync({
          type: [
            'application/json',
            'public.json',
          ],
          copyToCacheDirectory: true,
        });

      if (result.canceled) {
        return;
      }


      const picked = new File(
        result.assets[0].uri
      );

      backup = JSON.parse(
        await picked.text()
      );

    } catch (error) {

      console.log(
        'FOTRANKR RESTORE READ ERROR:',
        error
      );

      Alert.alert(
        'Restore failed',
        'That file could not be read as JSON.'
      );

      return;
    }


    // ------------------------------------------------
    // VALIDATE
    // ------------------------------------------------

    if (
      backup?.app !== 'FotRankr' ||
      !Array.isArray(backup?.data?.myRankings)
    ) {

      Alert.alert(
        'Invalid backup',
        'That file is not a FotRankr backup.'
      );

      return;
    }


    const restored = {
      myRankings: backup.data.myRankings,

      lists: Array.isArray(
        backup.data.fotrankrLists
      )
        ? backup.data.fotrankrLists
        : [],

      comparisonHistory: Array.isArray(
        backup.data.comparisonHistory
      )
        ? backup.data.comparisonHistory
        : [],

      profile:
        backup.data.fotrankrProfile || null,
    };


    const versionWarning =
      backup.data.fotrankrDataVersion &&
      backup.data.fotrankrDataVersion !==
        dataVersion
        ? `\n\nThis backup is from data version ${backup.data.fotrankrDataVersion} (current is ${dataVersion}), so some players may not match.`
        : '';


    // ------------------------------------------------
    // CONFIRM
    // ------------------------------------------------

    Alert.alert(
      'Replace your data?',
      `This will REPLACE your current rankings and lists with:\n\n` +
        `${restored.myRankings.length} rankings\n` +
        `${restored.lists.length} lists\n` +
        `${restored.comparisonHistory.length} comparisons` +
        versionWarning,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Replace',
          style: 'destructive',
          onPress: () =>
            applyRestore(restored),
        },
      ]
    );
  };


  const applyRestore = async (restored) => {

    setBusy(true);

    try {

      await onRestore(restored);

      Alert.alert(
        'Restore complete',
        'Your rankings and lists have been restored.'
      );

    } catch (error) {

      console.log(
        'FOTRANKR RESTORE ERROR:',
        error
      );

      Alert.alert(
        'Restore failed',
        'Your data could not be restored.'
      );

    } finally {

      setBusy(false);

    }
  };


  // --------------------------------------------------
  // SCREEN
  // --------------------------------------------------

  const counts = [
    {
      label: 'RANKINGS',
      value: myRankings.length,
    },
    {
      label: 'LISTS',
      value: lists.length,
    },
    {
      label: 'COMPARISONS',
      value: comparisonHistory.length,
    },
  ];


  return (

    <View style={styles.screen}>

      {/* -------------------------------------------- */}
      {/* TOP BAR */}
      {/* -------------------------------------------- */}

      <View style={styles.topBar}>

        <TouchableOpacity
          style={styles.backButton}
          onPress={goBack}
          activeOpacity={0.7}
        >

          <Text style={styles.backArrow}>
            ‹
          </Text>

        </TouchableOpacity>


        <Text style={styles.topBarTitle}>
          BACKUP
        </Text>


        <View style={styles.topBarSpacer} />

      </View>


      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        <Text style={styles.subtitle}>
          Save your data to a file, or restore
          {' '}it from one.
        </Text>


        {/* COUNTS */}

        <Text style={styles.sectionLabel}>
          WHAT WILL BE BACKED UP
        </Text>

        <View style={styles.countRow}>

          {counts.map(count => (

            <View
              key={count.label}
              style={styles.countBox}
            >

              <Text style={styles.countValue}>
                {count.value}
              </Text>

              <Text style={styles.countLabel}>
                {count.label}
              </Text>

            </View>

          ))}

        </View>


        {/* BACKUP */}

        <TouchableOpacity
          style={[
            styles.primaryButton,
            busy && styles.buttonDisabled,
          ]}
          onPress={handleBackup}
          disabled={busy}
          activeOpacity={0.8}
        >

          <Text style={styles.primaryButtonText}>
            BACK UP & SHARE
          </Text>

          <Text style={styles.primaryButtonSubtext}>
            Creates a .json file you can save anywhere
          </Text>

        </TouchableOpacity>


        {/* RESTORE */}

        <TouchableOpacity
          style={[
            styles.secondaryButton,
            busy && styles.buttonDisabled,
          ]}
          onPress={handleRestore}
          disabled={busy}
          activeOpacity={0.8}
        >

          <Text style={styles.secondaryButtonText}>
            RESTORE FROM FILE
          </Text>

          <Text style={styles.secondaryButtonSubtext}>
            Replaces your current rankings and lists
          </Text>

        </TouchableOpacity>

      </ScrollView>

    </View>

  );
}


// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({

  screen: {
    flex: 1,
    backgroundColor: '#050505',
  },


  // ==================================================
  // TOP BAR
  // ==================================================

  topBar: {
    height: 78,
    paddingHorizontal: 20,
    paddingTop: 35,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#050505',
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#1d1d1d',
    alignItems: 'center',
    justifyContent: 'center',
  },

  backArrow: {
    color: '#00ff66',
    fontSize: 32,
    fontWeight: '300',
    lineHeight: 34,
    marginTop: -2,
  },

  topBarTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  topBarSpacer: {
    width: 42,
  },


  // ==================================================
  // SCREEN
  // ==================================================

  container: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  subtitle: {
    color: '#777777',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 26,
  },

  sectionLabel: {
    color: '#555555',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 10,
    paddingLeft: 2,
  },


  // ==================================================
  // COUNTS
  // ==================================================

  countRow: {
    flexDirection: 'row',
    marginBottom: 26,
  },

  countBox: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1b1b1b',
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },

  countValue: {
    color: '#00ff66',
    fontSize: 24,
    fontWeight: '900',
  },

  countLabel: {
    color: '#777777',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 4,
  },


  // ==================================================
  // BUTTONS
  // ==================================================

  primaryButton: {
    backgroundColor: '#00ff66',
    borderRadius: 14,
    minHeight: 70,
    paddingHorizontal: 16,
    justifyContent: 'center',
    marginBottom: 12,
  },

  primaryButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  primaryButtonSubtext: {
    color: '#174d2d',
    fontSize: 11,
    marginTop: 3,
  },

  secondaryButton: {
    backgroundColor: '#0e0e0e',
    borderWidth: 1,
    borderColor: '#1d1d1d',
    borderRadius: 14,
    minHeight: 70,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },

  secondaryButtonText: {
    color: '#00ff66',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  secondaryButtonSubtext: {
    color: '#666666',
    fontSize: 11,
    marginTop: 3,
  },

  buttonDisabled: {
    opacity: 0.5,
  },

});
