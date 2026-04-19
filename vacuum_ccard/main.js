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
    this._expandedRowKey = "";
    this._embeddedCardEl = null;
    this._embeddedCardConfigKey = "";
    this._embeddedSource = null;
  }

  setConfig(config) {
    this._config = {
      sensors: [],
      status_lines: [],
      actions: [],
      buttons: [],
      images: [],
      embedded_card: null,
      embedded_button: { label: "Map", icon: "mdi:map-search" },
      ...config,
    };
    ["sensors", "status_lines", "actions", "buttons", "images"].forEach((k) => {
      if (!Array.isArray(this._config[k])) throw new Error(`${k} must be a list`);
    });
    this._embeddedSource = null;
    this._embeddedCardEl = null;
    this._embeddedCardConfigKey = "";
    this._expandedRowKey = "";
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._config) return;
    if (this._embeddedCardEl) this._embeddedCardEl.hass = hass;
    this._render();
  }

  getCardSize() { return 10; }

  _entityState(id) { return this._hass?.states?.[id] || null; }

  _friendlyName(id) {
    const st = this._entityState(id);
    return st?.attributes?.friendly_name || id?.split(".")[1]?.replace(/_/g, " ") || id;
  }

  _callService(domain, service, data = {}) {
    this._hass?.callService(domain, service, data);
  }

  _valueFromEntity(entityId) {
    const st = this._entityState(entityId);
    if (!st) return "Unavailable";
    const unit = st?.attributes?.unit_of_measurement ? ` ${st.attributes.unit_of_measurement}` : "";
    return `${st.state}${unit}`;
  }

  _statusLines() {
    if (this._config.status_lines.length) return this._config.status_lines;
    if (this._config.sensors.length) {
      return [{ values: this._config.sensors.map((sensor) => ({
        entity: sensor.entity,
        label: sensor.name || this._friendlyName(sensor.entity),
        icon: sensor.icon,
      })) }];
    }
    return [];
  }

  _statusMarkup() {
    return this._statusLines().map((line, lineIndex) => {
      const values = line.values || line.items || [];
      const cols = Math.max(1, values.length);
      return `<div class="status-line" style="--cols:${cols}" data-status-line="${lineIndex}">
        ${values.map((value, idx) => {
          const text = value.value ?? (value.entity ? this._valueFromEntity(value.entity) : "");
          return `<div class="status-cell" data-status-item="${lineIndex}-${idx}">
            ${value.icon ? `<ha-icon icon="${escapeHtml(value.icon)}"></ha-icon>` : ""}
            <span class="status-label">${escapeHtml(value.label || value.name || this._friendlyName(value.entity))}</span>
            <span class="status-value">${escapeHtml(text)}</span>
          </div>`;
        }).join("")}
      </div>`;
    }).join("");
  }

  _buttonOptions(button) {
    if (Array.isArray(button?.options) && button.options.length) {
      return button.options.map((opt) => {
        const normalized = typeof opt === "string" ? { label: opt } : opt;
        const entity = button.entity;
        const state = entity ? this._entityState(entity)?.state : "";
        return {
          label: String(normalized.label ?? normalized.value ?? "Option"),
          description: normalized.description || "",
          image: normalized.image || normalized.thumb || "",
          selected: normalized.value ? String(normalized.value) === String(state) : String(normalized.label) === String(state),
          run: () => {
            if (normalized.service) {
              const [domain, service] = String(normalized.service).split(".");
              this._callService(domain, service, normalized.service_data || (entity ? { entity_id: entity } : {}));
              return;
            }
            if (entity) {
              const [domain] = entity.split(".");
              if (["select", "input_select"].includes(domain)) {
                this._callService(domain, "select_option", { entity_id: entity, option: normalized.value || normalized.label });
              }
            }
          },
        };
      });
    }

    const entityId = button?.entity;
    if (!entityId) return [];
    const st = this._entityState(entityId);
    if (!st) return [];
    const [domain] = entityId.split(".");

    if (["select", "input_select"].includes(domain)) {
      return (st.attributes?.options || []).map((opt) => ({
        label: String(opt),
        selected: String(opt) === String(st.state),
        image: button?.option_media?.[String(opt)] || "",
        run: () => this._callService(domain, "select_option", { entity_id: entityId, option: opt }),
      }));
    }

    if (["switch", "input_boolean"].includes(domain)) {
      return [
        {
          label: "On",
          selected: st.state === "on",
          image: button?.option_media?.On || button?.option_media?.on || "",
          run: () => this._callService(domain, "turn_on", { entity_id: entityId }),
        },
        {
          label: "Off",
          selected: st.state === "off",
          image: button?.option_media?.Off || button?.option_media?.off || "",
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
    if (options.length === 2 && !button?.force_detail) return "toggle";
    if (options.length > 0 || (button?.children || []).length || (button?.actions || []).length) return "detail";
    return "action";
  }

  _groupedButtons() {
    const map = new Map();
    (this._config.buttons || []).forEach((button, index) => {
      const group = button.group || "General";
      if (!map.has(group)) map.set(group, []);
      map.get(group).push({ button, index });
    });
    return [...map.entries()];
  }

  _primaryActions() {
    return (this._config.actions || []).flatMap((action) => {
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

  _visualMarkup() {
    const usingEmbedded = Boolean(this._config.embedded_card || this._embeddedSource?.embedded_card);
    if (usingEmbedded) {
      return `<div class="visual-stage map-stage"><div class="embedded-host" data-embedded-host></div></div>`;
    }
    const image = this._config.images?.[this._activeVisualIndex] || this._config.images?.[0];
    return `<div class="visual-stage">${image ? `<img src="${escapeHtml(image)}" class="main-image"/>` : `<div class="visual-empty">No map/image configured</div>`}</div>`;
  }

  _optionListMarkup(button, key) {
    const options = this._buttonOptions(button);
    const hasBg = Boolean(button.options_background);
    const style = hasBg ? `style="--options-bg:url('${escapeHtml(button.options_background)}')"` : "";
    return `<div class="inline-detail ${hasBg ? "with-bg" : ""}" ${style}>
      <div class="inline-header"><button class="inline-back" data-inline-back="${escapeHtml(key)}">←</button><span>${escapeHtml(button.name || this._friendlyName(button.entity))}</span></div>
      <div class="inline-options">
        ${options.map((option, idx) => `<div class="option-block">
          <button class="option-row ${option.selected ? "selected" : ""}" data-option-run="${escapeHtml(key)}:${idx}">
            <span>${escapeHtml(option.label)}</span>
          </button>
          ${option.description ? `<div class="option-note">${escapeHtml(option.description)}</div>` : ""}
          ${option.image ? `<img class="option-media" src="${escapeHtml(option.image)}"/>` : ""}
        </div>`).join("")}
      </div>
    </div>`;
  }

  _settingsRowsMarkup(entries) {
    return entries.map((entry) => {
      const button = entry.button;
      const key = `row-${entry.index}`;
      const kind = this._buttonKind(button);
      const value = button.value_label || (button.entity ? this._entityState(button.entity)?.state : "");
      const thumb = button.thumb || button.image;
      const expanded = this._expandedRowKey === key;

      return `<div class="row-wrap ${expanded ? "expanded" : ""}">
        <button class="settings-row" data-row="${escapeHtml(key)}">
          <div class="row-thumb">${thumb ? `<img src="${escapeHtml(thumb)}"/>` : `<ha-icon icon="${escapeHtml(button.icon || "mdi:tune")}"></ha-icon>`}</div>
          <div class="row-main">
            <div class="row-title">${escapeHtml(button.name || this._friendlyName(button.entity))}</div>
            <div class="row-subtitle">${escapeHtml(button.description || "")}</div>
          </div>
          <div class="row-value">${escapeHtml(value || "")}</div>
          <div class="row-chevron">${kind === "detail" ? "▾" : kind === "toggle" ? "⏻" : "▶"}</div>
        </button>
        ${expanded ? this._optionListMarkup(button, key) : ""}
      </div>`;
    }).join("");
  }

  _primaryActionsMarkup() {
    return this._primaryActions().map((action) => `<button class="primary-action" data-primary-action="${escapeHtml(action.key)}">
      <ha-icon icon="${escapeHtml(action.icon)}"></ha-icon><span>${escapeHtml(action.label)}</span>
    </button>`).join("");
  }

  async _ensureEmbeddedCard() {
    if (!this.shadowRoot) return;
    const host = this.shadowRoot.querySelector("[data-embedded-host]");
    const sourceCard = this._embeddedSource?.embedded_card || this._config.embedded_card;
    if (!host || !sourceCard) return;

    const key = JSON.stringify(sourceCard);
    if (!this._embeddedCardEl || this._embeddedCardConfigKey !== key) {
      this._embeddedCardEl = null;
      this._embeddedCardConfigKey = key;
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

  _bindEvents() {
    if (!this.shadowRoot) return;

    this.shadowRoot.querySelectorAll("[data-primary-action]").forEach((el) => el.addEventListener("click", () => {
      const action = this._primaryActions().find((x) => x.key === el.getAttribute("data-primary-action"));
      action?.run();
    }));

    this.shadowRoot.querySelectorAll("[data-row]").forEach((el) => el.addEventListener("click", () => {
      const key = el.getAttribute("data-row") || "";
      const idx = Number(key.replace("row-", ""));
      const button = this._config.buttons?.[idx];
      if (!button) return;
      const kind = this._buttonKind(button);

      if (kind === "toggle") {
        const options = this._buttonOptions(button);
        (options.find((x) => !x.selected) || options[0])?.run?.();
        this._render();
        return;
      }

      if (kind === "embedded") {
        this._embeddedSource = button?.embedded_card ? button : null;
        this._activeVisualIndex = 0;
        this._render();
        return;
      }

      if (kind === "detail") {
        this._expandedRowKey = this._expandedRowKey === key ? "" : key;
        this._render();
        return;
      }

      if (button.entity) this._callService("homeassistant", "toggle", { entity_id: button.entity });
    }));

    this.shadowRoot.querySelectorAll("[data-inline-back]").forEach((el) => el.addEventListener("click", (evt) => {
      evt.stopPropagation();
      this._expandedRowKey = "";
      this._render();
    }));

    this.shadowRoot.querySelectorAll("[data-option-run]").forEach((el) => el.addEventListener("click", (evt) => {
      evt.stopPropagation();
      const [key, idxRaw] = (el.getAttribute("data-option-run") || "").split(":");
      const rowIndex = Number(key.replace("row-", ""));
      const idx = Number(idxRaw);
      const button = this._config.buttons?.[rowIndex];
      const option = this._buttonOptions(button)?.[idx];
      option?.run?.();
      this._render();
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

    this.shadowRoot.innerHTML = `<style>
      :host{display:block;color:var(--primary-text-color,#fff)}
      ha-card{background:linear-gradient(160deg,#0b1220,#131f35);border-radius:18px;overflow:hidden;border:1px solid rgba(148,163,184,.28)}
      .shell{display:grid;gap:10px;padding:10px;box-sizing:border-box}
      .status-stack{display:grid;gap:6px}
      .status-line{display:grid;grid-template-columns:repeat(var(--cols),minmax(0,1fr));gap:6px}
      .status-cell{display:flex;align-items:center;gap:6px;padding:8px;border:1px solid rgba(148,163,184,.35);border-radius:10px;background:rgba(15,23,42,.6);min-width:0}
      .status-label{font-size:12px;color:#bfdbfe;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .status-value{font-weight:700;margin-left:auto;white-space:nowrap}
      .layout{display:grid;grid-template-columns:1fr;gap:10px}
      .visual-stage{border-radius:14px;overflow:hidden;border:1px solid rgba(148,163,184,.35);background:#020617;min-height:240px}
      .main-image{width:100%;height:100%;object-fit:cover;display:block}
      .map-stage{padding:8px;box-sizing:border-box}
      .embedded-host{height:260px}
      .embedded-card,.embedded-card>*{width:100%;height:100%}
      .embedded-error{height:100%;display:grid;place-items:center;background:rgba(148,163,184,.2);border-radius:10px}
      .groups{display:grid;gap:10px;grid-template-columns:1fr}
      .group{padding:8px;border-radius:12px;background:rgba(15,23,42,.45);border:1px solid rgba(148,163,184,.2)}
      .group h4{margin:0 0 8px 0;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#bfdbfe}
      .row-wrap{display:grid;gap:6px}
      .row-wrap + .row-wrap{margin-top:8px}
      .settings-row{width:100%;display:grid;grid-template-columns:40px 1fr auto auto;gap:8px;align-items:center;padding:8px;border-radius:10px;border:1px solid rgba(148,163,184,.3);background:rgba(15,23,42,.72);color:#fff;text-align:left;box-sizing:border-box}
      .row-thumb{width:40px;height:40px;border-radius:8px;overflow:hidden;display:grid;place-items:center;background:rgba(30,41,59,.9)}
      .row-thumb img{width:100%;height:100%;object-fit:cover}
      .row-main{min-width:0}
      .row-title{font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .row-subtitle{font-size:12px;color:#cbd5e1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .row-value{font-size:12px;opacity:.9;padding:0 4px}
      .inline-detail{padding:8px;border-radius:10px;border:1px solid rgba(148,163,184,.3);background:rgba(15,23,42,.92);position:relative;overflow:hidden}
      .inline-detail.with-bg::before{content:"";position:absolute;inset:0;background-image:var(--options-bg);background-size:cover;background-position:center;opacity:.28}
      .inline-detail > *{position:relative;z-index:1}
      .inline-header{display:flex;align-items:center;gap:8px;font-weight:700;margin-bottom:8px}
      .inline-back{border:none;background:rgba(15,23,42,.75);color:#fff;border-radius:8px;padding:3px 7px}
      .inline-options{display:grid;gap:8px}
      .option-block{display:grid;gap:4px}
      .option-row{width:100%;text-align:left;padding:9px 10px;border-radius:10px;border:1px solid rgba(226,232,240,.45);background:rgba(15,23,42,.46);color:#fff;font-weight:700}
      .option-row.selected{border-color:rgba(34,197,94,.8);background:rgba(34,197,94,.28)}
      .option-note{font-size:12px;color:#e2e8f0;opacity:.95}
      .option-media{width:100%;height:auto;border-radius:10px;display:block;border:1px solid rgba(226,232,240,.25)}
      .primary-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
      .primary-action{padding:11px 8px;border-radius:10px;border:1px solid rgba(148,163,184,.35);background:rgba(30,41,59,.82);color:#fff;font-weight:700;display:flex;align-items:center;justify-content:center;gap:6px;box-sizing:border-box}
      @media (min-width:900px){
        .groups{grid-template-columns:repeat(2,minmax(0,1fr))}
        .primary-actions{grid-template-columns:repeat(4,minmax(0,1fr))}
      }
      @media (prefers-reduced-motion: reduce){*,*::before,*::after{transition:none !important;animation:none !important}}
    </style>
    <ha-card>
      <div class="shell">
        <div class="status-stack">${this._statusMarkup()}</div>
        <div class="primary-actions">${this._primaryActionsMarkup()}</div>
        <div class="layout">
          ${this._visualMarkup()}
        </div>
        <div class="groups">
          ${this._groupedButtons().map(([group, entries]) => `<section class="group"><h4>${escapeHtml(group)}</h4>${this._settingsRowsMarkup(entries)}</section>`).join("")}
        </div>
      </div>
    </ha-card>`;

    this._bindEvents();
    this._ensureEmbeddedCard();
  }
}

if (!customElements.get(CARD_TAG)) customElements.define(CARD_TAG, FigmaCarouselControlCard);
window.customCards = window.customCards || [];
window.customCards.push({
  type: CARD_TAG,
  name: "Figma Carousel Control Card",
  description: "Map-first vacuum dashboard card with inline expandable options",
});
