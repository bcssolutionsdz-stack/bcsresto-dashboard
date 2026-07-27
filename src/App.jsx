import React, { useState, useEffect, useCallback } from "react";

const API_BASE = "https://bcsresto-backend.onrender.com";
const BRANCH_ID = "22222222-2222-2222-2222-222222222222";
const POLL_INTERVAL = 5000; // نحدّث الطلبات كل 5 ثواني

const COLUMNS = [
  { status: "new", label: "طلبات جديدة", nextStatus: "preparing", nextLabel: "بدء التحضير" },
  { status: "preparing", label: "قيد التحضير", nextStatus: "ready", nextLabel: "جاهز" },
  { status: "ready", label: "جاهز للتقديم", nextStatus: "completed", nextLabel: "تم التسليم" },
];

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "الآن";
  if (mins === 1) return "منذ دقيقة";
  return `منذ ${mins} د`;
}

export default function App() {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("loading");
  const [updatingId, setUpdatingId] = useState(null);

  const loadOrders = useCallback(() => {
    fetch(`${API_BASE}/api/orders/${BRANCH_ID}`)
      .then((res) => {
        if (!res.ok) throw new Error("network");
        return res.json();
      })
      .then((data) => {
        setOrders(data.orders || []);
        setStatus("success");
      })
      .catch(() => setStatus("error"));
  }, []);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [loadOrders]);

  const advanceOrder = async (orderId, nextStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`${API_BASE}/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error("update failed");
      loadOrders();
    } catch (err) {
      console.error("خطأ بتحديث الطلب:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>🍳 لوحة المطبخ — BCSresto</h1>
        <span style={styles.liveDot}>
          <span style={styles.dot} /> تحديث تلقائي كل 5 ثواني
        </span>
      </header>

      {status === "loading" && <div style={styles.statusMsg}>جاري تحميل الطلبات...</div>}
      {status === "error" && (
        <div style={styles.statusMsgError}>تعذر تحميل الطلبات. تأكد إن السيرفر شغال.</div>
      )}

      {status === "success" && (
        <div style={styles.board}>
          {COLUMNS.map((col) => {
            const colOrders = orders.filter((o) => o.status === col.status);
            return (
              <div key={col.status} style={styles.column}>
                <div style={styles.columnHeader}>
                  <span>{col.label}</span>
                  <span style={styles.countBadge}>{colOrders.length}</span>
                </div>

                <div style={styles.columnBody}>
                  {colOrders.length === 0 && (
                    <div style={styles.emptyCol}>لا يوجد طلبات هنا</div>
                  )}

                  {colOrders.map((order) => (
                    <div key={order.id} style={styles.ticket}>
                      <div style={styles.ticketHeader}>
                        <span style={styles.ticketTable}>
                          {order.table_id ? `طاولة` : order.order_type === "delivery" ? "توصيل" : "استلام"}
                        </span>
                        <span style={styles.ticketTime}>{timeAgo(order.created_at)}</span>
                      </div>

                      <div style={styles.perforation}>
                        {Array.from({ length: 18 }).map((_, i) => (
                          <span key={i} style={styles.perfDot} />
                        ))}
                      </div>

                      <div style={styles.ticketItems}>
                        {order.order_items.map((oi) => (
                          <div key={oi.id} style={styles.ticketItemRow}>
                            <span style={styles.itemQty}>×{oi.quantity}</span>
                            <span style={styles.itemName}>{oi.menu_items?.name?.ar || "صنف"}</span>
                          </div>
                        ))}
                      </div>

                      <button
                        style={styles.advanceBtn}
                        disabled={updatingId === order.id}
                        onClick={() => advanceOrder(order.id, col.nextStatus)}
                      >
                        {updatingId === order.id ? "..." : col.nextLabel}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
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
  page: {
    minHeight: "100vh",
    background: colors.bg,
    color: colors.ivory,
    fontFamily: "'Tajawal', sans-serif",
    direction: "rtl",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "18px 24px",
    borderBottom: `1px solid ${colors.line}`,
  },
  title: {
    fontFamily: "'Cairo', sans-serif",
    fontWeight: 800,
    fontSize: "20px",
    margin: 0,
  },
  liveDot: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "12px",
    color: colors.muted,
  },
  dot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: colors.olive,
    display: "inline-block",
  },
  statusMsg: {
    padding: "60px 20px",
    textAlign: "center",
    color: colors.muted,
  },
  statusMsgError: {
    margin: "20px",
    padding: "16px",
    background: "#4A2318",
    border: "1px solid #7A3A28",
    borderRadius: "10px",
    color: "#F0B8A0",
    textAlign: "center",
  },
  board: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "20px",
    padding: "24px",
    alignItems: "start",
  },
  column: {
    background: "#15110C",
    borderRadius: "16px",
    border: `1px solid ${colors.line}`,
    overflow: "hidden",
  },
  columnHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 18px",
    fontFamily: "'Cairo', sans-serif",
    fontWeight: 800,
    fontSize: "15px",
    borderBottom: `1px solid ${colors.line}`,
  },
  countBadge: {
    background: colors.accent,
    color: "#fff",
    fontSize: "12px",
    fontWeight: 800,
    padding: "2px 10px",
    borderRadius: "12px",
  },
  columnBody: {
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    minHeight: "120px",
  },
  emptyCol: {
    color: colors.muted,
    fontSize: "13px",
    textAlign: "center",
    padding: "20px 0",
  },
  ticket: {
    background: colors.surface,
    borderRadius: "12px",
    border: `1px solid ${colors.line}`,
    overflow: "hidden",
  },
  ticketHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 14px 8px",
  },
  ticketTable: {
    fontFamily: "'Cairo', sans-serif",
    fontWeight: 800,
    fontSize: "14px",
  },
  ticketTime: {
    fontSize: "11px",
    color: colors.muted,
  },
  perforation: {
    display: "flex",
    justifyContent: "space-around",
    padding: "0 6px",
  },
  perfDot: {
    width: "5px",
    height: "5px",
    borderRadius: "50%",
    background: colors.bg,
    display: "inline-block",
  },
  ticketItems: {
    padding: "10px 14px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  ticketItemRow: {
    display: "flex",
    gap: "8px",
    fontSize: "13px",
  },
  itemQty: {
    color: colors.accent,
    fontWeight: 800,
    fontFamily: "'Cairo', sans-serif",
    minWidth: "24px",
  },
  itemName: {
    color: colors.ivory,
  },
  advanceBtn: {
    display: "block",
    width: "calc(100% - 28px)",
    margin: "6px 14px 14px",
    border: "none",
    background: colors.olive,
    color: colors.bg,
    fontFamily: "'Cairo', sans-serif",
    fontWeight: 800,
    fontSize: "13px",
    padding: "10px",
    borderRadius: "8px",
    cursor: "pointer",
  },
};