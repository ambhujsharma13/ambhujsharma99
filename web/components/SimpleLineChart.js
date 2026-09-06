"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function SimpleLineChart({ data, dataKey, valuePrefix = "", valueSuffix = "", decimals = 2 }) {
  if (!data || data.length < 2) {
    return <div className="text-paper/40 font-body py-16 text-center">Not enough data to chart yet.</div>;
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#212b37" />
          <XAxis dataKey="date" stroke="#f4efe4" opacity={0.4} tick={{ fontSize: 11 }} minTickGap={30} />
          <YAxis
            stroke="#f4efe4"
            opacity={0.4}
            tick={{ fontSize: 11 }}
            domain={["auto", "auto"]}
            tickFormatter={(v) => `${valuePrefix}${v.toFixed(decimals)}${valueSuffix}`}
          />
          <Tooltip
            contentStyle={{ backgroundColor: "#0f151c", border: "1px solid #212b37", fontSize: 12 }}
            labelStyle={{ color: "#f4efe4" }}
            formatter={(value) => [`${valuePrefix}${value.toFixed(decimals)}${valueSuffix}`, ""]}
          />
          <Line type="monotone" dataKey={dataKey} stroke="#d9a441" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
