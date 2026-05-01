/* global React, VehicleCard, CarPhoto, SiteHeader, TagChip, priceLabel, fmtMoney, fmtMiles */
// =============================================================
// Homepage — sticky header, hero, trust bar, sticky pill nav,
// 6 carousels with sort, credit/trade/drive/about, footer
// =============================================================
const HomeR = React;
function Homepage({ data, lang, setLang, onChat, onNavToCar, onNavToAdmin, onTextEddie }) {
  const t = data.t[lang];
  const settings = data.settings;
  const vehicles = data.vehicles.filter((v) => v.status === "live");
  const sections = data.sections.filter((s) => settings.sections_enabled[s.id]);
  const [activePill, setActivePill] = HomeR.useState(sections[0]?.id);
  const [sortBy, setSortBy] = HomeR.useState({});

  const setSection = (id, val) => setSortBy((s) => ({ ...s, [id]: val }));

  const sortFns = {
    featured: (a, b) => (b.tags?.includes("featured") ? 1 : 0) - (a.tags?.includes("featured") ? 1 : 0) || a.posted_days - b.posted_days,
    price_up: (a, b) => (a.sale_price || a.monthly_payment * 100 || 0) - (b.sale_price || b.monthly_payment * 100 || 0),
    price_down: (a, b) => (b.sale_price || b.monthly_payment * 100 || 0) - (a.sale_price || a.monthly_payment * 100 || 0),
    newest: (a, b) => a.posted_days - b.posted_days,
    low_miles: (a, b) => (a.mileage || 1e9) - (b.mileage || 1e9),
  };

  // Smooth-scroll a section into view inside the artboard
  const sectionRefs = HomeR.useRef({});
  const handlePill = (id) => {
    setActivePill(id);
    const el = sectionRefs.current[id];
    if (el) {
      const root = el.closest("[data-scroll-root]") || document.scrollingElement;
      const top = el.getBoundingClientRect().top - (root.getBoundingClientRect ? root.getBoundingClientRect().top : 0) + (root.scrollTop || 0) - 100;
      root.scrollTo({ top, behavior: "smooth" });
    }
  };

  return (
    <div style={{ background: "var(--paper)", minHeight: "100%" }}>
      <SiteHeader lang={lang} onLang={setLang} onChat={onChat} settings={settings} onTextEddie={onTextEddie} t={t} onNav={() => {}} />

      {/* HERO */}
      <section style={{ borderBottom: "1.5px solid var(--ink)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "56px 28px 64px", display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 56, alignItems: "center" }}>
          <div>
            <div className="kicker" style={{ marginBottom: 18 }}>
              <span className="section-num">№ 01 ·</span> {t.hero_kicker}
            </div>
            <h1 className="serif" style={{ margin: 0, fontSize: 88, lineHeight: 0.95, letterSpacing: "-0.035em", fontWeight: 400 }}>
              <span style={{ display: "block" }}>{t.hero_h1_a}</span>
              <span style={{ display: "block", fontStyle: "italic", color: "var(--rust)" }}>{t.hero_h1_b}</span>
            </h1>
            <p style={{ marginTop: 24, fontSize: 18, lineHeight: 1.55, color: "var(--ink-2)", maxWidth: 520, textWrap: "pretty" }}>
              {t.hero_lede}
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap" }}>
              <button className="btn btn-primary" onClick={onTextEddie}>📱 {t.text_eddie}</button>
              <button className="btn btn-ghost" onClick={onChat}>💬 {lang === "es" ? "Chatea conmigo" : "Chat with me"}</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginTop: 44, maxWidth: 520 }}>
              {[
                { n: settings.stats.years, l: t.stat_years },
                { n: settings.stats.sold_lifetime.toLocaleString(), l: t.stat_sold },
                { n: settings.stats.repeat_customers, l: t.stat_repeat },
              ].map((s, i) => (
                <div key={i}>
                  <div className="tick">{s.n}</div>
                  <div className="mono" style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-3)", marginTop: 6 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ position: "relative" }}>
            <div className="car-photo" style={{ aspectRatio: "4/5", "--hue": 30, borderRadius: 4, border: "1.5px solid var(--ink)", boxShadow: "var(--shadow-card)" }}>
              <div className="photo-tag">portrait · eddie</div>
            </div>
            <div style={{ position: "absolute", bottom: -18, left: -18, background: "var(--rust)", color: "#EEF1F5", padding: "10px 14px", border: "1.5px solid var(--ink)", borderRadius: 4, fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {lang === "es" ? "Hablo Español" : "Habla Español"}
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section style={{ borderBottom: "1.5px solid var(--ink)", background: "var(--paper-2)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "18px 28px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
          {[t.trust_warranty, t.trust_buyhome, t.trust_bilingual, t.trust_reply].map((it, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--rust)" }} />
              <span className="mono" style={{ fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase" }}>{it}</span>
            </div>
          ))}
        </div>
      </section>

      {/* STICKY PILL NAV */}
      <div style={{ position: "sticky", top: 67, zIndex: 30, background: "var(--paper)", borderBottom: "1.5px solid var(--ink)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "12px 28px", display: "flex", gap: 8, overflowX: "auto" }}>
          {sections.map((s, i) => (
            <button key={s.id} onClick={() => handlePill(s.id)} className="mono"
              style={{
                border: "1.5px solid var(--ink)", borderRadius: 999,
                padding: "8px 14px", cursor: "pointer", whiteSpace: "nowrap",
                background: activePill === s.id ? "var(--ink)" : "var(--paper)",
                color: activePill === s.id ? "var(--paper)" : "var(--ink)",
                fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase",
              }}>
              <span style={{ opacity: 0.6, marginRight: 6 }}>0{i + 1}</span>{s[lang]}
            </button>
          ))}
        </div>
      </div>

      {/* CAROUSELS */}
      {sections.map((s, idx) => {
        const items = vehicles.filter((v) => v.section === s.id);
        const sort = sortBy[s.id] || "featured";
        const sorted = [...items].sort(sortFns[sort]);
        return (
          <section key={s.id} ref={(el) => (sectionRefs.current[s.id] = el)}
            style={{ padding: "56px 0 24px", borderBottom: "1.5px solid var(--line)" }}>
            <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 28px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24, marginBottom: 22 }}>
                <div>
                  <div className="kicker" style={{ marginBottom: 8 }}>
                    <span className="section-num">№ 0{idx + 2} ·</span> {lang === "es" ? s.tag_es : s.tag_en}
                  </div>
                  <h2 className="serif" style={{ margin: 0, fontSize: 48, fontWeight: 400, letterSpacing: "-0.03em", lineHeight: 1 }}>
                    {s[lang]} <span style={{ color: "var(--ink-3)", fontStyle: "italic", fontSize: 22, fontWeight: 400, letterSpacing: 0 }}>· {items.length}</span>
                  </h2>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {[
                    { id: "featured", l: t.sort_featured },
                    { id: "price_up", l: t.sort_price_up },
                    { id: "price_down", l: t.sort_price_down },
                    { id: "newest", l: t.sort_newest },
                    { id: "low_miles", l: t.sort_low_miles },
                  ].map((o) => (
                    <button key={o.id} onClick={() => setSection(s.id, o.id)} className="mono"
                      style={{
                        border: "1px solid var(--line)", borderRadius: 2,
                        padding: "6px 10px", cursor: "pointer",
                        background: sort === o.id ? "var(--ink)" : "transparent",
                        color: sort === o.id ? "var(--paper)" : "var(--ink-2)",
                        fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase",
                      }}>{o.l}</button>
                  ))}
                </div>
              </div>
              <div className="carousel-scroll" style={{ paddingLeft: 0 }}>
                {sorted.map((v) => (
                  <VehicleCard key={v.id} vehicle={v} lang={lang} onClick={() => onNavToCar(v.slug)} />
                ))}
                {sorted.length === 0 && (
                  <div style={{ padding: "40px 24px", color: "var(--ink-3)", fontStyle: "italic" }}>
                    {lang === "es" ? "Pronto en este espacio." : "Coming soon to this section."}
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      })}

      {/* CREDIT APP */}
      <section style={{ background: "#0A1020", color: "#E5EAF2", padding: "72px 0", borderTop: "1.5px solid var(--ink)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 28px", display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 56, alignItems: "start" }}>
          <div>
            <div className="kicker" style={{ color: "rgba(238,241,245,0.6)", marginBottom: 14 }}><span style={{ color: "var(--rust)", fontStyle: "italic", fontFamily: "var(--serif)" }}>№ 08 ·</span> credit</div>
            <h2 className="serif" style={{ fontSize: 56, margin: 0, fontWeight: 400, letterSpacing: "-0.03em", lineHeight: 1 }}>{t.credit_h}</h2>
            <p style={{ fontSize: 17, color: "rgba(238,241,245,0.75)", marginTop: 18, maxWidth: 460 }}>{t.credit_p}</p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); alert(lang === "es" ? "¡Listo! Eddie te texteará." : "Submitted! Eddie will text you."); }}
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, background: "var(--paper-2)", color: "var(--ink)", padding: 24, borderRadius: 4, border: "1.5px solid var(--ink)", boxShadow: "8px 8px 0 var(--rust)" }}>
            <div><label>{lang === "es" ? "Nombre" : "First name"}</label><input defaultValue="" /></div>
            <div><label>{lang === "es" ? "Apellido" : "Last name"}</label><input /></div>
            <div><label>{lang === "es" ? "Teléfono" : "Phone"}</label><input placeholder="(402) 555-0000" /></div>
            <div><label>Email</label><input type="email" /></div>
            <div><label>{lang === "es" ? "Ingreso mensual" : "Monthly income"}</label><input placeholder="$" /></div>
            <div><label>{lang === "es" ? "Empleador" : "Employer"}</label><input /></div>
            <div style={{ gridColumn: "1 / -1" }}><label>{lang === "es" ? "Vivienda" : "Residence"}</label>
              <select><option>Own</option><option>Rent</option><option>Other</option></select>
            </div>
            <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 6 }}>
              <span className="mono" style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.06em" }}>
                {lang === "es" ? "Soft pull · No afecta crédito" : "Soft pull · Won't ding credit"}
              </span>
              <button type="submit" className="btn btn-rust">{lang === "es" ? "Pre-aprueba" : "Get pre-approved"} →</button>
            </div>
          </form>
        </div>
      </section>

      {/* TRADE / DRIVE TILES */}
      <section style={{ padding: "72px 0", borderBottom: "1.5px solid var(--ink)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 28px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {[
            { num: "09", h: t.trade_h, p: t.trade_p, cta: lang === "es" ? "Pídeme un número" : "Get a number", hue: 250 },
            { num: "10", h: t.drive_h, p: t.drive_p, cta: lang === "es" ? "Agendar" : "Book a slot", hue: 230 },
          ].map((tile, i) => (
            <div key={i} style={{ background: "var(--paper-2)", border: "1.5px solid var(--ink)", borderRadius: 4, padding: 32, boxShadow: "var(--shadow-card)", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 280, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", right: -40, top: -40, width: 200, height: 200, borderRadius: "50%", background: `oklch(0.55 0.05 ${tile.hue})`, opacity: 0.5 }} />
              <div style={{ position: "relative" }}>
                <div className="kicker" style={{ marginBottom: 10 }}><span className="section-num">№ {tile.num}</span></div>
                <h3 className="serif" style={{ fontSize: 36, margin: 0, fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1.05 }}>{tile.h}</h3>
                <p style={{ fontSize: 15, color: "var(--ink-2)", marginTop: 12, maxWidth: 380 }}>{tile.p}</p>
              </div>
              <button className="btn btn-primary" style={{ alignSelf: "flex-start", marginTop: 24, position: "relative" }}>{tile.cta} →</button>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section style={{ padding: "72px 0", background: "var(--paper-2)", borderBottom: "1.5px solid var(--ink)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 28px", display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 56, alignItems: "start" }}>
          <div className="car-photo" style={{ aspectRatio: "1/1", "--hue": 22, borderRadius: 4, border: "1.5px solid var(--ink)", boxShadow: "var(--shadow-card)" }}>
            <div className="photo-tag">eddie · bay 4</div>
          </div>
          <div>
            <div className="kicker" style={{ marginBottom: 14 }}><span className="section-num">№ 11 ·</span> {t.about_h}</div>
            <h2 className="serif" style={{ fontSize: 48, margin: 0, fontWeight: 400, letterSpacing: "-0.03em", lineHeight: 1 }}>
              {lang === "es" ? "11 años. " : "11 years. "}
              <span style={{ fontStyle: "italic", color: "var(--rust)" }}>{lang === "es" ? "Mismo Eddie." : "Same Eddie."}</span>
            </h2>
            <p style={{ fontSize: 18, lineHeight: 1.6, marginTop: 22, maxWidth: 640, textWrap: "pretty" }}>
              {lang === "es" ? settings.about_es : settings.about_en}
            </p>
            <div style={{ display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap" }}>
              <button className="btn btn-primary" onClick={onTextEddie}>📱 {settings.phone}</button>
              <a href={`https://maps.google.com`} target="_blank" rel="noreferrer" className="btn btn-ghost">📍 {settings.address}</a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#0A1020", color: "#E5EAF2", padding: "40px 28px 28px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 32, alignItems: "start" }}>
          <div>
            <div className="serif" style={{ fontSize: 24, fontStyle: "italic", marginBottom: 8 }}>eddie's showroom</div>
            <div className="mono" style={{ fontSize: 11, color: "rgba(238,241,245,0.6)", lineHeight: 1.6, maxWidth: 520 }}>
              {t.footer_disclaim}
            </div>
          </div>
          <div>
            <div className="kicker" style={{ color: "rgba(238,241,245,0.5)", marginBottom: 10 }}>{lang === "es" ? "Encuéntrame" : "Find me"}</div>
            <div style={{ fontSize: 13, lineHeight: 1.7 }}>
              {settings.dealership}<br />{settings.address}<br />{settings.phone}
            </div>
          </div>
          <div>
            <div className="kicker" style={{ color: "rgba(238,241,245,0.5)", marginBottom: 10 }}>{lang === "es" ? "Sígueme" : "Follow"}</div>
            <div style={{ fontSize: 13, lineHeight: 1.7 }}>
              Facebook<br />Instagram<br />TikTok
            </div>
            <button onClick={onNavToAdmin} className="mono" style={{ marginTop: 18, background: "transparent", border: "1px solid rgba(238,241,245,0.3)", color: "rgba(238,241,245,0.6)", padding: "5px 10px", borderRadius: 2, cursor: "pointer", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              admin →
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
window.Homepage = Homepage;
