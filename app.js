// Shared by every page. Load order: supabase-js, config.js, app.js
// Minimal Supabase client over plain fetch: no CDN script, so nothing external can block the page.
addEventListener("error", e => {
  const d = document.createElement("div");
  d.style.cssText = "margin:12px;padding:12px;background:#FDECEA;color:#9B1C1C;font:14px/1.6 sans-serif;direction:ltr";
  d.textContent = "Error: " + e.message; document.body && document.body.prepend(d);
});
const sb = (() => {
  const U = SB_URL, ses = () => { try { return JSON.parse(localStorage.getItem("sbs")); } catch { return null; } };
  const save = d => { d.expires_at = d.expires_at || Math.floor(Date.now() / 1000) + d.expires_in; localStorage.setItem("sbs", JSON.stringify(d)); return d; };
  const post = (p, b) => fetch(U + p, { method: "POST", headers: { apikey: SB_KEY, "Content-Type": "application/json" }, body: JSON.stringify(b) });
  async function tok() {
    const s = ses(); if (!s) return null;
    if (s.expires_at - 60 > Date.now() / 1000) return s.access_token;
    try {
      const r = await post("/auth/v1/token?grant_type=refresh_token", { refresh_token: s.refresh_token });
      if (r.ok) return save(await r.json()).access_token;
    } catch {}
    localStorage.removeItem("sbs"); return null;
  }
  const bad = async (r, m) => { let e = {}; try { e = await r.json(); } catch {} return { message: e.message || e.error || m + " (" + r.status + ")" }; };
  class Q {
    constructor(t) { this.t = t; this.p = new URLSearchParams(); this.m = "GET"; this.h = {}; this.b = null; this.one = 0; }
    select(c = "*") { this.p.set("select", c); if (this.m != "GET") this.h.Prefer = (this.h.Prefer ? this.h.Prefer + "," : "") + "return=representation"; return this; }
    eq(k, v) { this.p.append(k, "eq." + v); return this; }
    order(k, { ascending = true } = {}) { this.p.set("order", k + "." + (ascending ? "asc" : "desc")); return this; }
    limit(n) { this.p.set("limit", n); return this; }
    insert(o) { this.m = "POST"; this.b = o; return this; }
    update(o) { this.m = "PATCH"; this.b = o; return this; }
    upsert(o) { this.m = "POST"; this.b = o; this.h.Prefer = "resolution=merge-duplicates"; return this; }
    delete() { this.m = "DELETE"; return this; }
    single() { this.one = 1; return this; }
    maybeSingle() { this.one = 2; return this; }
    then(a, b) { return this.run().then(a, b); }
    async run() {
      try {
        const t = await tok(), h = { apikey: SB_KEY, ...this.h }; if (t) h.Authorization = "Bearer " + t;
        if (this.b !== null) h["Content-Type"] = "application/json";
        const q = this.p.toString();
        const r = await fetch(U + "/rest/v1/" + this.t + (q ? "?" + q : ""), { method: this.m, headers: h, body: this.b !== null ? JSON.stringify(this.b) : undefined });
        if (!r.ok) return { data: null, error: await bad(r, "خرابی") };
        const x = await r.text(); let d = x ? JSON.parse(x) : null;
        if (this.one) { d = Array.isArray(d) ? (d[0] ?? null) : d; if (this.one == 1 && d === null) return { data: null, error: { message: "کچھ نہیں ملا" } }; }
        return { data: d, error: null };
      } catch (e) { return { data: null, error: { message: e.message || "نیٹ ورک کی خرابی" } }; }
    }
  }
  return {
    from: t => new Q(t),
    storage: { from: b => ({
      async upload(path, file, o = {}) {
        const t = await tok(), h = { apikey: SB_KEY, "Content-Type": o.contentType || file.type }; if (t) h.Authorization = "Bearer " + t;
        const r = await fetch(`${U}/storage/v1/object/${b}/${path}`, { method: "POST", headers: h, body: file });
        return { error: r.ok ? null : await bad(r, "اپلوڈ نہیں ہو سکا") };
      },
      getPublicUrl: path => ({ data: { publicUrl: `${U}/storage/v1/object/public/${b}/${path}` } })
    }) },
    auth: {
      async signInWithPassword({ email, password }) {
        try {
          const r = await post("/auth/v1/token?grant_type=password", { email, password });
          if (!r.ok) return { error: await bad(r, "لاگ اِن ناکام") };
          save(await r.json()); return { error: null };
        } catch (e) { return { error: { message: e.message } }; }
      },
      async getSession() { const t = await tok(); return { data: { session: t ? { access_token: t } : null } }; },
      async signOut() { localStorage.removeItem("sbs"); return { error: null }; }
    }
  };
})();
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const ud = s => String(s).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]);
const fdate = d => ud(new Date(d).toLocaleDateString("ur-PK", { day: "numeric", month: "long" }));
const mins = t => ud(Math.max(1, Math.round(String(t).trim().split(/\s+/).length / 150))) + " منٹ";
const av = a => `<span class="av">${a && a.photo_url ? `<img src="${esc(a.photo_url)}" alt="">` : esc((a && a.name || "ل")[0])}</span>`;
const avb = a => av(a).replace('class="av"', 'class="av big"');
const qid = k => new URLSearchParams(location.search).get(k);
const ICON = {
  share: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 10.5l6.8-4M8.6 13.5l6.8 4"/></svg>'
};

// Site name, header, footer links (from the "pages" table) and the bottom bar.
async function layout(active) {
  const [{ data: pg }, { data: st }] = await Promise.all([
    sb.from("pages").select("slug,title").eq("visible", true).order("sort"),
    sb.from("settings").select("value").eq("key", "site_name").maybeSingle()
  ]);
  const name = (st && st.value) || "خامہ و خیال";
  document.title = name;
  $("header").innerHTML = `<a class="brand" href="index.html">${esc(name)}</a>`;
  if ($("#foot")) $("#foot").innerHTML = (pg || []).map(p => `<a href="page.html?slug=${esc(p.slug)}">${esc(p.title)}</a>`).join("");
  const on = k => (active === k ? ' class="on"' : "");
  document.body.insertAdjacentHTML("beforeend",
    `<nav class="nav"><a href="index.html"${on("home")}>تحریریں</a><a href="writers.html"${on("writers")}>لکھاری</a>` +
    `<a href="submit.html"${on("send")}>تحریر بھیجیں</a></nav>`);
}

function toast(m) {
  const t = document.createElement("div"); t.className = "toast"; t.textContent = m;
  document.body.append(t); setTimeout(() => t.remove(), 2200);
}
function share(url) {
  const u = new URL(url, location.href).href;
  if (navigator.share) navigator.share({ url: u }).catch(() => {});
  else if (navigator.clipboard) navigator.clipboard.writeText(u).then(() => toast("لنک کاپی ہو گیا"), () => toast(u));
  else toast(u);
}

// paragraphs: blank line = new paragraph, single line break is kept (good for poetry)
const paras = t => String(t).split(/\n\s*\n/).map(p => `<p>${esc(p.trim()).replace(/\n/g, "<br>")}</p>`).join("");
