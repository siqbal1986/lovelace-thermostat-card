import '../main.js?v=1.3.0';
import { createMockHass, DEFAULT_CLIMATE_ENTITY } from './mock-hass.js';

const ALL_HVAC_MODES = ['off', 'heat', 'cool', 'heat_cool', 'auto', 'dry', 'fan_only'];

const ICON_SYMBOLS = {
  'mdi:dots-vertical': '⋮',
  'mdi:dots-horizontal': '⋯',
  'mdi:water-percent': '💧',
  'mdi:fan': '🌀',
  'mdi:snowflake': '❄️',
  'mdi:fire': '🔥',
  'mdi:sync': '🔁',
  'mdi:atom': '⚛️',
  'mdi:power': '⏻',
  'mdi:thermometer': '🌡️',
  'mdi:help': '?',
};

function registerHaIcon() {
  if (customElements.get('ha-icon')) return;
  class HaIcon extends HTMLElement {
    static get observedAttributes() {
      return ['icon'];
    }
    connectedCallback() {
      this._render();
    }
    attributeChangedCallback() {
      this._render();
    }
    _render() {
      const icon = this.getAttribute('icon') || '';
      const symbol = ICON_SYMBOLS[icon] || icon.replace('mdi:', '') || '•';
      this.textContent = symbol;
      this.setAttribute('role', 'img');
      this.setAttribute('aria-label', icon.replace('mdi:', '').replace(/[-_]/g, ' '));
    }
  }
  customElements.define('ha-icon', HaIcon);
}

function registerHaIconButton() {
  if (customElements.get('ha-icon-button')) return;
  class HaIconButton extends HTMLElement {
    static get observedAttributes() {
      return ['icon'];
    }
    connectedCallback() {
      this.setAttribute('role', this.getAttribute('role') || 'button');
      if (!this.hasAttribute('tabindex')) {
        this.setAttribute('tabindex', '0');
      }
      this._render();
      this.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          this.click();
        }
      });
    }
    attributeChangedCallback() {
      this._render();
    }
    _render() {
      const icon = this.getAttribute('icon') || '';
      const symbol = ICON_SYMBOLS[icon] || icon.replace('mdi:', '') || '•';
      this.innerHTML = `<span aria-hidden="true">${symbol}</span>`;
    }
  }
  customElements.define('ha-icon-button', HaIconButton);
}

registerHaIcon();
registerHaIconButton();

const hass = createMockHass();
const card = document.querySelector('#thermostat-card');

const cardConfig = {
  entity: DEFAULT_CLIMATE_ENTITY,
  name: 'Mock Thermostat',
  highlight_tap: true,
  pending: 1,
};

card.setConfig(cardConfig);
card.hass = hass;

const form = document.querySelector('#climate-form');
const hvacStateSelect = document.querySelector('#hvac-state');
const ambientInput = document.querySelector('#ambient-temp');
const targetInput = document.querySelector('#target-temp');
const targetLowInput = document.querySelector('#target-temp-low');
const targetHighInput = document.querySelector('#target-temp-high');
const minInput = document.querySelector('#min-temp');
const maxInput = document.querySelector('#max-temp');
const presetSelect = document.querySelector('#preset-mode');
const awayCheckbox = document.querySelector('#away-mode');
const hvacModesContainer = document.querySelector('#hvac-modes');
const serviceLogList = document.querySelector('#service-log');
const stateViewer = document.querySelector('#state-json');
const dualStateLabel = document.querySelector('#dual-state');
const resetButton = document.querySelector('#reset-state');

const hvacModeInputs = ALL_HVAC_MODES.map((mode) => {
  const label = document.createElement('label');
  label.className = 'chip';

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.name = 'hvac-mode';
  input.value = mode;

  const span = document.createElement('span');
  span.textContent = mode;

  label.appendChild(input);
  label.appendChild(span);
  hvacModesContainer.appendChild(label);

  input.addEventListener('change', () => {
    const selectedModes = hvacModeInputs
      .filter((item) => item.checked)
      .map((item) => item.value);
    hass.updateEntity(DEFAULT_CLIMATE_ENTITY, {
      attributes: { hvac_modes: selectedModes },
    });
  });

  return input;
});

function parseNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function formatNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : '';
}

function updateForm() {
  const climate = hass.states[DEFAULT_CLIMATE_ENTITY];
  if (!climate) return;

  const attrs = climate.attributes || {};
  const isDual =
    typeof attrs.target_temp_low === 'number' &&
    typeof attrs.target_temp_high === 'number' &&
    attrs.target_temp_low !== attrs.target_temp_high;

  hvacStateSelect.value = climate.state || 'off';
  ambientInput.value = formatNumber(attrs.current_temperature);
  targetInput.value = formatNumber(attrs.temperature);
  targetInput.disabled = isDual;
  targetLowInput.value = formatNumber(attrs.target_temp_low);
  targetHighInput.value = formatNumber(attrs.target_temp_high);
  minInput.value = formatNumber(attrs.min_temp);
  maxInput.value = formatNumber(attrs.max_temp);
  presetSelect.value = attrs.preset_mode || 'none';
  awayCheckbox.checked = attrs.away_mode === 'on';

  hvacModeInputs.forEach((input) => {
    input.checked = Array.isArray(attrs.hvac_modes)
      ? attrs.hvac_modes.includes(input.value)
      : false;
  });

  dualStateLabel.textContent = isDual
    ? 'Dual set-point mode (heat/cool) is active.'
    : 'Single set-point mode is active.';

  targetInput.parentElement.dataset.disabled = isDual ? 'true' : 'false';

  stateViewer.textContent = JSON.stringify(climate, null, 2);
}

function renderServiceLog() {
  serviceLogList.innerHTML = '';
  const entries = hass.serviceLog;

  if (!entries.length) {
    const item = document.createElement('li');
    item.className = 'empty';
    item.textContent = 'No service calls yet.';
    serviceLogList.appendChild(item);
    return;
  }

  entries.forEach((entry) => {
    const item = document.createElement('li');
    const time = new Date(entry.timestamp).toLocaleTimeString();
    const summary = document.createElement('div');
    summary.className = 'summary';
    summary.innerHTML = `<code>${entry.domain}.${entry.service}</code> <time>${time}</time>`;

    const payload = document.createElement('pre');
    payload.textContent = JSON.stringify(entry.data, null, 2);

    item.appendChild(summary);
    item.appendChild(payload);
    serviceLogList.appendChild(item);
  });
}

function refresh() {
  card.hass = hass;
  updateForm();
  renderServiceLog();
}

hass.subscribe(refresh);
refresh();

hvacStateSelect.addEventListener('change', (event) => {
  hass.updateEntity(DEFAULT_CLIMATE_ENTITY, { state: event.target.value });
});

ambientInput.addEventListener('change', (event) => {
  hass.updateEntity(DEFAULT_CLIMATE_ENTITY, {
    attributes: { current_temperature: parseNumber(event.target.value) },
  });
});

targetInput.addEventListener('change', (event) => {
  const value = parseNumber(event.target.value);
  if (value === null) return;
  hass.updateEntity(DEFAULT_CLIMATE_ENTITY, {
    attributes: {
      temperature: value,
      target_temp_low: value,
      target_temp_high: value,
    },
  });
});

targetLowInput.addEventListener('change', (event) => {
  hass.updateEntity(DEFAULT_CLIMATE_ENTITY, {
    attributes: { target_temp_low: parseNumber(event.target.value) },
  });
});

targetHighInput.addEventListener('change', (event) => {
  hass.updateEntity(DEFAULT_CLIMATE_ENTITY, {
    attributes: { target_temp_high: parseNumber(event.target.value) },
  });
});

minInput.addEventListener('change', (event) => {
  hass.updateEntity(DEFAULT_CLIMATE_ENTITY, {
    attributes: { min_temp: parseNumber(event.target.value) },
  });
});

maxInput.addEventListener('change', (event) => {
  hass.updateEntity(DEFAULT_CLIMATE_ENTITY, {
    attributes: { max_temp: parseNumber(event.target.value) },
  });
});

presetSelect.addEventListener('change', (event) => {
  hass.updateEntity(DEFAULT_CLIMATE_ENTITY, {
    attributes: { preset_mode: event.target.value },
  });
});

awayCheckbox.addEventListener('change', (event) => {
  hass.updateEntity(DEFAULT_CLIMATE_ENTITY, {
    attributes: { away_mode: event.target.checked ? 'on' : 'off' },
  });
});

resetButton.addEventListener('click', () => {
  hass.reset();
});

form.addEventListener('submit', (event) => event.preventDefault());
