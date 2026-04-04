import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import {
  calcProfitTargets,
  formatBDT,
  formatRate,
  type ProfitTarget,
} from "@/utils/calculations";

interface ProfitTargetTableProps {
  buy_rate: number;
  fee_percent: number;
  usdt_amount: number;
  customSellRate?: number;
}

export function ProfitTargetTable({
  buy_rate,
  fee_percent,
  usdt_amount,
  customSellRate,
}: ProfitTargetTableProps) {
  const colors = useColors();
  const targets = calcProfitTargets(usdt_amount, buy_rate, fee_percent);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerText, { color: colors.mutedForeground }]}>
          Target
        </Text>
        <Text style={[styles.headerText, { color: colors.mutedForeground }]}>
          Sell Rate (৳/USDT)
        </Text>
        <Text style={[styles.headerText, { color: colors.mutedForeground }]}>
          Profit
        </Text>
      </View>
      {targets.map((t: ProfitTarget) => (
        <View
          key={t.percent}
          style={[styles.row, { borderBottomColor: colors.border }]}
        >
          <Text style={[styles.percent, { color: colors.success }]}>
            +{t.percent}%
          </Text>
          <Text style={[styles.rate, { color: colors.foreground }]}>
            ৳{formatRate(t.sellRate)}
          </Text>
          <Text style={[styles.profit, { color: colors.success }]}>
            +{formatBDT(t.profit)}
          </Text>
        </View>
      ))}
      {customSellRate !== undefined && customSellRate > 0 ? (
        <CustomRow
          buy_rate={buy_rate}
          fee_percent={fee_percent}
          usdt_amount={usdt_amount}
          sellRate={customSellRate}
          colors={colors}
        />
      ) : null}
    </View>
  );
}

interface CustomRowProps {
  buy_rate: number;
  fee_percent: number;
  usdt_amount: number;
  sellRate: number;
  colors: ReturnType<typeof useColors>;
}

function CustomRow({
  buy_rate,
  fee_percent,
  usdt_amount,
  sellRate,
  colors,
}: CustomRowProps) {
  const costPerUsdt = buy_rate * (1 + fee_percent / 100);
  const cost = costPerUsdt * usdt_amount;
  const revenue = sellRate * usdt_amount;
  const profit = revenue - cost;
  const profitPct = cost > 0 ? (profit / cost) * 100 : 0;
  const isPositive = profit >= 0;

  return (
    <View style={[styles.row, styles.customRow, { borderBottomColor: "transparent" }]}>
      <Text
        style={[
          styles.percent,
          { color: isPositive ? colors.success : colors.destructive },
        ]}
      >
        {isPositive ? "+" : ""}
        {profitPct.toFixed(2)}%
      </Text>
      <Text style={[styles.rate, { color: colors.primary }]}>
        ৳{formatRate(sellRate)} *
      </Text>
      <Text
        style={[
          styles.profit,
          { color: isPositive ? colors.success : colors.destructive },
        ]}
      >
        {isPositive ? "+" : "-"}
        {formatBDT(Math.abs(profit))}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    justifyContent: "space-between",
  },
  headerText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    flex: 1,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    justifyContent: "space-between",
    alignItems: "center",
  },
  customRow: {
    backgroundColor: "transparent",
  },
  percent: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
    textAlign: "center",
  },
  rate: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
    textAlign: "center",
  },
  profit: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
    textAlign: "center",
  },
});
