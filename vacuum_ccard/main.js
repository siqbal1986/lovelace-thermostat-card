const CARD_TAG = "figma-carousel-control-card";

const escapeHtml = (v) => String(v ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/\"/g, "&quot;")
  .replace(/'/g, "&#39;");

class FigmaCarouselControlCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._hass = null;
    this._activeButtonIndex = 0;
    this._showOptions = false;
  }

  setConfig(config) {
    this._config = { sensors: [], actions: [], buttons: [], images: [], ...config };
    ["sensors", "actions", "buttons", "images"].forEach((k) => {
      if (!Array.isArray(this._config[k])) throw new Error(`${k} must be a list`);
    });
    this._activeButtonIndex = Math.min(this._activeButtonIndex, Math.max(0, this._config.buttons.length - 1));
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() { return 8; }

  _entityState(id) { return this._hass?.states?.[id] || null; }
  _friendlyName(id) {
    const st = this._entityState(id);
    return st?.attributes?.friendly_name || id?.split(".")[1]?.replace(/_/g, " ") || id;
  }
  _callService(domain, service, data) { this._hass?.callService(domain, service, data || {}); }

  _sensorMarkup() {
    return (this._config.sensors || []).map((s) => {
      const st = this._entityState(s.entity);
      const unit = st?.attributes?.unit_of_measurement ? ` ${st.attributes.unit_of_measurement}` : "";
      const value = st ? `${st.state}${unit}` : "Unavailable";
      return `<div class="status-pill"><span class="label">${escapeHtml(s.name || this._friendlyName(s.entity))}</span><span class="value">${escapeHtml(value)}</span></div>`;
    }).join("");
  }

  _actionButtons() {
    return (this._config.actions || []).flatMap((a) => {
      const id = a?.entity; if (!id) return [];
      const [domain] = id.split(".");
      if (domain === "vacuum") {
        return [
          ["Start", "vacuum", "start"],
          ["Pause", "vacuum", "pause"],
          ["Stop", "vacuum", "stop"],
          ["Home", "vacuum", "return_to_base"],
        ].map(([label, d, svc]) => ({ key: `${id}-${svc}`, label, run: () => this._callService(d, svc, { entity_id: id }) }));
      }
      if (domain === "button") return [{ key: `${id}-press`, label: this._friendlyName(id), run: () => this._callService("button", "press", { entity_id: id }) }];
      return [{ key: `${id}-toggle`, label: this._friendlyName(id), run: () => this._callService("homeassistant", "toggle", { entity_id: id }) }];
    });
  }

  _actionsMarkup() {
    return this._actionButtons().map((a) => `<button class="action-btn" data-action="${escapeHtml(a.key)}">${escapeHtml(a.label)}</button>`).join("");
  }

  _buttonOptions(entityId) {
    const st = this._entityState(entityId); if (!st) return [];
    const [domain] = entityId.split(".");
    if (["select", "input_select"].includes(domain)) {
      return (st.attributes.options || []).map((opt) => ({ label: String(opt), run: () => this._callService(domain, "select_option", { entity_id: entityId, option: opt }) }));
    }
    if (["switch", "input_boolean"].includes(domain)) {
      return [
        { label: "On", run: () => this._callService(domain, "turn_on", { entity_id: entityId }) },
        { label: "Off", run: () => this._callService(domain, "turn_off", { entity_id: entityId }) },
      ];
    }
    return [];
  }

  _menuMarkup() {
    return (this._config.buttons || []).map((b, i) => {
      const id = b.entity;
      const active = i === this._activeButtonIndex ? "active" : "";
      const state = this._entityState(id)?.state || "Unavailable";
      const options = this._buttonOptions(id).length;
      return `<button class="menu-btn ${active}" data-btn="${i}"><div>${escapeHtml(this._friendlyName(id))}</div><small>${options} options • ${escapeHtml(state)}</small></button>`;
    }).join("");
  }

  _optionsOverlay() {
    if (!this._showOptions) return "";
    const current = this._config.buttons?.[this._activeButtonIndex]?.entity;
    if (!current) return "";
    const options = this._buttonOptions(current);
    return `<div class="options-panel">${options.map((o, i) => `<button class="option-item" data-opt="${i}">${escapeHtml(o.label)}</button>`).join("")}</div>`;
  }

  _carouselMarkup() {
    const images = this._config.images || [];
    const active = Math.min(this._activeButtonIndex, Math.max(0, images.length - 1));
    const slides = images.length ? images.map((img) => `<div class="slide"><img src="${escapeHtml(img)}" class="img"></div>`).join("") : `<div class="placeholder">No images</div>`;
    return `<div class="carousel">
      <div class="track" style="--idx:${active}">${slides}</div>
      ${this._optionsOverlay()}
      <div class="dots">${images.map((_, i) => `<button class="dot ${i===active?"active":""}" data-dot="${i}"></button>`).join("")}</div>
    </div>`;
  }

  _render() {
    if (!this._config || !this.shadowRoot) return;
    this.shadowRoot.innerHTML = `<style>
      :host{display:block} ha-card{color:#fff;border-radius:22px;overflow:hidden;background:linear-gradient(135deg,#111827,#1f2937);border:1px solid rgba(255,255,255,.2)}
      .status{padding:12px;display:flex;gap:8px;flex-wrap:wrap;background:rgba(255,255,255,.08)} .status-pill{padding:8px 10px;border:1px solid rgba(255,255,255,.2);border-radius:10px;background:rgba(255,255,255,.12)} .label{opacity:.75;font-size:11px;display:block}.value{font-weight:600;font-size:13px}
      .actions{padding:12px;display:flex;gap:8px;flex-wrap:wrap;background:rgba(255,255,255,.08);border-top:1px solid rgba(255,255,255,.14)} .action-btn{background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.25);color:#fff;padding:10px 12px;border-radius:10px}
      .content{display:flex;min-height:340px}.left{width:42%;padding:12px}.right{flex:1;padding:12px}
      .carousel{position:relative;height:100%;border-radius:12px;overflow:hidden;background:rgba(0,0,0,.2)} .track{display:flex;height:100%;transform:translateX(calc(var(--idx) * -100%));transition:transform 1.2s cubic-bezier(.22,.61,.36,1)} .slide{min-width:100%;height:100%}.img{width:100%;height:100%;object-fit:cover}
      .options-panel{position:absolute;inset:0;background:transparent;padding:14px;display:flex;flex-direction:column;gap:10px;overflow:auto}
      .option-item{background:rgba(255,255,255,.03);backdrop-filter:none;border:1px solid rgba(255,255,255,.22);color:rgba(255,255,255,.85);padding:12px;border-radius:10px;text-align:left}
      .menu{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.menu-btn{background:linear-gradient(135deg,rgba(59,130,246,.45),rgba(37,99,235,.45));border:1px solid rgba(255,255,255,.24);color:#fff;padding:14px;border-radius:12px;text-align:left}.menu-btn.active{outline:2px solid rgba(255,255,255,.55)}
      .dots{position:absolute;left:0;right:0;bottom:10px;display:flex;justify-content:center;gap:8px}.dot{width:8px;height:8px;border:none;border-radius:999px;background:rgba(255,255,255,.5)}.dot.active{width:18px;background:#fff}
      @media (max-width:900px){.content{flex-direction:column}.left{width:100%;height:280px}}
    </style>
    <ha-card>
      <div class="status">${this._sensorMarkup()}</div>
      <div class="actions">${this._actionsMarkup()}</div>
      <div class="content"><div class="left">${this._carouselMarkup()}</div><div class="right"><div class="menu">${this._menuMarkup()}</div></div></div>
    </ha-card>`;

    this.shadowRoot.querySelectorAll('[data-action]').forEach((el)=>el.addEventListener('click',()=>{
      const a=this._actionButtons().find(x=>x.key===el.getAttribute('data-action')); a?.run();
    }));
    this.shadowRoot.querySelectorAll('[data-btn]').forEach((el)=>el.addEventListener('click',()=>{
      const i=Number(el.getAttribute('data-btn')); const same=i===this._activeButtonIndex; this._activeButtonIndex=i; this._showOptions=same?!this._showOptions:true; this._render();
    }));
    this.shadowRoot.querySelectorAll('[data-dot]').forEach((el)=>el.addEventListener('click',()=>{
      this._activeButtonIndex=Number(el.getAttribute('data-dot')); this._showOptions=false; this._render();
    }));
    this.shadowRoot.querySelectorAll('[data-opt]').forEach((el)=>el.addEventListener('click',()=>{
      const id=this._config.buttons?.[this._activeButtonIndex]?.entity; if(!id) return; const opt=this._buttonOptions(id)[Number(el.getAttribute('data-opt'))]; opt?.run(); this._showOptions=false; this._render();
    }));
  }
}

if (!customElements.get(CARD_TAG)) customElements.define(CARD_TAG, FigmaCarouselControlCard);
window.customCards = window.customCards || [];
window.customCards.push({ type: CARD_TAG, name: "Figma Carousel Control Card", description: "Figma-inspired vacuum dashboard card" });
