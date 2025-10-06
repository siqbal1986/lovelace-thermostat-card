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
import ThermostatUI from './thermostat_card.lib.js?v=1.3.4';

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
        if (Number.isFinite(entStep) && entStep > 0 && this._config.step !== entStep) {
          this._config.step = entStep;
          if (this.thermostat && this.thermostat._config) {
            this.thermostat._config.step = entStep;
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

    if (this.thermostat.dual) {
      if (this.thermostat.temperature.high != this._saved_state.target_temperature_high ||
        this.thermostat.temperature.low != this._saved_state.target_temperature_low)
        this._hass.callService('climate', 'set_temperature', {
          entity_id: this._config.entity, // Tell Home Assistant which thermostat to update.
          target_temp_high: this.thermostat.temperature.high, // Send the new high setpoint from the UI helper.
          target_temp_low: this.thermostat.temperature.low, // Send the new low setpoint from the UI helper.
        });
    } else {
      if (this.thermostat.temperature.target != this._saved_state.target_temperature)
        this._hass.callService('climate', 'set_temperature', {
          entity_id: this._config.entity, // Again, target the configured climate entity.
          temperature: this.thermostat.temperature.target, // Send the single target temperature for heat-only or cool-only modes.
        });
    }
  }

  _renderError(message) {
    const card = document.createElement('ha-card');
    const style = document.createElement('style');
    style.textContent = cssData();
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
    if (!cardConfig.step) cardConfig.step = 0.5;
    if (!cardConfig.highlight_tap) cardConfig.highlight_tap = false;
    if (!cardConfig.no_card) cardConfig.no_card = false;
    if (!cardConfig.chevron_size) cardConfig.chevron_size = 34;
    if (!cardConfig.num_ticks) cardConfig.num_ticks = 150;
    if (!cardConfig.tick_degrees) cardConfig.tick_degrees = 300;

    // Extra config values generated for simplicity of updates
    cardConfig.radius = cardConfig.diameter / 2; // The SVG uses radius rather than diameter, so store it for convenience.
    cardConfig.ticks_outer_radius = cardConfig.diameter / 30; // Pre-calculated distance from the center to the outside of tick marks.
    cardConfig.ticks_inner_radius = cardConfig.diameter / 8; // Pre-calculated distance to the inner end of tick marks.
    cardConfig.offset_degrees = 180 - (360 - cardConfig.tick_degrees) / 2; // Angle offset so the tick arc is centered vertically.
    cardConfig.control = this._controlSetPoints.bind(this); // Provide the UI helper with a callback to send temperature changes back to HA.
    cardConfig.propWin = this.openProp.bind(this); // Provide a callback that opens the more-info dialog when needed.
    this.thermostat = new ThermostatUI(cardConfig); // Build the heavy SVG/UI helper once configuration is ready.

    if (cardConfig.no_card === true) {

      const card = document.createElement('ha-card');
      card.className = "no_card";
      const style = document.createElement('style');
      style.textContent = cssData();
      card.appendChild(style);
      card.appendChild(this.thermostat.container);
      root.appendChild(card);
      this._cardEl = card;
      
    }
    else {

      const card = document.createElement('ha-card');
      const style = document.createElement('style');
      style.textContent = cssData();
      card.appendChild(style);
      card.appendChild(this.thermostat.container);
      root.appendChild(card);
      this._cardEl = card;
    }
    this._config = cardConfig; // Store the normalized configuration for later use by hass setter and helpers.
    this._saved_state = null; // Clear the cached entity state so the first hass call triggers a full UI update.
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
}
