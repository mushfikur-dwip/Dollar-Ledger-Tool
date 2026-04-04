import type { Trade } from "@/context/TradeContext";

export function calcCostPerUsdt(buy_rate: number, fee_percent: number): number {
  return buy_rate * (1 + fee_percent / 100);
}

export function calcBuyCost(
  usdt_amount: number,
  buy_rate: number,
  fee_percent: number
): number {
  return usdt_amount * calcCostPerUsdt(buy_rate, fee_percent);
}

export function calcTargetSellRate(
  buy_rate: number,
  fee_percent: number,
  profit_percent: number
): number {
  return calcCostPerUsdt(buy_rate, fee_percent) * (1 + profit_percent / 100);
}

export function calcExpectedProfit(
  usdt_amount: number,
  buy_rate: number,
  fee_percent: number,
  target_sell_rate: number
): number {
  const cost = calcBuyCost(usdt_amount, buy_rate, fee_percent);
  const revenue = usdt_amount * target_sell_rate;
  return revenue - cost;
}

export function calcClosedProfit(trade: Trade): number {
  if (trade.status !== "closed" || !trade.sell_rate || !trade.sell_amount)
    return 0;
  const revenue = trade.sell_rate * trade.sell_amount;
  const cost =
    calcCostPerUsdt(trade.buy_rate, trade.fee_percent) * trade.sell_amount;
  return revenue - cost;
}

export function calcClosedProfitPercent(trade: Trade): number {
  if (trade.status !== "closed" || !trade.sell_rate || !trade.sell_amount)
    return 0;
  const cost =
    calcCostPerUsdt(trade.buy_rate, trade.fee_percent) * trade.sell_amount;
  if (cost === 0) return 0;
  return (calcClosedProfit(trade) / cost) * 100;
}

export function formatBDT(amount: number): string {
  return (
    "৳" +
    Math.abs(amount).toLocaleString("en-BD", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export function formatUSDT(amount: number): string {
  return amount.toFixed(4);
}

export function formatRate(rate: number): string {
  return rate.toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatPercent(p: number): string {
  return (p >= 0 ? "+" : "") + p.toFixed(2) + "%";
}

const PROFIT_TARGETS = [1, 2, 3, 5];

export type ProfitTarget = {
  percent: number;
  sellRate: number;
  profit: number;
};

export function calcProfitTargets(
  usdt_amount: number,
  buy_rate: number,
  fee_percent: number
): ProfitTarget[] {
  return PROFIT_TARGETS.map((pct) => {
    const sellRate = calcTargetSellRate(buy_rate, fee_percent, pct);
    const profit = calcExpectedProfit(usdt_amount, buy_rate, fee_percent, sellRate);
    return { percent: pct, sellRate, profit };
  });
}

export function groupTradesByDate(
  trades: Trade[]
): Record<string, Trade[]> {
  const groups: Record<string, Trade[]> = {};
  for (const t of trades) {
    const date = t.created_at.split("T")[0];
    if (!groups[date]) groups[date] = [];
    groups[date].push(t);
  }
  return groups;
}

export function groupTradesByMonth(
  trades: Trade[]
): Record<string, Trade[]> {
  const groups: Record<string, Trade[]> = {};
  for (const t of trades) {
    const month = t.created_at.substring(0, 7);
    if (!groups[month]) groups[month] = [];
    groups[month].push(t);
  }
  return groups;
}

export function formatDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split("-");
  const d = new Date(parseInt(year), parseInt(month) - 1, 1);
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
