import React, { useState, useMemo } from "react";

export interface ChartDataItem {
  month: string;
  [key: string]: any;
}

export interface BarChartProps {
  data: ChartDataItem[];
  xDataKey?: string;
  animationDuration?: number;
  animationEasing?: string;
  barGap?: number;
  children?: React.ReactNode;
  className?: string;
}

export interface BarProps {
  dataKey: string;
  lineCap?: "round" | "square";
  fill?: string;
  fadedOpacity?: number;
  groupGap?: number;
  label?: string;
}

export interface GridProps {
  horizontal?: boolean;
}

export interface BarXAxisProps {
  className?: string;
}

export interface ChartTooltipProps {
  showCrosshair?: boolean;
}

export const Grid: React.FC<GridProps> = ({ horizontal = true }) => {
  if (!horizontal) return null;
  return (
    <div className="absolute inset-x-0 top-12 bottom-12 pointer-events-none flex flex-col justify-between z-0">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="w-full border-t border-dashed border-zinc-800/60" />
      ))}
    </div>
  );
};

export const Bar: React.FC<BarProps> = () => null;
export const BarXAxis: React.FC<BarXAxisProps> = () => null;
export const ChartTooltip: React.FC<ChartTooltipProps> = () => null;

export const BarChart: React.FC<BarChartProps> = ({
  data,
  xDataKey = "month",
  children,
  className = "",
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Extract Bar children props
  const barsProps = useMemo(() => {
    const bars: BarProps[] = [];
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && (child.type === Bar || (child.type as any)?.name === "Bar")) {
        bars.push((child.props as BarProps));
      }
    });
    if (bars.length === 0) {
      bars.push(
        { dataKey: "authorized", fill: "var(--chart-1)", lineCap: "round", label: "Authorized" },
        { dataKey: "unauthorized", fill: "var(--chart-2)", lineCap: "round", label: "Not Authorized" }
      );
    }
    return bars;
  }, [children]);

  // Compute maximum value for height scaling
  const maxVal = useMemo(() => {
    let max = 1;
    data.forEach((item) => {
      barsProps.forEach((b) => {
        const val = Number(item[b.dataKey] ?? 0);
        if (val > max) max = val;
      });
    });
    return max * 1.15; // 15% headroom
  }, [data, barsProps]);

  // Active hovered month item
  const activeItem = hoveredIdx !== null ? data[hoveredIdx] : null;
  const latestItem = data.length > 0 ? data[data.length - 1] : null;

  // Calculate left offset percentage for month-following vertical tooltip card
  const rawPct = hoveredIdx !== null && data.length > 0
    ? ((hoveredIdx + 0.5) / data.length) * 100
    : 0;

  // Clamp percentage between 10% and 88% so vertical card never overflows boundaries
  const tooltipLeftPct = Math.max(10, Math.min(88, rawPct));

  const tooltipTransform = hoveredIdx === 0
    ? "translate(0%, 0)"
    : hoveredIdx === data.length - 1
    ? "translate(-100%, 0)"
    : "translate(-50%, 0)";

  return (
    <div className={`relative flex flex-col w-full max-w-full h-full min-h-[340px] select-none ${className}`}>
      {/* Chart Canvas Viewport */}
      <div className="relative flex-1 w-full max-w-full flex flex-col justify-end pt-12 pb-1">
        {/* Background Grid Lines */}
        <Grid horizontal />

        {/* Vertical Tooltip Card matching exact UI image */}
        {hoveredIdx !== null && activeItem && (
          <div
            style={{
              left: `${tooltipLeftPct}%`,
              transform: tooltipTransform,
              transition: "left 0.15s ease-out, transform 0.15s ease-out",
            }}
            className="absolute top-2 z-40 pointer-events-none animate-fade-in"
          >
            <div className="rounded-xl border border-white/10 bg-[#1c1c20] p-3 shadow-2xl backdrop-blur-md flex flex-col gap-2 min-w-[155px]">
              <span className="text-sm font-bold text-white">{activeItem[xDataKey]}</span>
              {barsProps.map((b) => {
                const displayLabel =
                  b.label ||
                  (b.dataKey === "authorized"
                    ? "Authorized"
                    : b.dataKey === "unauthorized"
                    ? "Not Authorized"
                    : b.dataKey);
                const dotColor = b.fill?.startsWith("var")
                  ? (b.dataKey.includes("unauth") || b.dataKey === "mobile" ? "#71717a" : "#3f3f46")
                  : (b.fill || "#64748b");

                return (
                  <div key={b.dataKey} className="flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
                      <span className="text-zinc-400 capitalize">{displayLabel}</span>
                    </div>
                    <span className="font-bold text-white ml-2">{activeItem[b.dataKey] ?? 0}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Month Columns */}
        <div className="relative z-10 flex items-end justify-between w-full max-w-full h-60 px-2 sm:px-3 box-border">
          {data.map((item, idx) => {
            const isGroupHovered = hoveredIdx === idx;
            const isAnyHovered = hoveredIdx !== null;

            return (
              <div
                key={idx}
                className="relative flex-1 min-w-0 h-full flex flex-col justify-end items-center group cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Bars Container */}
                <div className="flex items-end gap-1 sm:gap-1.5 h-48 w-full justify-center px-0.5 relative">
                  {barsProps.map((b) => {
                    const val = Number(item[b.dataKey] ?? 0);
                    const isZero = val === 0;
                    const heightPct = isZero ? 0 : Math.max(14, Math.min(100, (val / maxVal) * 100));
                    const faded = isAnyHovered && !isGroupHovered;

                    const fillColor = b.fill?.startsWith("var")
                      ? (b.dataKey.includes("unauth") || b.dataKey === "mobile" ? "#71717a" : "#3f3f46")
                      : (b.fill || "#52525b");

                    return (
                      <div
                        key={b.dataKey}
                        style={{
                          height: isZero ? "2px" : `${heightPct}%`,
                          backgroundColor: isZero ? "#27272a" : fillColor,
                          transition: "all 0.3s cubic-bezier(0.85, 0, 0.15, 1)",
                        }}
                        className={`relative w-2.5 sm:w-3.5 md:w-4 ${
                          isZero
                            ? "rounded-sm opacity-25"
                            : b.lineCap === "round"
                            ? "rounded-full"
                            : "rounded-t-md"
                        } ${faded ? "opacity-35" : "opacity-100 shadow-md"} transition-opacity duration-200`}
                      >
                        {/* Ring circle dot at top tip of bar when hovered */}
                        {isGroupHovered && !isZero && (
                          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full border border-white/90 bg-transparent shadow-sm" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* X Axis Month Label — White Pill Badge when hovered */}
                <div className="h-10 flex items-center justify-center w-full mt-2 pt-1 border-t border-zinc-800/40">
                  <span
                    className={`text-xs transition-all duration-200 ${
                      isGroupHovered
                        ? "bg-white text-black font-bold rounded-full px-3 py-1 shadow-xl scale-105"
                        : "text-zinc-400 font-medium"
                    }`}
                  >
                    {item[xDataKey]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Right Legend */}
      <div className="flex items-center justify-end gap-4 sm:gap-6 mt-2 pt-3 border-t border-zinc-800/30 text-xs font-medium">
        {barsProps.map((b) => {
          const keyName = b.dataKey;
          const displayLabel =
            b.label ||
            (keyName === "authorized"
              ? "Authorized"
              : keyName === "unauthorized"
              ? "Not Authorized"
              : keyName);
          const displayVal = activeItem
            ? (activeItem[keyName] ?? 0)
            : (latestItem ? (latestItem[keyName] ?? 0) : 0);

          const color = b.fill?.startsWith("var")
            ? (keyName.includes("unauth") || keyName === "mobile" ? "#71717a" : "#3f3f46")
            : (b.fill || "#71717a");

          return (
            <div key={keyName} className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span className="text-zinc-300 capitalize">{displayLabel}</span>
              <span className="text-zinc-100 font-bold ml-1">{displayVal}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
