"use client";

import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";

export default function Sparkline({ data, positive, dataKey = "close_usd" }) {
  if (!data || data.length < 2) return <div className="w-24 h-8" />;

  return (
    <div className="w-24 h-8">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <YAxis domain={["auto", "auto"]} hide />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={positive ? "#4fae8e" : "#c96a5a"}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
