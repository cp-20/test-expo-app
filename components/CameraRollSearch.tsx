import React, { useState, useEffect, FC, useCallback, useRef } from 'react';
import { View, Image, FlatList, Button, Text } from 'react-native';
import * as MediaLib from 'expo-media-library';
import {
  RNMLKitFaceDetectionContextProvider,
  useFaceDetector,
  useFacesInPhoto,
} from '@infinitered/react-native-mlkit-face-detection';
import SkeletonLoading from 'expo-skeleton-loading';
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
    const fetchSize = 10;
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

        for (const asset of media.assets) {
          const result = await detectFaces(asset.uri);
          if (result === undefined) continue;
          console.log(`Faces detected in ${asset.uri}: ${result.faces.length}`);
          if (result.faces.length === 1) {
            setPhotos((prev) => {
              const index = prev.findIndex((p) => p.type === 'skeleton');
              if (index === -1) return prev;
              return [
                ...prev.slice(0, index),
                { type: 'photo', uri: asset.uri, id: asset.id },
                ...prev.slice(index + 1),
              ];
            });
            skeletonCount--;
            if (skeletonCount === 0) break;
          }
        }

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
    const restSkeletons = photos.filter((p) => p.type === 'skeleton').length;
    console.log(`${restSkeletons} more skeletons left`);

    if (photos.length === 0) fetchPhotos();
    if (photos.find((p) => p.type === 'skeleton')) fetchPhotos();
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
