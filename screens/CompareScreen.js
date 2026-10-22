import { displayPosition } from '../utils/positions';

import {
  useState,
} from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import {
  getLock,
  isUnknown,
  lockMessage,
} from '../utils/progression';

import {
  getFlag,
  getMarkerText,
} from '../utils/flags';
export default function CompareScreen({
  route,
  navigation,
  onAnchorSelected,
  onCategoryChanged,
  onRankAgain,
  onMarkUnknown,
  isPlayerRanked,
  myRankings,

}) {

  const { player } = route.params;
  const [rankingReset, setRankingReset] =
  useState(false);

  const currentRanking = (myRankings || []).find(
    ranking =>
      String(ranking.id) === String(player.id)
  );

  // Marked "I DO NOT KNOW" earlier: picking a category
  // now ranks them properly.
  const playerIsUnknown =
    !rankingReset && isUnknown(currentRanking);


  // ==================================================
  // I DO NOT KNOW
  // ==================================================

  const markUnknown = () => {

    const save = () => {
      onMarkUnknown({ player });
      navigation.goBack();
    };

    if (playerIsUnknown) {
      navigation.goBack();
      return;
    }

    // Replacing a real ranking: check first.
    if (isPlayerRanked && !rankingReset) {

      Alert.alert(
        `Don't know ${player.name}?`,
        `This replaces ${player.name}'s current ranking with Unknown (0.00).`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Mark Unknown',
            style: 'destructive',
            onPress: save,
          },
        ]
      );

      return;
    }

    save();
  };


  // ==================================================
  // CATEGORIES
  // ==================================================

  const categories = [
    {
      name: 'Legendary',
      description:
        'The very best players in football history',
      colour: '#9B59B6',
      number: '01',
    },
    {
      name: 'Elite',
      description:
        'World-class players at the highest level',
      colour: '#00ff66',
      number: '02',
    },
    {
      name: 'Very Good',
      description:
        'Excellent players who perform consistently',
      colour: '#4DA6FF',
      number: '03',
    },
    {
      name: 'Good',
      description:
        'Strong and reliable footballers',
      colour: '#FFD700',
      number: '04',
    },
    {
      name: 'OK',
      description:
        'Solid professional-level players',
      colour: '#F39C12',
      number: '05',
    },
    {
      name: 'Bad',
      description:
        'Players currently below the standard',
      colour: '#E74C3C',
      number: '06',
    },
  ];
  // ==================================================
// RANK AGAIN
// ==================================================

const rankAgain = () => {

  Alert.alert(
    'Rank again?',
    `This will completely reset ${player.name}'s current ranking and H2H progress.`,
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Rank Again',
        style: 'destructive',
        onPress: () => {

          setRankingReset(true);

          onRankAgain({
            player,
          });

        },
      },
    ]
  );
};


  // ==================================================
  // CATEGORY SELECTION
  // ==================================================

  const chooseCategory = (
    category
  ) => {

    // --------------------------------------------------
    // UNRANKED PLAYER
    // --------------------------------------------------

    if (!isPlayerRanked || rankingReset) {

      onAnchorSelected({
        player,
        category: category.name,
      });

      navigation.navigate(
        'HeadToHead',
        {
          player,
          category: category.name,
          smartH2H: true,
          startSmartH2H: true,
        }
      );

      return;
    }


    // --------------------------------------------------
    // ALREADY RANKED PLAYER
    // --------------------------------------------------

    onCategoryChanged({
      player,
      category: category.name,
    });

    navigation.navigate(
      'HeadToHead',
      {
        player,
        category: category.name,
        smartH2H: true,
        startSmartH2H: true,
      }
    );

  };


  // ==================================================
  // SCREEN
  // ==================================================

  // Locked players can't be ranked yet, however they
  // got here. (Rank Again briefly un-ranks a player, so
  // it must not lock them mid-way.)
  const lock = rankingReset
    ? null
    : getLock(player, myRankings);

  if (lock) {

    return (

      <View style={styles.lockedScreen}>

        <Text style={styles.lockedIcon}>
          🔒
        </Text>

        <Text style={styles.lockedTitle}>
          {player.name} is locked
        </Text>

        <Text style={styles.lockedText}>
          {lockMessage(lock)}
          {'\n'}
          Rank more players to level up.
        </Text>

        <TouchableOpacity
          style={styles.lockedButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >

          <Text style={styles.lockedButtonText}>
            GO BACK
          </Text>

        </TouchableOpacity>

      </View>

    );
  }

  return (

    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
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

          <View
            style={styles.brandDot}
          />

        </View>

        <View
          style={styles.brandLine}
        />

      </View>


      {/* =================================================
          TITLE
          ================================================= */}

      <Text style={styles.title}>
        Where do they belong?
      </Text>

      <Text style={styles.subtitle}>
        Choose the category that best
        {' '}
        represents {player.name}.
      </Text>


      {/* =================================================
          PLAYER CARD
          ================================================= */}

      <View style={styles.playerBox}>

        <View
          style={styles.playerAvatar}
        >

          <Text
            style={
              getFlag(player.nation)
                ? styles.playerAvatarFlag
                : styles.playerAvatarText
            }
          >
            {getFlag(player.nation) ||
              getMarkerText(player)}
          </Text>

        </View>


        <View
          style={styles.playerDetails}
        >

          <Text
            style={styles.playerName}
          >
            {player.name}
          </Text>

          <View
            style={styles.infoRow}
          >

            <Text
              style={styles.nation}
            >
              {player.nation}
            </Text>

            <View
              style={styles.infoDot}
            />

            <Text
              style={styles.info}
            >
              {displayPosition(player.specificPosition) ||
                player.position}
            </Text>

          </View>

        </View>

      </View>

      {/* =================================================
    RANK AGAIN
    ================================================= */}

{isPlayerRanked && !playerIsUnknown && (

  <TouchableOpacity
    style={styles.rankAgainButton}
    onPress={rankAgain}
    activeOpacity={0.75}
  >

    <View
      style={styles.rankAgainContent}
    >

      <View
        style={styles.rankAgainIcon}
      >

        <Text
          style={styles.rankAgainIconText}
        >
          ↻
        </Text>

      </View>

      <View
        style={styles.rankAgainDetails}
      >

        <Text
          style={styles.rankAgainTitle}
        >
          RANK AGAIN
        </Text>

        <Text
          style={styles.rankAgainDescription}
        >
          Reset this player's ranking
          and start from the beginning.
        </Text>

      </View>

      <Text
        style={styles.rankAgainArrow}
      >
        →
      </Text>

    </View>

  </TouchableOpacity>

)}


      {/* =================================================
          SECTION LABEL
          ================================================= */}

      <View
        style={styles.sectionHeader}
      >

        <Text
          style={styles.sectionTitle}
        >
          SELECT A CATEGORY
        </Text>

        <Text
          style={styles.sectionHint}
        >
          1 — 6
        </Text>

      </View>


      {/* =================================================
          CATEGORIES
          ================================================= */}

      {categories.map(
        (category) => (

          <TouchableOpacity
            key={category.name}
            style={[
              styles.categoryBox,
              {
                borderColor:
                  category.colour,
              },
            ]}
            onPress={() =>
              chooseCategory(
                category
              )
            }
            activeOpacity={0.72}
          >

            {/* CATEGORY NUMBER */}

            <View
              style={[
                styles.numberBox,
                {
                  borderColor:
                    category.colour,
                },
              ]}
            >

              <Text
                style={[
                  styles.number,
                  {
                    color:
                      category.colour,
                  },
                ]}
              >
                {category.number}
              </Text>

            </View>


            {/* CATEGORY INFORMATION */}

            <View
              style={styles.categoryDetails}
            >

              <Text
                style={[
                  styles.categoryName,
                  {
                    color:
                      category.colour,
                  },
                ]}
              >
                {category.name}
              </Text>

              <Text
                style={styles.description}
              >
                {category.description}
              </Text>

            </View>


            {/* ARROW */}

            <View
              style={[
                styles.arrowCircle,
                {
                  borderColor:
                    category.colour,
                },
              ]}
            >

              <Text
                style={[
                  styles.arrow,
                  {
                    color:
                      category.colour,
                  },
                ]}
              >
                →
              </Text>

            </View>

          </TouchableOpacity>

        )
      )}


      {/* =================================================
          I DO NOT KNOW
          ================================================= */}

      <TouchableOpacity
        style={styles.unknownBox}
        onPress={markUnknown}
        activeOpacity={0.72}
      >

        <View style={styles.unknownNumberBox}>

          <Text style={styles.unknownNumber}>
            ?
          </Text>

        </View>

        <View style={styles.categoryDetails}>

          <Text style={styles.unknownName}>
            I DO NOT KNOW
          </Text>

          <Text style={styles.description}>
            {playerIsUnknown
              ? 'Already marked as unknown. Pick a category above to rank them properly.'
              : 'Counts as ranked (0 XP, score 0.00). Rank them properly any time.'}
          </Text>

        </View>

      </TouchableOpacity>


      {/* =================================================
          FOOTER
          ================================================= */}

      <View
        style={styles.footer}
      >

        <View
          style={styles.footerLine}
        />

        <Text
          style={styles.footerText}
        >
          YOU DECIDE THE RANK.
        </Text>

        <Text
          style={styles.footerSubtext}
        >
          FotRankr has zero opinions.
        </Text>

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
    paddingHorizontal: 22,
    paddingBottom: 60,
  },


  // =====================================================
  // HEADER
  // =====================================================

  header: {
    paddingTop: 55,
    marginBottom: 40,
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
    fontSize: 39,
    lineHeight: 42,
    fontWeight: '900',
    letterSpacing: -1.7,
  },

  subtitle: {
    color: '#555555',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    lineHeight: 15,
    textTransform: 'uppercase',
    marginTop: 11,
    marginBottom: 25,
  },


  // =====================================================
  // PLAYER CARD
  // =====================================================

  playerBox: {
    backgroundColor: '#101010',
    borderRadius: 16,
    minHeight: 86,
    paddingHorizontal: 16,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1d1d1d',
    marginBottom: 30,
  },

  playerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: '#292929',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },

  playerAvatarFlag: {
    fontSize: 28,
  },

  playerAvatarText: {
    color: '#00ff66',
    fontSize: 20,
    fontWeight: '900',
  },

  playerDetails: {
    flex: 1,
  },

  playerName: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },

  nation: {
    color: '#777777',
    fontSize: 12,
  },

  info: {
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

  // =====================================================
// RANK AGAIN
// =====================================================

rankAgainButton: {
  backgroundColor: '#101010',
  borderWidth: 1,
  borderColor: '#292929',
  borderRadius: 16,
  minHeight: 76,
  paddingHorizontal: 14,
  paddingVertical: 12,
  marginBottom: 25,
},

rankAgainContent: {
  flexDirection: 'row',
  alignItems: 'center',
},

rankAgainIcon: {
  width: 42,
  height: 42,
  borderRadius: 21,
  backgroundColor: '#181818',
  borderWidth: 1,
  borderColor: '#333333',
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 13,
},

rankAgainIconText: {
  color: '#ffffff',
  fontSize: 23,
  fontWeight: '500',
},

rankAgainDetails: {
  flex: 1,
  paddingRight: 8,
},

rankAgainTitle: {
  color: '#ffffff',
  fontSize: 14,
  fontWeight: '900',
  letterSpacing: 1,
},

rankAgainDescription: {
  color: '#666666',
  fontSize: 11,
  lineHeight: 16,
  marginTop: 3,
},

rankAgainArrow: {
  color: '#888888',
  fontSize: 20,
  fontWeight: '700',
},


  // =====================================================
  // SECTION
  // =====================================================

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  sectionTitle: {
    color: '#00ff66',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  sectionHint: {
    color: '#444444',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },


  // =====================================================
  // CATEGORY CARDS
  // =====================================================

  categoryBox: {
    backgroundColor: '#101010',
    borderWidth: 1,
    borderRadius: 16,
    minHeight: 91,
    paddingHorizontal: 13,
    paddingVertical: 13,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  unknownBox: {
    backgroundColor: '#0b0b0b',
    borderWidth: 1,
    borderColor: '#3a3a3a',
    borderStyle: 'dashed',
    borderRadius: 16,
    minHeight: 80,
    paddingHorizontal: 13,
    paddingVertical: 13,
    marginTop: 6,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  unknownNumberBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#555555',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  unknownNumber: {
    color: '#888888',
    fontSize: 18,
    fontWeight: '900',
  },

  unknownName: {
    color: '#aaaaaa',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  numberBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#151515',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  number: {
    fontSize: 13,
    fontWeight: '900',
  },

  categoryDetails: {
    flex: 1,
    paddingRight: 8,
  },

  categoryName: {
    fontSize: 20,
    fontWeight: '900',
  },

  description: {
    color: '#666666',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },

  arrowCircle: {
    width: 35,
    height: 35,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  arrow: {
    fontSize: 18,
    fontWeight: '700',
  },


  // =====================================================
  // FOOTER
  // =====================================================

  footer: {
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 20,
  },

  footerLine: {
    width: 30,
    height: 2,
    backgroundColor: '#222222',
    marginBottom: 15,
  },

  footerText: {
    color: '#444444',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  footerSubtext: {
    color: '#333333',
    fontSize: 10,
    marginTop: 5,
  },


  // ==================================================
  // LOCKED
  // ==================================================

  lockedScreen: {
    flex: 1,
    backgroundColor: '#050505',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  lockedIcon: {
    fontSize: 44,
    marginBottom: 16,
  },

  lockedTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },

  lockedText: {
    color: '#777777',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 24,
  },

  lockedButton: {
    backgroundColor: '#00ff66',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 30,
  },

  lockedButtonText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

});