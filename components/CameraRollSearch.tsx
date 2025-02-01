import React, { useState, useEffect, FC } from 'react';
import { View, Image, FlatList, Button, Text } from 'react-native';
import * as MediaLib from 'expo-media-library';
import {
  RNMLKitFaceDetectionContextProvider,
  useFacesInPhoto,
} from '@infinitered/react-native-mlkit-face-detection';

export const CameraRollSearch = () => {
  const [photos, setPhotos] = useState<MediaLib.Asset[]>([]);
  const [permission, setPermission] = useState<boolean>(false);

  // アクセス許可の取得
  useEffect(() => {
    (async () => {
      const { status } = await MediaLib.requestPermissionsAsync(false, [
        'photo',
      ]);
      setPermission(status === MediaLib.PermissionStatus.GRANTED);
    })();
  }, []);

  // カメラロールから画像を取得
  const fetchPhotos = async () => {
    if (!permission) return;
    const media = await MediaLib.getAssetsAsync({
      mediaType: 'photo',
      first: 10, // 取得する画像の枚数（変更可能）
      sortBy: [[MediaLib.SortBy.creationTime, false]],
    });

    setPhotos(media.assets);
  };

  if (permission === null) {
    return <Text>アクセス権を確認中...</Text>;
  }
  if (permission === false) {
    return <Text>カメラロールへのアクセスが拒否されました。</Text>;
  }

  return (
    <RNMLKitFaceDetectionContextProvider>
      <View style={{ flex: 1, padding: 20 }}>
        <Button title="写真を取得" onPress={fetchPhotos} />
        <FlatList
          data={photos}
          keyExtractor={(item) => item.id}
          numColumns={3}
          renderItem={({ item }) => (
            <View style={{ margin: 5 }}>
              <CameraImageWithDetection uri={item.uri} />
            </View>
          )}
        />
      </View>
    </RNMLKitFaceDetectionContextProvider>
  );
};

const CameraImageWithDetection: FC<{ uri: string }> = ({ uri }) => {
  const { faces, error, status } = useFacesInPhoto(uri);

  if (error) {
    return <Text>Error: {error}</Text>;
  }

  return (
    <View>
      <Image source={{ uri: uri }} style={{ width: 100, height: 100 }} />
      {status === 'detecting' ? (
        <Text>検出中...</Text>
      ) : faces.length > 0 ? (
        <Text style={{ color: 'green' }}>顔あり</Text>
      ) : (
        <Text style={{ color: 'red' }}>顔なし</Text>
      )}
    </View>
  );
};
