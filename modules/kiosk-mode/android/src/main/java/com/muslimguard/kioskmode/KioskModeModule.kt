package com.muslimguard.kioskmode

import android.app.Activity
import android.app.ActivityManager
import android.content.Context
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class KioskModeModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("KioskMode")

        AsyncFunction("startScreenPinning") {
            val activity = appContext.currentActivity
                ?: return@AsyncFunction false

            try {
                activity.startLockTask()
                true
            } catch (e: Exception) {
                false
            }
        }

        AsyncFunction("stopScreenPinning") {
            val activity = appContext.currentActivity
                ?: return@AsyncFunction false

            try {
                activity.stopLockTask()
                true
            } catch (e: Exception) {
                false
            }
        }

        AsyncFunction("isScreenPinned") {
            val activity = appContext.currentActivity
                ?: return@AsyncFunction false

            try {
                val activityManager = activity.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
                val lockTaskMode = activityManager.lockTaskModeState
                lockTaskMode != ActivityManager.LOCK_TASK_MODE_NONE
            } catch (e: Exception) {
                false
            }
        }
    }
}
