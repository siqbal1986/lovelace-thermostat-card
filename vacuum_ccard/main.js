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
    this._showEmbeddedCard = false;
    this._embeddedCardEl = null;
    this._embeddedCardConfigKey = "";
    this._rendered = false;
  }

  setConfig(config) {
    this._config = {
      sensors: [],
      actions: [],
      buttons: [],
      images: [],
      embedded_card: null,
      embedded_button: { label: "Open card", icon: "mdi:open-in-new" },
      ...config,
    };
    ["sensors", "actions", "buttons", "images"].forEach((k) => {
      if (!Array.isArray(this._config[k])) throw new Error(`${k} must be a list`);
    });
    if (this._config.embedded_card && typeof this._config.embedded_card !== "object") {
      throw new Error("embedded_card must be a card configuration object");
    }
    if (this._config.embedded_button && typeof this._config.embedded_button !== "object") {
      throw new Error("embedded_button must be an object");
    }
    this._showEmbeddedCard = false;
    this._embeddedCardEl = null;
    this._embeddedCardConfigKey = JSON.stringify(this._config.embedded_card || null);
    this._activeButtonIndex = Math.min(this._activeButtonIndex, Math.max(0, this._config.buttons.length - 1));
    this._rendered = false;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._config) return;
    if (!this._rendered) {
      this._render();
      return;
    }
    this._refreshDynamicData();
  }

  getCardSize() { return 8; }

  _entityState(id) { return this._hass?.states?.[id] || null; }
  _friendlyName(id) {
    const st = this._entityState(id);
    return st?.attributes?.friendly_name || id?.split(".")[1]?.replace(/_/g, " ") || id;
  }
  _callService(domain, service, data) { this._hass?.callService(domain, service, data || {}); }

  _sensorValue(sensor) {
    const st = this._entityState(sensor.entity);
    const unit = st?.attributes?.unit_of_measurement ? ` ${st.attributes.unit_of_measurement}` : "";
    return st ? `${st.state}${unit}` : "Unavailable";
  }

  _sensorMarkup() {
    return (this._config.sensors || []).map((s, i) =>
      `<div class="status-pill" data-sensor-index="${i}"><span class="label">${escapeHtml(s.name || this._friendlyName(s.entity))}</span><span class="value">${escapeHtml(this._sensorValue(s))}</span></div>`
    ).join("");
  }

  _actionButtons() {
    return (this._config.actions || []).flatMap((a) => {
      const id = a?.entity; if (!id) return [];
      const [domain] = id.split(".");
      if (domain === "vacuum") {
        return [
          ["start", "Start"],
          ["pause", "Pause"],
          ["stop", "Stop"],
          ["return_to_base", "Home"],
        ].map(([svc, label]) => ({ key: `${id}-${svc}`, label, run: () => this._callService("vacuum", svc, { entity_id: id }) }));
      }
      if (domain === "button") return [{ key: `${id}-press`, label: this._friendlyName(id), run: () => this._callService("button", "press", { entity_id: id }) }];
      return [{ key: `${id}-toggle`, label: this._friendlyName(id), run: () => this._callService("homeassistant", "toggle", { entity_id: id }) }];
    });
  }

  _actionsMarkup() {
    return this._actionButtons().map((a, i) => `<button class="action-btn a${(i % 6) + 1}" data-action="${escapeHtml(a.key)}"><span class="shine"></span>${escapeHtml(a.label)}</button>`).join("");
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
      const state = this._entityState(id)?.state || "Unavailable";
      const options = this._buttonOptions(id).length;
      return `<button class="menu-btn" data-btn="${i}"><span class="shine"></span><div>${escapeHtml(this._friendlyName(id))}</div><small data-menu-meta="${i}">${options} options • ${escapeHtml(state)}</small></button>`;
    }).join("");
  }

  _overlayMarkup() {
    if (!this._showOptions) return "";
    const current = this._config.buttons?.[this._activeButtonIndex]?.entity;
    if (!current) return "";
    const options = this._buttonOptions(current);
    return `<div class="options-panel">${options.map((o, i) => `<button class="option-item" data-opt="${i}">${escapeHtml(o.label)}</button>`).join("")}</div>`;
  }

  _carouselMarkup() {
    const images = this._config.images || [];
    const slides = images.length
      ? images.map((img) => `<div class="slide"><img src="${escapeHtml(img)}" class="img" loading="eager"></div>`).join("")
      : `<div class="placeholder">No images</div>`;
    return `<div class="carousel"><div class="track">${slides}</div><div class="overlay-host"></div><div class="dots">${images.map((_, i) => `<button class="dot" data-dot="${i}"></button>`).join("")}</div></div>`;
  }

  _embeddedToggleMarkup() {
    if (!this._config.embedded_card) return "";
    const isBack = this._showEmbeddedCard;
    const icon = isBack
      ? (this._config.embedded_button?.close_icon || "mdi:arrow-left")
      : (this._config.embedded_button?.icon || "mdi:open-in-new");
    const label = isBack
      ? (this._config.embedded_button?.close_label || "Back")
      : (this._config.embedded_button?.label || "Open card");
    return `<button class="embedded-toggle" data-embedded-toggle><ha-icon icon="${escapeHtml(icon)}"></ha-icon><span>${escapeHtml(label)}</span></button>`;
  }

  _embeddedCardMarkup() {
    if (!this._showEmbeddedCard) return "";
    return `<div class="embedded-layer" data-embedded-layer>
      <div class="embedded-card-host" data-embedded-host></div>
      <div class="embedded-toolbar">${this._embeddedToggleMarkup()}</div>
    </div>`;
  }

  async _ensureEmbeddedCard() {
    if (!this.shadowRoot || !this._showEmbeddedCard || !this._config.embedded_card) return;
    const host = this.shadowRoot.querySelector("[data-embedded-host]");
    if (!host) return;
    const configKey = JSON.stringify(this._config.embedded_card || null);
    if (!this._embeddedCardEl || this._embeddedCardConfigKey !== configKey) {
      this._embeddedCardEl = null;
      this._embeddedCardConfigKey = configKey;
      try {
        const helpers = await window.loadCardHelpers?.();
        this._embeddedCardEl = helpers?.createCardElement
          ? helpers.createCardElement(this._config.embedded_card)
          : null;
      } catch (err) {
        this._embeddedCardEl = null;
      }
      if (!this._embeddedCardEl) {
        const fallback = document.createElement("div");
        fallback.textContent = "Unable to render embedded card.";
        fallback.classList.add("embedded-error");
        this._embeddedCardEl = fallback;
      } else if (this._embeddedCardEl.setConfig) {
        this._embeddedCardEl.setConfig(this._config.embedded_card);
      }
      this._embeddedCardEl.classList.add("embedded-card");
    }
    if (this._hass) this._embeddedCardEl.hass = this._hass;
    host.innerHTML = "";
    host.appendChild(this._embeddedCardEl);
  }

  _applyInteractiveState() {
    if (!this.shadowRoot) return;
    const track = this.shadowRoot.querySelector('.track');
    if (track) {
      track.style.setProperty('--idx', String(this._activeButtonIndex));
      track.classList.toggle('options-open', this._showOptions);
    }
    this.shadowRoot.querySelectorAll('[data-btn]').forEach((el, i) => el.classList.toggle('active', i === this._activeButtonIndex));
    this.shadowRoot.querySelectorAll('[data-dot]').forEach((el, i) => el.classList.toggle('active', i === this._activeButtonIndex));
    const host = this.shadowRoot.querySelector('.overlay-host');
    if (host) {
      host.innerHTML = this._overlayMarkup();
      host.querySelectorAll('[data-opt]').forEach((el) => el.addEventListener('click', () => {
        const id = this._config.buttons?.[this._activeButtonIndex]?.entity;
        if (!id) return;
        const opt = this._buttonOptions(id)[Number(el.getAttribute('data-opt'))];
        opt?.run();
        this._showOptions = false;
        this._applyInteractiveState();
      }));
    }
    const content = this.shadowRoot.querySelector('.content');
    if (content) content.classList.toggle('embedded-open', this._showEmbeddedCard);
    const embeddedRoot = this.shadowRoot.querySelector('.embedded-root');
    if (embeddedRoot) {
      embeddedRoot.style.pointerEvents = this._showEmbeddedCard ? 'auto' : 'none';
      embeddedRoot.innerHTML = this._embeddedCardMarkup();
      embeddedRoot.querySelectorAll('[data-embedded-toggle]').forEach((el) => el.addEventListener('click', () => {
        this._showEmbeddedCard = !this._showEmbeddedCard;
        this._applyInteractiveState();
      }));
      this._ensureEmbeddedCard();
    }
    const embeddedToggleHost = this.shadowRoot.querySelector('.embedded-toggle-host');
    if (embeddedToggleHost) {
      embeddedToggleHost.innerHTML = this._showEmbeddedCard ? "" : this._embeddedToggleMarkup();
      embeddedToggleHost.querySelectorAll('[data-embedded-toggle]').forEach((el)=>el.addEventListener('click',()=>{
        this._showEmbeddedCard = !this._showEmbeddedCard;
        this._showOptions = false;
        this._applyInteractiveState();
      }));
    }
  }

  _refreshDynamicData() {
    if (!this.shadowRoot) return;
    (this._config.sensors || []).forEach((s, i) => {
      const v = this.shadowRoot.querySelector(`[data-sensor-index="${i}"] .value`);
      if (v) v.textContent = this._sensorValue(s);
    });
    (this._config.buttons || []).forEach((b, i) => {
      const meta = this.shadowRoot.querySelector(`[data-menu-meta="${i}"]`);
      if (!meta) return;
      const state = this._entityState(b.entity)?.state || 'Unavailable';
      meta.textContent = `${this._buttonOptions(b.entity).length} options • ${state}`;
    });
    if (this._embeddedCardEl && this._hass) this._embeddedCardEl.hass = this._hass;
  }

  _bindEvents() {
    if (!this.shadowRoot) return;
    this.shadowRoot.querySelectorAll('[data-action]').forEach((el)=>el.addEventListener('click',()=>{
      const a=this._actionButtons().find(x=>x.key===el.getAttribute('data-action')); a?.run();
    }));
    this.shadowRoot.querySelectorAll('[data-btn]').forEach((el)=>el.addEventListener('click',()=>{
      const i=Number(el.getAttribute('data-btn')); const same=i===this._activeButtonIndex; this._activeButtonIndex=i; this._showOptions=same?!this._showOptions:true; this._applyInteractiveState();
    }));
    this.shadowRoot.querySelectorAll('[data-dot]').forEach((el)=>el.addEventListener('click',()=>{
      this._activeButtonIndex=Number(el.getAttribute('data-dot')); this._showOptions=false; this._applyInteractiveState();
    }));
  }

  _render() {
    if (!this._config || !this.shadowRoot) return;
    this.shadowRoot.innerHTML = `<style>
      :host{display:block} ha-card{color:#fff;border-radius:22px;overflow:hidden;background:linear-gradient(135deg,#111827,#1f2937);border:1px solid rgba(255,255,255,.2)}
      .status{padding:12px;display:flex;gap:8px;flex-wrap:wrap;background:rgba(255,255,255,.08)} .status-pill{padding:8px 10px;border:1px solid rgba(255,255,255,.2);border-radius:10px;background:rgba(255,255,255,.12)} .label{opacity:.75;font-size:11px;display:block}.value{font-weight:600;font-size:13px}
      .actions{padding:12px;display:flex;gap:8px;flex-wrap:wrap;background:rgba(255,255,255,.08);border-top:1px solid rgba(255,255,255,.14)}
      .action-btn{position:relative;overflow:hidden;border:1px solid rgba(255,255,255,.3);color:#fff;padding:10px 12px;border-radius:10px;font-weight:600;backdrop-filter:blur(8px)}
      .a1{background:rgba(34,197,94,.65)}.a2{background:rgba(234,179,8,.65)}.a3{background:rgba(239,68,68,.65)}.a4{background:rgba(59,130,246,.65)}.a5{background:rgba(168,85,247,.65)}.a6{background:rgba(6,182,212,.65)}
      .content{position:relative;display:flex;min-height:340px}.left{width:42%;padding:12px}.right{flex:1;padding:12px}
      .content.embedded-open .left,.content.embedded-open .right{visibility:hidden;pointer-events:none}
      .embedded-root{position:absolute;inset:0;z-index:5}
      .embedded-layer{position:absolute;inset:0;background:rgba(17,24,39,.8);backdrop-filter:blur(10px);overflow:hidden}
      .embedded-toolbar{position:absolute;top:12px;right:12px;z-index:2;pointer-events:auto}
      .embedded-card-host{position:absolute;inset:0;display:flex;min-height:0;pointer-events:auto;touch-action:auto}
      .embedded-card{width:100%;height:100%;display:block;pointer-events:auto;touch-action:auto}
      .embedded-card > *{width:100%;height:100%;pointer-events:auto;touch-action:auto}
      .embedded-error{width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.25);border-radius:12px;color:#fff}
      .carousel{position:relative;height:100%;border-radius:12px;overflow:hidden;background:rgba(0,0,0,.2)}
      .track{display:flex;height:100%;--idx:${this._activeButtonIndex};transform:translate3d(calc(var(--idx) * -100%),0,0);transition:transform 1.25s cubic-bezier(.22,.61,.36,1)}
      .slide{min-width:100%;height:100%}.img{width:100%;height:100%;object-fit:cover;transition:filter .35s ease}
      .track.options-open .img{filter:blur(1px) brightness(.97)}
      .overlay-host{position:absolute;inset:0}
      .options-panel{position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.04));backdrop-filter:blur(1px);padding:14px;display:flex;flex-direction:column;gap:10px;overflow:auto}
      .option-item{background:rgba(255,255,255,.72);border:1px solid rgba(17,24,39,.5);color:#111827;padding:12px;border-radius:10px;text-align:left;font-weight:600;text-shadow:0 1px 0 rgba(255,255,255,.35)}
      .menu{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
      .menu-btn{position:relative;overflow:hidden;background:linear-gradient(135deg,rgba(255,255,255,.92),rgba(226,232,240,.95));border:1px solid rgba(17,24,39,.45);color:#111827;padding:14px;border-radius:12px;text-align:left;backdrop-filter:blur(8px)}
      .menu-btn.active{outline:2px solid rgba(17,24,39,.6)}
      .menu-btn small{opacity:.9;color:#1f2937}
      .embedded-toggle{display:flex;align-items:center;gap:8px;margin-top:10px;width:100%;justify-content:center;padding:11px 12px;border-radius:12px;font-weight:600;color:#fff;background:rgba(59,130,246,.72);border:1px solid rgba(255,255,255,.32)}
      .embedded-toolbar .embedded-toggle{margin-top:0;width:auto;min-width:120px}
      .shine{position:absolute;inset:0;transform:translateX(-200%);background:linear-gradient(90deg,transparent,rgba(255,255,255,.25),transparent);transition:transform .7s ease}
      .menu-btn:hover .shine,.action-btn:hover .shine{transform:translateX(200%)}
      .dots{position:absolute;left:0;right:0;bottom:10px;display:flex;justify-content:center;gap:8px}.dot{width:8px;height:8px;border:none;border-radius:999px;background:rgba(255,255,255,.5)}.dot.active{width:18px;background:#fff}
      @media (max-width:900px){.content{flex-direction:column}.left{width:100%;height:280px}}
    </style>
    <ha-card>
      <div class="status">${this._sensorMarkup()}</div>
      <div class="actions">${this._actionsMarkup()}</div>
      <div class="content">
        <div class="left">${this._carouselMarkup()}</div>
        <div class="right"><div class="menu">${this._menuMarkup()}</div><div class="embedded-toggle-host"></div></div>
        <div class="embedded-root"></div>
      </div>
    </ha-card>`;

    this._bindEvents();
    this._applyInteractiveState();
    this._rendered = true;
  }
}

if (!customElements.get(CARD_TAG)) customElements.define(CARD_TAG, FigmaCarouselControlCard);
window.customCards = window.customCards || [];
window.customCards.push({ type: CARD_TAG, name: "Figma Carousel Control Card", description: "Figma-inspired vacuum dashboard card" });
