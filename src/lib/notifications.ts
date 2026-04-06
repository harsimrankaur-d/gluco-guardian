import { getLogs, getLatestLog, getSession } from "./glucosense";

export interface Notification {
  id: string;
  type: "alert" | "reminder" | "activity" | "insight";
  title: string;
  message: string;
  time: string;
  read: boolean;
  severity?: "safe" | "caution" | "high" | "critical";
}

const NOTIF_KEY = "glucosense_notifications";

export function getNotifications(): Notification[] {
  try {
    return JSON.parse(localStorage.getItem(NOTIF_KEY) || "[]");
  } catch {
    return [];
  }
}

export function markAllRead() {
  const notifs = getNotifications().map((n) => ({ ...n, read: true }));
  localStorage.setItem(NOTIF_KEY, JSON.stringify(notifs));
}

export function markOneRead(id: string) {
  const notifs = getNotifications().map((n) =>
    n.id === id ? { ...n, read: true } : n
  );
  localStorage.setItem(NOTIF_KEY, JSON.stringify(notifs));
}

export function clearNotifications() {
  localStorage.setItem(NOTIF_KEY, JSON.stringify([]));
}

function saveNotifications(notifs: Notification[]) {
  localStorage.setItem(NOTIF_KEY, JSON.stringify(notifs));
}

// Called every time user logs data — generates fresh notifications from latest log
export function generateNotificationsFromLogs() {
  const logs = getLogs();
  const session = getSession();
  if (!logs.length || !session) return;

  const latest = logs[0];
  const existing = getNotifications();
  const existingIds = new Set(existing.map((n) => n.id));
  const newNotifs: Notification[] = [];

  const now = new Date().toISOString();

  // 1. Glucose alerts
  if (latest.glucoseReading) {
    const g = latest.glucoseReading;
    if (g < 70) {
      const id = `glucose-low-${latest.id}`;
      if (!existingIds.has(id))
        newNotifs.push({
          id,
          type: "alert",
          title: "🔴 Low Glucose Alert",
          message: `Reading of ${g} mg/dL is below safe threshold (70). Take action immediately.`,
          time: now,
          read: false,
          severity: "critical",
        });
    } else if (g < 80) {
      const id = `glucose-warn-${latest.id}`;
      if (!existingIds.has(id))
        newNotifs.push({
          id,
          type: "alert",
          title: "🟡 Glucose Approaching Low",
          message: `Reading of ${g} mg/dL is approaching the low threshold. Monitor closely.`,
          time: now,
          read: false,
          severity: "caution",
        });
    } else if (g > 180) {
      const id = `glucose-high-${latest.id}`;
      if (!existingIds.has(id))
        newNotifs.push({
          id,
          type: "alert",
          title: "🟠 High Glucose Detected",
          message: `Reading of ${g} mg/dL is above normal range. Check insulin status.`,
          time: now,
          read: false,
          severity: "high",
        });
    }
  }

  // 2. Risk score alerts
  if (latest.riskScore > 75) {
    const id = `risk-critical-${latest.id}`;
    if (!existingIds.has(id))
      newNotifs.push({
        id,
        type: "alert",
        title: "🚨 Critical Risk Score",
        message: `Risk score of ${latest.riskScore}/100 — hypoglycaemia risk is high. Review insulin and meal timing.`,
        time: now,
        read: false,
        severity: "critical",
      });
  } else if (latest.riskScore > 55) {
    const id = `risk-high-${latest.id}`;
    if (!existingIds.has(id))
      newNotifs.push({
        id,
        type: "alert",
        title: "⚠️ Elevated Risk Score",
        message: `Risk score of ${latest.riskScore}/100 — stay alert and monitor glucose levels.`,
        time: now,
        read: false,
        severity: "high",
      });
  }

  // 3. Insight-based notifications
  latest.insights?.forEach((insight) => {
    if (insight.severity === "critical" || insight.severity === "high") {
      const id = `insight-${insight.id}`;
      if (!existingIds.has(id))
        newNotifs.push({
          id,
          type: "insight",
          title:
            insight.severity === "critical"
              ? "🧠 Critical AI Insight"
              : "🧠 AI Warning",
          message: insight.text,
          time: now,
          read: false,
          severity: insight.severity,
        });
    }
  });

  // 4. Activity log notification
  const actId = `log-${latest.id}`;
  if (!existingIds.has(actId))
    newNotifs.push({
      id: actId,
      type: "activity",
      title: "📋 Status Updated",
      message: `Log saved — Risk ${latest.riskScore}/100 · Glucose ${latest.glucoseReading ?? "—"} mg/dL · ${latest.activityLevel} activity`,
      time: now,
      read: false,
      severity: "safe",
    });

  // 5. Reminders — if last log > 6 hrs ago
  if (logs.length >= 1) {
    const lastTime = new Date(latest.timestamp).getTime();
    const hoursAgo = (Date.now() - lastTime) / (1000 * 60 * 60);
    if (hoursAgo >= 6) {
      const remId = `reminder-${Math.floor(Date.now() / (1000 * 60 * 60 * 6))}`;
      if (!existingIds.has(remId))
        newNotifs.push({
          id: remId,
          type: "reminder",
          title: "⏰ Time to Log",
          message: `It's been ${Math.floor(hoursAgo)} hours since your last log. Update your status now.`,
          time: now,
          read: false,
          severity: "caution",
        });
    }
  }

  saveNotifications([...newNotifs, ...existing].slice(0, 30));
}
