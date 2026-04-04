import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
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
  const { trades, editSell, deleteSell, deleteTrade } = useTrades();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const trade = trades.find((t) => t.id === id);
  const [customSellRate, setCustomSellRate] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sellAction, setSellAction] = useState<{
    id: string;
    mode: "delete" | "edit";
    editRate: string;
    editAmount: string;
    editNotes: string;
  } | null>(null);
  const [sellSaving, setSellSaving] = useState(false);

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

  function openSellDelete(sell: SellRecord) {
    setSellAction({ id: sell.id, mode: "delete", editRate: "", editAmount: "", editNotes: "" });
  }

  function openSellEdit(sell: SellRecord) {
    setSellAction({
      id: sell.id,
      mode: "edit",
      editRate: String(sell.sell_rate),
      editAmount: String(sell.sell_amount),
      editNotes: sell.notes ?? "",
    });
  }

  async function handleConfirmDeleteSell(sellId: string) {
    if (sellSaving) return;
    setSellSaving(true);
    try {
      await deleteSell(tradeId, sellId);
      try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } catch {}
    } finally {
      setSellSaving(false);
      setSellAction(null);
    }
  }

  async function handleSaveSellEdit(sell: SellRecord) {
    if (sellSaving || !sellAction) return;
    const rateNum = parseFloat(sellAction.editRate);
    const amountNum = parseFloat(sellAction.editAmount);
    if (!rateNum || rateNum <= 0 || !amountNum || amountNum <= 0) return;
    setSellSaving(true);
    try {
      await editSell(tradeId, sell.id, rateNum, amountNum, sellAction.editNotes.trim() || undefined);
      try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
    } finally {
      setSellSaving(false);
      setSellAction(null);
    }
  }

  async function handleConfirmDelete() {
    if (deleting) return;
    setDeleting(true);
    try {
      await deleteTrade(tradeId);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch {}
      router.navigate({ pathname: "/(tabs)/trades" });
    } catch {
      setDeleting(false);
      setConfirmingDelete(false);
    }
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
              const isActive = sellAction?.id === sell.id;
              const isEditMode = isActive && sellAction?.mode === "edit";
              const isDeleteMode = isActive && sellAction?.mode === "delete";
              return (
                <View
                  key={sell.id}
                  style={[
                    styles.sellCard,
                    { backgroundColor: colors.card, borderColor: isActive ? colors.primary : colors.border },
                  ]}
                >
                  <View style={styles.sellCardHeader}>
                    <Text style={[styles.sellCardIdx, { color: colors.mutedForeground }]}>
                      বিক্রি #{idx + 1}
                    </Text>
                    <Text style={[styles.sellCardDate, { color: colors.mutedForeground }]}>
                      {formatDate(sell.sold_at)} {formatTime(sell.sold_at)}
                    </Text>
                    <View style={styles.sellCardActions}>
                      <TouchableOpacity
                        onPress={() => isActive ? setSellAction(null) : openSellEdit(sell)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Feather
                          name={isEditMode ? "x" : "edit-2"}
                          size={14}
                          color={isEditMode ? colors.mutedForeground : colors.primary}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => isDeleteMode ? setSellAction(null) : openSellDelete(sell)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Feather
                          name={isDeleteMode ? "x" : "trash-2"}
                          size={14}
                          color={isDeleteMode ? colors.mutedForeground : colors.destructive}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {isEditMode ? (
                    <View style={styles.sellEditForm}>
                      <View style={styles.sellEditRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.sellStatLabel, { color: colors.mutedForeground, marginBottom: 4 }]}>
                            বিক্রয় রেট (৳)
                          </Text>
                          <TextInput
                            style={[styles.sellEditInput, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                            value={sellAction!.editRate}
                            onChangeText={(v) => setSellAction((p) => p ? { ...p, editRate: v } : p)}
                            keyboardType="decimal-pad"
                            placeholder="রেট"
                            placeholderTextColor={colors.mutedForeground}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.sellStatLabel, { color: colors.mutedForeground, marginBottom: 4 }]}>
                            পরিমাণ (USDT)
                          </Text>
                          <TextInput
                            style={[styles.sellEditInput, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                            value={sellAction!.editAmount}
                            onChangeText={(v) => setSellAction((p) => p ? { ...p, editAmount: v } : p)}
                            keyboardType="decimal-pad"
                            placeholder="পরিমাণ"
                            placeholderTextColor={colors.mutedForeground}
                          />
                        </View>
                      </View>
                      <TextInput
                        style={[styles.sellEditInput, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                        value={sellAction!.editNotes}
                        onChangeText={(v) => setSellAction((p) => p ? { ...p, editNotes: v } : p)}
                        placeholder="নোট (ঐচ্ছিক)"
                        placeholderTextColor={colors.mutedForeground}
                      />
                      <View style={styles.sellEditButtons}>
                        <TouchableOpacity
                          style={[styles.sellActionBtn, { backgroundColor: colors.muted }]}
                          onPress={() => setSellAction(null)}
                        >
                          <Text style={[styles.sellActionBtnText, { color: colors.mutedForeground }]}>বাতিল</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.sellActionBtn, { backgroundColor: colors.primary }]}
                          onPress={() => handleSaveSellEdit(sell)}
                          disabled={sellSaving}
                        >
                          <Text style={[styles.sellActionBtnText, { color: "#fff" }]}>
                            {sellSaving ? "সেভ..." : "সেভ করুন"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <>
                      <View style={styles.sellCardRow}>
                        <View style={styles.sellStat}>
                          <Text style={[styles.sellStatLabel, { color: colors.mutedForeground }]}>USDT</Text>
                          <Text style={[styles.sellStatValue, { color: colors.foreground }]}>
                            {sell.sell_amount.toFixed(4)}
                          </Text>
                        </View>
                        <View style={styles.sellStat}>
                          <Text style={[styles.sellStatLabel, { color: colors.mutedForeground }]}>রেট</Text>
                          <Text style={[styles.sellStatValue, { color: colors.foreground }]}>
                            ৳{formatRate(sell.sell_rate)}
                          </Text>
                        </View>
                        <View style={styles.sellStat}>
                          <Text style={[styles.sellStatLabel, { color: colors.mutedForeground }]}>আয়</Text>
                          <Text style={[styles.sellStatValue, { color: colors.foreground }]}>
                            {formatBDT(sell.sell_rate * sell.sell_amount)}
                          </Text>
                        </View>
                        <View style={styles.sellStat}>
                          <Text style={[styles.sellStatLabel, { color: colors.mutedForeground }]}>লাভ</Text>
                          <Text style={[styles.sellStatValue, { color: isPositive ? colors.success : colors.destructive }]}>
                            {isPositive ? "+" : ""}{formatBDT(sellProfit)}
                          </Text>
                        </View>
                      </View>
                      {sell.notes ? (
                        <Text style={[styles.sellNotes, { color: colors.mutedForeground }]}>
                          {sell.notes}
                        </Text>
                      ) : null}
                    </>
                  )}

                  {isDeleteMode && (
                    <View style={styles.sellDeleteConfirm}>
                      <Text style={[styles.sellDeleteText, { color: colors.foreground }]}>
                        এই বিক্রি মুছবেন?
                      </Text>
                      <View style={styles.sellEditButtons}>
                        <TouchableOpacity
                          style={[styles.sellActionBtn, { backgroundColor: colors.muted }]}
                          onPress={() => setSellAction(null)}
                        >
                          <Text style={[styles.sellActionBtnText, { color: colors.mutedForeground }]}>বাতিল</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.sellActionBtn, { backgroundColor: colors.destructive }]}
                          onPress={() => handleConfirmDeleteSell(sell.id)}
                          disabled={sellSaving}
                        >
                          <Text style={[styles.sellActionBtnText, { color: "#fff" }]}>
                            {sellSaving ? "মুছছি..." : "হ্যাঁ, মুছুন"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </>
        )}

        {isOpen && (
          <TouchableOpacity
            style={[styles.sellHint, { backgroundColor: colors.success + "18", borderColor: colors.success + "44" }]}
            onPress={() => router.navigate({ pathname: "/(tabs)/sell" })}
            activeOpacity={0.7}
          >
            <Feather name="dollar-sign" size={16} color={colors.success} />
            <Text style={[styles.sellHintText, { color: colors.success }]}>
              বিক্রি করতে "বিক্রি" ট্যাবে যান
            </Text>
            <Feather name="arrow-right" size={14} color={colors.success} />
          </TouchableOpacity>
        )}

        {confirmingDelete ? (
          <View style={styles.deleteConfirmRow}>
            <Text style={[styles.deleteConfirmText, { color: colors.foreground }]}>
              এই ট্রেড মুছবেন?
            </Text>
            <View style={styles.deleteConfirmButtons}>
              <TouchableOpacity
                style={[styles.deleteConfirmCancel, { backgroundColor: colors.muted }]}
                onPress={() => setConfirmingDelete(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.deleteButtonText, { color: colors.mutedForeground }]}>
                  বাতিল
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteConfirmYes, { backgroundColor: colors.destructive }]}
                onPress={handleConfirmDelete}
                activeOpacity={0.7}
                disabled={deleting}
              >
                <Feather name="trash-2" size={14} color="#fff" />
                <Text style={[styles.deleteButtonText, { color: "#fff" }]}>
                  {deleting ? "মুছছি..." : "হ্যাঁ, মুছুন"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.deleteButton, { borderColor: colors.destructive }]}
            onPress={() => setConfirmingDelete(true)}
            activeOpacity={0.7}
          >
            <Feather name="trash-2" size={16} color={colors.destructive} />
            <Text style={[styles.deleteButtonText, { color: colors.destructive }]}>
              Delete Trade
            </Text>
          </TouchableOpacity>
        )}
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
  sellHint: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 8,
  },
  sellHintText: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
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
  sellCardActions: { flexDirection: "row", gap: 12, alignItems: "center" },
  sellEditForm: { gap: 8, marginTop: 8 },
  sellEditRow: { flexDirection: "row", gap: 8 },
  sellEditInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  sellEditButtons: { flexDirection: "row", gap: 8, marginTop: 4 },
  sellActionBtn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sellActionBtnText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  sellDeleteConfirm: { marginTop: 10, gap: 6 },
  sellDeleteText: { fontSize: 13, fontFamily: "Inter_500Medium", textAlign: "center" },
  deleteButtonText: { fontSize: 15, fontFamily: "Inter_500Medium" },
  deleteConfirmRow: {
    gap: 10,
  },
  deleteConfirmText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  deleteConfirmButtons: {
    flexDirection: "row",
    gap: 10,
  },
  deleteConfirmCancel: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteConfirmYes: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
});
