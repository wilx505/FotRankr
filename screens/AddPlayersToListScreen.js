import { useMemo, useState } from 'react';

import { isUnknown } from '../utils/progression';

import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  distinctLeagues,
  getActiveStatus,
  hasStatusData,
  matchesFilters,
} from '../utils/listHelpers';

import {
  getFlag,
  getMarkerText,
} from '../utils/flags';


const CATEGORIES = [
  'Legendary',
  'Elite',
  'Very Good',
  'Good',
  'OK',
  'Bad',
];

const SIZES = [5, 10, 20, 50];


// ======================================================
// FILTER ROW
// ======================================================

function FilterRow({
  label,
  options,
  value,
  onChange,
}) {

  if (!options || options.length <= 1) {
    return null;
  }

  return (

    <View style={styles.filterBlock}>

      <Text style={styles.filterLabel}>
        {label}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
      >

        {options.map(option => {

          const active =
            value === option.value;

          return (

            <TouchableOpacity
              key={String(option.label)}
              style={[
                styles.chip,
                active && styles.chipActive,
              ]}
              onPress={() =>
                onChange(option.value)
              }
              activeOpacity={0.75}
            >

              <Text
                style={[
                  styles.chipText,
                  active && styles.chipTextActive,
                ]}
              >
                {option.label}
              </Text>

            </TouchableOpacity>

          );

        })}

      </ScrollView>

    </View>

  );

}


// ======================================================
// SCREEN
// ======================================================

export default function AddPlayersToListScreen({
  navigation,
  route,
  lists,
  myRankings,
  onPlayersAdded,
}) {

  const list = (lists || []).find(
    item =>
      String(item.id) ===
      String(route.params?.listId)
  );

  // "I DO NOT KNOW" players can't go in lists.
  const ranked = (myRankings || []).filter(
    player => !isUnknown(player)
  );

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [league, setLeague] = useState(null);
  const [leagueScope, setLeagueScope] = useState('ALL_TIME');
  const [position, setPosition] = useState(null);
  const [category, setCategory] = useState(null);
  const [size, setSize] = useState(10);

  const [selectedIds, setSelectedIds] = useState(
    (list?.playerIds || []).map(String)
  );


  const showStatus = useMemo(
    () => hasStatusData(ranked),
    [ranked]
  );

  const leagues = useMemo(
    () => {

      const found = distinctLeagues(ranked, leagueScope);

      // Keep the chosen league visible when switching modes.
      if (league && !found.includes(league)) {
        found.push(league);
        found.sort();
      }

      return found;
    },
    [ranked, leagueScope, league]
  );

  const positions = useMemo(
    () => [
      ...new Set(
        ranked
          .map(player => player.position)
          .filter(Boolean)
      ),
    ],
    [ranked]
  );


  // Players matching the filters (ignores search).
  const filtered = useMemo(
    () =>
      ranked
        .filter(player =>
          matchesFilters(player, {
            status,
            league,
            leagueScope,
            position,
            category,
          })
        )
        .sort((a, b) => b.rating - a.rating),
    [ranked, status, league, leagueScope, position, category]
  );

  // Filters + search, what's shown on screen.
  const visible = useMemo(
    () =>
      filtered.filter(player =>
        player.name
          ?.toLowerCase()
          .includes(search.toLowerCase())
      ),
    [filtered, search]
  );


  if (!list) {

    return (
      <View style={styles.container}>
        <Text style={styles.missing}>
          List not found.
        </Text>
      </View>
    );

  }


  const isSelected = id =>
    selectedIds.includes(String(id));

  const togglePlayer = player => {

    const id = String(player.id);

    setSelectedIds(previous =>
      previous.includes(id)
        ? previous.filter(item => item !== id)
        : [...previous, id]
    );

  };

  // Replaces the selection with the top N of the filters.
  const autoFill = () => {

    setSelectedIds(
      filtered
        .slice(0, size)
        .map(player => String(player.id))
    );

  };

  const savePlayers = () => {

    onPlayersAdded({
      listId: list.id,
      playerIds: selectedIds,
    });

    navigation.goBack();

  };


  return (

    <View style={styles.container}>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* HEADER */}

        <View style={styles.header}>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.back}>
              ← BACK
            </Text>
          </TouchableOpacity>

          <View style={styles.brandLine} />

        </View>


        {/* TITLE */}

        <Text style={styles.title}>
          Add players.
        </Text>

        <Text style={styles.subtitle}>
          Pick from the players you've ranked,
          {' '}
          or auto-fill from your scores.
        </Text>


        {/* LIST */}

        <View style={styles.listBox}>

          <Text style={styles.listLabel}>
            LIST
          </Text>

          <Text style={styles.listName}>
            {list.name}
          </Text>

          <Text style={styles.playerCount}>
            {selectedIds.length} players selected
          </Text>

        </View>


        {/* EMPTY RANKINGS */}

        {ranked.length === 0 && (

          <View style={styles.emptyBox}>

            <Text style={styles.emptyTitle}>
              NO RANKED PLAYERS YET
            </Text>

            <Text style={styles.emptyText}>
              Rank some players first. Lists are
              {' '}
              built from your own scores.
            </Text>

          </View>

        )}


        {ranked.length > 0 && (

          <>

            {/* FILTERS */}

            <Text style={styles.sectionTitle}>
              FILTERS
            </Text>

            {showStatus && (
              <FilterRow
                label="STATUS"
                value={status}
                onChange={setStatus}
                options={[
                  { label: 'ALL', value: 'ALL' },
                  { label: 'ACTIVE', value: 'ACTIVE' },
                  { label: 'RETIRED', value: 'RETIRED' },
                ]}
              />
            )}

            <FilterRow
              label="LEAGUE MODE"
              value={leagueScope}
              onChange={setLeagueScope}
              options={[
                { label: 'ALL TIME', value: 'ALL_TIME' },
                { label: 'CURRENT', value: 'CURRENT' },
              ]}
            />

            <FilterRow
              label={
                leagueScope === 'CURRENT'
                  ? 'LEAGUE (PLAYING IN NOW)'
                  : 'LEAGUE (EVER PLAYED IN)'
              }
              value={league}
              onChange={setLeague}
              options={[
                { label: 'ALL', value: null },
                ...leagues.map(item => ({
                  label: item,
                  value: item,
                })),
              ]}
            />

            <FilterRow
              label="POSITION"
              value={position}
              onChange={setPosition}
              options={[
                { label: 'ALL', value: null },
                ...positions.map(item => ({
                  label: item,
                  value: item,
                })),
              ]}
            />

            <FilterRow
              label="CATEGORY"
              value={category}
              onChange={setCategory}
              options={[
                { label: 'ALL', value: null },
                ...CATEGORIES.map(item => ({
                  label: item,
                  value: item,
                })),
              ]}
            />


            {/* AUTO FILL */}

            <View style={styles.autoBox}>

              <Text style={styles.autoLabel}>
                AUTO-FILL
              </Text>

              <Text style={styles.autoText}>
                Takes your highest-scoring players
                {' '}
                that match the filters above.
                {' '}
                {filtered.length} match.
              </Text>

              <View style={styles.sizeRow}>

                {SIZES.map(option => (

                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.chip,
                      size === option &&
                        styles.chipActive,
                    ]}
                    onPress={() => setSize(option)}
                    activeOpacity={0.75}
                  >

                    <Text
                      style={[
                        styles.chipText,
                        size === option &&
                          styles.chipTextActive,
                      ]}
                    >
                      TOP {option}
                    </Text>

                  </TouchableOpacity>

                ))}

              </View>

              <TouchableOpacity
                style={[
                  styles.autoButton,
                  filtered.length === 0 &&
                    styles.disabled,
                ]}
                onPress={autoFill}
                disabled={filtered.length === 0}
                activeOpacity={0.75}
              >

                <Text style={styles.autoButtonText}>
                  AUTO-FILL TOP {size}
                </Text>

              </TouchableOpacity>

            </View>


            {/* SEARCH */}

            <TextInput
              style={styles.search}
              placeholder="Search your ranked players..."
              placeholderTextColor="#555555"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
            />


            {/* PLAYERS */}

            <View style={styles.sectionHeader}>

              <Text style={styles.sectionTitleInline}>
                YOUR RANKED PLAYERS
              </Text>

              <Text style={styles.sectionCount}>
                {visible.length}
              </Text>

            </View>

            {visible.map(player => {

              const selected =
                isSelected(player.id);

              const active =
                getActiveStatus(player.id);

              return (

                <TouchableOpacity
                  key={player.id}
                  style={[
                    styles.playerCard,
                    selected &&
                      styles.playerCardSelected,
                  ]}
                  onPress={() =>
                    togglePlayer(player)
                  }
                  activeOpacity={0.75}
                >

                  <View style={styles.avatar}>
                    <Text
                      style={
                        getFlag(player.nation)
                          ? styles.avatarFlag
                          : styles.avatarText
                      }
                    >
                      {getFlag(player.nation) ||
                        getMarkerText(player)}
                    </Text>
                  </View>

                  <View style={styles.playerDetails}>

                    <Text style={styles.playerName}>
                      {player.name}
                    </Text>

                    <Text style={styles.playerInfo}>
                      {player.nation}
                      {' • '}
                      {player.specificPosition ||
                        player.position}
                      {active === null
                        ? ''
                        : active
                          ? ' • ACTIVE'
                          : ' • RETIRED'}
                    </Text>

                    <Text style={styles.playerCategory}>
                      {player.category}
                    </Text>

                  </View>

                  <Text style={styles.playerScore}>
                    {typeof player.score === 'number'
                      ? player.score.toFixed(2)
                      : '—'}
                  </Text>

                  <View
                    style={[
                      styles.check,
                      selected &&
                        styles.checkSelected,
                    ]}
                  >

                    <Text
                      style={[
                        styles.checkText,
                        selected &&
                          styles.checkTextSelected,
                      ]}
                    >
                      {selected ? '✓' : '+'}
                    </Text>

                  </View>

                </TouchableOpacity>

              );

            })}

          </>

        )}

      </ScrollView>


      {/* SAVE */}

      <View style={styles.bottom}>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={savePlayers}
          activeOpacity={0.75}
        >

          <Text style={styles.saveText}>
            SAVE LIST
          </Text>

          <Text style={styles.saveArrow}>
            →
          </Text>

        </TouchableOpacity>

      </View>

    </View>

  );

}


const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#050505',
  },

  content: {
    paddingHorizontal: 22,
    paddingBottom: 120,
  },

  missing: {
    color: '#777777',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 120,
  },

  header: {
    paddingTop: 55,
    marginBottom: 35,
  },

  back: {
    color: '#00ff66',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.3,
  },

  brandLine: {
    width: 38,
    height: 3,
    backgroundColor: '#00ff66',
    marginTop: 12,
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
    marginBottom: 25,
  },

  listBox: {
    backgroundColor: '#101010',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#1d1d1d',
    padding: 16,
    marginBottom: 22,
  },

  listLabel: {
    color: '#00ff66',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
  },

  listName: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 6,
  },

  playerCount: {
    color: '#666666',
    fontSize: 12,
    marginTop: 5,
  },

  emptyBox: {
    backgroundColor: '#0d0d0d',
    borderWidth: 1,
    borderColor: '#1d1d1d',
    borderRadius: 16,
    padding: 25,
    alignItems: 'center',
  },

  emptyTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.3,
  },

  emptyText: {
    color: '#666666',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
    textAlign: 'center',
  },

  sectionTitle: {
    color: '#00ff66',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 12,
  },

  // FILTERS

  filterBlock: {
    marginBottom: 14,
  },

  filterLabel: {
    color: '#555555',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.3,
    marginBottom: 8,
  },

  chip: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    backgroundColor: '#101010',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },

  chipActive: {
    borderColor: '#00ff66',
    backgroundColor: '#00ff66',
  },

  chipText: {
    color: '#888888',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  chipTextActive: {
    color: '#050505',
  },

  // AUTO FILL

  autoBox: {
    backgroundColor: '#101010',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#00ff66',
    padding: 16,
    marginTop: 8,
    marginBottom: 22,
  },

  autoLabel: {
    color: '#00ff66',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
  },

  autoText: {
    color: '#777777',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 7,
    marginBottom: 14,
  },

  sizeRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },

  autoButton: {
    height: 48,
    borderRadius: 13,
    backgroundColor: '#00ff66',
    justifyContent: 'center',
    alignItems: 'center',
  },

  autoButtonText: {
    color: '#050505',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  disabled: {
    opacity: 0.3,
  },

  // SEARCH

  search: {
    backgroundColor: '#101010',
    borderWidth: 1,
    borderColor: '#1d1d1d',
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 16,
    color: '#ffffff',
    fontSize: 15,
    marginBottom: 25,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  sectionTitleInline: {
    color: '#00ff66',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  sectionCount: {
    color: '#555555',
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 8,
  },

  // PLAYERS

  playerCard: {
    backgroundColor: '#101010',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#1d1d1d',
    minHeight: 76,
    paddingHorizontal: 13,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 9,
  },

  playerCardSelected: {
    borderColor: '#00ff66',
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: '#292929',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },

  avatarFlag: {
    fontSize: 22,
  },

  avatarText: {
    color: '#00ff66',
    fontSize: 16,
    fontWeight: '900',
  },

  playerDetails: {
    flex: 1,
    minWidth: 0,
  },

  playerName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },

  playerInfo: {
    color: '#666666',
    fontSize: 11,
    marginTop: 4,
  },

  playerCategory: {
    color: '#00ff66',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 4,
  },

  playerScore: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
    marginHorizontal: 10,
  },

  check: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },

  checkSelected: {
    borderColor: '#00ff66',
    backgroundColor: '#00ff66',
  },

  checkText: {
    color: '#666666',
    fontSize: 19,
    fontWeight: '700',
  },

  checkTextSelected: {
    color: '#050505',
  },

  // BOTTOM

  bottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#050505',
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 25,
  },

  saveButton: {
    height: 54,
    borderRadius: 15,
    backgroundColor: '#00ff66',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  saveText: {
    color: '#050505',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.3,
  },

  saveArrow: {
    color: '#050505',
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 12,
  },

});