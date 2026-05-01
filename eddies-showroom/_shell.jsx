/* global React, ReactDOM */
// Shared app shell: language tween state + Tweaks panel + global theme application.
// Each page (index, car, admin) imports this and renders its main component inside.

const SHELL_R = React;
const { useState: shellUseState, useEffect: shellUseEffect } = SHELL_R;

// ----- URL helpers (used by every page to navigate) -----
window.nav = {
  home: () => { location.href = "index.html" + window.preserveQS(); },
  car: (slug) => { location.href = "car.html?slug=" + encodeURIComponent(slug) + window.preserveQS("&"); },
  admin: (screen) => { location.href = "admin.html?screen=" + (screen || "home") + window.preserveQS("&"); },
};

// Keeps lang= across navigations
window.preserveQS = (joiner = "?") => {
  const lang = new URLSearchParams(location.search).get("lang");
  return lang ? joiner + "lang=" + lang : "";
};

// ----- The shell that wraps every page -----
window.AppShell = function AppShell({ children, getLang, setLangPersist }) {
  // Tweaks
  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "lang": "en",
    "palette": "cream",
    "showAnnotations": false,
    "newLeadsBadge": true
  }/*EDITMODE-END*/;

  const [tw, setTwState] = shellUseState(() => {
    // pull lang from URL first if present
    const urlLang = new URLSearchParams(location.search).get("lang");
    return { ...TWEAK_DEFAULTS, ...(urlLang ? { lang: urlLang } : {}) };
  });

  const setTweak = (k, v) => {
    let next;
    if (typeof k === "object") next = { ...tw, ...k };
    else next = { ...tw, [k]: v };
    setTwState(next);
    if (window.parent !== window) {
      window.parent.postMessage({ type: "__edit_mode_set_keys", edits: typeof k === "object" ? k : { [k]: v } }, "*");
    }
    if (next.lang !== tw.lang) {
      // also persist in URL so links carry it
      const u = new URL(location.href);
      u.searchParams.set("lang", next.lang);
      history.replaceState({}, "", u);
    }
  };

  // Edit-mode (Tweaks panel) protocol
  const [editing, setEditing] = shellUseState(false);
  shellUseEffect(() => {
    const onMsg = (e) => {
      if (!e.data || typeof e.data !== "object") return;
      if (e.data.type === "__activate_edit_mode") setEditing(true);
      if (e.data.type === "__deactivate_edit_mode") setEditing(false);
    };
    window.addEventListener("message", onMsg);
    if (window.parent !== window) {
      window.parent.postMessage({ type: "__edit_mode_available" }, "*");
    }
    return () => window.removeEventListener("message", onMsg);
  }, []);

  // make lang readable + setter
  if (getLang) getLang.current = tw.lang;
  if (setLangPersist) setLangPersist.current = (v) => setTweak("lang", v);

  return (
    <SHELL_R.Fragment>
      {typeof children === "function" ? children(tw.lang, (v) => setTweak("lang", v), tw) : children}
      {editing && window.TweaksPanel && (
        <window.TweaksPanel title="Tweaks" onClose={() => {
          setEditing(false);
          window.parent.postMessage({ type: "__edit_mode_dismissed" }, "*");
        }}>
          <window.TweakSection title="Language">
            <window.TweakRadio value={tw.lang} onChange={(v) => setTweak("lang", v)}
              options={[{ value: "en", label: "English" }, { value: "es", label: "Español" }]} />
          </window.TweakSection>
          <window.TweakSection title="Admin theme">
            <window.TweakRadio value={tw.palette} onChange={(v) => setTweak("palette", v)}
              options={[{ value: "cream", label: "Light" }, { value: "ink", label: "Dark" }]} />
          </window.TweakSection>
          <window.TweakSection title="Demo flags">
            <window.TweakToggle label="Show new-lead pulse" value={tw.newLeadsBadge} onChange={(v) => setTweak("newLeadsBadge", v)} />
          </window.TweakSection>
        </window.TweaksPanel>
      )}
    </SHELL_R.Fragment>
  );
};
