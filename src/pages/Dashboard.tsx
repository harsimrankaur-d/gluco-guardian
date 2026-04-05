import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend } from "chart.js";
import ParticlesBackground from "@/components/ParticlesBackground";
import Navbar from "@/components/Navbar";
import StatusBar from "@/components/StatusBar";
import RiskGauge from "@/components/RiskGauge";
import GlassTiltCard from "@/components/GlassTiltCard";
import QuickLogModal from "@/components/QuickLogModal";
import {
  getSession, getLatestLog, getRiskLevel, getRiskLabel,
  getInsulinStatus, getTimeSince, generatePredictionData, getLogs
} from "@/lib/glucosense";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend);

export default function Dashboard() {
  const navigate = useNavigate();
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [timeRange, setTimeRange] = useState('3H');
  const [, setRefresh] = useState(0);

  useEffect(() => { if (!getSession()) navigate('/auth'); }, []);

  const session = getSession();
  const latestLog = getLatestLog();
  const riskScore = latestLog?.riskScore ?? 0;
  const riskLevel = getRiskLevel(riskScore);

  // Prediction chart data
  const glucose = latestLog?.glucoseReading ?? 110;
  const predData = generatePredictionData(glucose, riskScore);

  // Insights
  const insights = latestLog?.insights ?? [];

  const metricCards = [
    { label: 'Last Logged Glucose', value: latestLog?.glucoseReading ? `${latestLog.glucoseReading} mg/dL` : '—', color: '#00ffcc' },
    { label: 'Current Risk Score', value: `${riskScore}/100`, color: riskScore <= 30 ? '#00ffcc' : riskScore <= 55 ? '#FFB703' : riskScore <= 75 ? '#ff8c00' : '#E63946' },
    { label: 'Time Since Last Meal', value: latestLog ? getTimeSince(latestLog.lastMealTime) : '—', color: '#ff6ef7' },
    { label: 'Insulin Status', value: latestLog ? getInsulinStatus(latestLog.insulinTime) : '—', color: '#a97ff0' },
  ];

  if (!session) return null;

  return (
    <div className="min-h-screen page-transition relative">
      <ParticlesBackground />
      <Navbar />

      <main className="pt-20 pb-16 px-4 max-w-7xl mx-auto relative z-10">
        {/* Zone 1 — Risk Meter */}
        <div className="text-center mb-10 flex flex-col items-center">
          <div className="relative inline-block">
            <div className="absolute inset-0 rounded-full blur-3xl opacity-20" style={{ background: 'radial-gradient(circle, #a97ff0 0%, transparent 70%)' }} />
            <RiskGauge score={riskScore} size={300} />
          </div>
          <p className="text-foreground/40 text-xs font-body mt-3 tracking-widest uppercase">
            {latestLog ? 'Based on your last logged data' : 'No data logged yet'}
          </p>
          <button
            onClick={() => setLogModalOpen(true)}
            className="mt-4 px-8 py-2.5 rounded-full text-xs font-heading uppercase tracking-widest text-black font-bold transition-all duration-200 hover:scale-105 hover:shadow-lg"
            style={{ background: 'linear-gradient(135deg, #00ffcc, #a97ff0)', boxShadow: '0 0 24px #a97ff055' }}
          >
            Update My Status
          </button>
        </div>

        {/* Zone 2 — Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metricCards.map((m, i) => (
            <GlassTiltCard key={i} className="text-center group transition-all duration-300 hover:scale-[1.03]"
              style={{ borderTop: `2px solid ${m.color}22`, background: 'rgba(123,76,224,0.12)' }}>
              <div className="w-8 h-8 rounded-full mx-auto mb-3 flex items-center justify-center"
                style={{ background: `${m.color}18`, border: `1px solid ${m.color}44` }}>
                <div className="w-2 h-2 rounded-full" style={{ background: m.color, boxShadow: `0 0 6px ${m.color}` }} />
              </div>
              <p className="text-foreground/40 text-[10px] font-heading uppercase tracking-wider mb-2">{m.label}</p>
              <p className="text-2xl font-heading font-bold" style={{ color: m.color, textShadow: `0 0 12px ${m.color}66` }}>{m.value}</p>
              <svg width="60" height="20" className="mx-auto mt-2 opacity-40">
                <polyline points="0,15 10,10 20,12 30,5 40,8 50,3 60,7" fill="none" stroke={m.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </GlassTiltCard>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Zone 3 — Prediction Graph */}
          <div className="lg:col-span-2 glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-sm">Glucose Prediction</h3>
              <div className="flex gap-1">
                {['1H', '3H', '6H', '24H'].map(t => (
                  <button key={t} onClick={() => setTimeRange(t)} className={`text-[10px] font-heading px-2 py-1 rounded-md transition-colors ${timeRange === t ? 'bg-primary/20 text-primary' : 'text-foreground/30 hover:text-foreground/60'}`}>{t}</button>
                ))}
              </div>
            </div>
            {latestLog ? (
              <Line
                data={{
                  labels: predData.labels,
                  datasets: [
                    { label: 'Actual', data: predData.actual, borderColor: '#00F5D4', backgroundColor: 'rgba(0,245,212,0.05)', fill: true, tension: 0.4, spanGaps: false, pointRadius: 2 },
                    { label: 'Predicted', data: predData.predicted, borderColor: '#FFB703', borderDash: [6, 4], backgroundColor: 'rgba(255,183,3,0.03)', fill: true, tension: 0.4, pointRadius: 0 },
                    { label: 'Upper bound', data: predData.upper, borderColor: 'transparent', backgroundColor: 'rgba(255,183,3,0.05)', fill: '+1', pointRadius: 0 },
                    { label: 'Lower bound', data: predData.lower, borderColor: 'transparent', backgroundColor: 'transparent', fill: false, pointRadius: 0 },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      backgroundColor: 'rgba(60,28,140,0.97)',
                      borderColor: 'rgba(169,127,240,0.3)',
                      borderWidth: 1,
                      titleFont: { family: 'Orbitron', size: 10 },
                      bodyFont: { family: 'DM Sans', size: 11 },
                      padding: 12,
                      callbacks: { afterBody: () => riskScore > 50 ? ['⚠ Elevated risk — insulin may still be active'] : ['✓ Glucose trajectory looks stable'] },
                    },
                  },
                  scales: {
                    x: { ticks: { color: 'rgba(169,127,240,0.5)', font: { family: 'DM Sans', size: 8 }, maxTicksLimit: 8 }, grid: { color: 'rgba(123,76,224,0.08)' } },
                    y: { min: 40, max: 180, ticks: { color: 'rgba(169,127,240,0.5)', font: { family: 'DM Sans', size: 9 } }, grid: { color: 'rgba(123,76,224,0.12)' } },
                  },
                }}
              />
            ) : (
              <div className="h-48 flex items-center justify-center text-foreground/30 text-sm font-body">
                Log your first session to see predictions.
              </div>
            )}
            <div className="mt-2 flex items-center gap-4 text-[10px] text-foreground/30 font-body">
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-primary inline-block" /> Actual</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-warning inline-block" style={{ borderBottom: '1px dashed' }} /> Predicted</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-destructive inline-block" /> Hypo threshold (70 mg/dL)</span>
            </div>
          </div>

          {/* Zone 4 — AI Insight Feed */}
          <div className="glass-card p-4">
            <h3 className="font-heading text-sm mb-4">AI Insights</h3>
            {insights.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {insights.map(insight => (
                  <InsightCardComponent key={insight.id} insight={insight} />
                ))}
              </div>
            ) : (
              <p className="text-foreground/30 text-sm font-body">Log data to receive AI-generated insights.</p>
            )}
          </div>
        </div>
      </main>

      <StatusBar />
      <QuickLogModal open={logModalOpen} onClose={() => { setLogModalOpen(false); setRefresh(r => r + 1); }} />
    </div>
  );
}

function InsightCardComponent({ insight }: { insight: { severity: string; text: string; explanation: string; action: string } }) {
  const [expanded, setExpanded] = useState(false);
  const colorMap: Record<string, string> = { safe: '#00ffcc', caution: '#FFB703', high: '#ff8c00', critical: '#E63946' };
  const color = colorMap[insight.severity] || '#a97ff0';

  return (
    <div
      className="p-3 text-sm rounded-xl transition-all duration-200 hover:scale-[1.01]"
      style={{
        background: 'rgba(123,76,224,0.15)',
        border: `1px solid ${color}28`,
        borderLeft: `3px solid ${color}`,
      }}
    >
      <div className="flex items-start gap-2">
        <span
          className="w-2 h-2 rounded-full mt-1.5 shrink-0 animate-pulse"
          style={{ background: color, boxShadow: `0 0 8px ${color}` }}
        />
        <div className="flex-1">
          <p className="text-foreground/85 font-body text-xs leading-relaxed">{insight.text}</p>
          {expanded && (
            <div className="mt-2 text-[11px] text-foreground/50 font-body space-y-1 border-t border-white/5 pt-2">
              <p>{insight.explanation}</p>
              <p style={{ color }} className="font-semibold">→ {insight.action}</p>
            </div>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[10px] mt-1.5 hover:underline font-body"
            style={{ color }}
          >
            {expanded ? 'Show less ↑' : 'Learn more ↓'}
          </button>
        </div>
      </div>
    </div>
  );
}
