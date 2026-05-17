//
//  RecoveryCompassWidget.swift
//  RecoveryCompassWidget
//
//  Small (2×2) and Medium (2×4) widgets.
//  Supports light, dark, and system-automatic color schemes.
//

import WidgetKit
import SwiftUI

public enum RCWidgetIdentifiers {
    public static let kind = "RecoveryCompassWidget"
}

public extension WidgetCenter {
    static func reloadRecoveryCompass() {
        WidgetCenter.shared.reloadTimelines(ofKind: RCWidgetIdentifiers.kind)
    }
}

// MARK: - Timeline Provider

struct RCProvider: TimelineProvider {
    func placeholder(in context: Context) -> RCEntry {
        RCEntry(date: Date(), data: .placeholder)
    }

    func getSnapshot(in context: Context, completion: @escaping (RCEntry) -> Void) {
        completion(RCEntry(date: Date(), data: .load()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<RCEntry>) -> Void) {
        let data = WidgetData.load()
        let entry = RCEntry(date: Date(), data: data)
        // Refresh every 30 minutes so streak/steps stay reasonably fresh
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 30, to: Date()) ?? Date()
        print("[WidgetDebug] RCProvider.getTimeline currentDay=\(data.currentDay) programSlug=\(data.programSlug) nextUpdate=\(nextUpdate)")
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
}

struct RCEntry: TimelineEntry {
    let date: Date
    let data: WidgetData
}

// MARK: - Design Tokens

private enum RCColor {
    static let forestDark  = Color(red: 6/255.0, green: 41/255.0, blue: 12/255.0)   // #06290C
    static let forestTop   = Color(red: 7/255.0, green: 49/255.0, blue: 15/255.0)   // #07310F
    static let forestBot   = Color(red: 5/255.0, green: 35/255.0, blue: 9/255.0)    // #052309
    static let sageDim     = Color(red: 200/255.0, green: 233/255.0, blue: 205/255.0) // #C8E9CD
    static let sageLight   = Color(red: 227/255.0, green: 243/255.0, blue: 229/255.0) // #E3F3E5
    static let white       = Color.white
    static let canvas      = Color(red: 252/255.0, green: 252/255.0, blue: 250/255.0) // #FCFCFA
}

// Brand font helper — uses Satoshi / Erode when available in the widget
// target, falls back to system font otherwise.
private enum RCFont {
    /// Satoshi — used for body, labels, buttons
    static func satoshi(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        switch weight {
        case .bold:     return .custom("Satoshi-Bold", size: size)
        case .semibold: return .custom("Satoshi-Medium", size: size)
        case .medium:   return .custom("Satoshi-Medium", size: size)
        default:        return .custom("Satoshi-Regular", size: size)
        }
    }
    /// Erode — used for display / title text
    static func erode(_ size: CGFloat, weight: Font.Weight = .medium) -> Font {
        switch weight {
        case .bold:     return .custom("Erode-Bold", size: size)
        case .semibold: return .custom("Erode-Semibold", size: size)
        case .medium:   return .custom("Erode-Medium", size: size)
        default:        return .custom("Erode-Regular", size: size)
        }
    }
}

// MARK: - Shared Subviews

/// App logo shape — converted exactly from rc-logo-primary.svg
private struct RCLogoShape: Shape {
    func path(in rect: CGRect) -> Path {
        var p = Path()
        // The original SVG viewBox was "19.23 17.46 121.54 125.09"
        let scale = min(rect.width / 121.54, rect.height / 125.09)
        let offsetX = (rect.width - 121.54 * scale) / 2 - (19.23 * scale)
        let offsetY = (rect.height - 125.09 * scale) / 2 - (17.46 * scale)
        let transform = CGAffineTransform(translationX: offsetX, y: offsetY).scaledBy(x: scale, y: scale)

        p.move(to: CGPoint(x: 140.773, y: 79.990))
        p.addLine(to: CGPoint(x: 137.013, y: 76.233))
        p.addLine(to: CGPoint(x: 137.013, y: 78.202))
        p.addLine(to: CGPoint(x: 117.912, y: 78.202))
        p.addCurve(to: CGPoint(x: 112.106, y: 73.909), control1: CGPoint(x: 117.151, y: 75.718), control2: CGPoint(x: 114.839, y: 73.909))
        p.addCurve(to: CGPoint(x: 106.300, y: 78.202), control1: CGPoint(x: 109.373, y: 73.909), control2: CGPoint(x: 107.060, y: 75.718))
        p.addLine(to: CGPoint(x: 91.350, y: 78.202))
        p.addLine(to: CGPoint(x: 91.569, y: 77.580))
        p.addLine(to: CGPoint(x: 92.650, y: 74.518))
        p.addLine(to: CGPoint(x: 95.229, y: 67.228))
        p.addLine(to: CGPoint(x: 110.454, y: 52.006))
        p.addLine(to: CGPoint(x: 111.301, y: 52.853))
        p.addLine(to: CGPoint(x: 111.304, y: 48.642))
        p.addLine(to: CGPoint(x: 107.091, y: 48.642))
        p.addLine(to: CGPoint(x: 107.941, y: 49.492))
        p.addLine(to: CGPoint(x: 93.201, y: 64.229))
        p.addLine(to: CGPoint(x: 85.301, y: 67.317))
        p.addLine(to: CGPoint(x: 82.299, y: 68.493))
        p.addLine(to: CGPoint(x: 81.742, y: 68.709))
        p.addLine(to: CGPoint(x: 81.742, y: 53.756))
        p.addCurve(to: CGPoint(x: 86.044, y: 47.938), control1: CGPoint(x: 84.232, y: 52.995), control2: CGPoint(x: 86.044, y: 50.677))
        p.addCurve(to: CGPoint(x: 81.742, y: 42.120), control1: CGPoint(x: 86.044, y: 45.199), control2: CGPoint(x: 84.232, y: 42.881))
        p.addLine(to: CGPoint(x: 81.742, y: 21.212))
        p.addLine(to: CGPoint(x: 83.758, y: 21.212))
        p.addLine(to: CGPoint(x: 80.003, y: 17.455))
        p.addLine(to: CGPoint(x: 76.243, y: 21.212))
        p.addLine(to: CGPoint(x: 78.188, y: 21.212))
        p.addLine(to: CGPoint(x: 78.188, y: 42.120))
        p.addCurve(to: CGPoint(x: 73.883, y: 47.938), control1: CGPoint(x: 75.698, y: 42.881), control2: CGPoint(x: 73.883, y: 45.199))
        p.addCurve(to: CGPoint(x: 78.188, y: 53.756), control1: CGPoint(x: 73.883, y: 50.677), control2: CGPoint(x: 75.698, y: 52.995))
        p.addLine(to: CGPoint(x: 78.188, y: 70.098))
        p.addLine(to: CGPoint(x: 74.143, y: 71.682))
        p.addLine(to: CGPoint(x: 51.986, y: 49.528))
        p.addLine(to: CGPoint(x: 52.836, y: 48.678))
        p.addLine(to: CGPoint(x: 48.625, y: 48.678))
        p.addLine(to: CGPoint(x: 48.625, y: 52.889))
        p.addLine(to: CGPoint(x: 49.475, y: 52.039))
        p.addLine(to: CGPoint(x: 71.668, y: 74.232))
        p.addLine(to: CGPoint(x: 70.196, y: 78.203))
        p.addLine(to: CGPoint(x: 53.647, y: 78.203))
        p.addCurve(to: CGPoint(x: 47.841, y: 73.910), control1: CGPoint(x: 52.889, y: 75.719), control2: CGPoint(x: 50.576, y: 73.910))
        p.addCurve(to: CGPoint(x: 42.035, y: 78.203), control1: CGPoint(x: 45.106, y: 73.910), control2: CGPoint(x: 42.795, y: 75.719))
        p.addLine(to: CGPoint(x: 22.987, y: 78.203))
        p.addLine(to: CGPoint(x: 22.987, y: 76.234))
        p.addLine(to: CGPoint(x: 19.230, y: 79.989))
        p.addLine(to: CGPoint(x: 22.987, y: 83.746))
        p.addLine(to: CGPoint(x: 22.987, y: 81.756))
        p.addLine(to: CGPoint(x: 42.035, y: 81.756))
        p.addCurve(to: CGPoint(x: 47.841, y: 86.049), control1: CGPoint(x: 42.796, y: 84.243), control2: CGPoint(x: 45.109, y: 86.049))
        p.addCurve(to: CGPoint(x: 53.647, y: 81.756), control1: CGPoint(x: 50.573, y: 86.049), control2: CGPoint(x: 52.889, y: 84.243))
        p.addLine(to: CGPoint(x: 68.881, y: 81.756))
        p.addLine(to: CGPoint(x: 68.686, y: 82.280))
        p.addLine(to: CGPoint(x: 67.567, y: 85.303))
        p.addLine(to: CGPoint(x: 64.887, y: 92.546))
        p.addLine(to: CGPoint(x: 49.475, y: 107.958))
        p.addLine(to: CGPoint(x: 48.625, y: 107.108))
        p.addLine(to: CGPoint(x: 48.625, y: 111.319))
        p.addLine(to: CGPoint(x: 52.836, y: 111.319))
        p.addLine(to: CGPoint(x: 51.986, y: 110.469))
        p.addLine(to: CGPoint(x: 66.628, y: 95.830))
        p.addLine(to: CGPoint(x: 75.085, y: 92.668))
        p.addLine(to: CGPoint(x: 78.126, y: 91.531))
        p.addLine(to: CGPoint(x: 78.188, y: 91.507))
        p.addLine(to: CGPoint(x: 78.188, y: 106.235))
        p.addCurve(to: CGPoint(x: 73.895, y: 112.041), control1: CGPoint(x: 75.704, y: 106.996), control2: CGPoint(x: 73.895, y: 109.308))
        p.addCurve(to: CGPoint(x: 78.188, y: 117.847), control1: CGPoint(x: 73.895, y: 114.774), control2: CGPoint(x: 75.704, y: 117.087))
        p.addLine(to: CGPoint(x: 78.188, y: 138.790))
        p.addLine(to: CGPoint(x: 76.243, y: 138.790))
        p.addLine(to: CGPoint(x: 80.000, y: 142.547))
        p.addLine(to: CGPoint(x: 83.757, y: 138.790))
        p.addLine(to: CGPoint(x: 81.741, y: 138.790))
        p.addLine(to: CGPoint(x: 81.741, y: 117.847))
        p.addCurve(to: CGPoint(x: 86.034, y: 112.041), control1: CGPoint(x: 84.225, y: 117.086), control2: CGPoint(x: 86.034, y: 114.773))
        p.addCurve(to: CGPoint(x: 81.741, y: 106.235), control1: CGPoint(x: 86.034, y: 109.309), control2: CGPoint(x: 84.225, y: 106.995))
        p.addLine(to: CGPoint(x: 81.741, y: 90.178))
        p.addLine(to: CGPoint(x: 86.014, y: 88.582))
        p.addLine(to: CGPoint(x: 107.940, y: 110.508))
        p.addLine(to: CGPoint(x: 107.090, y: 111.355))
        p.addLine(to: CGPoint(x: 111.301, y: 111.358))
        p.addLine(to: CGPoint(x: 111.301, y: 107.145))
        p.addLine(to: CGPoint(x: 110.454, y: 107.995))
        p.addLine(to: CGPoint(x: 88.555, y: 86.096))
        p.addLine(to: CGPoint(x: 90.089, y: 81.758))
        p.addLine(to: CGPoint(x: 106.300, y: 81.758))
        p.addCurve(to: CGPoint(x: 112.106, y: 86.051), control1: CGPoint(x: 107.061, y: 84.245), control2: CGPoint(x: 109.374, y: 86.051))
        p.addCurve(to: CGPoint(x: 117.912, y: 81.758), control1: CGPoint(x: 114.838, y: 86.051), control2: CGPoint(x: 117.152, y: 84.245))
        p.addLine(to: CGPoint(x: 137.013, y: 81.758))
        p.addLine(to: CGPoint(x: 137.013, y: 83.748))
        p.addLine(to: CGPoint(x: 140.773, y: 79.993))
        p.addLine(to: CGPoint(x: 140.773, y: 79.990))
        p.closeSubpath()
        p.move(to: CGPoint(x: 80.212, y: 84.443))
        p.addCurve(to: CGPoint(x: 75.821, y: 80.141), control1: CGPoint(x: 77.811, y: 84.470), control2: CGPoint(x: 75.845, y: 82.542))
        p.addCurve(to: CGPoint(x: 80.123, y: 75.747), control1: CGPoint(x: 75.797, y: 77.740), control2: CGPoint(x: 77.722, y: 75.774))
        p.addCurve(to: CGPoint(x: 84.517, y: 80.052), control1: CGPoint(x: 82.524, y: 75.723), control2: CGPoint(x: 84.490, y: 77.651))
        p.addCurve(to: CGPoint(x: 80.212, y: 84.443), control1: CGPoint(x: 84.541, y: 82.453), control2: CGPoint(x: 82.613, y: 84.419))
        p.addLine(to: CGPoint(x: 80.212, y: 84.443))
        p.closeSubpath()

        return p.applying(transform)
    }
}

/// Compass brand mark wrapper
private struct CompassMark: View {
    let color: Color
    let size: CGFloat

    init(color: Color, size: CGFloat = 14) {
        self.color = color
        self.size = size
    }

    var body: some View {
        RCLogoShape()
            .fill(color, style: FillStyle(eoFill: true))
            .frame(width: size, height: size)
    }
}

/// Circular progress ring (Apple activity-ring style)
private struct ProgressRing: View {
    let pct: Double
    let isDark: Bool
    let size: CGFloat

    init(pct: Double, isDark: Bool, size: CGFloat = 52) {
        self.pct = min(max(pct, 0), 1)
        self.isDark = isDark
        self.size = size
    }

    var body: some View {
        ZStack {
            // Track
            Circle()
                .stroke(isDark ? Color.white.opacity(0.10) : RCColor.forestDark.opacity(0.08), lineWidth: 5)

            // Fill
            Circle()
                .trim(from: 0, to: pct)
                .stroke(isDark ? RCColor.sageDim : RCColor.forestDark, style: StrokeStyle(lineWidth: 5, lineCap: .round))
                .rotationEffect(.degrees(-90))

            // Percentage label
            VStack(spacing: 0) {
                Text("\(Int(pct * 100))")
                    .font(RCFont.satoshi(13, weight: .bold))
                    .foregroundColor(isDark ? .white : RCColor.forestDark)
                Text("%")
                    .font(RCFont.satoshi(8, weight: .medium))
                    .foregroundColor((isDark ? Color.white : RCColor.forestDark).opacity(0.55))
            }
        }
        .frame(width: size, height: size)
    }
}

// MARK: - Small Widget (2×2)

struct SmallWidgetView: View {
    let data: WidgetData
    @Environment(\.colorScheme) var colorScheme

    private var isDark: Bool { colorScheme == .dark }

    private var primaryText: Color  { isDark ? .white : RCColor.forestDark }
    private var subtleText: Color   { isDark ? Color.white.opacity(0.55) : RCColor.forestDark.opacity(0.55) }
    private var faintText: Color    { isDark ? Color.white.opacity(0.40) : RCColor.forestDark.opacity(0.40) }
    private var trackColor: Color   { isDark ? Color.white.opacity(0.10) : RCColor.forestDark.opacity(0.08) }
    private var fillColor: Color    { isDark ? RCColor.sageDim : RCColor.forestDark }

    private var progressFraction: Double {
        guard data.totalDays > 0 else { return 0 }
        return Double(data.currentDay) / Double(data.totalDays)
    }

    var body: some View {
        Link(destination: data.isEmpty || data.sessionLocked ? WidgetData.homeURL : (data.isDayCompleted ? data.journalURL : data.resumeURL)) {
            VStack(alignment: .leading, spacing: 0) {
                if data.isEmpty {
                    // ── Empty / not logged in ────────────────────────
                    HStack(spacing: 5) {
                        CompassMark(color: subtleText, size: 13)
                        Text("Recovery Compass")
                            .font(RCFont.satoshi(11, weight: .semibold))
                            .foregroundColor(subtleText)
                    }
                    Spacer()
                    Text("Open app\nto begin")
                        .font(RCFont.erode(16, weight: .medium))
                        .foregroundColor(primaryText)
                        .lineSpacing(2)
                    Spacer()
                    Image(systemName: "arrow.right")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundColor(subtleText)

                } else if data.sessionLocked {
                    HStack(spacing: 5) {
                        CompassMark(color: subtleText, size: 13)
                        Text("Recovery Compass")
                            .font(RCFont.satoshi(11, weight: .semibold))
                            .foregroundColor(subtleText)
                    }
                    Spacer()
                    Text("Day \(data.currentDay)")
                        .font(RCFont.erode(28, weight: .bold))
                        .foregroundColor(primaryText)
                        .padding(.top, 1)
                    Text(data.availabilityLabel ?? "Check back soon")
                        .font(RCFont.satoshi(11, weight: .medium))
                        .foregroundColor(subtleText)
                        .lineLimit(1)
                        .padding(.top, 2)
                    Spacer()

                } else if data.isDayCompleted {
                    // ── Day completed ────────────────────────────────
                    HStack(spacing: 5) {
                        CompassMark(color: subtleText, size: 13)
                        Text("Recovery Compass")
                            .font(RCFont.satoshi(11, weight: .semibold))
                            .foregroundColor(subtleText)
                    }
                    Spacer()
                    HStack(spacing: 5) {
                        Image(systemName: "checkmark")
                            .font(.system(size: 11, weight: .bold))
                        Text("Complete")
                            .font(RCFont.satoshi(12, weight: .semibold))
                    }
                    .foregroundColor(fillColor)
                    Text("Day \(data.currentDay)")
                        .font(RCFont.erode(28, weight: .bold))
                        .foregroundColor(primaryText)
                        .padding(.top, 1)
                    Spacer()
                    HStack(spacing: 5) {
                        Image(systemName: "pencil")
                            .font(.system(size: 10, weight: .semibold))
                        Text("Open journal")
                            .font(RCFont.satoshi(12, weight: .medium))
                    }
                    .foregroundColor(subtleText)

                } else {
                    // ── Active session ───────────────────────────────
                    HStack(spacing: 5) {
                        CompassMark(color: subtleText, size: 13)
                        Text("Recovery Compass")
                            .font(RCFont.satoshi(11, weight: .semibold))
                            .foregroundColor(subtleText)
                    }

                    Spacer(minLength: 6)

                    // Focal day number
                    HStack(alignment: .firstTextBaseline, spacing: 3) {
                        Text("\(data.currentDay)")
                            .font(RCFont.satoshi(40, weight: .bold))
                            .foregroundColor(primaryText)
                        Text("day")
                            .font(RCFont.satoshi(13, weight: .semibold))
                            .foregroundColor(subtleText)
                    }

                    Text(data.programName)
                        .font(RCFont.satoshi(11, weight: .medium))
                        .foregroundColor(subtleText)
                        .lineLimit(1)
                        .padding(.top, 2)

                    Spacer(minLength: 6)

                    // Progress bar
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 999)
                                .fill(trackColor)
                                .frame(height: 4)
                            RoundedRectangle(cornerRadius: 999)
                                .fill(fillColor)
                                .frame(width: max(4, geo.size.width * progressFraction), height: 4)
                        }
                    }
                    .frame(height: 4)
                    .padding(.bottom, 6)

                    // Footer
                    HStack(spacing: 5) {
                        Image(systemName: "flame.fill")
                            .font(.system(size: 9))
                        Text("\(data.streak) day streak · Card \(data.cardIndex + 1)/\(data.totalCards)")
                            .font(RCFont.satoshi(11, weight: .medium))
                    }
                    .foregroundColor(subtleText)
                }
            }
        }
    }
}

// MARK: - Medium Widget (2×4)

struct MediumWidgetView: View {
    let data: WidgetData
    @Environment(\.colorScheme) var colorScheme

    private var isDark: Bool { colorScheme == .dark }

    private var primaryText: Color   { isDark ? .white : RCColor.forestDark }
    private var subtleText: Color    { isDark ? Color.white.opacity(0.55) : RCColor.forestDark.opacity(0.55) }
    private var faintText: Color     { isDark ? Color.white.opacity(0.40) : RCColor.forestDark.opacity(0.40) }
    private var trackColor: Color    { isDark ? Color.white.opacity(0.10) : RCColor.forestDark.opacity(0.08) }
    private var fillColor: Color     { isDark ? RCColor.sageDim : RCColor.forestDark }
    private var pillBg: Color        { isDark ? RCColor.sageLight : RCColor.forestDark }
    private var pillFg: Color        { isDark ? RCColor.forestDark : .white }

    private var progressFraction: Double {
        guard data.totalDays > 0 else { return 0 }
        return Double(data.currentDay) / Double(data.totalDays)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            if data.isEmpty {
                // ── Empty / not logged in ─────────────────────────
                HStack(spacing: 5) {
                    CompassMark(color: subtleText, size: 13)
                    Text("Recovery Compass")
                        .font(RCFont.satoshi(11, weight: .semibold))
                        .foregroundColor(subtleText)
                }

                Spacer()

                Text("Open the app to\nstart your journey")
                    .font(RCFont.erode(16, weight: .medium))
                    .foregroundColor(primaryText)
                    .lineSpacing(2)

                Spacer()

                Link(destination: WidgetData.homeURL) {
                    HStack(spacing: 5) {
                        Image(systemName: "arrow.right")
                            .font(.system(size: 10, weight: .semibold))
                        Text("Get started")
                            .font(RCFont.satoshi(13, weight: .semibold))
                    }
                    .foregroundColor(pillFg)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 8)
                    .background(pillBg)
                    .clipShape(RoundedRectangle(cornerRadius: 999))
                }

            } else if data.sessionLocked {
                HStack(spacing: 5) {
                    CompassMark(color: subtleText, size: 13)
                    Text("Recovery Compass")
                        .font(RCFont.satoshi(11, weight: .semibold))
                        .foregroundColor(subtleText)
                    Spacer()
                    Text("Day \(data.currentDay) of \(data.totalDays)")
                        .font(RCFont.satoshi(11, weight: .semibold))
                        .foregroundColor(subtleText)
                        .monospacedDigit()
                }

                Spacer(minLength: 8)

                HStack(alignment: .center) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Next session")
                            .font(RCFont.satoshi(11, weight: .semibold))
                            .foregroundColor(subtleText)
                        Text(data.availabilityLabel ?? "Check back soon")
                            .font(RCFont.erode(16, weight: .semibold))
                            .foregroundColor(primaryText)
                            .lineLimit(2)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    Spacer()
                    ProgressRing(pct: progressFraction, isDark: isDark, size: 52)
                }

                Spacer(minLength: 8)

                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 999)
                            .fill(trackColor)
                            .frame(height: 4)
                        RoundedRectangle(cornerRadius: 999)
                            .fill(fillColor)
                            .frame(width: max(4, geo.size.width * progressFraction), height: 4)
                    }
                }
                .frame(height: 4)
                .padding(.bottom, 0)

            } else if data.isDayCompleted {
                // ── Day completed ─────────────────────────────────
                // Header
                HStack(spacing: 5) {
                    CompassMark(color: subtleText, size: 13)
                    Text("Recovery Compass")
                        .font(RCFont.satoshi(11, weight: .semibold))
                        .foregroundColor(subtleText)
                    Spacer()
                    Text("Day \(data.currentDay) of \(data.totalDays)")
                        .font(RCFont.satoshi(11, weight: .semibold))
                        .foregroundColor(subtleText)
                        .monospacedDigit()
                }

                Spacer(minLength: 8)

                // Content: left text + right ring
                HStack(alignment: .center) {
                    VStack(alignment: .leading, spacing: 4) {
                        HStack(spacing: 4) {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.system(size: 11))
                                .foregroundColor(fillColor)
                            Text("Complete")
                                .font(RCFont.satoshi(11, weight: .semibold))
                                .foregroundColor(subtleText)
                        }
                        Text("Today's action\nhas been taken")
                            .font(RCFont.erode(16, weight: .semibold))
                            .foregroundColor(primaryText)
                            .lineSpacing(2)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    Spacer()
                    ProgressRing(pct: progressFraction, isDark: isDark, size: 52)
                }

                Spacer(minLength: 8)

                // Bottom bar + footer
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 999)
                            .fill(trackColor)
                            .frame(height: 4)
                        RoundedRectangle(cornerRadius: 999)
                            .fill(fillColor)
                            .frame(width: geo.size.width, height: 4)
                    }
                }
                .frame(height: 4)
                .padding(.bottom, 8)

                HStack {
                    HStack(spacing: 5) {
                        Image(systemName: "flame.fill")
                            .font(.system(size: 9))
                        Text("\(data.streak) day streak")
                            .font(RCFont.satoshi(12, weight: .medium))
                    }
                    .foregroundColor(subtleText)
                    Spacer()
                    Link(destination: data.journalURL) {
                        HStack(spacing: 4) {
                            Image(systemName: "pencil")
                                .font(.system(size: 9))
                            Text("Open journal")
                                .font(RCFont.satoshi(12, weight: .medium))
                        }
                        .foregroundColor(subtleText)
                    }
                }

            } else {
                // ── Active session ────────────────────────────────
                // Header
                HStack(spacing: 5) {
                    CompassMark(color: subtleText, size: 13)
                    Text("Recovery Compass")
                        .font(RCFont.satoshi(11, weight: .semibold))
                        .foregroundColor(subtleText)
                    Spacer()
                    Text("Day \(data.currentDay) of \(data.totalDays)")
                        .font(RCFont.satoshi(11, weight: .semibold))
                        .foregroundColor(subtleText)
                        .monospacedDigit()
                }

                Spacer(minLength: 8)

                // Content: left title + right ring
                HStack(alignment: .center) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Today")
                            .font(RCFont.satoshi(11, weight: .semibold))
                            .foregroundColor(subtleText)
                        Text(data.programName)
                            .font(RCFont.erode(16, weight: .semibold))
                            .foregroundColor(primaryText)
                            .lineLimit(2)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    Spacer()
                    ProgressRing(pct: progressFraction, isDark: isDark, size: 52)
                }

                Spacer(minLength: 8)

                // Bottom bar + footer
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 999)
                            .fill(trackColor)
                            .frame(height: 4)
                        RoundedRectangle(cornerRadius: 999)
                            .fill(fillColor)
                            .frame(width: max(4, geo.size.width * progressFraction), height: 4)
                    }
                }
                .frame(height: 4)
                .padding(.bottom, 8)

                HStack {
                    HStack(spacing: 5) {
                        Image(systemName: "flame.fill")
                            .font(.system(size: 9))
                        Text("\(data.streak) day streak")
                            .font(RCFont.satoshi(12, weight: .medium))
                    }
                    .foregroundColor(subtleText)
                    Spacer()
                    HStack(spacing: 5) {
                        Image(systemName: "leaf")
                            .font(.system(size: 9))
                        Text("Card \(data.cardIndex + 1) of \(data.totalCards)")
                            .font(RCFont.satoshi(12, weight: .medium))
                    }
                    .foregroundColor(subtleText)
                }
            }
        }
    }
}

// MARK: - Entry View Router

struct RecoveryCompassWidgetEntryView: View {
    var entry: RCProvider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .systemSmall:
            SmallWidgetView(data: entry.data)
        case .systemMedium:
            MediumWidgetView(data: entry.data)
        default:
            MediumWidgetView(data: entry.data)
        }
    }
}

// MARK: - Widget Declaration

struct RecoveryCompassWidget: Widget {
    let kind: String = RCWidgetIdentifiers.kind

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: RCProvider()) { entry in
            if #available(iOS 17.0, *) {
                RecoveryCompassWidgetEntryView(entry: entry)
                    .containerBackground(for: .widget) {
                        RCWidgetBackground()
                    }
            } else {
                RecoveryCompassWidgetEntryView(entry: entry)
            }
        }
        .configurationDisplayName("Recovery Compass")
        .description("Today's session, streak, and quick access.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

/// Dark: subtle gradient matching the design spec. Light: warm canvas.
private struct RCWidgetBackground: View {
    @Environment(\.colorScheme) var colorScheme
    var body: some View {
        if colorScheme == .dark {
            LinearGradient(
                colors: [RCColor.forestTop, RCColor.forestDark, RCColor.forestBot],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()
        } else {
            RCColor.canvas
                .ignoresSafeArea()
        }
    }
}

// MARK: - Previews

private let darkSampleData = WidgetData(
    programSlug: "age_reversal",
    programName: "Female Age Reversal",
    currentDay: 14,
    totalDays: 90,
    cardIndex: 2,
    totalCards: 8,
    streak: 7,
    steps: 4821,
    isDayCompleted: false,
    isSessionLocked: false,
    availabilityLabel: nil,
    updatedAt: ISO8601DateFormatter().string(from: Date())
)

private let lightSampleData = WidgetData(
    programSlug: "ninety_day_transform",
    programName: "90-Day Smoking Reset",
    currentDay: 14,
    totalDays: 90,
    cardIndex: 2,
    totalCards: 8,
    streak: 7,
    steps: 4821,
    isDayCompleted: false,
    isSessionLocked: false,
    availabilityLabel: nil,
    updatedAt: ISO8601DateFormatter().string(from: Date())
)

private let completedSampleData = WidgetData(
    programSlug: "age_reversal",
    programName: "Female Age Reversal",
    currentDay: 14,
    totalDays: 90,
    cardIndex: 7,
    totalCards: 8,
    streak: 7,
    steps: 4821,
    isDayCompleted: true,
    isSessionLocked: false,
    availabilityLabel: nil,
    updatedAt: ISO8601DateFormatter().string(from: Date())
)

struct RecoveryCompassWidget_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            RecoveryCompassWidgetEntryView(entry: RCEntry(date: .now, data: darkSampleData))
                .previewContext(WidgetPreviewContext(family: .systemSmall))
                .previewDisplayName("Small - Dark")

            RecoveryCompassWidgetEntryView(entry: RCEntry(date: .now, data: lightSampleData))
                .previewContext(WidgetPreviewContext(family: .systemSmall))
                .previewDisplayName("Small - Light")

            RecoveryCompassWidgetEntryView(entry: RCEntry(date: .now, data: completedSampleData))
                .previewContext(WidgetPreviewContext(family: .systemSmall))
                .previewDisplayName("Small - Completed")

            RecoveryCompassWidgetEntryView(entry: RCEntry(date: .now, data: .placeholder))
                .previewContext(WidgetPreviewContext(family: .systemSmall))
                .previewDisplayName("Small - Empty")

            RecoveryCompassWidgetEntryView(entry: RCEntry(date: .now, data: darkSampleData))
                .previewContext(WidgetPreviewContext(family: .systemMedium))
                .previewDisplayName("Medium - Dark")

            RecoveryCompassWidgetEntryView(entry: RCEntry(date: .now, data: lightSampleData))
                .previewContext(WidgetPreviewContext(family: .systemMedium))
                .previewDisplayName("Medium - Light")

            RecoveryCompassWidgetEntryView(entry: RCEntry(date: .now, data: completedSampleData))
                .previewContext(WidgetPreviewContext(family: .systemMedium))
                .previewDisplayName("Medium - Completed")

            RecoveryCompassWidgetEntryView(entry: RCEntry(date: .now, data: .placeholder))
                .previewContext(WidgetPreviewContext(family: .systemMedium))
                .previewDisplayName("Medium - Empty")
        }
    }
}
