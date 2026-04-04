import React, { useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ProfitTargetTable } from "@/components/ProfitTargetTable";
import { useColors } from "@/hooks/useColors";
import {
  calcBuyCost,
  calcCostPerUsdt,
  calcExpectedProfit,
  calcTargetSellRate,
  formatBDT,
  formatRate,
} from "@/utils/calculations";

export default function CalculatorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [buyRate, setBuyRate] = useState("");
  const [usdt, setUsdt] = useState("");
  const [fee, setFee] = useState("0.1");
  const [customTarget, setCustomTarget] = useState("");
  const [customSellRate, setCustomSellRate] = useState("");

  const rateNum = parseFloat(buyRate) || 0;
  const usdtNum = parseFloat(usdt) || 100;
  const feeNum = parseFloat(fee) || 0;
  const customTargetNum = parseFloat(customTarget) || 0;
  const customSellRateNum = parseFloat(customSellRate) || 0;

  const hasInput = rateNum > 0;
  const costPerUsdt = hasInput ? calcCostPerUsdt(rateNum, feeNum) : 0;
  const totalCost = hasInput ? calcBuyCost(usdtNum, rateNum, feeNum) : 0;
  const customTargetSellRate =
    hasInput && customTargetNum > 0
      ? calcTargetSellRate(rateNum, feeNum, customTargetNum)
      : 0;
  const customTargetProfit =
    hasInput && customTargetNum > 0
      ? calcExpectedProfit(usdtNum, rateNum, feeNum, customTargetSellRate)
      : 0;

  const topPadding =
    Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const inputStyle = [
    styles.input,
    {
      borderColor: colors.border,
      backgroundColor: colors.muted,
      color: colors.foreground,
    },
  ];
  const labelStyle = [styles.label, { color: colors.mutedForeground }];

  return (
    <KeyboardAwareScrollViewCompat
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.scroll,
        {
          paddingTop: topPadding + 16,
          paddingBottom:
            insets.bottom + (Platform.OS === "web" ? 34 : 0) + 100,
        },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.screenTitle, { color: colors.foreground }]}>
        Calculator
      </Text>
      <Text style={[styles.screenSub, { color: colors.mutedForeground }]}>
        Find the best sell rate for your trade
      </Text>

      <View
        style={[
          styles.inputCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>
          Trade Parameters
        </Text>

        <View style={styles.field}>
          <Text style={labelStyle}>Buy Rate (BDT/USDT) *</Text>
          <TextInput
            style={inputStyle}
            placeholder="e.g. 120.50"
            placeholderTextColor={colors.mutedForeground}
            value={buyRate}
            onChangeText={setBuyRate}
            keyboardType="decimal-pad"
            returnKeyType="next"
            testID="calc-buy-rate"
          />
        </View>

        <View style={styles.field}>
          <Text style={labelStyle}>USDT Amount</Text>
          <TextInput
            style={inputStyle}
            placeholder="e.g. 100 (for profit calc)"
            placeholderTextColor={colors.mutedForeground}
            value={usdt}
            onChangeText={setUsdt}
            keyboardType="decimal-pad"
            returnKeyType="next"
          />
        </View>

        <View style={styles.field}>
          <Text style={labelStyle}>Fee %</Text>
          <TextInput
            style={inputStyle}
            placeholder="0.1"
            placeholderTextColor={colors.mutedForeground}
            value={fee}
            onChangeText={setFee}
            keyboardType="decimal-pad"
            returnKeyType="done"
          />
        </View>
      </View>

      {hasInput ? (
        <>
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: colors.secondary, borderColor: colors.border },
            ]}
          >
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
                Cost per USDT
              </Text>
              <Text style={[styles.summaryValue, { color: colors.foreground }]}>
                ৳{formatRate(costPerUsdt)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
                Total Cost ({usdtNum} USDT)
              </Text>
              <Text style={[styles.summaryValue, { color: colors.foreground }]}>
                {formatBDT(totalCost)}
              </Text>
            </View>
          </View>

          <Text style={[styles.tableTitle, { color: colors.foreground }]}>
            Profit Targets
          </Text>
          <ProfitTargetTable
            buy_rate={rateNum}
            fee_percent={feeNum}
            usdt_amount={usdtNum}
            customSellRate={customSellRateNum}
          />

          <View
            style={[
              styles.inputCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              Custom Scenarios
            </Text>

            <View style={styles.field}>
              <Text style={labelStyle}>Target Profit %</Text>
              <TextInput
                style={inputStyle}
                placeholder="e.g. 1.5"
                placeholderTextColor={colors.mutedForeground}
                value={customTarget}
                onChangeText={setCustomTarget}
                keyboardType="decimal-pad"
              />
              {customTargetNum > 0 ? (
                <View
                  style={[
                    styles.resultBox,
                    { backgroundColor: colors.muted },
                  ]}
                >
                  <Text style={[styles.resultLabel, { color: colors.mutedForeground }]}>
                    Required Sell Rate
                  </Text>
                  <Text style={[styles.resultValue, { color: colors.primary }]}>
                    ৳{formatRate(customTargetSellRate)}
                  </Text>
                  <Text style={[styles.resultLabel, { color: colors.mutedForeground }]}>
                    Expected Profit ({usdtNum} USDT)
                  </Text>
                  <Text style={[styles.resultValue, { color: colors.success }]}>
                    +{formatBDT(customTargetProfit)}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.field}>
              <Text style={labelStyle}>Custom Sell Rate (BDT/USDT)</Text>
              <TextInput
                style={inputStyle}
                placeholder="Enter rate to see profit..."
                placeholderTextColor={colors.mutedForeground}
                value={customSellRate}
                onChangeText={setCustomSellRate}
                keyboardType="decimal-pad"
                testID="calc-custom-sell-rate"
              />
              {customSellRateNum > 0 ? (
                <CustomSellResult
                  rateNum={rateNum}
                  feeNum={feeNum}
                  usdtNum={usdtNum}
                  sellRate={customSellRateNum}
                  colors={colors}
                />
              ) : null}
            </View>
          </View>
        </>
      ) : (
        <View
          style={[
            styles.placeholder,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.placeholderText, { color: colors.mutedForeground }]}>
            Enter a buy rate above to see profit targets
          </Text>
        </View>
      )}
    </KeyboardAwareScrollViewCompat>
  );
}

function CustomSellResult({
  rateNum,
  feeNum,
  usdtNum,
  sellRate,
  colors,
}: {
  rateNum: number;
  feeNum: number;
  usdtNum: number;
  sellRate: number;
  colors: ReturnType<typeof useColors>;
}) {
  const costPerUsdt = calcCostPerUsdt(rateNum, feeNum);
  const cost = costPerUsdt * usdtNum;
  const revenue = sellRate * usdtNum;
  const profit = revenue - cost;
  const profitPct = cost > 0 ? (profit / cost) * 100 : 0;
  const isPositive = profit >= 0;
  const color = isPositive ? colors.success : colors.destructive;

  return (
    <View style={[styles.resultBox, { backgroundColor: colors.muted }]}>
      <Text style={[styles.resultLabel, { color: colors.mutedForeground }]}>
        Profit / Loss
      </Text>
      <Text style={[styles.resultValue, { color }]}>
        {isPositive ? "+" : "-"}
        {formatBDT(Math.abs(profit))} ({profitPct >= 0 ? "+" : ""}
        {profitPct.toFixed(2)}%)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 20,
    gap: 16,
  },
  screenTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  screenSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: -8,
    marginBottom: 4,
  },
  inputCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
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
  summaryCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  summaryValue: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  tableTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  resultBox: {
    borderRadius: 10,
    padding: 12,
    gap: 4,
    marginTop: 4,
  },
  resultLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  resultValue: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  placeholder: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 32,
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
