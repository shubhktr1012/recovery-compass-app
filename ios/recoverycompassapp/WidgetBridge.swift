import Foundation
import WidgetKit
import React

@objc(WidgetBridge)
class WidgetBridge: NSObject {
  private let appGroupID = "group.com.recoverycompass.shared"
  private let widgetDataKey = "widget_data"

  @objc
  static func requiresMainQueueSetup() -> Bool {
    true
  }

  @objc
  func reloadAllTimelines() {
    WidgetCenter.shared.reloadAllTimelines()
  }

  @objc(reloadTimelines:)
  func reloadTimelines(kind: NSString) {
    WidgetCenter.shared.reloadTimelines(ofKind: kind as String)
  }

  @objc(readSharedWidgetData:rejecter:)
  func readSharedWidgetData(
    resolve: RCTPromiseResolveBlock,
    reject: RCTPromiseRejectBlock
  ) {
    guard let defaults = UserDefaults(suiteName: appGroupID) else {
      reject("widget_bridge_defaults_unavailable", "App Group defaults unavailable", nil)
      return
    }

    let value = defaults.string(forKey: widgetDataKey)
    resolve(value)
  }
}
