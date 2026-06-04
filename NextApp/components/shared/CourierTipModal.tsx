import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, Theme } from '@/hooks/useTheme';
import axios from 'axios';
import { API_URL } from '@/constants/Api';

interface CourierTipModalProps {
  visible: boolean;
  orderId: number;
  onClose: () => void;
  onSuccess?: () => void;
}

const TIP_PRESETS = [
  { label: '5%', percent: 5 },
  { label: '10%', percent: 10 },
  { label: '15%', percent: 15 },
];

export const CourierTipModal: React.FC<CourierTipModalProps> = ({
  visible,
  orderId,
  onClose,
  onSuccess,
}) => {
  const theme = useTheme();
  const styles = makeStyles(theme);

  const [orderAmount, setOrderAmount] = useState(0);
  const [selectedPercent, setSelectedPercent] = useState<number | null>(10);
  const [customAmount, setCustomAmount] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (visible && orderId) {
      fetchOrderAmount();
    }
  }, [visible, orderId]);

  const fetchOrderAmount = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/orders/${orderId}`);
      setOrderAmount(data.totalAmount || 0);
    } catch (error) {
      console.error('Failed to fetch order:', error);
    }
  };

  const calculateTip = () => {
    if (customAmount) {
      return Number(customAmount) || 0;
    }
    if (selectedPercent && orderAmount) {
      return Math.round((orderAmount * selectedPercent) / 100);
    }
    return 0;
  };

  const handleSubmit = async () => {
    const tipAmount = calculateTip();
    if (tipAmount <= 0) return;

    setLoading(true);
    try {
      await axios.post(`${API_URL}/orders/${orderId}/tip`, {
        amount: tipAmount,
        rating,
        comment: comment.trim() || null,
      });
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to add tip:', error);
      alert('Не удалось добавить чаевые');
    } finally {
      setLoading(false);
    }
  };

  const tipAmount = calculateTip();

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.surface }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>
              Оцените курьера
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.ratingSection}>
            <Text style={[styles.label, { color: theme.text }]}>
              Как прошла доставка?
            </Text>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  style={styles.starBtn}
                >
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={36}
                    color={star <= rating ? '#fbbf24' : theme.border}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.tipSection}>
            <Text style={[styles.label, { color: theme.text }]}>
              Оставить чаевые
            </Text>
            <View style={styles.presets}>
              {TIP_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset.percent}
                  onPress={() => {
                    setSelectedPercent(preset.percent);
                    setCustomAmount('');
                  }}
                  style={[
                    styles.presetBtn,
                    {
                      backgroundColor:
                        selectedPercent === preset.percent && !customAmount
                          ? theme.primary
                          : theme.background,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.presetText,
                      {
                        color:
                          selectedPercent === preset.percent && !customAmount
                            ? '#fff'
                            : theme.text,
                      },
                    ]}
                  >
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.customRow}>
              <Text style={[styles.customLabel, { color: theme.textMuted }]}>
                Своя сумма:
              </Text>
              <TextInput
                value={customAmount}
                onChangeText={(text) => {
                  setCustomAmount(text.replace(/[^0-9]/g, ''));
                  setSelectedPercent(null);
                }}
                placeholder="0"
                placeholderTextColor={theme.textMuted}
                keyboardType="numeric"
                style={[
                  styles.customInput,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
              />
              <Text style={[styles.currency, { color: theme.textMuted }]}>
                TJS
              </Text>
            </View>

            {tipAmount > 0 && (
              <Text style={[styles.tipPreview, { color: theme.primary }]}>
                Чаевые: {tipAmount} TJS
              </Text>
            )}
          </View>

          <View style={styles.commentSection}>
            <Text style={[styles.label, { color: theme.text }]}>
              Комментарий (необязательно)
            </Text>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Отличная доставка!"
              placeholderTextColor={theme.textMuted}
              multiline
              maxLength={200}
              style={[
                styles.commentInput,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
            />
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading || tipAmount <= 0}
            style={[
              styles.submitBtn,
              {
                backgroundColor:
                  loading || tipAmount <= 0 ? theme.border : theme.primary,
              },
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>
                Отправить {tipAmount > 0 ? `${tipAmount} TJS` : ''}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={styles.skipBtn}>
            <Text style={[styles.skipText, { color: theme.textMuted }]}>
              Пропустить
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    container: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      paddingBottom: 40,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    title: {
      fontSize: 20,
      fontWeight: '900',
      letterSpacing: -0.5,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ratingSection: {
      marginBottom: 24,
    },
    label: {
      fontSize: 14,
      fontWeight: '700',
      marginBottom: 12,
    },
    stars: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    starBtn: {
      padding: 4,
    },
    tipSection: {
      marginBottom: 24,
    },
    presets: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 16,
    },
    presetBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: 'center',
    },
    presetText: {
      fontSize: 14,
      fontWeight: '700',
    },
    customRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    customLabel: {
      fontSize: 13,
      fontWeight: '600',
    },
    customInput: {
      flex: 1,
      height: 44,
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: 12,
      fontSize: 15,
      fontWeight: '600',
    },
    currency: {
      fontSize: 13,
      fontWeight: '600',
    },
    tipPreview: {
      fontSize: 16,
      fontWeight: '800',
      textAlign: 'center',
      marginTop: 12,
    },
    commentSection: {
      marginBottom: 24,
    },
    commentInput: {
      height: 80,
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingTop: 12,
      fontSize: 14,
      textAlignVertical: 'top',
    },
    submitBtn: {
      height: 52,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    submitText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '800',
    },
    skipBtn: {
      alignItems: 'center',
      paddingVertical: 8,
    },
    skipText: {
      fontSize: 14,
      fontWeight: '600',
    },
  });
