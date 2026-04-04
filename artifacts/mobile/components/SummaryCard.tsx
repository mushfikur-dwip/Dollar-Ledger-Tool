import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface SummaryCardProps {
  title: string;
  value: string;
  subtitle?: string;
  valueColor?: string;
  small?: boolean;
}

export function SummaryCard({
  title,
  value,
  subtitle,
  valueColor,
  small = false,
}: SummaryCardProps) {
  const colors = useColors();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          minWidth: small ? 130 : 160,
        },
      ]}
    >
      <Text style={[styles.title, { color: colors.mutedForeground }]}>
        {title}
      </Text>
      <Text
        style={[
          styles.value,
          { color: valueColor ?? colors.foreground },
          small && styles.valueSmall,
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 4,
  },
  title: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  value: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    lineHeight: 28,
  },
  valueSmall: {
    fontSize: 18,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
