import AsyncStorage from '@react-native-async-storage/async-storage';

const PROMPT_DISMISSED_KEY_PREFIX = 'rc_step_permission_prompt_dismissed';

export function getStepPermissionPromptDismissedKey(userId: string) {
  return `${PROMPT_DISMISSED_KEY_PREFIX}:${userId}`;
}

export async function readStepPermissionPromptDismissed(userId: string) {
  const value = await AsyncStorage.getItem(getStepPermissionPromptDismissedKey(userId));
  return value === '1';
}

export async function markStepPermissionPromptDismissed(userId: string) {
  await AsyncStorage.setItem(getStepPermissionPromptDismissedKey(userId), '1');
}
