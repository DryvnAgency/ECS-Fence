/* global React, fmtMoney */
// =============================================================
// Chat widget — floating bottom-right, opens to full convo flow
// Bilingual, qualifying flow on homepage; pre-loaded car on car page
// =============================================================
const { useState: useChatState, useEffect: useChatEffect, useRef: useChatRef } = React;

const CHAT_TXT = {
  en: {
    open: "Chat",
    title: "Chat with Eddie",
    sub: "Bay 4 · Nissan of Omaha",
    typing: "Eddie is typing…",
    placeholder: "Type a message",
    send: "Send",
    home_intro: "Hi! 👋 I'm here to help you find a car at Nissan of Omaha. What brings you in today?",
    quick_intent: ["Under $15K", "SUVs", "Trucks", "New Specials", "Trade-in"],
    ask_budget: "Got a budget in mind? Or a monthly payment range?",
    quick_budget: ["Under $15k", "$15–25k", "$25–35k", "$35k+", "I'll know when I see it"],
    ask_timeline: "When are you hoping to drive something home?",
    quick_timeline: ["This week", "This month", "Just looking"],
    ask_credit: "Last one — how's your credit looking? (no judgment, just helps me line up the right deal)",
    quick_credit: ["Excellent", "Good", "Fair", "Building it back", "Skip"],
    ask_name: "Cool. What name should Eddie text?",
    ask_phone: "And the best number to reach you?",
    ask_time: "What's a good time for him to text you back?",
    quick_time: ["ASAP", "After 5pm", "This weekend"],
    done: "All set! Eddie will text you in 5 minutes. (You'd be lead #L0247.)",
    car_intro: (car) => `Hi! I see you're checking out the ${car.year} ${car.model} ${car.trim}. Want me to lock in ${car.pricing_type === "lease" ? fmtMoney(car.monthly_payment) + "/mo" : car.pricing_type === "apr" ? car.apr_rate + "% APR" : fmtMoney(car.sale_price)} or schedule a quick visit?`,
    car_quick: (car) => [
      car.pricing_type === "lease" ? "Lock the lease rate" : car.pricing_type === "apr" ? "Lock the APR" : "Lock this price",
      "Schedule a visit",
      "Just have a question",
      "Trade-in value",
    ],
    car_done: (car) => `Eddie will text you in 5 minutes about the ${car.model}.`,
  },
  es: {
    open: "Chat",
    title: "Chatea con Eddie",
    sub: "Bay 4 · Nissan of Omaha",
    typing: "Eddie está escribiendo…",
    placeholder: "Escribe un mensaje",
    send: "Enviar",
    home_intro: "¡Hola! 👋 Te ayudo a encontrar un carro en Nissan of Omaha. ¿Qué andas buscando?",
    quick_intent: ["Menos de $15K", "SUVs", "Trocas", "Especiales nuevos", "Cambio"],
    ask_budget: "¿Tienes presupuesto en mente? ¿O un pago mensual?",
    quick_budget: ["Menos de $15k", "$15–25k", "$25–35k", "$35k+", "Lo sabré cuando lo vea"],
    ask_timeline: "¿Cuándo te gustaría llevarte uno?",
    quick_timeline: ["Esta semana", "Este mes", "Solo viendo"],
    ask_credit: "Última — ¿cómo va tu crédito? (sin juicio, me ayuda a armarte el trato)",
    quick_credit: ["Excelente", "Bueno", "Regular", "Reconstruyendo", "Saltar"],
    ask_name: "Va. ¿A qué nombre te texteo?",
    ask_phone: "¿Y el mejor número para contactarte?",
    ask_time: "¿A qué hora te queda bien que te texteen?",
    quick_time: ["Ahora", "Después de las 5pm", "Este fin"],
    done: "¡Listo! Eddie te texteará en 5 minutos. (Serías el lead #L0247.)",
    car_intro: (car) => `¡Hola! Veo que andas viendo el ${car.year} ${car.model} ${car.trim}. ¿Te aparto ${car.pricing_type === "lease" ? fmtMoney(car.monthly_payment) + "/mes" : car.pricing_type === "apr" ? car.apr_rate + "% APR" : fmtMoney(car.sale_price)} o te agendo una visita?`,
    car_quick: (car) => [
      car.pricing_type === "lease" ? "Apartar la renta" : car.pricing_type === "apr" ? "Apartar el APR" : "Apartar el precio",
      "Agendar visita",
      "Tengo una pregunta",
      "Valor de cambio",
    ],
    car_done: (car) => `Eddie te texteará en 5 minutos sobre el ${car.model}.`,
  },
};

function ChatWidget({ lang, open, onOpen, onClose, vehicle }) {
  const txt = CHAT_TXT[lang] || CHAT_TXT.en;
  const [step, setStep] = useChatState("intro");
  const [messages, setMessages] = useChatState([]);
  const [typed, setTyped] = useChatState("");
  const [typing, setTyping] = useChatState(false);
  const scrollRef = useChatRef(null);

  // Reset/seed when opening or when vehicle changes
  useChatEffect(() => {
    if (!open) return;
    if (vehicle) {
      setMessages([{ from: "bot", text: txt.car_intro(vehicle), quick: txt.car_quick(vehicle) }]);
      setStep("car_chosen");
    } else {
      setMessages([{ from: "bot", text: txt.home_intro, quick: txt.quick_intent }]);
      setStep("intent");
    }
  }, [open, vehicle, lang]);

  useChatEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, typing, open]);

  const botSay = (text, quick) => {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((m) => [...m, { from: "bot", text, quick }]);
    }, 600);
  };

  const handle = (val) => {
    setMessages((m) => [...m, { from: "user", text: val }]);
    setTyped("");
    if (vehicle) {
      // car-page short flow: name -> phone -> time -> done
      if (step === "car_chosen") { setStep("name"); botSay(txt.ask_name); return; }
      if (step === "name") { setStep("phone"); botSay(txt.ask_phone); return; }
      if (step === "phone") { setStep("time"); botSay(txt.ask_time, txt.quick_time); return; }
      if (step === "time") { setStep("done"); botSay(txt.car_done(vehicle)); return; }
      return;
    }
    // homepage flow
    const flow = ["intent", "budget", "timeline", "credit", "name", "phone", "time"];
    const askMap = {
      intent: { next: "budget", q: txt.ask_budget, quick: txt.quick_budget },
      budget: { next: "timeline", q: txt.ask_timeline, quick: txt.quick_timeline },
      timeline: { next: "credit", q: txt.ask_credit, quick: txt.quick_credit },
      credit: { next: "name", q: txt.ask_name },
      name: { next: "phone", q: txt.ask_phone },
      phone: { next: "time", q: txt.ask_time, quick: txt.quick_time },
      time: { next: "done", q: txt.done },
    };
    const cur = askMap[step];
    if (cur) { setStep(cur.next); botSay(cur.q, cur.quick); }
  };

  if (!open) {
    return (
      <button onClick={onOpen} aria-label="Open chat" style={{
        position: "fixed", right: 24, bottom: 24, zIndex: 60,
        background: "#0A1020", color: "#E5EAF2",
        border: "1.5px solid var(--ink)", borderRadius: 999,
        padding: "14px 22px",
        fontFamily: "var(--sans)", fontWeight: 600, fontSize: 14,
        cursor: "pointer",
        boxShadow: "var(--shadow-card-sm)",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#5fd66e", boxShadow: "0 0 0 3px rgba(95,214,110,0.25)" }} />
        {txt.open}
      </button>
    );
  }

  return (
    <div style={{
      position: "fixed", right: 24, bottom: 24, zIndex: 60,
      width: 360, maxWidth: "calc(100vw - 32px)",
      height: 540, maxHeight: "calc(100vh - 48px)",
      background: "var(--paper)",
      border: "1.5px solid var(--ink)", borderRadius: 8,
      boxShadow: "8px 8px 0 var(--ink)",
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      <div style={{ padding: "14px 16px", borderBottom: "1.5px solid var(--ink)", background: "#0A1020", color: "#E5EAF2", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--rust)", display: "grid", placeItems: "center", fontFamily: "var(--serif)", fontStyle: "italic", fontWeight: 500 }}>e</div>
        <div style={{ flex: 1 }}>
          <div className="serif" style={{ fontSize: 16, lineHeight: 1.1, fontWeight: 500 }}>{txt.title}</div>
          <div className="mono" style={{ fontSize: 10, letterSpacing: "0.1em", color: "rgba(238,241,245,0.7)", textTransform: "uppercase" }}>{txt.sub}</div>
        </div>
        <button onClick={onClose} aria-label="Close" style={{ background: "transparent", border: 0, color: "var(--paper)", cursor: "pointer", fontSize: 18, padding: 4 }}>✕</button>
      </div>
      <div ref={scrollRef} style={{ flex: 1, padding: 14, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.from === "user" ? "flex-end" : "flex-start", gap: 8 }}>
            <div style={{
              maxWidth: "82%",
              padding: "10px 14px",
              borderRadius: m.from === "user" ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
              background: m.from === "user" ? "var(--ink)" : "var(--paper-2)",
              color: m.from === "user" ? "var(--paper)" : "var(--ink)",
              fontSize: 14, lineHeight: 1.4,
              border: "1.5px solid var(--ink)",
            }}>{m.text}</div>
            {m.quick && i === messages.length - 1 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {m.quick.map((q) => (
                  <button key={q} onClick={() => handle(q)} className="chip" style={{ cursor: "pointer", border: "1.5px solid var(--ink)" }}>{q}</button>
                ))}
              </div>
            )}
          </div>
        ))}
        {typing && (
          <div style={{ alignSelf: "flex-start", fontSize: 12, color: "var(--ink-3)", fontStyle: "italic" }}>{txt.typing}</div>
        )}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); if (typed.trim()) handle(typed.trim()); }}
        style={{ padding: 12, borderTop: "1.5px solid var(--ink)", display: "flex", gap: 8 }}>
        <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={txt.placeholder} style={{ flex: 1 }} />
        <button type="submit" className="btn btn-primary btn-sm">{txt.send}</button>
      </form>
    </div>
  );
}
window.ChatWidget = ChatWidget;
