import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import type { Trade } from "@/context/TradeContext";
import { useColors } from "@/hooks/useColors";
import {
  calcBuyCost,
  calcClosedProfit,
  calcClosedProfitPercent,
  calcRemainingUsdt,
  calcSoldUsdt,
  formatBDT,
  formatDate,
  formatRate,
} from "@/utils/calculations";

interface TradeCardProps {
  trade: Trade;
}

export function TradeCard({ trade }: TradeCardProps) {
  const colors = useColors();
  const router = useRouter();
  const isOpen = trade.status === "open";
  const profit = calcClosedProfit(trade);
  const profitPct = calcClosedProfitPercent(trade);
  const buyCost = calcBuyCost(trade.usdt_amount, trade.buy_rate, trade.fee_percent);
  const soldUsdt = calcSoldUsdt(trade);
  const remainingUsdt = calcRemainingUsdt(trade);
  const hasSomeSells = trade.sells.length > 0;

  const profitColor =
    profit > 0 ? colors.success : profit < 0 ? colors.destructive : colors.mutedForeground;

  return (
    <TouchableOpacity
      testID={`trade-card-${trade.id}`}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() =>
        router.push({ pathname: "/trade/[id]", params: { id: trade.id } })
      }
      activeOpacity={0.7}
    >
      <View style={styles.row}>
        <View style={styles.left}>
          <View style={styles.amountRow}>
            <Text style={[styles.amount, { color: colors.foreground }]}>
              {trade.usdt_amount.toFixed(2)} USDT
            </Text>
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

          {isOpen && hasSomeSells && (
            <View style={styles.progressRow}>
              <Text style={[styles.progressText, { color: colors.mutedForeground }]}>
                বাকি: {remainingUsdt.toFixed(2)} · বিক্রি: {soldUsdt.toFixed(2)}
              </Text>
            </View>
          )}

          <Text style={[styles.meta, { color: colors.mutedForeground }]}>
            Buy: ৳{formatRate(trade.buy_rate)} · Cost: {formatBDT(buyCost)}
          </Text>
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>
            {formatDate(trade.created_at)}
          </Text>

          {trade.notes ? (
            <Text
              style={[styles.notes, { color: colors.mutedForeground }]}
              numberOfLines={1}
            >
              {trade.notes}
            </Text>
          ) : null}
        </View>

        <View style={styles.right}>
          {isOpen ? (
            hasSomeSells ? (
              <View style={styles.partialProfit}>
                <Text style={[styles.partialLabel, { color: colors.mutedForeground }]}>
                  লাভ এখন পর্যন্ত
                </Text>
                <Text style={[styles.profitAmount, { color: profitColor }]}>
                  {profit >= 0 ? "+" : ""}
                  {formatBDT(profit)}
                </Text>
              </View>
            ) : (
              <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
            )
          ) : (
            <View style={styles.profitContainer}>
              <Text style={[styles.profitAmount, { color: profitColor }]}>
                {profit >= 0 ? "+" : "-"}
                {formatBDT(Math.abs(profit))}
              </Text>
              <Text style={[styles.profitPct, { color: profitColor }]}>
                {profit >= 0 ? "+" : ""}
                {profitPct.toFixed(2)}%
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  left: {
    flex: 1,
    gap: 4,
  },
  right: {
    alignItems: "flex-end",
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  amount: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  progressText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  meta: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  notes: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
  },
  partialProfit: {
    alignItems: "flex-end",
    gap: 2,
  },
  partialLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
  profitContainer: {
    alignItems: "flex-end",
    gap: 2,
  },
  profitAmount: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  profitPct: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
});
