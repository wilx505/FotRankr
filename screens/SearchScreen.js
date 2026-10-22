import { displayPosition } from '../utils/positions';

import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useState } from 'react';

import players from '../players';

import ClubBadge from '../components/ClubBadge';

import {
  getFlag,
  getMarkerText,
} from '../utils/flags';

import {
  CLUB_BONUS_XP,
  XP_PER_PLAYER,
  getLock,
  getProgress,
  getUnlockLevel,
  isUnknown,
  lockMessage,
  unlockedGroups,
} from '../utils/progression';

export default function SearchScreen({
  navigation,
  myRankings,
}) {

  const progress = getProgress(myRankings);

  const [search, setSearch] =
    useState('');

  // Banner tapped: browse everyone you can rank at your
  // level, league -> club -> squad. Typing a search wins.
  const [showAvailable, setShowAvailable] =
    useState(false);

  // The club opened from the browse list:
  // { group, club } or null.
  const [openClub, setOpenClub] =
    useState(null);

  const browsing =
    showAvailable &&
    search.trim().length === 0;

  const rankedIds = new Set(
    (myRankings || []).map(
      ranking => String(ranking.id)
    )
  );

  const unknownIds = new Set(
    (myRankings || [])
      .filter(isUnknown)
      .map(ranking => String(ranking.id))
  );

  const filteredPlayers =
    search.trim().length === 0
      ? []
      : players.filter(
          player =>
            player.name
              .toLowerCase()
              .includes(
                search
                  .toLowerCase()
                  .trim()
              )
        );


  // ==================================================
  // BROWSE: LEAGUE -> CLUB -> PLAYERS
  // ==================================================
  // Retired players have no club, so they all sit
  // under one "Legends" entry.

  const clubsByGroup = new Map();

  if (browsing) {

    players
      .filter(
        player =>
          getUnlockLevel(player.id) <=
          progress.level
      )
      .forEach(player => {

        const isLegend = player.active === false;

        const group = isLegend
          ? 'Legends'
          : player.currentLeague || 'Other';

        const club = isLegend
          ? 'All Legends'
          : player.club || 'No club';

        if (!clubsByGroup.has(group)) {
          clubsByGroup.set(group, new Map());
        }

        const clubs = clubsByGroup.get(group);

        if (!clubs.has(club)) {
          clubs.set(club, []);
        }

        clubs.get(club).push(player);
      });
  }

  // Unlock order first (Premier League, La Liga, ...),
  // then A-Z for the rest of the world.
  const groupOrder = [...clubsByGroup.keys()].sort(
    (a, b) => {

      const levelOf = group =>
        getUnlockLevel(
          clubsByGroup.get(group)
            .values().next().value[0].id
        );

      return (
        levelOf(a) - levelOf(b) ||
        a.localeCompare(b)
      );
    }
  );

  const openSquad = openClub
    ? clubsByGroup
        .get(openClub.group)
        ?.get(openClub.club) || []
    : [];

  const POSITION_SECTIONS = [
    { position: 'Goalkeeper', label: 'GOALKEEPERS' },
    { position: 'Defence', label: 'DEFENDERS' },
    { position: 'Midfield', label: 'MIDFIELDERS' },
    { position: 'Attack', label: 'ATTACKERS' },
  ];

  const countRanked = squad =>
    squad.filter(
      player => rankedIds.has(String(player.id))
    ).length;

  const selectPlayer = (
  player
) => {

  const lock = getLock(player, myRankings);

  if (lock) {

    Alert.alert(
      `🔒 ${player.name} is locked`,
      `${lockMessage(lock)}\n\n` +
        `You're Level ${progress.level} ` +
        `(${progress.current.title}). Earn ` +
        `${progress.xpToNextLevel.toLocaleString()} more XP ` +
        `to reach the next level: ${XP_PER_PLAYER} XP per ` +
        `player, +${CLUB_BONUS_XP} for finishing a club.`
    );

    return;
  }

  navigation.navigate(
    'Compare',
    {
      player,
    }
  );

};

  const getPositionLabel = (
    player
  ) => {

    if (
      player.specificPosition
    ) {
      return `${displayPosition(player.specificPosition)} • ${player.position}`;
    }

    return player.position || 'Footballer';
  };

  // ==================================================
  // PLAYER CARD
  // ==================================================

  const renderPlayerCard = (player) => {

    const lock = getLock(
      player,
      myRankings
    );

    return (

      <TouchableOpacity
        key={player.id}
        style={[
          styles.playerCard,
          lock && styles.playerCardLocked,
        ]}
        onPress={() =>
          selectPlayer(player)
        }
        activeOpacity={0.7}
      >

        {/* PLAYER MARKER */}

        <View
          style={styles.playerMarker}
        >

          <Text
            style={
              getFlag(player.nation)
                ? styles.clubBadge
                : styles.playerMarkerText
            }
          >
            {getFlag(player.nation) ||
              getMarkerText(player)}
          </Text>

        </View>


        {/* PLAYER INFORMATION */}

        <View
          style={
            styles.playerDetails
          }
        >

          <Text
            style={
              styles.playerName
            }
          >
            {player.name}
          </Text>

          <View
            style={
              styles.infoRow
            }
          >

            <Text
              style={
                styles.playerNation
              }
            >
              {player.nation}
            </Text>

            <View
              style={
                styles.infoDot
              }
            />

            <Text
              style={
                styles.playerInfo
              }
            >
              {getPositionLabel(
                player
              )}
            </Text>

          </View>


          {lock && (

            <Text
              style={styles.lockText}
            >
              {lockMessage(lock)}
            </Text>

          )}

        </View>


        {/* ARROW / LOCK / RANKED */}

        {lock ? (

          <View
            style={styles.lockPill}
          >

            <Text
              style={styles.lockPillText}
            >
              🔒 LV {lock.level}
            </Text>

          </View>

        ) : rankedIds.has(String(player.id)) ? (

          <View
            style={[
              styles.rankedPill,
              unknownIds.has(String(player.id)) &&
                styles.unknownPill,
            ]}
          >

            <Text
              style={[
                styles.rankedPillText,
                unknownIds.has(String(player.id)) &&
                  styles.unknownPillText,
              ]}
            >
              {unknownIds.has(String(player.id))
                ? '? UNKNOWN'
                : '✓ RANKED'}
            </Text>

          </View>

        ) : (

          <View
            style={
              styles.arrowContainer
            }
          >

            <Text
              style={styles.arrow}
            >
              →
            </Text>

          </View>

        )}

      </TouchableOpacity>

    );
  };


  return (

    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >

      {/* =================================================
          HEADER
          ================================================= */}

      <View style={styles.header}>

        <View style={styles.brandRow}>

          <Text style={styles.brand}>
            FotRankr
          </Text>

        </View>

        <View
          style={styles.brandLine}
        />

      </View>


      {/* =================================================
          TITLE
          ================================================= */}

      <Text style={styles.title}>
        Find a player.
      </Text>

      <Text style={styles.subtitle}>
        Tap a player name to rank or rank again.
      </Text>


      {/* =================================================
          LEVEL
          ================================================= */}

      <TouchableOpacity
        style={[
          styles.levelBanner,
          browsing && styles.levelBannerActive,
        ]}
        onPress={() => {
          setSearch('');
          setOpenClub(null);
          setShowAvailable(!browsing);
        }}
        activeOpacity={0.8}
      >

        <Text style={styles.levelBadge}>
          {progress.current.badge}
        </Text>

        <View style={styles.levelDetails}>

          <Text style={styles.levelTitle}>
            LEVEL {progress.level} ·{' '}
            {progress.current.title.toUpperCase()}
          </Text>

          <Text style={styles.levelText}>
            You can rank:{' '}
            {unlockedGroups(progress.level).join(', ')}
          </Text>

        </View>

        <Text style={styles.levelArrow}>
          {browsing ? '▲' : '▼'}
        </Text>

      </TouchableOpacity>


      {/* =================================================
          SEARCH
          ================================================= */}

      <View
        style={styles.searchContainer}
      >

        <Text
          style={styles.searchIcon}
        >
          ⌕
        </Text>

        <TextInput
          style={styles.search}
          placeholder="Search player..."
          placeholderTextColor="#555555"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="search"
        />

        {search.length > 0 && (

          <TouchableOpacity
            style={styles.clearButton}
            onPress={() =>
              setSearch('')
            }
            activeOpacity={0.7}
          >

            <Text
              style={styles.clearText}
            >
              ×
            </Text>

          </TouchableOpacity>

        )}

      </View>


      {browsing ? (

        openClub ? (

          /* =================================================
             CLUB SQUAD
             ================================================= */

          <View>

            <TouchableOpacity
              style={styles.backRow}
              onPress={() => setOpenClub(null)}
              activeOpacity={0.7}
            >

              <Text style={styles.backText}>
                ‹  ALL CLUBS
              </Text>

            </TouchableOpacity>


            <Text style={styles.clubTitle}>
              {openClub.club}
            </Text>

            <Text style={styles.clubSubtitle}>
              {openClub.group}
              {'  ·  '}
              {countRanked(openSquad)}/{openSquad.length} RANKED
            </Text>


            {POSITION_SECTIONS.map(section => {

              const sectionPlayers = openSquad.filter(
                player =>
                  player.position === section.position
              );

              if (sectionPlayers.length === 0) {
                return null;
              }

              return (

                <View
                  key={section.position}
                  style={styles.positionSection}
                >

                  <View style={styles.resultsHeader}>

                    <Text style={styles.resultsLabel}>
                      {section.label}
                    </Text>

                    <Text style={styles.resultCount}>
                      {sectionPlayers.length}
                    </Text>

                  </View>

                  {sectionPlayers.map(renderPlayerCard)}

                </View>

              );
            })}

          </View>

        ) : (

          /* =================================================
             CLUBS
             ================================================= */

          <View>

            {groupOrder.map(group => {

              const clubs = [
                ...clubsByGroup.get(group).entries(),
              ].sort(
                ([a], [b]) => a.localeCompare(b)
              );

              return (

                <View
                  key={group}
                  style={styles.positionSection}
                >

                  <View style={styles.resultsHeader}>

                    <Text style={styles.resultsLabel}>
                      {group.toUpperCase()}
                    </Text>

                    <Text style={styles.resultCount}>
                      {clubs.length}
                      {clubs.length === 1
                        ? ' CLUB'
                        : ' CLUBS'}
                    </Text>

                  </View>

                  {clubs.map(([club, squad]) => (

                    <TouchableOpacity
                      key={club}
                      style={styles.clubCard}
                      onPress={() =>
                        setOpenClub({ group, club })
                      }
                      activeOpacity={0.7}
                    >

                      {group === 'Legends' ? (

                        <View style={styles.playerMarker}>

                          <Text style={styles.clubBadge}>
                            👑
                          </Text>

                        </View>

                      ) : (

                        <View style={styles.clubBadgeWrap}>

                          <ClubBadge
                            club={club}
                            size={48}
                          />

                        </View>

                      )}

                      <View style={styles.playerDetails}>

                        <Text style={styles.clubName}>
                          {club}
                        </Text>

                        <Text style={styles.playerInfo}>
                          {squad.length}
                          {squad.length === 1
                            ? ' player'
                            : ' players'}
                          {'  ·  '}
                          {countRanked(squad)} ranked
                        </Text>

                        {group !== 'Legends' &&
                          countRanked(squad) === squad.length && (

                          <Text style={styles.clubComplete}>
                            ✓ CLUB COMPLETE
                          </Text>

                        )}

                      </View>

                      <Text style={styles.clubArrow}>
                        ›
                      </Text>

                    </TouchableOpacity>

                  ))}

                </View>

              );
            })}

          </View>

        )

      ) : search.trim().length === 0 ? (

        /* =================================================
           EMPTY SEARCH
           ================================================= */

        <View style={styles.emptyState}>

          <View
            style={styles.emptyIcon}
          >

            <Text
              style={styles.emptyIconText}
            >
              +
            </Text>

          </View>

          <Text
            style={styles.emptyTitle}
          >
            FIND YOUR NEXT PLAYER
          </Text>

          <Text
            style={styles.emptyText}
          >
            Search by name to begin
            {' '}
            building your rankings.
          </Text>

        </View>

      ) : filteredPlayers.length === 0 ? (

        /* =================================================
           NO RESULTS
           ================================================= */

        <View style={styles.emptyState}>

          <View
            style={styles.emptyIcon}
          >

            <Text
              style={styles.emptyIconText}
            >
              ?
            </Text>

          </View>

          <Text
            style={styles.emptyTitle}
          >
            NO PLAYERS FOUND
          </Text>

          <Text
            style={styles.emptyText}
          >
            We couldn't find a footballer
            {' '}
            matching "{search.trim()}".
          </Text>

        </View>

      ) : (

        /* =================================================
           RESULTS
           ================================================= */

        <View>

          <View
            style={styles.resultsHeader}
          >

            <Text
              style={styles.resultsLabel}
            >
              PLAYERS
            </Text>

            <Text
              style={styles.resultCount}
            >
              {filteredPlayers.length}
            </Text>

          </View>

          {filteredPlayers.map(renderPlayerCard)}

        </View>

      )}

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


  // =====================================================
  // HEADER
  // =====================================================

  header: {
    paddingTop: 55,
    marginBottom: 42,
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  brand: {
    color: '#00ff66',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
  },

  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00ff66',
    marginLeft: 6,
    marginTop: 15,
  },

  brandLine: {
    width: 38,
    height: 3,
    backgroundColor: '#00ff66',
    marginTop: 8,
    borderRadius: 2,
  },


  // =====================================================
  // TITLE
  // =====================================================

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
    marginBottom: 25,
  },


  // =====================================================
  // LEVEL
  // =====================================================

  levelBanner: {
    backgroundColor: '#0f0f0f',
    borderWidth: 1,
    borderColor: '#1d1d1d',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  levelBadge: {
    fontSize: 24,
    marginRight: 12,
  },

  levelDetails: {
    flex: 1,
  },

  levelTitle: {
    color: '#00ff66',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  levelText: {
    color: '#777777',
    fontSize: 12,
    marginTop: 3,
  },

  levelBannerActive: {
    borderColor: '#00ff66',
  },

  levelArrow: {
    color: '#555555',
    fontSize: 10,
    fontWeight: '900',
    marginLeft: 8,
  },


  // =====================================================
  // SEARCH
  // =====================================================

  searchContainer: {
    height: 62,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#242424',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 17,
    marginBottom: 28,
  },

  searchIcon: {
    color: '#00ff66',
    fontSize: 28,
    fontWeight: '300',
    marginRight: 10,
    marginTop: -3,
  },

  search: {
    flex: 1,
    height: '100%',
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
  },

  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#222222',
    justifyContent: 'center',
    alignItems: 'center',
  },

  clearText: {
    color: '#888888',
    fontSize: 21,
    lineHeight: 22,
    marginTop: -2,
  },


  // =====================================================
  // RESULTS HEADER
  // =====================================================

  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  resultsLabel: {
    color: '#00ff66',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  resultCount: {
    color: '#555555',
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 8,
  },


  // =====================================================
  // PLAYER CARD
  // =====================================================

  playerCard: {
    backgroundColor: '#101010',
    borderRadius: 15,
    minHeight: 82,
    paddingHorizontal: 15,
    paddingVertical: 13,
    marginBottom: 9,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1d1d1d',
  },

  // Sits in the card's top-right corner.
  rankedPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#0d2b18',
    borderRadius: 12,
    paddingVertical: 5,
    paddingHorizontal: 9,
    marginLeft: 10,
    marginTop: -3,
    marginRight: -5,
  },

  unknownPill: {
    backgroundColor: '#1d1d1d',
  },

  unknownPillText: {
    color: '#999999',
  },

  rankedPillText: {
    color: '#00ff66',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },


  // =====================================================
  // CLUBS
  // =====================================================

  positionSection: {
    marginBottom: 18,
  },

  clubCard: {
    backgroundColor: '#101010',
    borderRadius: 15,
    minHeight: 70,
    paddingHorizontal: 15,
    paddingVertical: 11,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1d1d1d',
  },

  clubName: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },

  clubBadge: {
    fontSize: 24,
  },

  clubBadgeWrap: {
    marginRight: 14,
  },

  clubComplete: {
    color: '#00ff66',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginTop: 4,
  },

  clubArrow: {
    color: '#333333',
    fontSize: 25,
    fontWeight: '300',
    marginLeft: 8,
  },

  backRow: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    marginBottom: 8,
  },

  backText: {
    color: '#00ff66',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  clubTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.8,
  },

  clubSubtitle: {
    color: '#777777',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 5,
    marginBottom: 20,
  },

  playerCardLocked: {
    opacity: 0.55,
  },

  lockText: {
    color: '#F39C12',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 5,
  },

  lockPill: {
    backgroundColor: '#171717',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 9,
    marginLeft: 10,
  },

  lockPillText: {
    color: '#F39C12',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  playerMarker: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: '#292929',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  playerMarkerText: {
    color: '#00ff66',
    fontSize: 18,
    fontWeight: '900',
  },

  playerDetails: {
    flex: 1,
  },

  playerName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },

  playerNation: {
    color: '#777777',
    fontSize: 12,
  },

  infoDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#555555',
    marginHorizontal: 7,
  },

  playerInfo: {
    color: '#777777',
    fontSize: 12,
  },

  arrowContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#171717',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },

  arrow: {
    color: '#00ff66',
    fontSize: 19,
    fontWeight: '500',
  },


  // =====================================================
  // EMPTY STATE
  // =====================================================

  emptyState: {
    backgroundColor: '#0d0d0d',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#181818',
    paddingVertical: 32,
    paddingHorizontal: 25,
    alignItems: 'center',
    marginTop: 3,
  },

  emptyIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#242424',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 17,
  },

  emptyIconText: {
    color: '#00ff66',
    fontSize: 25,
    fontWeight: '300',
  },

  emptyTitle: {
    color: '#00ff66',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.3,
    textAlign: 'center',
  },

  emptyText: {
    color: '#666666',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 9,
  },

});