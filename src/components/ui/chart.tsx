// Minimal stub — recharts is used directly in pages.
import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "@/lib/utils";

export type ChartConfig = Record<string, { label?: React.ReactNode; color?: string; icon?: React.ComponentType }>;

const ChartContext = React.createContext<{ config: ChartConfig } | null>(null);

export const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { config: ChartConfig; children: React.ReactNode }
>(({ config, children, className, ...rest }, ref) => (
  <ChartContext.Provider value={{ config }}>
    <div ref={ref} className={cn("w-full", className)} {...rest}>
      <RechartsPrimitive.ResponsiveContainer>{children as any}</RechartsPrimitive.ResponsiveContainer>
    </div>
  </ChartContext.Provider>
));
ChartContainer.displayName = "ChartContainer";

export const ChartTooltip = RechartsPrimitive.Tooltip;
export const ChartTooltipContent = (_: any) => null;
export const ChartLegend = RechartsPrimitive.Legend;
export const ChartLegendContent = (_: any) => null;
export const ChartStyle = (_: any) => null;
