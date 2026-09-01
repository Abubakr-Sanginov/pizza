import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet, ActivityIndicator, type ImageStyle, type StyleProp, type ImageResizeMode } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

interface Props {
  uri: string;
  gifUri?: string | null;
  style?: StyleProp<ImageStyle>;
  resizeMode?: ImageResizeMode;
}

export const BlurImage: React.FC<Props> = ({ uri, gifUri, style, resizeMode = 'contain' }) => {
  const [loaded, setLoaded] = useState(false);
  const [gifReady, setGifReady] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    if (!gifUri) return;
    Image.prefetch(gifUri).then(() => setGifReady(true)).catch(() => {});
  }, [gifUri]);

  const currentUri = gifReady && gifUri ? gifUri : uri;

  return (
    <View style={styles.container}>
      {!loaded && (
        <View style={[styles.placeholder, style, { backgroundColor: theme.surfaceMuted }]}>
          <ActivityIndicator size="small" color={theme.primary} />
        </View>
      )}
      <Image
        source={{ uri: currentUri }}
        style={[style, { opacity: loaded ? 1 : 0 }]}
        resizeMode={resizeMode}
        onLoad={() => setLoaded(true)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  placeholder: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
