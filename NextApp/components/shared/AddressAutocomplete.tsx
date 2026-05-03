import React, { useState, useEffect } from 'react';
import { View, TextInput, FlatList, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import axios from 'axios';
import Colors from '@/constants/Colors';

const DADATA_TOKEN = '76043d839360c7f73919e91316b23a7e584f183c';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const AddressAutocomplete: React.FC<Props> = ({ value, onChange, placeholder }) => {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchSuggestions = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(
        'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address',
        { 
          query,
          locations: [{ country: 'Таджикистан', city: 'Душанбе' }],
          count: 5 
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Token ${DADATA_TOKEN}`,
          },
        }
      );
      setSuggestions(data.suggestions);
      setShowDropdown(true);
    } catch (error) {
      console.error('DaData error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (suggestion: any) => {
    onChange(suggestion.value);
    setShowDropdown(false);
    setSuggestions([]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={(text) => {
            onChange(text);
            fetchSuggestions(text);
          }}
          placeholder={placeholder || "Введите адрес доставки..."}
          placeholderTextColor="#9BA1A6"
        />
        {loading && <ActivityIndicator style={styles.loader} color={Colors.light.primary} />}
      </View>

      {showDropdown && suggestions.length > 0 && (
        <View style={styles.dropdown}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.item} onPress={() => handleSelect(item)}>
                <Text style={styles.itemText}>{item.value}</Text>
              </TouchableOpacity>
            )}
            keyboardShouldPersistTaps="always"
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    zIndex: 1000,
    width: '100%',
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    height: 54,
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#11181C',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  loader: {
    position: 'absolute',
    right: 16,
  },
  dropdown: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxHeight: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  item: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemText: {
    fontSize: 14,
    color: '#11181C',
  },
});
