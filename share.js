/* Stick Duel: share the game, invite friends to a co-op game, add the game to the home screen.
   Used by index.html and coop.html. Exposes window.StickShare. */
(() => {
  const BASE = new URL('./', location.href).href;
  let deferred = null;                      // Android/Chrome install prompt, if the browser offers one
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; });
  addEventListener('appinstalled', () => { deferred = null; refresh(); });
  const installed = () => (window.matchMedia && matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches) || navigator.standalone === true;
  const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  const css = document.createElement('style');
  css.textContent = `
  .ss-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:99;font:700 13px 'Silkscreen',monospace;letter-spacing:.04em;
    background:#f6eedf;color:#24150a;padding:10px 16px;box-shadow:0 4px 0 rgba(0,0,0,.35);max-width:90vw;text-align:center}
  .ss-help{position:fixed;inset:0;z-index:98;display:grid;place-items:center;padding:16px;background:rgba(22,18,38,.92);overflow-y:auto}
  .ss-card{width:min(440px,100%);display:flex;flex-direction:column;gap:12px;align-items:center;text-align:center;color:#f6eedf;font-family:'Rubik',system-ui,sans-serif}
  .ss-card h2{font:700 24px 'Silkscreen',monospace;margin:0;color:#f2a65a}
  .ss-card ol{text-align:left;margin:0;padding-left:1.4em;font-size:16px;line-height:1.5}
  .ss-card img{width:72px;height:72px;border-radius:16px}
  .ss-qr{background:#fff;padding:6px;line-height:0}
  .ss-qr svg{width:150px;height:150px}
  .ss-row{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}`;
  document.head.appendChild(css);

  function toast(msg, ms = 2600) {
    const t = document.createElement('div'); t.className = 'ss-toast'; t.textContent = msg;
    document.body.appendChild(t); setTimeout(() => t.remove(), ms);
  }
  async function share(title, text, url) {
    if (navigator.share) {
      try { await navigator.share({ title, text, url }); return; }
      catch (e) { if (e && e.name === 'AbortError') return; }
    }
    try { await navigator.clipboard.writeText(text + '\n' + url); toast('LINK COPIED: PASTE IT INTO A MESSAGE'); }
    catch (e) { window.prompt('Copy this link and send it:', url); }
  }
  const shareGame = () => share('Stick Duel', 'Play Stick Duel with me! Open the link, then add it to your home screen so it is one tap next time.', BASE);
  const inviteUrl = code => BASE + 'coop.html?join=' + encodeURIComponent(code);
  const invite = code => share('Stick Duel Co-op', 'Join my Stick Duel team! Game code ' + code + '. Tap the link:', inviteUrl(code));

  function help() {
    const box = document.createElement('div'); box.className = 'ss-help';
    const steps = isIOS()
      ? `<ol><li>Tap the <b>Share</b> button <b>⬆</b> (top right on iPad, bottom of the screen on iPhone).</li>
           <li>Scroll down and tap <b>Add to Home Screen</b>.</li><li>Tap <b>Add</b>.</li></ol>
         <p style="margin:0;font-size:13px;color:#b9b0c8">If you don't see it, open this page in Safari first.</p>`
      : `<ol><li>Tap the browser menu <b>⋮</b> (top right).</li>
           <li>Tap <b>Add to Home screen</b> or <b>Install app</b>.</li><li>Tap <b>Add</b> / <b>Install</b>.</li></ol>`;
    box.innerHTML = `<div class="ss-card"><img src="${BASE}apple-touch-icon.png" alt=""><h2>ADD TO HOME SCREEN</h2>${steps}
      <p style="margin:0;font-size:14px">Then the Stick Duel icon opens the game in one tap.</p>
      <button class="btn" type="button">GOT IT</button></div>`;
    box.querySelector('button').onclick = () => box.remove();
    box.addEventListener('click', e => { if (e.target === box) box.remove(); });
    document.body.appendChild(box);
  }
  function install() {
    if (deferred) { const d = deferred; deferred = null; d.prompt(); d.userChoice.then(() => refresh(), () => {}); }
    else help();
  }
  // QR code that opens a link (drawn with a small library, loaded only when needed)
  let qrLib = null;
  function loadQR() {
    if (window.qrcode) return Promise.resolve();
    if (!qrLib) qrLib = new Promise((ok, bad) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js';
      s.onload = ok; s.onerror = bad; document.head.appendChild(s);
    });
    return qrLib;
  }
  function qr(el, url) {
    loadQR().then(() => {
      const q = window.qrcode(0, 'M'); q.addData(url); q.make();
      el.innerHTML = q.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
      el.hidden = false;
    }).catch(() => { el.hidden = true; });
  }
  // the "add to home screen" buttons disappear once the game is opened from the home screen
  function refresh() { for (const b of document.querySelectorAll('[data-install]')) b.hidden = installed(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', refresh); else refresh();
  window.StickShare = { shareGame, invite, inviteUrl, install, qr, toast, installed };
})();
