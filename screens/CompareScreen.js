import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function CompareScreen({
  route,
  navigation,
  onAnchorSelected,
  onCategoryChanged,
  isPlayerRanked,
  myRankings,
}) {

  const { player } = route.params;


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
  // CATEGORY SELECTION
  // ==================================================

  const chooseCategory = (
    category
  ) => {

    // --------------------------------------------------
    // UNRANKED PLAYER
    // --------------------------------------------------

    if (!isPlayerRanked) {

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
            style={styles.playerAvatarText}
          >
            {player.name
              ?.charAt(0)
              ?.toUpperCase()}
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
              {player.specificPosition ||
                player.position}
            </Text>

          </View>

        </View>

      </View>


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
    color: '#777777',
    fontSize: 16,
    lineHeight: 23,
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

});