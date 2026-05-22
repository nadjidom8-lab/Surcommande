// ══ React globals (must be first) ══
const { useState, useRef, useEffect, useCallback, useMemo } = React;
const { createRoot } = ReactDOM;

// ══ helpers ══

const C = {
  bg: "#f5f0e8", card: "#fffdf7", border: "#e2d9c8",
  accent2: "#8a5c2e", gold: "#c9963a",
  text: "#3a2e22", textMid: "#7a6650", textLight: "#a89880",
  inputBg: "#faf7f2", section: "#ede5d8",
  green: "#4a7a4a", red: "#c0453a", blue: "#3a6a9a",
  orange: "#d4751a", purple: "#6b3a9a",
};

const SOURCES = ["Tel", "IG", "WHTSP[1]", "WHTSP[2]", "FB", "TK"];

const TABS = [
  { id: "form",     label: "➕ جديدة" },
  { id: "orders",   label: "📋 الطلبيات" },
  { id: "wip",      label: "🔧 قيد الإنشاء" },
  { id: "archive",  label: "🗄️ الأرشيف" },
  { id: "settings", label: "⚙️ الإعدادات" },
];

const todayStr = () => new Date().toISOString().slice(0, 10);

function daysUntil(d) {
  if (!d) return 9999;
  return Math.ceil((new Date(d) - new Date()) / 86400000);
}

function getUrgency(d) {
  const n = daysUntil(d);
  if (n < 4) return { bg: "#fff5f5", border: "#e87070", dot: C.red,    label: "عاجل" };
  if (n < 8) return { bg: "#fffbf2", border: "#e8a050", dot: C.orange, label: "قريب" };
  return null;
}

function nextOrderNum(orders, wip, archived, prefix) {
  const used = [...orders, ...wip].map(o => parseInt((o.orderNumber || "").replace(/\D/g, "")) || 0);
  const arc  = archived.map(o => parseInt((o.orderNumber || "").replace(/\D/g, "")) || 0);
  for (let n = 200; n <= 1000; n++) {
    if (!used.includes(n)) return (prefix || "") + String(n).padStart(3, "0");
  }
  for (let n = 200; n <= 1000; n++) {
    if (!used.includes(n) && !arc.includes(n)) return (prefix || "") + String(n).padStart(3, "0");
  }
  return (prefix || "") + "200";
}

function buildCopyText(o) {
  const lines = [];
  const parts = ["كوموند قندورة", o.productName];
  if (o.txt)          parts.push(o.txt);
  parts.push("كولور");
  if (o.productColor) parts.push(o.productColor);
  parts.push("بـ");
  if (o.grade)        parts.push(o.grade);
  lines.push(parts.filter(Boolean).join(" "));
  if (o.shoulder) lines.push(`الكتف: ${o.shoulder}`);
  if (o.chest)    lines.push(`الصدر: ${o.chest}`);
  if (o.waist)    lines.push(`الخصر: ${o.waist}`);
  if (o.hips)     lines.push(`الوركين: ${o.hips}`);
  if (o.height)   lines.push(`الطول: ${o.height}`);
  if (o.notes)    lines.push(`ملاحظات: ${o.notes}`);
  lines.push(`قبل ${o.dueDate}`);
  lines.push(`رقم الطلبية ${o.orderNumber}`);
  return lines.join("\n");
}

function makeBlankOrder(orders, wip, archived, prefix) {
  return {
    orderNumber: nextOrderNum(orders, wip, archived, prefix || ""),
    orderDate: todayStr(),
    source: "Tel", accountName: "", phone: "",
    productName: "", productNameCustom: "", productColor: "", txt: "", grade: "دوري",
    shoulder: "", chest: "", waist: "", hips: "", height: "", sleeves: "",
    dueDate: "", notes: "", totalPrice: "", partialPayment: "", supplier: "", status: "pending",
  };
}


// ══ drawOrderImage ══

/**
 * Draws an order card on a canvas element using the Victoria Styles template design.
 * @param {Object} order - order data object
 * @param {HTMLCanvasElement} canvas
 */
function drawOrderImage(order, canvas) {
  const notesLines = [];
  if (order.sleeves) notesLines.push(`الكمامة: ${order.sleeves}`);
  if (order.notes)   notesLines.push(order.notes);

  const W = 900;
  const notesBlockH = notesLines.length > 0 ? 60 + notesLines.length * 36 : 80;
  const H = 220 + 80 + 80 + 80 + 190 + 80 + 80 + 80 + notesBlockH + 60;

  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // Background
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, "#f5ede0");
  bgGrad.addColorStop(0.5, "#fdf6ee");
  bgGrad.addColorStop(1, "#f0e4d2");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.globalAlpha = 0.18;
  const waveGrad = ctx.createRadialGradient(W, 0, 50, W - 100, 120, 300);
  waveGrad.addColorStop(0, "#c8a06a");
  waveGrad.addColorStop(1, "transparent");
  ctx.fillStyle = waveGrad;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // Outer dashed border
  ctx.save();
  ctx.strokeStyle = "#b8924a";
  ctx.lineWidth = 2.5;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.roundRect(18, 18, W - 36, H - 36, 28);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // Inner border
  ctx.save();
  ctx.strokeStyle = "rgba(184,146,74,.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(26, 26, W - 52, H - 52, 22);
  ctx.stroke();
  ctx.restore();

  // Flower helper
  function drawFlower(cx, cy, r, pts, color) {
    ctx.save();
    ctx.fillStyle = color;
    for (let i = 0; i < pts; i++) {
      const a = (i * 2 * Math.PI / pts) - Math.PI / 2;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, r * 0.38, 0, Math.PI * 2);
      ctx.globalAlpha = 0.7;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.28, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  // Logo
  ctx.save();
  const logoGrad = ctx.createLinearGradient(W / 2 - 80, 0, W / 2 + 80, 0);
  logoGrad.addColorStop(0, "#8b6914");
  logoGrad.addColorStop(0.5, "#c9963a");
  logoGrad.addColorStop(1, "#8b6914");
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "italic bold 38px Georgia, serif";
  ctx.fillStyle = logoGrad;
  ctx.fillText("Victoria", W / 2 - 55, 70);
  ctx.font = "italic 26px Georgia, serif";
  ctx.fillStyle = "#7a52a0";
  ctx.fillText("Styles✦", W / 2 - 44, 102);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = "#c9963a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2 + 20, 52);
  ctx.lineTo(W / 2 + 20, 118);
  ctx.stroke();
  ctx.restore();

  drawFlower(W / 2 + 62, 85, 28, 8, "#9a60c0");

  // Title
  ctx.save();
  const titleGrad = ctx.createLinearGradient(W / 2 - 150, 0, W / 2 + 150, 0);
  titleGrad.addColorStop(0, "#6b3a10");
  titleGrad.addColorStop(0.5, "#3a1a00");
  titleGrad.addColorStop(1, "#6b3a10");
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "28px serif";
  ctx.fillStyle = "#b8924a";
  ctx.fillText("✦", W / 2 - 200, 158);
  ctx.fillText("✦", W / 2 + 200, 158);
  ctx.font = "bold 50px Arial";
  ctx.fillStyle = titleGrad;
  ctx.fillText("تفاصيل الطلبية", W / 2, 158);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = "#b8924a";
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(W / 2 - 210, 178); ctx.lineTo(W / 2 - 30, 178); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W / 2 + 30, 178);  ctx.lineTo(W / 2 + 210, 178); ctx.stroke();
  ctx.fillStyle = "#b8924a";
  ctx.beginPath();
  ctx.moveTo(W / 2, 172); ctx.lineTo(W / 2 + 8, 178); ctx.lineTo(W / 2, 184); ctx.lineTo(W / 2 - 8, 178);
  ctx.closePath(); ctx.fill();
  ctx.restore();

  // Row helpers
  let y = 200;
  const ROW_H = 70;
  const ICON_R = 28;
  const LX = 55, RX = W - 55, CW = RX - LX;
  const iconX = LX + ICON_R + 14;

  function drawCard(ry, h) {
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.shadowColor = "rgba(160,110,40,.12)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
    ctx.beginPath(); ctx.roundRect(LX, ry, CW, h, 18); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(184,146,74,.30)";
    ctx.lineWidth = 1.2; ctx.stroke();
    ctx.restore();
  }

  function drawIconCircle(cx, cy, emoji) {
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.strokeStyle = "rgba(184,146,74,.4)";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, ICON_R, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.font = `${ICON_R}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(emoji, cx, cy + 2);
    ctx.restore();
  }

  function labelText(txt, x, ry, size, color, align) {
    ctx.save();
    ctx.font = `bold ${size}px Arial`;
    ctx.fillStyle = color || "#5a3010";
    ctx.textAlign = align || "right";
    ctx.textBaseline = "middle";
    ctx.fillText(txt, x, ry);
    ctx.restore();
  }

  function valueText(txt, x, ry, size, color, align) {
    ctx.save();
    ctx.font = `${size || 20}px Arial`;
    ctx.fillStyle = color || "#3a1a00";
    ctx.textAlign = align || "right";
    ctx.textBaseline = "middle";
    ctx.fillText(txt || "", x, ry);
    ctx.restore();
  }

  function dottedLine(x1, y1, x2) {
    ctx.save();
    ctx.strokeStyle = "rgba(160,110,50,.35)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 5]);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y1); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // Row 1: كوموند قندورة
  y += 20;
  drawCard(y, ROW_H);
  drawIconCircle(iconX, y + ROW_H / 2, "👗");
  const qandouraVal = [order.productName, order.txt].filter(Boolean).join(" ");
  labelText("كوموند قندورة", RX - 22, y + ROW_H / 2, 20, "#7a4a10", "right");
  dottedLine(LX + 90, y + ROW_H / 2, RX - 180);
  valueText(qandouraVal, LX + 210, y + ROW_H / 2, 20, "#3a1800", "left");
  y += ROW_H + 14;

  // Row 2: كولور ... بـ ...
  drawCard(y, ROW_H);
  drawIconCircle(iconX, y + ROW_H / 2, "🎨");
  labelText("كولور", RX - 22, y + ROW_H / 2, 20, "#7a4a10", "right");
  dottedLine(LX + 90, y + ROW_H / 2, W / 2 - 40);
  valueText(order.productColor || "", W / 2 + 20, y + ROW_H / 2, 20, "#3a1800", "center");
  labelText("بـ", W / 2 - 22, y + ROW_H / 2, 18, "#9a6020", "right");
  dottedLine(W / 2 + 50, y + ROW_H / 2, RX - 140);
  valueText(order.grade || "", LX + 200, y + ROW_H / 2, 20, "#3a1800", "left");
  y += ROW_H + 14;

  // Row 3: الصدر
  drawCard(y, ROW_H);
  drawIconCircle(iconX, y + ROW_H / 2, "👚");
  labelText("الصدر:", RX - 22, y + ROW_H / 2, 20, "#7a4a10", "right");
  dottedLine(LX + 90, y + ROW_H / 2, RX - 100);
  valueText(order.chest ? `${order.chest} سم` : "", LX + 110, y + ROW_H / 2, 20, "#3a1800", "left");
  y += ROW_H + 14;

  // Row 4: measurements block
  const measItems = [
    ["الكتف:", order.shoulder],
    ["الصدر:", order.chest],
    ["الخصر:", order.waist],
    ["الوركين:", order.hips],
    ["الطول:", order.height],
  ];
  const measRowH = 36;
  const measBlockH = measItems.length * measRowH + 28;
  drawCard(y, measBlockH);
  drawIconCircle(iconX, y + measBlockH / 2, "📏");
  measItems.forEach(([lbl, val], i) => {
    const my = y + 18 + i * measRowH + measRowH / 2;
    labelText(lbl, RX - 22, my, 17, "#7a4a10", "right");
    dottedLine(LX + 88, my, RX - 120);
    valueText(val ? `${val} سم` : "", RX - 130, my, 17, "#3a1800", "right");
    if (i < measItems.length - 1) {
      ctx.save(); ctx.strokeStyle = "rgba(184,146,74,.15)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(LX + 90, my + measRowH / 2); ctx.lineTo(RX - 22, my + measRowH / 2); ctx.stroke();
      ctx.restore();
    }
  });
  y += measBlockH + 14;

  // Row 5: قبل
  drawCard(y, ROW_H);
  drawIconCircle(iconX, y + ROW_H / 2, "📅");
  labelText("قبل", RX - 22, y + ROW_H / 2, 20, "#7a4a10", "right");
  dottedLine(LX + 90, y + ROW_H / 2, RX - 100);
  valueText(order.dueDate || "", LX + 110, y + ROW_H / 2, 20, "#c05020", "left");
  y += ROW_H + 14;

  // Row 6: رقم الطلبية
  drawCard(y, ROW_H);
  drawIconCircle(iconX, y + ROW_H / 2, "🔢");
  labelText("رقم الطلبية", RX - 22, y + ROW_H / 2, 20, "#7a4a10", "right");
  dottedLine(LX + 90, y + ROW_H / 2, RX - 140);
  valueText(order.orderNumber || "", LX + 110, y + ROW_H / 2, 22, "#8a3a00", "left");
  y += ROW_H + 14;

  // Row 7: تاريخ الطلب
  drawCard(y, ROW_H);
  drawIconCircle(iconX, y + ROW_H / 2, "📆");
  labelText("تاريخ الطلب", RX - 22, y + ROW_H / 2, 20, "#7a4a10", "right");
  dottedLine(LX + 90, y + ROW_H / 2, RX - 140);
  valueText(order.orderDate || "", LX + 110, y + ROW_H / 2, 20, "#3a1800", "left");
  y += ROW_H + 14;

  // Row 8: ملاحظات
  const notesBlockActualH = Math.max(80, 44 + notesLines.length * 36 + 16);
  drawCard(y, notesBlockActualH);
  drawIconCircle(iconX, y + notesBlockActualH / 2, "📝");
  labelText("ملاحظات:", RX - 22, y + 28, 19, "#7a4a10", "right");
  if (notesLines.length === 0) {
    dottedLine(LX + 90, y + notesBlockActualH / 2, RX - 140);
    dottedLine(LX + 90, y + notesBlockActualH / 2 + 28, RX - 140);
    dottedLine(LX + 90, y + notesBlockActualH / 2 + 56, RX - 140);
  } else {
    notesLines.forEach((line, i) => {
      const ly = y + 50 + i * 36;
      dottedLine(LX + 90, ly + 10, RX - 22);
      valueText(line, RX - 30, ly, 17, "#3a1800", "right");
    });
    for (let i = notesLines.length; i < 3; i++) {
      dottedLine(LX + 90, y + 50 + i * 36 + 10, RX - 22);
    }
  }
  y += notesBlockActualH + 14;

  // Footer ornament
  ctx.save();
  ctx.strokeStyle = "#b8924a";
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(LX, y + 10); ctx.lineTo(W / 2 - 20, y + 10); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W / 2 + 20, y + 10); ctx.lineTo(RX, y + 10); ctx.stroke();
  drawFlower(W / 2, y + 10, 10, 8, "#b8924a");
  ctx.restore();

  // Corner leaves
  function drawLeaf(cx, cy, angle, color) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(0, -60, 20, -100); ctx.stroke();
    [[-30, -40], [-20, -60], [0, -80]].forEach(([dx, dy]) => {
      ctx.beginPath(); ctx.moveTo(dx * 0.3, dy * 0.5); ctx.quadraticCurveTo(dx, dy, dx * 0.1, dy * 1.1); ctx.stroke();
    });
    ctx.restore();
  }
  drawLeaf(50, 80, -0.3, "rgba(160,110,50,.5)");
  drawLeaf(W - 45, H - 60, 2.8, "rgba(160,110,50,.4)");
}


// ══ Btn ══


function Btn({ onClick, style, children, disabled, title }) {
  const [ripples, setRipples] = useState([]);

  const click = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const id = Date.now() + Math.random();
    setRipples((a) => [...a, { id, x: e.clientX - r.left, y: e.clientY - r.top }]);
    setTimeout(() => setRipples((a) => a.filter((x) => x.id !== id)), 600);
    if (onClick && !disabled) onClick(e);
  };

  return (
    <button
      title={title}
      onClick={click}
      disabled={disabled}
      style={{
        position: "relative",
        overflow: "hidden",
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "'Amiri', serif",
        ...style,
      }}
    >
      {ripples.map((r) => (
        <span
          key={r.id}
          style={{
            position: "absolute",
            borderRadius: "50%",
            width: 120,
            height: 120,
            top: r.y - 60,
            left: r.x - 60,
            background: "rgba(255,255,255,.35)",
            animation: "ripple .6s ease-out forwards",
            pointerEvents: "none",
          }}
        />
      ))}
      {children}
    </button>
  );
}


// ══ SendModal ══


function SendModal({ order, suppliers, onConfirm, onClose }) {
  const [sup, setSup] = useState(suppliers[0] || "");

  const inp = {
    background: C.inputBg, border: `1.5px solid ${C.border}`, borderRadius: 10,
    color: C.text, padding: "9px 13px", fontSize: 14, width: "100%",
    outline: "none", fontFamily: "'Amiri',serif", direction: "rtl",
    boxSizing: "border-box", marginBottom: 20,
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, animation:"fadeIn .2s ease" }}>
      <div style={{ background:C.card, borderRadius:20, padding:28, width:320, direction:"rtl", fontFamily:"'Amiri',serif", boxShadow:"0 20px 60px rgba(0,0,0,.3)" }}>
        <div style={{ fontSize:18, fontWeight:"bold", color:C.accent2, marginBottom:12 }}>🏭 إرسال إلى الورشة</div>
        <div style={{ fontSize:13, color:C.textMid, marginBottom:14 }}>
          <strong>{order?.orderNumber}</strong> — {order?.productName}
        </div>
        <label style={{ fontSize:12, color:C.textMid, marginBottom:4, display:"block", fontWeight:"600" }}>اختر المورد</label>
        <select value={sup} onChange={(e) => setSup(e.target.value)} style={inp}>
          {suppliers.length
            ? suppliers.map((s) => <option key={s}>{s}</option>)
            : <option value="">لا يوجد موردون</option>}
        </select>
        <div style={{ display:"flex", gap:8 }}>
          <Btn onClick={() => onConfirm(sup)} style={{ flex:2, background:`linear-gradient(90deg,${C.accent2},${C.gold})`, color:"#fff", padding:"11px 0", fontSize:15, borderRadius:12, border:"none" }}>✅ تأكيد الإرسال</Btn>
          <Btn onClick={onClose} style={{ flex:1, background:"transparent", border:`1px solid ${C.border}`, color:C.textLight, padding:"11px 0", fontSize:14, borderRadius:12 }}>إلغاء</Btn>
        </div>
      </div>
    </div>
  );
}


// ══ OrderForm ══


function OrderForm({ initial, onSave, onCancel, products }) {
  const [f, setF] = useState({ ...initial });
  useEffect(() => { setF({ ...initial }); }, [initial]);

  const s = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const isTel = f.source === "Tel";
  const isWA  = (f.source || "").startsWith("WHTSP");

  const inp = { background:C.inputBg, border:`1.5px solid ${C.border}`, borderRadius:10, color:C.text, padding:"9px 13px", fontSize:14, width:"100%", outline:"none", fontFamily:"'Amiri',serif", direction:"rtl", boxSizing:"border-box" };
  const lbl = { fontSize:12, color:C.textMid, marginBottom:4, display:"block", fontWeight:"600" };
  const sec = { fontSize:14, fontWeight:"bold", color:C.accent2, margin:"18px 0 10px", borderBottom:`1.5px solid ${C.border}`, paddingBottom:6, display:"block" };

  const effectiveName = f.productName === "__other__" ? (f.productNameCustom || "") : (f.productName || "");

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10, animation:"fadeIn .3s ease" }}>
      <span style={sec}>📦 معلومات الطلبية</span>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        <div><label style={lbl}>رقم الطلبية</label><input style={inp} value={f.orderNumber||""} onChange={(e)=>s("orderNumber",e.target.value)} placeholder="تلقائي"/></div>
        <div><label style={lbl}>تاريخ الطلبية</label><input type="date" style={inp} value={f.orderDate||""} onChange={(e)=>s("orderDate",e.target.value)}/></div>
      </div>

      <span style={sec}>📡 مصدر الطلبية</span>
      <div><label style={lbl}>المصدر</label>
        <select style={inp} value={f.source||"Tel"} onChange={(e)=>s("source",e.target.value)}>
          {SOURCES.map((x) => <option key={x}>{x}</option>)}
        </select>
      </div>
      {!isTel && !isWA && <div><label style={lbl}>اسم الحساب</label><input style={inp} value={f.accountName||""} onChange={(e)=>s("accountName",e.target.value)} placeholder="@username"/></div>}
      <div><label style={lbl}>رقم الهاتف</label><input style={inp} value={f.phone||""} onChange={(e)=>s("phone",e.target.value)} placeholder="0770173994"/></div>

      <span style={sec}>👗 المنتج</span>
      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:10 }}>
        <div><label style={lbl}>اسم المنتج *</label>
          {products.length > 0 ? (
            <select style={inp} value={f.productName||""} onChange={(e)=>s("productName",e.target.value)}>
              <option value="">— اختر —</option>
              {products.map((p) => <option key={p} value={p}>{p}</option>)}
              <option value="__other__">أخرى...</option>
            </select>
          ) : (
            <input style={inp} value={f.productName||""} onChange={(e)=>s("productName",e.target.value)} placeholder="قندورة..."/>
          )}
        </div>
        <div><label style={lbl}>الدرجة</label>
          <select style={inp} value={f.grade||"دوري"} onChange={(e)=>s("grade",e.target.value)}>
            <option value="دوري">دوري</option>
            <option value="برونز">برونز</option>
          </select>
        </div>
      </div>
      {f.productName === "__other__" && <div><label style={lbl}>اسم مخصص</label><input style={inp} value={f.productNameCustom||""} onChange={(e)=>s("productNameCustom",e.target.value)} placeholder="أدخل اسم المنتج"/></div>}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        <div><label style={lbl}>اللون</label><input style={inp} value={f.productColor||""} onChange={(e)=>s("productColor",e.target.value)} placeholder="أزرق 2"/></div>
        <div><label style={lbl}>TXT</label><input style={inp} value={f.txt||""} onChange={(e)=>s("txt",e.target.value)} placeholder="نص إضافي..."/></div>
      </div>

      <span style={sec}>📏 المقاسات</span>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        <div><label style={lbl}>الصدر *</label><input style={inp} value={f.chest||""} onChange={(e)=>s("chest",e.target.value)} placeholder="cm"/></div>
        <div><label style={lbl}>الطول *</label><input style={inp} value={f.height||""} onChange={(e)=>s("height",e.target.value)} placeholder="cm"/></div>
        <div><label style={lbl}>الكتف <span style={{fontWeight:"normal",color:C.textLight}}>(اختياري)</span></label><input style={inp} value={f.shoulder||""} onChange={(e)=>s("shoulder",e.target.value)} placeholder="cm"/></div>
        <div><label style={lbl}>الخصر <span style={{fontWeight:"normal",color:C.textLight}}>(اختياري)</span></label><input style={inp} value={f.waist||""} onChange={(e)=>s("waist",e.target.value)} placeholder="cm"/></div>
        <div><label style={lbl}>الوركين <span style={{fontWeight:"normal",color:C.textLight}}>(اختياري)</span></label><input style={inp} value={f.hips||""} onChange={(e)=>s("hips",e.target.value)} placeholder="cm"/></div>
      </div>

      <span style={sec}>✂️ الكمامات</span>
      <div><label style={lbl}>نوع الكمامة (يدوي)</label><input style={inp} value={f.sleeves||""} onChange={(e)=>s("sleeves",e.target.value)} placeholder="كمامة 3/4 واسعة..."/></div>

      <span style={sec}>📅 الاستحقاق والثمن</span>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        <div><label style={lbl}>تاريخ الاستحقاق</label><input type="date" style={inp} value={f.dueDate||""} onChange={(e)=>s("dueDate",e.target.value)}/></div>
        <div><label style={lbl}>الثمن الإجمالي (دج)</label><input style={inp} value={f.totalPrice||""} onChange={(e)=>s("totalPrice",e.target.value)} placeholder="1395000"/></div>
      </div>
      <div><label style={lbl}>💰 دفع مسبق (دج)</label><input style={inp} value={f.partialPayment||""} onChange={(e)=>s("partialPayment",e.target.value)} placeholder="500000"/></div>
      <div><label style={lbl}>ملاحظات</label><textarea style={{...inp,minHeight:70,resize:"vertical"}} value={f.notes||""} onChange={(e)=>s("notes",e.target.value)} placeholder="أي ملاحظات إضافية..."/></div>

      <div style={{ display:"flex", gap:8, marginTop:8 }}>
        <Btn onClick={() => onSave({ ...f, productName: effectiveName })}
          style={{ flex:2, background:`linear-gradient(90deg,${C.accent2},${C.gold})`, color:"#fff", padding:"13px 0", fontSize:16, borderRadius:14, border:"none", boxShadow:`0 4px 14px rgba(100,60,20,.28)` }}>
          ✅ حفظ الطلبية
        </Btn>
        {onCancel && (
          <Btn onClick={onCancel} style={{ flex:1, background:"transparent", border:`1px solid ${C.border}`, color:C.textLight, padding:"13px 0", fontSize:14, borderRadius:14 }}>
            إلغاء
          </Btn>
        )}
      </div>
    </div>
  );
}


// ══ OrdersTable ══


function OrdersTable({ orders, mode, sortBy, setSortBy, selected, setSelected, handlers }) {
  const [search,    setSearch]    = useState("");
  const [prodFilter,setProdFilter]= useState("");
  const [dateFrom,  setDateFrom]  = useState("");
  const [dateTo,    setDateTo]    = useState("");

  const inp2 = { background:C.inputBg, border:`1px solid ${C.border}`, borderRadius:8, color:C.text, padding:"6px 10px", fontSize:13, outline:"none", fontFamily:"'Amiri',serif", direction:"rtl", boxSizing:"border-box" };

  const productNames = useMemo(() => {
    const set = new Set(orders.map((o) => o.productName).filter(Boolean));
    return [...set].sort((a, b) => a.localeCompare(b, "ar"));
  }, [orders]);

  const filtered = useMemo(() => {
    let arr = orders.map((o, i) => ({ ...o, _idx: i }));
    if (search) {
      const q = search.toLowerCase();
      arr = arr.filter((o) => (o.orderNumber + o.productName + o.phone + o.productColor + o.source).toLowerCase().includes(q));
    }
    if (prodFilter) arr = arr.filter((o) => o.productName === prodFilter);
    if (dateFrom)   arr = arr.filter((o) => !o.orderDate || o.orderDate >= dateFrom);
    if (dateTo)     arr = arr.filter((o) => !o.orderDate || o.orderDate <= dateTo);
    if (sortBy === "dueDate")
      arr.sort((a, b) => (!a.dueDate && !b.dueDate) ? 0 : !a.dueDate ? 1 : !b.dueDate ? -1 : a.dueDate.localeCompare(b.dueDate));
    else if (sortBy === "orderNumber")
      arr.sort((a, b) => (parseInt((a.orderNumber||"").replace(/\D/g,""))||0) - (parseInt((b.orderNumber||"").replace(/\D/g,""))||0));
    else if (sortBy === "productName")
      arr.sort((a, b) => (a.productName||"").localeCompare(b.productName||"", "ar"));
    return arr;
  }, [orders, search, prodFilter, dateFrom, dateTo, sortBy]);

  const toggleSel = (i) => setSelected((s) => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n; });
  const toggleAll = () => selected.size === filtered.length && filtered.length > 0 ? setSelected(new Set()) : setSelected(new Set(filtered.map((o) => o._idx)));

  const isOrders  = mode === "orders";
  const isWip     = mode === "wip";
  const isArchive = mode === "archive";

  return (
    <div>
      {/* Filter bars */}
      {isWip && (
        <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap", alignItems:"center" }}>
          <select value={prodFilter} onChange={(e) => setProdFilter(e.target.value)} style={{...inp2,minWidth:130}}>
            <option value="">👗 كل المنتجات</option>
            {productNames.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={inp2}>
            <option value="dueDate">📅 تاريخ الاستحقاق</option>
            <option value="orderNumber">🔢 رقم الطلبية</option>
          </select>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{...inp2,fontSize:11}} title="تاريخ الإنشاء من"/>
          <span style={{fontSize:12,color:C.textLight}}>←</span>
          <input type="date" value={dateTo}   onChange={(e) => setDateTo(e.target.value)}   style={{...inp2,fontSize:11}} title="تاريخ الإنشاء إلى"/>
          {(prodFilter||dateFrom||dateTo) && (
            <Btn onClick={() => { setProdFilter(""); setDateFrom(""); setDateTo(""); }}
              style={{ background:"transparent", border:`1px solid ${C.border}`, color:C.textLight, padding:"5px 10px", fontSize:12, borderRadius:8 }}>✕ مسح</Btn>
          )}
        </div>
      )}
      {isArchive && (
        <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap", alignItems:"center" }}>
          <select value={prodFilter} onChange={(e) => setProdFilter(e.target.value)} style={{...inp2,minWidth:130}}>
            <option value="">👗 كل المنتجات</option>
            {productNames.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{...inp2,fontSize:11}} title="تاريخ الإنشاء من"/>
          <span style={{fontSize:12,color:C.textLight}}>←</span>
          <input type="date" value={dateTo}   onChange={(e) => setDateTo(e.target.value)}   style={{...inp2,fontSize:11}} title="تاريخ الإنشاء إلى"/>
          {(prodFilter||dateFrom||dateTo) && (
            <Btn onClick={() => { setProdFilter(""); setDateFrom(""); setDateTo(""); }}
              style={{ background:"transparent", border:`1px solid ${C.border}`, color:C.textLight, padding:"5px 10px", fontSize:12, borderRadius:8 }}>✕ مسح</Btn>
          )}
        </div>
      )}

      {/* Bulk toolbar */}
      {!isArchive && selected.size > 0 && (
        <div style={{ display:"flex", gap:8, marginBottom:10, flexWrap:"wrap", alignItems:"center" }}>
          <span style={{ fontSize:12, color:C.textMid, background:C.section, borderRadius:8, padding:"4px 10px" }}>✓ {selected.size} محدد</span>
          <Btn onClick={() => { [...selected].forEach((i) => handlers.onDownload(orders[i])); setSelected(new Set()); }} style={{ background:"#fff8e0", border:"1px solid #f0d090", color:C.gold, padding:"6px 12px", fontSize:12, borderRadius:8 }}>📥 تنزيل</Btn>
          <Btn onClick={() => { [...selected].forEach((i) => handlers.onDrive(orders[i])); setSelected(new Set()); }} style={{ background:"#e8f0fe", border:"1px solid #b8d0f8", color:C.blue, padding:"6px 12px", fontSize:12, borderRadius:8 }}>☁️ Drive</Btn>
          <Btn onClick={() => setSelected(new Set())} style={{ background:"transparent", border:`1px solid ${C.border}`, color:C.textLight, padding:"6px 10px", fontSize:12, borderRadius:8 }}>✕</Btn>
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={{ color:C.textLight, textAlign:"center", padding:"48px 0", fontSize:15 }}>لا توجد طلبيات.</div>
      ) : (
        <div style={{ overflowX:"auto", borderRadius:14, border:`1px solid ${C.border}`, boxShadow:"0 2px 12px rgba(100,60,20,.08)" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", direction:"rtl", fontFamily:"'Amiri',serif", fontSize:13, minWidth:380 }}>
            <thead>
              <tr style={{ background:`linear-gradient(90deg,${C.accent2},${C.gold})`, color:"#fff" }}>
                {!isArchive && <th style={{ padding:"10px 8px", textAlign:"center", width:34 }}><input type="checkbox" checked={selected.size===filtered.length&&filtered.length>0} onChange={toggleAll} style={{cursor:"pointer"}}/></th>}
                <th style={{ padding:"10px 10px", textAlign:"right", borderLeft:"1px solid rgba(255,255,255,.15)", whiteSpace:"nowrap" }}>الرقم</th>
                <th style={{ padding:"10px 10px", textAlign:"right", borderLeft:"1px solid rgba(255,255,255,.15)" }}>المنتج</th>
                {(isWip||isArchive) && <th style={{ padding:"10px 10px", textAlign:"right", borderLeft:"1px solid rgba(255,255,255,.15)", whiteSpace:"nowrap" }}>المورد</th>}
                {!isArchive && <th style={{ padding:"10px 10px", textAlign:"center", borderLeft:"1px solid rgba(255,255,255,.15)", whiteSpace:"nowrap" }}>الاستحقاق</th>}
                <th style={{ padding:"10px 8px", textAlign:"center" }}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o, ri) => {
                const urg   = getUrgency(o.dueDate);
                const isSel = !isArchive && selected.has(o._idx);
                const rowBg = isSel ? "rgba(180,120,40,.1)" : urg ? urg.bg : ri % 2 === 0 ? C.card : "#faf6ef";
                return (
                  <tr key={ri} className={urg?.dot === C.red ? "urgRed" : ""} style={{ background:rowBg, transition:"background .2s" }}>
                    {!isArchive && <td style={{ textAlign:"center", padding:"8px 6px", borderBottom:`1px solid ${C.border}` }}><input type="checkbox" checked={isSel} onChange={() => toggleSel(o._idx)} style={{cursor:"pointer"}}/></td>}
                    <td style={{ padding:"8px 10px", borderBottom:`1px solid ${C.border}`, borderLeft:`1px solid ${C.border}` }}>
                      <span style={{ background:`linear-gradient(90deg,${C.accent2},${C.gold})`, color:"#fff", borderRadius:8, padding:"2px 8px", fontFamily:"monospace", fontSize:12, whiteSpace:"nowrap" }}>{o.orderNumber}</span>
                    </td>
                    <td style={{ padding:"8px 10px", borderBottom:`1px solid ${C.border}`, borderLeft:`1px solid ${C.border}`, fontWeight:"bold", color:C.text, maxWidth:170, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {o.productName}
                      {o.partialPayment && <span style={{ marginRight:5, fontSize:11, color:C.green }}>💰</span>}
                    </td>
                    {(isWip||isArchive) && <td style={{ padding:"8px 10px", borderBottom:`1px solid ${C.border}`, borderLeft:`1px solid ${C.border}`, color:C.textMid, fontSize:12, whiteSpace:"nowrap" }}>{o.supplier||"—"}</td>}
                    {!isArchive && (
                      <td style={{ padding:"8px 10px", borderBottom:`1px solid ${C.border}`, borderLeft:`1px solid ${C.border}`, textAlign:"center", whiteSpace:"nowrap" }}>
                        {urg && <span style={{ background:urg.dot, color:"#fff", borderRadius:6, padding:"1px 6px", fontSize:10, marginLeft:4, fontWeight:"bold" }}>{urg.label}</span>}
                        <span style={{ color:urg?urg.dot:C.gold, fontWeight:urg?"bold":"normal" }}>{o.dueDate}</span>
                      </td>
                    )}
                    <td style={{ padding:"6px 8px", borderBottom:`1px solid ${C.border}` }}>
                      <div style={{ display:"flex", gap:3, flexWrap:"nowrap" }}>
                        <Btn title="تعديل"   onClick={() => handlers.onEdit(o._idx)}    style={{ background:"#f5ecff", border:"1px solid #d8b4fe", color:"#6b21a8", padding:"4px 7px", fontSize:12, borderRadius:7 }}>✏️</Btn>
                        <Btn title="معاينة"  onClick={() => handlers.onPreview(o._idx)} style={{ background:"#e8f0fe", border:"1px solid #b8d0f8", color:C.blue, padding:"4px 7px", fontSize:12, borderRadius:7 }}>🖼️</Btn>
                        {!isArchive && <Btn title="نسخ" onClick={() => handlers.onCopy(o)} style={{ background:"#e8f5e8", border:"1px solid #b8e0b8", color:C.green, padding:"4px 7px", fontSize:12, borderRadius:7 }}>📋</Btn>}
                        {isOrders  && <Btn title="إرسال للورشة" onClick={() => handlers.onSend(o._idx)} style={{ background:"#fff0e0", border:"1px solid #f0b870", color:C.orange, padding:"4px 7px", fontSize:12, borderRadius:7 }}>🏭</Btn>}
                        {isWip     && <Btn title="تم الإنجاز → أرشيف" onClick={() => handlers.onArchive(o._idx)} style={{ background:"#e8f5e8", border:"1px solid #a0d0a0", color:C.green, padding:"4px 7px", fontSize:12, borderRadius:7 }}>✅</Btn>}
                        <Btn title="حذف"    onClick={() => handlers.onDelete(o._idx)}  style={{ background:"#fff0f0", border:"1px solid #f0b0b0", color:C.red, padding:"4px 7px", fontSize:12, borderRadius:7 }}>🗑️</Btn>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {!isArchive && (
        <div style={{ display:"flex", gap:16, marginTop:10, fontSize:12, color:C.textMid }}>
          <span><span style={{ display:"inline-block", width:12, height:12, borderRadius:3, background:C.orange, marginLeft:4, verticalAlign:"middle" }}/>أقل من 8 أيام</span>
          <span><span style={{ display:"inline-block", width:12, height:12, borderRadius:3, background:C.red, marginLeft:4, verticalAlign:"middle" }}/>أقل من 4 أيام</span>
        </div>
      )}
    </div>
  );
}


// ══ PreviewCard ══


const Badge = ({ label, bg, color, border }) => (
  <span style={{ background:bg, color, border:`1px solid ${border||"transparent"}`, borderRadius:8, padding:"2px 10px", fontSize:12, fontWeight:"bold", whiteSpace:"nowrap" }}>{label}</span>
);

function PreviewCard({ order, onCopy, onDownload, onDrive, copied, dlMsg, driveMsg }) {
  const isTW = order.source === "Tel" || (order.source || "").startsWith("WHTSP");
  const urg  = getUrgency(order.dueDate);

  return (
    <div style={{ background:urg?urg.bg:C.card, borderRadius:20, padding:"22px 20px", color:C.text, fontFamily:"'Amiri',serif", direction:"rtl", boxShadow:`0 4px 20px rgba(100,60,20,.12)`, border:`1.5px solid ${urg?urg.border:C.border}`, position:"relative", overflow:"hidden" }}>
      {urg && <div style={{ position:"absolute", top:10, left:14, background:urg.dot, borderRadius:20, padding:"2px 10px", fontSize:11, color:"#fff", fontWeight:"bold" }}>{urg.label}</div>}
      <div style={{ position:"absolute", top:0, left:0, right:0, height:5, background:`linear-gradient(90deg,${C.accent2},${C.gold})`, borderRadius:"20px 20px 0 0" }}/>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12, marginTop:6 }}>
        <span style={{ background:`linear-gradient(90deg,${C.accent2},${C.gold})`, borderRadius:10, padding:"3px 14px", fontSize:13, color:"#fff", fontFamily:"monospace", letterSpacing:2 }}>{order.orderNumber}</span>
        <span style={{ fontSize:12, color:C.textLight }}>{order.orderDate}</span>
      </div>
      <div style={{ fontSize:20, fontWeight:"bold", marginBottom:6 }}>{order.productName}</div>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:10 }}>
        {order.productColor && <Badge label={order.productColor} bg={C.section} color={C.accent2}/>}
        {order.txt && <Badge label={order.txt} bg="#ece4f8" color={C.purple}/>}
        <Badge label={order.grade} bg={order.grade==="دوري"?"#e8f2ff":"#fff8e0"} color={order.grade==="دوري"?C.blue:C.gold} border={order.grade==="دوري"?"#b8d4f8":"#f0d090"}/>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"5px 12px", marginBottom:10 }}>
        {[["الصدر",order.chest],["الطول",order.height],["الكتف",order.shoulder],["الخصر",order.waist],["الوركين",order.hips]].map(([l,v]) => v ? (
          <div key={l} style={{ display:"flex", justifyContent:"space-between", background:C.bg, borderRadius:7, padding:"5px 10px" }}>
            <span style={{ color:C.textLight, fontSize:12 }}>{l}</span>
            <span style={{ color:C.text, fontWeight:"bold", fontSize:13 }}>{v}</span>
          </div>
        ) : null)}
      </div>
      {order.sleeves && <div style={{ fontSize:13, color:C.accent2, marginBottom:8, background:C.section, borderRadius:8, padding:"4px 10px", display:"inline-block" }}>✂️ {order.sleeves}</div>}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", borderTop:`1px solid ${C.border}`, paddingTop:10, marginTop:6 }}>
        <div>
          {isTW ? (order.phone && <div style={{ fontSize:13, color:C.green, fontWeight:"bold" }}>📞 {order.phone}</div>)
            : (<><div style={{ fontSize:12, color:C.textLight }}>{order.source}{order.accountName && ` · ${order.accountName}`}</div>{order.phone && <div style={{ fontSize:13, color:C.green }}>{order.phone}</div>}</>)}
        </div>
        <div style={{ textAlign:"left" }}>
          <div style={{ fontSize:11, color:C.textLight }}>قبل:</div>
          <div style={{ fontSize:13, color:C.gold, fontWeight:"bold" }}>{order.dueDate}</div>
        </div>
      </div>
      {order.partialPayment && <div style={{ marginTop:8, background:"#e8f5e8", borderRadius:8, padding:"5px 10px", fontSize:13, color:C.green, fontWeight:"bold" }}>💰 دفع مسبق: {order.partialPayment} دج</div>}
      {order.notes && <div style={{ marginTop:8, background:C.section, borderRadius:8, padding:"5px 10px", fontSize:13, color:C.textMid, fontStyle:"italic" }}>📝 {order.notes}</div>}
      {order.supplier && <div style={{ marginTop:8, fontSize:12, color:C.textMid }}>🏭 المورد: <strong>{order.supplier}</strong></div>}
      <div style={{ marginTop:12, textAlign:"center", background:`linear-gradient(90deg,${C.accent2},${C.gold})`, borderRadius:12, padding:"9px 0", fontSize:18, fontWeight:"bold", color:"#fff" }}>{order.totalPrice} دج</div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:8, justifyContent:"center", marginTop:14 }}>
        <Btn onClick={onDownload} style={{ background:`linear-gradient(90deg,${C.accent2},${C.gold})`, color:"#fff", padding:"10px 18px", fontSize:14, borderRadius:12, border:"none", boxShadow:`0 3px 12px rgba(100,60,20,.3)` }}>📥 تنزيل الصورة</Btn>
        <Btn onClick={onCopy} style={{ background:copied?"#e8f5e8":C.inputBg, border:`1.5px solid ${copied?C.green:C.border}`, color:copied?C.green:C.text, padding:"10px 18px", fontSize:14, borderRadius:12, transition:"all .3s" }}>{copied ? "✅ تم النسخ!" : "📋 نسخ النص"}</Btn>
        <Btn onClick={onDrive} style={{ background:"#e8f0fe", border:"1.5px solid #b8d0f8", color:C.blue, padding:"10px 18px", fontSize:14, borderRadius:12 }}>☁️ رفع Drive</Btn>
      </div>
      {(dlMsg || driveMsg) && <div style={{ textAlign:"center", marginTop:8, fontSize:13, fontWeight:"bold", color:(dlMsg||driveMsg).startsWith("✅")?C.green:C.red }}>{dlMsg || driveMsg}</div>}
      <div style={{ marginTop:12, background:C.card, borderRadius:12, padding:14, fontSize:13, color:C.textMid, whiteSpace:"pre-line", direction:"rtl", border:`1px solid ${C.border}`, lineHeight:2 }}>{buildCopyText(order)}</div>
    </div>
  );
}


// ══ App ══


function App() {
  /* ── persistent state ── */
  const [orders,   setOrders]   = useState(() => { try { return JSON.parse(localStorage.getItem("qd_orders")  || "[]"); } catch { return []; } });
  const [wip,      setWip]      = useState(() => { try { return JSON.parse(localStorage.getItem("qd_wip")     || "[]"); } catch { return []; } });
  const [archived, setArchived] = useState(() => { try { return JSON.parse(localStorage.getItem("qd_archive") || "[]"); } catch { return []; } });
  const [settings, setSettings] = useState(() => { try { return JSON.parse(localStorage.getItem("qd_settings")|| "{}"); } catch { return {}; } });

  useEffect(() => { localStorage.setItem("qd_orders",   JSON.stringify(orders));   }, [orders]);
  useEffect(() => { localStorage.setItem("qd_wip",      JSON.stringify(wip));      }, [wip]);
  useEffect(() => { localStorage.setItem("qd_archive",  JSON.stringify(archived)); }, [archived]);
  useEffect(() => { localStorage.setItem("qd_settings", JSON.stringify(settings)); }, [settings]);

  /* ── UI state ── */
  const [tab,        setTab]        = useState("form");
  const [previewTab, setPreviewTab] = useState("orders");
  const [editIdx,    setEditIdx]    = useState(null);
  const [editPool,   setEditPool]   = useState("orders");
  const [previewObj, setPreviewObj] = useState(null);
  const [sortO,      setSortO]      = useState("dueDate");
  const [sortW,      setSortW]      = useState("dueDate");
  const [selO,       setSelO]       = useState(new Set());
  const [selW,       setSelW]       = useState(new Set());
  const [sendModal,  setSendModal]  = useState(null);
  const [copied,     setCopied]     = useState(false);
  const [dlMsg,      setDlMsg]      = useState("");
  const [driveMsg,   setDriveMsg]   = useState("");
  const [toastMsg,   setToastMsg]   = useState("");
  const [newProd,    setNewProd]    = useState("");
  const [newSupp,    setNewSupp]    = useState("");
  const [tokenSaved, setTokenSaved] = useState(false);

  const canvasRef = useRef(null);

  const setSetting = (k, v) => setSettings((s) => ({ ...s, [k]: v }));
  const toast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(""), 3000); };

  /* ── blank form ── */
  const makeBlank = useCallback(
    () => makeBlankOrder(orders, wip, archived, settings.prefix || ""),
    [orders, wip, archived, settings.prefix]
  );

  const [formData, setFormData] = useState(() => makeBlankOrder([], [], [], ""));

  /* ── auto daily Drive upload at 09:00 ── */
  useEffect(() => {
    const iv = setInterval(() => {
      const now = new Date();
      if (now.getHours() === 9 && now.getMinutes() === 0 && settings.driveToken) {
        const yest = new Date(now - 86400000).toISOString().slice(0, 10);
        const list = [...orders, ...wip].filter((o) => o.orderDate === yest);
        if (list.length) {
          toast(`⏰ رفع تلقائي: ${list.length} طلبية...`);
          list.forEach((o) => uploadToDrive(o, settings.driveToken));
        }
      }
    }, 60000);
    return () => clearInterval(iv);
  }, [orders, wip, settings.driveToken]);

  /* ── download ── */
  const handleDownload = useCallback(async (o) => {
    const cv = canvasRef.current;
    if (!cv) return;
    drawOrderImage(o, cv);
    await new Promise((r) => setTimeout(r, 200));
    cv.toBlob((blob) => {
      if (!blob) { setDlMsg("❌ فشل"); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.download = `طلبية_${o.orderNumber}.png`;
      a.href = url;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setDlMsg("✅ تم التنزيل!"); setTimeout(() => setDlMsg(""), 2500);
    }, "image/png", 1.0);
  }, []);

  /* ── Drive upload ── */
  const uploadToDrive = useCallback(async (o, token) => {
    const cv = canvasRef.current;
    if (!cv) return { ok: false };
    drawOrderImage(o, cv);
    return new Promise((resolve) => {
      cv.toBlob(async (blob) => {
        try {
          const meta = { name: `طلبية_${o.orderNumber}.png`, mimeType: "image/png" };
          const fd = new FormData();
          fd.append("metadata", new Blob([JSON.stringify(meta)], { type: "application/json" }));
          fd.append("file", blob);
          const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
            method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd,
          });
          if (res.ok) resolve({ ok: true });
          else { const e = await res.json(); resolve({ ok: false, msg: e?.error?.message || "فشل" }); }
        } catch (e) { resolve({ ok: false, msg: e.message }); }
      }, "image/png");
    });
  }, []);

  const handleDrive = useCallback(async (o) => {
    if (!settings.driveToken) { setTab("settings"); toast("⚠️ أدخل التوكن في الإعدادات أولاً"); return; }
    setDriveMsg("جاري الرفع…");
    const r = await uploadToDrive(o, settings.driveToken);
    setDriveMsg(r.ok ? "✅ تم الرفع!" : `❌ ${r.msg}`);
    setTimeout(() => setDriveMsg(""), 4000);
  }, [settings.driveToken, uploadToDrive]);

  const handleCopy = useCallback((o) => {
    navigator.clipboard.writeText(buildCopyText(o));
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }, []);

  /* ── save ── */
  const handleSave = useCallback((f) => {
    if (!f.productName || !f.orderNumber) { toast("⚠️ يرجى إدخال رقم الطلبية واسم المنتج"); return; }
    const finalOrder = { ...f, productNameCustom: undefined, status: editPool === "wip" ? "wip" : "pending" };
    if (editIdx !== null) {
      if (editPool === "orders") setOrders((p) => { const a = [...p]; a[editIdx] = finalOrder; return a; });
      else setWip((p) => { const a = [...p]; a[editIdx] = finalOrder; return a; });
      toast("✅ تم التعديل");
    } else {
      setOrders((p) => [finalOrder, ...p]);
      toast("✅ تم حفظ الطلبية");
    }
    setEditIdx(null); setFormData(makeBlank()); setTab("orders");
  }, [editIdx, editPool, makeBlank]);

  /* ── send to workshop ── */
  const handleSendConfirm = useCallback((idx, supplier) => {
    const o = { ...orders[idx], supplier, status: "wip", wipDate: todayStr() };
    setWip((p) => [o, ...p]); setOrders((p) => p.filter((_, i) => i !== idx));
    setSendModal(null); toast(`🏭 تم الإرسال إلى ${supplier}`);
  }, [orders]);

  /* ── archive ── */
  const handleArchive = useCallback((idx) => {
    const o = { ...wip[idx], status: "archived", archivedDate: todayStr() };
    setArchived((p) => [o, ...p]); setWip((p) => p.filter((_, i) => i !== idx));
    toast("🗄️ تم نقل الطلبية إلى الأرشيف");
  }, [wip]);

  /* ── delete ── */
  const handleDelete = useCallback((pool, idx) => {
    if (pool === "orders")  setOrders((p)   => p.filter((_, i) => i !== idx));
    else if (pool === "wip") setWip((p)     => p.filter((_, i) => i !== idx));
    else setArchived((p) => p.filter((_, i) => i !== idx));
  }, []);

  /* ── edit ── */
  const handleEdit = useCallback((pool, idx) => {
    const src = pool === "orders" ? orders : wip;
    setFormData({ ...makeBlank(), ...src[idx] });
    setEditIdx(idx); setEditPool(pool); setTab("form");
  }, [orders, wip, makeBlank]);

  /* ── preview ── */
  const handlePreview = useCallback((pool, idx) => {
    const src = pool === "orders" ? orders : pool === "wip" ? wip : archived;
    setPreviewObj(src[idx]); setPreviewTab(pool); setTab("preview");
  }, [orders, wip, archived]);

  /* ── handlers factory ── */
  const makeHandlers = useCallback((pool) => ({
    onEdit:    (idx) => handleEdit(pool, idx),
    onPreview: (idx) => handlePreview(pool, idx),
    onDownload:(o)   => handleDownload(o),
    onCopy:    (o)   => handleCopy(o),
    onDrive:   (o)   => handleDrive(o),
    onDelete:  (idx) => handleDelete(pool, idx),
    onSend:    (idx) => setSendModal(idx),
    onArchive: (idx) => handleArchive(idx),
  }), [handleEdit, handlePreview, handleDownload, handleCopy, handleDrive, handleDelete, handleArchive]);

  const inp = { background:C.inputBg, border:`1.5px solid ${C.border}`, borderRadius:10, color:C.text, padding:"9px 13px", fontSize:14, width:"100%", outline:"none", fontFamily:"'Amiri',serif", direction:"rtl", boxSizing:"border-box" };
  const activeTab = tab === "preview" ? previewTab : tab;

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"'Amiri',serif", direction:"rtl", color:C.text }}>
      <canvas ref={canvasRef} style={{ display:"none" }} />

      {/* Toast */}
      {toastMsg && (
        <div style={{ position:"fixed", top:16, left:"50%", transform:"translateX(-50%)", background:C.text, color:"#fff", borderRadius:12, padding:"10px 22px", fontSize:14, zIndex:2000, animation:"slideDown .3s ease", boxShadow:"0 4px 20px rgba(0,0,0,.3)", fontFamily:"'Amiri',serif", whiteSpace:"nowrap" }}>
          {toastMsg}
        </div>
      )}

      {/* Send Modal */}
      {sendModal !== null && (
        <SendModal order={orders[sendModal]} suppliers={settings.suppliers || []} onConfirm={(sup) => handleSendConfirm(sendModal, sup)} onClose={() => setSendModal(null)} />
      )}

      {/* Header */}
      <div style={{ background:`linear-gradient(135deg,${C.accent2},${C.gold})`, padding:"18px 20px 12px", textAlign:"center" }}>
        <div style={{ fontSize:22, fontWeight:"bold", color:"#fff", letterSpacing:2 }}>✨ إدارة الطلبيات</div>
        <div style={{ fontSize:10, color:"rgba(255,255,255,.6)", marginTop:2 }}>Qandoura Orders</div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:4, padding:"8px 10px", background:C.card, borderBottom:`1px solid ${C.border}`, overflowX:"auto" }}>
        {TABS.map((t) => (
          <Btn key={t.id} onClick={() => { if (t.id === "form") { setEditIdx(null); setFormData(makeBlank()); } setTab(t.id); }}
            style={{ flex:1, minWidth:68, background:activeTab===t.id?`linear-gradient(90deg,${C.accent2},${C.gold})`:"transparent", border:activeTab===t.id?"none":`1px solid ${C.border}`, borderRadius:9, padding:"7px 4px", color:activeTab===t.id?"#fff":C.textMid, fontSize:11, fontWeight:"600" }}>
            {t.label}
          </Btn>
        ))}
      </div>

      <div style={{ maxWidth:["orders","wip","archive"].includes(activeTab) ? 960 : 540, margin:"0 auto", padding:"14px 12px 48px" }}>

        {/* FORM */}
        {tab === "form" && (
          <OrderForm initial={formData} onSave={handleSave}
            onCancel={editIdx !== null ? () => { setEditIdx(null); setFormData(makeBlank()); setTab(editPool); } : null}
            products={settings.products || []} />
        )}

        {/* PREVIEW */}
        {tab === "preview" && previewObj && (
          <div style={{ animation:"fadeIn .3s ease" }}>
            <Btn onClick={() => { setTab(previewTab); setPreviewObj(null); }}
              style={{ background:"transparent", border:`1px solid ${C.border}`, color:C.textMid, padding:"6px 16px", fontSize:13, borderRadius:10, marginBottom:14 }}>
              ← رجوع
            </Btn>
            <PreviewCard order={previewObj} onCopy={() => handleCopy(previewObj)} onDownload={() => handleDownload(previewObj)} onDrive={() => handleDrive(previewObj)} copied={copied} dlMsg={dlMsg} driveMsg={driveMsg} />
          </div>
        )}

        {/* ORDERS */}
        {tab === "orders" && (
          <div style={{ animation:"fadeIn .3s ease" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <div style={{ fontSize:15, fontWeight:"bold", color:C.accent2 }}>📋 الطلبيات ({orders.length})</div>
              <Btn onClick={() => { setEditIdx(null); setFormData(makeBlank()); setTab("form"); }} style={{ background:`linear-gradient(90deg,${C.accent2},${C.gold})`, color:"#fff", padding:"8px 18px", fontSize:13, borderRadius:10, border:"none" }}>➕ جديدة</Btn>
            </div>
            <OrdersTable orders={orders} mode="orders" sortBy={sortO} setSortBy={setSortO} selected={selO} setSelected={setSelO} handlers={makeHandlers("orders")} />
          </div>
        )}

        {/* WIP */}
        {tab === "wip" && (
          <div style={{ animation:"fadeIn .3s ease" }}>
            <div style={{ fontSize:15, fontWeight:"bold", color:C.accent2, marginBottom:14 }}>🔧 قيد الإنشاء ({wip.length})</div>
            <OrdersTable orders={wip} mode="wip" sortBy={sortW} setSortBy={setSortW} selected={selW} setSelected={setSelW} handlers={makeHandlers("wip")} />
          </div>
        )}

        {/* ARCHIVE */}
        {tab === "archive" && (
          <div style={{ animation:"fadeIn .3s ease" }}>
            <div style={{ fontSize:15, fontWeight:"bold", color:C.accent2, marginBottom:14 }}>🗄️ الأرشيف ({archived.length})</div>
            <OrdersTable orders={archived} mode="archive" sortBy="dueDate" setSortBy={() => {}} selected={new Set()} setSelected={() => {}} handlers={makeHandlers("archive")} />
          </div>
        )}

        {/* SETTINGS */}
        {tab === "settings" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16, animation:"fadeIn .3s ease" }}>

            <div style={{ background:C.card, borderRadius:16, padding:20, border:`1px solid ${C.border}` }}>
              <div style={{ fontSize:15, fontWeight:"bold", color:C.accent2, marginBottom:12 }}>☁️ Google Drive</div>
              <label style={{ fontSize:12, color:C.textMid, marginBottom:4, display:"block", fontWeight:"600" }}>Access Token</label>
              <div style={{ fontSize:11, color:C.textLight, marginBottom:8 }}>
                احصل عليه من <a href="https://developers.google.com/oauthplayground" target="_blank" rel="noreferrer" style={{ color:C.blue }}>OAuth Playground</a> — scope: <code style={{ background:C.section, padding:"1px 5px", borderRadius:4 }}>drive.file</code>
              </div>
              <input style={{ ...inp, direction:"ltr", fontSize:12 }} placeholder="ya29.xxxx..." value={settings.driveToken || ""} onChange={(e) => setSetting("driveToken", e.target.value)} />
              <Btn onClick={() => { setTokenSaved(true); setTimeout(() => setTokenSaved(false), 2500); toast("✅ تم حفظ التوكن"); }}
                style={{ marginTop:10, background:`linear-gradient(90deg,${C.accent2},${C.gold})`, color:"#fff", padding:"9px 20px", fontSize:13, borderRadius:10, border:"none" }}>
                {tokenSaved ? "✅ محفوظ!" : "💾 حفظ التوكن"}
              </Btn>
              {settings.driveToken && <div style={{ marginTop:6, fontSize:12, color:C.green }}>✓ توكن محفوظ ({(settings.driveToken || "").slice(0, 16)}…)</div>}
            </div>

            <div style={{ background:C.card, borderRadius:16, padding:20, border:`1px solid ${C.border}` }}>
              <div style={{ fontSize:15, fontWeight:"bold", color:C.accent2, marginBottom:12 }}>🔤 حرف البادئة</div>
              <label style={{ fontSize:12, color:C.textMid, marginBottom:4, display:"block", fontWeight:"600" }}>الحرف قبل رقم الطلبية (مثال: A → A200)</label>
              <input style={{ ...inp, maxWidth:120 }} maxLength={3} placeholder="A" value={settings.prefix || ""} onChange={(e) => setSetting("prefix", e.target.value.toUpperCase())} />
              {settings.prefix && <div style={{ marginTop:6, fontSize:13, color:C.textMid }}>مثال: <strong style={{ color:C.accent2 }}>{settings.prefix}200</strong></div>}
            </div>

            <div style={{ background:C.card, borderRadius:16, padding:20, border:`1px solid ${C.border}` }}>
              <div style={{ fontSize:15, fontWeight:"bold", color:C.accent2, marginBottom:12 }}>👗 قائمة المنتجات</div>
              <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                <input style={{ ...inp, flex:1 }} placeholder="اسم المنتج الجديد..." value={newProd} onChange={(e) => setNewProd(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && newProd.trim()) { setSetting("products", [...(settings.products || []), newProd.trim()]); setNewProd(""); } }} />
                <Btn onClick={() => { if (newProd.trim()) { setSetting("products", [...(settings.products || []), newProd.trim()]); setNewProd(""); } }}
                  style={{ background:`linear-gradient(90deg,${C.accent2},${C.gold})`, color:"#fff", padding:"9px 16px", fontSize:14, borderRadius:10, border:"none" }}>➕</Btn>
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {(settings.products || []).map((p, i) => (
                  <div key={i} style={{ background:C.section, borderRadius:8, padding:"4px 12px", fontSize:13, color:C.text, display:"flex", alignItems:"center", gap:6 }}>
                    {p}<span onClick={() => setSetting("products", (settings.products || []).filter((_, j) => j !== i))} style={{ cursor:"pointer", color:C.red, fontWeight:"bold", fontSize:14 }}>×</span>
                  </div>
                ))}
                {!(settings.products || []).length && <div style={{ color:C.textLight, fontSize:13 }}>لا توجد منتجات بعد.</div>}
              </div>
            </div>

            <div style={{ background:C.card, borderRadius:16, padding:20, border:`1px solid ${C.border}` }}>
              <div style={{ fontSize:15, fontWeight:"bold", color:C.accent2, marginBottom:12 }}>🏭 قائمة الموردين</div>
              <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                <input style={{ ...inp, flex:1 }} placeholder="اسم المورد الجديد..." value={newSupp} onChange={(e) => setNewSupp(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && newSupp.trim()) { setSetting("suppliers", [...(settings.suppliers || []), newSupp.trim()]); setNewSupp(""); } }} />
                <Btn onClick={() => { if (newSupp.trim()) { setSetting("suppliers", [...(settings.suppliers || []), newSupp.trim()]); setNewSupp(""); } }}
                  style={{ background:`linear-gradient(90deg,${C.accent2},${C.gold})`, color:"#fff", padding:"9px 16px", fontSize:14, borderRadius:10, border:"none" }}>➕</Btn>
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {(settings.suppliers || []).map((s, i) => (
                  <div key={i} style={{ background:C.section, borderRadius:8, padding:"4px 12px", fontSize:13, color:C.text, display:"flex", alignItems:"center", gap:6 }}>
                    {s}<span onClick={() => setSetting("suppliers", (settings.suppliers || []).filter((_, j) => j !== i))} style={{ cursor:"pointer", color:C.red, fontWeight:"bold", fontSize:14 }}>×</span>
                  </div>
                ))}
                {!(settings.suppliers || []).length && <div style={{ color:C.textLight, fontSize:13 }}>لا يوجد موردون بعد.</div>}
              </div>
            </div>

            <div style={{ background:C.card, borderRadius:16, padding:20, border:"1px solid #f0b0b0" }}>
              <div style={{ fontSize:15, fontWeight:"bold", color:C.red, marginBottom:12 }}>⚠️ منطقة الخطر</div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                <Btn onClick={() => { if (window.confirm("حذف كل الطلبيات؟")) { setOrders([]); setSelO(new Set()); } }} style={{ background:"#fff0f0", border:"1px solid #f0b0b0", color:C.red, padding:"8px 16px", fontSize:12, borderRadius:10 }}>🗑️ حذف الطلبيات</Btn>
                <Btn onClick={() => { if (window.confirm("حذف قيد الإنشاء؟")) { setWip([]); setSelW(new Set()); } }} style={{ background:"#fff0f0", border:"1px solid #f0b0b0", color:C.red, padding:"8px 16px", fontSize:12, borderRadius:10 }}>🗑️ حذف قيد الإنشاء</Btn>
                <Btn onClick={() => { if (window.confirm("حذف الأرشيف؟")) { setArchived([]); } }} style={{ background:"#fff0f0", border:"1px solid #f0b0b0", color:C.red, padding:"8px 16px", fontSize:12, borderRadius:10 }}>🗑️ حذف الأرشيف</Btn>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



// ══ Mount ══
createRoot(document.getElementById('root')).render(
  React.createElement(React.StrictMode, null, React.createElement(App))
);
