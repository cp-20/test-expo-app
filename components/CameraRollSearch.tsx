import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Image, FlatList, Button, Text } from 'react-native';
import * as MediaLib from 'expo-media-library';
import {
  RNMLKitFaceDetectionContextProvider,
  useFaceDetector,
} from '@infinitered/react-native-mlkit-face-detection';
import { Skeleton } from '@/components/Skeleton';

type Photo =
  | {
      type: 'photo';
      uri: string;
      id: string;
    }
  | {
      type: 'skeleton';
      id: string;
    };

export const CameraRollSearch = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [hasNext, setHasNext] = useState(true);
  const [permission, setPermission] = useState<boolean | null>(null);
  const { detectFaces } = useFaceDetector();

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
  const fetching = useRef(false);
  const fetchPhotos = useCallback(async () => {
    const limit = 10;
    const fetchSize = 50;
    const resizeRatio = 10;
    console.log('fetching photos...');

    if (!permission) return;
    if (fetching.current) {
      console.log('fetching already');
      return;
    }
    fetching.current = true;

    try {
      let currentCursor = photos[photos.length - 1]?.id;
      const skeletons: Photo[] = [...Array(limit)].fill(0).map((_, i) => ({
        type: 'skeleton' as const,
        id: `skeleton-${i}-${currentCursor}`,
      }));
      setPhotos((prev) => [...prev, ...skeletons]);
      let skeletonCount = limit;
      while (skeletonCount > 0) {
        const media = await MediaLib.getAssetsAsync({
          mediaType: 'photo',
          first: fetchSize,
          after: currentCursor,
          sortBy: [[MediaLib.SortBy.creationTime, false]],
        });
        currentCursor = media.endCursor;

        const faceDetectionPromises = media.assets.map(async (asset) => {
          const resizedUri = await resizeImage(asset.uri, {
            width: asset.width / resizeRatio,
            height: asset.height / resizeRatio,
          });
          const result = await detectFaces(resizedUri);
          if (result === undefined) return;
          console.log(`Faces detected in ${asset.uri}: ${result.faces.length}`);
          if (result.faces.length === 0) return;

          for (const [i, face] of result.faces.entries()) {
            const angle = {
              x: face.headEulerAngleX,
              y: face.headEulerAngleY,
              z: face.headEulerAngleZ,
            };
            if (angle.x == null || angle.y == null || angle.z == null) continue;
            if (Math.abs(angle.x) > 20) continue;
            if (Math.abs(angle.y) > 20) continue;
            if (Math.abs(angle.z) > 20) continue;

            const croppedUri = await cropImage(asset.uri, {
              origin: {
                x: face.frame.origin.x * resizeRatio,
                y: face.frame.origin.y * resizeRatio,
              },
              size: {
                x: face.frame.size.x * resizeRatio,
                y: face.frame.size.y * resizeRatio,
              },
            });
            const photo = {
              type: 'photo' as const,
              uri: croppedUri,
              id: `${asset.id}-${i}`,
            };
            setPhotos((prev) => {
              const index = prev.findIndex((p) => p.type === 'skeleton');
              if (index === -1) return [...prev, photo];
              return [...prev.slice(0, index), photo, ...prev.slice(index + 1)];
            });
            skeletonCount--;
          }
        });

        await Promise.allSettled(faceDetectionPromises);

        if (!media.hasNextPage) {
          setPhotos((prev) => prev.filter((p) => p.type !== 'skeleton'));
          setHasNext(false);
          break;
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      fetching.current = false;
    }
  }, [detectFaces, permission, photos]);

  useEffect(() => {
    if (photos.length === 0) fetchPhotos();
  }, [fetchPhotos, photos, photos.length]);

  if (permission === null) {
    return <Text>アクセス権を確認中...</Text>;
  }
  if (permission === false) {
    return <Text>カメラロールへのアクセスが拒否されました。</Text>;
  }

  return (
    <RNMLKitFaceDetectionContextProvider>
      <FlatList
        data={photos}
        keyExtractor={(item) => item.id}
        numColumns={3}
        renderItem={({ item }) => (
          <View style={{ margin: 4 }}>
            {item.type === 'skeleton' ? (
              <Skeleton width={100} height={100} />
            ) : (
              <Image
                src={item.uri}
                style={{ width: 100, height: 100, borderRadius: 4 }}
              />
            )}
          </View>
        )}
        style={{ flex: 1 }}
        ListFooterComponent={
          hasNext ? (
            <Button title="もっと読み込む" onPress={fetchPhotos} />
          ) : null
        }
      />
    </RNMLKitFaceDetectionContextProvider>
  );
};

// 画像を縮小する関数
const resizeImage = async (
  uri: string,
  size: { width: number; height: number }
): Promise<string> => {
  const result = await ImageManipulator.manipulate(uri)
    .resize(size)
    .renderAsync();
  const saved = await result.saveAsync({
    compress: 1,
    format: SaveFormat.WEBP,
  });
  return saved.uri;
};

// 画像を切り抜く関数
const cropImage = async (
  uri: string,
  frame: {
    origin: { x: number; y: number };
    size: { x: number; y: number };
  }
): Promise<string> => {
  // ここで画像を切り抜く処理を実装
  // 例: expo-image-manipulatorを使用して画像を切り抜く
  const result = await ImageManipulator.manipulate(uri)
    .crop({
      originX: frame.origin.x,
      originY: frame.origin.y,
      width: frame.size.x,
      height: frame.size.y,
    })
    .renderAsync();
  const saved = await result.saveAsync({
    compress: 1,
    format: SaveFormat.WEBP,
  });
  return saved.uri;
};
