import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '@/constants/theme';
import { useProfile } from '@/providers/profile';
import { useAuth } from '@/providers/auth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface EditProfileSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EditProfileSheet({ isOpen, onClose }: EditProfileSheetProps) {
  const { profile, updateProfile, uploadAvatar } = useProfile();
  const { user } = useAuth();
  const bottomSheetRef = useRef<BottomSheet>(null);

  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [avatarUri, setAvatarUri] = useState<string | null>(profile?.avatar_url ?? null);
  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDisplayName(profile?.display_name ?? '');
      setAvatarUri(profile?.avatar_url ?? null);
      setPendingImageUri(null);
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isOpen, profile?.display_name, profile?.avatar_url]);

  const handleSheetChange = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose]
  );

  const pickImage = async () => {
    const hasImagePickerNativeModule = Boolean(
      requireOptionalNativeModule('ExponentImagePicker')
    );

    if (!hasImagePickerNativeModule) {
      Alert.alert(
        'Profile photo unavailable',
        'Photo upload needs a fresh native iOS build before it can work in this simulator.'
      );
      return;
    }

    try {
      const ImagePicker = await import('expo-image-picker');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setPendingImageUri(uri);
        setAvatarUri(uri);
      }
    } catch (error: any) {
      Alert.alert(
        'Profile photo unavailable',
        'We could not open your photo library right now. Please try again.'
      );
    }
  };

  const handleSave = async () => {
    Keyboard.dismiss();
    setIsSaving(true);

    try {
      if (pendingImageUri) {
        await uploadAvatar(pendingImageUri);
      }

      const trimmedName = displayName.trim();
      if (trimmedName !== (profile?.display_name ?? '')) {
        await updateProfile({ display_name: trimmedName || null });
      }

      onClose();
    } catch (error: any) {
      Alert.alert('Save failed', error?.message ?? 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    displayName.trim() !== (profile?.display_name ?? '') ||
    pendingImageUri !== null;

  const currentAvatarDisplay = avatarUri;
  const emailPrefix = user?.email?.split('@')[0] ?? '';

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={['70%']}
      enablePanDownToClose
      onChange={handleSheetChange}
      backgroundStyle={{ backgroundColor: AppColors.surface, borderRadius: 28 }}
      handleIndicatorStyle={{ backgroundColor: 'rgba(5, 41, 12, 0.2)', width: 40 }}
      style={{
        shadowColor: AppColors.black,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 12,
      }}
    >
      <BottomSheetView className="flex-1 px-6 pt-2 pb-8">
        <Text className="font-erode-bold text-2xl text-forest mb-6 text-center">
          Edit Profile
        </Text>

        {/* Avatar */}
        <TouchableOpacity
          onPress={pickImage}
          className="self-center mb-6"
          activeOpacity={0.8}
        >
          <View className="w-24 h-24 rounded-full overflow-hidden bg-sage items-center justify-center border-2 border-forest/10">
            {currentAvatarDisplay ? (
              <Image
                source={{ uri: currentAvatarDisplay }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <Text className="font-erode-bold text-3xl text-forest/40">
                {emailPrefix.charAt(0).toUpperCase() || '?'}
              </Text>
            )}
          </View>
          <View className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-forest items-center justify-center border-2 border-surface">
            <Ionicons name="camera-outline" size={16} color={AppColors.white} />
          </View>
        </TouchableOpacity>

        {/* Display Name */}
        <Input
          label="Display Name"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Enter your name"
          autoCapitalize="words"
          returnKeyType="done"
          onSubmitEditing={Keyboard.dismiss}
        />

        {/* Email (read-only) */}
        <View className="mt-4">
          <Text className="text-forest font-satoshi font-medium text-sm ml-1 mb-1">
            Email
          </Text>
          <View className="bg-gray-100 border border-gray-200 rounded-2xl px-4 py-3.5">
            <Text className="font-satoshi text-base text-gray-500">
              {user?.email ?? 'No email'}
            </Text>
          </View>
        </View>

        {/* Save Button */}
        <View className="mt-8">
          <Button
            label={isSaving ? 'Saving…' : 'Save'}
            variant="primary"
            size="lg"
            onPress={() => void handleSave()}
            disabled={!hasChanges || isSaving}
            loading={isSaving}
          />
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}
