import React, { useState, useEffect, useCallback } from "react";

const API_BASE = "https://bcsresto-backend.onrender.com";
const BRANCH_ID = "22222222-2222-2222-2222-222222222222";

export default function MenuManager({ token }) {
  const [menu, setMenu] = useState([]);
  const [status, setStatus] = useState("loading");
  const [editingItem, setEditingItem] = useState(null); // { id, name, description, price, is_available }
  const [savingId, setSavingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(null); // category_id لو مفتوح فورم إضافة صنف
  const [newItem, setNewItem] = useState({ name_ar: "", name_fr: "", name_en: "", price: "" });

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const loadMenu = useCallback(() => {
    fetch(`${API_BASE}/api/admin/menu/${BRANCH_ID}`, { headers: authHeaders })
      .then((res) => res.json())
      .then((data) => {
        setMenu(data.menu || []);
        setStatus("success");
      })
      .catch(() => setStatus("error"));
  }, [token]);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  const startEdit = (item) => {
    setEditingItem({
      id: item.id,
      name_ar: item.name?.ar || "",
      name_fr: item.name?.fr || "",
      name_en: item.name?.en || "",
      price: item.price,
      is_available: item.is_available,
    });
  };

  const saveEdit = async () => {
    setSavingId(editingItem.id);
    try {
      await fetch(`${API_BASE}/api/admin/menu-items/${editingItem.id}`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({
          name: { ar: editingItem.name_ar, fr: editingItem.name_fr, en: editingItem.name_en },
          price: parseFloat(editingItem.price),
          is_available: editingItem.is_available,
        }),
      });
      setEditingItem(null);
      loadMenu();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingId(null);
    }
  };

  const toggleAvailability = async (item) => {
    setSavingId(item.id);
    try {
      await fetch(`${API_BASE}/api/admin/menu-items/${item.id}`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({
          name: item.name,
          description: item.description,
          price: item.price,
          is_available: !item.is_available,
        }),
      });
      loadMenu();
    } finally {
      setSavingId(null);
    }
  };

  const deleteItem = async (itemId) => {
    if (!window.confirm("متأكد تبي تحذف هذا الصنف نهائياً؟")) return;
    setSavingId(itemId);
    try {
      await fetch(`${API_BASE}/api/admin/menu-items/${itemId}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      loadMenu();
    } finally {
      setSavingId(null);
    }
  };

  const addItem = async (categoryId) => {
    if (!newItem.name_ar || !newItem.price) return;
    setSavingId("new");
    try {
      await fetch(`${API_BASE}/api/admin/menu-items`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          category_id: categoryId,
          name: { ar: newItem.name_ar, fr: newItem.name_fr, en: newItem.name_en },
          description: { ar: "", fr: "", en: "" },
          price: parseFloat(newItem.price),
        }),
      });
      setNewItem({ name_ar: "", name_fr: "", name_en: "", price: "" });
      setShowAddForm(null);
      loadMenu();
    } finally {
      setSavingId(null);
    }
  };

  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ name_ar: "", name_fr: "", name_en: "" });
  const [savingCategory, setSavingCategory] = useState(false);

  const addCategory = async () => {
    if (!newCategory.name_ar) return;
    setSavingCategory(true);
    try {
      await fetch(`${API_BASE}/api/admin/categories`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          branch_id: BRANCH_ID,
          name: { ar: newCategory.name_ar, fr: newCategory.name_fr, en: newCategory.name_en },
          display_order: menu.length + 1,
        }),
      });
      setNewCategory({ name_ar: "", name_fr: "", name_en: "" });
      setShowAddCategory(false);
      loadMenu();
    } finally {
      setSavingCategory(false);
    }
  };

  if (status === "loading") return <div style={styles.statusMsg}>جاري تحميل المنيو...</div>;
  if (status === "error") return <div style={styles.statusMsgError}>تعذر تحميل المنيو</div>;

  return (
    <div style={styles.wrap}>
      <div style={styles.categoryAddBlock}>
        {showAddCategory ? (
          <div style={styles.addForm}>
            <input
              style={styles.input}
              value={newCategory.name_ar}
              onChange={(e) => setNewCategory({ ...newCategory, name_ar: e.target.value })}
              placeholder="اسم التصنيف بالعربي (مثلاً: حلويات)"
            />
            <input
              style={styles.input}
              value={newCategory.name_fr}
              onChange={(e) => setNewCategory({ ...newCategory, name_fr: e.target.value })}
              placeholder="بالفرنسية"
            />
            <input
              style={styles.input}
              value={newCategory.name_en}
              onChange={(e) => setNewCategory({ ...newCategory, name_en: e.target.value })}
              placeholder="بالإنجليزية"
            />
            <button style={styles.saveBtn} onClick={addCategory} disabled={savingCategory}>
              {savingCategory ? "..." : "إضافة"}
            </button>
            <button style={styles.cancelBtn} onClick={() => setShowAddCategory(false)}>
              إلغاء
            </button>
          </div>
        ) : (
          <button style={styles.addCategoryBtn} onClick={() => setShowAddCategory(true)}>
            + إضافة فئة (تصنيف) جديدة
          </button>
        )}
      </div>

      {menu.map((category) => (
        <div key={category.id} style={styles.categoryBlock}>
          <h3 style={styles.categoryTitle}>{category.name?.ar}</h3>

          <div style={styles.itemsList}>
            {category.items.map((item) => (
              <div key={item.id} style={styles.itemRow}>
                {editingItem?.id === item.id ? (
                  <div style={styles.editForm}>
                    <input
                      style={styles.input}
                      value={editingItem.name_ar}
                      onChange={(e) => setEditingItem({ ...editingItem, name_ar: e.target.value })}
                      placeholder="الاسم بالعربي"
                    />
                    <input
                      style={styles.input}
                      value={editingItem.name_fr}
                      onChange={(e) => setEditingItem({ ...editingItem, name_fr: e.target.value })}
                      placeholder="بالفرنسية"
                    />
                    <input
                      style={styles.input}
                      value={editingItem.name_en}
                      onChange={(e) => setEditingItem({ ...editingItem, name_en: e.target.value })}
                      placeholder="بالإنجليزية"
                    />
                    <input
                      style={{ ...styles.input, width: "90px" }}
                      type="number"
                      value={editingItem.price}
                      onChange={(e) => setEditingItem({ ...editingItem, price: e.target.value })}
                      placeholder="السعر"
                    />
                    <button style={styles.saveBtn} onClick={saveEdit} disabled={savingId === item.id}>
                      {savingId === item.id ? "..." : "حفظ"}
                    </button>
                    <button style={styles.cancelBtn} onClick={() => setEditingItem(null)}>
                      إلغاء
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={styles.itemInfo}>
                      <span
                        style={{
                          ...styles.itemName,
                          opacity: item.is_available ? 1 : 0.4,
                          textDecoration: item.is_available ? "none" : "line-through",
                        }}
                      >
                        {item.name?.ar}
                      </span>
                      <span style={styles.itemPrice}>{item.price} دج</span>
                    </div>

                    <div style={styles.actions}>
                      <button
                        style={{
                          ...styles.toggleBtn,
                          ...(item.is_available ? styles.toggleOn : styles.toggleOff),
                        }}
                        onClick={() => toggleAvailability(item)}
                        disabled={savingId === item.id}
                      >
                        {item.is_available ? "متوفر" : "غير متوفر"}
                      </button>
                      <button style={styles.editBtn} onClick={() => startEdit(item)}>
                        تعديل
                      </button>
                      <button style={styles.deleteBtn} onClick={() => deleteItem(item.id)}>
                        حذف
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {showAddForm === category.id ? (
            <div style={styles.addForm}>
              <input
                style={styles.input}
                value={newItem.name_ar}
                onChange={(e) => setNewItem({ ...newItem, name_ar: e.target.value })}
                placeholder="الاسم بالعربي"
              />
              <input
                style={styles.input}
                value={newItem.name_fr}
                onChange={(e) => setNewItem({ ...newItem, name_fr: e.target.value })}
                placeholder="بالفرنسية"
              />
              <input
                style={styles.input}
                value={newItem.name_en}
                onChange={(e) => setNewItem({ ...newItem, name_en: e.target.value })}
                placeholder="بالإنجليزية"
              />
              <input
                style={{ ...styles.input, width: "90px" }}
                type="number"
                value={newItem.price}
                onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                placeholder="السعر"
              />
              <button style={styles.saveBtn} onClick={() => addItem(category.id)} disabled={savingId === "new"}>
                {savingId === "new" ? "..." : "إضافة"}
              </button>
              <button style={styles.cancelBtn} onClick={() => setShowAddForm(null)}>
                إلغاء
              </button>
            </div>
          ) : (
            <button style={styles.addItemBtn} onClick={() => setShowAddForm(category.id)}>
              + إضافة صنف جديد
            </button>
          )}
        </div>
      ))}
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
  danger: "#C0392B",
};

const styles = {
  wrap: { padding: "20px", direction: "rtl" },
  statusMsg: { padding: "40px", textAlign: "center", color: colors.muted },
  statusMsgError: { padding: "40px", textAlign: "center", color: "#F0B8A0" },
  categoryAddBlock: { marginBottom: "20px" },
  addCategoryBtn: {
    background: "transparent",
    border: `1px dashed ${colors.accent}`,
    color: colors.accent,
    borderRadius: "10px",
    padding: "14px",
    width: "100%",
    fontSize: "14px",
    fontWeight: 700,
    fontFamily: "'Cairo', sans-serif",
    cursor: "pointer",
  },
  categoryBlock: {
    background: colors.surface,
    borderRadius: "14px",
    border: `1px solid ${colors.line}`,
    padding: "18px",
    marginBottom: "18px",
  },
  categoryTitle: {
    fontFamily: "'Cairo', sans-serif",
    fontWeight: 800,
    fontSize: "16px",
    color: colors.ivory,
    margin: "0 0 14px",
  },
  itemsList: { display: "flex", flexDirection: "column", gap: "10px" },
  itemRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "10px",
    padding: "10px 0",
    borderBottom: `1px solid ${colors.line}`,
  },
  itemInfo: { display: "flex", flexDirection: "column", gap: "2px" },
  itemName: { color: colors.ivory, fontFamily: "'Cairo', sans-serif", fontWeight: 700, fontSize: "14px" },
  itemPrice: { color: colors.accent, fontSize: "13px", fontWeight: 700 },
  actions: { display: "flex", gap: "8px" },
  toggleBtn: {
    border: "none",
    borderRadius: "8px",
    padding: "6px 12px",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
  },
  toggleOn: { background: colors.olive, color: colors.bg },
  toggleOff: { background: colors.line, color: colors.muted },
  editBtn: {
    border: `1px solid ${colors.line}`,
    background: "transparent",
    color: colors.ivory,
    borderRadius: "8px",
    padding: "6px 12px",
    fontSize: "12px",
    cursor: "pointer",
  },
  deleteBtn: {
    border: `1px solid ${colors.danger}`,
    background: "transparent",
    color: "#F0B8A0",
    borderRadius: "8px",
    padding: "6px 12px",
    fontSize: "12px",
    cursor: "pointer",
  },
  editForm: { display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", width: "100%" },
  addForm: { display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", marginTop: "12px" },
  input: {
    background: colors.bg,
    border: `1px solid ${colors.line}`,
    borderRadius: "8px",
    padding: "8px 10px",
    color: colors.ivory,
    fontSize: "13px",
    fontFamily: "'Tajawal', sans-serif",
    outline: "none",
    flex: 1,
    minWidth: "100px",
  },
  saveBtn: {
    background: colors.olive,
    color: colors.bg,
    border: "none",
    borderRadius: "8px",
    padding: "8px 14px",
    fontWeight: 700,
    fontSize: "13px",
    cursor: "pointer",
  },
  cancelBtn: {
    background: "transparent",
    border: `1px solid ${colors.line}`,
    color: colors.muted,
    borderRadius: "8px",
    padding: "8px 14px",
    fontSize: "13px",
    cursor: "pointer",
  },
  addItemBtn: {
    marginTop: "12px",
    background: "transparent",
    border: `1px dashed ${colors.olive}`,
    color: colors.olive,
    borderRadius: "8px",
    padding: "10px",
    width: "100%",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
  },
};