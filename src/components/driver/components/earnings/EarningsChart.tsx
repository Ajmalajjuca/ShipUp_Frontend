import React from 'react';
import { BarChart, Bar, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import Motion from '../ui/motion';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent
} from "../ui/chart";
import { useChartData, ChartDataItem } from '../../../../hooks/useChartData';

interface EarningsChartProps {
  data: ChartDataItem[];
  delay?: number;
}

const EarningsChart: React.FC<EarningsChartProps> = ({ data, delay = 400 }) => {
  // Use our custom hook to get chart data and config
  const { chartConfig, formattedData } = useChartData(data);

  return (
    <Motion variant="fade-in" delay={delay} className="w-full">
      <Card className="elegant-shadow">
        <CardHeader>
          <CardTitle>Earnings Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ChartContainer config={chartConfig}>
              {/* Wrap chart elements in a React fragment to provide a single child */}
              <>
                <BarChart data={formattedData}>
                  <XAxis dataKey="day" />
                  <YAxis />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                  />
                  <Bar
                    dataKey="amount"
                    name="amount"
                    fill="var(--color-amount)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
                <ChartLegend
                  content={<ChartLegendContent hideIcon={false} />}
                />
              </>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    </Motion>
  );
};

export default EarningsChart;