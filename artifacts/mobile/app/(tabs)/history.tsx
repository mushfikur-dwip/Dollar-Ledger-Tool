import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  ScrollView,
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
import {
  calcBuyCost,
  calcClosedProfit,
  formatBDT,
  formatDate,
  formatMonth,
  groupTradesByDate,
  groupTradesByMonth,
} from "@/utils/calculations";

type HistoryTab = "daily" | "monthly";

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { trades } = useTrades();
  const [tab, setTab] = useState<HistoryTab>("daily");

  const topPadding =
    Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

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
          History
        </Text>
        <View
          style={[
            styles.tabSwitch,
            { backgroundColor: colors.muted },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.tabSwitchBtn,
              tab === "daily" && { backgroundColor: colors.card },
            ]}
            onPress={() => setTab("daily")}
          >
            <Text
              style={[
                styles.tabSwitchText,
                {
                  color:
                    tab === "daily" ? colors.foreground : colors.mutedForeground,
                  fontFamily:
                    tab === "daily"
                      ? "Inter_600SemiBold"
                      : "Inter_400Regular",
                },
              ]}
            >
              Daily
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabSwitchBtn,
              tab === "monthly" && { backgroundColor: colors.card },
            ]}
            onPress={() => setTab("monthly")}
          >
            <Text
              style={[
                styles.tabSwitchText,
                {
                  color:
                    tab === "monthly"
                      ? colors.foreground
                      : colors.mutedForeground,
                  fontFamily:
                    tab === "monthly"
                      ? "Inter_600SemiBold"
                      : "Inter_400Regular",
                },
              ]}
            >
              Monthly
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {tab === "daily" ? (
        <DailyView trades={trades} colors={colors} insets={insets} />
      ) : (
        <MonthlyView trades={trades} colors={colors} insets={insets} />
      )}
    </View>
  );
}

function DailyView({
  trades,
  colors,
  insets,
}: {
  trades: Trade[];
  colors: ReturnType<typeof useColors>;
  insets: { bottom: number };
}) {
  const groups = useMemo(() => groupTradesByDate(trades), [trades]);
  const dates = useMemo(
    () => Object.keys(groups).sort((a, b) => b.localeCompare(a)),
    [groups]
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const activeDate = selectedDate ?? dates[0] ?? null;

  if (dates.length === 0) {
    return <EmptyState colors={colors} message="No trade history yet." />;
  }

  const dayTrades = activeDate ? groups[activeDate] ?? [] : [];
  const totalProfit = dayTrades.reduce(
    (acc, t) => acc + calcClosedProfit(t),
    0
  );
  const totalInvested = dayTrades.reduce(
    (acc, t) => acc + calcBuyCost(t.usdt_amount, t.buy_rate, t.fee_percent),
    0
  );
  const totalUsdt = dayTrades.reduce((acc, t) => acc + t.usdt_amount, 0);
  const closedCount = dayTrades.filter((t) => t.status === "closed").length;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.datePicker}
      >
        {dates.map((date) => {
          const isSelected = date === activeDate;
          return (
            <TouchableOpacity
              key={date}
              style={[
                styles.dateChip,
                {
                  backgroundColor: isSelected
                    ? colors.primary
                    : colors.card,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setSelectedDate(date)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dateChipText,
                  {
                    color: isSelected ? "#fff" : colors.foreground,
                    fontFamily: isSelected
                      ? "Inter_600SemiBold"
                      : "Inter_400Regular",
                  },
                ]}
              >
                {formatDate(date + "T00:00:00")}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {activeDate ? (
        <ScrollView
          contentContainerStyle={[
            styles.listContent,
            {
              paddingBottom:
                insets.bottom + (Platform.OS === "web" ? 34 : 0) + 100,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[styles.dayTotals, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={[styles.dayTotalsTitle, { color: colors.foreground }]}>
              {formatDate(activeDate + "T00:00:00")} · {dayTrades.length}{" "}
              {dayTrades.length === 1 ? "trade" : "trades"}
            </Text>
            <View style={styles.dayTotalsRow}>
              <View style={styles.dayTotalItem}>
                <Text style={[styles.dayTotalLabel, { color: colors.mutedForeground }]}>
                  USDT Volume
                </Text>
                <Text style={[styles.dayTotalValue, { color: colors.foreground }]}>
                  {totalUsdt.toFixed(2)}
                </Text>
              </View>
              <View style={styles.dayTotalItem}>
                <Text style={[styles.dayTotalLabel, { color: colors.mutedForeground }]}>
                  Invested (BDT)
                </Text>
                <Text style={[styles.dayTotalValue, { color: colors.foreground }]}>
                  {formatBDT(totalInvested)}
                </Text>
              </View>
              {closedCount > 0 && (
                <View style={styles.dayTotalItem}>
                  <Text style={[styles.dayTotalLabel, { color: colors.mutedForeground }]}>
                    Profit (BDT)
                  </Text>
                  <Text
                    style={[
                      styles.dayTotalValue,
                      {
                        color:
                          totalProfit > 0
                            ? colors.success
                            : totalProfit < 0
                            ? colors.destructive
                            : colors.mutedForeground,
                      },
                    ]}
                  >
                    {totalProfit >= 0 ? "+" : ""}
                    {formatBDT(totalProfit)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.dayTrades}>
            {dayTrades.map((t) => (
              <TradeCard key={t.id} trade={t} />
            ))}
          </View>
        </ScrollView>
      ) : null}
    </View>
  );
}

function MonthlyView({
  trades,
  colors,
  insets,
}: {
  trades: Trade[];
  colors: ReturnType<typeof useColors>;
  insets: { bottom: number };
}) {
  const groups = useMemo(() => groupTradesByMonth(trades), [trades]);
  const months = Object.keys(groups).sort((a, b) => b.localeCompare(a));
  const [expanded, setExpanded] = useState<string | null>(
    months[0] ?? null
  );

  if (months.length === 0) {
    return <EmptyState colors={colors} message="No trade history yet." />;
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.listContent,
        {
          paddingBottom:
            insets.bottom + (Platform.OS === "web" ? 34 : 0) + 100,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {months.map((month) => {
        const monthTrades = groups[month];
        const totalProfit = monthTrades.reduce(
          (acc, t) => acc + calcClosedProfit(t),
          0
        );
        const totalInvested = monthTrades.reduce(
          (acc, t) =>
            acc + calcBuyCost(t.usdt_amount, t.buy_rate, t.fee_percent),
          0
        );
        const totalUsdt = monthTrades.reduce(
          (acc, t) => acc + t.usdt_amount,
          0
        );
        const closedCount = monthTrades.filter(
          (t) => t.status === "closed"
        ).length;
        const isExpanded = expanded === month;

        return (
          <View key={month}>
            <TouchableOpacity
              style={[
                styles.monthHeader,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
              onPress={() =>
                setExpanded(isExpanded ? null : month)
              }
              activeOpacity={0.7}
            >
              <View style={styles.monthLeft}>
                <Text
                  style={[styles.monthName, { color: colors.foreground }]}
                >
                  {formatMonth(month)}
                </Text>
                <Text
                  style={[styles.monthStat, { color: colors.mutedForeground }]}
                >
                  {monthTrades.length} trades · {totalUsdt.toFixed(2)} USDT
                </Text>
                <Text
                  style={[styles.monthStat, { color: colors.mutedForeground }]}
                >
                  Invested: {formatBDT(totalInvested)}
                </Text>
              </View>
              <View style={styles.monthRight}>
                {closedCount > 0 ? (
                  <Text
                    style={[
                      styles.monthProfit,
                      {
                        color:
                          totalProfit > 0
                            ? colors.success
                            : totalProfit < 0
                            ? colors.destructive
                            : colors.mutedForeground,
                      },
                    ]}
                  >
                    {totalProfit >= 0 ? "+" : ""}
                    {formatBDT(totalProfit)}
                  </Text>
                ) : null}
                <Feather
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={colors.mutedForeground}
                />
              </View>
            </TouchableOpacity>
            {isExpanded ? (
              <View style={styles.monthTrades}>
                {monthTrades.map((t) => (
                  <TradeCard key={t.id} trade={t} />
                ))}
              </View>
            ) : null}
          </View>
        );
      })}
    </ScrollView>
  );
}

function EmptyState({
  colors,
  message,
}: {
  colors: ReturnType<typeof useColors>;
  message: string;
}) {
  return (
    <View style={styles.emptyContainer}>
      <Feather name="clock" size={48} color={colors.mutedForeground} />
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
        {message}
      </Text>
      <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
        Add trades to see your history here
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  tabSwitch: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 2,
  },
  tabSwitchBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  tabSwitchText: {
    fontSize: 13,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 8,
  },
  groupHeader: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  groupDate: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  groupStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
  },
  groupStat: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  groupProfit: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  dayTrades: {
    gap: 0,
    marginBottom: 12,
  },
  datePicker: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
  },
  dateChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  dateChipText: {
    fontSize: 13,
  },
  dayTotals: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    gap: 10,
  },
  dayTotalsTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  dayTotalsRow: {
    flexDirection: "row",
    gap: 16,
    flexWrap: "wrap",
  },
  dayTotalItem: {
    gap: 2,
  },
  dayTotalLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dayTotalValue: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  monthHeader: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  monthLeft: {
    flex: 1,
    gap: 2,
  },
  monthName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  monthStat: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  monthRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  monthProfit: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  monthTrades: {
    marginTop: 8,
    marginBottom: 8,
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
});
