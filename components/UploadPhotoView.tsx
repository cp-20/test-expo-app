import { useState, useCallback, FC } from 'react';
import { StyleSheet, Alert, View, Text, Image, Button } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { putImage } from '@/lib/uploadFile';

export const UploadPhotoView: FC = () => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploadedImageUri, setUploadedImageUri] = useState<string | null>(null);

  const pickImageLibrary = useCallback(async () => {
    const mediaLibrary =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (mediaLibrary.status !== 'granted') {
      Alert.alert('memoirアプリのカメラのアクセス許可をONにしてください');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: false,
      allowsMultipleSelection: false,
      aspect: [1, 1],
      quality: 1,
      base64: true,
      exif: true,
    });

    if (
      result.canceled ||
      result.assets === null ||
      result.assets.length === 0
    ) {
      return;
    }

    const asset = result.assets[0];
    setImageUri(asset.uri);
    console.log('uploading', asset.uri);

    const file = new File([asset.base64 as string], asset.uri);
    const uploaded = await putImage(
      file,
      asset.mimeType ?? 'image/jpeg',
      'profile.jpeg'
    );
    setUploadedImageUri(uploaded);
    console.log('uploaded', uploaded);
  }, []);

  return (
    <View style={styles.container}>
      {imageUri && (
        <Image src={imageUri} width={256} height={256} style={styles.image} />
      )}
      <Button onPress={pickImageLibrary} title="写真を変更" />
      {uploadedImageUri && <Text>{uploadedImageUri}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  image: {
    width: 256,
    height: 256,
  },
});
