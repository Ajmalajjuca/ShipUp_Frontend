import { useMemo } from 'react';

// Define types for our chart data
export interface ChartDataItem {
  day: string;
  amount: number;
}

export interface ChartConfig {
  label: string;
  theme: {
    light: string;
    dark: string;
  };
}

export function useChartData(data: ChartDataItem[]) {
  // Memoize the chart configuration to prevent unnecessary re-renders
  const chartConfig = useMemo(() => ({
    amount: {
      label: "Amount ($)",
      theme: {
        light: "#7C3AED",
        dark: "#9F7AEA",
      },
    },
  }), []);

  // Memoize the formatted data
  const formattedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      // Round amount to 2 decimal places for display
      amount: Number(item.amount.toFixed(2))
    }));
  }, [data]);

  return {
    chartConfig,
    formattedData
  };
}
