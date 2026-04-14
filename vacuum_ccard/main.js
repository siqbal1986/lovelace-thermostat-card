const CARD_TAG = "figma-carousel-control-card";

const escapeHtml = (v) => String(v ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/\"/g, "&quot;")
  .replace(/'/g, "&#39;");

const isMobileLayout = () => window.matchMedia?.("(max-width: 900px)")?.matches;

class FigmaCarouselControlCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._hass = null;
    this._activeVisualIndex = 0;
    this._selectedRowIndex = -1;
    this._detailStack = [];
    this._embeddedCardEl = null;
    this._embeddedCardConfigKey = "";
    this._showEmbeddedCard = false;
    this._rendered = false;
  }

  setConfig(config) {
    this._config = {
      sensors: [],
      actions: [],
      buttons: [],
      images: [],
      embedded_card: null,
      embedded_button: { label: "Open map", icon: "mdi:map-search" },
      ...config,
    };
    ["sensors", "actions", "buttons", "images"].forEach((k) => {
      if (!Array.isArray(this._config[k])) throw new Error(`${k} must be a list`);
    });
    this._activeVisualIndex = Math.min(this._activeVisualIndex, Math.max(0, this._config.images.length - 1));
    this._selectedRowIndex = -1;
    this._detailStack = [];
    this._showEmbeddedCard = false;
    this._embeddedCardEl = null;
    this._embeddedCardConfigKey = "";
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
    if (this._embeddedCardEl) this._embeddedCardEl.hass = hass;
  }

  getCardSize() { return 10; }

  _entityState(id) { return this._hass?.states?.[id] || null; }

  _friendlyName(id) {
    const st = this._entityState(id);
    return st?.attributes?.friendly_name || id?.split(".")[1]?.replace(/_/g, " ") || id;
  }

  _callService(domain, service, data) {
    this._hass?.callService(domain, service, data || {});
  }

  _sensorValue(sensor) {
    const st = this._entityState(sensor.entity);
    if (!st) return { value: "Unavailable", unit: "" };
    return {
      value: st.state,
      unit: st.attributes?.unit_of_measurement || "",
    };
  }

  _buttonOptions(button) {
    const entityId = button?.entity;
    if (!entityId) return [];
    const st = this._entityState(entityId);
    if (!st) return [];
    const [domain] = entityId.split(".");

    if (["select", "input_select"].includes(domain)) {
      return (st.attributes?.options || []).map((opt) => ({
        label: String(opt),
        selected: String(opt) === String(st.state),
        run: () => this._callService(domain, "select_option", { entity_id: entityId, option: opt }),
      }));
    }

    if (["switch", "input_boolean"].includes(domain)) {
      return [
        {
          label: "On",
          selected: st.state === "on",
          run: () => this._callService(domain, "turn_on", { entity_id: entityId }),
        },
        {
          label: "Off",
          selected: st.state === "off",
          run: () => this._callService(domain, "turn_off", { entity_id: entityId }),
        },
      ];
    }

    return [];
  }

  _buttonKind(button) {
    const options = this._buttonOptions(button);
    if (button?.embedded_card || button?.behavior === "embedded") return "embedded";
    if (button?.behavior === "action") return "action";
    if (options.length === 2) return "toggle";
    if (options.length > 2) return "detail";
    if ((button?.children || []).length || (button?.actions || []).length || button?.panel_image || button?.message) return "detail";
    return "action";
  }

  _buttonValue(button) {
    if (button?.value_label) return String(button.value_label);
    const st = this._entityState(button?.entity);
    return st?.state || "";
  }

  _groupedButtons() {
    const groups = new Map();
    (this._config.buttons || []).forEach((button, index) => {
      const group = button?.group || "General";
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push({ button, index });
    });
    return [...groups.entries()];
  }

  _statsMarkup() {
    return (this._config.sensors || []).map((sensor, index) => {
      const sensorValue = this._sensorValue(sensor);
      const unitMarkup = sensorValue.unit ? `<span class="stat-unit">${escapeHtml(sensorValue.unit)}</span>` : "";
      return `<div class="stat-card" data-sensor-index="${index}">
        <div class="stat-icon"><ha-icon icon="${escapeHtml(sensor.icon || "mdi:chart-box")}"></ha-icon></div>
        <div class="stat-body">
          <div class="stat-label">${escapeHtml(sensor.name || this._friendlyName(sensor.entity))}</div>
          <div class="stat-value"><span class="stat-value-main">${escapeHtml(sensorValue.value)}</span>${unitMarkup}</div>
        </div>
      </div>`;
    }).join("");
  }

  _visualMarkup() {
    const images = this._config.images || [];
    const safeIndex = Math.min(this._activeVisualIndex, Math.max(0, images.length - 1));
    const slides = images.length
      ? images.map((img, idx) => `<div class="visual-slide ${idx === safeIndex ? "active" : ""}"><img src="${escapeHtml(img)}" loading="eager"/></div>`).join("")
      : `<div class="visual-placeholder">No visual configured</div>`;

    const embedded = this._showEmbeddedCard
      ? `<div class="embedded-layer" data-embedded-layer>
          <div class="embedded-topbar">
            <button class="icon-btn" data-close-embedded>
              <ha-icon icon="${escapeHtml(this._config.embedded_button?.close_icon || "mdi:close")}"></ha-icon>
              <span>${escapeHtml(this._config.embedded_button?.close_label || "Close")}</span>
            </button>
          </div>
          <div class="embedded-host" data-embedded-host></div>
        </div>`
      : "";

    return `<div class="visual-shell">
      <div class="visual-stage">${slides}${embedded}</div>
      <div class="visual-dots">${images.map((_, idx) => `<button class="dot ${idx === safeIndex ? "active" : ""}" data-dot="${idx}"></button>`).join("")}</div>
    </div>`;
  }

  _primaryActions() {
    return (this._config.actions || []).flatMap((action) => {
      if (action?.actions?.length) {
        return action.actions.map((custom, idx) => ({
          key: `${action.name || "action"}-${idx}`,
          label: custom.name || custom.label || `Action ${idx + 1}`,
          icon: custom.icon || "mdi:gesture-tap-button",
          run: () => this._runConfiguredAction(custom, action.entity),
        }));
      }

      const entityId = action?.entity;
      if (!entityId) return [];
      const [domain] = entityId.split(".");
      if (domain === "vacuum") {
        return [
          ["start", "Start", "mdi:play"],
          ["pause", "Pause", "mdi:pause"],
          ["return_to_base", "Home", "mdi:home-import-outline"],
          ["stop", "Stop", "mdi:stop"],
        ].map(([service, label, icon]) => ({
          key: `${entityId}-${service}`,
          label,
          icon,
          run: () => this._callService("vacuum", service, { entity_id: entityId }),
        }));
      }
      return [{
        key: `${entityId}-toggle`,
        label: action.name || this._friendlyName(entityId),
        icon: action.icon || "mdi:power",
        run: () => this._callService("homeassistant", "toggle", { entity_id: entityId }),
      }];
    });
  }

  _primaryActionsMarkup() {
    return this._primaryActions().map((action) => `<button class="primary-action" data-primary-action="${escapeHtml(action.key)}">
      <ha-icon icon="${escapeHtml(action.icon || "mdi:gesture-tap")}"></ha-icon>
      <span>${escapeHtml(action.label)}</span>
    </button>`).join("");
  }

  _settingsRowsMarkup(items = this._config.buttons || [], parentPath = "root") {
    return items.map((entry, listIndex) => {
      const button = entry?.button || entry;
      const key = entry?.key || `${parentPath}-${listIndex}`;
      const rootIndex = key.startsWith("root-") ? Number(key.split("-")[1]) : -1;
      const kind = this._buttonKind(button);
      const options = this._buttonOptions(button);
      const value = this._buttonValue(button);
      const state = this._entityState(button.entity)?.state;
      const checked = (state || "").toLowerCase() === "on" || options[0]?.selected;
      const thumb = button.thumb || button.image;
      const trailing = kind === "toggle"
        ? `<button class="toggle ${checked ? "on" : ""}" data-toggle="${escapeHtml(key)}" role="switch" aria-checked="${checked ? "true" : "false"}"><span></span></button>`
        : kind === "detail"
          ? `<ha-icon icon="mdi:chevron-right"></ha-icon>`
          : kind === "embedded"
            ? `<ha-icon icon="mdi:map-search"></ha-icon>`
            : `<ha-icon icon="mdi:play-circle-outline"></ha-icon>`;

      return `<button class="settings-row ${this._selectedRowIndex === rootIndex ? "selected" : ""}" data-row="${escapeHtml(key)}">
        <div class="row-thumb">${thumb ? `<img src="${escapeHtml(thumb)}"/>` : `<ha-icon icon="${escapeHtml(button.icon || "mdi:tune")}"></ha-icon>`}</div>
        <div class="row-main">
          <div class="row-title">${escapeHtml(button.name || this._friendlyName(button.entity))}</div>
          <div class="row-subtitle">${escapeHtml(button.description || (options.length ? `${options.length} options` : (state || "Tap to run")))}</div>
        </div>
        <div class="row-value" data-row-value="${escapeHtml(key)}">${escapeHtml(value)}</div>
        <div class="row-trailing">${trailing}</div>
      </button>`;
    }).join("");
  }

  _activeDetailNode() {
    return this._detailStack.length ? this._detailStack[this._detailStack.length - 1] : null;
  }

  _detailMarkup() {
    const node = this._activeDetailNode();
    if (!node) return "";

    const button = node.button;
    const options = this._buttonOptions(button);
    const actions = button.actions || [];
    const children = button.children || [];
    const breadcrumb = this._detailStack.map((x) => x.button.name || this._friendlyName(x.button.entity)).join(" / ");

    const optionCards = options.map((opt, idx) => `<button class="detail-option ${opt.selected ? "selected" : ""}" data-detail-option="${idx}">${escapeHtml(opt.label)}</button>`).join("");
    const actionCards = actions.map((action, idx) => `<button class="detail-action" data-detail-action="${idx}">
      <ha-icon icon="${escapeHtml(action.icon || "mdi:gesture-tap")}"></ha-icon>
      <span>${escapeHtml(action.name || action.label || `Action ${idx + 1}`)}</span>
    </button>`).join("");
    const childRows = children.length
      ? `<div class="detail-children">${this._settingsRowsMarkup(children, node.path)}</div>`
      : "";

    return `<section class="detail-panel ${isMobileLayout() ? "mobile-sheet" : "desktop-panel"}" data-detail-panel>
      <header class="detail-header">
        <button class="icon-btn" data-detail-back>
          <ha-icon icon="mdi:arrow-left"></ha-icon>
          <span>Back</span>
        </button>
        <div class="detail-titles">
          <div class="detail-breadcrumb">${escapeHtml(breadcrumb)}</div>
          <h3>${escapeHtml(button.name || this._friendlyName(button.entity))}</h3>
          <p>${escapeHtml(button.description || "Configure this setting")}</p>
        </div>
      </header>
      ${button.panel_image ? `<img class="detail-image" src="${escapeHtml(button.panel_image)}"/>` : ""}
      ${(button.badges || []).length ? `<div class="detail-badges">${button.badges.map((b) => `<span class="badge">${escapeHtml(b)}</span>`).join("")}</div>` : ""}
      ${button.message ? `<div class="detail-message">${escapeHtml(button.message)}</div>` : ""}
      ${optionCards ? `<div class="detail-options">${optionCards}</div>` : ""}
      ${actionCards ? `<div class="detail-actions">${actionCards}</div>` : ""}
      ${childRows}
    </section>`;
  }

  _runConfiguredAction(action, fallbackEntity) {
    if (!action) return;
    if (typeof action.tap_action === "object") {
      const cfg = action.tap_action;
      if (cfg.action === "call-service" && cfg.service) {
        const [domain, service] = cfg.service.split(".");
        this._callService(domain, service, cfg.service_data || {});
      }
      return;
    }
    if (action.service) {
      const [domain, service] = String(action.service).split(".");
      this._callService(domain, service, action.service_data || (fallbackEntity ? { entity_id: fallbackEntity } : {}));
      return;
    }
    if (action.entity || fallbackEntity) {
      this._callService("homeassistant", "toggle", { entity_id: action.entity || fallbackEntity });
    }
  }

  _openDetail(button, path) {
    this._detailStack.push({ button, path });
    this._render();
  }

  _openEmbedded(button = null) {
    this._showEmbeddedCard = true;
    this._embeddedSource = button?.embedded_card ? button : null;
    this._render();
  }

  async _ensureEmbeddedCard() {
    if (!this.shadowRoot || !this._showEmbeddedCard) return;
    const host = this.shadowRoot.querySelector("[data-embedded-host]");
    const sourceCard = this._embeddedSource?.embedded_card || this._config.embedded_card;
    if (!host || !sourceCard) return;

    const configKey = JSON.stringify(sourceCard);
    if (!this._embeddedCardEl || this._embeddedCardConfigKey !== configKey) {
      this._embeddedCardEl = null;
      this._embeddedCardConfigKey = configKey;
      try {
        const helpers = await window.loadCardHelpers?.();
        this._embeddedCardEl = helpers?.createCardElement?.(sourceCard) || null;
      } catch (_err) {
        this._embeddedCardEl = null;
      }
      if (!this._embeddedCardEl) {
        const fallback = document.createElement("div");
        fallback.className = "embedded-error";
        fallback.textContent = "Unable to render embedded card.";
        this._embeddedCardEl = fallback;
      } else if (this._embeddedCardEl.setConfig) {
        this._embeddedCardEl.setConfig(sourceCard);
      }
      this._embeddedCardEl.classList.add("embedded-card");
    }

    if (this._hass) this._embeddedCardEl.hass = this._hass;
    host.innerHTML = "";
    host.appendChild(this._embeddedCardEl);
  }

  _refreshDynamicData() {
    (this._config.sensors || []).forEach((sensor, index) => {
      const root = this.shadowRoot?.querySelector(`[data-sensor-index="${index}"]`);
      if (!root) return;
      const sensorValue = this._sensorValue(sensor);
      const main = root.querySelector(".stat-value-main");
      const unit = root.querySelector(".stat-unit");
      if (main) main.textContent = sensorValue.value;
      if (unit) unit.textContent = sensorValue.unit;
    });

    this.shadowRoot?.querySelectorAll("[data-row-value]").forEach((el) => {
      const key = el.getAttribute("data-row-value") || "";
      const idx = key.startsWith("root-") ? Number(key.split("-")[1]) : Number.NaN;
      const source = Number.isNaN(idx) ? null : this._config.buttons?.[idx];
      if (source) el.textContent = this._buttonValue(source);
    });
  }

  _handleRowClick(path, targetKind) {
    const parts = path.split("-");
    const idx = Number(parts[parts.length - 1]);
    const parentPath = parts.slice(0, -1).join("-");
    const list = parentPath === "root"
      ? this._config.buttons
      : (this._detailStack.find((node) => node.path === parentPath)?.button.children || []);
    const button = list?.[idx];
    if (!button) return;

    if (parentPath === "root") this._selectedRowIndex = idx;

    const image = button.image || button.thumb;
    if (image && (this._config.images || []).includes(image)) {
      this._activeVisualIndex = this._config.images.indexOf(image);
    }

    if (targetKind === "toggle") {
      const options = this._buttonOptions(button);
      const next = options.find((x) => !x.selected) || options[0];
      next?.run?.();
      this._refreshDynamicData();
      this._render();
      return;
    }

    if (targetKind === "embedded") {
      this._openEmbedded(button);
      return;
    }

    if (targetKind === "detail") {
      this._openDetail(button, path);
      return;
    }

    this._runConfiguredAction(button, button.entity);
  }

  _bindEvents() {
    if (!this.shadowRoot) return;

    this.shadowRoot.querySelectorAll("[data-dot]").forEach((el) => el.addEventListener("click", () => {
      this._activeVisualIndex = Number(el.getAttribute("data-dot"));
      this._render();
    }));

    this.shadowRoot.querySelectorAll("[data-primary-action]").forEach((el) => el.addEventListener("click", () => {
      const action = this._primaryActions().find((x) => x.key === el.getAttribute("data-primary-action"));
      action?.run();
    }));

    this.shadowRoot.querySelectorAll("[data-row]").forEach((el) => el.addEventListener("click", () => {
      const path = el.getAttribute("data-row") || "";
      const parts = path.split("-");
      const idx = Number(parts[parts.length - 1]);
      const parentPath = parts.slice(0, -1).join("-");
      const list = parentPath === "root"
        ? this._config.buttons
        : (this._detailStack.find((node) => node.path === parentPath)?.button.children || []);
      const button = list?.[idx];
      if (!button) return;
      const kind = this._buttonKind(button);
      this._handleRowClick(path, kind);
    }));

    this.shadowRoot.querySelectorAll("[data-toggle]").forEach((el) => el.addEventListener("click", (evt) => {
      evt.stopPropagation();
      const path = el.getAttribute("data-toggle") || "";
      this._handleRowClick(path, "toggle");
    }));

    const back = this.shadowRoot.querySelector("[data-detail-back]");
    if (back) {
      back.addEventListener("click", () => {
        this._detailStack.pop();
        this._render();
      });
    }

    this.shadowRoot.querySelectorAll("[data-detail-option]").forEach((el) => el.addEventListener("click", () => {
      const idx = Number(el.getAttribute("data-detail-option"));
      const node = this._activeDetailNode();
      const opt = this._buttonOptions(node?.button || {})[idx];
      opt?.run?.();
      this._refreshDynamicData();
      this._render();
    }));

    this.shadowRoot.querySelectorAll("[data-detail-action]").forEach((el) => el.addEventListener("click", () => {
      const idx = Number(el.getAttribute("data-detail-action"));
      const node = this._activeDetailNode();
      this._runConfiguredAction(node?.button?.actions?.[idx], node?.button?.entity);
    }));

    const closeEmbedded = this.shadowRoot.querySelector("[data-close-embedded]");
    if (closeEmbedded) {
      closeEmbedded.addEventListener("click", () => {
        this._showEmbeddedCard = false;
        this._render();
      });
    }

    const openGlobalEmbedded = this.shadowRoot.querySelector("[data-open-global-embedded]");
    if (openGlobalEmbedded) {
      openGlobalEmbedded.addEventListener("click", () => this._openEmbedded());
    }
  }

  _render() {
    if (!this._config || !this.shadowRoot) return;
    const grouped = this._groupedButtons();
    const detailMarkup = this._detailMarkup();

    this.shadowRoot.innerHTML = `<style>
      :host{display:block;color:var(--primary-text-color,#fff)}
      ha-card{background:linear-gradient(160deg,#0b1220,#131f35);border-radius:20px;overflow:hidden;border:1px solid rgba(148,163,184,.3)}
      .shell{display:grid;gap:12px;padding:12px}
      .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(135px,1fr));gap:10px}
      .stat-card{display:flex;align-items:center;gap:10px;padding:10px;border-radius:12px;background:rgba(15,23,42,.65);border:1px solid rgba(148,163,184,.35)}
      .stat-icon{width:34px;height:34px;display:grid;place-items:center;border-radius:10px;background:rgba(59,130,246,.18)}
      .stat-label{font-size:12px;color:#bfdbfe}
      .stat-value{font-weight:700;display:flex;gap:4px;align-items:baseline}
      .main{display:grid;grid-template-columns:1.15fr .85fr;gap:12px;align-items:stretch}
      .visual-shell{display:grid;gap:10px;min-height:360px}
      .visual-stage{position:relative;border-radius:16px;overflow:hidden;background:#020617;border:1px solid rgba(148,163,184,.3);min-height:320px}
      .visual-slide{position:absolute;inset:0;opacity:0;transform:scale(1.02);transition:opacity .28s ease,transform .28s ease}
      .visual-slide.active{opacity:1;transform:scale(1)}
      .visual-slide img,.detail-image{width:100%;height:100%;object-fit:cover}
      .visual-placeholder{height:100%;display:grid;place-items:center;color:#cbd5e1}
      .visual-dots{display:flex;justify-content:center;gap:8px}
      .dot{width:8px;height:8px;border-radius:999px;border:none;background:rgba(148,163,184,.55);cursor:pointer}
      .dot.active{width:22px;background:#f8fafc}
      .embedded-layer{position:absolute;inset:0;background:rgba(2,6,23,.86);backdrop-filter:blur(5px);display:grid;grid-template-rows:auto 1fr;z-index:3}
      .embedded-topbar{padding:10px;display:flex;justify-content:flex-end}
      .embedded-host{padding:0 10px 10px;min-height:0}
      .embedded-card,.embedded-card>*{width:100%;height:100%}
      .embedded-error{display:grid;place-items:center;height:100%;border-radius:12px;background:rgba(148,163,184,.2)}
      .settings-shell{display:grid;grid-template-columns:1fr;gap:10px;position:relative}
      .groups{display:grid;gap:10px}
      .group{padding:10px;border-radius:14px;background:rgba(15,23,42,.45);border:1px solid rgba(148,163,184,.2)}
      .group h4{margin:0 0 10px 0;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#bfdbfe}
      .settings-row{width:100%;display:grid;grid-template-columns:42px 1fr auto auto;gap:10px;align-items:center;text-align:left;background:rgba(15,23,42,.75);border:1px solid rgba(148,163,184,.25);padding:8px;border-radius:12px;color:#fff;cursor:pointer;transition:transform .2s ease,background .2s ease,border-color .2s ease}
      .settings-row + .settings-row{margin-top:8px}
      .settings-row:hover{transform:translateY(-1px);border-color:rgba(191,219,254,.65)}
      .settings-row:active{transform:translateY(0);background:rgba(30,41,59,.9)}
      .settings-row.selected{outline:1px solid rgba(125,211,252,.8)}
      .row-thumb{width:42px;height:42px;border-radius:10px;overflow:hidden;background:rgba(30,41,59,.9);display:grid;place-items:center}
      .row-thumb img{width:100%;height:100%;object-fit:cover}
      .row-title{font-weight:600}
      .row-subtitle{font-size:12px;color:#cbd5e1}
      .row-value{font-size:12px;color:#f8fafc;opacity:.85;max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .row-trailing{display:grid;place-items:center;color:#cbd5e1}
      .toggle{width:44px;height:26px;border-radius:999px;border:1px solid rgba(148,163,184,.4);background:rgba(51,65,85,.7);position:relative}
      .toggle span{position:absolute;top:2px;left:2px;width:20px;height:20px;border-radius:999px;background:#f8fafc;transition:left .2s ease}
      .toggle.on{background:rgba(34,197,94,.45)}
      .toggle.on span{left:21px}
      .detail-panel{background:rgba(2,6,23,.95);border:1px solid rgba(148,163,184,.35);border-radius:14px;padding:12px;display:grid;gap:10px;max-height:100%;overflow:auto}
      .detail-header{display:flex;gap:10px;align-items:flex-start}
      .icon-btn{display:inline-flex;align-items:center;gap:6px;padding:7px 9px;border-radius:10px;border:1px solid rgba(148,163,184,.4);background:rgba(30,41,59,.8);color:#fff;cursor:pointer}
      .detail-breadcrumb{font-size:11px;color:#93c5fd}
      .detail-header h3{margin:0;font-size:18px}
      .detail-header p{margin:2px 0 0 0;color:#cbd5e1;font-size:12px}
      .detail-image{height:120px;border-radius:10px}
      .detail-badges{display:flex;gap:8px;flex-wrap:wrap}.badge{padding:3px 8px;border-radius:999px;background:rgba(59,130,246,.22);font-size:11px}
      .detail-message{padding:10px;border-radius:10px;background:rgba(59,130,246,.16);border:1px solid rgba(59,130,246,.35);font-size:13px}
      .detail-options,.detail-actions{display:grid;gap:8px;grid-template-columns:repeat(auto-fit,minmax(110px,1fr))}
      .detail-option,.detail-action{padding:10px;border-radius:10px;border:1px solid rgba(148,163,184,.35);background:rgba(15,23,42,.8);color:#fff;cursor:pointer}
      .detail-option.selected{border-color:rgba(34,197,94,.8);background:rgba(34,197,94,.2)}
      .primary-actions{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
      .primary-action{display:flex;gap:8px;align-items:center;justify-content:center;padding:12px 10px;border-radius:12px;border:1px solid rgba(148,163,184,.35);background:rgba(30,41,59,.82);color:#fff;font-weight:600;cursor:pointer;transition:transform .2s ease,filter .2s ease}
      .primary-action:hover{transform:translateY(-1px);filter:brightness(1.1)}
      .primary-action:active{transform:translateY(0)}
      .global-embedded{justify-self:start}
      @media (max-width:900px){
        .main{grid-template-columns:1fr}
        .visual-shell{min-height:280px}
        .visual-stage{min-height:250px}
        .primary-actions{grid-template-columns:repeat(2,minmax(0,1fr))}
        .mobile-sheet{position:absolute;left:8px;right:8px;bottom:8px;z-index:4;max-height:68%;border-radius:16px 16px 12px 12px;box-shadow:0 -8px 24px rgba(2,6,23,.5)}
      }
      @media (min-width:901px){
        .settings-shell.with-detail{grid-template-columns:1fr 1fr}
      }
      @media (prefers-reduced-motion: reduce){
        *,*::before,*::after{transition:none !important;animation:none !important}
      }
    </style>
    <ha-card>
      <div class="shell">
        <div class="stats">${this._statsMarkup()}</div>
        <div class="main">
          <div class="left">${this._visualMarkup()}</div>
          <div class="settings-shell ${detailMarkup && !isMobileLayout() ? "with-detail" : ""}">
            <div class="groups">
              ${grouped.map(([group, entries]) => `<section class="group"><h4>${escapeHtml(group)}</h4>${this._settingsRowsMarkup(entries.map((entry, idx) => ({ button: entry.button, key: `root-${entry.index}`, index: idx })), `group-${escapeHtml(group)}`)}</section>`).join("")}
              ${this._config.embedded_card ? `<button class="icon-btn global-embedded" data-open-global-embedded><ha-icon icon="${escapeHtml(this._config.embedded_button?.icon || "mdi:map-search")}"></ha-icon><span>${escapeHtml(this._config.embedded_button?.label || "Open map")}</span></button>` : ""}
            </div>
            ${!isMobileLayout() ? detailMarkup : ""}
          </div>
        </div>
        <div class="primary-actions">${this._primaryActionsMarkup()}</div>
        ${isMobileLayout() ? detailMarkup : ""}
      </div>
    </ha-card>`;

    this._bindEvents();
    this._ensureEmbeddedCard();
    this._rendered = true;
  }
}

if (!customElements.get(CARD_TAG)) customElements.define(CARD_TAG, FigmaCarouselControlCard);
window.customCards = window.customCards || [];
window.customCards.push({
  type: CARD_TAG,
  name: "Figma Carousel Control Card",
  description: "Map-first vacuum dashboard card with hierarchical controls",
});
