import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width / 2 - 24;

interface Props {
  name: string;
  price: number;
  imageUrl: string;
  onPress: () => void;
}

export const ProductCard: React.FC<Props> = ({ name, price, imageUrl, onPress }) => {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.container}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="contain" />
      </View>
      
      <View style={styles.content}>
        <Text numberOfLines={2} style={styles.title}>{name}</Text>
        
        <View style={styles.footer}>
          <Text style={styles.price}>от {price} TJS</Text>
          <View style={styles.addButton}>
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
    backgroundColor: 'white',
    borderRadius: 35,
    padding: 10,
    marginBottom: 20,
    shadowColor: '#ff7000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.12,
    shadowRadius: 25,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  imageContainer: {
    width: '100%',
    height: CARD_WIDTH - 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#fff7f0',
    borderRadius: 30,
    overflow: 'hidden',
  },
  image: {
    width: '90%',
    height: '90%',
  },
  content: {
    paddingHorizontal: 6,
    paddingBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '900',
    color: '#11181C',
    lineHeight: 18,
    height: 36,
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
    color: '#ff7000',
  },
  addButton: {
    backgroundColor: '#ff7000',
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
