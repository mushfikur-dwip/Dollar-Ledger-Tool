import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ProfitTargetTable } from "@/components/ProfitTargetTable";
import { useTrades } from "@/context/TradeContext";
import { useColors } from "@/hooks/useColors";
import {
  calcBuyCost,
  calcClosedProfit,
  calcClosedProfitPercent,
  calcCostPerUsdt,
  formatBDT,
  formatDate,
  formatRate,
  formatTime,
} from "@/utils/calculations";

export default function TradeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { trades, closeTrade, deleteTrade } = useTrades();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const trade = trades.find((t) => t.id === id);
  const [customSellRate, setCustomSellRate] = useState("");
  const [showCloseForm, setShowCloseForm] = useState(false);
  const [closeSellRate, setCloseSellRate] = useState("");
  const [closeAmount, setCloseAmount] = useState("");
  const [closing, setClosing] = useState(false);

  if (!trade) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground }}>Trade not found.</Text>
      </View>
    );
  }

  const isOpen = trade.status === "open";
  const buyCost = calcBuyCost(
    trade.usdt_amount,
    trade.buy_rate,
    trade.fee_percent
  );
  const costPerUsdt = calcCostPerUsdt(trade.buy_rate, trade.fee_percent);
  const customRate = parseFloat(customSellRate) || 0;
  const profit = calcClosedProfit(trade);
  const profitPct = calcClosedProfitPercent(trade);

  async function handleDelete() {
    Alert.alert(
      "Delete Trade",
      "Are you sure you want to delete this trade?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteTrade(trade.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            router.back();
          },
        },
      ]
    );
  }

  async function handleClose() {
    const sellRateNum = parseFloat(closeSellRate);
    const amountNum = parseFloat(closeAmount);
    if (!sellRateNum || sellRateNum <= 0) {
      Alert.alert("Error", "Please enter a valid sell rate.");
      return;
    }
    if (!amountNum || amountNum <= 0 || amountNum > trade.usdt_amount) {
      Alert.alert(
        "Error",
        `Please enter a valid USDT amount (max ${trade.usdt_amount}).`
      );
      return;
    }
    setClosing(true);
    try {
      await closeTrade(trade.id, sellRateNum, amountNum);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Alert.alert("Error", "Could not close trade.");
    } finally {
      setClosing(false);
    }
  }

  const profitColor =
    profit > 0
      ? colors.success
      : profit < 0
      ? colors.destructive
      : colors.mutedForeground;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.scroll,
          {
            paddingBottom:
              insets.bottom + (Platform.OS === "web" ? 34 : 0) + 24,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.cardHeader}>
            <View>
              <Text style={[styles.usdtAmount, { color: colors.foreground }]}>
                {trade.usdt_amount.toFixed(4)} USDT
              </Text>
              <Text style={[styles.cardDate, { color: colors.mutedForeground }]}>
                {formatDate(trade.created_at)} at {formatTime(trade.created_at)}
              </Text>
            </View>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: isOpen ? colors.secondary : colors.muted,
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  {
                    color: isOpen ? colors.primary : colors.mutedForeground,
                  },
                ]}
              >
                {isOpen ? "OPEN" : "CLOSED"}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.detailGrid}>
            <DetailRow label="Buy Rate" value={`৳${formatRate(trade.buy_rate)}`} colors={colors} />
            <DetailRow label="Fee" value={`${trade.fee_percent}%`} colors={colors} />
            <DetailRow label="Cost/USDT" value={`৳${formatRate(costPerUsdt)}`} colors={colors} />
            <DetailRow label="Total Cost" value={formatBDT(buyCost)} colors={colors} />
          </View>

          {!isOpen && trade.sell_rate && trade.sell_amount ? (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.detailGrid}>
                <DetailRow
                  label="Sold USDT"
                  value={`${trade.sell_amount.toFixed(4)}`}
                  colors={colors}
                />
                <DetailRow
                  label="Sell Rate"
                  value={`৳${formatRate(trade.sell_rate)}`}
                  colors={colors}
                />
                <DetailRow
                  label="Closed"
                  value={
                    trade.closed_at
                      ? `${formatDate(trade.closed_at)}`
                      : "-"
                  }
                  colors={colors}
                />
                <View style={styles.profitHighlight}>
                  <Text style={[styles.profitLabel, { color: colors.mutedForeground }]}>
                    Net Profit
                  </Text>
                  <Text style={[styles.profitValue, { color: profitColor }]}>
                    {profit >= 0 ? "+" : "-"}
                    {formatBDT(Math.abs(profit))} ({profitPct >= 0 ? "+" : ""}
                    {profitPct.toFixed(2)}%)
                  </Text>
                </View>
              </View>
            </>
          ) : null}

          {trade.notes ? (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <Text style={[styles.notes, { color: colors.mutedForeground }]}>
                {trade.notes}
              </Text>
            </>
          ) : null}
        </View>

        {isOpen ? (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Profit Targets
            </Text>
            <ProfitTargetTable
              buy_rate={trade.buy_rate}
              fee_percent={trade.fee_percent}
              usdt_amount={trade.usdt_amount}
              customSellRate={customRate}
            />

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>
                Custom Sell Rate (BDT/USDT)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.muted,
                    color: colors.foreground,
                  },
                ]}
                placeholder="Enter rate to see profit..."
                placeholderTextColor={colors.mutedForeground}
                value={customSellRate}
                onChangeText={setCustomSellRate}
                keyboardType="decimal-pad"
                testID="custom-sell-rate-input"
              />
            </View>

            {!showCloseForm ? (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.success }]}
                onPress={() => setShowCloseForm(true)}
                activeOpacity={0.8}
                testID="close-trade-button"
              >
                <Feather name="check-circle" size={18} color="#fff" />
                <Text style={styles.actionButtonText}>Close Trade</Text>
              </TouchableOpacity>
            ) : (
              <View
                style={[
                  styles.closeForm,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Text
                  style={[styles.closeFormTitle, { color: colors.foreground }]}
                >
                  Close Trade
                </Text>
                <View style={styles.field}>
                  <Text style={[styles.label, { color: colors.mutedForeground }]}>
                    Actual Sell Rate (BDT/USDT) *
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        borderColor: colors.border,
                        backgroundColor: colors.muted,
                        color: colors.foreground,
                      },
                    ]}
                    placeholder="e.g. 122.50"
                    placeholderTextColor={colors.mutedForeground}
                    value={closeSellRate}
                    onChangeText={setCloseSellRate}
                    keyboardType="decimal-pad"
                    testID="close-sell-rate-input"
                  />
                </View>
                <View style={styles.field}>
                  <Text style={[styles.label, { color: colors.mutedForeground }]}>
                    USDT Amount Sold *
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        borderColor: colors.border,
                        backgroundColor: colors.muted,
                        color: colors.foreground,
                      },
                    ]}
                    placeholder={`Max ${trade.usdt_amount}`}
                    placeholderTextColor={colors.mutedForeground}
                    value={closeAmount}
                    onChangeText={setCloseAmount}
                    keyboardType="decimal-pad"
                    testID="close-amount-input"
                  />
                </View>
                {parseFloat(closeSellRate) > 0 &&
                parseFloat(closeAmount) > 0 ? (
                  <ClosePreview
                    trade={trade}
                    sellRate={parseFloat(closeSellRate)}
                    amount={parseFloat(closeAmount)}
                    colors={colors}
                  />
                ) : null}
                <View style={styles.closeButtons}>
                  <TouchableOpacity
                    style={[styles.cancelBtn, { borderColor: colors.border }]}
                    onPress={() => setShowCloseForm(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.cancelBtnText, { color: colors.mutedForeground }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmBtn, { backgroundColor: colors.success }]}
                    onPress={handleClose}
                    disabled={closing}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.confirmBtnText}>
                      {closing ? "Saving..." : "Confirm"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        ) : null}

        <TouchableOpacity
          style={[styles.deleteButton, { borderColor: colors.destructive }]}
          onPress={handleDelete}
          activeOpacity={0.7}
          testID="delete-trade-button"
        >
          <Feather name="trash-2" size={16} color={colors.destructive} />
          <Text style={[styles.deleteButtonText, { color: colors.destructive }]}>
            Delete Trade
          </Text>
        </TouchableOpacity>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

function ClosePreview({
  trade,
  sellRate,
  amount,
  colors,
}: {
  trade: { buy_rate: number; fee_percent: number };
  sellRate: number;
  amount: number;
  colors: ReturnType<typeof useColors>;
}) {
  const costPerUsdt = calcCostPerUsdt(trade.buy_rate, trade.fee_percent);
  const cost = costPerUsdt * amount;
  const revenue = sellRate * amount;
  const profit = revenue - cost;
  const profitPct = cost > 0 ? (profit / cost) * 100 : 0;
  const isPositive = profit >= 0;
  const color = isPositive ? colors.success : colors.destructive;

  return (
    <View
      style={[
        styles.previewBox,
        { backgroundColor: colors.muted, borderColor: colors.border },
      ]}
    >
      <View style={styles.previewRow}>
        <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>
          Revenue
        </Text>
        <Text style={[styles.previewValue, { color: colors.foreground }]}>
          {formatBDT(revenue)}
        </Text>
      </View>
      <View style={styles.previewRow}>
        <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>
          Profit
        </Text>
        <Text style={[styles.previewValue, { color }]}>
          {isPositive ? "+" : "-"}
          {formatBDT(Math.abs(profit))} ({profitPct >= 0 ? "+" : ""}
          {profitPct.toFixed(2)}%)
        </Text>
      </View>
    </View>
  );
}

function DetailRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <Text style={[styles.detailValue, { color: colors.foreground }]}>
        {value}
      </Text>
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
  scroll: {
    padding: 20,
    gap: 16,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  usdtAmount: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  cardDate: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  detailGrid: {
    gap: 10,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  detailValue: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  profitHighlight: {
    gap: 2,
  },
  profitLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  profitValue: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  notes: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  actionButton: {
    flexDirection: "row",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  closeForm: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  closeFormTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  previewBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  previewLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  previewValue: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  closeButtons: {
    flexDirection: "row",
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 13,
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  confirmBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  confirmBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  deleteButton: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
});
