import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { getThemeColors } from "../utils/themeColors";
import { listRegions } from "../api/regions";
import {
  closeRouteCycle,
  createRouteCycle,
  getCurrentRouteCycle,
  getRouteTerminal,
  listRouteCycles,
  syncRouteCycleOrders,
} from "../api/routeOperations";

const ROUTE_TYPES = [
  { value: "weekly_route", label: "Weekly route" },
  { value: "mwatate_route", label: "Mwatate route" },
  { value: "custom", label: "Custom route" },
];

const SIGNALS = {
  target_hit: ["Target hit", "#22c55e"],
  on_pace: ["On pace", "#14b8a6"],
  needs_push: ["Needs push", "#f59e0b"],
  behind_pace: ["Behind pace", "#ef4444"],
  watch: ["Watch", "#94a3b8"],
};

const STATUS_LABELS = {
  planned: "Planned",
  live: "Live",
  closed: "Closed",
  cancelled: "Cancelled",
};

const n = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const money = (value) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(n(value));

const shortMoney = (value) => {
  const amount = n(value);
  const abs = Math.abs(amount);
  if (abs >= 1000000) return `KSh ${(amount / 1000000).toFixed(2)}M`;
  if (abs >= 1000) return `KSh ${(amount / 1000).toFixed(0)}K`;
  return money(amount);
};

const whole = (value) => new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(n(value));

const dateText = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-KE", {
    timeZone: "Africa/Nairobi",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const countdown = (deadline, nowMs) => {
  const end = new Date(deadline || 0).getTime();
  if (!end || Number.isNaN(end)) return "--:--:--";
  const total = Math.max(Math.floor((end - nowMs) / 1000), 0);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (part) => String(part).padStart(2, "0");
  return days ? `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

const datetimeLocal = (value) => {
  const date = value ? new Date(value) : new Date();
  const pad = (part) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const defaultForm = () => {
  const start = new Date();
  const deadline = new Date(start);
  deadline.setDate(deadline.getDate() + 3);
  deadline.setHours(9, 0, 0, 0);
  return {
    name: `Route ${start.toLocaleDateString("en-KE", { month: "short", day: "numeric" })}`,
    route_type: "weekly_route",
    target_amount: "1200000",
    status: "live",
    region_id: "",
    start_at: datetimeLocal(start),
    deadline_at: datetimeLocal(deadline),
  };
};

const rowsOf = (payload) => (Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []);

const errorText = (error, fallback) => {
  const data = error?.response?.data;
  return data?.error?.message || data?.message || data?.error || error?.message || fallback;
};

function Field({ label, children }) {
  return (
    <label className="route-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Pill({ children, color = "#94a3b8" }) {
  return <span className="route-pill" style={{ color, borderColor: `${color}66`, background: `${color}18` }}>{children}</span>;
}

function Stat({ label, value, sub, color }) {
  return (
    <div className="route-stat">
      <span>{label}</span>
      <strong>{value}</strong>
      {sub ? <small style={{ color }}>{sub}</small> : null}
    </div>
  );
}

function CandleChart({ candles = [], target }) {
  const data = candles
    .map((item) => ({ ...item, open: n(item.open), high: n(item.high), low: n(item.low), close: n(item.close), volume: n(item.volume) }))
    .filter((item) => item.time);

  if (!data.length) return <div className="route-empty">Route candles will appear as orders are captured.</div>;

  const width = 920;
  const height = 320;
  const left = 54;
  const right = 24;
  const top = 28;
  const bottom = 58;
  const innerW = width - left - right;
  const innerH = height - top - bottom;
  const max = Math.max(...data.map((item) => item.high), n(target), 1);
  const min = Math.min(...data.map((item) => item.low), 0);
  const spread = Math.max(max - min, 1);
  const y = (value) => top + ((max - value) / spread) * innerH;
  const step = innerW / Math.max(data.length, 1);
  const bodyW = clamp(step * 0.48, 8, 24);
  const maxVol = Math.max(...data.map((item) => item.volume), 1);
  const targetY = n(target) > 0 ? y(n(target)) : null;

  return (
    <div className="route-chart-scroll">
      <svg viewBox={`0 0 ${width} ${height}`} className="route-chart" role="img" aria-label="Route target candle chart">
        <rect width={width} height={height} rx="20" fill="#020617" />
        {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
          const lineY = top + tick * innerH;
          const value = max - tick * spread;
          return (
            <g key={tick}>
              <line x1={left} y1={lineY} x2={width - right} y2={lineY} stroke="rgba(148,163,184,.14)" />
              <text x="10" y={lineY + 4} fill="#64748b" fontSize="11" fontWeight="800">{shortMoney(value).replace("KSh ", "")}</text>
            </g>
          );
        })}
        {targetY ? (
          <g>
            <line x1={left} y1={targetY} x2={width - right} y2={targetY} stroke="#f97316" strokeWidth="2" strokeDasharray="7 7" />
            <text x={width - 98} y={Math.max(targetY - 8, 16)} fill="#fed7aa" fontSize="12" fontWeight="900">Target</text>
          </g>
        ) : null}
        {data.map((item, index) => {
          const x = left + index * step + step / 2;
          const up = item.close >= item.open;
          const color = up ? "#22c55e" : "#ef4444";
          const openY = y(item.open);
          const closeY = y(item.close);
          const bodyY = Math.min(openY, closeY);
          const bodyH = Math.max(Math.abs(openY - closeY), 5);
          const volH = (item.volume / maxVol) * 32;
          return (
            <g key={`${item.time}-${index}`}>
              <rect x={x - bodyW / 2} y={height - bottom + 34 - volH} width={bodyW} height={volH} rx="3" fill={`${color}33`} />
              <line x1={x} y1={y(item.high)} x2={x} y2={y(item.low)} stroke={color} strokeWidth="2" strokeLinecap="round" />
              <rect x={x - bodyW / 2} y={bodyY} width={bodyW} height={bodyH} rx="4" fill={color} />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
function Board({ title, action, children }) {
  return (
    <section className="route-board">
      <div className="route-board-head">
        <h3>{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function RankList({ rows = [], nameKey = "name", valueKey = "route_value", subKey, empty = "No records yet." }) {
  const max = Math.max(...rows.map((row) => n(row[valueKey])), 0);
  if (!rows.length) return <div className="route-list-empty">{empty}</div>;

  return (
    <div className="route-rank-list">
      {rows.map((row, index) => {
        const value = n(row[valueKey]);
        const pct = max > 0 ? (value / max) * 100 : 0;
        return (
          <div className="route-rank" key={`${row[nameKey] || index}-${index}`}>
            <div className="route-rank-top">
              <strong>{index + 1}. {row[nameKey] || "Unassigned"}</strong>
              <span>{shortMoney(value)}</span>
            </div>
            {subKey && row[subKey] ? <small>{row[subKey]}</small> : null}
            <div className="route-rank-bar"><i style={{ width: `${pct}%` }} /></div>
          </div>
        );
      })}
    </div>
  );
}

function OrderTape({ orders = [] }) {
  if (!orders.length) return <div className="route-list-empty">No route orders captured in this cycle yet.</div>;

  return (
    <div className="route-tape">
      {orders.map((order) => (
        <div className="route-tape-row" key={order.id}>
          <div>
            <strong>{order.customer_name || "Route customer"}</strong>
            <small>{order.order_number || `Order #${order.id}`} - {order.sales_rep_name || "No rep"} - {order.location_name || "No location"}</small>
          </div>
          <div>
            <b>{shortMoney(order.total_amount)}</b>
            <small>{dateText(order.created_at)}</small>
          </div>
        </div>
      ))}
    </div>
  );
}

function EventFeed({ events = [] }) {
  if (!events.length) return <div className="route-list-empty">Route events will show here.</div>;

  return (
    <div className="route-events">
      {events.map((event) => {
        const color = event.severity === "success" ? "#22c55e" : event.severity === "warning" ? "#f59e0b" : "#38bdf8";
        return (
          <div className="route-event" key={event.id} style={{ borderColor: color }}>
            <strong>{event.title || event.event_type}</strong>
            <small>{dateText(event.created_at)} {event.event_amount ? `- ${shortMoney(event.event_amount)}` : ""}</small>
          </div>
        );
      })}
    </div>
  );
}

export default function RouteOperations() {
  const { isDark } = useTheme();
  const c = getThemeColors(isDark);
  const [nowMs, setNowMs] = useState(Date.now());
  const [cycles, setCycles] = useState([]);
  const [regions, setRegions] = useState([]);
  const [cycleId, setCycleId] = useState("");
  const [intervalMinutes, setIntervalMinutes] = useState(30);
  const [terminal, setTerminal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const cycle = terminal?.cycle || null;
  const summary = terminal?.summary || {};
  const [signalLabel, signalColor] = SIGNALS[summary.signal] || SIGNALS.watch;
  const achievedPct = clamp(n(summary.achieved_percent), 0, 100);
  const elapsedPct = clamp(n(summary.elapsed_percent), 0, 100);

  const loadCycles = useCallback(async () => {
    const data = await listRouteCycles({ limit: 50 });
    setCycles(rowsOf(data));
  }, []);

  const loadRegions = useCallback(async () => {
    try {
      const data = await listRegions();
      setRegions(rowsOf(data));
    } catch (err) {
      console.warn("Regions failed to load", err);
    }
  }, []);

  const loadTerminal = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = cycleId
        ? await getRouteTerminal(cycleId, { interval_minutes: intervalMinutes, limit: 18 })
        : await getCurrentRouteCycle({ interval_minutes: intervalMinutes, limit: 18 });
      setTerminal(data || null);
      if (data?.cycle?.id && !cycleId) setCycleId(String(data.cycle.id));
    } catch (err) {
      setError(errorText(err, "Failed to load route terminal"));
    } finally {
      setLoading(false);
    }
  }, [cycleId, intervalMinutes]);

  useEffect(() => {
    loadCycles().catch((err) => setError(errorText(err, "Failed to load route cycles")));
    loadRegions();
  }, [loadCycles, loadRegions]);

  useEffect(() => {
    loadTerminal();
  }, [loadTerminal]);

  useEffect(() => {
    const clock = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(clock);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      loadTerminal();
      loadCycles().catch(() => undefined);
    }, 20000);
    return () => window.clearInterval(timer);
  }, [loadCycles, loadTerminal]);

  const stats = useMemo(() => [
    ["Route value", shortMoney(summary.achieved_amount), `${whole(achievedPct)}% of ${shortMoney(summary.target_amount)}`, "#22c55e"],
    ["Remaining", shortMoney(summary.remaining_amount), `${countdown(cycle?.deadline_at, nowMs)} left`, "#f97316"],
    ["Pace per hour", shortMoney(summary.current_pace_per_hour), `Needs ${shortMoney(summary.required_pace_per_hour)}/hr`, signalColor],
    ["Orders", whole(summary.order_count), `${whole(summary.customer_count)} customers, ${whole(summary.sales_rep_count)} reps`, "#38bdf8"],
    ["Largest order", shortMoney(summary.largest_order_amount), `Avg ${shortMoney(summary.average_order_value)}`, "#a78bfa"],
    ["Projected close", shortMoney(summary.projected_close_amount), `${whole(summary.confidence_percent)}% confidence`, signalColor],
  ], [achievedPct, cycle?.deadline_at, nowMs, signalColor, summary]);

  const createCycle = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const payload = {
        ...form,
        target_amount: n(form.target_amount),
        region_id: form.region_id || null,
        start_at: new Date(form.start_at).toISOString(),
        deadline_at: new Date(form.deadline_at).toISOString(),
      };
      const created = await createRouteCycle(payload);
      const nextTerminal = created?.terminal || created;
      setTerminal(nextTerminal || null);
      if (nextTerminal?.cycle?.id) setCycleId(String(nextTerminal.cycle.id));
      setMessage(`Route opened. ${whole(created?.synced_orders || 0)} existing orders synced.`);
      setForm(defaultForm());
      setShowCreate(false);
      await loadCycles();
    } catch (err) {
      setError(errorText(err, "Failed to create route cycle"));
    } finally {
      setSaving(false);
    }
  };

  const syncOrders = async () => {
    if (!cycle?.id) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const data = await syncRouteCycleOrders(cycle.id);
      setTerminal(data?.terminal || terminal);
      setMessage(`${whole(data?.synced_orders || 0)} route orders synced.`);
      await loadCycles();
    } catch (err) {
      setError(errorText(err, "Failed to sync route orders"));
    } finally {
      setSaving(false);
    }
  };

  const closeCycle = async () => {
    if (!cycle?.id || !window.confirm("Close this route cycle and lock the final amount?")) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const data = await closeRouteCycle(cycle.id);
      setTerminal(data || terminal);
      setMessage("Route cycle closed with final value saved.");
      await loadCycles();
    } catch (err) {
      setError(errorText(err, "Failed to close route cycle"));
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="route-page" style={{ background: c.bg, color: c.text }}>
      <div className="route-terminal">
        <header className="route-hero">
          <div>
            <div className="route-pills">
              <Pill color="#fb923c">Route operations terminal</Pill>
              {cycle ? <Pill color={cycle.status === "live" ? "#22c55e" : cycle.status === "closed" ? "#94a3b8" : "#f59e0b"}>{STATUS_LABELS[cycle.status] || cycle.status}</Pill> : null}
              {cycle?.region_name ? <Pill color="#38bdf8">{cycle.region_name}</Pill> : null}
            </div>
            <h1>Route trading desk</h1>
            <p>Live route target, order spikes, best reps, strongest customers, and fast-moving products from one command screen.</p>
          </div>
          <div className="route-controls">
            <select value={cycleId} onChange={(event) => setCycleId(event.target.value)}>
              <option value="">Current live cycle</option>
              {cycles.map((item) => <option key={item.id} value={item.id}>{item.name} - {STATUS_LABELS[item.status] || item.status}</option>)}
            </select>
            <select value={intervalMinutes} onChange={(event) => setIntervalMinutes(Number(event.target.value))}>
              {[15, 30, 60, 120].map((minutes) => <option key={minutes} value={minutes}>{minutes}m</option>)}
            </select>
            <button type="button" className="route-btn muted" onClick={loadTerminal} disabled={loading || saving}>Refresh</button>
            <button type="button" className="route-btn hot" onClick={() => setShowCreate((value) => !value)}>New route</button>
          </div>
        </header>

        {showCreate ? (
          <form className="route-create" onSubmit={createCycle}>
            <Field label="Route name"><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></Field>
            <Field label="Route type"><select value={form.route_type} onChange={(event) => setForm({ ...form, route_type: event.target.value })}>{ROUTE_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select></Field>
            <Field label="Target"><input type="number" min="0" value={form.target_amount} onChange={(event) => setForm({ ...form, target_amount: event.target.value })} /></Field>
            <Field label="Region"><select value={form.region_id} onChange={(event) => setForm({ ...form, region_id: event.target.value })}><option value="">All route regions</option>{regions.map((region) => <option key={region.id} value={region.id}>{region.name}</option>)}</select></Field>
            <Field label="Start"><input type="datetime-local" value={form.start_at} onChange={(event) => setForm({ ...form, start_at: event.target.value })} required /></Field>
            <Field label="Deadline"><input type="datetime-local" value={form.deadline_at} onChange={(event) => setForm({ ...form, deadline_at: event.target.value })} required /></Field>
            <Field label="Status"><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="live">Live</option><option value="planned">Planned</option></select></Field>
            <div className="route-form-actions">
              <button type="button" className="route-btn muted" onClick={() => setShowCreate(false)}>Cancel</button>
              <button type="submit" className="route-btn hot" disabled={saving}>{saving ? "Opening..." : "Open route"}</button>
            </div>
          </form>
        ) : null}

        {(message || error) ? <div className={error ? "route-alert bad" : "route-alert good"}>{error || message}</div> : null}

        {!cycle && !loading ? (
          <section className="route-no-cycle">
            <h2>No live route cycle found</h2>
            <p>Open a weekly route, Mwatate route, or custom route cycle. Existing route orders inside the selected time window can be synced immediately.</p>
            <button type="button" className="route-btn hot" onClick={() => setShowCreate(true)}>Create route cycle</button>
          </section>
        ) : (
          <main className="route-body">
            <div className="route-live-head">
              <div>
                <div className="route-pills"><Pill color={signalColor}>{signalLabel}</Pill><Pill>Started {dateText(cycle?.start_at)}</Pill><Pill>Deadline {dateText(cycle?.deadline_at)}</Pill></div>
                <h2>{cycle?.name || "Route cycle"}</h2>
              </div>
              <div className="route-actions">
                <button type="button" className="route-btn muted" onClick={syncOrders} disabled={!cycle?.id || saving}>Sync orders</button>
                {cycle?.status !== "closed" ? <button type="button" className="route-btn danger" onClick={closeCycle} disabled={!cycle?.id || saving}>Close route</button> : null}
              </div>
            </div>

            <section className="route-progress">
              <div><strong>Target progress</strong><span>{money(summary.achieved_amount)} / {money(summary.target_amount)}</span></div>
              <div className="route-progress-bar"><i style={{ width: `${achievedPct}%`, background: `linear-gradient(90deg, ${signalColor}, #facc15)` }} /></div>
              <div><small>{whole(elapsedPct)}% time elapsed</small><small>{whole(summary.hours_remaining)} hours remaining</small></div>
            </section>

            <section className="route-stats">
              {stats.map(([label, value, sub, color]) => <Stat key={label} label={label} value={value} sub={sub} color={color} />)}
            </section>

            <section className="route-grid-main">
              <Board title="Route value candles" action={<Pill color="#38bdf8">{intervalMinutes} min blocks</Pill>}>
                <CandleChart candles={terminal?.candles || []} target={terminal?.target_line || summary.target_amount} />
              </Board>
              <Board title="Live order tape"><OrderTape orders={terminal?.live_order_tape || []} /></Board>
            </section>

            <section className="route-grid-four">
              <Board title="Best selling products"><RankList rows={terminal?.top_products || []} empty="No products sold in this route yet." /></Board>
              <Board title="Best sales reps"><RankList rows={terminal?.top_sales_reps || []} empty="Sales rep rankings will appear after route orders land." /></Board>
              <Board title="Highest value route customers"><RankList rows={terminal?.top_route_customers || []} subKey="location_name" empty="Route customer rankings will appear here." /></Board>
              <Board title="Location performance"><RankList rows={terminal?.location_leaderboard || []} empty="Locations will rank once orders are attached." /></Board>
            </section>

            <Board title="Route event stream"><EventFeed events={terminal?.events || []} /></Board>
          </main>
        )}
      </div>

      <style>{`
        .route-page { min-height: 100vh; padding: 24px; }
        .route-terminal { overflow: hidden; border-radius: 24px; background: #020617; border: 1px solid rgba(148,163,184,.22); box-shadow: 0 24px 80px rgba(2,6,23,.28); }
        .route-hero { display: flex; justify-content: space-between; gap: 18px; flex-wrap: wrap; align-items: center; padding: 26px clamp(18px,3vw,34px); background: radial-gradient(circle at top left, rgba(249,115,22,.24), transparent 34%), radial-gradient(circle at 75% 0%, rgba(34,197,94,.15), transparent 30%), #050b12; border-bottom: 1px solid rgba(148,163,184,.18); }
        .route-hero h1 { margin: 14px 0 0; color: #f8fafc; font-size: clamp(34px,5vw,62px); line-height: .95; letter-spacing: 0; }
        .route-hero p { margin: 12px 0 0; max-width: 760px; color: #cbd5e1; font-size: 16px; line-height: 1.6; }
        .route-pills { display: flex; gap: 9px; flex-wrap: wrap; align-items: center; }
        .route-pill { display: inline-flex; align-items: center; padding: 7px 12px; border-radius: 999px; border: 1px solid; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: .5px; }
        .route-controls, .route-actions, .route-form-actions { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
        .route-controls select, .route-create input, .route-create select { min-height: 44px; border-radius: 12px; border: 1px solid rgba(148,163,184,.28); background: rgba(15,23,42,.88); color: #f8fafc; padding: 10px 12px; outline: none; font-weight: 800; }
        .route-controls select:first-child { min-width: 260px; }
        .route-btn { border-radius: 12px; border: 1px solid rgba(148,163,184,.28); padding: 11px 14px; font-weight: 950; cursor: pointer; color: #f8fafc; background: rgba(15,23,42,.86); }
        .route-btn.hot { background: #f97316; border-color: #f97316; color: white; }
        .route-btn.danger { background: rgba(239,68,68,.14); border-color: rgba(239,68,68,.38); color: #fecaca; }
        .route-btn:disabled { opacity: .55; cursor: not-allowed; }
        .route-create { display: grid; grid-template-columns: repeat(auto-fit, minmax(185px, 1fr)); gap: 14px; padding: 24px; background: rgba(15,23,42,.7); border-bottom: 1px solid rgba(148,163,184,.18); }
        .route-field { display: grid; gap: 8px; color: #cbd5e1; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: .5px; }
        .route-form-actions { align-self: end; justify-content: flex-end; }
        .route-alert { padding: 14px 24px; border-bottom: 1px solid rgba(148,163,184,.18); font-weight: 900; }
        .route-alert.good { color: #bbf7d0; background: rgba(20,83,45,.18); }
        .route-alert.bad { color: #fecaca; background: rgba(127,29,29,.22); }
        .route-no-cycle { margin: 30px; padding: 28px; border: 1px dashed rgba(148,163,184,.32); border-radius: 20px; background: rgba(15,23,42,.62); color: #cbd5e1; }
        .route-no-cycle h2 { margin: 0; color: #f8fafc; }
        .route-body { display: grid; gap: 22px; padding: 24px clamp(16px,3vw,30px) 30px; }
        .route-live-head { display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap; align-items: center; }
        .route-live-head h2 { margin: 12px 0 0; color: #f8fafc; font-size: clamp(24px,3vw,38px); }
        .route-progress { display: grid; gap: 10px; color: #cbd5e1; font-weight: 900; }
        .route-progress > div { display: flex; justify-content: space-between; gap: 14px; }
        .route-progress-bar { height: 12px; border-radius: 999px; background: rgba(148,163,184,.15); overflow: hidden; }
        .route-progress-bar i { display: block; height: 100%; border-radius: 999px; transition: width .35s ease; }
        .route-stats, .route-grid-four { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 14px; }
        .route-stat, .route-board { background: linear-gradient(180deg, rgba(15,23,42,.92), rgba(2,6,23,.92)); border: 1px solid rgba(148,163,184,.18); border-radius: 18px; box-shadow: inset 0 1px 0 rgba(255,255,255,.04); }
        .route-stat { min-height: 118px; padding: 18px; }
        .route-stat span { display: block; color: #94a3b8; font-size: 12px; font-weight: 950; letter-spacing: .5px; text-transform: uppercase; }
        .route-stat strong { display: block; margin-top: 12px; color: #f8fafc; font-size: 27px; line-height: 1.05; }
        .route-stat small { display: block; margin-top: 10px; font-size: 13px; font-weight: 850; }
        .route-grid-main { display: grid; grid-template-columns: minmax(0,1.35fr) minmax(320px,.65fr); gap: 18px; }
        .route-board { padding: 18px; min-width: 0; }
        .route-board-head { display: flex; justify-content: space-between; gap: 12px; align-items: center; margin-bottom: 14px; }
        .route-board h3 { margin: 0; color: #f8fafc; font-size: 16px; }
        .route-empty, .route-list-empty { min-height: 180px; display: grid; place-items: center; color: #94a3b8; border: 1px dashed rgba(148,163,184,.25); border-radius: 18px; background: rgba(15,23,42,.5); font-weight: 850; text-align: center; padding: 18px; }
        .route-chart-scroll { overflow-x: auto; padding-bottom: 6px; }
        .route-chart { width: 100%; min-width: 680px; height: 320px; display: block; }
        .route-rank-list, .route-tape, .route-events { display: grid; gap: 11px; max-height: 420px; overflow: auto; padding-right: 4px; }
        .route-rank { display: grid; gap: 7px; }
        .route-rank-top { display: flex; justify-content: space-between; gap: 12px; color: #e2e8f0; font-weight: 900; }
        .route-rank-top strong { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .route-rank small, .route-tape small, .route-event small { color: #94a3b8; font-size: 12px; font-weight: 750; }
        .route-rank-bar { height: 8px; background: rgba(148,163,184,.15); border-radius: 999px; overflow: hidden; }
        .route-rank-bar i { display: block; height: 100%; border-radius: 999px; background: linear-gradient(90deg, #f97316, #22c55e); }
        .route-tape-row { display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: center; padding: 12px; border-radius: 14px; background: rgba(2,6,23,.72); border: 1px solid rgba(148,163,184,.14); }
        .route-tape-row strong, .route-event strong { display: block; color: #f8fafc; font-weight: 950; }
        .route-tape-row b { display: block; color: #22c55e; text-align: right; }
        .route-tape-row > div:first-child { min-width: 0; }
        .route-tape-row > div:first-child strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .route-event { border-left: 3px solid; padding: 8px 0 8px 12px; }
        @media (max-width: 1120px) { .route-grid-main { grid-template-columns: 1fr; } }
        @media (max-width: 740px) { .route-page { padding: 12px; } .route-controls, .route-actions, .route-form-actions { width: 100%; } .route-controls select, .route-controls button, .route-actions button, .route-form-actions button { width: 100%; } .route-tape-row { grid-template-columns: 1fr; } .route-tape-row b { text-align: left; } }
      `}</style>
    </div>
  );
}