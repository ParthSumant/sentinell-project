
import { useState } from "react";
import { ArrowLeft, Zap, Droplets, Recycle, Leaf } from "lucide-react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { resourceDetails } from "./data/resourceDetails.js";
import "./ResourceDetails.css";

const icons = {
  Electricity: Zap,
  Water: Droplets,
  Waste: Recycle,
  "Carbon emissions": Leaf,
};

export default function ResourceDetails() {
  const [selected, setSelected] = useState("Electricity");
  const resource = resourceDetails[selected];
  const Icon = icons[selected];

  return (
    <main className="resource-page">
      <header className="resource-topbar">
        <button
          className="resource-back"
          onClick={() => (window.location.href = "/dashboard")}
        >
          <ArrowLeft size={18} /> Back to dashboard
        </button>
        <span className="resource-demo-tag">DEMO DATA</span>
      </header>

      <section className="resource-heading">
        <p className="resource-eyebrow">SENTINEL / RESOURCE INTELLIGENCE</p>
        <h1>Resource details</h1>
        <p>
          Explore illustrative consumption totals across the five campus
          buildings.
        </p>
      </section>

      <section className="resource-tabs" aria-label="Select resource">
        {Object.keys(resourceDetails).map((name) => {
          const TabIcon = icons[name];

          return (
            <button
              key={name}
              className={`resource-tab ${selected === name ? "active" : ""}`}
              onClick={() => setSelected(name)}
            >
              <TabIcon size={18} />
              {name}
            </button>
          );
        })}
      </section>

      <section className="resource-total-card">
        <div className="resource-total-icon">
          <Icon size={26} />
        </div>
        <div>
          <p>{selected} — demo total</p>
          <h2>
            {resource.total.toLocaleString()}{" "}
            <span>{resource.unit}</span>
          </h2>
          <small>{resource.description}</small>
        </div>
      </section>

      <section className="resource-chart-card">
        <div className="resource-chart-heading">
          <div>
            <p className="resource-eyebrow">BUILDING COMPARISON</p>
            <h2>{selected} by building</h2>
          </div>
          <span>Illustrative values</span>
        </div>

        <div className="resource-chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={resource.breakdown}
              margin={{ top: 12, right: 12, left: 4, bottom: 38 }}
            >
              <CartesianGrid stroke="#30283a" strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-18}
                textAnchor="end"
                interval={0}
                height={65}
                tick={{ fill: "#bdb3cc", fontSize: 11 }}
                axisLine={{ stroke: "#51445f" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#bdb3cc", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#191420",
                  border: "1px solid #59466e",
                  borderRadius: 10,
                  color: "#ffffff",
                }}
                formatter={(value) => [`${value} ${resource.unit}`, selected]}
              />
              <Bar
                dataKey="value"
                fill="#a879f5"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <p className="resource-disclaimer">
        Demo only. These figures are illustrative and are not live sensor
        readings or verified campus measurements.
      </p>
    </main>
  );
}
