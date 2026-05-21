package com.recoverycompass.app

import android.view.WindowManager
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class PrivacyProtectionModule(
  reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String = "PrivacyProtection"

  @ReactMethod
  fun setEnabled(enabled: Boolean) {
    currentActivity?.runOnUiThread {
      val window = currentActivity?.window ?: return@runOnUiThread
      if (enabled) {
        window.setFlags(
          WindowManager.LayoutParams.FLAG_SECURE,
          WindowManager.LayoutParams.FLAG_SECURE
        )
      } else {
        window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
      }
    }
  }
}
