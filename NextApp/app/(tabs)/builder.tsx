import React, { useState, useRef, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  PanResponder,
  Animated,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, Theme } from "@/hooks/useTheme";
import { gradients, motion } from "@/constants/Colors";
import {
  LiquidGlassCard,
  LiquidGlassPill,
  SpringPress,
  AmbientBackdrop,
} from "@/components/ui";
import { useCartStore } from "@/store/useCartStore";
import { BASE_URL } from "@/constants/Api";
import { useFocusEffect } from "expo-router";

const { width: SW, height: SH } = Dimensions.get("window");

// Pizza diameter on screen
const PIZZA_SIZE = Math.min(SW * 0.72, 300);
const PIZZA_RADIUS = PIZZA_SIZE / 2;

// Topping scatter positions (relative 0-1 within pizza circle)
const SCATTER: { cx: number; cy: number; rotate: number; scale: number }[] = [
  { cx: 0.48, cy: 0.28, rotate: 15, scale: 0.55 },
  { cx: 0.66, cy: 0.38, rotate: -20, scale: 0.5 },
  { cx: 0.7, cy: 0.58, rotate: 35, scale: 0.52 },
  { cx: 0.48, cy: 0.68, rotate: -15, scale: 0.48 },
  { cx: 0.28, cy: 0.58, rotate: 5, scale: 0.5 },
  { cx: 0.24, cy: 0.36, rotate: -20, scale: 0.48 },
  { cx: 0.6, cy: 0.2, rotate: 30, scale: 0.45 },
  { cx: 0.76, cy: 0.48, rotate: -5, scale: 0.5 },
  { cx: 0.36, cy: 0.74, rotate: 18, scale: 0.48 },
  { cx: 0.18, cy: 0.48, rotate: -12, scale: 0.45 },
  { cx: 0.34, cy: 0.18, rotate: 8, scale: 0.5 },
  { cx: 0.58, cy: 0.76, rotate: -25, scale: 0.45 },
];

interface Ingredient {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
}
interface Pizza {
  id: number;
  name: string;
  imageUrl: string;
  items: any[];
  ingredients: Ingredient[];
}

// CSS dough base rendered as SVG-like gradients via View layers
const DoughBase = ({ size }: { size: number }) => (
  <View
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      overflow: "hidden",
    }}
  >
    {/* Crust ring */}
    <View
      style={[
        StyleSheet.absoluteFill,
        { borderRadius: size / 2, backgroundColor: "#8b4513" },
      ]}
    />
    {/* Inner dough */}
    <View
      style={{
        position: "absolute",
        top: size * 0.08,
        left: size * 0.08,
        right: size * 0.08,
        bottom: size * 0.08,
        borderRadius: size / 2,
        backgroundColor: "#f5d070",
      }}
    />
    {/* Highlight */}
    <View
      style={{
        position: "absolute",
        top: size * 0.12,
        left: size * 0.12,
        width: size * 0.35,
        height: size * 0.35,
        borderRadius: size / 2,
        backgroundColor: "rgba(255,255,255,0.22)",
      }}
    />
  </View>
);

// Draggable ingredient card
interface DragCardProps {
  ingredient: Ingredient;
  isAdded: boolean;
  onTap: () => void;
  onDropOnPizza: () => void;
  pizzaLayout: { x: number; y: number; size: number } | null;
  theme: Theme;
}

const DragCard: React.FC<DragCardProps> = ({
  ingredient,
  isAdded,
  onTap,
  onDropOnPizza,
  pizzaLayout,
  theme,
}) => {
  const dragAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const movedEnough = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 5 || Math.abs(gs.dy) > 5,

      onPanResponderGrant: (e) => {
        startPos.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
        movedEnough.current = false;
        isDragging.current = false;
        dragAnim.setValue({ x: 0, y: 0 });
      },

      onPanResponderMove: (_, gs) => {
        const dist = Math.hypot(gs.dx, gs.dy);
        if (dist > 8) {
          movedEnough.current = true;
          if (!isDragging.current) {
            isDragging.current = true;
            Animated.spring(scaleAnim, {
              toValue: 1.15,
              useNativeDriver: true,
              ...motion.springSnappy,
            }).start();
            Animated.timing(opacityAnim, {
              toValue: 0.5,
              duration: 150,
              useNativeDriver: true,
            }).start();
          }
          dragAnim.setValue({ x: gs.dx, y: gs.dy });
        }
      },

      onPanResponderRelease: (e, gs) => {
        const wasDrag = movedEnough.current;
        isDragging.current = false;
        movedEnough.current = false;

        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          ...motion.spring,
        }).start();
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start();
        Animated.spring(dragAnim, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: true,
          ...motion.spring,
        }).start();

        if (wasDrag && pizzaLayout) {
          const dropX = e.nativeEvent.pageX;
          const dropY = e.nativeEvent.pageY;
          const cx = pizzaLayout.x + pizzaLayout.size / 2;
          const cy = pizzaLayout.y + pizzaLayout.size / 2;
          const r = pizzaLayout.size / 2;
          if (Math.hypot(dropX - cx, dropY - cy) <= r) {
            onDropOnPizza();
            return;
          }
        }
        if (!wasDrag) onTap();
      },
      onPanResponderTerminate: () => {
        isDragging.current = false;
        movedEnough.current = false;
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          ...motion.spring,
        }).start();
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start();
        Animated.spring(dragAnim, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: true,
          ...motion.spring,
        }).start();
      },
    }),
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        {
          transform: [
            ...dragAnim.getTranslateTransform(),
            { scale: scaleAnim },
          ],
          opacity: opacityAnim,
          zIndex: 10,
        },
      ]}
    >
      <View
        style={[
          styles.ingCard,
          {
            backgroundColor: isAdded ? theme.primarySoft : theme.surface,
            borderColor: isAdded ? theme.primary : theme.border,
          },
        ]}
      >
        <Ionicons
          name="reorder-two-outline"
          size={14}
          color={theme.textSubtle}
          style={{ marginRight: 4 }}
        />
        <Image source={{ uri: ingredient.imageUrl }} style={styles.ingImg} />
        <View style={{ flex: 1 }}>
          <Text
            style={[styles.ingName, { color: theme.text }]}
            numberOfLines={1}
          >
            {ingredient.name}
          </Text>
          <Text style={[styles.ingPrice, { color: theme.textMuted }]}>
            +{ingredient.price} TJS
          </Text>
        </View>
        {isAdded && (
          <View style={[styles.ingCheck, { backgroundColor: theme.primary }]}>
            <Ionicons name="checkmark" size={12} color="#fff" />
          </View>
        )}
      </View>
    </Animated.View>
  );
};

// Main screen
export default function BuilderScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const grad = theme.mode === "dark" ? gradients.dark : gradients.light;

  const [pizzas, setPizzas] = useState<Pizza[]>([]);
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBase, setSelectedBase] = useState(0); // 0 = blank dough
  const [dropped, setDropped] = useState<number[]>([]);
  const [addingToCart, setAddingToCart] = useState(false);
  const pizzaViewRef = useRef<View>(null);
  const [pizzaLayout, setPizzaLayout] = useState<{
    x: number;
    y: number;
    size: number;
  } | null>(null);

  const addItem = useCartStore((s) => s.addItem);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      Promise.all([
        fetch(`${BASE_URL}/api/products?categoryId=1`)
          .then((r) => r.json())
          .catch(() => []),
        fetch(`${BASE_URL}/api/ingredients`)
          .then((r) => r.json())
          .catch(() => []),
      ]).then(([prods, ings]) => {
        if (!active) return;
        // filter only pizza category
        const pizzaProds = Array.isArray(prods)
          ? prods
              .flatMap((cat: any) => cat.products ?? [cat])
              .filter((p: any) => p.items?.length)
          : [];
        setPizzas(pizzaProds);
        setAllIngredients(Array.isArray(ings) ? ings : []);
        setLoading(false);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  // All bases: blank dough + real pizzas
  const bases = useMemo(
    () => [
      {
        id: -1,
        name: "Пустое тесто",
        imageUrl: "",
        isBlank: true,
        items: pizzas[0]?.items ?? [],
      },
      ...pizzas.map((p) => ({ ...p, isBlank: false })),
    ],
    [pizzas],
  );

  const currentBase = bases[selectedBase] ?? bases[0];
  const baseItems = currentBase?.items ?? [];
  const cheapestItem =
    baseItems.find((it: any) => it.size === 30) ?? baseItems[0];

  const basePrice = cheapestItem?.price ?? 0;
  const extraPrice = dropped.reduce((sum, id) => {
    const ing = allIngredients.find((i) => i.id === id);
    return sum + (ing?.price ?? 0);
  }, 0);
  const totalPrice = basePrice + extraPrice;

  const measurePizza = () => {
    pizzaViewRef.current?.measureInWindow((x, y, w, h) => {
      setPizzaLayout({ x, y, size: w });
    });
  };

  const addIngredient = (id: number) => {
    setDropped((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleAddToCart = async () => {
    if (!cheapestItem) {
      Alert.alert("Нет доступных вариантов");
      return;
    }
    setAddingToCart(true);
    try {
      await addItem(cheapestItem.id, dropped);
      Alert.alert("Добавлено", "Пицца добавлена в корзину!");
      setDropped([]);
    } catch {
      Alert.alert("Ошибка", "Не удалось добавить в корзину");
    } finally {
      setAddingToCart(false);
    }
  };

  const styles = useMemo(() => makeStyles(theme), [theme]);

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <AmbientBackdrop />
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textMuted }]}>
          Загружаем конструктор…
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AmbientBackdrop />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>
            Собери пиццу
          </Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Нажми или перетащи ингредиент на пиццу
          </Text>
        </View>

        {/* Pizza canvas */}
        <View style={styles.canvasWrap}>
          <View
            ref={pizzaViewRef}
            onLayout={measurePizza}
            style={[
              styles.pizzaCircle,
              {
                width: PIZZA_SIZE,
                height: PIZZA_SIZE,
                borderRadius: PIZZA_RADIUS,
              },
            ]}
          >
            {currentBase.isBlank ? (
              <DoughBase size={PIZZA_SIZE} />
            ) : (
              <Image
                source={{ uri: currentBase.imageUrl }}
                style={{
                  width: PIZZA_SIZE,
                  height: PIZZA_SIZE,
                  borderRadius: PIZZA_RADIUS,
                }}
              />
            )}
            {/* Vignette */}
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  borderRadius: PIZZA_RADIUS,
                  backgroundColor: "rgba(0,0,0,0.12)",
                },
              ]}
              pointerEvents="none"
            />
            {/* Toppings */}
            {dropped.map((id, idx) => {
              const ing = allIngredients.find((i) => i.id === id);
              if (!ing) return null;
              const pos = SCATTER[idx % SCATTER.length];
              const imgSize = PIZZA_SIZE * pos.scale;
              return (
                <TouchableOpacity
                  key={id}
                  onPress={() => setDropped((p) => p.filter((i) => i !== id))}
                  style={{
                    position: "absolute",
                    left: PIZZA_SIZE * pos.cx - imgSize / 2,
                    top: PIZZA_SIZE * pos.cy - imgSize / 2,
                    transform: [{ rotate: `${pos.rotate}deg` }],
                  }}
                >
                  <Image
                    source={{ uri: ing.imageUrl }}
                    style={{ width: imgSize, height: imgSize }}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              );
            })}
          </View>
          {dropped.length === 0 && (
            <Text style={[styles.hint, { color: theme.textSubtle }]}>
              Перетащи ингредиент сюда
            </Text>
          )}
        </View>

        {/* Base selector */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Основа
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingVertical: 4 }}
          >
            {bases.map((base, idx) => (
              <SpringPress
                key={base.id}
                onPress={() => {
                  setSelectedBase(idx);
                  setDropped([]);
                }}
                scaleTo={0.93}
              >
                <View
                  style={[
                    styles.baseCard,
                    {
                      borderColor:
                        idx === selectedBase ? theme.primary : theme.border,
                      backgroundColor: theme.surface,
                    },
                  ]}
                >
                  {base.isBlank ? (
                    <View
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 26,
                        backgroundColor: "#f5d070",
                        borderWidth: 2,
                        borderColor: "#c08820",
                      }}
                    />
                  ) : (
                    <Image
                      source={{ uri: base.imageUrl }}
                      style={{ width: 52, height: 52, borderRadius: 26 }}
                      resizeMode="contain"
                    />
                  )}
                  <Text
                    style={[styles.baseName, { color: theme.textMuted }]}
                    numberOfLines={2}
                  >
                    {base.name}
                  </Text>
                </View>
              </SpringPress>
            ))}
          </ScrollView>
        </View>

        {/* Ingredients */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Ингредиенты
          </Text>
          <View style={styles.ingList}>
            {allIngredients.map((ing) => (
              <DragCard
                key={ing.id}
                ingredient={ing}
                isAdded={dropped.includes(ing.id)}
                onTap={() => addIngredient(ing.id)}
                onDropOnPizza={() => {
                  if (!dropped.includes(ing.id))
                    setDropped((p) => [...p, ing.id]);
                }}
                pizzaLayout={pizzaLayout}
                theme={theme}
              />
            ))}
          </View>
        </View>

        {/* Price + CTA */}
        <View style={[styles.footer, { backgroundColor: theme.surface }]}>
          <View>
            <Text style={[styles.footerLabel, { color: theme.textMuted }]}>
              {dropped.length > 0
                ? `${dropped.length} ингр.`
                : "Без ингредиентов"}
            </Text>
            <Text style={[styles.footerPrice, { color: theme.primary }]}>
              {totalPrice} TJS
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleAddToCart}
            disabled={addingToCart || !cheapestItem}
            style={{ opacity: addingToCart || !cheapestItem ? 0.6 : 1 }}
          >
            <LinearGradient
              colors={grad.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cartBtn}
            >
              {addingToCart ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="cart" size={20} color="#fff" />
                  <Text style={styles.cartBtnText}>В корзину</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1 },
    scroll: { paddingBottom: 120 },
    loadingText: { marginTop: 12, fontSize: 15, fontWeight: "600" },
    header: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 8 },
    title: { fontSize: 30, fontWeight: "900", letterSpacing: -0.8 },
    subtitle: { fontSize: 13, marginTop: 4, fontWeight: "500" },
    canvasWrap: {
      alignItems: "center",
      paddingVertical: 24,
      position: "relative",
    },
    pizzaCircle: {
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.4,
      shadowRadius: 24,
      elevation: 12,
    },
    hint: { marginTop: 10, fontSize: 12, fontWeight: "600" },
    section: { paddingHorizontal: 18, marginBottom: 20 },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "900",
      marginBottom: 12,
      letterSpacing: -0.3,
    },
    baseCard: {
      alignItems: "center",
      gap: 6,
      padding: 10,
      borderRadius: 20,
      borderWidth: 2,
      minWidth: 80,
    },
    baseName: {
      fontSize: 10,
      fontWeight: "700",
      textAlign: "center",
      maxWidth: 72,
    },
    ingList: { gap: 8 },
    ingCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 12,
      borderRadius: 18,
      borderWidth: 1.5,
    },
    ingImg: { width: 48, height: 48, borderRadius: 8 },
    ingName: { fontSize: 14, fontWeight: "700" },
    ingPrice: { fontSize: 12, marginTop: 2 },
    ingCheck: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
    },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginHorizontal: 18,
      padding: 16,
      borderRadius: 24,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    footerLabel: { fontSize: 12, fontWeight: "600" },
    footerPrice: { fontSize: 24, fontWeight: "900", letterSpacing: -0.5 },
    cartBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 22,
      height: 52,
      borderRadius: 22,
      shadowColor: "#ff7000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 6,
    },
    cartBtnText: { color: "#fff", fontSize: 15, fontWeight: "900" },
  });
