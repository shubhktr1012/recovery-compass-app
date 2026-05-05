/**
 * Shared state to coordinate the preloader → welcome screen transition.
 * Both AppPreloader and WelcomeScreen import this to stay in sync.
 */
let _isFirstLaunch = true;

/** Returns true if the preloader animation has NOT yet completed. */
export function isFirstAppLaunch(): boolean {
  return _isFirstLaunch;
}

/** Called by AppPreloader when its exit animation finishes. */
export function markFirstLaunchComplete(): void {
  _isFirstLaunch = false;
}
