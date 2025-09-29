import {cssData} from './styles.js?v=1.3.4';
import ThermostatUI from './thermostat_card.lib.js?v=1.3.4';
console.info("%c Thermostat Card \n%c  Version  1.3.4 ", "color: orange; font-weight: bold; background: black", "color: white; font-weight: bold; background: dimgray");
class ThermostatCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
  set hass(hass) {
    const config = this._config;

    if (!config || !this.thermostat) {
      this._hass = hass;
      return;
    }

    const entity = hass.states[config.entity];
    if(!entity)return;
    let min_value = entity.attributes.min_temp;
    if (config.min_value)
      min_value = config.min_value;
    let max_value = entity.attributes.max_temp;
    if (config.max_value)
      max_value = config.max_value;
    let ambient_temperature = entity.attributes.current_temperature || 0;
    if (config.ambient_temperature && hass.states[config.ambient_temperature])
      ambient_temperature = hass.states[config.ambient_temperature].state;
    let hvac_state = entity.state;
    
    const new_state = {
      entity: entity,
      min_value: min_value,
      max_value: max_value,
      ambient_temperature: ambient_temperature,
      target_temperature: entity.attributes.temperature,
      target_temperature_low: entity.attributes.target_temp_low,
      target_temperature_high: entity.attributes.target_temp_high,
      hvac_state: entity.state,
      hvac_modes:entity.attributes.hvac_modes,
      preset_mode: entity.attributes.preset_mode,
      away: (entity.attributes.away_mode == 'on' ? true : false)
    }

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
      this._saved_state = new_state;
      this.thermostat.updateState(new_state,hass);
     }
    this._hass = hass;
  }
  
  openProp(entityId) {
    this.fire('hass-more-info', { entityId });
  }
  fire(type, detail, options) {
  
    options = options || {}
    detail = detail === null || detail === undefined ? {} : detail
    const e = new Event(type, {
      bubbles: options.bubbles === undefined ? true : options.bubbles,
      cancelable: Boolean(options.cancelable),
      composed: options.composed === undefined ? true : options.composed,
    })
    
    e.detail = detail
    this.dispatchEvent(e)
    return e
  }
  
  _controlSetPoints() {

    if (this.thermostat.dual) {
      if (this.thermostat.temperature.high != this._saved_state.target_temperature_high ||
        this.thermostat.temperature.low != this._saved_state.target_temperature_low)
        this._hass.callService('climate', 'set_temperature', {
          entity_id: this._config.entity,
          target_temp_high: this.thermostat.temperature.high,
          target_temp_low: this.thermostat.temperature.low,
        });
    } else {
      if (this.thermostat.temperature.target != this._saved_state.target_temperature)
        this._hass.callService('climate', 'set_temperature', {
          entity_id: this._config.entity,
          temperature: this.thermostat.temperature.target,
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
    const root = this.shadowRoot;

    while (root.lastChild) {
      root.removeChild(root.lastChild);
    }

    const rawConfig = deepClone(config || {});
    const { entity } = rawConfig;
    const entityId = typeof entity === 'string' ? entity.trim() : '';
    const [domain, objectId] = entityId.split('.');
    const hasEntity = entityId.length > 0;
    const isClimateEntity = domain === 'climate' && !!objectId;

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
    const cardConfig = rawConfig;
    cardConfig.entity = entityId;
    // cardConfig.hvac = Object.assign({}, config.hvac);
    
    if (!cardConfig.diameter) cardConfig.diameter = 400;
    if (!cardConfig.pending) cardConfig.pending = 3;
    if (!cardConfig.idle_zone) cardConfig.idle_zone = 2;
    if (!cardConfig.step) cardConfig.step = 0.5;
    if (!cardConfig.highlight_tap) cardConfig.highlight_tap = false;
    if (!cardConfig.no_card) cardConfig.no_card = false;
    if (!cardConfig.chevron_size) cardConfig.chevron_size = 34;
    if (!cardConfig.num_ticks) cardConfig.num_ticks = 150;
    if (!cardConfig.tick_degrees) cardConfig.tick_degrees = 300;

    // Extra config values generated for simplicity of updates
    cardConfig.radius = cardConfig.diameter / 2;
    cardConfig.ticks_outer_radius = cardConfig.diameter / 30;
    cardConfig.ticks_inner_radius = cardConfig.diameter / 8;
    cardConfig.offset_degrees = 180 - (360 - cardConfig.tick_degrees) / 2;
    cardConfig.control = this._controlSetPoints.bind(this);
    cardConfig.propWin = this.openProp.bind(this);
    this.thermostat = new ThermostatUI(cardConfig);
    
    if (cardConfig.no_card === true) {
      
      const card = document.createElement('ha-card');
      card.className = "no_card";
      const style = document.createElement('style');
      style.textContent = cssData();
      card.appendChild(style);
      card.appendChild(this.thermostat.container);
      root.appendChild(card);
      
    }
    else {

      const card = document.createElement('ha-card');
      const style = document.createElement('style');
      style.textContent = cssData();
      card.appendChild(style);
      card.appendChild(this.thermostat.container);
      root.appendChild(card);
    }
    this._config = cardConfig;
    this._saved_state = null;
  }
}
customElements.define('thermostat-card', ThermostatCard);

function deepClone(value) {
  if (!(!!value && typeof value == 'object')) {
    return value;
  }
  if (Object.prototype.toString.call(value) == '[object Date]') {
    return new Date(value.getTime());
  }
  if (Array.isArray(value)) {
    return value.map(deepClone);
  }
  var result = {};
  Object.keys(value).forEach(
    function(key) { result[key] = deepClone(value[key]); });
  return result;
}
