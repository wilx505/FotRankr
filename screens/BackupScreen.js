import AsyncStorage from '@react-native-async-storage/async-storage';

import * as DocumentPicker from 'expo-document-picker';

import * as Sharing from 'expo-sharing';

import {
  File,
  Paths,
} from 'expo-file-system';

import {
  useEffect,
  useState,
} from 'react';

import {
  listAutoBackups,
  readAutoBackup,
} from '../utils/autoBackup';

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
  onRestore,
  onResetAll,
}) {

  const [busy, setBusy] = useState(false);

  const [autoBackups, setAutoBackups] =
    useState([]);

  const refreshAutoBackups = () => {
    listAutoBackups().then(setAutoBackups);
  };

  useEffect(refreshAutoBackups, []);


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


      // Permanent XP / badge record.
      const savedProgress =
        await AsyncStorage.getItem('fotrankrProgress');

      if (savedProgress) {
        data.fotrankrProgress = JSON.parse(savedProgress);
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


    confirmRestore(backup);
  };


  // --------------------------------------------------
  // RESTORE AN AUTOMATIC BACKUP
  // --------------------------------------------------

  const handleRestoreAuto = async (uri) => {

    try {

      confirmRestore(await readAutoBackup(uri));

    } catch (error) {

      console.log(
        'FOTRANKR AUTO RESTORE READ ERROR:',
        error
      );

      Alert.alert(
        'Restore failed',
        'That automatic backup could not be read.'
      );

    }
  };


  // --------------------------------------------------
  // CHECK + CONFIRM (file or automatic backup)
  // --------------------------------------------------

  const confirmRestore = (backup) => {

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

      earned:
        backup.data.fotrankrProgress || null,
    };


    // ------------------------------------------------
    // CONFIRM
    // ------------------------------------------------

    Alert.alert(
      'Replace your data?',
      `This will REPLACE your current rankings and lists with:\n\n` +
        `${restored.myRankings.length} rankings\n` +
        `${restored.lists.length} lists\n` +
        `${restored.comparisonHistory.length} comparisons`,
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

      refreshAutoBackups();

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
  // RESET ALL DATA
  // --------------------------------------------------
  // The only way to wipe rankings. A safety copy is taken
  // first, so even this can be undone from the list.

  const handleResetAll = () => {

    Alert.alert(
      'Reset all data?',
      'This deletes ALL your rankings, lists, head-to-heads, XP and badges, and starts you from Level 1. Your profile is kept.\n\nA safety copy is saved first, so you can restore it from Automatic Backups.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {

            setBusy(true);

            try {

              await onResetAll();

              refreshAutoBackups();

              Alert.alert(
                'Data reset',
                'You are starting fresh from Level 1.'
              );

            } catch (error) {

              console.log(
                'FOTRANKR RESET ERROR:',
                error
              );

              Alert.alert(
                'Reset failed',
                'Your data could not be reset.'
              );

            } finally {

              setBusy(false);

            }
          },
        },
      ]
    );
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


        {/* AUTOMATIC BACKUPS */}

        <Text style={[styles.sectionLabel, styles.sectionGap]}>
          AUTOMATIC BACKUPS
        </Text>

        <Text style={styles.autoIntro}>
          A copy is saved on this phone every time the app
          {' '}opens. The last 7 are kept.
        </Text>

        {autoBackups.length === 0 ? (

          <Text style={styles.autoEmpty}>
            None yet. One is saved next time the app opens with rankings.
          </Text>

        ) : (

          autoBackups.map(backup => (

            <View
              key={backup.uri}
              style={styles.autoRow}
            >

              <View style={styles.autoDetails}>

                <Text style={styles.autoDate}>
                  {new Date(backup.exportedAt).toLocaleString()}
                </Text>

                <Text style={styles.autoMeta}>
                  {backup.rankings} rankings
                  {'  ·  '}
                  {backup.lists} lists
                </Text>

              </View>

              <TouchableOpacity
                style={[
                  styles.autoButton,
                  busy && styles.buttonDisabled,
                ]}
                onPress={() =>
                  handleRestoreAuto(backup.uri)
                }
                disabled={busy}
                activeOpacity={0.8}
              >

                <Text style={styles.autoButtonText}>
                  RESTORE
                </Text>

              </TouchableOpacity>

            </View>

          ))

        )}


        {/* RESET */}

        <TouchableOpacity
          style={[
            styles.resetButton,
            busy && styles.buttonDisabled,
          ]}
          onPress={handleResetAll}
          disabled={busy}
          activeOpacity={0.8}
        >

          <Text style={styles.resetButtonText}>
            RESET ALL DATA
          </Text>

          <Text style={styles.resetButtonSubtext}>
            Start fresh from Level 1 (a safety copy is saved first)
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


  // ==================================================
  // AUTOMATIC BACKUPS + RESET
  // ==================================================

  sectionGap: {
    marginTop: 30,
  },

  autoIntro: {
    color: '#666666',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
    paddingLeft: 2,
  },

  autoEmpty: {
    color: '#555555',
    fontSize: 12,
    paddingLeft: 2,
  },

  autoRow: {
    backgroundColor: '#0f0f0f',
    borderWidth: 1,
    borderColor: '#1b1b1b',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },

  autoDetails: {
    flex: 1,
  },

  autoDate: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },

  autoMeta: {
    color: '#777777',
    fontSize: 11,
    marginTop: 3,
  },

  autoButton: {
    borderWidth: 1,
    borderColor: '#00ff66',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 12,
    marginLeft: 10,
  },

  autoButtonText: {
    color: '#00ff66',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  resetButton: {
    borderWidth: 1,
    borderColor: '#E74C3C',
    borderRadius: 14,
    minHeight: 64,
    paddingHorizontal: 16,
    justifyContent: 'center',
    marginTop: 30,
  },

  resetButtonText: {
    color: '#E74C3C',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  resetButtonSubtext: {
    color: '#666666',
    fontSize: 11,
    marginTop: 3,
  },

});
