import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SummaryCard } from "@/components/SummaryCard";
import { TradeCard } from "@/components/TradeCard";
import { useTrades } from "@/context/TradeContext";
import { useColors } from "@/hooks/useColors";
import { formatBDT } from "@/utils/calculations";

export default function DashboardScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { trades, stats, isLoading } = useTrades();

  const openTrades = trades.filter((t) => t.status === "open").slice(0, 5);
  const recentClosed = trades
    .filter((t) => t.status === "closed")
    .sort((a, b) => {
      const aTime = a.closed_at ?? a.created_at;
      const bTime = b.closed_at ?? b.created_at;
      return bTime.localeCompare(aTime);
    })
    .slice(0, 3);

  const topPadding =
    Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.scroll,
        {
          paddingTop: topPadding + 16,
          paddingBottom:
            insets.bottom + (Platform.OS === "web" ? 34 : 0) + 100,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
            P2P Dollar Tracker
          </Text>
          <Text style={[styles.dateText, { color: colors.foreground }]}>
            {new Date().toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/add-trade")}
            activeOpacity={0.8}
            testID="add-trade-fab"
          >
            <Feather name="plus" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
        PORTFOLIO
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardRow}
      >
        <SummaryCard
          title="বাকি USDT"
          value={`${stats.totalRemainingUsdt.toFixed(2)}`}
          subtitle="USDT"
          valueColor={colors.primary}
        />
        <SummaryCard
          title="Invested"
          value={formatBDT(stats.totalInvestedBdt)}
          subtitle="BDT"
        />
        <SummaryCard
          title="Open Trades"
          value={`${stats.openTrades}`}
          subtitle={`of ${stats.totalTrades} total`}
        />
      </ScrollView>

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
        PROFIT
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardRow}
      >
        <SummaryCard
          title="Today"
          value={
            (stats.todayProfit >= 0 ? "+" : "") + formatBDT(stats.todayProfit)
          }
          subtitle="BDT"
          valueColor={
            stats.todayProfit > 0
              ? colors.success
              : stats.todayProfit < 0
              ? colors.destructive
              : colors.foreground
          }
        />
        <SummaryCard
          title="This Month"
          value={
            (stats.monthProfit >= 0 ? "+" : "") +
            formatBDT(stats.monthProfit)
          }
          subtitle="BDT"
          valueColor={
            stats.monthProfit > 0
              ? colors.success
              : stats.monthProfit < 0
              ? colors.destructive
              : colors.foreground
          }
        />
        <SummaryCard
          title="All Time"
          value={
            (stats.allTimeProfit >= 0 ? "+" : "") +
            formatBDT(stats.allTimeProfit)
          }
          subtitle="BDT"
          valueColor={
            stats.allTimeProfit > 0
              ? colors.success
              : stats.allTimeProfit < 0
              ? colors.destructive
              : colors.foreground
          }
        />
      </ScrollView>

      <View style={styles.openHeader}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          OPEN TRADES
        </Text>
        <TouchableOpacity onPress={() => router.push("/(tabs)/trades")}>
          <Text style={[styles.viewAll, { color: colors.primary }]}>
            View All
          </Text>
        </TouchableOpacity>
      </View>

      {openTrades.length === 0 ? (
        <View
          style={[
            styles.emptyBox,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Feather name="trending-up" size={32} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            No open trades
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Tap + to add your first trade
          </Text>
        </View>
      ) : (
        <FlatList
          data={openTrades}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TradeCard trade={item} />}
          scrollEnabled={false}
        />
      )}

      {recentClosed.length > 0 && (
        <>
          <View style={styles.openHeader}>
            <Text
              style={[styles.sectionLabel, { color: colors.mutedForeground }]}
            >
              RECENTLY CLOSED
            </Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/trades")}>
              <Text style={[styles.viewAll, { color: colors.primary }]}>
                View All
              </Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={recentClosed}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <TradeCard trade={item} />}
            scrollEnabled={false}
          />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  greeting: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  dateText: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  cardRow: {
    gap: 12,
    paddingRight: 20,
  },
  openHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  viewAll: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  emptyBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 32,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
