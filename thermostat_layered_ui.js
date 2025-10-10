/**
 * Layered Thermostat UI wrapper
 *
 * Loads an external layered SVG (with *_main anchors) and re-parents the
 * existing SVG groups from ThermostatUI (v2) so each feature renders inside
 * the correct layer bounds. Keeps all existing behaviour (drag, tap, mode menu).
 */
import ThermostatUIV2 from './thermostat_card2.lib.js';

export default class ThermostatUILayered {
  get container() { return this._container; }
  get dual() { return this._ui ? this._ui.dual : false; }
  set dual(v) { if (this._ui) this._ui.dual = v; }
  get in_control() { return this._ui ? this._ui.in_control : false; }
  get temperature() { return this._ui ? this._ui.temperature : { low: null, high: null, target: null }; }
  get ambient() { return this._ui ? this._ui.ambient : null; }

  constructor(config) {
    this._config = config;
    this._container = document.createElement('div');
    this._container.style.position = 'relative';
    this._container.style.width = '100%';
    this._container.style.height = '100%';
    this._pendingState = null;

    // Build the inner UI first to reuse its logic and elements.
    this._ui = new ThermostatUIV2({ ...config });

    // Load layered SVG and adopt the UI elements into it when ready.
    this._loadLayeredSvg().then(() => {
      try { this._adoptIntoLayers(); } catch (e) { /* ignore */ }
      // If state arrived before SVG load, apply now.
      if (this._pendingState) {
        const [opts, hass] = this._pendingState;
        this.updateState(opts, hass);
        this._pendingState = null;
      }
    }).catch(() => {
      // Fallback: if SVG fails to load, mount original UI container as-is.
      this._container.appendChild(this._ui.container);
    });
  }

  async _loadLayeredSvg() {
    const candidates = [
      '/thermostat-layered.svg',
      '/local/community/lovelace-thermostat-card/thermostat-layered.svg',
      './thermostat-layered.svg'
    ];
    let text = null;
    for (const url of candidates) {
      try {
        const res = await fetch(url, { cache: 'no-cache' });
        if (res.ok) { text = await res.text(); break; }
      } catch (_) { /* try next */ }
    }
    if (!text) throw new Error('Layered SVG not found');
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'image/svg+xml');
    const svg = doc.documentElement;
    // Ensure it scales with container
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.display = 'block';
    this._root = svg;
    this._container.appendChild(svg);

    // Cache anchors and layer groups
    const q = (sel) => svg.querySelector(sel);
    const getLayer = (id) => {
      const main = q(`#${id}_main`);
      return main ? main.parentNode : null; // use the layer group containing the *_main element
    };
    this._layers = {
      base: getLayer('base'),
      weather: getLayer('weather'),
      numbers: getLayer('numbers'),
      mode: getLayer('mode'),
      ticks: getLayer('ticks'),
      rim: getLayer('rim'),
      aura: getLayer('aura'),
      glass: getLayer('glass'),
      sensor: getLayer('sensor'),
    };
    // Create content groups inside each layer to host adopted nodes
    Object.keys(this._layers).forEach((k) => {
      const host = this._layers[k];
      if (!host) return;
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', `layer__content layer__content--${k}`);
      host.appendChild(g);
      this._layers[k + 'Content'] = g;
    });

    // Placeholder: mode menu will be hosted via foreignObject inside the mode layer
    this._modeFOHost = null;
  }

  _adoptIntoLayers() {
    const srcRoot = this._ui && this._ui._root; // original SVG root from V2
    if (!srcRoot || !this._root) return;

    // Move key groups into target layer content groups
    const moveAll = (selector, target) => {
      const nodes = Array.from(srcRoot.querySelectorAll(selector));
      nodes.forEach((n) => {
        try { target.appendChild(n); } catch (_) {}
      });
    };

    // Do NOT move base dial/face/ring/glass from the inner UI.
    // The layered SVG provides these visuals; we only adopt dynamic pieces.
    // Weather
    if (this._layers.weatherContent) moveAll('.weather__fx', this._layers.weatherContent);
    // Ticks (adopt dynamic tick group from V2)
    if (this._layers.ticksContent) {
      // Clear any pre-baked ticks under ticks layer to prevent duplicates
      try {
        const existingTicks = this._layers.ticksContent.querySelectorAll('.dial__ticks');
        existingTicks.forEach((n) => n.parentNode && n.parentNode.removeChild(n));
      } catch(_) {}
      moveAll('.dial__ticks', this._layers.ticksContent);
      // Hide any static tick artwork directly under the ticks layer to avoid double drawing
      const ticksLayer = this._layers.ticks;
      if (ticksLayer) {
        Array.from(ticksLayer.children).forEach((el) => {
 if (el === this._layers.ticksContent) return;
 if (el.id === 'ticks_main') return;
 if (el.tagName.toLowerCase() === 'title') return;
 try { el.style.display = 'none'; } catch(_) {}
        });
      }
    }
    // Numbers: labels, chevrons, rotating slots
    if (this._layers.numbersContent) {
      ['#title', '#ambient', '#target', '#low', '#high'].forEach((id) => {
        const node = srcRoot.querySelector(id);
        if (node) this._layers.numbersContent.appendChild(node);
      });
      moveAll('path.dial__chevron', this._layers.numbersContent);
      ['#temperature_slot_1', '#temperature_slot_2', '#temperature_slot_3'].forEach((id) => {
        const node = srcRoot.querySelector(id);
        if (node) this._layers.numbersContent.appendChild(node);
      });
    }
    // Glass overlays: use layered glass group if present; otherwise adopt
    const layeredGlass = this._root.querySelector('g.dial__glass');
    if (layeredGlass) {
      this._ui._glassGroup = layeredGlass;
    } else if (this._layers.glassContent) {
      moveAll('.dial__glass', this._layers.glassContent);
    }

    // Set new root on the inner UI so queries hit the layered SVG
    this._ui._root = this._root;

    // Build click/tap temperature controls using the pre-defined sensor layer
    const sensorLayer = this._layers.sensor;
    if (sensorLayer) {
      const controls = Array.from(sensorLayer.querySelectorAll('path.dial__temperatureControl'));
      this._ui._controls = controls;
      controls.forEach((path, index) => {
        try { path.setAttribute('pointer-events','auto'); } catch(_) {}
        path.addEventListener('click', () => this._ui._temperatureControlClicked(index));
      });
    }

    // Attach pointer drag handlers to sensor layer for gesture handling
    const gestureTarget = this._layers.sensor || this._root;
    try { gestureTarget.setAttribute('pointer-events','auto'); } catch(_) {}
    gestureTarget.addEventListener('pointerdown', this._ui._handleDialPointerDown, { passive: false });
    gestureTarget.addEventListener('pointermove', this._ui._handleDialPointerMove);
    gestureTarget.addEventListener('pointerup', this._ui._handleDialPointerUp);
    gestureTarget.addEventListener('pointercancel', this._ui._handleDialPointerUp);
    // Enable click-to-edit if user clicks anywhere on the dial
    this._root.addEventListener('click', () => this._ui._enableControls());

    // Mount HTML mode menu via foreignObject clipped by the mode layer
    if (this._ui._modeMenuContainer) {
      const vb = this._root.viewBox && this._root.viewBox.baseVal;
      const modeLayer = this._layers.modeContent || this._layers.mode;
      if (vb && modeLayer) {
        const fo = document.createElementNS('http://www.w3.org/2000/svg','foreignObject');
        fo.setAttribute('x','0');
        fo.setAttribute('y','0');
        fo.setAttribute('width', String(vb.width));
        fo.setAttribute('height', String(vb.height));
        // Ensure pointer events are allowed inside menu
        fo.setAttribute('style','pointer-events:auto');
        const host = document.createElementNS('http://www.w3.org/1999/xhtml','div');
        host.style.width = '100%';
        host.style.height = '100%';
        host.style.position = 'relative';

        host.style.pointerEvents = 'auto';
        const ignoreMenuEvent = (event) => {
          const target = event && event.target;
          return !!(target && typeof target.closest === 'function' && target.closest('.mode-menu'));
        };
        host.addEventListener('pointerdown', (event) => {
          if (ignoreMenuEvent(event)) return;
          if (this._ui && typeof this._ui._handleDialPointerDown === 'function') {
            this._ui._handleDialPointerDown(event);
          }
        }, { passive: false });
        host.addEventListener('pointermove', (event) => {
          if (ignoreMenuEvent(event)) return;
          if (this._ui && typeof this._ui._handleDialPointerMove === 'function') {
            this._ui._handleDialPointerMove(event);
          }
        });
        const handlePointerEnd = (event) => {
          if (ignoreMenuEvent(event)) return;
          if (this._ui && typeof this._ui._handleDialPointerUp === 'function') {
            this._ui._handleDialPointerUp(event);
          }
        };
        host.addEventListener('pointerup', handlePointerEnd);
        host.addEventListener('pointercancel', handlePointerEnd);

        // Inline minimal CSS to ensure styling inside foreignObject
        const styleEl = document.createElementNS('http://www.w3.org/1999/xhtml','style');
        styleEl.textContent = `
 .mode-menu{pointer-events:none} .mode-menu.menu-open{pointer-events:auto} .mode-menu__toggler{cursor:pointer;pointer-events:auto;transform-box:fill-box;transform-origin:center;outline:none} .mode-menu__toggler:focus-visible .mode-menu__toggler-circle{stroke:rgba(255,255,255,.55);stroke-width:1.6px} .mode-menu__toggler-body{transition:transform .3s ease} .mode-menu.menu-open .mode-menu__toggler-body,.mode-menu__toggler-body--open{transform:scale(.95)} .mode-menu__toggler-circle{fill:rgba(44,54,72,.92);stroke:rgba(255,255,255,.22);stroke-width:1.2px;filter:drop-shadow(0 12px 20px rgba(0,0,0,.55))} .mode-menu.menu-open .mode-menu__toggler-circle{filter:drop-shadow(0 10px 18px rgba(0,0,0,.5))} .mode-menu__toggler-inner{fill:rgba(28,34,48,.85);stroke:rgba(255,255,255,.08);stroke-width:.5px} .mode-menu__toggler-gloss{fill:rgba(255,255,255,.18)} .mode-menu__toggler-icon{pointer-events:none} .mode-menu__toggler-bar{fill:rgba(18,24,38,.85);transition:transform .3s ease,opacity .3s ease;transform-box:fill-box;transform-origin:center} .mode-menu.menu-open .mode-menu__toggler-bar--top{transform:translateY(var(--bar-shift,0px)) rotate(45deg)} .mode-menu.menu-open .mode-menu__toggler-bar--middle{opacity:0} .mode-menu.menu-open .mode-menu__toggler-bar--bottom{transform:translateY(var(--bar-shift,0px)) rotate(-45deg)} .mode-menu__items{pointer-events:none} .menu-item{transform-box:fill-box;transform-origin:center} .menu-item__foreign{overflow:visible;pointer-events:none} .menu-item__wrapper{width:100%;height:100%;display:flex;align-items:center;justify-content:center;pointer-events:none} .menu-item__wrapper>.menu-item__button{pointer-events:auto} .menu-item__button{display:inline-flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;min-width:86px;padding:14px 18px;border-radius:32px;border:none;background:rgba(0,0,0,.18);color:var(--thermostat-text-color,#fff);backdrop-filter:blur(3px);box-shadow:0 2px 6px rgba(0,0,0,.35),inset 0 1px rgba(255,255,255,.2)}
 .menu-item--active .menu-item__button{background:rgba(255,255,255,.22);box-shadow:0 3px 8px rgba(0,0,0,.45),inset 0 1px rgba(255,255,255,.25)}
 .menu-item__icon{display:inline-flex;font-size:22px}
 .menu-item__label{font-size:12px;opacity:.85}
        `;
        host.appendChild(styleEl);
        this._ui._modeMenuContainer.style.pointerEvents = 'auto';
        host.appendChild(this._ui._modeMenuContainer);
        fo.appendChild(host);
        modeLayer.appendChild(fo);
        this._modeFOHost = host;
      } else {
        // Fallback: append to container if FO unavailable
        this._container.appendChild(this._ui._modeMenuContainer);
      }
    }

    // Move the HA more-info (kebab) button into our container
    if (this._ui._ic) {
      this._container.appendChild(this._ui._ic);
    }

    // Re-bind ring groups to the layered SVG so rotation still works
    const ringGroup = this._root.querySelector('g.dial__ring');
    if (ringGroup) {
      this._ui._ringGroup = ringGroup;
      const ringSpin = ringGroup.querySelector('g.dial__ring-spin');
      if (ringSpin) this._ui._ringSpinGroup = ringSpin;
    }

    // Hook layered drag overlay + limit flash elements if present
    const dragOverlay = this._root.querySelector('.dial__drag-overlay');
    const limitFlash = this._root.querySelector('.dial__limit-flash');
    if (dragOverlay) this._ui._dragOverlay = dragOverlay;
    if (limitFlash) this._ui._limitFlash = limitFlash;

    // Adjust central numbers to sit entirely within the numbers layer
    this._adjustCentralLabels();
  }

  _positionModeHtml() { /* not needed with foreignObject hosting */ }

  _adjustCentralLabels() {
    try {
      const vb = this._root.viewBox && this._root.viewBox.baseVal;
      const numbersMain = this._root.querySelector('#numbers_main');
      if (!vb || !numbersMain) return;
      const bb = numbersMain.getBBox();
      const cx = bb.x + bb.width / 2;
      const cy = bb.y + bb.height * 0.55; // bias slightly downward within the upper semicircle
      const ids = ['ambient','target'];
      ids.forEach((id) => {
        const node = this._root.querySelector('#' + id);
        if (!node) return;
        node.setAttribute('x', String(cx));
        node.setAttribute('y', String(cy));
        node.setAttribute('text-anchor','middle');
        node.setAttribute('dominant-baseline','middle');
        const spans = node.querySelectorAll('tspan');
        if (spans.length > 1) {
 const sup = spans[1];
 // place superscript to the right and above main number
 const supX = cx + vb.width * 0.08;
 const supY = cy - vb.height * 0.08;
 sup.setAttribute('x', String(supX));
 sup.setAttribute('y', String(supY));
        }
      });
    } catch(_) { /* ignore */ }
  }

  updateState(options, hass) {
    // If SVG not ready yet, queue the latest state
    if (!this._root || !this._ui || !this._layers) {
      this._pendingState = [options, hass];
      return;
    }
    this._ui.updateState(options, hass);
  }
}
