import { FC, useEffect, useRef } from 'react';
import { StyleSheet, Animated, useColorScheme } from 'react-native';

export type SkeletonProps = {
  width: number;
  height: number;
};

export const Skeleton: FC<SkeletonProps> = ({ width, height }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;
  const colorScheme = useColorScheme();

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  const skeletonStyle = [
    styles.skeleton,
    colorScheme === 'dark' ? darkModeStyles.skeleton : {},
    { width, height, opacity },
  ];

  return <Animated.View style={skeletonStyle} />;
};

const styles = StyleSheet.create({
  skeleton: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#f1f1f1',
    borderRadius: 4,
  },
});

const darkModeStyles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#333',
  },
});
