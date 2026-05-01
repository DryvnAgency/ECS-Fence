/* global React */
// =============================================================
// Shared components: car cards, header, chat widget, badges
// =============================================================
const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ---- helpers ----
const fmtMoney = (n) => "$" + (n || 0).toLocaleString("en-US");
const fmtMiles = (n) => (n || 0).toLocaleString("en-US") + " mi";

function priceLabel(v, lang) {
  if (v.pricing_type === "sale") return fmtMoney(v.sale_price);
  if (v.pricing_type === "lease") return fmtMoney(v.monthly_payment) + (lang === "es" ? "/mes" : "/mo");
  if (v.pricing_type === "apr") return v.apr_rate + "% APR";
  if (v.pricing_type === "cash_bonus") return fmtMoney(v.cash_bonus) + (lang === "es" ? " bono" : " bonus");
  return "";
}
function priceSubLabel(v, lang) {
  if (v.pricing_type === "lease") {
    return `${v.lease_term} ${lang === "es" ? "meses" : "mo"} · ${fmtMoney(v.lease_down)} ${lang === "es" ? "engache" : "down"}`;
  }
  if (v.pricing_type === "apr") return `${v.apr_term} ${lang === "es" ? "meses" : "mo"} · ${fmtMoney(v.sale_price)}`;
  if (v.pricing_type === "cash_bonus") return `${lang === "es" ? "Antes" : "Was"} ${fmtMoney(v.sale_price)}`;
  return "";
}
window.priceLabel = priceLabel;
window.priceSubLabel = priceSubLabel;
window.fmtMoney = fmtMoney;
window.fmtMiles = fmtMiles;

// ---- Car photo (placeholder) ----
function CarPhoto({ vehicle, label, size = "md", aspect = "4/3", style }) {
  const hue = vehicle.hero_hue || 230;
  return (
    <div
      className="car-photo"
      style={{ aspectRatio: aspect, "--hue": hue, ...style }}
    >
      <div className="photo-watermark">eddie's</div>
      {label && <div className="photo-tag">{label}</div>}
    </div>
  );
}
window.CarPhoto = CarPhoto;

// ---- Tag chips ----
const TAG_LABELS = {
  cpo: { en: "CPO", es: "CPO" },
  hot_deal: { en: "Hot deal", es: "Oferta" },
  featured: { en: "Eddie's pick", es: "Mi pick" },
  new_arrival: { en: "Just in", es: "Recién llegado" },
  one_owner: { en: "1-owner", es: "1 dueño" },
  first_car: { en: "First-car friendly", es: "Primer carro" },
  lifetime_warranty: { en: "Lifetime warranty", es: "Garantía vitalicia" },
};
function TagChip({ tag, lang = "en" }) {
  const def = TAG_LABELS[tag];
  if (!def) return null;
  const cls = tag === "hot_deal" ? "chip chip-hot" : tag === "featured" ? "chip chip-rust" : "chip";
  return <span className={cls}>{def[lang]}</span>;
}
window.TagChip = TagChip;

// ---- Vehicle card (homepage carousel) ----
function VehicleCard({ vehicle, lang = "en", onClick, width = 320 }) {
  return (
    <article
      onClick={onClick}
      style={{
        width, cursor: "pointer", background: "var(--paper)",
        border: "1.5px solid var(--ink)", borderRadius: 4,
        boxShadow: "var(--shadow-card-sm)", overflow: "hidden",
        transition: "transform 100ms ease, box-shadow 100ms ease",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translate(-2px,-2px)"; e.currentTarget.style.boxShadow = "5px 5px 0 var(--ink)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "var(--shadow-card-sm)"; }}
    >
      <CarPhoto vehicle={vehicle} label={`${vehicle.year} · ${vehicle.model}`} aspect="4/3" />
      <div style={{ padding: "14px 16px 16px" }}>
        <div className="kicker" style={{ marginBottom: 6 }}>
          {vehicle.make} · Stock {vehicle.stock}
        </div>
        <h3 className="serif" style={{ margin: 0, fontSize: 22, fontWeight: 500, lineHeight: 1.15, letterSpacing: "-0.01em" }}>
          {vehicle.year} {vehicle.model} {vehicle.trim}
        </h3>
        <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 4 }}>
          {vehicle.ext_color} · {vehicle.drive} · {fmtMiles(vehicle.mileage)}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
          {(vehicle.tags || []).slice(0, 2).map((t) => <TagChip key={t} tag={t} lang={lang} />)}
        </div>
        <hr className="divider" style={{ margin: "14px 0 12px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
          <div>
            <div className="serif" style={{ fontSize: 26, fontWeight: 500, letterSpacing: "-0.01em" }}>
              {priceLabel(vehicle, lang)}
            </div>
            {priceSubLabel(vehicle, lang) && (
              <div className="mono" style={{ fontSize: 10, letterSpacing: "0.06em", color: "var(--ink-3)", textTransform: "uppercase", marginTop: 2 }}>
                {priceSubLabel(vehicle, lang)}
              </div>
            )}
          </div>
          <span className="mono" style={{ fontSize: 11, color: "var(--rust)" }}>
            {lang === "es" ? "Ver →" : "View →"}
          </span>
        </div>
      </div>
    </article>
  );
}
window.VehicleCard = VehicleCard;

// ---- Header (sticky) ----
function SiteHeader({ lang, onLang, onChat, settings, onTextEddie, t, onNav, currentPage, compact }) {
  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 40,
      background: "var(--paper)",
      borderBottom: "1.5px solid var(--ink)",
    }}>
      <div style={{
        maxWidth: 1240, margin: "0 auto", padding: compact ? "10px 18px" : "14px 28px",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
      }}>
        <a onClick={() => onNav && onNav("home")} style={{ textDecoration: "none", color: "var(--ink)", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "#0A1020", color: "#E5EAF2",
            display: "grid", placeItems: "center",
            fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 20, fontWeight: 500,
          }}>e</div>
          <div>
            <div className="serif" style={{ fontSize: 18, fontWeight: 500, lineHeight: 1, letterSpacing: "-0.01em" }}>
              eddie's
            </div>
            <div className="mono" style={{ fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ink-3)", marginTop: 2 }}>
              showroom · omaha
            </div>
          </div>
        </a>

        <div style={{ display: "flex", alignItems: "center", gap: compact ? 8 : 14 }}>
          <div role="group" style={{
            display: "flex", border: "1.5px solid var(--ink)", borderRadius: 999, overflow: "hidden",
          }}>
            {["en", "es"].map((l) => (
              <button key={l}
                onClick={() => onLang(l)}
                className="mono"
                style={{
                  border: 0, padding: "6px 12px",
                  background: lang === l ? "var(--ink)" : "transparent",
                  color: lang === l ? "var(--paper)" : "var(--ink)",
                  cursor: "pointer", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase",
                }}>{l.toUpperCase()}</button>
            ))}
          </div>
          {!compact && (
            <button className="btn btn-ghost btn-sm" onClick={onChat}>💬 Chat</button>
          )}
          <button className="btn btn-primary btn-sm" onClick={onTextEddie}>
            {t.text_eddie}
          </button>
        </div>
      </div>
    </header>
  );
}
window.SiteHeader = SiteHeader;

// ---- Lead status badge ----
function LeadBadge({ status }) {
  const map = {
    new: { cls: "badge badge-new", t: "New" },
    contacted: { cls: "badge badge-contacted", t: "Contacted" },
    appointment_set: { cls: "badge badge-appt", t: "Appt set" },
    closed_won: { cls: "badge badge-won", t: "Sold" },
    closed_lost: { cls: "badge", t: "Lost" },
  };
  const it = map[status] || map.new;
  return <span className={it.cls}>{it.t}</span>;
}
window.LeadBadge = LeadBadge;

// ---- Status pill (live/draft/sold) ----
function VehicleStatusBadge({ status }) {
  const map = {
    live: { cls: "badge badge-live", t: "Live" },
    draft: { cls: "badge badge-draft", t: "Draft" },
    sold: { cls: "badge badge-sold", t: "Sold" },
  };
  const it = map[status] || map.live;
  return <span className={it.cls}>{it.t}</span>;
}
window.VehicleStatusBadge = VehicleStatusBadge;
