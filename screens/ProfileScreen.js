import * as ImagePicker from 'expo-image-picker';

import {
  File,
  Paths,
} from 'expo-file-system';

import { useState } from 'react';

import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  XP_PER_LEVEL,
  getProgress,
  unlockedGroups,
} from '../utils/progression';

import { getBadges } from '../utils/badges';

import ClubBadge from '../components/ClubBadge';


const USERNAME_PATTERN = /^[a-zA-Z0-9_.]{3,20}$/;


// Deletes a profile photo we saved, ignoring anything else.
const deletePhoto = (uri) => {

  try {

    if (!uri || !uri.startsWith(Paths.document.uri)) {
      return;
    }

    const file = new File(uri);

    if (file.exists) {
      file.delete();
    }

  } catch (error) {

    console.log(
      'FOTRANKR PHOTO DELETE ERROR:',
      error
    );

  }
};


export default function ProfileScreen({
  navigation,
  profile,
  onSaveProfile,
  myRankings,
}) {

  const hasProfile = Boolean(profile?.username);

  const [editing, setEditing] =
    useState(false);

  const [draftName, setDraftName] =
    useState(profile?.username || '');

  const [draftPhoto, setDraftPhoto] =
    useState(profile?.photoUri || null);

  const showForm = !hasProfile || editing;

  const progress = getProgress(myRankings);

  const badges = getBadges(myRankings);

  const earnedCount = badges.filter(
    badge => badge.earned
  ).length;


  // --------------------------------------------------
  // EDIT
  // --------------------------------------------------

  const startEditing = () => {
    setDraftName(profile?.username || '');
    setDraftPhoto(profile?.photoUri || null);
    setEditing(true);
  };

  const cancelEditing = () => {

    if (draftPhoto !== profile?.photoUri) {
      deletePhoto(draftPhoto);
    }

    setEditing(false);
  };


  // --------------------------------------------------
  // PHOTO
  // --------------------------------------------------
  // The picker's file lives in the cache, which the
  // system can clear, so it is copied to documents.
  // --------------------------------------------------

  const pickPhoto = async () => {

    try {

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        });

      if (result.canceled) {
        return;
      }

      const picked = new File(
        result.assets[0].uri
      );

      const saved = new File(
        Paths.document,
        `profile-photo-${Date.now()}.jpg`
      );

      await picked.copy(saved);

      if (draftPhoto !== profile?.photoUri) {
        deletePhoto(draftPhoto);
      }

      setDraftPhoto(saved.uri);

    } catch (error) {

      console.log(
        'FOTRANKR PHOTO ERROR:',
        error
      );

      Alert.alert(
        'Photo failed',
        'That photo could not be added.'
      );

    }
  };


  // --------------------------------------------------
  // SAVE
  // --------------------------------------------------

  const saveProfile = () => {

    const username = draftName
      .trim()
      .replace(/^@/, '');

    if (!USERNAME_PATTERN.test(username)) {

      Alert.alert(
        'Check your username',
        'Use 3-20 letters, numbers, dots or underscores.'
      );

      return;
    }

    if (
      profile?.photoUri &&
      profile.photoUri !== draftPhoto
    ) {
      deletePhoto(profile.photoUri);
    }

    onSaveProfile({
      ...profile,
      username,
      photoUri: draftPhoto,
      createdAt:
        profile?.createdAt ||
        new Date().toISOString(),
    });

    setEditing(false);
  };


  // --------------------------------------------------
  // AVATAR
  // --------------------------------------------------

  const renderAvatar = (
    photoUri,
    name,
    size
  ) => (

    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >

      {photoUri ? (

        <Image
          source={{ uri: photoUri }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
          }}
        />

      ) : (

        <Text
          style={[
            styles.avatarText,
            { fontSize: size * 0.4 },
          ]}
        >
          {name
            ? name.charAt(0).toUpperCase()
            : '+'}
        </Text>

      )}

    </View>

  );


  // --------------------------------------------------
  // SCREEN
  // --------------------------------------------------

  const { current } = progress;

  const progressPercent =
    (progress.xpIntoLevel / XP_PER_LEVEL) * 100;


  return (

    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >

      {/* HEADER */}

      <View style={styles.header}>

        <View style={styles.headerText}>

          <Text style={styles.title}>
            PROFILE
          </Text>

          <Text style={styles.subtitle}>
            Rank players to earn XP and level up
          </Text>

        </View>


        {hasProfile && !editing && (

          <TouchableOpacity
            style={styles.editButton}
            onPress={startEditing}
            activeOpacity={0.7}
          >

            <Text style={styles.editButtonText}>
              EDIT
            </Text>

          </TouchableOpacity>

        )}

      </View>


      {/* -------------------------------------------- */}
      {/* CREATE / EDIT PROFILE */}
      {/* -------------------------------------------- */}

      {showForm ? (

        <View style={styles.card}>

          <Text style={styles.cardLabel}>
            {hasProfile
              ? 'EDIT PROFILE'
              : 'CREATE YOUR PROFILE'}
          </Text>


          <TouchableOpacity
            style={styles.formAvatar}
            onPress={pickPhoto}
            activeOpacity={0.8}
          >

            {renderAvatar(
              draftPhoto,
              draftName.replace(/^@/, ''),
              96
            )}

            <Text style={styles.photoLink}>
              {draftPhoto
                ? 'CHANGE PHOTO'
                : 'ADD PHOTO'}
            </Text>

          </TouchableOpacity>


          {draftPhoto && (

            <TouchableOpacity
              onPress={() => {
                if (draftPhoto !== profile?.photoUri) {
                  deletePhoto(draftPhoto);
                }
                setDraftPhoto(null);
              }}
              activeOpacity={0.7}
            >

              <Text style={styles.removePhoto}>
                Remove photo
              </Text>

            </TouchableOpacity>

          )}


          <View style={styles.inputRow}>

            <Text style={styles.inputAt}>
              @
            </Text>

            <TextInput
              style={styles.input}
              placeholder="username"
              placeholderTextColor="#555555"
              value={draftName}
              onChangeText={setDraftName}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={21}
              returnKeyType="done"
              onSubmitEditing={saveProfile}
            />

          </View>


          <TouchableOpacity
            style={styles.primaryButton}
            onPress={saveProfile}
            activeOpacity={0.8}
          >

            <Text style={styles.primaryButtonText}>
              {hasProfile
                ? 'SAVE PROFILE'
                : 'CREATE PROFILE'}
            </Text>

          </TouchableOpacity>


          {hasProfile && (

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={cancelEditing}
              activeOpacity={0.7}
            >

              <Text style={styles.cancelText}>
                CANCEL
              </Text>

            </TouchableOpacity>

          )}

        </View>

      ) : (

        /* -------------------------------------------- */
        /* PROFILE CARD */
        /* -------------------------------------------- */

        <View style={styles.profileCard}>

          <View>

            {renderAvatar(
              profile.photoUri,
              profile.username,
              104
            )}

            <View style={styles.badgeBubble}>

              <Text style={styles.badgeBubbleText}>
                {current.badge}
              </Text>

            </View>

          </View>


          <Text style={styles.username}>
            @{profile.username}
          </Text>

          <Text style={styles.rankTitle}>
            {current.title.toUpperCase()}
          </Text>

          <Text style={styles.levelText}>
            LEVEL {progress.level}
          </Text>

        </View>

      )}


      {/* -------------------------------------------- */}
      {/* XP PROGRESS */}
      {/* -------------------------------------------- */}

      <View style={styles.card}>

        <View style={styles.xpHeader}>

          <Text style={styles.cardLabel}>
            {progress.isMaxLevel
              ? 'MAX LEVEL'
              : `PROGRESS TO LEVEL ${progress.level + 1}`}
          </Text>

          <Text style={styles.xpNumbers}>
            {progress.isMaxLevel
              ? `${progress.xp.toLocaleString()} XP`
              : `${progress.xpIntoLevel.toLocaleString()} / ${XP_PER_LEVEL.toLocaleString()} XP`}
          </Text>

        </View>


        <View style={styles.progressTrack}>

          <View
            style={[
              styles.progressFill,
              { width: `${progressPercent}%` },
            ]}
          />

        </View>


        <Text style={styles.canRank}>
          YOU CAN RANK:
          {' '}
          <Text style={styles.canRankLeagues}>
            {unlockedGroups(progress.level).join(', ')}
          </Text>
        </Text>


        <View style={styles.statRow}>

          <View style={styles.statBox}>

            <Text style={styles.statValue}>
              {progress.playersRanked}
            </Text>

            <Text style={styles.statLabel}>
              PLAYERS RANKED
            </Text>

          </View>

          <View style={styles.statBox}>

            <Text style={styles.statValue}>
              {progress.clubsCompleted}
            </Text>

            <Text style={styles.statLabel}>
              CLUBS COMPLETED
            </Text>

          </View>

        </View>

      </View>


      {/* -------------------------------------------- */}
      {/* BADGES */}
      {/* -------------------------------------------- */}

      <Text style={styles.badgeIntro}>
        Tap a club badge to see how you rate their squad.
      </Text>

      <View style={styles.card}>

        <View style={styles.xpHeader}>

          <Text style={styles.cardLabel}>
            BADGES
          </Text>

          <Text style={styles.badgeCount}>
            {earnedCount} EARNED
          </Text>

        </View>


        <View style={styles.badgeGrid}>

          {badges.map(badge => (

            // Club badges open that club's ranked players.
            <TouchableOpacity
              key={badge.id}
              style={[
                styles.badgeTile,
                !badge.earned && styles.badgeTileLocked,
              ]}
              disabled={!badge.club}
              onPress={() =>
                navigation.navigate('ClubRankings', {
                  club: badge.club,
                  league: badge.league,
                })
              }
              activeOpacity={0.7}
            >

              {badge.club ? (

                <View style={styles.badgeClubWrap}>

                  <ClubBadge
                    club={badge.club}
                    size={60}
                    gold={badge.gold}
                  />

                </View>

              ) : (

                <View
                  style={[
                    styles.badgeCircle,
                    badge.earned && styles.badgeCircleEarned,
                  ]}
                >

                  <Text
                    style={
                      badge.icon
                        ? styles.badgeIcon
                        : styles.badgeIconText
                    }
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {badge.icon || badge.iconText}
                  </Text>

                </View>

              )}

              <Text
                style={styles.badgeTitle}
                numberOfLines={2}
              >
                {badge.title}
              </Text>

              <Text
                style={styles.badgeDescription}
                numberOfLines={2}
              >
                {badge.earned
                  ? badge.description
                  : badge.progress}
              </Text>

            </TouchableOpacity>

          ))}

        </View>


        {!badges.some(badge => badge.id.startsWith('club|')) && (

          <Text style={styles.badgeHint}>
            Rank every player at a club to earn its badge.
          </Text>

        )}

      </View>

    </ScrollView>

  );
}


// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#050505',
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 60,
  },


  // ==================================================
  // HEADER
  // ==================================================

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 25,
  },

  headerText: {
    flex: 1,
  },

  title: {
    color: '#ffffff',
    fontSize: 36,
    lineHeight: 39,
    fontWeight: '900',
    letterSpacing: -1.2,
  },

  subtitle: {
    color: '#777777',
    fontSize: 14,
    marginTop: 7,
  },

  editButton: {
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#1d1d1d',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginLeft: 12,
    marginTop: 6,
  },

  editButtonText: {
    color: '#00ff66',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },


  // ==================================================
  // CARDS
  // ==================================================

  card: {
    backgroundColor: '#0f0f0f',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1b1b1b',
    padding: 18,
    marginBottom: 20,
  },

  cardLabel: {
    color: '#555555',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },


  // ==================================================
  // AVATAR
  // ==================================================

  avatar: {
    backgroundColor: '#151515',
    borderWidth: 2,
    borderColor: '#00ff66',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  avatarText: {
    color: '#00ff66',
    fontWeight: '900',
  },


  // ==================================================
  // FORM
  // ==================================================

  formAvatar: {
    alignItems: 'center',
    marginTop: 18,
  },

  photoLink: {
    color: '#00ff66',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginTop: 10,
  },

  removePhoto: {
    color: '#666666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },

  inputRow: {
    height: 56,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#242424',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginTop: 20,
    marginBottom: 14,
  },

  inputAt: {
    color: '#00ff66',
    fontSize: 18,
    fontWeight: '900',
    marginRight: 4,
  },

  input: {
    flex: 1,
    height: '100%',
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
  },

  primaryButton: {
    backgroundColor: '#00ff66',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },

  primaryButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  cancelButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },

  cancelText: {
    color: '#777777',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },


  // ==================================================
  // PROFILE CARD
  // ==================================================

  profileCard: {
    backgroundColor: '#0f0f0f',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1b1b1b',
    paddingVertical: 26,
    paddingHorizontal: 18,
    alignItems: 'center',
    marginBottom: 20,
  },

  badgeBubble: {
    position: 'absolute',
    right: -6,
    bottom: -4,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#050505',
    borderWidth: 2,
    borderColor: '#00ff66',
    alignItems: 'center',
    justifyContent: 'center',
  },

  badgeBubbleText: {
    fontSize: 20,
  },

  username: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 16,
  },

  rankTitle: {
    color: '#00ff66',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginTop: 6,
  },

  levelText: {
    color: '#777777',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.3,
    marginTop: 4,
  },


  // ==================================================
  // XP
  // ==================================================

  xpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  xpNumbers: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },

  progressTrack: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1b1b1b',
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 6,
    backgroundColor: '#00ff66',
  },

  canRank: {
    color: '#555555',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginTop: 12,
  },

  canRankLeagues: {
    color: '#00ff66',
  },

  statRow: {
    flexDirection: 'row',
    marginTop: 18,
    marginHorizontal: -4,
  },

  statBox: {
    flex: 1,
    backgroundColor: '#141414',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },

  statValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },

  statLabel: {
    color: '#666666',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginTop: 4,
    textAlign: 'center',
  },


  // ==================================================
  // BADGES
  // ==================================================

  badgeIntro: {
    color: '#777777',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 10,
  },

  badgeCount: {
    color: '#00ff66',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },

  badgeTile: {
    width: '33.33%',
    paddingHorizontal: 4,
    alignItems: 'center',
    marginBottom: 16,
  },

  badgeTileLocked: {
    opacity: 0.45,
  },

  badgeCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#141414',
    borderWidth: 2,
    borderColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  badgeClubWrap: {
    marginBottom: 8,
  },

  badgeCircleEarned: {
    borderColor: '#00ff66',
  },

  badgeIcon: {
    fontSize: 28,
  },

  // Roman numerals (CC, DCCC...)
  badgeIconText: {
    color: '#00ff66',
    fontSize: 18,
    fontWeight: '900',
    paddingHorizontal: 6,
  },

  badgeTitle: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
    textTransform: 'uppercase',
  },

  badgeDescription: {
    color: '#777777',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginTop: 2,
    textAlign: 'center',
    textTransform: 'uppercase',
  },

  badgeHint: {
    color: '#666666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
  },

});
