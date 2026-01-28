/**
 * The thermostat card is split into three files:
 *   - styles.js: returns a long CSS template literal that themes the widget.
 *   - thermostat_card.lib.js: builds and updates the SVG-based dial and mode controls.
 *   - this file: wires the card into Home Assistant, feeds data into the UI helper,
 *     and exposes it as a custom element.
 *
 * The imports below pull in the CSS factory function and the UI helper class. The
 * version numbers in the query strings make sure browsers reload the files when
 * the code changes instead of using an older cached copy.
 */
import {cssData} from './styles.js?v=1.3.4';
import ThermostatUI from './thermostat_card.lib.js?v=1.3.5';

// This log statement helps identify the version of the card in the browser console.
console.info("%c Thermostat Card \n%c  Version  1.3.4 ", "color: orange; font-weight: bold; background: black", "color: white; font-weight: bold; background: dimgray");
class ThermostatCard extends HTMLElement {
  constructor() {
    super(); // Always call the base HTMLElement constructor.
    this.attachShadow({ mode: 'open' }); // Use a shadow root so the card's DOM and CSS are isolated from the main page.
  }
  set hass(hass) {
    const config = this._config; // The configuration created in setConfig is cached on the instance.

    if (!config || !this.thermostat) {
      this._hass = hass; // If configuration is missing we still remember the hass reference for future updates.
      return; // Without configuration or a UI helper there is nothing to update yet.
    }

    const entity = hass.states[config.entity]; // Pull the climate entity the card should display.
    if(!entity){
      // Show a lightweight overlay when entity is missing/unavailable
      this._setUnavailable(true, 'Entity unavailable');
      this._hass = hass;
      return;
    } else {
      this._setUnavailable(false);
    }
    let min_value = entity.attributes.min_temp; // Default minimum temperature is provided by the entity.
    if (config.min_value)
      min_value = config.min_value; // Allow the user to override the minimum temperature via the card configuration.
    let max_value = entity.attributes.max_temp; // Same idea for the maximum temperature.
    if (config.max_value)
      max_value = config.max_value;
    // Ambient (room) temperature. Coerce to a number whether from the entity or an override sensor.
    let ambient_temperature = entity.attributes.current_temperature;
    if (ambient_temperature !== undefined) {
      const n = Number(ambient_temperature);
      ambient_temperature = Number.isFinite(n) ? n : 0;
    } else {
      ambient_temperature = 0;
    }
    if (config.ambient_temperature && hass.states[config.ambient_temperature]) {
      const raw = hass.states[config.ambient_temperature].state;
      const n = Number(raw);
      if (Number.isFinite(n)) ambient_temperature = n; // Optionally use a separate sensor for the ambient reading.
    }
    let hvac_state = entity.state; // The climate entity's main state (off, heat, cool, etc.).

    const new_state = {
      entity: entity, // Keep the entire entity reference so we can open the more-info panel later.
      min_value: min_value, // Remember the working minimum temperature.
      max_value: max_value, // Remember the working maximum temperature.
      ambient_temperature: ambient_temperature, // Store the current ambient reading.
      target_temperature: entity.attributes.temperature, // Single setpoint for heat-only or cool-only systems.
      target_temperature_low: entity.attributes.target_temp_low, // Low setpoint for dual-mode systems.
      target_temperature_high: entity.attributes.target_temp_high, // High setpoint for dual-mode systems.
      hvac_state: entity.state, // Primary HVAC mode (heat, cool, off, etc.).
      hvac_modes:entity.attributes.hvac_modes, // All available HVAC modes so the mode selector can list them.
      preset_mode: entity.attributes.preset_mode, // Optional preset (eco, away, etc.).
      away: (entity.attributes.away_mode == 'on' ? true : false) // Legacy away flag used by some thermostats.
    }

    // Update step from entity if user didn't explicitly configure it
    try {
      if (!this._userProvidedStep) {
        const entStep = Number(entity.attributes && entity.attributes.target_temp_step);
        const nextStep = Number.isFinite(entStep) && entStep > 0 ? Math.max(1, entStep) : 1;
        if (this._config.step !== nextStep) {
          this._config.step = nextStep;
          if (this.thermostat && this.thermostat._config) {
            this.thermostat._config.step = nextStep;
          }
        }
      }
    } catch (_) { /* ignore */ }

    if (!this._saved_state ||
      (this._saved_state.min_value != new_state.min_value ||
        this._saved_state.max_value != new_state.max_value ||
        this._saved_state.ambient_temperature != new_state.ambient_temperature ||
        this._saved_state.target_temperature != new_state.target_temperature ||
        this._saved_state.target_temperature_low != new_state.target_temperature_low ||
        this._saved_state.target_temperature_high != new_state.target_temperature_high ||
        this._saved_state.hvac_state != new_state.hvac_state ||
        this._saved_state.preset_mode != new_state.preset_mode ||
        this._saved_state.away != new_state.away)) {
      this._saved_state = new_state; // Cache the incoming state so we can detect future changes and avoid unnecessary redraws.
      this.thermostat.updateState(new_state,hass); // Hand the state data to the SVG/UI helper for rendering.
      // Phase 2: apply optional anchor-aligned adjustments (no DOM moves)
      try { this._applyLayeredAlignment(); } catch(_){}
      // Optional: build/update the new mode carousel UI
      try { if (this._config && this._config.mode_carousel_ui === true) this._buildOrUpdateModeCarousel(new_state, hass); } catch(_){}
     }
    this._hass = hass; // Always hold onto the latest Home Assistant object for future service calls.
  }

  openProp(entityId) {
    this.fire('hass-more-info', { entityId }); // Helper called when the info button is tapped to open the default entity dialog.
  }
  _setUnavailable(show, message='Unavailable'){
    try{
      if(!this._cardEl){ return; }
      if(show){
        if(!this._unavailableEl){
          const overlay = document.createElement('div');
          overlay.setAttribute('role','status');
          overlay.style.position='absolute';
          overlay.style.inset='0';
          overlay.style.display='flex';
          overlay.style.alignItems='center';
          overlay.style.justifyContent='center';
          overlay.style.zIndex='50';
          overlay.style.backdropFilter='blur(1.5px)';
          overlay.style.background='rgba(0,0,0,0.18)';
          overlay.style.color='var(--primary-text-color, #fff)';
          overlay.style.fontWeight='600';
          overlay.style.textShadow='0 1px 2px rgba(0,0,0,0.35)';
          this._cardEl.style.position='relative';
          this._unavailableEl = overlay;
          this._cardEl.appendChild(overlay);
        }
        this._unavailableEl.textContent = message;
        this._unavailableEl.style.display='flex';
      }else if(this._unavailableEl){
        this._unavailableEl.style.display='none';
      }
    }catch(_){/* ignore */}
  }
  fire(type, detail, options) {

    options = options || {} // Allow callers to omit the options bag.
    detail = detail === null || detail === undefined ? {} : detail // Ensure the event carries an object payload.
    const e = new Event(type, {
      bubbles: options.bubbles === undefined ? true : options.bubbles, // Events bubble through the DOM tree by default so HA can catch them.
      cancelable: Boolean(options.cancelable), // Allow callers to prevent the default behavior if they need to.
      composed: options.composed === undefined ? true : options.composed, // Composed events can leave the shadow DOM and reach HA.
    })

    e.detail = detail // Attach the detail payload expected by HA (e.g., entityId).
    this.dispatchEvent(e) // Fire the event through the shadow boundary.
    return e // Return the event so callers can inspect it if needed.
  }

  _controlSetPoints() {
    // Decide based on current HVAC mode rather than lingering dual flag
    const state = this._saved_state;
    const hvacMode = state && state.hvac_state;
    const isDual = hvacMode === 'heat_cool' || hvacMode === 'auto';
    if (isDual) {
      const high = Number(this.thermostat.temperature.high);
      const low = Number(this.thermostat.temperature.low);
      const changed = (high !== Number(state.target_temperature_high)) || (low !== Number(state.target_temperature_low));
      if (changed && Number.isFinite(high) && Number.isFinite(low)) {
        this._hass.callService('climate', 'set_temperature', {
          entity_id: this._config.entity,
          target_temp_high: high,
          target_temp_low: low,
        });
      }
    } else {
      const target = Number(this.thermostat.temperature.target);
      if (Number.isFinite(target) && target !== Number(state.target_temperature)) {
        this._hass.callService('climate', 'set_temperature', {
          entity_id: this._config.entity,
          temperature: target,
        });
      }
    }
  }

  _renderError(message) {
    const card = document.createElement('ha-card');
    const style = document.createElement('style');
    style.textContent = cssData();
    try {
      const s = document.createElement('style');
      s.textContent = 'svg.dial.modec-open #ambient, svg.dial.modec-open #target, svg.dial.modec-open #low, svg.dial.modec-open #high { display: none !important; }';
      this.shadowRoot.appendChild(s);
    } catch(_) { }
    card.appendChild(style);

    const wrapper = document.createElement('div');
    wrapper.setAttribute('role', 'alert');
    wrapper.style.padding = '16px';
    wrapper.style.textAlign = 'center';
    wrapper.style.fontWeight = '500';
    wrapper.style.lineHeight = '1.4';
    wrapper.textContent = message;

    card.appendChild(wrapper);
    this.shadowRoot.appendChild(card);
  }

  setConfig(config) {
    const root = this.shadowRoot; // Everything rendered by the card lives inside the shadow DOM created in the constructor.

    while (root.lastChild) {
      root.removeChild(root.lastChild); // Remove any previous DOM so the card can be reconfigured cleanly.
    }

    const rawConfig = deepClone(config || {}); // Clone the configuration object so mutations do not leak back to HA.
    const { entity } = rawConfig; // Extract the entity string if provided.
    const entityId = typeof entity === 'string' ? entity.trim() : ''; // Normalize the entity id by trimming whitespace.
    const [domain, objectId] = entityId.split('.'); // Split "climate.living_room" into ["climate", "living_room"].
    const hasEntity = entityId.length > 0; // Track whether the user supplied anything at all.
    const isClimateEntity = domain === 'climate' && !!objectId; // Make sure the entity string points to a climate domain entity.

    if (!hasEntity || !isClimateEntity) {
      const message = hasEntity
        ? 'Thermostat Card requires a climate.<object_id> entity (e.g., climate.living_room).'
        : 'Thermostat Card needs an entity from the climate domain (e.g., climate.living_room).';

      this._renderError(message);
      this._config = { ...rawConfig, entity: entityId };
      this.thermostat = null;
      this._saved_state = null;
      return;
    }

    // Prepare config defaults
    const cardConfig = rawConfig; // Reuse the cloned config so the code below can add defaults directly onto it.
    cardConfig.entity = entityId; // Store the normalized entity id for later use.
    // cardConfig.hvac = Object.assign({}, config.hvac);

    if (!cardConfig.diameter) cardConfig.diameter = 400;
    if (!cardConfig.pending) cardConfig.pending = 3;
    if (!cardConfig.idle_zone) cardConfig.idle_zone = 2;
    // Track whether user explicitly provided common options
    this._userProvidedStep = Object.prototype.hasOwnProperty.call(rawConfig, 'step');
    cardConfig.userTitleProvided = Object.prototype.hasOwnProperty.call(rawConfig, 'title');
    if (!cardConfig.step) cardConfig.step = 1;
    if (!cardConfig.highlight_tap) cardConfig.highlight_tap = false;
    if (!cardConfig.no_card) cardConfig.no_card = false;
    if (!cardConfig.chevron_size) cardConfig.chevron_size = 34;
    if (!cardConfig.num_ticks) cardConfig.num_ticks = 150;
    if (!cardConfig.tick_degrees) cardConfig.tick_degrees = 300;
    if (!cardConfig.fx_weather) cardConfig.fx_weather = 'storm';

    // Extra config values generated for simplicity of updates
    cardConfig.radius = cardConfig.diameter / 2; // The SVG uses radius rather than diameter, so store it for convenience.
    cardConfig.ticks_outer_radius = cardConfig.diameter / 30; // Pre-calculated distance from the center to the outside of tick marks.
    cardConfig.ticks_inner_radius = cardConfig.diameter / 8; // Pre-calculated distance to the inner end of tick marks.
    cardConfig.offset_degrees = 180 - (360 - cardConfig.tick_degrees) / 2; // Angle offset so the tick arc is centered vertically.
    cardConfig.control = this._controlSetPoints.bind(this); // Provide the UI helper with a callback to send temperature changes back to HA.
    cardConfig.propWin = this.openProp.bind(this); // Provide a callback that opens the more-info dialog when needed.

    // Phase 1 of layered refactor: optionally align geometry to SVG anchor percentages
    // without moving DOM. When enabled via `use_layered_anchors: true`, we map the
    // ticks ring to 70%..90% of the base radius as defined by your layered spec.
    try {
      if (cardConfig.use_layered_anchors === true) {
        const R = cardConfig.radius; // base radius of the dial
        // ticks_main: donut with inner radius 70% and outer radius 90% of base
        // Note: the UI expects absolute Y offsets from the top edge, so convert
        // center-relative radii to top offsets (y = R - r)
        const rOuter = R * 0.90;
        const rInner = R * 0.70;
        cardConfig.ticks_outer_radius = Math.max(0, R - rOuter); // ~0.10 * R
        cardConfig.ticks_inner_radius = Math.max(0, R - rInner); // ~0.30 * R
        // Keep other layers (numbers/mode/rim/aura/glass) unchanged in phase 1
      }
    } catch (_){ /* ignore mapping errors */ }
    this.thermostat = new ThermostatUI(cardConfig); // Build the heavy SVG/UI helper once configuration is ready.

    if (cardConfig.no_card === true) {

      const card = document.createElement('ha-card');
      card.className = "no_card";
      const style = document.createElement('style');
      style.textContent = cssData();
    try {
      const s = document.createElement('style');
      s.textContent = 'svg.dial.modec-open #ambient, svg.dial.modec-open #target, svg.dial.modec-open #low, svg.dial.modec-open #high { display: none !important; }';
      this.shadowRoot.appendChild(s);
    } catch(_) { }
      card.appendChild(style);
      card.appendChild(this.thermostat.container);
      root.appendChild(card);
      this._cardEl = card;

    }
    else {

      const card = document.createElement('ha-card');
      const style = document.createElement('style');
      style.textContent = cssData();
    try {
      const s = document.createElement('style');
      s.textContent = 'svg.dial.modec-open #ambient, svg.dial.modec-open #target, svg.dial.modec-open #low, svg.dial.modec-open #high { display: none !important; }';
      this.shadowRoot.appendChild(s);
    } catch(_) { }
      card.appendChild(style);
      card.appendChild(this.thermostat.container);
      root.appendChild(card);
      this._cardEl = card;
    }
    this._config = cardConfig; // Store the normalized configuration for later use by hass setter and helpers.
    this._saved_state = null; // Clear the cached entity state so the first hass call triggers a full UI update.

    // Phase 2 (non-invasive): optionally read anchor geometry for future alignment
    // without changing DOM or behaviour. Enable with both flags to avoid surprises.
    if (cardConfig.use_layered_anchors === true && cardConfig.debug_layered_anchors === true) {
      try { this._extractLayeredAnchors(); } catch(_){ /* ignore */ }
    }

    // If using the new carousel UI, force-hide the legacy mode menu via CSS
    if (cardConfig.mode_carousel_ui === true) {
      try{
        const cssHide = document.createElement('style');
        cssHide.textContent = `.mode-menu{ display: none !important; }`;
        this.shadowRoot.appendChild(cssHide);
      }catch(_){ }
    }
  }
}
customElements.define('thermostat-card', ThermostatCard);

function deepClone(value) {
  if (!(!!value && typeof value == 'object')) {
    return value; // Primitive values (numbers, strings, booleans) can be returned as-is.
  }
  if (Object.prototype.toString.call(value) == '[object Date]') {
    return new Date(value.getTime()); // Clone Date objects so the copy has its own internal timestamp.
  }
  if (Array.isArray(value)) {
    return value.map(deepClone); // Recursively clone every item in an array.
  }
  var result = {};
  Object.keys(value).forEach(
    function(key) { result[key] = deepClone(value[key]); }); // Copy each property one by one and clone nested objects.
  return result; // Return the brand-new object copy.
}

// Cleanup when removed from DOM
ThermostatCard.prototype.disconnectedCallback = function(){
  try{
    const root = this.shadowRoot;
    if(root){ while(root.lastChild){ root.removeChild(root.lastChild);} }
  }catch(_){ }
  this.thermostat = null;
  this._saved_state = null;
  this._cardEl = null;
  this._unavailableEl = null;
  // Cleanup any cached polygons and holders
  this._config && (this._config._modeClipPolygon = null);
  this.__numbersPolyPx = null;
  // Remove hidden layered SVG holder if any
  try{ if(this.__layeredHolder && this.__layeredHolder.parentNode){ this.__layeredHolder.parentNode.removeChild(this.__layeredHolder); } }catch(_){ }
  this.__layeredHolder = null;
  this.__layeredSvg = null;
}

// Read anchor bboxes from /thermostat-layered.svg for future alignment
ThermostatCard.prototype._extractLayeredAnchors = async function() {
  try {
    const svg = await this._loadLayeredSvgDoc();

    const pickBBox = (id) => {
      const el = svg.querySelector('#' + id);
      if (!el || !el.getBBox) return null;
      try { const b = el.getBBox(); return { x: b.x, y: b.y, width: b.width, height: b.height }; } catch(_) { return null; }
    };
    const anchors = {
      base: pickBBox('base_main'),
      weather: pickBBox('weather_main'),
      numbers: pickBBox('numbers_main'),
      mode: pickBBox('mode_main'),
      ticks: pickBBox('ticks_main'),
      rim: pickBBox('rim_main'),
      aura: pickBBox('aura_main'),
      glass: pickBBox('glass_main'),
      sensor: pickBBox('sensor_main'),
    };
    this._config._layeredAnchors = anchors;
    // Helpful console for inspection during development only
    console.info('[thermostat-card] layered anchors:', anchors);
  } catch(_){ /* ignore */ }
}

// Resolve and attach a hidden layered SVG for geometry queries
ThermostatCard.prototype._loadLayeredSvgDoc = async function(){
  if (this.__layeredSvg && this.__layeredHolder && this.__layeredHolder.isConnected) {
    return this.__layeredSvg;
  }
  const urls = [
    '/local/community/lovelace-thermostat-card/thermostat-layered.svg',
    '/hacsfiles/lovelace-thermostat-card/thermostat-layered.svg',
    '/thermostat-layered.svg',
    './thermostat-layered.svg'
  ];
  let text = null;
  for (const u of urls) {
    try{
      const res = await fetch(u, { cache: 'no-cache' });
      if (res.ok) { text = await res.text(); break; }
    }catch(_){ }
  }
  if (!text) throw new Error('layered svg not found');
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  const svg = doc.documentElement;
  const holder = document.createElement('div');
  holder.style.position = 'absolute';
  holder.style.width = '0px';
  holder.style.height = '0px';
  holder.style.overflow = 'hidden';
  holder.style.visibility = 'hidden';
  this.shadowRoot.appendChild(holder);
  holder.appendChild(svg);
  this.__layeredHolder = holder;
  this.__layeredSvg = svg;
  return svg;
}

// Phase 2 helpers: read-only alignment of labels and mode clip
ThermostatCard.prototype._applyLayeredAlignment = function(){
  try{
    const cfg = this._config || {};
    if (!cfg.use_layered_anchors) return;
    // If debug flag set but anchors missing, attempt load
    if (cfg.debug_layered_anchors && !cfg._layeredAnchors) {
      this._extractLayeredAnchors().then(()=>{ try{ this._applyLayeredAlignment(); }catch(_){} });
      return;
    }
    this._applyLayeredLabelAlignment();
    this._applyModeClip();
    this._applyChevronBounds();
  }catch(_){ /* ignore */ }
}

ThermostatCard.prototype._applyLayeredLabelAlignment = function(){
  try{
    const cfg = this._config || {};
    const anchors = cfg._layeredAnchors;
    const root = this.shadowRoot;
    if (!root) return;
    const svg = root.querySelector('svg.dial');
    if (!svg) return;
    let cx, cy;
    if (anchors && anchors.numbers) {
      cx = anchors.numbers.x + anchors.numbers.width / 2;
      // Slightly below the vertical center of the upper semicircle for better optical balance
      cy = anchors.numbers.y + anchors.numbers.height * 0.58;
    } else {
      // Fallback to dial center, bias slightly upward
      const r = (cfg.radius || 200);
      cx = r; cy = r * 0.86;
    }
    const place = (id) => {
      const node = svg.querySelector('#' + id);
      if (!node) return;
      node.setAttribute('x', String(cx));
      node.setAttribute('y', String(cy));
      node.setAttribute('text-anchor','middle');
      node.setAttribute('dominant-baseline','middle');
      const spans = node.querySelectorAll('tspan');
      if (spans && spans.length > 1){
        const main = spans[0];
        const sup = spans[1];
        // Measure the main tspan to position superscript just to its right and slightly above baseline
        let supX, supY;
        try {
          const bb = main.getBBox();
          supX = bb.x + bb.width + Math.max(6, (cfg.radius || 200) * 0.015);
          supY = bb.y + (bb.height * 0.28);
        } catch(_) {
          const rx = (cfg.radius || 200);
          supX = cx + (rx * 0.26);
          supY = cy - (rx * 0.17);
        }
        sup.setAttribute('x', String(supX));
        sup.setAttribute('y', String(supY));
      }
    };
    place('ambient');
    place('target');
  }catch(_){ /* ignore */ }
}

ThermostatCard.prototype._applyModeClip = function(){
  try{
    const cfg = this._config || {};
    const root = this.shadowRoot;
    if (!root) return;
    const menu = root.querySelector('.mode-menu');
    const host = root.querySelector('#mode-carousel');
    if (!cfg._modeClipPolygon) {
      (async ()=>{
        try{
          const svg = await this._loadLayeredSvgDoc();
          const vb = svg.viewBox && svg.viewBox.baseVal ? svg.viewBox.baseVal : { width: 400, height: 400 };
          const p = svg.querySelector('#clip-layer-mode path');
          if (!p || !p.getTotalLength) return;
          const len = p.getTotalLength();
          const steps = 96;
          const pts = [];
          for (let i=0;i<=steps;i++){
            const pt = p.getPointAtLength(len * (i/steps));
            pts.push([ (pt.x / vb.width) * 100, (pt.y / vb.height) * 100 ]);
          }
          const poly = 'polygon(' + pts.map(([x,y])=> x.toFixed(2)+'% '+y.toFixed(2)+'%').join(',') + ')';
          this._config._modeClipPolygon = poly;
          if (menu) { menu.style.clipPath = poly; menu.style.webkitClipPath = poly; }
          if (host) { host.style.clipPath = poly; host.style.webkitClipPath = poly; }
        }catch(_){ }
      })();
      return;
    }
    const poly = cfg._modeClipPolygon;
    if (menu) { menu.style.clipPath = poly; menu.style.webkitClipPath = poly; }
    if (host) { host.style.clipPath = poly; host.style.webkitClipPath = poly; }
  }catch(_){ /* ignore */ }
}

// Hide chevrons that fall outside the numbers wedge (upper semicircle)
ThermostatCard.prototype._applyChevronBounds = function(){
  try{
    const cfg = this._config || {};
    const root = this.shadowRoot;
    if (!root) return;
    const svgDial = root.querySelector('svg.dial');
    if (!svgDial) return;
    const chevrons = svgDial.querySelectorAll('path.dial__chevron');
    if (!chevrons || chevrons.length === 0) return;
    const applyWithPoly = (polyPx) => {
      if (!polyPx || polyPx.length < 3) return;
      const pip = (x,y)=>{
        let inside=false; for(let i=0,j=polyPx.length-1;i<polyPx.length;j=i++){
          const xi=polyPx[i][0], yi=polyPx[i][1]; const xj=polyPx[j][0], yj=polyPx[j][1];
          const intersect = ((yi>y)!==(yj>y)) && (x < (xj - xi) * (y - yi) / ((yj - yi)||1e-6) + xi);
          if (intersect) inside = !inside;
        } return inside;
      };
      chevrons.forEach((path)=>{
        try{
          const bb = path.getBBox();
          const cx = bb.x + bb.width/2;
          const cy = bb.y + bb.height/2;
          const ok = pip(cx,cy);
          path.style.visibility = ok ? 'visible' : 'hidden';
        }catch(_){ }
      });
    };
    if (this.__numbersPolyPx && Array.isArray(this.__numbersPolyPx)) {
      applyWithPoly(this.__numbersPolyPx);
      return;
    }
    // Compute from layered SVG clip path for numbers
    (async ()=>{
      try{
        const svg = await this._loadLayeredSvgDoc();
        const p = svg.querySelector('#clip-layer-numbers path');
        if (!p || !p.getTotalLength) return;
        const len = p.getTotalLength();
        const steps = 96;
        const pts = [];
        for(let i=0;i<=steps;i++){
          const pt = p.getPointAtLength(len * (i/steps));
          pts.push([pt.x, pt.y]);
        }
        this.__numbersPolyPx = pts;
        applyWithPoly(pts);
      }catch(_){ }
    })();
  }catch(_){ /* ignore */ }
}

// Mode carousel removed
ThermostatCard.prototype._blockDialDrag = function(block){
  try{
    const svg = this.shadowRoot && this.shadowRoot.querySelector('svg.dial');
    if(!svg) return;
    if(block){
      if(!this.__dragBlocker){
        this.__dragBlocker = (e)=>{ try{ e.stopImmediatePropagation(); e.stopPropagation(); e.preventDefault(); }catch(_){ } };
      }
      ['pointerdown','pointermove','mousedown','mousemove','touchstart','touchmove'].forEach((ev)=>{
        try{ svg.addEventListener(ev, this.__dragBlocker, { capture:true, passive:false }); }catch(_){ }
      });
    }else{
      if(this.__dragBlocker){
        ['pointerdown','pointermove','mousedown','mousemove','touchstart','touchmove'].forEach((ev)=>{
          try{ svg.removeEventListener(ev, this.__dragBlocker, { capture:true }); }catch(_){ }
        });
      }
    }
  }catch(_){ }
}
ThermostatCard.prototype._openModeCarousel = function(){ }
ThermostatCard.prototype._closeModeCarousel = function(){ }
ThermostatCard.prototype._armModeAutoClose = function(){ }
ThermostatCard.prototype._clearModeAutoClose = function(){ }
ThermostatCard.prototype._selectModeFromCarousel = function(){ }

// Anchor the mode button to #mode_button_anchor in layered SVG
ThermostatCard.prototype._positionModeButtonByAnchor = async function(){
  return;
};



// Position the carousel items so they appear just above the mode button anchor
ThermostatCard.prototype._positionCarouselItemsByAnchor = async function(){
  return;
};









































