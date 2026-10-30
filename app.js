// Shared by every page. Load order: supabase-js, config.js, app.js
const sb = supabase.createClient(SB_URL, SB_KEY);
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
