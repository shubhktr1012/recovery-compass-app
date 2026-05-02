import React from 'react';
import { Text, View, Pressable, useWindowDimensions } from 'react-native';
import Svg, { Path, Circle, Polyline, Polygon, Rect } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { AppTypography } from '@/constants/typography';

// ─── Brand tokens ───────────────────────────────────────────────────────────
const F = {
  forest: '#06290C',
  sage: '#E3F3E5',
  sageSoft: '#EEF6EF',
  surface: '#F5F5F7',
  canvas: '#FFFFFF',
};

// ─── SVG helpers ─────────────────────────────────────────────────────────────

function CheckmarkSvg({ size = 14, stroke = '#06290C', strokeWidth = 2.2 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="20,6 9,17 4,12" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LockSvg({ size = 13, stroke = 'rgba(6,41,12,0.4)', strokeWidth = 1.8 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M7 11V7a5 5 0 0110 0v4" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

function ClockSvg() {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke="rgba(6,41,12,0.42)" strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M12 7v5l3 2" stroke="rgba(6,41,12,0.42)" strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function PlaySvg({ fill = '#fff' }: { fill?: string }) {
  return (
    <Svg width={10} height={10} viewBox="0 0 24 24" fill={fill}>
      <Polygon points="5,3 19,12 5,21" />
    </Svg>
  );
}

// Botanical watermark for the current-card header
function CardBotanical() {
  return (
    <Svg
      style={{ position: 'absolute', right: -4, bottom: -4, opacity: 0.08, pointerEvents: 'none' }}
      width={90} height={90} viewBox="0 0 100 100" fill="none"
    >
      <Path d="M50 5C50 5 90 30 90 58C90 80 72 96 50 96C28 96 10 80 10 58C10 30 50 5 50 5Z" fill="#E3F3E5" />
      <Path d="M50 52L50 96" stroke="#E3F3E5" strokeWidth="1.5" />
    </Svg>
  );
}

// ─── Squish pressable wrapper ─────────────────────────────────────────────────
function SquishPress({ children, onPress, disabled }: { children: React.ReactNode; onPress?: () => void; disabled?: boolean }) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable
      onPressIn={() => { if (!disabled) scale.value = withTiming(0.975, { duration: 120, easing: Easing.out(Easing.quad) }); }}
      onPressOut={() => { scale.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.quad) }); }}
      onPress={onPress}
      disabled={disabled}
    >
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </Pressable>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface ProgramCardDay {
  id: number;
  title: string;
  description: string;
  durationMinutes: number;
}

interface ProgramCardProps {
  day: ProgramCardDay;
  isLocked: boolean;
  isNextLocked?: boolean;
  isCompleted: boolean;
  isPartial?: boolean;
  isCurrent: boolean;
  isReturningUser?: boolean;
  availabilityLabel?: string | null;
  onPress?: () => void;
}

// ─── CURRENT DAY ─────────────────────────────────────────────────────────────
// Structure: dark forest header + white body — matches spec exactly
function CurrentDayCard({ day, isPartial, isReturningUser, onPress }: {
  day: ProgramCardDay;
  isPartial: boolean;
  isReturningUser: boolean;
  onPress?: () => void;
}) {
  const badgeLabel = isPartial ? 'Partial' : isReturningUser ? 'Welcome Back' : 'Today';

  return (
    <SquishPress onPress={onPress}>
      <View
        style={{
          backgroundColor: F.canvas,
          borderRadius: 20,
          overflow: 'hidden',
          // soft-shadow from spec
          shadowColor: '#06290C',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 4,
          marginBottom: 0,
        }}
      >
        {/* Dark forest header */}
        <View
          style={{
            backgroundColor: F.forest,
            paddingHorizontal: 18,
            paddingTop: 16,
            paddingBottom: 14,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <CardBotanical />

          {/* "Day 1 · Today" pill badge */}
          <View
            style={{
              alignSelf: 'flex-start',
              backgroundColor: 'rgba(227,243,229,0.16)',
              borderWidth: 1,
              borderColor: 'rgba(227,243,229,0.24)',
              borderRadius: 999,
              paddingHorizontal: 9,
              paddingVertical: 2,
              marginBottom: 8,
            }}
          >
            <Text
              style={{
                fontFamily: 'Satoshi-SemiBold',
                fontSize: 9,
                letterSpacing: 1.0,
                color: 'rgba(227,243,229,0.75)',
                textTransform: 'uppercase',
              }}
            >
              Day {day.id} · {badgeLabel}
            </Text>
          </View>

          {/* Day title — serif, italic last word pattern */}
          <Text
            style={{
              fontFamily: 'Erode-MediumItalic',
              fontSize: 18,
              lineHeight: 22,
              letterSpacing: -0.18,
              color: '#fff',
            }}
          >
            {day.title}
          </Text>
        </View>

        {/* White body */}
        <View style={{ paddingHorizontal: 18, paddingTop: 12, paddingBottom: 14 }}>
          {/* Description */}
          <Text
            style={{
              ...AppTypography.bodyCompact,
              color: 'rgba(6,41,12,0.62)',
              marginBottom: 12,
            }}
          >
            {day.description}
          </Text>

          {/* Footer: duration + CTA */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Duration */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <ClockSvg />
              <Text style={{ fontFamily: 'Satoshi-Regular', fontSize: 11, color: 'rgba(6,41,12,0.45)' }}>
                {day.durationMinutes} min session
              </Text>
            </View>

            {/* "Open Today" button */}
            <View
              style={{
                backgroundColor: F.forest,
                borderRadius: 999,
                paddingHorizontal: 16,
                paddingVertical: 9,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <PlaySvg />
              <Text style={{ fontFamily: 'Satoshi-Medium', fontSize: 12, color: '#fff' }}>
                Open Today
              </Text>
            </View>
          </View>
        </View>
      </View>
    </SquishPress>
  );
}

// ─── COMPLETED DAY ────────────────────────────────────────────────────────────
// White card, sage-soft check-circle, "Day X · Completed" label, "Tap to revisit"
function CompletedDayCard({ day, onPress }: { day: ProgramCardDay; onPress?: () => void }) {
  return (
    <SquishPress onPress={onPress}>
      <View
        style={{
          backgroundColor: F.canvas,
          borderRadius: 18,
          paddingHorizontal: 16,
          paddingVertical: 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          shadowColor: '#06290C',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.03,
          shadowRadius: 5,
          elevation: 1,
        }}
      >
        {/* Sage-soft check circle */}
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: F.sageSoft,   // #EEF6EF per spec
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <CheckmarkSvg size={14} stroke={F.forest} strokeWidth={2.2} />
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: 'Satoshi-SemiBold',
              fontSize: 9,
              letterSpacing: 1.4,
              textTransform: 'uppercase',
              color: 'rgba(6,41,12,0.35)',
              marginBottom: 2,
            }}
          >
            Day {day.id} · Completed
          </Text>
          <Text style={{ fontFamily: 'Erode-Medium', fontSize: 15, lineHeight: 18, color: 'rgba(6,41,12,0.7)' }}>
            {day.title}
          </Text>
          <Text style={{ ...AppTypography.meta, color: 'rgba(6,41,12,0.35)', marginTop: 2 }}>
            Tap to revisit
          </Text>
        </View>
      </View>
    </SquishPress>
  );
}

// ─── NEXT-LOCKED DAY (sage-soft bg, "coming up" feel) ────────────────────────
function NextLockedDayCard({ day, availabilityLabel }: { day: ProgramCardDay; availabilityLabel?: string | null }) {
  return (
    <View
      style={{
        backgroundColor: F.sageSoft,   // #EEF6EF per spec
        borderRadius: 18,
        paddingHorizontal: 16,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      {/* Next circle — slightly more opacity lock */}
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: 'rgba(6,41,12,0.08)',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <LockSvg size={13} stroke="rgba(6,41,12,0.4)" strokeWidth={1.8} />
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: 'Satoshi-SemiBold',
            fontSize: 9,
            letterSpacing: 1.4,
            textTransform: 'uppercase',
            color: 'rgba(6,41,12,0.25)',
            marginBottom: 2,
          }}
        >
          Day {day.id}
        </Text>
        {/* Slightly more visible title — color: rgba(6,41,12,0.55) per spec */}
        <Text style={{ fontFamily: 'Erode-Regular', fontSize: 15, lineHeight: 18, color: 'rgba(6,41,12,0.55)' }}>
          {day.title}
        </Text>
        {availabilityLabel && (
          <Text style={{ ...AppTypography.meta, color: 'rgba(6,41,12,0.28)', marginTop: 2 }}>
            {availabilityLabel}
          </Text>
        )}
      </View>
    </View>
  );
}

// ─── LOCKED DAY (further in future) ──────────────────────────────────────────
// rgba(255,255,255,0.6) bg with 1px hairline border
function LockedDayCard({ day }: { day: ProgramCardDay }) {
  return (
    <View
      style={{
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(6,41,12,0.04)',
        paddingHorizontal: 16,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      {/* Lock circle */}
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: 'rgba(6,41,12,0.05)',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <LockSvg size={12} stroke="rgba(6,41,12,0.28)" strokeWidth={1.8} />
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: 'Satoshi-SemiBold',
            fontSize: 9,
            letterSpacing: 1.4,
            textTransform: 'uppercase',
            color: 'rgba(6,41,12,0.25)',
            marginBottom: 2,
          }}
        >
          Day {day.id}
        </Text>
        <Text style={{ fontFamily: 'Erode-Regular', fontSize: 15, lineHeight: 18, color: 'rgba(6,41,12,0.35)' }}>
          {day.title}
        </Text>
      </View>
    </View>
  );
}

// ─── AVAILABLE PAST DAY ──────────────────────────────────────────────────────
function AvailableDayCard({ day, onPress }: { day: ProgramCardDay; onPress?: () => void }) {
  return (
    <SquishPress onPress={onPress}>
      <View
        style={{
          backgroundColor: F.canvas,
          borderRadius: 18,
          paddingHorizontal: 16,
          paddingVertical: 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          shadowColor: '#06290C',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.03,
          shadowRadius: 5,
          elevation: 1,
        }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: F.sageSoft,
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <PlaySvg fill={F.forest} />
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: 'Satoshi-SemiBold',
              fontSize: 9,
              letterSpacing: 1.4,
              textTransform: 'uppercase',
              color: 'rgba(6,41,12,0.35)',
              marginBottom: 2,
            }}
          >
            Day {day.id} · Available
          </Text>
          <Text style={{ fontFamily: 'Erode-Medium', fontSize: 15, lineHeight: 18, color: 'rgba(6,41,12,0.7)' }}>
            {day.title}
          </Text>
          <Text style={{ ...AppTypography.meta, color: 'rgba(6,41,12,0.35)', marginTop: 2 }}>
            Tap to open
          </Text>
        </View>
      </View>
    </SquishPress>
  );
}

// ─── PARTIAL DAY ──────────────────────────────────────────────────────────────
function PartialDayCard({ day, onPress }: { day: ProgramCardDay; onPress?: () => void }) {
  return (
    <SquishPress onPress={onPress}>
      <View
        style={{
          backgroundColor: F.sageSoft,
          borderRadius: 18,
          paddingHorizontal: 16,
          paddingVertical: 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: 'rgba(6,41,12,0.08)',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <LockSvg size={12} stroke="rgba(6,41,12,0.4)" strokeWidth={1.8} />
        </View>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <Text
              style={{
                fontFamily: 'Satoshi-SemiBold',
                fontSize: 9,
                letterSpacing: 1.4,
                textTransform: 'uppercase',
                color: 'rgba(6,41,12,0.35)',
              }}
            >
              Day {day.id} · Partial
            </Text>
          </View>
          <Text style={{ fontFamily: 'Erode-Medium', fontSize: 15, lineHeight: 18, color: 'rgba(6,41,12,0.6)' }}>
            {day.title}
          </Text>
          <Text style={{ ...AppTypography.meta, color: 'rgba(6,41,12,0.4)', marginTop: 2 }}>
            Tap to continue
          </Text>
        </View>
      </View>
    </SquishPress>
  );
}

// ─── ROOT EXPORT ──────────────────────────────────────────────────────────────
export function ProgramCard({
  day,
  isLocked,
  isNextLocked,
  isCompleted,
  isPartial = false,
  isCurrent,
  isReturningUser = false,
  availabilityLabel,
  onPress,
}: ProgramCardProps) {

  if (isCurrent) {
    return (
      <CurrentDayCard
        day={day}
        isPartial={isPartial}
        isReturningUser={isReturningUser}
        onPress={onPress}
      />
    );
  }

  if (isCompleted) {
    return <CompletedDayCard day={day} onPress={onPress} />;
  }

  if (isPartial) {
    return <PartialDayCard day={day} onPress={onPress} />;
  }

  // Next-locked: the day immediately after current (sage-soft bg, more visible)
  if (isNextLocked) {
    return <NextLockedDayCard day={day} availabilityLabel={availabilityLabel} />;
  }

  // All further locked days
  if (isLocked) {
    return <LockedDayCard day={day} />;
  }

  return <AvailableDayCard day={day} onPress={onPress} />;
}
