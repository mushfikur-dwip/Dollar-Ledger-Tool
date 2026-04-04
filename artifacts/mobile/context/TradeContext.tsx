import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "@p2p_tracker_v1_trades";

export interface Trade {
  id: string;
  usdt_amount: number;
  buy_rate: number;
  fee_percent: number;
  notes: string;
  status: "open" | "closed";
  sell_rate?: number;
  sell_amount?: number;
  created_at: string;
  closed_at?: string;
}

export interface TradeStats {
  totalOpenUsdt: number;
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
    data: Omit<Trade, "id" | "created_at" | "status">
  ) => Promise<void>;
  closeTrade: (
    id: string,
    sell_rate: number,
    sell_amount: number
  ) => Promise<void>;
  deleteTrade: (id: string) => Promise<void>;
  stats: TradeStats;
  isLoading: boolean;
}

function calcCostPerUsdt(buy_rate: number, fee_percent: number): number {
  return buy_rate * (1 + fee_percent / 100);
}

function calcTradeProfit(trade: Trade): number {
  if (!trade.sell_rate || !trade.sell_amount) return 0;
  const revenue = trade.sell_rate * trade.sell_amount;
  const cost = calcCostPerUsdt(trade.buy_rate, trade.fee_percent) * trade.sell_amount;
  return revenue - cost;
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
  let totalInvestedBdt = 0;
  let todayProfit = 0;
  let monthProfit = 0;
  let allTimeProfit = 0;
  let openTrades = 0;
  let closedTrades = 0;

  for (const t of trades) {
    if (t.status === "open") {
      openTrades++;
      totalOpenUsdt += t.usdt_amount;
      totalInvestedBdt +=
        calcCostPerUsdt(t.buy_rate, t.fee_percent) * t.usdt_amount;
    } else {
      closedTrades++;
      const profit = calcTradeProfit(t);
      allTimeProfit += profit;
      if (t.closed_at) {
        if (isSameDay(t.closed_at, now)) todayProfit += profit;
        if (isSameMonth(t.closed_at, now)) monthProfit += profit;
      }
    }
  }

  return {
    totalOpenUsdt,
    totalInvestedBdt,
    todayProfit,
    monthProfit,
    allTimeProfit,
    totalTrades: trades.length,
    openTrades,
    closedTrades,
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
      if (raw) setTrades(JSON.parse(raw));
    } catch {
    } finally {
      setIsLoading(false);
    }
  }

  async function persist(updated: Trade[]) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setTrades(updated);
  }

  async function addTrade(data: Omit<Trade, "id" | "created_at" | "status">) {
    const newTrade: Trade = {
      ...data,
      id:
        Date.now().toString() + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
      status: "open",
    };
    await persist([newTrade, ...trades]);
  }

  async function closeTrade(
    id: string,
    sell_rate: number,
    sell_amount: number
  ) {
    const updated = trades.map((t) =>
      t.id === id
        ? {
            ...t,
            status: "closed" as const,
            sell_rate,
            sell_amount,
            closed_at: new Date().toISOString(),
          }
        : t
    );
    await persist(updated);
  }

  async function deleteTrade(id: string) {
    await persist(trades.filter((t) => t.id !== id));
  }

  const stats = computeStats(trades);

  return (
    <TradeContext.Provider
      value={{ trades, addTrade, closeTrade, deleteTrade, stats, isLoading }}
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
