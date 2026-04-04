import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import type { Trade } from "@/context/TradeContext";
import { useTrades } from "@/context/TradeContext";
import { useColors } from "@/hooks/useColors";
import { calcCostPerUsdt, formatBDT, formatRate } from "@/utils/calculations";

interface Allocation {
  trade: Trade;
  sellAmount: number;
}

function computeAllocation(trades: Trade[], totalAmount: number): { allocations: Allocation[]; unallocated: number } {
  const openTrades = [...trades]
    .filter((t) => t.status === "open")
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  let remaining = totalAmount;
  const allocations: Allocation[] = [];

  for (const trade of openTrades) {
    if (remaining <= 0.0001) break;
    const soldAlready = trade.sells.reduce((acc, s) => acc + s.sell_amount, 0);
    const available = Math.max(0, trade.usdt_amount - soldAlready);
    if (available <= 0.0001) continue;
    const take = Math.min(remaining, available);
    allocations.push({ trade, sellAmount: take });
    remaining -= take;
  }

  return { allocations, unallocated: Math.max(0, remaining - 0.0001) };
}

export default function SellScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { trades, addGlobalSell, stats } = useTrades();

  const [rate, setRate] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const topPadding = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const rateNum = parseFloat(rate) || 0;
  const amountNum = parseFloat(amount) || 0;

  const { allocations, unallocated } = useMemo(
    () => (amountNum > 0 ? computeAllocation(trades, amountNum) : { allocations: [], unallocated: 0 }),
    [trades, amountNum]
  );

  const totalRevenue = rateNum > 0 ? allocations.reduce((acc, a) => acc + rateNum * a.sellAmount, 0) : 0;
  const totalProfit = rateNum > 0
    ? allocations.reduce((acc, a) => {
        const costPerUsdt = calcCostPerUsdt(a.trade.buy_rate, a.trade.fee_percent);
        return acc + (rateNum - costPerUsdt) * a.sellAmount;
      }, 0)
    : 0;

  const hasEnoughUsdt = amountNum > 0 && unallocated < 0.001;
  const totalAvailable = stats.totalRemainingUsdt;
  const isValid = rateNum > 0 && amountNum > 0 && hasEnoughUsdt;

  async function handleSell() {
    if (!isValid || saving) return;
    setSaving(true);
    try {
      await addGlobalSell(rateNum, amountNum, notes.trim() || undefined);
      try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
      setRate("");
      setAmount("");
      setNotes("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  const openTradeCount = trades.filter((t) => t.status === "open").length;

  return (
    <KeyboardAwareScrollViewCompat
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.scroll,
        {
          paddingTop: topPadding + 16,
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 100,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>বিক্রি করুন</Text>
        <View style={[styles.badge, { backgroundColor: colors.muted }]}>
          <Text style={[styles.badgeText, { color: colors.mutedForeground }]}>
            উপলব্ধ: {totalAvailable.toFixed(4)} USDT
          </Text>
        </View>
      </View>

      {openTradeCount === 0 ? (
        <View style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="inbox" size={32} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            কোনো ওপেন ট্রেড নেই।{"\n"}আগে ট্রেড যোগ করুন।
          </Text>
        </View>
      ) : (
        <>
          {success && (
            <View style={[styles.successBanner, { backgroundColor: colors.success }]}>
              <Feather name="check-circle" size={16} color="#fff" />
              <Text style={styles.successText}>বিক্রি সফলভাবে রেকর্ড হয়েছে!</Text>
            </View>
          )}

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>বিক্রয় রেট (BDT/USDT) *</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.muted, color: colors.foreground }]}
                placeholder="যেমন: 123.50"
                placeholderTextColor={colors.mutedForeground}
                value={rate}
                onChangeText={setRate}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>
                মোট USDT পরিমাণ * (সর্বোচ্চ {totalAvailable.toFixed(4)})
              </Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.muted, color: colors.foreground }]}
                placeholder="যেমন: 100"
                placeholderTextColor={colors.mutedForeground}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
              {amountNum > 0 && unallocated > 0.001 && (
                <Text style={[styles.errorText, { color: colors.destructive }]}>
                  পর্যাপ্ত USDT নেই — {unallocated.toFixed(4)} USDT বেশি চাওয়া হচ্ছে
                </Text>
              )}
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>নোট (ঐচ্ছিক)</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.muted, color: colors.foreground }]}
                placeholder="যেমন: কাস্টমার নাম..."
                placeholderTextColor={colors.mutedForeground}
                value={notes}
                onChangeText={setNotes}
              />
            </View>
          </View>

          {allocations.length > 0 && rateNum > 0 && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                ট্রেড বিতরণ (FIFO)
              </Text>
              {allocations.map((a, i) => {
                const costPerUsdt = calcCostPerUsdt(a.trade.buy_rate, a.trade.fee_percent);
                const profit = (rateNum - costPerUsdt) * a.sellAmount;
                const revenue = rateNum * a.sellAmount;
                const isProfit = profit >= 0;
                return (
                  <View
                    key={a.trade.id}
                    style={[styles.allocationCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <View style={styles.allocationHeader}>
                      <View style={[styles.allocationIdx, { backgroundColor: colors.primary }]}>
                        <Text style={styles.allocationIdxText}>{i + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.allocationTitle, { color: colors.foreground }]}>
                          ট্রেড #{trades.filter((t) => t.status === "open").sort((a, b) => a.created_at.localeCompare(b.created_at)).indexOf(a.trade) + 1}
                        </Text>
                        <Text style={[styles.allocationSub, { color: colors.mutedForeground }]}>
                          ক্রয় রেট: ৳{formatRate(a.trade.buy_rate)}
                        </Text>
                      </View>
                      {a.sellAmount >= (a.trade.usdt_amount - a.trade.sells.reduce((s, x) => s + x.sell_amount, 0) - 0.0001) && (
                        <View style={[styles.closeTag, { backgroundColor: colors.destructive + "22" }]}>
                          <Text style={[styles.closeTagText, { color: colors.destructive }]}>ক্লোজ হবে</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.allocationStats}>
                      <View style={styles.allocStat}>
                        <Text style={[styles.allocStatLabel, { color: colors.mutedForeground }]}>USDT</Text>
                        <Text style={[styles.allocStatValue, { color: colors.foreground }]}>{a.sellAmount.toFixed(4)}</Text>
                      </View>
                      <View style={styles.allocStat}>
                        <Text style={[styles.allocStatLabel, { color: colors.mutedForeground }]}>আয়</Text>
                        <Text style={[styles.allocStatValue, { color: colors.foreground }]}>{formatBDT(revenue)}</Text>
                      </View>
                      <View style={styles.allocStat}>
                        <Text style={[styles.allocStatLabel, { color: colors.mutedForeground }]}>লাভ</Text>
                        <Text style={[styles.allocStatValue, { color: isProfit ? colors.success : colors.destructive }]}>
                          {isProfit ? "+" : ""}{formatBDT(profit)}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}

              <View style={[styles.totalCard, { backgroundColor: colors.primary + "11", borderColor: colors.primary + "44" }]}>
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, { color: colors.foreground }]}>মোট আয়</Text>
                  <Text style={[styles.totalValue, { color: colors.foreground }]}>{formatBDT(totalRevenue)}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, { color: colors.foreground }]}>মোট লাভ</Text>
                  <Text style={[styles.totalValue, { color: totalProfit >= 0 ? colors.success : colors.destructive }]}>
                    {totalProfit >= 0 ? "+" : ""}{formatBDT(totalProfit)}
                  </Text>
                </View>
              </View>
            </>
          )}

          <TouchableOpacity
            style={[
              styles.sellButton,
              { backgroundColor: isValid ? colors.success : colors.muted },
            ]}
            onPress={handleSell}
            disabled={!isValid || saving}
            activeOpacity={0.8}
          >
            <Feather name="dollar-sign" size={18} color={isValid ? "#fff" : colors.mutedForeground} />
            <Text style={[styles.sellButtonText, { color: isValid ? "#fff" : colors.mutedForeground }]}>
              {saving ? "সংরক্ষণ হচ্ছে..." : "বিক্রি নিশ্চিত করুন"}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, gap: 16 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold" },
  badge: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  badgeText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  emptyBox: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    gap: 12,
  },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  successText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 14 },
  field: { gap: 6 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium" },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  errorText: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  allocationCard: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 10 },
  allocationHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  allocationIdx: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  allocationIdxText: { color: "#fff", fontSize: 12, fontFamily: "Inter_700Bold" },
  allocationTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  allocationSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  closeTag: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  closeTagText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  allocationStats: { flexDirection: "row", gap: 8 },
  allocStat: { flex: 1, gap: 2 },
  allocStatLabel: { fontSize: 11, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.5 },
  allocStatValue: { fontSize: 14, fontFamily: "Inter_700Bold" },
  totalCard: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 8 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  totalValue: { fontSize: 16, fontFamily: "Inter_700Bold" },
  sellButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 16,
  },
  sellButtonText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
