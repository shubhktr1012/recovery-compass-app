//
//  WidgetDataModel.swift
//  RecoveryCompassWidget
//
//  Shared data model read by the widget from the App Group container.
//  The React Native bridge writes JSON matching this shape to:
//  UserDefaults(suiteName: "group.com.recoverycompass.shared")
//  under the key "widget_data"
//

import Foundation

struct WidgetData: Codable {
    let programSlug: String
    let programName: String
    let currentDay: Int
    let totalDays: Int
    let cardIndex: Int       // 0-based index of the current card
    let totalCards: Int
    let streak: Int
    let steps: Int
    let progressDayCount: Int?
    let isDayCompleted: Bool
    let isSessionLocked: Bool?
    let availabilityLabel: String?
    let updatedAt: String    // ISO8601 timestamp

    static let appGroupID = "group.com.recoverycompass.shared"
    static let storageKey = "widget_data"

    // Deep link URL scheme — matches app.json "scheme"
    static let homeURL    = URL(string: "recoverycompassapp://")!
    
    var resumeURL: URL {
        URL(string: "recoverycompassapp://day-detail?dayNumber=\(currentDay)&programSlug=\(programSlug)")!
    }
    
    var journalURL: URL {
        URL(string: "recoverycompassapp:///journal")!
    }

    static func load() -> WidgetData {
        guard
            let defaults = UserDefaults(suiteName: appGroupID),
            let jsonString = defaults.string(forKey: storageKey),
            let jsonData = jsonString.data(using: .utf8),
            let decoded = try? JSONDecoder().decode(WidgetData.self, from: jsonData)
        else {
            print("[WidgetDebug] WidgetData.load -> placeholder")
            return WidgetData.placeholder
        }
        print("[WidgetDebug] WidgetData.load -> data programSlug=\(decoded.programSlug) currentDay=\(decoded.currentDay) progressDayCount=\(decoded.safeProgressDayCount) completed=\(decoded.isDayCompleted) updatedAt=\(decoded.updatedAt)")
        return decoded
    }

    /// True when no real session data has been synced from the app yet.
    var isEmpty: Bool {
        programName.isEmpty || programName == "Recovery Compass"
    }

    var sessionLocked: Bool {
        isSessionLocked ?? false
    }

    var safeProgressDayCount: Int {
        if let progressDayCount {
            return min(max(progressDayCount, 0), max(totalDays, 0))
        }

        if isDayCompleted {
            return min(max(currentDay, 0), max(totalDays, 0))
        }

        return min(max(currentDay - 1, 0), max(totalDays, 0))
    }

    static let placeholder = WidgetData(
        programSlug: "",
        programName: "",
        currentDay: 0,
        totalDays: 0,
        cardIndex: 0,
        totalCards: 0,
        streak: 0,
        steps: 0,
        progressDayCount: 0,
        isDayCompleted: false,
        isSessionLocked: false,
        availabilityLabel: nil,
        updatedAt: ""
    )
}
