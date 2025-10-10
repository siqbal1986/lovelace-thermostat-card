export default class ThermostatLayeredUI {
  constructor(ui) {
    this._ui = ui;
    this._modeMenuHost = null;
    this._modeMenuContainer = null;
    this._isMenuOpen = false;
  }

  /**
   * Attaches the mode menu container inside a HTML host that is rendered
   * through an SVG foreignObject.  The original implementation disabled
   * pointer events on the host which prevented the newly inlined SVG toggler
   * from receiving click events once it was appended to the host.  By default
   * the host now allows pointer interaction and we only suspend hit-testing
   * while the menu is explicitly hidden.
   *
   * @param {HTMLElement} container
   * @returns {HTMLElement}
   */
  attachModeMenu(container) {
    if (!container) return null;

    this._modeMenuContainer = container;

    if (!this._modeMenuHost) {
      const host = document.createElement('div');
      host.classList.add('layered-mode-menu-host');

      // Allow the toggler SVG to remain interactive.  The host used to set
      // pointer-events to "none", which caused browsers to skip the entire
      // subtree during hit-testing.  This meant the HVAC mode menu could not
      // be opened in layered mode.  Instead we default to allowing pointer
      // events and only disable them when the menu is hidden.
      host.style.pointerEvents = 'auto';

      host.appendChild(container);
      this._modeMenuHost = host;
    } else if (!this._modeMenuHost.contains(container)) {
      this._modeMenuHost.appendChild(container);
    }

    this._applyPointerEvents();

    return this._modeMenuHost;
  }

  setMenuOpen(isOpen) {
    if (typeof isOpen !== 'boolean') return;
    this._isMenuOpen = isOpen;
    this._applyPointerEvents();
  }

  _applyPointerEvents() {
    if (!this._modeMenuHost) return;
    this._modeMenuHost.style.pointerEvents = this._isMenuOpen ? 'auto' : 'none';
  }
}
