const CARD_TAG = "figma-carousel-control-card";

const MENU_GRADIENTS = [
  ["rgba(59,130,246,0.6)", "rgba(37,99,235,0.6)"],
  ["rgba(168,85,247,0.6)", "rgba(147,51,234,0.6)"],
  ["rgba(34,197,94,0.6)", "rgba(22,163,74,0.6)"],
  ["rgba(249,115,22,0.6)", "rgba(234,88,12,0.6)"],
  ["rgba(239,68,68,0.6)", "rgba(220,38,38,0.6)"],
  ["rgba(234,179,8,0.6)", "rgba(202,138,4,0.6)"],
  ["rgba(6,182,212,0.6)", "rgba(8,145,178,0.6)"],
  ["rgba(236,72,153,0.6)", "rgba(219,39,119,0.6)"],
  ["rgba(99,102,241,0.6)", "rgba(79,70,229,0.6)"],
  ["rgba(20,184,166,0.6)", "rgba(13,148,136,0.6)"],
  ["rgba(139,92,246,0.6)", "rgba(124,58,237,0.6)"],
  ["rgba(16,185,129,0.6)", "rgba(5,150,105,0.6)"],
];

const STATUS_ICON_COLORS = [
  "#4ade80",
  "#60a5fa",
  "#fb923c",
  "#22d3ee",
  "#a78bfa",
  "#facc15",
  "#34d399",
  "#818cf8",
];

const escapeHtml = (value) => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/\"/g, "&quot;")
  .replace(/'/g, "&#39;");

const iconSvg = (path, viewBox = "0 0 24 24") => `<svg viewBox="${viewBox}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;


const STATUS_ICON_PATHS = [
  "<rect x='3' y='7' width='14' height='10' rx='2'/><path d='M17 10h2a2 2 0 0 1 0 4h-2'/><path d='M7 11h4'/>",
  "<path d='M5 12.55a11 11 0 0 1 14.08 0'/><path d='M1.42 9a16 16 0 0 1 21.16 0'/><path d='M8.53 16.11a6 6 0 0 1 6.95 0'/><line x1='12' y1='20' x2='12.01' y2='20'/>",
  "<path d='M14 14.76V3.5a2 2 0 0 0-4 0v11.26a4 4 0 1 0 4 0Z'/>",
  "<path d='M12 2v6'/><path d='M8 8a4 4 0 0 0 8 0'/><path d='M5 13a7 7 0 0 0 14 0'/>",
  "<circle cx='12' cy='12' r='10'/><polyline points='12 6 12 12 16 14'/>",
  "<polygon points='13 2 3 14 12 14 11 22 21 10 12 10 13 2'/>",
  "<path d='M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V7l8-3 8 3z'/>",
  "<path d='M6 18h.01'/><path d='M10 14h.01'/><path d='M14 10h.01'/><path d='M18 6h.01'/><path d='M6 6a16 16 0 0 1 12 12'/><path d='M6 10a12 12 0 0 1 8 8'/><path d='M6 14a8 8 0 0 1 4 4'/>",
];

const MENU_ICON_PATHS = [
  "<circle cx='12' cy='12' r='3'/><path d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'/>",
  "<path d='M8 2v4'/><path d='M16 2v4'/><rect x='3' y='6' width='18' height='15' rx='2'/><path d='M3 10h18'/>",
  "<path d='M3 12l9-9 9 9'/><path d='M5 10v10h14V10'/>",
  "<path d='M3 6h18'/><path d='M8 6V4h8v2'/><rect x='6' y='6' width='12' height='14' rx='2'/>",
  "<circle cx='12' cy='12' r='9'/><path d='M12 8v8'/><path d='M8 12h8'/>",
  "<path d='M12 2v6'/><path d='M8 8a4 4 0 0 0 8 0'/><path d='M5 13a7 7 0 0 0 14 0'/>",
  "<path d='M4 5h16'/><path d='M4 12h16'/><path d='M4 19h16'/>",
  "<path d='M4 4h16v16H4z'/><path d='M9 9h6v6H9z'/>",
  "<rect x='3' y='6' width='18' height='12' rx='2'/><path d='M7 10h10'/><path d='M7 14h6'/>",
  "<path d='M4 12h16'/><path d='M12 4v16'/>",
  "<circle cx='12' cy='12' r='3'/><path d='M12 2v2'/><path d='M12 20v2'/><path d='M2 12h2'/><path d='M20 12h2'/>",
  "<rect x='3' y='4' width='18' height='16' rx='2'/><path d='M7 8h10'/><path d='M7 12h10'/>",
];

class FigmaCarouselControlCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._hass = null;
    this._activeButtonIndex = 0;
    this._carouselIndex = 0;
    this._showOptions = false;
    this._didFirstRender = false;
    this._lastSensorSignature = "";
    this._lastButtonSignature = "";
  }

  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");
    this._config = { sensors: [], actions: [], buttons: [], images: [], ...config };
    ["sensors", "actions", "buttons", "images"].forEach((key) => {
      if (!Array.isArray(this._config[key])) throw new Error(`${key} must be a list`);
    });
    this._activeButtonIndex = Math.max(0, Math.min(this._activeButtonIndex, this._config.buttons.length - 1));
    this._carouselIndex = this._activeButtonIndex;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._config) return;

    const sensorSignature = this._sensorSignature();
    const buttonSignature = this._buttonSignature();
    if (!this._didFirstRender) {
      this._render();
      this._didFirstRender = true;
      this._lastSensorSignature = sensorSignature;
      this._lastButtonSignature = buttonSignature;
      return;
    }

    if (sensorSignature !== this._lastSensorSignature) {
      this._lastSensorSignature = sensorSignature;
      this._updateSensorState();
    }

    if (buttonSignature !== this._lastButtonSignature) {
      this._lastButtonSignature = buttonSignature;
      this._updateButtonState();
    }
  }

  getCardSize() {
    return 8;
  }

  _entityState(entityId) {
    return this._hass?.states?.[entityId] || null;
  }

  _friendlyName(entityId) {
    const stateObj = this._entityState(entityId);
    if (stateObj?.attributes?.friendly_name) return stateObj.attributes.friendly_name;
    return (entityId || "").split(".")[1]?.replace(/_/g, " ") || entityId;
  }

  _callService(domain, service, data = {}) {
    if (!this._hass) return;
    this._hass.callService(domain, service, data);
  }

  _relevantEntityIds(keys) {
    const ids = [];
    keys.forEach((key) => {
      (this._config?.[key] || []).forEach((item) => item?.entity && ids.push(item.entity));
    });
    return Array.from(new Set(ids));
  }

  _entitySignature(entityIds) {
    if (!this._hass || !this._config) return "";
    return entityIds.map((entityId) => {
      const stateObj = this._entityState(entityId);
      if (!stateObj) return `${entityId}:unavailable`;
      return `${entityId}:${stateObj.state}:${JSON.stringify(stateObj.attributes || {})}`;
    }).join("|");
  }

  _sensorSignature() {
    return this._entitySignature(this._relevantEntityIds(["sensors"]));
  }

  _buttonSignature() {
    return this._entitySignature(this._relevantEntityIds(["buttons"]));
  }

  _updateSensorState() {
    if (!this.shadowRoot || !this._config) return;
    (this._config.sensors || []).forEach((sensor, index) => {
      const valueNode = this.shadowRoot.querySelector(`[data-sensor-index=\"${index}\"] .status-value`);
      if (valueNode) valueNode.textContent = this._sensorValueText(sensor);
    });
  }

  _sensorValueText(sensor) {
    const state = this._entityState(sensor.entity);
    const unit = state?.attributes?.unit_of_measurement ? ` ${state.attributes.unit_of_measurement}` : "";
    return state ? `${state.state}${unit}` : "Unavailable";
  }

  _updateButtonState() {
    if (!this.shadowRoot || !this._config) return;

    (this._config.buttons || []).forEach((btn, index) => {
      const root = this.shadowRoot.querySelector(`[data-button-index=\"${index}\"]`);
      if (!root || !btn?.entity) return;
      const stateNode = root.querySelector('.menu-state');
      const optionsNode = root.querySelector('.menu-sub');
      const stateText = this._entityState(btn.entity)?.state ?? 'Unavailable';
      const optionCount = this._buttonOptions(btn.entity).length;
      if (stateNode) stateNode.textContent = stateText;
      if (optionsNode) optionsNode.textContent = `${optionCount} options`;
    });
  }
  _menuIconForIndex(index) {
    return iconSvg(MENU_ICON_PATHS[index % MENU_ICON_PATHS.length]);
  }

  _actionIcon(action) {
    const label = action.label.toLowerCase();
    if (label === "start") return iconSvg("<polygon points='5 3 19 12 5 21 5 3'/> ");
    if (label === "stop") return iconSvg("<rect x='6' y='6' width='12' height='12'/> ");
    if (label === "pause") return iconSvg("<line x1='9' y1='5' x2='9' y2='19'/><line x1='15' y1='5' x2='15' y2='19'/> ");
    if (label === "go home" || label === "home") return iconSvg("<path d='M3 11l9-8 9 8'/><path d='M9 22V12h6v10'/>");
    return iconSvg("<circle cx='12' cy='12' r='3'/><path d='M12 2v3'/><path d='M12 19v3'/><path d='M2 12h3'/><path d='M19 12h3'/> ");
  }

  _statusIcon(index) {
    const color = STATUS_ICON_COLORS[index % STATUS_ICON_COLORS.length];
    const path = STATUS_ICON_PATHS[index % STATUS_ICON_PATHS.length];
    return `<span class="icon-slot" style="color:${color}">${iconSvg(path)}</span>`;
  }

  _actionButtons() {
    return (this._config.actions || []).flatMap((action) => {
      const entityId = action?.entity;
      if (!entityId) return [];
      const [domain] = entityId.split(".");
      if (domain === "vacuum") {
        return [
          { key: `${entityId}-start`, label: "Start", color: "green", onClick: () => this._callService("vacuum", "start", { entity_id: entityId }) },
          { key: `${entityId}-stop`, label: "Stop", color: "red", onClick: () => this._callService("vacuum", "stop", { entity_id: entityId }) },
          { key: `${entityId}-pause`, label: "Pause", color: "yellow", onClick: () => this._callService("vacuum", "pause", { entity_id: entityId }) },
          { key: `${entityId}-home`, label: "Go Home", color: "blue", onClick: () => this._callService("vacuum", "return_to_base", { entity_id: entityId }) },
        ];
      }
      if (domain === "button") {
        return [{ key: `${entityId}-press`, label: this._friendlyName(entityId), color: "purple", onClick: () => this._callService("button", "press", { entity_id: entityId }) }];
      }
      if (["switch", "input_boolean"].includes(domain)) {
        return [{ key: `${entityId}-toggle`, label: this._friendlyName(entityId), color: "orange", onClick: () => this._callService(domain, "toggle", { entity_id: entityId }) }];
      }
      return [{ key: `${entityId}-toggle`, label: this._friendlyName(entityId), color: "gray", onClick: () => this._callService("homeassistant", "toggle", { entity_id: entityId }) }];
    });
  }

  _buttonOptions(entityId) {
    const stateObj = this._entityState(entityId);
    if (!stateObj) return [];
    const [domain] = entityId.split(".");
    if (["select", "input_select"].includes(domain)) {
      return (stateObj.attributes.options || []).map((option) => ({
        id: String(option),
        label: String(option),
        action: () => this._callService(domain, "select_option", { entity_id: entityId, option }),
      }));
    }
    if (["switch", "input_boolean"].includes(domain)) {
      return [
        { id: "on", label: "On", action: () => this._callService(domain, "turn_on", { entity_id: entityId }) },
        { id: "off", label: "Off", action: () => this._callService(domain, "turn_off", { entity_id: entityId }) },
      ];
    }
    return [];
  }

  _sensorMarkup() {
    return (this._config.sensors || []).map((sensor, index) => {
      const value = this._sensorValueText(sensor);
      const label = sensor.name || this._friendlyName(sensor.entity);
      return `
        <div class="status-pill" data-sensor-index="${index}" style="animation-delay:${index * 0.1}s">
          <span class="glass-a"></span><span class="glass-b"></span><span class="glass-c"></span><span class="glass-shine"></span>
          ${this._statusIcon(index)}
          <span class="status-text">
            <span class="status-label">${escapeHtml(label)}</span>
            <span class="status-value">${escapeHtml(value)}</span>
          </span>
        </div>`;
    }).join("");
  }

  _actionsMarkup() {
    return this._actionButtons().map((action, index) => `
      <button class="action-btn ${action.color}" data-action-key="${escapeHtml(action.key)}" style="animation-delay:${index * 0.1}s">
        <span class="glass-a"></span><span class="glass-b"></span><span class="glass-c"></span><span class="glass-shine"></span>
        <span class="action-icon">${this._actionIcon(action)}</span>
        <span class="action-text">${escapeHtml(action.label)}</span>
      </button>`).join("");
  }

  _menuButtonsMarkup() {
    return (this._config.buttons || []).map((btn, index) => {
      const entityId = btn?.entity;
      if (!entityId) return "";
      const active = index === this._activeButtonIndex;
      const options = this._buttonOptions(entityId);
      const gradient = MENU_GRADIENTS[index % MENU_GRADIENTS.length];
      return `
        <button class="menu-btn ${active ? "active" : ""}" data-button-index="${index}" style="--grad-a:${gradient[0]};--grad-b:${gradient[1]}">
          <span class="glass-a"></span><span class="glass-b"></span><span class="glass-c"></span><span class="glass-shine"></span>
          <span class="menu-top">
            <span class="menu-icon">${this._menuIconForIndex(index)}</span>
            <span class="menu-title">${escapeHtml(this._friendlyName(entityId))}</span>
          </span>
          <span class="menu-sub">${options.length} options</span>
          <span class="menu-state">${escapeHtml(this._entityState(entityId)?.state ?? "Unavailable")}</span>
        </button>`;
    }).join("");
  }

  _optionsMarkup() {
    if (!this._showOptions) return "";
    const selected = this._config.buttons?.[this._activeButtonIndex];
    if (!selected?.entity) return "";
    const options = this._buttonOptions(selected.entity);
    if (!options.length) {
      return `<div class="options-panel"><div class="option-item">No options available</div></div>`;
    }
    return `<div class="options-panel">${options.map((o, i) => `
      <button class="option-item" data-option-index="${i}" style="animation-delay:${i * 0.05}s">
        <span class="glass-a"></span><span class="glass-b"></span><span class="glass-c"></span><span class="glass-shine"></span>
        <span class="option-label">${escapeHtml(o.label)}</span>
      </button>`).join("")}</div>`;
  }

  _imageMarkup() {
    const images = this._config.images || [];
    const activeIndex = Math.min(this._activeButtonIndex, Math.max(0, images.length - 1));
    const track = images.length
      ? images.map((image, i) => `<div class="slide ${i === activeIndex ? "active" : ""}"><img class="carousel-image" src="${escapeHtml(image)}" alt="vacuum visual"></div>`).join("")
      : `<div class="placeholder">No images configured</div>`;
    const dots = images.map((_, i) => `<button class="dot ${i === activeIndex ? "active" : ""}" data-dot-index="${i}"></button>`).join("");
    return `
      <div class="carousel-shell">
        <div class="carousel-track" style="--active-index:${activeIndex}">${track}</div>
        <button class="nav-arrow prev" data-nav="prev">❮</button>
        <button class="nav-arrow next" data-nav="next">❯</button>
        ${this._optionsMarkup()}
        <div class="dots">${dots}</div>
      </div>`;
  }

  _render() {
    if (!this.shadowRoot || !this._config) return;
    this.shadowRoot.innerHTML = `
      <style>
        :host{display:block}
        ha-card{overflow:hidden;border-radius:24px;background:linear-gradient(135deg,rgba(31,41,55,.6),rgba(17,24,39,.6));border:1px solid rgba(255,255,255,.2);color:#fff;box-shadow:0 25px 50px rgba(0,0,0,.45)}
        .root{display:flex;flex-direction:column;min-height:600px;background:linear-gradient(135deg,#111827,#1f2937,#111827);isolation:isolate}
        .status-row,.actions-row{padding:12px 16px;background:rgba(255,255,255,.10);backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,255,255,.20)}
        .status-list{display:flex;align-items:center;gap:16px;overflow-x:auto}
        .actions-list{display:flex;align-items:center;gap:12px;flex-wrap:wrap}

        .content{display:flex;flex:1;overflow:hidden}
        .left{width:480px;padding:16px;position:relative}
        .right{flex:1;padding:16px;overflow-y:auto}
        .menu-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}

        .status-pill,.action-btn,.menu-btn,.option-item{position:relative;overflow:hidden}
        .glass-a{position:absolute;inset:0;background:linear-gradient(to bottom right,rgba(255,255,255,.2),transparent);opacity:.5;pointer-events:none}
        .glass-b{position:absolute;top:0;left:0;right:0;height:50%;background:linear-gradient(to bottom,rgba(255,255,255,.2),transparent);opacity:.6;pointer-events:none}
        .glass-c{position:absolute;bottom:0;left:0;right:0;height:1px;background:rgba(255,255,255,.4);pointer-events:none}
        .glass-shine{position:absolute;inset:0;background:linear-gradient(to right,transparent,rgba(255,255,255,.3),transparent);transform:translateX(-200%);transition:transform .7s ease-in-out;pointer-events:none}
        .status-pill:hover .glass-shine,.action-btn:hover .glass-shine,.menu-btn:hover .glass-shine,.option-item:hover .glass-shine{transform:translateX(200%)}

        .status-pill{display:flex;align-items:center;gap:8px;min-width:fit-content;background:rgba(255,255,255,.2);backdrop-filter:blur(12px);padding:8px 12px;border-radius:8px;box-shadow:0 10px 20px rgba(0,0,0,.2);border:1px solid rgba(255,255,255,.3);animation:statusIn .3s both}
        .icon-slot{position:relative;z-index:1;display:inline-flex;width:16px;height:16px}
        .icon-slot svg{width:16px;height:16px}
        .status-text{position:relative;z-index:1;display:flex;flex-direction:column}
        .status-label{font-size:12px;color:rgba(255,255,255,.7)}
        .status-value{font-size:14px;font-weight:600;color:#fff}

        .action-btn{display:inline-flex;align-items:center;gap:8px;padding:12px 16px;border-radius:12px;border:1px solid rgba(255,255,255,.3);backdrop-filter:blur(12px);color:#fff;font-size:14px;font-weight:500;cursor:pointer;box-shadow:0 10px 20px rgba(0,0,0,.2);transition:transform .2s ease, box-shadow .2s ease;animation:actionIn .28s both}
        .action-btn:hover{transform:scale(1.1);box-shadow:0 24px 32px rgba(0,0,0,.30)}
        .action-btn:active{transform:scale(.95)}
        .action-icon{position:relative;z-index:1;display:inline-flex;width:20px;height:20px;animation:wiggle 5s infinite}
        .action-icon svg{width:20px;height:20px}
        .action-text{position:relative;z-index:1;font-size:14px}
        .green{background:rgba(34,197,94,.6)} .red{background:rgba(239,68,68,.6)} .yellow{background:rgba(234,179,8,.6)} .blue{background:rgba(59,130,246,.6)} .purple{background:rgba(168,85,247,.6)} .orange{background:rgba(6,182,212,.6)} .gray{background:rgba(107,114,128,.6)}

        .carousel-shell{position:relative;width:100%;height:100%;background:rgba(17,24,39,.2);border-radius:8px;overflow:hidden;backdrop-filter:blur(4px)}
        .carousel-track{display:flex;height:100%;width:100%;transform:translate3d(calc(var(--active-index) * -100%),0,0);transition:transform .5s ease}
        .slide{min-width:100%;height:100%;position:relative}
        .carousel-image{width:100%;height:100%;object-fit:cover}
        .placeholder{display:grid;place-items:center;height:100%;color:rgba(255,255,255,.8)}
        .dots{position:absolute;left:0;right:0;bottom:10px;display:flex;justify-content:center;gap:8px;z-index:4}
        .dot{width:8px;height:8px;border:none;border-radius:999px;background:rgba(255,255,255,.55);cursor:pointer}
        .dot.active{width:18px;background:#fff}
        .nav-arrow{position:absolute;top:50%;transform:translateY(-50%);z-index:4;border:0;border-radius:999px;padding:12px 16px;cursor:pointer;color:#fff;background:rgba(59,130,246,.92);font-size:22px;line-height:1;transition:all .2s ease;box-shadow:0 10px 24px rgba(0,0,0,.25)}
        .nav-arrow:hover{background:rgba(37,99,235,.95);transform:translateY(-50%) scale(1.04)}
        .nav-arrow.prev{left:16px}
        .nav-arrow.next{right:16px}

        .options-panel{position:absolute;inset:0;background:rgba(0,0,0,.05);backdrop-filter:blur(6px);border-radius:8px;padding:24px;overflow-y:auto;z-index:5;animation:overlayIn .24s ease}
        .option-item{display:flex;align-items:center;gap:12px;width:100%;padding:16px;border-radius:12px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.15);box-shadow:0 10px 20px rgba(0,0,0,.2);backdrop-filter:blur(12px);margin-bottom:12px;cursor:pointer;color:#fff;text-align:left;animation:optionIn .2s both;overflow:hidden}
        .option-item:hover{background:rgba(255,255,255,.15);border-color:rgba(255,255,255,.3)}
        .option-label{position:relative;z-index:1;font-size:18px;font-weight:600;text-shadow:0 2px 4px rgba(0,0,0,.8)}

        .menu-btn{padding:20px;border-radius:16px;border:1px solid rgba(255,255,255,.3);background:linear-gradient(to bottom right,var(--grad-a),var(--grad-b));backdrop-filter:blur(12px);box-shadow:0 10px 20px rgba(0,0,0,.2);cursor:pointer;transition:transform .2s ease, box-shadow .2s ease;color:#fff;text-align:left}
        .menu-btn:hover{transform:scale(1.05);box-shadow:0 24px 32px rgba(0,0,0,.30)}
        .menu-btn:active{transform:scale(.95)}
        .menu-btn.active{outline:2px solid rgba(255,255,255,.62)}
        .menu-top,.menu-sub,.menu-state{position:relative;z-index:1;display:block}
        .menu-top{display:flex;align-items:center;gap:12px}
        .menu-icon{display:inline-flex;width:20px;height:20px}
        .menu-icon svg{width:20px;height:20px}
        .menu-title{font-size:16px;font-weight:600}
        .menu-sub{margin-top:8px;font-size:12px;opacity:.9}
        .menu-state{font-size:12px;opacity:.9}

        @keyframes statusIn {from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes actionIn {from{opacity:0;transform:scale(0)}to{opacity:1;transform:scale(1)}}
        @keyframes wiggle {0%,70%,100%{transform:rotate(0)}76%{transform:rotate(10deg)}82%{transform:rotate(-10deg)}88%{transform:rotate(0)}}
        @keyframes fade {from{opacity:.25}to{opacity:1}}
        @keyframes overlayIn {from{opacity:0;transform:translateX(-50px)}to{opacity:1;transform:translateX(0)}}
        @keyframes optionIn {from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}

        @media (max-width: 900px){
          .content{flex-direction:column}
          .left{width:100%;min-height:280px;padding:12px}
          .right{padding:12px;padding-top:0}
          .menu-grid{grid-template-columns:1fr}
          .nav-arrow{padding:8px 10px;font-size:16px}
        }
      </style>
      <ha-card>
        <div class="root">
          <div class="status-row"><div class="status-list">${this._sensorMarkup()}</div></div>
          <div class="actions-row"><div class="actions-list">${this._actionsMarkup()}</div></div>
          <div class="content">
            <div class="left">${this._imageMarkup()}</div>
            <div class="right"><div class="menu-grid">${this._menuButtonsMarkup()}</div></div>
          </div>
        </div>
      </ha-card>`;

    this._didFirstRender = true;
    this._lastSensorSignature = this._sensorSignature();
    this._lastButtonSignature = this._buttonSignature();

    this.shadowRoot.querySelectorAll("[data-action-key]").forEach((el) => {
      el.addEventListener("click", () => {
        const key = el.getAttribute("data-action-key");
        const found = this._actionButtons().find((action) => action.key === key);
        found?.onClick();
      });
    });

    this.shadowRoot.querySelectorAll("[data-button-index]").forEach((el) => {
      el.addEventListener("click", () => {
        const index = Number(el.getAttribute("data-button-index"));
        if (Number.isNaN(index)) return;
        if (this._activeButtonIndex === index && this._showOptions) {
          this._showOptions = false;
        } else {
          this._activeButtonIndex = index;
          this._carouselIndex = index;
          this._showOptions = true;
        }
        this._render();
      });
    });

    this.shadowRoot.querySelectorAll("[data-option-index]").forEach((el) => {
      el.addEventListener("click", () => {
        const optionIndex = Number(el.getAttribute("data-option-index"));
        const entityId = this._config.buttons?.[this._activeButtonIndex]?.entity;
        if (!entityId) return;
        const option = this._buttonOptions(entityId)[optionIndex];
        option?.action();
        this._showOptions = false;
        this._render();
      });
    });

    this.shadowRoot.querySelectorAll("[data-dot-index]").forEach((el) => {
      el.addEventListener("click", () => {
        const index = Number(el.getAttribute("data-dot-index"));
        if (Number.isNaN(index)) return;
        this._activeButtonIndex = Math.min(index, Math.max(0, this._config.buttons.length - 1));
        this._carouselIndex = index;
        this._showOptions = false;
        this._render();
      });
    });

    this.shadowRoot.querySelectorAll("[data-nav]").forEach((el) => {
      el.addEventListener("click", () => {
        const images = this._config.images || [];
        if (!images.length) return;
        const dir = el.getAttribute("data-nav");
        if (dir === "prev") {
          this._carouselIndex = (this._carouselIndex - 1 + images.length) % images.length;
        } else {
          this._carouselIndex = (this._carouselIndex + 1) % images.length;
        }
        this._activeButtonIndex = Math.min(this._carouselIndex, Math.max(0, this._config.buttons.length - 1));
        this._showOptions = false;
        this._render();
      });
    });
  }
}

if (!customElements.get(CARD_TAG)) {
  customElements.define(CARD_TAG, FigmaCarouselControlCard);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: CARD_TAG,
  name: "Figma Carousel Control Card",
  description: "Figma-inspired vacuum dashboard card with dynamic HA entities",
});
