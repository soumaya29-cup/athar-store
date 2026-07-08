import { useState, useEffect } from "react";
import { ShoppingBag, Plus, Trash2, Lock, X, Check, Pencil, Package, ArrowRight } from "lucide-react";
import { supabase } from "./supabaseClient";

const CATS = {
  carpets: { label: "لوحات السجاد الفارسي", grad: "linear-gradient(135deg,#A13D2E 0%,#7a2e22 60%,#C9932E 100%)" },
  candles: { label: "الشموع العطرية", grad: "linear-gradient(160deg,#22374a 0%,#1C2B39 100%)" },
  concrete: { label: "الكونكريت", grad: "linear-gradient(160deg,#c9c4ba 0%,#9B9488 100%)" },
};

const ADMIN_PASS = "athar2026";

function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ position: "fixed", bottom: 22, insetInlineEnd: 22, zIndex: 200 }}
      className="bg-[#1C2B39] text-[#F6F0E4] px-5 py-3 rounded-sm text-sm shadow-xl border-e-4 border-[#C9932E] max-w-xs">
      {msg}
    </div>
  );
}

function ProductArt({ product }) {
  if (product.img) {
    return <img src={product.img} alt={product.name} className="w-full h-full object-cover" />;
  }
  return (
    <div className="w-full h-full relative overflow-hidden" style={{ background: CATS[product.cat]?.grad }}>
      {product.cat === "carpets" && (
        <>
          <div className="absolute inset-3 border-2 border-[#C9932E]" />
          <div className="absolute inset-6" style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, transparent 0 8px, rgba(201,147,46,.35) 8px 9px), repeating-linear-gradient(-45deg, transparent 0 8px, rgba(201,147,46,.25) 8px 9px)"
          }} />
        </>
      )}
      {product.cat === "candles" && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-6 h-16 rounded-t-sm"
          style={{ background: "linear-gradient(#fdf6e3,#e8d9b0)" }}>
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-3 h-5 rounded-full"
            style={{ background: "radial-gradient(circle at 50% 70%,#fff6cf 0%,#C9932E 55%,#A13D2E 100%)", boxShadow: "0 0 16px 5px rgba(201,147,46,.4)" }} />
        </div>
      )}
      {product.cat === "concrete" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-[#e7e3da] shadow-lg" />
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [products, setProducts] = useState([]);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [cart, setCart] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [view, setView] = useState("store");
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [orders, setOrders] = useState([]);
  const [adminTab, setAdminTab] = useState("products");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", cat: "carpets", price: "", description: "", img: "" });
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [buyer, setBuyer] = useState({ name: "", phone: "" });
  const [savingOrder, setSavingOrder] = useState(false);

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(""), 2600); };

  const loadProducts = async () => {
    const { data, error } = await supabase.from("products").select("*").order("created_at");
    if (error) { setLoadError(error.message); }
    else { setProducts(data || []); setLoadError(""); }
    setReady(true);
  };

  useEffect(() => { loadProducts(); }, []);

  const loadOrders = async () => {
    const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (!error) setOrders(data || []);
  };

  useEffect(() => { if (view === "admin" && adminTab === "orders") loadOrders(); }, [view, adminTab]);

  const addToCart = (p) => {
    setCart((c) => {
      const found = c.find((i) => i.id === p.id);
      if (found) return c.map((i) => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...c, { ...p, qty: 1 }];
    });
    showToast(`${p.name} أُضيفت إلى السلة`);
  };
  const changeQty = (id, delta) => {
    setCart((c) => c.map((i) => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  };
  const removeFromCart = (id) => setCart((c) => c.filter((i) => i.id !== id));
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const submitOrder = async () => {
    if (!buyer.name.trim() || !buyer.phone.trim()) { showToast("يرجى إدخال الاسم ورقم الجوال"); return; }
    setSavingOrder(true);
    const { error } = await supabase.from("orders").insert([{
      buyer_name: buyer.name,
      buyer_phone: buyer.phone,
      items: cart,
      total,
    }]);
    setSavingOrder(false);
    if (error) { showToast("حصل خطأ، حاولي مجددًا"); return; }
    setCart([]); setCheckoutOpen(false); setDrawerOpen(false); setBuyer({ name: "", phone: "" });
    showToast("تم استلام طلبك، سنتواصل معك قريبًا ✨");
  };

  const openNew = () => { setForm({ name: "", cat: "carpets", price: "", description: "", img: "" }); setEditing("new"); };
  const openEdit = (p) => { setForm({ name: p.name, cat: p.cat, price: p.price, description: p.description || "", img: p.img || "" }); setEditing(p.id); };

  const saveForm = async () => {
    if (!form.name.trim() || !form.price) { showToast("أدخلي الاسم والسعر على الأقل"); return; }
    const payload = { name: form.name, cat: form.cat, price: parseFloat(form.price), description: form.description, img: form.img };
    if (editing === "new") {
      const { error } = await supabase.from("products").insert([payload]);
      if (error) { showToast("تعذّرت الإضافة: " + error.message); return; }
      showToast("تمت إضافة المنتج");
    } else {
      const { error } = await supabase.from("products").update(payload).eq("id", editing);
      if (error) { showToast("تعذّر الحفظ: " + error.message); return; }
      showToast("تم حفظ التعديلات");
    }
    setEditing(null);
    loadProducts();
  };

  const deleteProduct = async (id) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { showToast("تعذّر الحذف"); return; }
    showToast("تم حذف المنتج");
    loadProducts();
  };

  const grouped = Object.keys(CATS).map((c) => ({ cat: c, items: products.filter((p) => p.cat === c) }));

  return (
    <div dir="rtl" lang="ar" style={{ fontFamily: "'Tajawal',sans-serif", background: "#EFE6D6", color: "#1C2B39", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Aref+Ruqaa:wght@400;700&family=Tajawal:wght@300;400;500;700;900&display=swap');
        .disp{font-family:'Aref Ruqaa',serif;}
        ::selection{background:#C9932E;color:#1C2B39;}
      `}</style>

      {loadError && (
        <div className="bg-[#A13D2E] text-white text-xs text-center py-2 px-4">
          تعذّر الاتصال بقاعدة البيانات: {loadError}
        </div>
      )}

      <header className="sticky top-0 z-40 bg-[#1C2B39] text-[#F6F0E4]" style={{ borderBottom: "1px solid rgba(239,230,214,.15)" }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between px-5 py-3">
          <button onClick={() => setView("store")} className="disp text-2xl text-[#C9932E]">أَثَر</button>
          <nav className="hidden sm:flex gap-6 text-sm">
            {Object.entries(CATS).map(([k, v]) => (
              <a key={k} href={`#${k}`} onClick={() => setView("store")} className="opacity-85 hover:opacity-100 hover:text-[#C9932E] transition">{v.label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={() => setView(view === "admin" ? "store" : "admin")}
              className="flex items-center gap-1.5 border border-white/25 hover:border-[#C9932E] rounded-sm px-3 py-1.5 text-xs sm:text-sm transition">
              <Lock size={14} /> {view === "admin" ? "المتجر" : "لوحة التحكم"}
            </button>
            {view === "store" && (
              <button onClick={() => setDrawerOpen(true)} className="relative flex items-center gap-1.5 border border-white/25 hover:border-[#C9932E] rounded-sm px-3 py-1.5 text-sm transition">
                <ShoppingBag size={16} />
                <span className="bg-[#A13D2E] text-white text-[11px] min-w-[18px] rounded-full flex items-center justify-center px-1">{cart.reduce((s,i)=>s+i.qty,0)}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {view === "store" ? (
        <>
          <section className="text-center px-6 pt-20 pb-14"
            style={{ background: "radial-gradient(ellipse at 20% 20%,rgba(161,61,46,.10),transparent 55%),radial-gradient(ellipse at 80% 30%,rgba(201,147,46,.14),transparent 50%),#EFE6D6" }}>
            <p className="text-xs tracking-[4px] font-bold text-[#A13D2E] mb-4">حرف يدوية · صناعة عربية</p>
            <h1 className="disp" style={{ fontSize: "clamp(56px,11vw,110px)", lineHeight: 1 }}>أَثَر</h1>
            <p className="max-w-md mx-auto mt-6 mb-8 text-[#3c4c5a]">لوحات سجاد فارسي، شموع عطرية، ومنحوتات كونكريت — كل قطعة تُصنع يدويًا لتترك أثرها في تفاصيل بيتك.</p>
            <div className="flex gap-3 justify-center flex-wrap">
              {Object.entries(CATS).map(([k, v]) => (
                <a key={k} href={`#${k}`} className="text-sm border border-[#1C2B39]/25 hover:bg-[#1C2B39] hover:text-[#F6F0E4] rounded-full px-5 py-2.5 transition">{v.label}</a>
              ))}
            </div>
          </section>

          {!ready ? (
            <p className="text-center py-24 opacity-60">جارٍ تحميل المنتجات...</p>
          ) : grouped.map(({ cat, items }) => (
            <section key={cat} id={cat} className="px-6 py-16" style={{ background: cat === "candles" ? "#1C2B39" : cat === "concrete" ? "#9B9488" : "#EFE6D6", color: cat==="candles" ? "#F6F0E4" : "#1C2B39" }}>
              <div className="max-w-6xl mx-auto">
                <div className="text-center max-w-lg mx-auto mb-10">
                  <p className="text-xs tracking-[4px] font-bold mb-3" style={{ color: cat === "candles" ? "#C9932E" : "#A13D2E" }}>{CATS[cat].label}</p>
                  <h2 className="disp" style={{ fontSize: "clamp(30px,4vw,44px)" }}>
                    {cat === "carpets" ? "نقوش تُرسم، لا تُطبع" : cat === "candles" ? "ضوء دافئ، ورائحة تُروى" : "بساطة خام، بتفاصيل دقيقة"}
                  </h2>
                </div>
                {items.length === 0 ? (
                  <p className="text-center opacity-60 text-sm">لا توجد منتجات في هذا القسم بعد.</p>
                ) : (
                  <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))" }}>
                    {items.map((p) => (
                      <div key={p.id} className="rounded-sm overflow-hidden border flex flex-col transition hover:-translate-y-1.5"
                        style={{ background: cat === "candles" ? "#22374a" : cat === "concrete" ? "#eae7e1" : "#F6F0E4", borderColor: "rgba(0,0,0,.08)" }}>
                        <div className="h-44"><ProductArt product={p} /></div>
                        <div className="p-5 flex flex-col gap-2 flex-1">
                          <h3 className="disp text-xl">{p.name}</h3>
                          <p className="text-sm opacity-70 flex-1">{p.description}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="font-bold">{p.price} ريال</span>
                            <button onClick={() => addToCart(p)} className="text-xs font-bold rounded-sm px-4 py-2 transition" style={{ background: "#1C2B39", color: "#F6F0E4" }}>أضيفي للسلة</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          ))}

          <footer className="bg-[#1C2B39] text-[#F6F0E4] text-center py-10 text-sm opacity-70">© 2026 أثر للحرف اليدوية</footer>
        </>
      ) : (
        <div className="max-w-5xl mx-auto px-6 py-10">
          {!adminAuthed ? (
            <div className="max-w-sm mx-auto mt-16 bg-[#F6F0E4] border border-black/10 rounded-sm p-8 text-center">
              <Lock className="mx-auto mb-3" />
              <h2 className="disp text-2xl mb-4">دخول لوحة التحكم</h2>
              <input type="password" value={pwInput} onChange={(e) => setPwInput(e.target.value)} placeholder="كلمة المرور"
                className="w-full border border-black/15 rounded-sm px-3 py-2 mb-3 bg-white" />
              <button onClick={() => pwInput === ADMIN_PASS ? setAdminAuthed(true) : showToast("كلمة مرور غير صحيحة")}
                className="w-full bg-[#1C2B39] text-[#F6F0E4] py-2.5 rounded-sm font-bold">دخول</button>
              <p className="text-xs opacity-50 mt-4">هذا حماية بسيطة للعرض فقط، وليست بديلاً عن نظام تسجيل دخول حقيقي.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
                <h2 className="disp text-3xl">لوحة التحكم</h2>
                <div className="flex gap-2">
                  <button onClick={() => setAdminTab("products")} className={`px-4 py-2 rounded-sm text-sm ${adminTab === "products" ? "bg-[#1C2B39] text-white" : "border border-black/15"}`}>المنتجات</button>
                  <button onClick={() => setAdminTab("orders")} className={`px-4 py-2 rounded-sm text-sm flex items-center gap-1.5 ${adminTab === "orders" ? "bg-[#1C2B39] text-white" : "border border-black/15"}`}><Package size={14}/> الطلبات</button>
                </div>
              </div>

              {adminTab === "products" ? (
                <>
                  <button onClick={openNew} className="flex items-center gap-1.5 bg-[#A13D2E] text-white px-4 py-2.5 rounded-sm text-sm font-bold mb-6">
                    <Plus size={16} /> إضافة منتج جديد
                  </button>
                  <div className="grid gap-3">
                    {products.map((p) => (
                      <div key={p.id} className="flex items-center gap-4 bg-[#F6F0E4] border border-black/10 rounded-sm p-3">
                        <div className="w-16 h-16 rounded-sm overflow-hidden flex-shrink-0"><ProductArt product={p} /></div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold truncate">{p.name} <span className="font-normal opacity-60 text-xs">· {CATS[p.cat].label}</span></p>
                          <p className="text-xs opacity-60 truncate">{p.description}</p>
                        </div>
                        <span className="font-bold text-sm">{p.price} ريال</span>
                        <button onClick={() => openEdit(p)} className="p-2 hover:text-[#C9932E]"><Pencil size={16} /></button>
                        <button onClick={() => deleteProduct(p.id)} className="p-2 hover:text-[#A13D2E]"><Trash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="grid gap-3">
                  {orders.length === 0 ? <p className="opacity-60 text-sm">لا توجد طلبات بعد.</p> : orders.map((o) => (
                    <div key={o.id} className="bg-[#F6F0E4] border border-black/10 rounded-sm p-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-bold">{o.buyer_name} · {o.buyer_phone}</span>
                        <span className="opacity-60">{new Date(o.created_at).toLocaleString("ar")}</span>
                      </div>
                      <ul className="text-sm opacity-80 mb-2">
                        {(o.items || []).map((i) => <li key={i.id}>{i.name} × {i.qty} — {i.price * i.qty} ريال</li>)}
                      </ul>
                      <p className="font-bold text-sm">الإجمالي: {o.total} ريال</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-[#F6F0E4] rounded-sm p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="disp text-2xl">{editing === "new" ? "منتج جديد" : "تعديل المنتج"}</h3>
              <button onClick={() => setEditing(null)}><X size={20} /></button>
            </div>
            <div className="grid gap-3">
              <input placeholder="اسم المنتج" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border border-black/15 rounded-sm px-3 py-2 bg-white" />
              <select value={form.cat} onChange={(e) => setForm({ ...form, cat: e.target.value })} className="border border-black/15 rounded-sm px-3 py-2 bg-white">
                {Object.entries(CATS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <input placeholder="السعر (ريال)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="border border-black/15 rounded-sm px-3 py-2 bg-white" />
              <textarea placeholder="الوصف" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="border border-black/15 rounded-sm px-3 py-2 bg-white" rows={2} />
              <input placeholder="رابط صورة (اختياري)" value={form.img} onChange={(e) => setForm({ ...form, img: e.target.value })} className="border border-black/15 rounded-sm px-3 py-2 bg-white" />
              <button onClick={saveForm} className="bg-[#1C2B39] text-[#F6F0E4] py-2.5 rounded-sm font-bold flex items-center justify-center gap-1.5"><Check size={16}/> حفظ</button>
            </div>
          </div>
        </div>
      )}

      {drawerOpen && (
        <div className="fixed inset-0 bg-black/50 z-[90]" onClick={() => setDrawerOpen(false)}>
          <div className="fixed top-0 bottom-0 right-0 w-full max-w-sm bg-[#F6F0E4] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b border-black/10">
              <h3 className="disp text-2xl">سلتك</h3>
              <button onClick={() => setDrawerOpen(false)}><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {cart.length === 0 ? <p className="opacity-60 text-sm text-center py-10">السلة فارغة الآن.</p> : cart.map((i) => (
                <div key={i.id} className="flex items-center justify-between border-b border-dashed border-black/10 py-3 text-sm">
                  <span className="flex-1">{i.name}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => changeQty(i.id, -1)} className="w-6 h-6 border border-black/15 rounded-sm">-</button>
                    <span>{i.qty}</span>
                    <button onClick={() => changeQty(i.id, 1)} className="w-6 h-6 border border-black/15 rounded-sm">+</button>
                  </div>
                  <span className="w-16 text-left">{i.price * i.qty} ر.س</span>
                  <button onClick={() => removeFromCart(i.id)}><Trash2 size={14} className="opacity-50 hover:opacity-100" /></button>
                </div>
              ))}
            </div>
            <div className="p-5 border-t border-black/10">
              <div className="flex justify-between font-bold mb-4"><span>الإجمالي</span><span>{total} ريال</span></div>
              <button disabled={cart.length === 0} onClick={() => setCheckoutOpen(true)} className="w-full bg-[#1C2B39] text-[#F6F0E4] py-3 rounded-sm font-bold disabled:opacity-40 flex items-center justify-
