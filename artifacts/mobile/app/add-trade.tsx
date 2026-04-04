import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
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
import { useTrades } from "@/context/TradeContext";
import { useColors } from "@/hooks/useColors";
import {
  calcBuyCost,
  calcCostPerUsdt,
  formatBDT,
  formatRate,
} from "@/utils/calculations";

export default function AddTradeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addTrade } = useTrades();

  const [usdt, setUsdt] = useState("");
  const [buyRate, setBuyRate] = useState("");
  const [fee, setFee] = useState("0.1");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const usdtNum = parseFloat(usdt) || 0;
  const rateNum = parseFloat(buyRate) || 0;
  const feeNum = parseFloat(fee) || 0;
  const costPerUsdt = rateNum > 0 ? calcCostPerUsdt(rateNum, feeNum) : 0;
  const totalCost = usdtNum > 0 && rateNum > 0 ? calcBuyCost(usdtNum, rateNum, feeNum) : 0;

  const isValid = usdtNum > 0 && rateNum > 0 && feeNum >= 0;

  async function handleSave() {
    if (!isValid) {
      Alert.alert("Missing Info", "Please enter USDT amount and buy rate.");
      return;
    }
    setSaving(true);
    try {
      await addTrade({
        usdt_amount: usdtNum,
        buy_rate: rateNum,
        fee_percent: feeNum,
        notes: notes.trim(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Alert.alert("Error", "Could not save trade. Please try again.");
    } finally {
      setSaving(false);
    }
  }

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
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Trade Details
          </Text>

          <View style={styles.field}>
            <Text style={labelStyle}>USDT Amount *</Text>
            <TextInput
              style={inputStyle}
              placeholder="e.g. 100"
              placeholderTextColor={colors.mutedForeground}
              value={usdt}
              onChangeText={setUsdt}
              keyboardType="decimal-pad"
              returnKeyType="next"
              testID="usdt-amount-input"
            />
          </View>

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
              testID="buy-rate-input"
            />
          </View>

          <View style={styles.field}>
            <Text style={labelStyle}>Binance Fee % *</Text>
            <TextInput
              style={inputStyle}
              placeholder="e.g. 0.1"
              placeholderTextColor={colors.mutedForeground}
              value={fee}
              onChangeText={setFee}
              keyboardType="decimal-pad"
              returnKeyType="next"
            />
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>
              Standard Binance P2P fee is 0.1%
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={labelStyle}>Notes (optional)</Text>
            <TextInput
              style={[inputStyle, styles.notesInput]}
              placeholder="Add notes..."
              placeholderTextColor={colors.mutedForeground}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {totalCost > 0 ? (
          <View
            style={[
              styles.preview,
              { backgroundColor: colors.secondary, borderColor: colors.border },
            ]}
          >
            <Text
              style={[styles.previewTitle, { color: colors.secondaryForeground }]}
            >
              Preview
            </Text>
            <View style={styles.previewRow}>
              <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>
                Total Cost
              </Text>
              <Text style={[styles.previewValue, { color: colors.foreground }]}>
                {formatBDT(totalCost)}
              </Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>
                Cost per USDT
              </Text>
              <Text style={[styles.previewValue, { color: colors.foreground }]}>
                ৳{formatRate(costPerUsdt)}
              </Text>
            </View>
          </View>
        ) : null}

        <TouchableOpacity
          style={[
            styles.saveButton,
            {
              backgroundColor: isValid ? colors.primary : colors.muted,
            },
          ]}
          onPress={handleSave}
          disabled={!isValid || saving}
          testID="save-trade-button"
          activeOpacity={0.8}
        >
          {saving ? (
            <Feather name="loader" size={20} color={colors.primaryForeground} />
          ) : (
            <Text
              style={[
                styles.saveButtonText,
                { color: isValid ? colors.primaryForeground : colors.mutedForeground },
              ]}
            >
              Save Trade
            </Text>
          )}
        </TouchableOpacity>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 20,
    gap: 16,
  },
  section: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
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
  notesInput: {
    height: 80,
    paddingTop: 12,
  },
  hint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  preview: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  previewTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  previewLabel: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  previewValue: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  saveButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
