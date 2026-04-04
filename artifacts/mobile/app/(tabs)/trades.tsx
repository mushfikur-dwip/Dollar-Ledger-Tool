import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TradeCard } from "@/components/TradeCard";
import type { Trade } from "@/context/TradeContext";
import { useTrades } from "@/context/TradeContext";
import { useColors } from "@/hooks/useColors";

type Filter = "all" | "open" | "closed";

export default function TradesScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { trades, isLoading } = useTrades();
  const [filter, setFilter] = useState<Filter>("all");

  const filtered: Trade[] =
    filter === "all"
      ? trades
      : trades.filter((t) => t.status === filter);

  const topPadding =
    Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "open", label: "Open" },
    { key: "closed", label: "Closed" },
  ];

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.topBar,
          {
            paddingTop: topPadding + 16,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>
          Trades
        </Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/add-trade")}
          activeOpacity={0.8}
          testID="add-trade-btn-trades"
        >
          <Feather name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.filterRow,
          { backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.filterTab,
              filter === f.key && {
                borderBottomColor: colors.primary,
                borderBottomWidth: 2,
              },
            ]}
            onPress={() => setFilter(f.key)}
          >
            <Text
              style={[
                styles.filterText,
                {
                  color:
                    filter === f.key ? colors.primary : colors.mutedForeground,
                  fontFamily:
                    filter === f.key ? "Inter_600SemiBold" : "Inter_400Regular",
                },
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather
            name="inbox"
            size={48}
            color={colors.mutedForeground}
          />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            {filter === "all"
              ? "No trades yet"
              : filter === "open"
              ? "No open trades"
              : "No closed trades"}
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            {filter === "all"
              ? "Add a trade to get started"
              : "Change the filter to see other trades"}
          </Text>
          {filter === "all" ? (
            <TouchableOpacity
              style={[styles.emptyAddBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/add-trade")}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyAddBtnText}>Add First Trade</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TradeCard trade={item} />}
          contentContainerStyle={[
            styles.list,
            {
              paddingBottom:
                insets.bottom + (Platform.OS === "web" ? 34 : 0) + 100,
            },
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  screenTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  filterTab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 4,
  },
  filterText: {
    fontSize: 14,
  },
  list: {
    padding: 20,
    gap: 0,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  emptyAddBtn: {
    marginTop: 16,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 13,
  },
  emptyAddBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
});
