import React, { useState, useEffect, useCallback } from "react";

const API_BASE = "https://bcsresto-backend.onrender.com";
const BRANCH_ID = "22222222-2222-2222-2222-222222222222";

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "الآن";
  if (mins === 1) return "منذ دقيقة";
  return `منذ ${mins} د`;
}

export default function TableSessions({ token }) {
  const [sessions, setSessions] = useState([]);
  const [status, setStatus] = useState("loading");
  const [closingId, setClosingId] = useState(null);

  const authHeaders = { Authorization: `Bearer ${token}` };

  const loadSessions = useCallback(() => {
    fetch(`${API_BASE}/api/admin/sessions/${BRANCH_ID}`, { headers: authHeaders })
      .then((res) => res.json())
      .then((data) => {
        setSessions(data.sessions || []);
        setStatus("success");
      })
      .catch(() => setStatus("error"));
  }, [token]);

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 8000);
    return () => clearInterval(interval);
  }, [loadSessions]);

  const closeSession = async (sessionId, tableNumber, total) => {
    if (!window.confirm(`تأكيد إغلاق فاتورة طاولة ${tableNumber} بمبلغ ${total} دج؟`)) return;

    setClosingId(sessionId);
    try {
      await fetch(`${API_BASE}/api/admin/sessions/${sessionId}/close`, {
        method: "POST",
        headers: authHeaders,
      });
      loadSessions();
    } finally {
      setClosingId(null);
    }
  };

  if (status === "loading") return <div style={styles.statusMsg}>جاري تحميل الفواتير...</div>;
  if (status === "error") return <div style={styles.statusMsgError}>تعذر تحميل الفواتير</div>;

  // نجمع كل الأصناف من كل الطلبات بنفس الجلسة، عشان نعرض فاتورة موحدة
  const flattenItems = (orders) => {
    const map = {};
    orders.forEach((order) => {
      order.order_items.forEach((oi) => {
        const name = oi.menu_items?.name?.ar || "صنف";
        if (!map[name]) map[name] = { name, quantity: 0, total: 0 };
        map[name].quantity += oi.quantity;
        map[name].total += oi.quantity * oi.unit_price;
      });
    });
    return Object.values(map);
  };

  return (
    <div style={styles.wrap}>
      {sessions.length === 0 && (
        <div style={styles.statusMsg}>لا يوجد طاولات مشغولة حالياً 🎉</div>
      )}

      <div style={styles.grid}>
        {sessions.map((session) => {
          const items = flattenItems(session.orders || []);
          return (
            <div key={session.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.tableLabel}>
                  طاولة {session.tables?.table_number || "؟"}
                </span>
                <span style={styles.timeLabel}>{timeAgo(session.opened_at)}</span>
              </div>

              <div style={styles.perforation}>
                {Array.from({ length: 16 }).map((_, i) => (
                  <span key={i} style={styles.perfDot} />
                ))}
              </div>

              <div style={styles.itemsList}>
                {items.map((item) => (
                  <div key={item.name} style={styles.itemRow}>
                    <span style={styles.itemQty}>×{item.quantity}</span>
                    <span style={styles.itemName}>{item.name}</span>
                    <span style={styles.itemTotal}>{item.total} دج</span>
                  </div>
                ))}
              </div>

              <div style={styles.perforation}>
                {Array.from({ length: 16 }).map((_, i) => (
                  <span key={i} style={styles.perfDot} />
                ))}
              </div>

              <div style={styles.totalRow}>
                <span>الإجمالي</span>
                <span style={styles.totalValue}>{session.total_amount} دج</span>
              </div>

              <button
                style={styles.closeBtn}
                onClick={() => closeSession(session.id, session.tables?.table_number, session.total_amount)}
                disabled={closingId === session.id}
              >
                {closingId === session.id ? "..." : "إغلاق الفاتورة"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const colors = {
  bg: "#1B1611",
  surface: "#251D16",
  accent: "#E8642B",
  olive: "#8B9A46",
  ivory: "#F5EFE6",
  muted: "#A89A87",
  line: "#3A2F23",
};

const styles = {
  wrap: { padding: "20px", direction: "rtl" },
  statusMsg: { padding: "40px", textAlign: "center", color: colors.muted },
  statusMsgError: { padding: "40px", textAlign: "center", color: "#F0B8A0" },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: "16px",
  },
  card: {
    background: colors.surface,
    borderRadius: "14px",
    border: `1px solid ${colors.line}`,
    overflow: "hidden",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 16px 10px",
  },
  tableLabel: {
    fontFamily: "'Cairo', sans-serif",
    fontWeight: 800,
    fontSize: "15px",
    color: colors.ivory,
  },
  timeLabel: { fontSize: "11px", color: colors.muted },
  perforation: { display: "flex", justifyContent: "space-around", padding: "0 8px" },
  perfDot: { width: "5px", height: "5px", borderRadius: "50%", background: colors.bg, display: "inline-block" },
  itemsList: { padding: "10px 16px", display: "flex", flexDirection: "column", gap: "6px" },
  itemRow: { display: "flex", gap: "8px", fontSize: "13px", alignItems: "center" },
  itemQty: { color: colors.accent, fontWeight: 800, fontFamily: "'Cairo', sans-serif", minWidth: "24px" },
  itemName: { color: colors.ivory, flex: 1 },
  itemTotal: { color: colors.muted, fontSize: "12px" },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 16px",
    fontFamily: "'Cairo', sans-serif",
    fontWeight: 700,
    fontSize: "14px",
    color: colors.ivory,
  },
  totalValue: { fontSize: "17px", fontWeight: 800, color: colors.accent },
  closeBtn: {
    display: "block",
    width: "calc(100% - 32px)",
    margin: "4px 16px 16px",
    background: colors.olive,
    color: colors.bg,
    border: "none",
    borderRadius: "10px",
    padding: "12px",
    fontFamily: "'Cairo', sans-serif",
    fontWeight: 800,
    fontSize: "13px",
    cursor: "pointer",
  },
};