import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  Animated,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import ClubBadge from '../components/ClubBadge';

import {
  DEFAULT_FORMATION,
  FORMATIONS,
  FORMATION_NAMES,
  SLOT_COUNT,
  rearrange,
  getClubSquad,
  lastName,
  pickBestXI,
} from '../utils/bestXI';

import {
  getFlag,
  getMarkerText,
} from '../utils/flags';


const CATEGORY_COLOURS = {
  Legendary: '#9B59B6',
  Elite: '#00ff66',
  'Very Good': '#4DA6FF',
  Good: '#FFD700',
  OK: '#F39C12',
  Bad: '#E74C3C',
};

// The user's own lineups: { "League|Club": [11 player ids] }.
// Separate from rankings, so it never changes any score.
const LINEUPS_KEY = 'fotrankrBestXILineups';


const HOLD_MS = 200;

// Subs grouped by general position, attackers first (same
// order as the pitch, top to bottom).
const SUB_GROUPS = [
  { position: 'Attack', label: 'ATTACKERS' },
  { position: 'Midfield', label: 'MIDFIELDERS' },
  { position: 'Defence', label: 'DEFENDERS' },
  { position: 'Goalkeeper', label: 'GOALKEEPERS' },
];

// Drag near the top/bottom of the screen to scroll.
const EDGE_SIZE = 110;
const MAX_SCROLL_SPEED = 14;


// ======================================================
// DRAGGABLE
// ======================================================
// Hold briefly to pick up, then drag. A quick tap (no hold,
// no movement) is a normal tap. Moving before the hold
// lets the page scroll instead.

function Draggable({
  onTap,
  onDragStart,
  onDragMove,
  onDragEnd,
  style,
  children,
}) {

  // Latest callbacks (the responder is created once).
  const callbacks = useRef({});
  callbacks.current = { onTap, onDragStart, onDragMove, onDragEnd };

  const touch = useRef({ active: false, moved: false, timer: null });

  const responder = useRef(
    PanResponder.create({

      onStartShouldSetPanResponder: () => true,

      onPanResponderGrant: (event, gesture) => {

        touch.current.active = false;
        touch.current.moved = false;

        touch.current.timer = setTimeout(() => {
          touch.current.active = true;
          callbacks.current.onDragStart?.(gesture.x0, gesture.y0);
        }, HOLD_MS);
      },

      onPanResponderMove: (event, gesture) => {

        if (!touch.current.active) {

          if (Math.abs(gesture.dx) + Math.abs(gesture.dy) > 8) {
            touch.current.moved = true;
            clearTimeout(touch.current.timer);
          }

          return;
        }

        callbacks.current.onDragMove?.(gesture.moveX, gesture.moveY);
      },

      // Let the page scroll unless a player is picked up.
      onPanResponderTerminationRequest: () => !touch.current.active,

      onPanResponderRelease: (event, gesture) => {

        clearTimeout(touch.current.timer);

        if (touch.current.active) {
          touch.current.active = false;
          callbacks.current.onDragEnd?.(gesture.moveX, gesture.moveY);
        } else if (!touch.current.moved) {
          callbacks.current.onTap?.();
        }
      },

      onPanResponderTerminate: () => {

        clearTimeout(touch.current.timer);

        if (touch.current.active) {
          touch.current.active = false;
          callbacks.current.onDragEnd?.(null, null);
        }
      },
    })
  ).current;

  return (
    <View
      {...responder.panHandlers}
      style={style}
    >
      {children}
    </View>
  );
}


// ======================================================
// SCREEN
// ======================================================

// One club's Best XI on a pitch, in a 4-3-3, with the rest
// of the squad as subs. Players can be dragged around.
export default function BestXIScreen({
  route,
  navigation,
  myRankings,
}) {

  const {
    club,
    league,
  } = route.params || {};

  const lineupKey = `${league || ''}|${club}`;

  const squad = getClubSquad(club, league, myRankings);

  const byId = new Map(
    squad.map(player => [String(player.id), player])
  );

  // Challenges from here are only against this club's
  // ranked players.
  const clubIds = squad.map(player => String(player.id));


  // ---- The user's saved lineup for this club, if any.
  const [savedLineups, setSavedLineups] = useState({});

  useEffect(() => {

    AsyncStorage.getItem(LINEUPS_KEY)
      .then(saved => {
        // Changes made before this finished win.
        if (saved) {
          setSavedLineups(previous => ({
            ...JSON.parse(saved),
            ...previous,
          }));
        }
      })
      .catch(error =>
        console.log('FOTRANKR BEST XI LOAD ERROR:', error)
      );

  }, []);


  // Saved per club as { formation, ids } (ids = the user's own
  // 11, or missing for the top-rated XI). Older saves were a
  // plain 4-3-3 array.
  const entry = (() => {
    const saved = savedLineups[lineupKey];
    if (Array.isArray(saved)) {
      return { formation: DEFAULT_FORMATION, ids: saved };
    }
    return saved || {};
  })();

  const formation = FORMATIONS[entry.formation]
    ? entry.formation
    : DEFAULT_FORMATION;


  // ---- The top-rated XI for this formation, as 11 ids.
  const bestRows = pickBestXI(club, league, myRankings, formation);

  const bestIds = bestRows
    .flat()
    .map(spot => (spot.player ? String(spot.player.id) : null));


  // Use the saved lineup only if it still fits the squad.
  const customIds = (() => {

    const saved = entry.ids;

    if (!Array.isArray(saved) || saved.length !== SLOT_COUNT) {
      return null;
    }

    const seen = new Set();

    const valid = saved.every(id => {

      if (id === null) {
        return true;
      }

      if (!byId.has(String(id)) || seen.has(String(id))) {
        return false;
      }

      seen.add(String(id));
      return true;
    });

    return valid ? saved.map(id => (id === null ? null : String(id))) : null;
  })();

  const lineupIds = customIds || bestIds;

  const isCustom =
    !!customIds &&
    customIds.some((id, index) => id !== bestIds[index]);


  // Every change saves straight away. It merges into what's
  // already stored, so other clubs' lineups are never lost
  // (even if this one changes before they've loaded).
  const updateLineups = change => {

    setSavedLineups(previous => change({ ...previous }));

    AsyncStorage.getItem(LINEUPS_KEY)
      .then(stored => {
        const updated = change(stored ? JSON.parse(stored) : {});
        return AsyncStorage.setItem(
          LINEUPS_KEY,
          JSON.stringify(updated)
        );
      })
      .catch(error =>
        console.log('FOTRANKR BEST XI SAVE ERROR:', error)
      );
  };

  const saveLineup = ids => {
    updateLineups(lineups => ({
      ...lineups,
      [lineupKey]: { formation, ids },
    }));
  };

  // Back to the top-rated XI, keeping the formation.
  const resetLineup = () => {
    updateLineups(lineups => ({
      ...lineups,
      [lineupKey]: { formation },
    }));
  };

  // New shape: the same 11 move to the closest slots (the
  // top-rated XI just gets picked for the new shape).
  const changeFormation = name => {

    if (name === formation) {
      return;
    }

    const ids = customIds
      ? rearrange(
          customIds.map(id => (id ? byId.get(id) : null)),
          name
        )
      : undefined;

    updateLineups(lineups => ({
      ...lineups,
      [lineupKey]: ids ? { formation: name, ids } : { formation: name },
    }));
  };


  // ---- Subs: everyone not in the XI, best first.
  const inTeam = new Set(lineupIds.filter(Boolean));

  const subs = squad.filter(
    player => !inTeam.has(String(player.id))
  );


  // ==================================================
  // DRAG AND DROP
  // ==================================================

  const rootRef = useRef(null);
  const rootOffset = useRef({ x: 0, y: 0 });

  const slotRefs = useRef([]);
  const slotRects = useRef([]);

  const ghost = useRef(new Animated.ValueXY()).current;

  // { id, from: { slot: index } | { bench: true } }
  const [dragging, setDragging] = useState(null);

  const GHOST_SIZE = 64;

  const scrollRef = useRef(null);
  const scrollY = useRef(0);
  const scrollMax = useRef(0);
  const contentHeight = useRef(0);
  const viewRect = useRef({ y: 0, height: 0 });
  const finger = useRef(null);
  const scrollLoop = useRef(null);

  const placeGhost = (x, y) => {

    finger.current = { x, y };

    ghost.setValue({
      x: x - rootOffset.current.x - GHOST_SIZE / 2,
      y: y - rootOffset.current.y - GHOST_SIZE / 2,
    });
  };

  // While a player is held near the top or bottom edge,
  // scroll that way (faster nearer the edge).
  const runAutoScroll = () => {

    const point = finger.current;
    const view = viewRect.current;

    if (point && view.height) {

      const fromTop = point.y - view.y;
      const fromBottom = view.y + view.height - point.y;

      let speed = 0;

      if (fromTop < EDGE_SIZE) {
        speed = -MAX_SCROLL_SPEED * (1 - Math.max(0, fromTop) / EDGE_SIZE);
      } else if (fromBottom < EDGE_SIZE) {
        speed = MAX_SCROLL_SPEED * (1 - Math.max(0, fromBottom) / EDGE_SIZE);
      }

      const next = Math.min(
        scrollMax.current,
        Math.max(0, scrollY.current + speed)
      );

      if (Math.abs(next - scrollY.current) >= 0.5) {
        scrollY.current = next;
        scrollRef.current?.scrollTo({ y: next, animated: false });
      }
    }

    scrollLoop.current = requestAnimationFrame(runAutoScroll);
  };

  const stopAutoScroll = () => {
    if (scrollLoop.current) {
      cancelAnimationFrame(scrollLoop.current);
      scrollLoop.current = null;
    }
    finger.current = null;
  };

  // Stop scrolling if the screen closes mid-drag.
  useEffect(() => stopAutoScroll, []);

  // Where everything is on screen right now.
  const measureAll = () => {

    rootRef.current?.measureInWindow((x, y) => {
      rootOffset.current = { x, y };
    });

    slotRefs.current.forEach((ref, index) => {
      ref?.measureInWindow((x, y, width, height) => {
        slotRects.current[index] = { x, y, width, height };
      });
    });
  };

  const startDrag = (id, from) => (x, y) => {

    measureAll();

    scrollRef.current?.measureInWindow((vx, vy, width, height) => {
      viewRect.current = { y: vy, height };
      scrollMax.current = Math.max(0, contentHeight.current - height);
    });

    setDragging({ id, from });
    placeGhost(x, y);

    stopAutoScroll();
    scrollLoop.current = requestAnimationFrame(runAutoScroll);
  };

  const endDrag = (x, y) => {

    const drag = dragging;

    stopAutoScroll();
    setDragging(null);

    if (!drag || x === null) {
      return;
    }

    // Which pitch spot was it dropped on?
    const PADDING = 14;

    const target = slotRects.current.findIndex(
      rect =>
        rect &&
        x >= rect.x - PADDING &&
        x <= rect.x + rect.width + PADDING &&
        y >= rect.y - PADDING &&
        y <= rect.y + rect.height + PADDING
    );

    if (target === -1) {
      return;
    }

    const ids = [...lineupIds];

    if (drag.from.slot !== undefined) {

      // Pitch -> pitch: swap.
      if (drag.from.slot === target) {
        return;
      }

      [ids[drag.from.slot], ids[target]] =
        [ids[target], ids[drag.from.slot]];

    } else {

      // Sub -> pitch: they come in, the old player goes to
      // the subs.
      ids[target] = drag.id;
    }

    saveLineup(ids);
  };


  const openChallenge = player => {
    navigation.navigate('Challenge', {
      player,
      opponentIds: clubIds,
      opponentLabel: `${club.toUpperCase()} PLAYERS`,
    });
  };


  // ==================================================
  // RENDER
  // ==================================================

  const renderFlag = (player, size) => {

    const ring = player
      ? CATEGORY_COLOURS[player.category] || '#00ff66'
      : '#333333';

    return (

      <View
        style={[
          styles.flagCircle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: ring,
          },
        ]}
      >

        <Text
          style={
            player && getFlag(player.nation)
              ? [styles.flag, { fontSize: size / 2 }]
              : styles.flagText
          }
        >
          {player
            ? getFlag(player.nation) || getMarkerText(player)
            : '?'}
        </Text>

      </View>

    );
  };


  // Flat slot index for each row/spot.
  let slotIndex = 0;

  const pitchRows = FORMATIONS[formation].map(row =>
    row.map(slot => ({
      slot,
      index: slotIndex++,
      rowSize: row.length,
    }))
  );


  const renderSpot = spot => {

    const id = lineupIds[spot.index];
    const player = id ? byId.get(id) : null;

    const isSource =
      dragging?.from.slot === spot.index;

    return (

      <View
        key={spot.index}
        ref={ref => {
          slotRefs.current[spot.index] = ref;
        }}
        style={[
          styles.spot,
          spot.rowSize >= 5 && styles.spotNarrow,
        ]}
      >

        {player ? (

          <Draggable
            style={[styles.spotInner, isSource && styles.lifted]}
            onTap={() => openChallenge(player)}
            onDragStart={startDrag(id, { slot: spot.index })}
            onDragMove={placeGhost}
            onDragEnd={endDrag}
          >
            {renderFlag(player, 48)}

            <Text
              style={styles.name}
              numberOfLines={1}
            >
              {lastName(player.name)}
            </Text>

            <Text
              style={[
                styles.pitchScore,
                {
                  color:
                    CATEGORY_COLOURS[player.category] ||
                    '#ffffff',
                },
              ]}
            >
              {typeof player.score === 'number'
                ? player.score.toFixed(2)
                : '—'}
            </Text>
          </Draggable>

        ) : (

          <View style={styles.spotInner}>
            {renderFlag(null, 48)}

            <Text style={styles.name}>
              {spot.slot}
            </Text>
          </View>

        )}

      </View>

    );
  };


  const draggedPlayer = dragging ? byId.get(dragging.id) : null;


  return (

    <View
      ref={rootRef}
      style={styles.screen}
      onLayout={measureAll}
    >

      {/* TOP BAR */}

      <View style={styles.topBar}>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >

          <Text style={styles.backArrow}>
            ‹
          </Text>

        </TouchableOpacity>


        <Text style={styles.topBarTitle}>
          BEST XI
        </Text>


        <View style={styles.topBarSpacer} />

      </View>


      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!dragging}
        onScroll={event => {
          scrollY.current = event.nativeEvent.contentOffset.y;
          measureAll();
        }}
        scrollEventThrottle={16}
        onLayout={event => {
          const height = event.nativeEvent.layout.height;
          viewRect.current = { ...viewRect.current, height };
        }}
        onContentSizeChange={(width, height) => {
          contentHeight.current = height;
        }}
      >

        {/* CLUB */}

        <View style={styles.clubHeader}>

          <ClubBadge
            club={club}
            size={56}
          />

          <View style={styles.clubDetails}>

            <Text style={styles.clubName}>
              {club}
            </Text>

            <Text style={styles.formation}>
              {formation}  ·  {isCustom ? 'YOUR LINEUP' : 'YOUR HIGHEST-RATED XI'}
            </Text>

          </View>

        </View>


        {/* FORMATION */}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.formationBar}
          contentContainerStyle={styles.formationBarContent}
        >

          {FORMATION_NAMES.map(name => (

            <TouchableOpacity
              key={name}
              style={[
                styles.formationChip,
                name === formation && styles.formationChipActive,
              ]}
              onPress={() => changeFormation(name)}
              activeOpacity={0.8}
            >

              <Text
                style={[
                  styles.formationChipText,
                  name === formation && styles.formationChipTextActive,
                ]}
              >
                {name}
              </Text>

            </TouchableOpacity>

          ))}

        </ScrollView>


        {/* PITCH */}

        <View style={styles.pitch}>

          {/* Markings */}
          <View style={styles.halfwayLine} />
          <View style={styles.centreCircle} />
          <View style={styles.penaltyBox} />
          <View style={styles.sixYardBox} />


          {pitchRows.map((row, rowIndex) => (

            <View
              key={rowIndex}
              style={styles.row}
            >
              {row.map(renderSpot)}
            </View>

          ))}

        </View>


        <Text style={styles.hint}>
          Hold a player and drag to move them. Tap to challenge.
          {'\n'}
          Your lineup never changes any scores.
        </Text>


        {isCustom && (

          <TouchableOpacity
            style={styles.resetButton}
            onPress={resetLineup}
            activeOpacity={0.8}
          >

            <Text style={styles.resetText}>
              RESET TO MY BEST XI
            </Text>

          </TouchableOpacity>

        )}


        {/* SUBS */}

        <Text style={styles.sectionLabel}>
          SUBSTITUTES  ·  {subs.length}
        </Text>

        {subs.length === 0 ? (

          <Text style={styles.noSubs}>
            Everyone you've ranked at {club} is in the XI.
          </Text>

        ) : (

          SUB_GROUPS.map(group => {

            const groupSubs = subs.filter(
              player => player.position === group.position
            );

            if (groupSubs.length === 0) {
              return null;
            }

            return (

              <View key={group.position}>

                <Text style={styles.subGroupLabel}>
                  {group.label}  ·  {groupSubs.length}
                </Text>

                <View style={styles.subsGrid}>

                  {groupSubs.map(player => (

                    <Draggable
                      key={player.id}
                      style={[
                        styles.subCard,
                        dragging?.id === String(player.id) && styles.lifted,
                      ]}
                      onTap={() => openChallenge(player)}
                      onDragStart={startDrag(String(player.id), { bench: true })}
                      onDragMove={placeGhost}
                      onDragEnd={endDrag}
                    >

                      {renderFlag(player, 38)}

                      <Text
                        style={styles.subName}
                        numberOfLines={1}
                      >
                        {lastName(player.name)}
                      </Text>

                      <Text
                        style={[
                          styles.subScore,
                          {
                            color:
                              CATEGORY_COLOURS[player.category] ||
                              '#ffffff',
                          },
                        ]}
                      >
                        {typeof player.score === 'number'
                          ? player.score.toFixed(2)
                          : '—'}
                      </Text>

                    </Draggable>

                  ))}

                </View>

              </View>

            );
          })

        )}

      </ScrollView>


      {/* The player being dragged follows the finger. */}

      {draggedPlayer && (

        <Animated.View
          pointerEvents="none"
          style={[
            styles.ghost,
            { transform: ghost.getTranslateTransform() },
          ]}
        >

          {renderFlag(draggedPlayer, 52)}

          <Text
            style={styles.ghostName}
            numberOfLines={1}
          >
            {lastName(draggedPlayer.name)}
          </Text>

        </Animated.View>

      )}

    </View>

  );
}


const styles = StyleSheet.create({

  screen: {
    flex: 1,
    backgroundColor: '#050505',
  },

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

  container: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },


  // CLUB

  clubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 16,
    paddingHorizontal: 4,
  },

  clubDetails: {
    marginLeft: 14,
    flex: 1,
  },

  clubName: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
  },

  formation: {
    color: '#555555',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 4,
  },


  // PITCH

  pitch: {
    backgroundColor: '#0b3d1e',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#1f6b3a',
    paddingVertical: 22,
    paddingHorizontal: 6,
    minHeight: 520,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },

  halfwayLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#2f8a4f',
  },

  centreCircle: {
    position: 'absolute',
    top: -50,
    alignSelf: 'center',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#2f8a4f',
  },

  penaltyBox: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
    width: '56%',
    height: 90,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: '#2f8a4f',
  },

  sixYardBox: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
    width: '28%',
    height: 36,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: '#2f8a4f',
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginVertical: 8,
  },


  // PLAYER SPOT

  spot: {
    width: 78,
    alignItems: 'center',
  },

  spotNarrow: {
    width: 66,
  },

  formationBar: {
    marginBottom: 14,
    marginHorizontal: -16,
  },

  formationBarContent: {
    paddingHorizontal: 16,
  },

  formationChip: {
    backgroundColor: '#0e0e0e',
    borderWidth: 1,
    borderColor: '#1d1d1d',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
  },

  formationChipActive: {
    backgroundColor: '#00ff66',
    borderColor: '#00ff66',
  },

  formationChipText: {
    color: '#888888',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  formationChipTextActive: {
    color: '#000000',
  },

  spotInner: {
    alignItems: 'center',
  },

  lifted: {
    opacity: 0.3,
  },

  flagCircle: {
    borderWidth: 3,
    backgroundColor: '#050505',
    alignItems: 'center',
    justifyContent: 'center',
  },

  flag: {
    fontSize: 24,
  },

  flagText: {
    color: '#00ff66',
    fontSize: 14,
    fontWeight: '900',
  },

  name: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 5,
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowRadius: 4,
  },

  pitchScore: {
    fontSize: 11,
    fontWeight: '900',
    marginTop: 1,
    textShadowColor: '#000000',
    textShadowRadius: 4,
  },

  hint: {
    color: '#555555',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    lineHeight: 15,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: 16,
  },

  resetButton: {
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#00ff66',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginTop: 14,
  },

  resetText: {
    color: '#00ff66',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },


  // SUBS

  sectionLabel: {
    color: '#00ff66',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginTop: 26,
    marginBottom: 12,
    paddingLeft: 4,
  },

  noSubs: {
    color: '#666666',
    fontSize: 13,
    paddingLeft: 4,
  },

  subGroupLabel: {
    color: '#555555',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.3,
    marginTop: 4,
    marginBottom: 10,
    paddingLeft: 4,
  },

  subsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },

  subCard: {
    width: '25%',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 14,
  },

  subName: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 5,
    textAlign: 'center',
  },

  subScore: {
    fontSize: 11,
    fontWeight: '900',
    marginTop: 2,
  },


  // DRAGGED PLAYER

  ghost: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 64,
    alignItems: 'center',
    zIndex: 100,
    elevation: 100,
  },

  ghostName: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 4,
    textShadowColor: '#000000',
    textShadowRadius: 4,
  },

});
