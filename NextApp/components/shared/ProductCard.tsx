import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width / 2 - 24;

interface Props {
  name: string;
  price: number;
  imageUrl: string;
  gifUrl?: string | null;
  onPress: () => void;
}

export const ProductCard: React.FC<Props> = ({ name, price, imageUrl, gifUrl, onPress }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [gifReady, setGifReady] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    if (!gifUrl) return;
    Image.prefetch(gifUrl).then(() => setGifReady(true)).catch(() => {});
  }, [gifUrl]);

  const currentUri = gifReady && gifUrl ? gifUrl : imageUrl;

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={[styles.container, { borderColor: 'rgba(255,255,255,0.12)' }]}>
      <View style={styles.imageContainer}>
        <BlurView
          intensity={100}
          tint={theme.mode === 'dark' ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={theme.mode === 'dark'
            ? ['rgba(255,150,50,0.18)', 'rgba(30,20,15,0.7)']
            : ['rgba(255,200,120,0.35)', 'rgba(255,247,240,0.85)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['rgba(255,255,255,0.35)', 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.glassBorder, { borderColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)' }]} />

        {!imageLoaded && (
          <View style={styles.placeholder}>
            <ActivityIndicator size="small" color={theme.primary} />
          </View>
        )}
        <Image
          source={{ uri: currentUri }}
          style={[styles.image, { opacity: imageLoaded ? 1 : 0 }]}
          resizeMode="contain"
          onLoad={() => setImageLoaded(true)}
        />
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>{name}</Text>

        <View style={styles.footer}>
          <Text style={[styles.price, { color: theme.primary }]}>от {price} TJS</Text>
          <View style={[styles.addButton, { backgroundColor: theme.primary }]}>
            <Ionicons name="add" size={20} color="white" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    borderRadius: 28,
    padding: 10,
    marginBottom: 20,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    shadowColor: '#ff7000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  imageContainer: {
    width: '100%',
    height: CARD_WIDTH - 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
  },
  glassBorder: {
    ...StyleSheet.absoluteFill,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
  },
  placeholder: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '88%',
    height: '88%',
    zIndex: 2,
  },
  content: {
    paddingHorizontal: 6,
    paddingBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 18,
    minHeight: 36,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 17,
    fontWeight: '900',
  },
  addButton: {
    width: 38,
    height: 38,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ff7000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
});
