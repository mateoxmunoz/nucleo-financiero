import "./index.css";
import { useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard, ArrowUpCircle, ArrowDownCircle, Waves, Scale, FileBarChart2,
  Boxes, TrendingUp, ClipboardList, Settings as SettingsIcon, Plus, Trash2,
  Lock, AlertTriangle, RotateCcw, Check, X
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

/* ---------------------------------------------------------------- */
/* Constantes y utilidades                                          */
/* ---------------------------------------------------------------- */

const PALETTE = {
  positive: "#3F7D4F",
  positiveBg: "#E7F0E6",
  negative: "#A8432F",
  negativeBg: "#F5E6E1",
  accent: "#2B6E68",
  amber: "#C98A3E",
  muted: "#5B6470",
};

const PIE_COLORS = ["#2B6E68", "#3F7D4F", "#C98A3E", "#A8432F", "#7C8FA6", "#5B6470"];

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

const BUSINESS_PRESETS = [
  { id: "comercio", label: "Comercio / Retail", desc: "Venta de productos físicos al consumidor.", modules: { inventario: true, proyecciones: true, costosEspecificos: false } },
  { id: "servicios", label: "Servicios profesionales", desc: "Consultoría, asesoría, freelance.", modules: { inventario: false, proyecciones: true, costosEspecificos: true } },
  { id: "restauracion", label: "Restauración / Alimentos", desc: "Restaurantes, cafeterías, catering.", modules: { inventario: true, proyecciones: true, costosEspecificos: true } },
  { id: "eventos", label: "Eventos y producción cultural", desc: "Producción, boletería, espectáculos.", modules: { inventario: false, proyecciones: true, costosEspecificos: true } },
  { id: "manufactura", label: "Manufactura", desc: "Transformación de materia prima en producto.", modules: { inventario: true, proyecciones: true, costosEspecificos: true } },
  { id: "otro", label: "Otro / Personalizado", desc: "Configura los módulos manualmente.", modules: { inventario: false, proyecciones: false, costosEspecificos: false } },
];

const INCOME_CATEGORIES = ["Ventas", "Servicios prestados", "Comisiones", "Intereses", "Otros ingresos"];
const EXPENSE_CATEGORIES = ["Nómina", "Arriendo", "Servicios básicos", "Marketing", "Proveedores", "Impuestos", "Mantenimiento", "Otros gastos"];

const DEFAULT_SETTINGS = {
  businessType: "otro",
  nombreNegocio: "",
  moneda: "$",
  saldoInicial: 0,
  enabledModules: { inventario: false, proyecciones: false, costosEspecificos: false },
};
const DEFAULT_BALANCE_EXTRA = { cuentasPorCobrar: 0, otrosActivos: 0, deudas: 0, cuentasPorPagar: 0, otrosPasivos: 0 };
const DEFAULT_PROJECTIONS = { growthRate: 5, monthsToProject: 6 };

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function formatMoney(value, symbol = "$") {
  const n = Number(value) || 0;
  const sign = n < 0 ? "-" : "";
  return `${sign}${symbol}${Math.abs(n).toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function monthLabel(ym) {
  const [y, m] = ym.split("-");
  return `${MESES[parseInt(m, 10) - 1]} ${y.slice(2)}`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function parseDecimal(str) {
  if (typeof str !== "string") return Number(str) || 0;
  const direct = Number(str.trim());
  if (!Number.isNaN(direct) && str.trim() !== "") return direct;
  const cleaned = str.trim().replace(/\./g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isNaN(n) ? NaN : n;
}

/* ---------------------------------------------------------------- */
/* Estilos                                                           */
/* ---------------------------------------------------------------- */

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');

.nucleo-app {
  --ink-900:#1B2430; --ink-700:#2A3644; --ink-500:#3F4C5A;
  --paper-50:#F8F6F0; --paper-100:#EFEAE0; --paper-200:#E3DCCC;
  --accent:#2B6E68; --accent-dim:#3F8B84;
  --positive:#3F7D4F; --positive-bg:#E7F0E6;
  --negative:#A8432F; --negative-bg:#F5E6E1;
  --amber:#C98A3E; --amber-bg:#F4E9D8;
  --line:#DAD3C2; --muted:#6B7280;
  font-family:'IBM Plex Sans', sans-serif;
  color: var(--ink-900);
  background: var(--paper-50);
  min-height: 100%;
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}
.nucleo-app * { box-sizing: border-box; }
.nucleo-display { font-family:'Fraunces', serif; }
.nucleo-mono { font-family:'IBM Plex Mono', monospace; font-variant-numeric: tabular-nums; }

.nucleo-shell { display:flex; min-height:100vh; }

/* Sidebar */
.nucleo-sidebar {
  width: 240px; flex-shrink:0; background: var(--ink-900); color: var(--paper-50);
  display:flex; flex-direction:column; padding: 22px 14px;
}
.nucleo-brand { display:flex; align-items:center; gap:9px; padding: 0 8px 20px 8px; }
.nucleo-brand-mark { width:30px; height:30px; border-radius:7px; background: var(--accent-dim); display:flex; align-items:center; justify-content:center; color:#fff; font-family:'Fraunces',serif; font-weight:700; font-size:15px; flex-shrink:0; }
.nucleo-brand-text { font-family:'Fraunces', serif; font-size: 19px; font-weight:600; letter-spacing:0.02em; }
.nucleo-brand-sub { font-size:10.5px; color:#A9B2BC; letter-spacing:0.06em; text-transform:uppercase; margin-top:1px; }

.nucleo-nav-section-title { font-size:10.5px; text-transform:uppercase; letter-spacing:0.1em; color:#8B95A1; padding: 16px 10px 7px 10px; }
.nucleo-nav-item {
  display:flex; align-items:center; gap:10px; width:100%; padding:9px 10px; border-radius:8px;
  background:transparent; border:none; color:#D7DCE2; font-size:13.5px; font-family:inherit;
  cursor:pointer; text-align:left; transition: background 0.15s ease, color 0.15s ease;
}
.nucleo-nav-item:hover { background: rgba(255,255,255,0.06); color:#fff; }
.nucleo-nav-item.active { background: var(--accent-dim); color:#fff; font-weight:500; }
.nucleo-nav-item.locked { color:#6B7682; cursor:pointer; }
.nucleo-nav-item.locked:hover { background: rgba(255,255,255,0.04); color:#9aa3ad; }
.nucleo-nav-item svg { flex-shrink:0; }
.nucleo-nav-spacer { flex:1; }

/* Main */
.nucleo-main { flex:1; padding: 30px 38px 50px 38px; max-width: 1180px; }
.nucleo-page-header { margin-bottom: 22px; }
.nucleo-eyebrow { font-size:11px; text-transform:uppercase; letter-spacing:0.1em; color:var(--accent); font-weight:600; margin-bottom:4px; }
.nucleo-page-title { font-family:'Fraunces', serif; font-size:28px; font-weight:600; margin:0 0 4px 0; }
.nucleo-page-desc { color:var(--muted); font-size:13.5px; max-width:620px; }

/* Ledger tape */
.nucleo-tape-wrap { margin-bottom:26px; }
.nucleo-tape {
  display:flex; gap:0; overflow-x:auto; background: var(--paper-100);
  border-top:2px dashed var(--paper-200); border-bottom:2px dashed var(--paper-200);
  padding: 12px 4px;
}
.nucleo-tape-item { flex-shrink:0; padding: 0 18px; border-right:1px solid var(--line); display:flex; flex-direction:column; gap:3px; min-width:118px; }
.nucleo-tape-item:last-child { border-right:none; }
.nucleo-tape-date { font-size:10.5px; color:var(--muted); }
.nucleo-tape-cat { font-size:11.5px; color:var(--ink-700); }
.nucleo-tape-amt { font-size:13px; font-weight:600; }
.nucleo-tape-empty { padding: 14px 18px; color:var(--muted); font-size:13px; }

/* Cards */
.nucleo-cards { display:grid; grid-template-columns: repeat(4, 1fr); gap:14px; margin-bottom:26px; }
.nucleo-card { background:#fff; border:1px solid var(--line); border-radius:10px; padding:16px 18px; transition: box-shadow 0.15s ease, transform 0.15s ease; }
.nucleo-card:hover { box-shadow: 0 4px 14px rgba(27,36,48,0.07); transform: translateY(-1px); }
.nucleo-card-label { font-size:11px; text-transform:uppercase; letter-spacing:0.07em; color:var(--muted); margin-bottom:8px; }
.nucleo-card-value { font-size:22px; font-weight:600; }
.nucleo-card-value.positive { color:var(--positive); }
.nucleo-card-value.negative { color:var(--negative); }

/* Panels / charts */
.nucleo-panel { background:#fff; border:1px solid var(--line); border-radius:10px; padding:18px 20px; margin-bottom:20px; }
.nucleo-panel-title { font-size:14px; font-weight:600; margin-bottom:14px; }
.nucleo-grid-2 { display:grid; grid-template-columns: 1.3fr 1fr; gap:16px; }

/* Forms */
.nucleo-form { display:flex; flex-wrap:wrap; gap:10px; align-items:flex-end; }
.nucleo-field { display:flex; flex-direction:column; gap:4px; }
.nucleo-field label { font-size:11px; text-transform:uppercase; letter-spacing:0.05em; color:var(--muted); }
.nucleo-field input, .nucleo-field select {
  font-family:inherit; font-size:13.5px; padding:8px 10px; border:1px solid var(--line); border-radius:7px;
  background: var(--paper-50); color: var(--ink-900); min-width:130px;
}
.nucleo-field input:focus, .nucleo-field select:focus { outline:2px solid var(--accent-dim); outline-offset:1px; background:#fff; }
.nucleo-btn {
  display:inline-flex; align-items:center; gap:6px; font-family:inherit; font-size:13.5px; font-weight:500;
  padding:9px 14px; border-radius:7px; border:1px solid var(--accent); background:var(--accent); color:#fff;
  cursor:pointer; transition: background 0.15s ease;
}
.nucleo-btn:hover { background: var(--accent-dim); }
.nucleo-btn:focus-visible { outline:2px solid var(--ink-900); outline-offset:2px; }
.nucleo-btn.secondary { background:transparent; color:var(--ink-700); border:1px solid var(--line); }
.nucleo-btn.secondary:hover { background: var(--paper-100); }
.nucleo-btn.danger { background:transparent; color:var(--negative); border:1px solid var(--negative); }
.nucleo-btn.danger:hover { background: var(--negative-bg); }
.nucleo-icon-btn { background:none; border:none; cursor:pointer; color:var(--muted); padding:5px; border-radius:6px; display:inline-flex; }
.nucleo-icon-btn:hover { background:var(--paper-100); color:var(--negative); }

/* Tables */
.nucleo-table { width:100%; border-collapse:collapse; font-size:13.5px; }
.nucleo-table th { text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:0.05em; color:var(--muted); padding:8px 10px; border-bottom:1px solid var(--line); }
.nucleo-table td { padding:9px 10px; border-bottom:1px solid var(--paper-200); }
.nucleo-table tr:last-child td { border-bottom:none; }
.nucleo-table td.amt-pos { color:var(--positive); font-weight:600; }
.nucleo-table td.amt-neg { color:var(--negative); font-weight:600; }

.nucleo-empty { padding: 30px 10px; text-align:center; color:var(--muted); font-size:13.5px; }
.nucleo-empty strong { display:block; color:var(--ink-700); font-size:14.5px; margin-bottom:4px; font-weight:600; }

.nucleo-badge { display:inline-flex; align-items:center; gap:4px; font-size:11px; padding:3px 8px; border-radius:99px; font-weight:600; }
.nucleo-badge.low { background:var(--negative-bg); color:var(--negative); }
.nucleo-badge.ok { background:var(--positive-bg); color:var(--positive); }

/* Module lock card */
.nucleo-locked-panel { text-align:center; padding:50px 20px; color:var(--muted); }
.nucleo-locked-panel svg { color:var(--muted); margin-bottom:10px; }

/* Settings */
.nucleo-preset-grid { display:grid; grid-template-columns: repeat(3, 1fr); gap:10px; margin-bottom:8px; }
.nucleo-preset-card { border:1px solid var(--line); border-radius:9px; padding:13px 14px; cursor:pointer; background:#fff; transition: border-color 0.15s ease, background 0.15s ease; }
.nucleo-preset-card:hover { border-color: var(--accent-dim); }
.nucleo-preset-card.selected { border-color: var(--accent); background: var(--positive-bg); }
.nucleo-preset-card-title { font-weight:600; font-size:13.5px; margin-bottom:3px; }
.nucleo-preset-card-desc { font-size:12px; color:var(--muted); }

.nucleo-toggle-row { display:flex; align-items:center; justify-content:space-between; padding:13px 4px; border-bottom:1px solid var(--paper-200); }
.nucleo-toggle-row:last-child { border-bottom:none; }
.nucleo-toggle-info strong { display:block; font-size:13.5px; margin-bottom:2px; }
.nucleo-toggle-info span { font-size:12.5px; color:var(--muted); }
.nucleo-switch { position:relative; width:40px; height:22px; border-radius:99px; background:var(--line); border:none; cursor:pointer; flex-shrink:0; transition: background 0.15s ease; }
.nucleo-switch.on { background: var(--accent); }
.nucleo-switch-knob { position:absolute; top:2px; left:2px; width:18px; height:18px; border-radius:50%; background:#fff; transition: transform 0.15s ease; }
.nucleo-switch.on .nucleo-switch-knob { transform: translateX(18px); }

.nucleo-loading { display:flex; align-items:center; justify-content:center; height:100vh; color:var(--muted); font-size:14px; }

@media (max-width: 880px) {
  .nucleo-shell { flex-direction:column; }
  .nucleo-sidebar { width:100%; flex-direction:row; align-items:center; overflow-x:auto; padding:14px; }
  .nucleo-nav-section-title { display:none; }
  .nucleo-nav-spacer { display:none; }
  .nucleo-brand { padding:0 14px 0 0; border-right:1px solid rgba(255,255,255,0.1); margin-right:10px; }
  .nucleo-main { padding: 22px 16px 40px 16px; }
  .nucleo-cards { grid-template-columns: 1fr 1fr; }
  .nucleo-grid-2 { grid-template-columns: 1fr; }
  .nucleo-preset-grid { grid-template-columns: 1fr; }
}
`;

/* ---------------------------------------------------------------- */
/* Componente principal                                              */
/* ---------------------------------------------------------------- */

export default function App() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  const [transactions, setTransactions] = useState([]);
  const [balanceExtra, setBalanceExtra] = useState(DEFAULT_BALANCE_EXTRA);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [inventory, setInventory] = useState([]);
  const [projectionsCfg, setProjectionsCfg] = useState(DEFAULT_PROJECTIONS);
  const [specificCosts, setSpecificCosts] = useState([]);
  const [confirmingReset, setConfirmingReset] = useState(false);

  /* Carga inicial desde almacenamiento persistente */
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        if (cancelled) return;
        try {
          const core = localStorage.getItem("nucleo-core-data");
          if (core) {
            const parsed = JSON.parse(core);
            if (parsed.transactions) setTransactions(parsed.transactions);
            if (parsed.balanceExtra) setBalanceExtra(parsed.balanceExtra);
          }
          const sett = localStorage.getItem("nucleo-settings-data");
          if (sett) setSettings((prev) => ({ ...prev, ...JSON.parse(sett) }));
          const mods = localStorage.getItem("nucleo-modules-data");
          if (mods) {
            const parsed = JSON.parse(mods);
            if (parsed.inventory) setInventory(parsed.inventory);
            if (parsed.projections) setProjectionsCfg(parsed.projections);
            if (parsed.specificCosts) setSpecificCosts(parsed.specificCosts);
          }
        } catch (e) { console.error("Error cargando localStorage:", e); }
      } catch (e) {
        console.error("Error cargando datos:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  /* Persistencia con debounce */
  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => {
      try { localStorage.setItem("nucleo-core-data", JSON.stringify({ transactions, balanceExtra })); } catch(e) { console.error(e); }
    }, 500);
    return () => clearTimeout(t);
  }, [transactions, balanceExtra, loading]);

  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => {
      try { localStorage.setItem("nucleo-settings-data", JSON.stringify(settings)); } catch(e) { console.error(e); }
    }, 500);
    return () => clearTimeout(t);
  }, [settings, loading]);

  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => {
      try { localStorage.setItem("nucleo-modules-data", JSON.stringify({ inventory, projections: projectionsCfg, specificCosts })); } catch(e) { console.error(e); }
    }, 500);
    return () => clearTimeout(t);
  }, [inventory, projectionsCfg, specificCosts, loading]);

  /* Si un módulo se desactiva mientras está activo, volver al dashboard */
  useEffect(() => {
    const moduleTabs = { inventario: "inventario", proyecciones: "proyecciones", costosEspecificos: "costos" };
    const tabToModule = { inventario: "inventario", proyecciones: "proyecciones", costos: "costosEspecificos" };
    const mod = tabToModule[activeTab];
    if (mod && !settings.enabledModules[mod]) setActiveTab("dashboard");
  }, [settings.enabledModules, activeTab]);

  /* ---------------- Cálculos derivados ---------------- */

  const totalIngresos = useMemo(() => transactions.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0), [transactions]);
  const totalGastos = useMemo(() => transactions.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0), [transactions]);
  const flujoNeto = totalIngresos - totalGastos;
  const saldoActual = (Number(settings.saldoInicial) || 0) + flujoNeto;

  const monthlyData = useMemo(() => {
    const map = {};
    transactions.forEach((t) => {
      const ym = t.date.slice(0, 7);
      if (!map[ym]) map[ym] = { ym, ingresos: 0, gastos: 0 };
      if (t.type === "income") map[ym].ingresos += Number(t.amount);
      else map[ym].gastos += Number(t.amount);
    });
    const arr = Object.values(map).sort((a, b) => a.ym.localeCompare(b.ym));
    let saldo = Number(settings.saldoInicial) || 0;
    return arr.map((m) => {
      saldo += m.ingresos - m.gastos;
      return { ...m, label: monthLabel(m.ym), neto: m.ingresos - m.gastos, saldoAcumulado: saldo };
    });
  }, [transactions, settings.saldoInicial]);

  const expenseByCategory = useMemo(() => {
    const map = {};
    transactions.filter(t => t.type === "expense").forEach((t) => {
      map[t.category] = (map[t.category] || 0) + Number(t.amount);
    });
    const arr = Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    if (arr.length > 6) {
      const top = arr.slice(0, 5);
      const restoSum = arr.slice(5).reduce((s, x) => s + x.value, 0);
      top.push({ name: "Otros", value: restoSum });
      return top;
    }
    return arr;
  }, [transactions]);

  const recentTape = useMemo(() => [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14), [transactions]);

  const inventoryValue = useMemo(() => inventory.reduce((s, i) => s + Number(i.quantity) * Number(i.unitCost), 0), [inventory]);
  const lowStockCount = useMemo(() => inventory.filter(i => Number(i.quantity) <= 5).length, [inventory]);

  const specificCostsMonthlyTotal = useMemo(() => specificCosts.reduce((s, c) => {
    const amt = Number(c.amount) || 0;
    if (c.frequency === "trimestral") return s + amt / 3;
    if (c.frequency === "anual") return s + amt / 12;
    return s + amt;
  }, 0), [specificCosts]);

  const projectionSeries = useMemo(() => {
    const hist = monthlyData.slice(-6).map(m => ({ label: m.label, value: m.ingresos, tipo: "Histórico" }));
    const lastVal = hist.length ? hist[hist.length - 1].value : totalIngresos || 0;
    const lastYm = monthlyData.length ? monthlyData[monthlyData.length - 1].ym : todayISO().slice(0, 7);
    const [ly, lm] = lastYm.split("-").map(Number);
    const rate = (Number(projectionsCfg.growthRate) || 0) / 100;
    const months = Number(projectionsCfg.monthsToProject) || 6;
    const proj = [];
    let val = lastVal || 100;
    let y = ly, m = lm;
    for (let i = 0; i < months; i++) {
      m += 1;
      if (m > 12) { m = 1; y += 1; }
      val = val * (1 + rate);
      proj.push({ label: monthLabel(`${y}-${String(m).padStart(2, "0")}`), value: Math.round(val * 100) / 100, tipo: "Proyectado" });
    }
    return [...hist, ...proj];
  }, [monthlyData, projectionsCfg, totalIngresos]);

  /* ---------------- Mutaciones ---------------- */

  function addTransaction(type, data) {
    const tx = { id: generateId(), type, ...data };
    setTransactions(prev => [tx, ...prev]);
  }
  function deleteTransaction(id) {
    setTransactions(prev => prev.filter(t => t.id !== id));
  }
  function addInventoryItem(item) {
    setInventory(prev => [{ id: generateId(), ...item }, ...prev]);
  }
  function deleteInventoryItem(id) {
    setInventory(prev => prev.filter(i => i.id !== id));
  }
  function addSpecificCost(cost) {
    setSpecificCosts(prev => [{ id: generateId(), ...cost }, ...prev]);
  }
  function deleteSpecificCost(id) {
    setSpecificCosts(prev => prev.filter(c => c.id !== id));
  }
  function toggleModule(key) {
    setSettings(prev => ({ ...prev, enabledModules: { ...prev.enabledModules, [key]: !prev.enabledModules[key] } }));
  }
  function applyPreset(presetId) {
    const preset = BUSINESS_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    setSettings(prev => ({ ...prev, businessType: presetId, enabledModules: { ...preset.modules } }));
  }
  async function resetAll() {
    setTransactions([]);
    setBalanceExtra(DEFAULT_BALANCE_EXTRA);
    setSettings(DEFAULT_SETTINGS);
    setInventory([]);
    setProjectionsCfg(DEFAULT_PROJECTIONS);
    setSpecificCosts([]);
    setConfirmingReset(false);
    try {
      localStorage.removeItem("nucleo-core-data");
      localStorage.removeItem("nucleo-settings-data");
      localStorage.removeItem("nucleo-modules-data");
    } catch (e) { console.error(e); }
  }

  if (loading) {
    return (
      <div className="nucleo-app">
        <style>{STYLES}</style>
        <div className="nucleo-loading">Cargando tu información financiera…</div>
      </div>
    );
  }

  const moneyFmt = (v) => formatMoney(v, settings.moneda || "$");

  /* ---------------- Navegación ---------------- */

  const NAV_CORE = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "ingresos", label: "Ingresos", icon: ArrowUpCircle },
    { id: "gastos", label: "Gastos", icon: ArrowDownCircle },
    { id: "flujo", label: "Flujo de caja", icon: Waves },
    { id: "balance", label: "Balance", icon: Scale },
    { id: "reportes", label: "Reportes", icon: FileBarChart2 },
  ];
  const NAV_MODULES = [
    { id: "inventario", label: "Inventario", icon: Boxes, modKey: "inventario" },
    { id: "proyecciones", label: "Proyecciones de ventas", icon: TrendingUp, modKey: "proyecciones" },
    { id: "costos", label: "Costos específicos", icon: ClipboardList, modKey: "costosEspecificos" },
  ];

  return (
    <div className="nucleo-app">
      <style>{STYLES}</style>
      <div className="nucleo-shell">

        <nav className="nucleo-sidebar">
          <div className="nucleo-brand">
            <div className="nucleo-brand-mark">N</div>
            <div>
              <div className="nucleo-brand-text">NÚCLEO</div>
              <div className="nucleo-brand-sub">{settings.nombreNegocio || "Sistema financiero"}</div>
            </div>
          </div>

          <div className="nucleo-nav-section-title">Núcleo</div>
          {NAV_CORE.map(item => (
            <button
              key={item.id}
              className={`nucleo-nav-item ${activeTab === item.id ? "active" : ""}`}
              onClick={() => setActiveTab(item.id)}
            >
              <item.icon size={16} />
              {item.label}
            </button>
          ))}

          <div className="nucleo-nav-section-title">Módulos</div>
          {NAV_MODULES.map(item => {
            const enabled = settings.enabledModules[item.modKey];
            return (
              <button
                key={item.id}
                className={`nucleo-nav-item ${activeTab === item.id ? "active" : ""} ${enabled ? "" : "locked"}`}
                onClick={() => enabled ? setActiveTab(item.id) : setActiveTab("configuracion")}
                title={enabled ? "" : "Actívalo en Configuración"}
              >
                {enabled ? <item.icon size={16} /> : <Lock size={14} />}
                {item.label}
              </button>
            );
          })}

          <div className="nucleo-nav-spacer" />
          <button
            className={`nucleo-nav-item ${activeTab === "configuracion" ? "active" : ""}`}
            onClick={() => setActiveTab("configuracion")}
          >
            <SettingsIcon size={16} />
            Configuración
          </button>
        </nav>

        <main className="nucleo-main">
          {activeTab === "dashboard" && (
            <DashboardPanel
              settings={settings} moneyFmt={moneyFmt}
              totalIngresos={totalIngresos} totalGastos={totalGastos} flujoNeto={flujoNeto} saldoActual={saldoActual}
              monthlyData={monthlyData} expenseByCategory={expenseByCategory} recentTape={recentTape}
            />
          )}
          {activeTab === "ingresos" && (
            <TransactionPanel
              type="income" title="Ingresos" eyebrow="Núcleo · Dinero que entra"
              desc="Registra cada venta, servicio o ingreso de tu negocio para mantener tu flujo de caja al día."
              categories={INCOME_CATEGORIES} transactions={transactions.filter(t => t.type === "income")}
              onAdd={(d) => addTransaction("income", d)} onDelete={deleteTransaction} moneyFmt={moneyFmt}
            />
          )}
          {activeTab === "gastos" && (
            <TransactionPanel
              type="expense" title="Gastos" eyebrow="Núcleo · Dinero que sale"
              desc="Registra cada gasto operativo, de nómina o proveedor para conocer en qué se va tu dinero."
              categories={EXPENSE_CATEGORIES} transactions={transactions.filter(t => t.type === "expense")}
              onAdd={(d) => addTransaction("expense", d)} onDelete={deleteTransaction} moneyFmt={moneyFmt}
            />
          )}
          {activeTab === "flujo" && (
            <CashFlowPanel monthlyData={monthlyData} moneyFmt={moneyFmt} saldoInicial={Number(settings.saldoInicial) || 0} />
          )}
          {activeTab === "balance" && (
            <BalancePanel
              saldoActual={saldoActual} balanceExtra={balanceExtra} setBalanceExtra={setBalanceExtra}
              inventoryValue={inventoryValue} inventarioActivo={settings.enabledModules.inventario} moneyFmt={moneyFmt}
            />
          )}
          {activeTab === "reportes" && (
            <ReportsPanel
              monthlyData={monthlyData} expenseByCategory={expenseByCategory} moneyFmt={moneyFmt}
              totalIngresos={totalIngresos} totalGastos={totalGastos}
            />
          )}
          {activeTab === "inventario" && (
            settings.enabledModules.inventario ? (
              <InventoryPanel inventory={inventory} onAdd={addInventoryItem} onDelete={deleteInventoryItem} moneyFmt={moneyFmt} />
            ) : <LockedPanel onGo={() => setActiveTab("configuracion")} name="Inventario" />
          )}
          {activeTab === "proyecciones" && (
            settings.enabledModules.proyecciones ? (
              <ProjectionsPanel cfg={projectionsCfg} setCfg={setProjectionsCfg} series={projectionSeries} moneyFmt={moneyFmt} />
            ) : <LockedPanel onGo={() => setActiveTab("configuracion")} name="Proyecciones de ventas" />
          )}
          {activeTab === "costos" && (
            settings.enabledModules.costosEspecificos ? (
              <SpecificCostsPanel costs={specificCosts} onAdd={addSpecificCost} onDelete={deleteSpecificCost} total={specificCostsMonthlyTotal} moneyFmt={moneyFmt} />
            ) : <LockedPanel onGo={() => setActiveTab("configuracion")} name="Costos específicos" />
          )}
          {activeTab === "configuracion" && (
            <ConfigPanel
              settings={settings} setSettings={setSettings} applyPreset={applyPreset} toggleModule={toggleModule}
              confirmingReset={confirmingReset} setConfirmingReset={setConfirmingReset} resetAll={resetAll}
            />
          )}
        </main>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Subcomponentes                                                     */
/* ---------------------------------------------------------------- */

function PageHeader({ eyebrow, title, desc }) {
  return (
    <div className="nucleo-page-header">
      {eyebrow && <div className="nucleo-eyebrow">{eyebrow}</div>}
      <h1 className="nucleo-page-title">{title}</h1>
      {desc && <p className="nucleo-page-desc">{desc}</p>}
    </div>
  );
}

function LockedPanel({ name, onGo }) {
  return (
    <div>
      <PageHeader eyebrow="Módulo desactivado" title={name} />
      <div className="nucleo-panel nucleo-locked-panel">
        <Lock size={28} />
        <p>Este módulo no está activo para tu tipo de negocio.</p>
        <button className="nucleo-btn" onClick={onGo} style={{ marginTop: 10 }}>Activar en Configuración</button>
      </div>
    </div>
  );
}

function DashboardPanel({ settings, moneyFmt, totalIngresos, totalGastos, flujoNeto, saldoActual, monthlyData, expenseByCategory, recentTape }) {
  return (
    <div>
      <PageHeader eyebrow="Núcleo · Vista general" title="Dashboard" desc="Tu posición financiera de un vistazo: lo que entra, lo que sale y lo que queda." />

      <div className="nucleo-tape-wrap">
        <div className="nucleo-eyebrow" style={{ marginBottom: 6 }}>Últimos movimientos</div>
        <div className="nucleo-tape nucleo-mono">
          {recentTape.length === 0 && <div className="nucleo-tape-empty">Aún no hay movimientos. Registra tu primer ingreso o gasto para verlo aquí.</div>}
          {recentTape.map(t => (
            <div className="nucleo-tape-item" key={t.id}>
              <span className="nucleo-tape-date">{t.date.slice(8, 10)}/{t.date.slice(5, 7)}</span>
              <span className="nucleo-tape-cat" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>{t.category}</span>
              <span className="nucleo-tape-amt" style={{ color: t.type === "income" ? PALETTE.positive : PALETTE.negative }}>
                {t.type === "income" ? "+" : "−"}{moneyFmt(t.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="nucleo-cards">
        <div className="nucleo-card">
          <div className="nucleo-card-label">Ingresos totales</div>
          <div className="nucleo-card-value positive nucleo-mono">{moneyFmt(totalIngresos)}</div>
        </div>
        <div className="nucleo-card">
          <div className="nucleo-card-label">Gastos totales</div>
          <div className="nucleo-card-value negative nucleo-mono">{moneyFmt(totalGastos)}</div>
        </div>
        <div className="nucleo-card">
          <div className="nucleo-card-label">Flujo neto</div>
          <div className={`nucleo-card-value nucleo-mono ${flujoNeto >= 0 ? "positive" : "negative"}`}>{moneyFmt(flujoNeto)}</div>
        </div>
        <div className="nucleo-card">
          <div className="nucleo-card-label">Saldo actual</div>
          <div className="nucleo-card-value nucleo-mono" style={{ color: "var(--ink-900)" }}>{moneyFmt(saldoActual)}</div>
        </div>
      </div>

      <div className="nucleo-grid-2">
        <div className="nucleo-panel">
          <div className="nucleo-panel-title">Flujo de caja acumulado</div>
          {monthlyData.length === 0 ? (
            <div className="nucleo-empty">Registra movimientos para ver la evolución de tu caja.</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="saldoGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={PALETTE.accent} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={PALETTE.accent} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#E3DCCC" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={{ stroke: "#DAD3C2" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} width={50} />
                <Tooltip formatter={(v) => moneyFmt(v)} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #DAD3C2" }} />
                <Area type="monotone" dataKey="saldoAcumulado" name="Saldo" stroke={PALETTE.accent} fill="url(#saldoGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="nucleo-panel">
          <div className="nucleo-panel-title">Gastos por categoría</div>
          {expenseByCategory.length === 0 ? (
            <div className="nucleo-empty">Aún no hay gastos registrados.</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={expenseByCategory} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                  {expenseByCategory.map((entry, i) => <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => moneyFmt(v)} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #DAD3C2" }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

function TransactionPanel({ type, title, eyebrow, desc, categories, transactions, onAdd, onDelete, moneyFmt }) {
  const [date, setDate] = useState(todayISO());
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  function handleAdd() {
    if (!date) { setError("Elige una fecha."); return; }
    if (!category.trim()) { setError("Escribe o elige una categoría."); return; }
    const parsed = parseDecimal(amount);
    if (amount.trim() === "" || Number.isNaN(parsed) || parsed <= 0) {
      setError("El monto debe ser un número mayor a 0 (puedes usar coma o punto).");
      return;
    }
    setError("");
    onAdd({ date, category: category.trim(), amount: parsed, description: description.trim() });
    setCategory(""); setAmount(""); setDescription("");
  }
  function handleEnter(e) { if (e.key === "Enter") handleAdd(); }

  const total = transactions.reduce((s, t) => s + Number(t.amount), 0);
  const datalistId = `cats-${type}`;

  return (
    <div>
      <PageHeader eyebrow={eyebrow} title={title} desc={desc} />

      <div className="nucleo-panel">
        <div className="nucleo-panel-title">Registrar {type === "income" ? "ingreso" : "gasto"}</div>
        <div className="nucleo-form">
          <div className="nucleo-field">
            <label>Fecha</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} onKeyDown={handleEnter} />
          </div>
          <div className="nucleo-field">
            <label>Categoría</label>
            <input list={datalistId} value={category} onChange={(e) => setCategory(e.target.value)} onKeyDown={handleEnter} placeholder="Ej. Ventas" />
            <datalist id={datalistId}>
              {categories.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div className="nucleo-field">
            <label>Monto</label>
            <input type="text" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} onKeyDown={handleEnter} placeholder="0.00" />
          </div>
          <div className="nucleo-field" style={{ flex: 1, minWidth: 180 }}>
            <label>Descripción (opcional)</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} onKeyDown={handleEnter} placeholder="Detalle breve" style={{ width: "100%" }} />
          </div>
          <button type="button" onClick={handleAdd} className="nucleo-btn"><Plus size={15} />Agregar</button>
        </div>
        {error && (
          <div style={{ marginTop: 10, fontSize: 12.5, color: "var(--negative)", display: "flex", alignItems: "center", gap: 6 }}>
            <AlertTriangle size={13} />{error}
          </div>
        )}
      </div>

      <div className="nucleo-panel">
        <div className="nucleo-panel-title">Historial · Total {moneyFmt(total)}</div>
        {transactions.length === 0 ? (
          <div className="nucleo-empty"><strong>Sin movimientos todavía</strong>Usa el formulario de arriba para registrar el primero.</div>
        ) : (
          <table className="nucleo-table">
            <thead><tr><th>Fecha</th><th>Categoría</th><th>Descripción</th><th>Monto</th><th></th></tr></thead>
            <tbody>
              {[...transactions].sort((a, b) => b.date.localeCompare(a.date)).map(t => (
                <tr key={t.id}>
                  <td className="nucleo-mono">{t.date}</td>
                  <td>{t.category}</td>
                  <td style={{ color: "var(--muted)" }}>{t.description || "—"}</td>
                  <td className={`nucleo-mono ${type === "income" ? "amt-pos" : "amt-neg"}`}>{moneyFmt(t.amount)}</td>
                  <td><button className="nucleo-icon-btn" onClick={() => onDelete(t.id)} title="Eliminar"><Trash2 size={15} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function CashFlowPanel({ monthlyData, moneyFmt, saldoInicial }) {
  return (
    <div>
      <PageHeader eyebrow="Núcleo · Liquidez" title="Flujo de caja" desc="Cómo se mueve tu efectivo mes a mes, partiendo de tu saldo inicial." />
      <div className="nucleo-panel">
        <div className="nucleo-panel-title">Ingresos vs. gastos por mes</div>
        {monthlyData.length === 0 ? (
          <div className="nucleo-empty">Aún no hay suficientes datos para mostrar el flujo de caja.</div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyData}>
              <CartesianGrid stroke="#E3DCCC" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={{ stroke: "#DAD3C2" }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} width={50} />
              <Tooltip formatter={(v) => moneyFmt(v)} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #DAD3C2" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="ingresos" name="Ingresos" fill={PALETTE.positive} radius={[3, 3, 0, 0]} />
              <Bar dataKey="gastos" name="Gastos" fill={PALETTE.negative} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="nucleo-panel">
        <div className="nucleo-panel-title">Detalle mensual · Saldo inicial {moneyFmt(saldoInicial)}</div>
        {monthlyData.length === 0 ? (
          <div className="nucleo-empty">Sin datos mensuales aún.</div>
        ) : (
          <table className="nucleo-table">
            <thead><tr><th>Mes</th><th>Ingresos</th><th>Gastos</th><th>Flujo neto</th><th>Saldo acumulado</th></tr></thead>
            <tbody>
              {[...monthlyData].reverse().map(m => (
                <tr key={m.ym}>
                  <td>{m.label}</td>
                  <td className="nucleo-mono amt-pos">{moneyFmt(m.ingresos)}</td>
                  <td className="nucleo-mono amt-neg">{moneyFmt(m.gastos)}</td>
                  <td className={`nucleo-mono ${m.neto >= 0 ? "amt-pos" : "amt-neg"}`}>{moneyFmt(m.neto)}</td>
                  <td className="nucleo-mono">{moneyFmt(m.saldoAcumulado)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function BalancePanel({ saldoActual, balanceExtra, setBalanceExtra, inventoryValue, inventarioActivo, moneyFmt }) {
  function update(key, val) {
    setBalanceExtra(prev => ({ ...prev, [key]: val === "" ? "" : Number(val) }));
  }
  const otrosActivos = Number(balanceExtra.otrosActivos || 0);
  const cuentasPorCobrar = Number(balanceExtra.cuentasPorCobrar || 0);
  const deudas = Number(balanceExtra.deudas || 0);
  const cuentasPorPagar = Number(balanceExtra.cuentasPorPagar || 0);
  const otrosPasivos = Number(balanceExtra.otrosPasivos || 0);
  const invVal = inventarioActivo ? inventoryValue : 0;

  const totalActivos = saldoActual + cuentasPorCobrar + invVal + otrosActivos;
  const totalPasivos = deudas + cuentasPorPagar + otrosPasivos;
  const patrimonio = totalActivos - totalPasivos;

  return (
    <div>
      <PageHeader eyebrow="Núcleo · Posición financiera" title="Balance" desc="Lo que tu negocio posee frente a lo que debe, en un momento dado." />
      <div className="nucleo-grid-2">
        <div className="nucleo-panel">
          <div className="nucleo-panel-title">Activos</div>
          <table className="nucleo-table">
            <tbody>
              <tr><td>Caja / banco (calculado)</td><td className="nucleo-mono amt-pos">{moneyFmt(saldoActual)}</td></tr>
              {inventarioActivo && <tr><td>Inventario (módulo)</td><td className="nucleo-mono amt-pos">{moneyFmt(invVal)}</td></tr>}
              <tr>
                <td>Cuentas por cobrar</td>
                <td><input type="number" step="0.01" className="nucleo-mono" style={{ width: 130, padding: "5px 8px", border: "1px solid var(--line)", borderRadius: 6 }} value={balanceExtra.cuentasPorCobrar} onChange={(e) => update("cuentasPorCobrar", e.target.value)} /></td>
              </tr>
              <tr>
                <td>Otros activos</td>
                <td><input type="number" step="0.01" className="nucleo-mono" style={{ width: 130, padding: "5px 8px", border: "1px solid var(--line)", borderRadius: 6 }} value={balanceExtra.otrosActivos} onChange={(e) => update("otrosActivos", e.target.value)} /></td>
              </tr>
              <tr><td><strong>Total activos</strong></td><td className="nucleo-mono" style={{ fontWeight: 700 }}>{moneyFmt(totalActivos)}</td></tr>
            </tbody>
          </table>
        </div>
        <div className="nucleo-panel">
          <div className="nucleo-panel-title">Pasivos</div>
          <table className="nucleo-table">
            <tbody>
              <tr>
                <td>Deudas / préstamos</td>
                <td><input type="number" step="0.01" className="nucleo-mono" style={{ width: 130, padding: "5px 8px", border: "1px solid var(--line)", borderRadius: 6 }} value={balanceExtra.deudas} onChange={(e) => update("deudas", e.target.value)} /></td>
              </tr>
              <tr>
                <td>Cuentas por pagar</td>
                <td><input type="number" step="0.01" className="nucleo-mono" style={{ width: 130, padding: "5px 8px", border: "1px solid var(--line)", borderRadius: 6 }} value={balanceExtra.cuentasPorPagar} onChange={(e) => update("cuentasPorPagar", e.target.value)} /></td>
              </tr>
              <tr>
                <td>Otros pasivos</td>
                <td><input type="number" step="0.01" className="nucleo-mono" style={{ width: 130, padding: "5px 8px", border: "1px solid var(--line)", borderRadius: 6 }} value={balanceExtra.otrosPasivos} onChange={(e) => update("otrosPasivos", e.target.value)} /></td>
              </tr>
              <tr><td><strong>Total pasivos</strong></td><td className="nucleo-mono" style={{ fontWeight: 700 }}>{moneyFmt(totalPasivos)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="nucleo-cards" style={{ gridTemplateColumns: "1fr" }}>
        <div className="nucleo-card">
          <div className="nucleo-card-label">Patrimonio (Activos − Pasivos)</div>
          <div className={`nucleo-card-value nucleo-mono ${patrimonio >= 0 ? "positive" : "negative"}`}>{moneyFmt(patrimonio)}</div>
        </div>
      </div>
    </div>
  );
}

function ReportsPanel({ monthlyData, expenseByCategory, moneyFmt, totalIngresos, totalGastos }) {
  const margen = totalIngresos > 0 ? ((totalIngresos - totalGastos) / totalIngresos) * 100 : 0;
  const topCategoria = expenseByCategory[0];
  return (
    <div>
      <PageHeader eyebrow="Núcleo · Reportes clave" title="Reportes" desc="Indicadores que resumen la salud financiera de tu negocio." />
      <div className="nucleo-cards">
        <div className="nucleo-card">
          <div className="nucleo-card-label">Margen neto</div>
          <div className={`nucleo-card-value nucleo-mono ${margen >= 0 ? "positive" : "negative"}`}>{margen.toFixed(1)}%</div>
        </div>
        <div className="nucleo-card">
          <div className="nucleo-card-label">Mayor categoría de gasto</div>
          <div className="nucleo-card-value" style={{ fontSize: 17 }}>{topCategoria ? topCategoria.name : "—"}</div>
        </div>
        <div className="nucleo-card">
          <div className="nucleo-card-label">Meses con datos</div>
          <div className="nucleo-card-value nucleo-mono">{monthlyData.length}</div>
        </div>
        <div className="nucleo-card">
          <div className="nucleo-card-label">Promedio mensual neto</div>
          <div className="nucleo-card-value nucleo-mono">{moneyFmt(monthlyData.length ? (totalIngresos - totalGastos) / monthlyData.length : 0)}</div>
        </div>
      </div>
      <div className="nucleo-panel">
        <div className="nucleo-panel-title">Ingresos vs. gastos — evolución completa</div>
        {monthlyData.length === 0 ? (
          <div className="nucleo-empty">Aún no hay datos suficientes para generar reportes.</div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyData}>
              <CartesianGrid stroke="#E3DCCC" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={{ stroke: "#DAD3C2" }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} width={50} />
              <Tooltip formatter={(v) => moneyFmt(v)} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #DAD3C2" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="ingresos" name="Ingresos" fill={PALETTE.positive} radius={[3, 3, 0, 0]} />
              <Bar dataKey="gastos" name="Gastos" fill={PALETTE.negative} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="nucleo-panel">
        <div className="nucleo-panel-title">Gastos por categoría</div>
        {expenseByCategory.length === 0 ? (
          <div className="nucleo-empty">Sin gastos registrados aún.</div>
        ) : (
          <table className="nucleo-table">
            <thead><tr><th>Categoría</th><th>Monto</th><th>% del total</th></tr></thead>
            <tbody>
              {expenseByCategory.map(c => (
                <tr key={c.name}>
                  <td>{c.name}</td>
                  <td className="nucleo-mono amt-neg">{moneyFmt(c.value)}</td>
                  <td className="nucleo-mono">{totalGastos > 0 ? ((c.value / totalGastos) * 100).toFixed(1) : "0.0"}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function InventoryPanel({ inventory, onAdd, onDelete, moneyFmt }) {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [error, setError] = useState("");

  function handleAdd() {
    if (!name.trim()) { setError("Escribe el nombre del producto."); return; }
    const qty = parseDecimal(quantity);
    const cost = parseDecimal(unitCost);
    if (quantity.trim() === "" || Number.isNaN(qty) || qty < 0) { setError("La cantidad debe ser un número válido."); return; }
    if (unitCost.trim() === "" || Number.isNaN(cost) || cost < 0) { setError("El costo unitario debe ser un número válido."); return; }
    const price = unitPrice.trim() === "" ? 0 : parseDecimal(unitPrice);
    setError("");
    onAdd({ name: name.trim(), sku: sku.trim(), quantity: qty, unitCost: cost, unitPrice: Number.isNaN(price) ? 0 : price });
    setName(""); setSku(""); setQuantity(""); setUnitCost(""); setUnitPrice("");
  }
  function handleEnter(e) { if (e.key === "Enter") handleAdd(); }

  const totalValue = inventory.reduce((s, i) => s + Number(i.quantity) * Number(i.unitCost), 0);
  const lowStock = inventory.filter(i => Number(i.quantity) <= 5);

  return (
    <div>
      <PageHeader eyebrow="Módulo · Comercio, restauración, manufactura" title="Inventario" desc="Controla existencias, costos y valor de tu inventario." />
      <div className="nucleo-cards" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="nucleo-card"><div className="nucleo-card-label">Valor total</div><div className="nucleo-card-value nucleo-mono">{moneyFmt(totalValue)}</div></div>
        <div className="nucleo-card"><div className="nucleo-card-label">Productos</div><div className="nucleo-card-value nucleo-mono">{inventory.length}</div></div>
        <div className="nucleo-card"><div className="nucleo-card-label">Bajo stock (≤5)</div><div className={`nucleo-card-value nucleo-mono ${lowStock.length ? "negative" : ""}`}>{lowStock.length}</div></div>
      </div>
      <div className="nucleo-panel">
        <div className="nucleo-panel-title">Agregar producto</div>
        <div className="nucleo-form">
          <div className="nucleo-field"><label>Producto</label><input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={handleEnter} placeholder="Nombre" /></div>
          <div className="nucleo-field"><label>SKU (opcional)</label><input value={sku} onChange={(e) => setSku(e.target.value)} onKeyDown={handleEnter} placeholder="SKU" /></div>
          <div className="nucleo-field"><label>Cantidad</label><input type="text" inputMode="decimal" value={quantity} onChange={(e) => setQuantity(e.target.value)} onKeyDown={handleEnter} /></div>
          <div className="nucleo-field"><label>Costo unitario</label><input type="text" inputMode="decimal" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} onKeyDown={handleEnter} /></div>
          <div className="nucleo-field"><label>Precio venta</label><input type="text" inputMode="decimal" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} onKeyDown={handleEnter} /></div>
          <button type="button" onClick={handleAdd} className="nucleo-btn"><Plus size={15} />Agregar</button>
        </div>
        {error && (
          <div style={{ marginTop: 10, fontSize: 12.5, color: "var(--negative)", display: "flex", alignItems: "center", gap: 6 }}>
            <AlertTriangle size={13} />{error}
          </div>
        )}
      </div>
      <div className="nucleo-panel">
        <div className="nucleo-panel-title">Existencias</div>
        {inventory.length === 0 ? (
          <div className="nucleo-empty"><strong>Sin productos aún</strong>Agrega tu primer producto arriba.</div>
        ) : (
          <table className="nucleo-table">
            <thead><tr><th>Producto</th><th>SKU</th><th>Cantidad</th><th>Costo</th><th>Precio</th><th>Valor</th><th>Margen</th><th></th><th></th></tr></thead>
            <tbody>
              {inventory.map(i => {
                const value = Number(i.quantity) * Number(i.unitCost);
                const margin = Number(i.unitPrice) > 0 ? ((Number(i.unitPrice) - Number(i.unitCost)) / Number(i.unitPrice)) * 100 : null;
                const low = Number(i.quantity) <= 5;
                return (
                  <tr key={i.id}>
                    <td>{i.name}</td>
                    <td style={{ color: "var(--muted)" }}>{i.sku || "—"}</td>
                    <td className="nucleo-mono">{i.quantity}</td>
                    <td className="nucleo-mono">{moneyFmt(i.unitCost)}</td>
                    <td className="nucleo-mono">{moneyFmt(i.unitPrice)}</td>
                    <td className="nucleo-mono">{moneyFmt(value)}</td>
                    <td className="nucleo-mono">{margin === null ? "—" : `${margin.toFixed(0)}%`}</td>
                    <td>{low && <span className="nucleo-badge low"><AlertTriangle size={11} />Bajo</span>}</td>
                    <td><button className="nucleo-icon-btn" onClick={() => onDelete(i.id)}><Trash2 size={15} /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function ProjectionsPanel({ cfg, setCfg, series, moneyFmt }) {
  return (
    <div>
      <PageHeader eyebrow="Módulo · Crecimiento" title="Proyecciones de ventas" desc="Estima tus próximos meses a partir de tu historial de ingresos y una tasa de crecimiento esperada." />
      <div className="nucleo-panel">
        <div className="nucleo-panel-title">Parámetros</div>
        <div className="nucleo-form">
          <div className="nucleo-field">
            <label>Crecimiento mensual esperado (%)</label>
            <input type="number" step="0.5" value={cfg.growthRate} onChange={(e) => setCfg(prev => ({ ...prev, growthRate: e.target.value }))} />
          </div>
          <div className="nucleo-field">
            <label>Meses a proyectar</label>
            <input type="number" min="1" max="24" value={cfg.monthsToProject} onChange={(e) => setCfg(prev => ({ ...prev, monthsToProject: e.target.value }))} />
          </div>
        </div>
      </div>
      <div className="nucleo-panel">
        <div className="nucleo-panel-title">Histórico + proyección</div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={series}>
            <CartesianGrid stroke="#E3DCCC" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={{ stroke: "#DAD3C2" }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} width={50} />
            <Tooltip formatter={(v) => moneyFmt(v)} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #DAD3C2" }} />
            <Bar dataKey="value" name="Ventas" radius={[3, 3, 0, 0]}>
              {series.map((d, i) => <Cell key={i} fill={d.tipo === "Histórico" ? PALETTE.accent : PALETTE.amber} fillOpacity={d.tipo === "Histórico" ? 1 : 0.65} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 12, color: "var(--muted)" }}>
          <span><span style={{ display: "inline-block", width: 10, height: 10, background: PALETTE.accent, borderRadius: 2, marginRight: 5 }} />Histórico</span>
          <span><span style={{ display: "inline-block", width: 10, height: 10, background: PALETTE.amber, opacity: 0.65, borderRadius: 2, marginRight: 5 }} />Proyectado</span>
        </div>
      </div>
    </div>
  );
}

function SpecificCostsPanel({ costs, onAdd, onDelete, total, moneyFmt }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("mensual");
  const [error, setError] = useState("");

  function handleAdd() {
    if (!name.trim()) { setError("Escribe el nombre del costo."); return; }
    const parsed = parseDecimal(amount);
    if (amount.trim() === "" || Number.isNaN(parsed) || parsed <= 0) { setError("El monto debe ser un número mayor a 0."); return; }
    setError("");
    onAdd({ name: name.trim(), amount: parsed, frequency });
    setName(""); setAmount("");
  }
  function handleEnter(e) { if (e.key === "Enter") handleAdd(); }

  return (
    <div>
      <PageHeader eyebrow="Módulo · Particular a tu negocio" title="Costos específicos" desc="Costos propios de tu rubro (materia prima, comisiones, regalías) que no encajan en categorías genéricas." />
      <div className="nucleo-cards" style={{ gridTemplateColumns: "1fr" }}>
        <div className="nucleo-card">
          <div className="nucleo-card-label">Equivalente mensual total</div>
          <div className="nucleo-card-value negative nucleo-mono">{moneyFmt(total)}</div>
        </div>
      </div>
      <div className="nucleo-panel">
        <div className="nucleo-panel-title">Agregar costo</div>
        <div className="nucleo-form">
          <div className="nucleo-field"><label>Nombre</label><input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={handleEnter} placeholder="Ej. Materia prima" /></div>
          <div className="nucleo-field"><label>Monto</label><input type="text" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} onKeyDown={handleEnter} /></div>
          <div className="nucleo-field">
            <label>Frecuencia</label>
            <select value={frequency} onChange={(e) => setFrequency(e.target.value)} onKeyDown={handleEnter}>
              <option value="mensual">Mensual</option>
              <option value="trimestral">Trimestral</option>
              <option value="anual">Anual</option>
            </select>
          </div>
          <button type="button" onClick={handleAdd} className="nucleo-btn"><Plus size={15} />Agregar</button>
        </div>
        {error && (
          <div style={{ marginTop: 10, fontSize: 12.5, color: "var(--negative)", display: "flex", alignItems: "center", gap: 6 }}>
            <AlertTriangle size={13} />{error}
          </div>
        )}
      </div>
      <div className="nucleo-panel">
        <div className="nucleo-panel-title">Costos registrados</div>
        {costs.length === 0 ? (
          <div className="nucleo-empty"><strong>Sin costos específicos aún</strong>Agrega los costos propios de tu rubro arriba.</div>
        ) : (
          <table className="nucleo-table">
            <thead><tr><th>Nombre</th><th>Monto</th><th>Frecuencia</th><th>Equiv. mensual</th><th></th></tr></thead>
            <tbody>
              {costs.map(c => {
                const monthly = c.frequency === "trimestral" ? c.amount / 3 : c.frequency === "anual" ? c.amount / 12 : c.amount;
                return (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td className="nucleo-mono">{moneyFmt(c.amount)}</td>
                    <td style={{ textTransform: "capitalize" }}>{c.frequency}</td>
                    <td className="nucleo-mono amt-neg">{moneyFmt(monthly)}</td>
                    <td><button className="nucleo-icon-btn" onClick={() => onDelete(c.id)}><Trash2 size={15} /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function ConfigPanel({ settings, setSettings, applyPreset, toggleModule, confirmingReset, setConfirmingReset, resetAll }) {
  const modules = [
    { key: "inventario", label: "Inventario", desc: "Existencias, costos y valor de productos." },
    { key: "proyecciones", label: "Proyecciones de ventas", desc: "Estimaciones futuras a partir del historial." },
    { key: "costosEspecificos", label: "Costos específicos", desc: "Costos propios de tu rubro fuera de las categorías generales." },
  ];
  return (
    <div>
      <PageHeader eyebrow="Configuración" title="Tu negocio" desc="Define el tipo de negocio y activa los módulos que necesitas. El núcleo siempre está disponible." />

      <div className="nucleo-panel">
        <div className="nucleo-panel-title">Datos generales</div>
        <div className="nucleo-form">
          <div className="nucleo-field" style={{ minWidth: 220 }}>
            <label>Nombre del negocio</label>
            <input value={settings.nombreNegocio} onChange={(e) => setSettings(prev => ({ ...prev, nombreNegocio: e.target.value }))} placeholder="Ej. Mi negocio" />
          </div>
          <div className="nucleo-field">
            <label>Símbolo de moneda</label>
            <input value={settings.moneda} onChange={(e) => setSettings(prev => ({ ...prev, moneda: e.target.value }))} style={{ width: 70 }} />
          </div>
          <div className="nucleo-field">
            <label>Saldo inicial de caja</label>
            <input type="number" step="0.01" value={settings.saldoInicial} onChange={(e) => setSettings(prev => ({ ...prev, saldoInicial: e.target.value === "" ? "" : Number(e.target.value) }))} />
          </div>
        </div>
      </div>

      <div className="nucleo-panel">
        <div className="nucleo-panel-title">Tipo de negocio</div>
        <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: -8, marginBottom: 12 }}>Elegir un tipo sugiere qué módulos activar — luego puedes ajustarlos manualmente abajo.</p>
        <div className="nucleo-preset-grid">
          {BUSINESS_PRESETS.map(p => (
            <div key={p.id} className={`nucleo-preset-card ${settings.businessType === p.id ? "selected" : ""}`} onClick={() => applyPreset(p.id)}>
              <div className="nucleo-preset-card-title">{p.label}</div>
              <div className="nucleo-preset-card-desc">{p.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="nucleo-panel">
        <div className="nucleo-panel-title">Módulos activos</div>
        {modules.map(m => (
          <div className="nucleo-toggle-row" key={m.key}>
            <div className="nucleo-toggle-info">
              <strong>{m.label}</strong>
              <span>{m.desc}</span>
            </div>
            <button
              className={`nucleo-switch ${settings.enabledModules[m.key] ? "on" : ""}`}
              onClick={() => toggleModule(m.key)}
              aria-label={`Activar ${m.label}`}
            >
              <span className="nucleo-switch-knob" />
            </button>
          </div>
        ))}
      </div>

      <div className="nucleo-panel">
        <div className="nucleo-panel-title">Zona de reinicio</div>
        <p style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 12 }}>Borra todos los datos registrados (ingresos, gastos, inventario, configuración) y vuelve a empezar.</p>
        {!confirmingReset ? (
          <button className="nucleo-btn danger" onClick={() => setConfirmingReset(true)}><RotateCcw size={15} />Borrar todos los datos</button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13.5 }}>¿Confirmas que quieres borrar todo? Esta acción no se puede deshacer.</span>
            <button className="nucleo-btn danger" onClick={resetAll}><Check size={15} />Sí, borrar</button>
            <button className="nucleo-btn secondary" onClick={() => setConfirmingReset(false)}><X size={15} />Cancelar</button>
          </div>
        )}
      </div>
    </div>
  );
}
