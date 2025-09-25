const DEFAULT_CLIMATE_ENTITY = 'climate.mock_thermostat';

const DEFAULT_STATES = {
  [DEFAULT_CLIMATE_ENTITY]: {
    entity_id: DEFAULT_CLIMATE_ENTITY,
    state: 'heat',
    attributes: {
      friendly_name: 'Mock Thermostat',
      min_temp: 15,
      max_temp: 30,
      current_temperature: 21.5,
      temperature: 22,
      target_temp_low: 20,
      target_temp_high: 24,
      hvac_modes: ['off', 'heat', 'cool', 'heat_cool', 'auto'],
      preset_mode: 'none',
      away_mode: 'off',
      supported_features: 1,
      unit_of_measurement: '°C',
    },
  },
};

const NUMERIC_KEYS = new Set([
  'min_temp',
  'max_temp',
  'current_temperature',
  'temperature',
  'target_temp_low',
  'target_temp_high',
]);

function cloneState(value) {
  return JSON.parse(JSON.stringify(value));
}

function toNumberOrNull(value) {
  if (value === '' || value === null || value === undefined) {
    return null;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export class MockHass {
  constructor(initialStates = DEFAULT_STATES) {
    this._initialState = cloneState(initialStates);
    this.states = cloneState(initialStates);
    this._listeners = new Set();
    this._serviceLog = [];
    this._nextLogId = 1;
  }

  subscribe(callback) {
    this._listeners.add(callback);
    return () => this._listeners.delete(callback);
  }

  reset() {
    this.states = cloneState(this._initialState);
    this._serviceLog = [];
    this._notify();
  }

  updateEntity(entityId, update) {
    const entity = this.states[entityId];
    if (!entity) {
      console.warn(`MockHass: cannot update unknown entity "${entityId}"`);
      return;
    }

    const { state, attributes } = update || {};

    if (state !== undefined) {
      entity.state = state;
    }

    if (attributes) {
      const mergedAttributes = { ...entity.attributes };
      Object.entries(attributes).forEach(([key, value]) => {
        if (NUMERIC_KEYS.has(key) || typeof mergedAttributes[key] === 'number') {
          mergedAttributes[key] = toNumberOrNull(value);
        } else {
          mergedAttributes[key] = value;
        }
      });
      entity.attributes = mergedAttributes;
    }

    this._notify();
  }

  callService(domain, service, data = {}) {
    const entry = {
      id: this._nextLogId++,
      timestamp: new Date().toISOString(),
      domain,
      service,
      data: { ...data },
    };
    this._serviceLog.unshift(entry);
    this._serviceLog = this._serviceLog.slice(0, 15);

    if (domain === 'climate') {
      this._handleClimateService(service, data);
    }

    this._notify();
  }

  _handleClimateService(service, data) {
    const entity = this.states[data.entity_id];
    if (!entity) {
      console.warn(`MockHass: cannot handle service for unknown entity "${data.entity_id}"`);
      return false;
    }

    let updated = false;

    switch (service) {
      case 'set_temperature': {
        if (data.temperature !== undefined) {
          const value = toNumberOrNull(data.temperature);
          entity.attributes.temperature = value;
          if (value !== null) {
            entity.attributes.target_temp_low = value;
            entity.attributes.target_temp_high = value;
          }
          updated = true;
        }
        if (data.target_temp_low !== undefined) {
          entity.attributes.target_temp_low = toNumberOrNull(data.target_temp_low);
          updated = true;
        }
        if (data.target_temp_high !== undefined) {
          entity.attributes.target_temp_high = toNumberOrNull(data.target_temp_high);
          updated = true;
        }
        break;
      }
      case 'set_hvac_mode': {
        if (data.hvac_mode !== undefined) {
          const mode = String(data.hvac_mode);
          entity.state = mode;
          if (
            Array.isArray(entity.attributes.hvac_modes) &&
            !entity.attributes.hvac_modes.includes(mode)
          ) {
            entity.attributes.hvac_modes = [...entity.attributes.hvac_modes, mode];
          }
          updated = true;
        }
        break;
      }
      default:
        console.warn(`MockHass: unsupported climate service "${service}"`);
    }
    return updated;
  }

  _notify() {
    this._listeners.forEach((callback) => callback(this));
  }

  get serviceLog() {
    return [...this._serviceLog];
  }
}

export function createMockHass(states = DEFAULT_STATES) {
  return new MockHass(states);
}

export { DEFAULT_CLIMATE_ENTITY };
