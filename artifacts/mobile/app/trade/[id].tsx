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
import type { SellRecord } from "@/context/TradeContext";
import { useTrades } from "@/context/TradeContext";
import { useColors } from "@/hooks/useColors";
import {
  calcAvgSellRate,
  calcBuyCost,
  calcClosedProfit,
  calcClosedProfitPercent,
  calcCostPerUsdt,
  calcRemainingUsdt,
  calcSellProfit,
  calcSellRevenue,
  calcSoldUsdt,
  formatBDT,
  formatDate,
  formatRate,
  formatTime,
} from "@/utils/calculations";

export default function TradeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { trades, addSell, deleteSell, deleteTrade } = useTrades();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const trade = trades.find((t) => t.id === id);
  const [customSellRate, setCustomSellRate] = useState("");
  const [showSellForm, setShowSellForm] = useState(false);
  const [sellRate, setSellRate] = useState("");
  const [sellAmount, setSellAmount] = useState("");
  const [sellNotes, setSellNotes] = useState("");
  const [saving, setSaving] = useState(false);

  if (!trade) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground }}>Trade not found.</Text>
      </View>
    );
  }

  const tradeId = trade.id;
  const tradeMaxUsdt = trade.usdt_amount;
  const isOpen = trade.status === "open";
  const buyCost = calcBuyCost(trade.usdt_amount, trade.buy_rate, trade.fee_percent);
  const costPerUsdt = calcCostPerUsdt(trade.buy_rate, trade.fee_percent);
  const customRate = parseFloat(customSellRate) || 0;
  const soldUsdt = calcSoldUsdt(trade);
  const remainingUsdt = calcRemainingUsdt(trade);
  const totalRevenue = calcSellRevenue(trade);
  const totalProfit = calcClosedProfit(trade);
  const totalProfitPct = calcClosedProfitPercent(trade);
  const avgSellRate = calcAvgSellRate(trade);

  const sellRateNum = parseFloat(sellRate) || 0;
  const sellAmountNum = parseFloat(sellAmount) || 0;
  const previewRevenue = sellRateNum * sellAmountNum;
  const previewProfit =
    sellRateNum > 0 && sellAmountNum > 0
      ? previewRevenue - costPerUsdt * sellAmountNum
      : 0;

  async function handleAddSell() {
    if (!sellRateNum || sellRateNum <= 0) {
      Alert.alert("Error", "Please enter a valid sell rate.");
      return;
    }
    if (!sellAmountNum || sellAmountNum <= 0 || sellAmountNum > remainingUsdt + 0.0001) {
      Alert.alert(
        "Error",
        `Please enter a valid USDT amount (max ${remainingUsdt.toFixed(4)}).`
      );
      return;
    }
    setSaving(true);
    try {
      await addSell(tradeId, sellRateNum, sellAmountNum, sellNotes.trim() || undefined);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSellRate("");
      setSellAmount("");
      setSellNotes("");
      setShowSellForm(false);
    } catch {
      Alert.alert("Error", "Could not record sale.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSell(sell: SellRecord) {
    Alert.alert("Delete Sale", "Remove this sale record?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteSell(tradeId, sell.id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        },
      },
    ]);
  }

  async function handleDeleteTrade() {
    Alert.alert(
      "Delete Trade",
      "Are you sure you want to delete this trade?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteTrade(tradeId);
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            } catch {}
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(tabs)/trades");
            }
          },
        },
      ]
    );
  }

  const profitColor =
    totalProfit > 0
      ? colors.success
      : totalProfit < 0
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
                {tradeMaxUsdt.toFixed(4)} USDT
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

          {isOpen && (
            <View
              style={[
                styles.remainingBox,
                { backgroundColor: colors.secondary, borderColor: colors.primary + "33" },
              ]}
            >
              <View style={styles.remainingRow}>
                <View style={styles.remainingItem}>
                  <Text style={[styles.remainingLabel, { color: colors.mutedForeground }]}>
                    বাকি আছে
                  </Text>
                  <Text style={[styles.remainingValue, { color: colors.primary }]}>
                    {remainingUsdt.toFixed(4)} USDT
                  </Text>
                </View>
                <View style={styles.remainingItem}>
                  <Text style={[styles.remainingLabel, { color: colors.mutedForeground }]}>
                    বিক্রি হয়েছে
                  </Text>
                  <Text style={[styles.remainingValue, { color: colors.foreground }]}>
                    {soldUsdt.toFixed(4)} USDT
                  </Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.detailGrid}>
            {trade.total_bdt != null && (
              <DetailRow
                label="Binance Payment"
                value={formatBDT(trade.total_bdt)}
                colors={colors}
              />
            )}
            {trade.banking_charge != null && trade.banking_charge > 0 && (
              <DetailRow
                label="Banking Charge"
                value={formatBDT(trade.banking_charge)}
                colors={colors}
              />
            )}
            <DetailRow label="Buy Rate" value={`৳${formatRate(trade.buy_rate)}`} colors={colors} />
            {trade.fee_percent > 0 && (
              <DetailRow label="Binance Fee" value={`${trade.fee_percent}%`} colors={colors} />
            )}
            <DetailRow label="Cost/USDT" value={`৳${formatRate(costPerUsdt)}`} colors={colors} />
            <DetailRow label="Total Cost" value={formatBDT(buyCost)} colors={colors} />
          </View>

          {trade.sells.length > 0 && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <Text style={[styles.subSectionTitle, { color: colors.mutedForeground }]}>
                বিক্রির সারসংক্ষেপ
              </Text>
              <View style={styles.detailGrid}>
                <DetailRow
                  label="মোট বিক্রি (USDT)"
                  value={`${soldUsdt.toFixed(4)}`}
                  colors={colors}
                />
                <DetailRow
                  label="মোট আয়"
                  value={formatBDT(totalRevenue)}
                  colors={colors}
                />
                {trade.sells.length > 1 && (
                  <DetailRow
                    label="গড় সেল রেট"
                    value={`৳${formatRate(avgSellRate)}`}
                    colors={colors}
                  />
                )}
              </View>
              <View style={styles.profitHighlight}>
                <Text style={[styles.profitLabel, { color: colors.mutedForeground }]}>
                  মোট লাভ
                </Text>
                <Text style={[styles.profitValue, { color: profitColor }]}>
                  {totalProfit >= 0 ? "+" : "-"}
                  {formatBDT(Math.abs(totalProfit))} ({totalProfitPct >= 0 ? "+" : ""}
                  {totalProfitPct.toFixed(2)}%)
                </Text>
              </View>
            </>
          )}

          {trade.notes ? (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <Text style={[styles.notes, { color: colors.mutedForeground }]}>
                {trade.notes}
              </Text>
            </>
          ) : null}
        </View>

        {isOpen && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Profit Targets
            </Text>
            <ProfitTargetTable
              buy_rate={trade.buy_rate}
              fee_percent={trade.fee_percent}
              usdt_amount={remainingUsdt > 0 ? remainingUsdt : tradeMaxUsdt}
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
              />
            </View>
          </>
        )}

        {trade.sells.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              বিক্রির তালিকা
            </Text>
            {trade.sells.map((sell, idx) => {
              const sellProfit = calcSellProfit(sell, trade.buy_rate, trade.fee_percent);
              const isPositive = sellProfit >= 0;
              return (
                <View
                  key={sell.id}
                  style={[
                    styles.sellCard,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.sellCardHeader}>
                    <Text style={[styles.sellCardIdx, { color: colors.mutedForeground }]}>
                      বিক্রি #{idx + 1}
                    </Text>
                    <Text style={[styles.sellCardDate, { color: colors.mutedForeground }]}>
                      {formatDate(sell.sold_at)} {formatTime(sell.sold_at)}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleDeleteSell(sell)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Feather name="trash-2" size={14} color={colors.destructive} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.sellCardRow}>
                    <View style={styles.sellStat}>
                      <Text style={[styles.sellStatLabel, { color: colors.mutedForeground }]}>
                        USDT
                      </Text>
                      <Text style={[styles.sellStatValue, { color: colors.foreground }]}>
                        {sell.sell_amount.toFixed(4)}
                      </Text>
                    </View>
                    <View style={styles.sellStat}>
                      <Text style={[styles.sellStatLabel, { color: colors.mutedForeground }]}>
                        রেট
                      </Text>
                      <Text style={[styles.sellStatValue, { color: colors.foreground }]}>
                        ৳{formatRate(sell.sell_rate)}
                      </Text>
                    </View>
                    <View style={styles.sellStat}>
                      <Text style={[styles.sellStatLabel, { color: colors.mutedForeground }]}>
                        আয়
                      </Text>
                      <Text style={[styles.sellStatValue, { color: colors.foreground }]}>
                        {formatBDT(sell.sell_rate * sell.sell_amount)}
                      </Text>
                    </View>
                    <View style={styles.sellStat}>
                      <Text style={[styles.sellStatLabel, { color: colors.mutedForeground }]}>
                        লাভ
                      </Text>
                      <Text
                        style={[
                          styles.sellStatValue,
                          {
                            color: isPositive ? colors.success : colors.destructive,
                          },
                        ]}
                      >
                        {isPositive ? "+" : ""}
                        {formatBDT(sellProfit)}
                      </Text>
                    </View>
                  </View>
                  {sell.notes ? (
                    <Text style={[styles.sellNotes, { color: colors.mutedForeground }]}>
                      {sell.notes}
                    </Text>
                  ) : null}
                </View>
              );
            })}
          </>
        )}

        {isOpen && (
          <>
            {!showSellForm ? (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.success }]}
                onPress={() => setShowSellForm(true)}
                activeOpacity={0.8}
              >
                <Feather name="plus-circle" size={18} color="#fff" />
                <Text style={styles.actionButtonText}>
                  নতুন বিক্রি রেকর্ড করুন
                </Text>
              </TouchableOpacity>
            ) : (
              <View
                style={[
                  styles.sellForm,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.sellFormTitle, { color: colors.foreground }]}>
                  বিক্রি রেকর্ড ({remainingUsdt.toFixed(4)} USDT বাকি)
                </Text>

                <View style={styles.field}>
                  <Text style={[styles.label, { color: colors.mutedForeground }]}>
                    Sell Rate (BDT/USDT) *
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
                    placeholder="e.g. 123.50"
                    placeholderTextColor={colors.mutedForeground}
                    value={sellRate}
                    onChangeText={setSellRate}
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={styles.field}>
                  <Text style={[styles.label, { color: colors.mutedForeground }]}>
                    USDT Amount *
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
                    placeholder={`Max ${remainingUsdt.toFixed(4)}`}
                    placeholderTextColor={colors.mutedForeground}
                    value={sellAmount}
                    onChangeText={setSellAmount}
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={styles.field}>
                  <Text style={[styles.label, { color: colors.mutedForeground }]}>
                    Notes (optional)
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
                    placeholder="e.g. Customer name..."
                    placeholderTextColor={colors.mutedForeground}
                    value={sellNotes}
                    onChangeText={setSellNotes}
                  />
                </View>

                {sellRateNum > 0 && sellAmountNum > 0 && (
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
                        {formatBDT(previewRevenue)}
                      </Text>
                    </View>
                    <View style={styles.previewRow}>
                      <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>
                        Profit
                      </Text>
                      <Text
                        style={[
                          styles.previewValue,
                          {
                            color:
                              previewProfit >= 0
                                ? colors.success
                                : colors.destructive,
                          },
                        ]}
                      >
                        {previewProfit >= 0 ? "+" : ""}
                        {formatBDT(previewProfit)}
                      </Text>
                    </View>
                  </View>
                )}

                <View style={styles.sellFormButtons}>
                  <TouchableOpacity
                    style={[styles.cancelBtn, { borderColor: colors.border }]}
                    onPress={() => {
                      setShowSellForm(false);
                      setSellRate("");
                      setSellAmount("");
                      setSellNotes("");
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.cancelBtnText, { color: colors.mutedForeground }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmBtn, { backgroundColor: colors.success }]}
                    onPress={handleAddSell}
                    disabled={saving}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.confirmBtnText}>
                      {saving ? "Saving..." : "Save Sale"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}

        <TouchableOpacity
          style={[styles.deleteButton, { borderColor: colors.destructive }]}
          onPress={handleDeleteTrade}
          activeOpacity={0.7}
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

function DetailRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
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
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { padding: 20, gap: 16 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 12 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  usdtAmount: { fontSize: 24, fontFamily: "Inter_700Bold" },
  cardDate: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
  },
  divider: { height: 1, marginVertical: 4 },
  remainingBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  remainingRow: { flexDirection: "row", gap: 24 },
  remainingItem: { gap: 2 },
  remainingLabel: { fontSize: 11, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.5 },
  remainingValue: { fontSize: 18, fontFamily: "Inter_700Bold" },
  detailGrid: { gap: 10 },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: { fontSize: 14, fontFamily: "Inter_400Regular" },
  detailValue: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  subSectionTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  profitHighlight: { gap: 2, marginTop: 4 },
  profitLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  profitValue: { fontSize: 20, fontFamily: "Inter_700Bold" },
  notes: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
    lineHeight: 20,
  },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  field: { gap: 6 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium" },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  sellCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  sellCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sellCardIdx: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  sellCardDate: { fontSize: 11, fontFamily: "Inter_400Regular" },
  sellCardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sellStat: { alignItems: "center", gap: 2 },
  sellStatLabel: { fontSize: 10, fontFamily: "Inter_500Medium", textTransform: "uppercase" },
  sellStatValue: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  sellNotes: { fontSize: 12, fontFamily: "Inter_400Regular", fontStyle: "italic" },
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
  sellForm: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  sellFormTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
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
  previewLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  previewValue: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  sellFormButtons: { flexDirection: "row", gap: 12 },
  cancelBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 13,
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 15, fontFamily: "Inter_500Medium" },
  confirmBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  confirmBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  deleteButton: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  deleteButtonText: { fontSize: 15, fontFamily: "Inter_500Medium" },
});
