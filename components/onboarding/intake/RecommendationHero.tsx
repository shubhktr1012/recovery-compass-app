import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path, G, ClipPath, Defs, Rect } from 'react-native-svg';

interface RecStat {
  value: string;
  label: string;
}

interface RecommendationHeroProps {
  title: string;
  subtitle: string;
  /** Additional props to enrich the hero per the editorial spec */
  programName?: string;
  tagline?: string;
  stats?: RecStat[];
}

export function RecommendationHero({
  title,
  subtitle,
  programName,
  tagline,
  stats,
}: RecommendationHeroProps) {
  return (
    <View style={styles.card}>
      {/* Botanical watermark */}
      <View style={styles.botanicalWrap} pointerEvents="none">
        <BotanicalSvg />
      </View>

      {/* Kicker pill */}
      <View style={styles.kicker}>
        <View style={styles.kickerDot} />
        <Text style={styles.kickerText}>Best fit for you</Text>
      </View>

      {/* Program name */}
      <Text style={styles.name}>{programName || title}</Text>

      {/* Tagline */}
      {(tagline || subtitle) ? (
        <Text style={styles.tagline}>{tagline || subtitle}</Text>
      ) : null}

      {/* Divider */}
      {stats && stats.length > 0 && (
        <>
          <View style={styles.divider} />

          {/* Stats row */}
          <View style={styles.statsRow}>
            {stats.map((stat, i) => (
              <React.Fragment key={stat.label}>
                {i > 0 && <View style={styles.statDivider} />}
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

/* ── Botanical leaf SVG (simplified) ─────────────────────────── */

function BotanicalSvg() {
  return (
    <Svg width={100} height={120} viewBox="0 0 100 120" style={styles.botanical}>
      <Defs>
        <ClipPath id="botClip">
          <Rect width={100} height={120} />
        </ClipPath>
      </Defs>
      <G clipPath="url(#botClip)" opacity={0.07}>
        {/* Simplified leaf shape */}
        <Path
          d="M70 110 C70 70 95 50 95 20 C95 50 80 60 70 110z"
          fill="#E3F3E5"
        />
        <Path
          d="M60 105 C60 65 30 45 30 15 C30 45 50 55 60 105z"
          fill="#E3F3E5"
        />
        <Path
          d="M50 100 C50 75 70 60 85 35"
          stroke="#E3F3E5"
          strokeWidth={1}
          fill="none"
        />
      </G>
    </Svg>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#06290C', // forest
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 24,
    overflow: 'hidden',
    position: 'relative',
    // Shadow
    shadowColor: '#06290C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 32,
    elevation: 8,
  },

  /* Botanical */
  botanicalWrap: {
    position: 'absolute',
    right: -10,
    bottom: -10,
  },
  botanical: {
    opacity: 1, // G already has 0.07
  },

  /* Kicker */
  kicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(227,243,229,0.12)',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
    gap: 6,
    marginBottom: 14,
  },
  kickerDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#E3F3E5', // sage
  },
  kickerText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 10,
    letterSpacing: 10 * 0.06,
    color: 'rgba(227,243,229,0.70)',
    textTransform: 'uppercase',
  },

  /* Title / name */
  name: {
    fontFamily: 'Erode-Medium',
    fontSize: 26,
    lineHeight: 26 * 1.2,
    letterSpacing: -0.02 * 26,
    color: '#FFFFFF',
    marginBottom: 8,
  },

  /* Tagline */
  tagline: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 13,
    lineHeight: 13 * 1.5,
    color: 'rgba(227,243,229,0.65)',
  },

  /* Divider */
  divider: {
    height: 1,
    backgroundColor: 'rgba(227,243,229,0.12)',
    marginTop: 18,
    marginBottom: 16,
  },

  /* Stats */
  statsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(227,243,229,0.12)',
    marginTop: 2,
  },
  statValue: {
    fontFamily: 'Erode-Medium',
    fontSize: 20,
    color: '#FFFFFF',
    includeFontPadding: false,
  },
  statLabel: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 9,
    letterSpacing: 9 * 0.1,
    color: 'rgba(227,243,229,0.45)',
    textTransform: 'uppercase',
    marginTop: 4,
  },
});
