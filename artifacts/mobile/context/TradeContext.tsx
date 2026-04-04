import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "@p2p_tracker_v1_trades";

export interface SellRecord {
  id: string;
  sell_rate: number;
  sell_amount: number;
  sold_at: string;
  notes?: string;
}

export interface Trade {
  id: string;
  usdt_amount: number;
  buy_rate: number;
  fee_percent: number;
  total_bdt?: number;
  banking_charge?: number;
  notes: string;
  status: "open" | "closed";
  sells: SellRecord[];
  created_at: string;
  closed_at?: string;
}

export interface TradeStats {
  totalOpenUsdt: number;
  totalRemainingUsdt: number;
  totalInvestedBdt: number;
  todayProfit: number;
  monthProfit: number;
  allTimeProfit: number;
  totalTrades: number;
  openTrades: number;
  closedTrades: number;
}

interface TradeContextType {
  trades: Trade[];
  addTrade: (
    data: Omit<Trade, "id" | "created_at" | "status" | "sells">
  ) => Promise<void>;
  addSell: (
    tradeId: string,
    sell_rate: number,
    sell_amount: number,
    notes?: string
  ) => Promise<void>;
  deleteSell: (tradeId: string, sellId: string) => Promise<void>;
  deleteTrade: (id: string) => Promise<void>;
  stats: TradeStats;
  isLoading: boolean;
}

function calcCostPerUsdt(buy_rate: number, fee_percent: number): number {
  return buy_rate * (1 + fee_percent / 100);
}

function calcSoldUsdt(trade: Trade): number {
  return trade.sells.reduce((acc, s) => acc + s.sell_amount, 0);
}

function calcRemainingUsdt(trade: Trade): number {
  return Math.max(0, trade.usdt_amount - calcSoldUsdt(trade));
}

function calcTradeProfit(trade: Trade): number {
  const costPerUsdt = calcCostPerUsdt(trade.buy_rate, trade.fee_percent);
  return trade.sells.reduce((acc, s) => {
    const revenue = s.sell_rate * s.sell_amount;
    const cost = costPerUsdt * s.sell_amount;
    return acc + (revenue - cost);
  }, 0);
}

function isSameDay(dateStr: string, ref: Date): boolean {
  const d = new Date(dateStr);
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  );
}

function isSameMonth(dateStr: string, ref: Date): boolean {
  const d = new Date(dateStr);
  return (
    d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth()
  );
}

function computeStats(trades: Trade[]): TradeStats {
  const now = new Date();
  let totalOpenUsdt = 0;
  let totalRemainingUsdt = 0;
  let totalInvestedBdt = 0;
  let todayProfit = 0;
  let monthProfit = 0;
  let allTimeProfit = 0;
  let openTrades = 0;
  let closedTrades = 0;

  for (const t of trades) {
    const remaining = calcRemainingUsdt(t);
    const costPerUsdt = calcCostPerUsdt(t.buy_rate, t.fee_percent);

    if (t.status === "open") {
      openTrades++;
      totalOpenUsdt += t.usdt_amount;
      totalRemainingUsdt += remaining;
      totalInvestedBdt += costPerUsdt * t.usdt_amount;
    } else {
      closedTrades++;
    }

    for (const s of t.sells) {
      const sellProfit =
        s.sell_rate * s.sell_amount - costPerUsdt * s.sell_amount;
      allTimeProfit += sellProfit;
      if (isSameDay(s.sold_at, now)) todayProfit += sellProfit;
      if (isSameMonth(s.sold_at, now)) monthProfit += sellProfit;
    }
  }

  return {
    totalOpenUsdt,
    totalRemainingUsdt,
    totalInvestedBdt,
    todayProfit,
    monthProfit,
    allTimeProfit,
    totalTrades: trades.length,
    openTrades,
    closedTrades,
  };
}

function migrateTrade(raw: Record<string, unknown>): Trade {
  const sells: SellRecord[] = Array.isArray(raw.sells)
    ? (raw.sells as SellRecord[])
    : [];

  if (
    sells.length === 0 &&
    typeof raw.sell_rate === "number" &&
    typeof raw.sell_amount === "number"
  ) {
    sells.push({
      id: "legacy-" + String(raw.id),
      sell_rate: raw.sell_rate as number,
      sell_amount: raw.sell_amount as number,
      sold_at:
        typeof raw.closed_at === "string"
          ? raw.closed_at
          : String(raw.created_at),
    });
  }

  return {
    id: String(raw.id),
    usdt_amount: Number(raw.usdt_amount),
    buy_rate: Number(raw.buy_rate),
    fee_percent: Number(raw.fee_percent ?? 0),
    total_bdt: typeof raw.total_bdt === "number" ? raw.total_bdt : undefined,
    banking_charge:
      typeof raw.banking_charge === "number" ? raw.banking_charge : undefined,
    notes: typeof raw.notes === "string" ? raw.notes : "",
    status: raw.status === "closed" ? "closed" : "open",
    sells,
    created_at: String(raw.created_at),
    closed_at:
      typeof raw.closed_at === "string" ? raw.closed_at : undefined,
  };
}

const TradeContext = createContext<TradeContextType | null>(null);

export function TradeProvider({ children }: { children: React.ReactNode }) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTrades();
  }, []);

  async function loadTrades() {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, unknown>[];
        setTrades(parsed.map(migrateTrade));
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  }

  async function persist(updated: Trade[]) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setTrades(updated);
  }

  async function addTrade(
    data: Omit<Trade, "id" | "created_at" | "status" | "sells">
  ) {
    const newTrade: Trade = {
      ...data,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
      status: "open",
      sells: [],
    };
    await persist([newTrade, ...trades]);
  }

  async function addSell(
    tradeId: string,
    sell_rate: number,
    sell_amount: number,
    notes?: string
  ) {
    const now = new Date().toISOString();
    const updated = trades.map((t) => {
      if (t.id !== tradeId) return t;
      const newSell: SellRecord = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        sell_rate,
        sell_amount,
        sold_at: now,
        notes,
      };
      const newSells = [...t.sells, newSell];
      const sold = newSells.reduce((acc, s) => acc + s.sell_amount, 0);
      const isClosed = sold >= t.usdt_amount - 0.0001;
      return {
        ...t,
        sells: newSells,
        status: isClosed ? ("closed" as const) : ("open" as const),
        closed_at: isClosed ? now : t.closed_at,
      };
    });
    await persist(updated);
  }

  async function deleteSell(tradeId: string, sellId: string) {
    const updated = trades.map((t) => {
      if (t.id !== tradeId) return t;
      const newSells = t.sells.filter((s) => s.id !== sellId);
      const sold = newSells.reduce((acc, s) => acc + s.sell_amount, 0);
      const isClosed = sold >= t.usdt_amount - 0.0001;
      return {
        ...t,
        sells: newSells,
        status: isClosed ? ("closed" as const) : ("open" as const),
        closed_at: isClosed ? t.closed_at : undefined,
      };
    });
    await persist(updated);
  }

  async function deleteTrade(id: string) {
    await persist(trades.filter((t) => t.id !== id));
  }

  const stats = computeStats(trades);

  return (
    <TradeContext.Provider
      value={{
        trades,
        addTrade,
        addSell,
        deleteSell,
        deleteTrade,
        stats,
        isLoading,
      }}
    >
      {children}
    </TradeContext.Provider>
  );
}

export function useTrades() {
  const ctx = useContext(TradeContext);
  if (!ctx) throw new Error("useTrades must be used within TradeProvider");
  return ctx;
}
