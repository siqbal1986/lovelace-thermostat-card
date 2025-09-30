export function cssData(user) {

  var css =`

  @keyframes thermostat-flame {

    0% {

      transform: scale(0.92);

      filter: drop-shadow(0 0 6px rgba(255, 142, 84, 0.55));

    }

    50% {

      transform: scale(1.06);

      filter: drop-shadow(0 0 10px rgba(255, 112, 67, 0.85));

    }

    100% {

      transform: scale(0.92);

      filter: drop-shadow(0 0 6px rgba(255, 142, 84, 0.55));

    }

  }

  @keyframes thermostat-ice-spin {

    from {

      transform: rotate(0deg);

    }

    to {

      transform: rotate(360deg);

    }

  }

  @keyframes thermostat-dual {

    0% {

      color: #8acbff;

      filter: drop-shadow(0 0 6px rgba(110, 198, 255, 0.55));

    }

    45% {

      color: #ff9a6a;

      filter: drop-shadow(0 0 9px rgba(255, 146, 86, 0.65));

    }

    100% {

      color: #8acbff;

      filter: drop-shadow(0 0 6px rgba(110, 198, 255, 0.55));

    }

  }



  

  ha-card {

    overflow: hidden;

    --rail_border_color: transparent;

    --auto_color: rgb(227, 99, 4, 1);

    --cool_color: rgba(0, 122, 241, 0.6);

    --cool_colorc: rgba(0, 122, 241, 1);

    --heat_color: #ff8100;

    --heat_colorc: rgb(227, 99, 4, 1);

    --manual_color: #44739e;

    --off_color: #8a8a8a;

    --fan_only_color: #D7DBDD;

    --dry_color: #efbd07;

    --idle_color: #808080;

    --unknown_color: #bac;

    --text-color: white;

  }

  ha-card.no_card{

    background-color: transparent;

    border: none;

    box-shadow: none;

  }

  ha-card.no_card .prop{

    display: none;

  }

  .auto, .heat_cool {

    --mode_color: var(--auto_color);

  }

  

  .cool {

    --mode_color: var(--cool_color);

  }

  

  .heat {

    --mode_color: var(--heat_color);

  }

  

  .manual {

    --mode_color: var(--manual_color);

  }

  

  .off {

    --mode_color: var(--off_color);

  }

  .more {

    --mode_color: var(--off_color);

  }

  .fan_only {

    --mode_color: var(--fan_only_color);

  }

  

  .eco {

    --mode_color: var(--auto_color);

  }

  

  .dry {

    --mode_color: var(--dry_color);

  }

  

  .idle {

    --mode_color: var(--idle_color);

  }

  

  .unknown-mode {

    --mode_color: var(--unknown_color);

  }

  .c_body {

    padding: 5% 5% 5% 5%;

  }

  .c_icon{

    position: absolute;

    cursor: pointer;

    top: 0;

    right: 0;

    z-index: 25;

  }

  .dial {

    position: relative;

    display: block;

    width: 100%;

    max-width: 420px;

    margin: 0 auto;

    user-select: none;

    --thermostat-off-fill: rgba(10, 16, 27, 0.92); /* Base face color when no heating/cooling glow is active. */

    --thermostat-path-color: rgba(148, 163, 184, 0.2); /* Default muted color for inactive tick marks. */

    --thermostat-path-active-color: rgba(241, 245, 249, 0.92); /* Bright highlight applied to the active tick arc. */

    --thermostat-path-active-color-large: rgba(241, 245, 249, 0.98); /* Slightly brighter highlight used for the major ticks. */

    --thermostat-text-color: rgba(244, 247, 254, 0.95); /* Gentle white tone for the dial's text labels. */

    --dial-shape-shadow: drop-shadow(0 26px 46px rgba(7, 11, 18, 0.68)); /* Drop shadow that makes the dial appear 3D. */

    --dial-shape-filter: var(--dial-shape-shadow); /* Placeholder for mode-specific glow filters. */

  }

  .dial .dial__shape {

    fill: var(--thermostat-off-fill); /* Apply the base dial face color. */

    filter: var(--dial-shape-filter); /* Add the drop shadow or glow defined by the current mode. */

    transition: fill 0.4s ease, filter 0.4s ease; /* Smoothly animate when the HVAC state changes. */

  }

  .dial--state--off {

    --dial-shape-filter: var(--dial-shape-shadow);

    --mode_color: var(--off_color);

  }

  .dial--state--heat {

    --dial-shape-filter: var(--dial-shape-shadow) drop-shadow(0 0 32px rgba(255, 129, 0, 0.4));

    --mode_color: var(--heat_colorc);

  }

  .dial--state--cool {

    --dial-shape-filter: var(--dial-shape-shadow) drop-shadow(0 0 30px rgba(0, 122, 241, 0.32));

    --mode_color: var(--cool_colorc);

  }

  .dial--state--auto,

  .dial--state--heat_cool {

    --dial-shape-filter: var(--dial-shape-shadow) drop-shadow(0 0 30px rgba(14, 165, 233, 0.32));

    --mode_color: var(--auto_color);

  }

  .dial--state--fan_only {

    --dial-shape-filter: var(--dial-shape-shadow) drop-shadow(0 0 28px rgba(215, 219, 221, 0.28));

    --mode_color: var(--fan_only_color);

  }

  .dial--state--dry {

    --dial-shape-filter: var(--dial-shape-shadow) drop-shadow(0 0 30px rgba(239, 189, 7, 0.35));

    --mode_color: var(--dry_color);

  }

  .dial--state--idle {

    --dial-shape-filter: var(--dial-shape-shadow);

    --mode_color: var(--idle_color);

  }

  .dial--state--unknown {

    --dial-shape-filter: var(--dial-shape-shadow);

    --mode_color: var(--unknown_color);

  }

  .dial--state--heat .dial__shape {

    fill: var(--heat_colorc);

  }

  .dial--state--cool .dial__shape {

    fill: var(--cool_colorc);

  }

  .dial--state--auto .dial__shape,

  .dial--state--heat_cool .dial__shape {

    fill: var(--auto_color);

  }

  .dial--state--fan_only .dial__shape {

    fill: var(--fan_only_color);

  }

  .dial--state--dry .dial__shape {

    fill: var(--dry_color);

  }

  .dial--state--idle .dial__shape {

    fill: var(--idle_color);

  }

  .dial--state--unknown .dial__shape {

    fill: var(--unknown_color);

  }

  .dial__ticks path {

    fill: var(--thermostat-path-color);

    opacity: 0.65;

    transition: fill 0.25s ease, opacity 0.25s ease;

  }

  .dial__ticks path.active {

    fill: var(--mode_color);

    opacity: 0.95;

  }

  .dial__ticks path.large {

    opacity: 0.85;

  }

  .climate_info {

    position: absolute;

    top: 82%;

    left: 50%;

    transform: translate(-50%, -50%);

    width: 16%;

    aspect-ratio: 1;

    border-radius: 50%;

    display: flex;

    align-items: center;

    justify-content: center;

    background: radial-gradient(155% 115% at 35% 25%, rgba(255, 255, 255, 0.28), rgba(22, 27, 35, 1) 58%, rgba(5, 7, 10, 1) 100%); /* Metallic-looking knob texture behind the HVAC mode icon. */

    box-shadow: 0 14px 22px rgba(0, 0, 0, 0.55), inset 0 6px 12px rgba(255, 255, 255, 0.16), inset 0 -6px 18px rgba(0, 0, 0, 0.65); /* Outer and inner shadows to create depth. */

    overflow: hidden;

  }

  .climate_info::before {

    content: "";

    position: absolute;

    inset: 10%;

    border-radius: 50%;

    background: radial-gradient(circle at 35% 25%, rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0.07) 60%, transparent 100%);

    opacity: 0.75;

    pointer-events: none;

  }

  .climate_info__bezel {

    position: absolute;

    inset: 4%;

    border-radius: 50%;

    background: linear-gradient(135deg, rgba(255, 255, 255, 0.28), rgba(67, 74, 84, 0.9));

    box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.35), inset 0 -3px 6px rgba(0, 0, 0, 0.45);

    opacity: 0.6;

    pointer-events: none;

  }

  .mode_color {

    position: absolute;

    inset: 18%;

    border-radius: 50%;

    display: flex;

    align-items: center;

    justify-content: center;

    background: radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.4), rgba(92, 104, 120, 0.15) 55%, rgba(0, 0, 0, 0.45) 100%);

    pointer-events: none;

  }

  .mode_color span {

    display: block;

    width: 100%;

    height: 100%;

    border-radius: 50%;

    background: radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.08));

    opacity: 0.18;

  }

  .modes {

    position: relative;

    width: 58%;

    height: 58%;

    display: flex;

    align-items: center;

    justify-content: center;

  }

  .modes__glow {

    position: absolute;

    inset: -6%;

    border-radius: 50%;

    background: radial-gradient(circle, rgba(180, 210, 255, 0.45), transparent 62%);

    filter: blur(6px);

    opacity: 0.55;

    pointer-events: none;

  }

  .mode-indicator {

    color: var(--mode_color);

    --mdc-icon-size: 100%;

    filter: drop-shadow(0 1px 4px rgba(0, 0, 0, 0.6));

    transition: transform 0.3s ease, filter 0.3s ease, color 0.3s ease;

    transform-origin: 50% 50%;

  }

  .climate_info--heat .modes__glow {

    background: radial-gradient(circle, rgba(255, 142, 84, 0.55), transparent 62%);

  }

  .climate_info--cool .modes__glow,

  .climate_info--fan_only .modes__glow {

    background: radial-gradient(circle, rgba(124, 198, 255, 0.5), transparent 62%);

  }

  .climate_info--heat_cool .modes__glow {

    background: radial-gradient(circle, rgba(110, 198, 255, 0.5), transparent 35%, rgba(255, 146, 86, 0.48) 82%, transparent 100%);

  }

  .climate_info--dry .modes__glow {

    background: radial-gradient(circle, rgba(240, 180, 41, 0.45), transparent 62%);

  }

  .climate_info--heat .mode-indicator {

    color: #ff8a50;

    animation: thermostat-flame 1.8s ease-in-out infinite;

  }

  .climate_info--cool .mode-indicator {

    color: #6ac8ff;

    animation: thermostat-ice-spin 3s linear infinite;

  }

  .climate_info--heat_cool .mode-indicator {

    color: #8acbff;

    animation: thermostat-dual 2.4s ease-in-out infinite;

  }

  .climate_info--heat .mode_color span {

    opacity: 0.28;

  }

  .climate_info--cool .mode_color span {

    opacity: 0.24;

  }

  .climate_info--heat_cool .mode_color span {

    opacity: 0.26;

  }

  }

  .mode-carousel{
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: auto;
    transition: opacity 0.3s ease;
    opacity: 1;
    z-index: 40;
  }
  .mode-carousel.hide{
    opacity: 0;
    pointer-events: none;
  }
  .mode-carousel__track{
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 28px;
    width: 78%;
    max-width: 560px;
    perspective: 1400px;
    pointer-events: auto;
    touch-action: pan-y;
    cursor: grab;
  }
  .mode-carousel__track:active{
    cursor: grabbing;
  }
  .mode-carousel__halo{
    position: absolute;
    width: 36%;
    aspect-ratio: 1;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.18);
    box-shadow: inset 0 0 25px rgba(120, 160, 255, 0.35);
    opacity: 0.4;
    pointer-events: none;
    transition: opacity 0.25s ease;
  }
  .mode-carousel__halo.mode-carousel__halo--hidden{
    opacity: 0;
  }
  .mode-carousel__item{
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-width: 88px;
    min-height: 120px;
    padding: 14px 20px 18px;
    border-radius: 36px;
    border: none;
    background: linear-gradient(155deg, rgba(54, 62, 78, 0.96), rgba(20, 24, 32, 0.88));
    box-shadow: 0 20px 32px rgba(0, 0, 0, 0.6), inset 0 3px 5px rgba(255, 255, 255, 0.15), inset 0 -8px 16px rgba(0, 0, 0, 0.65);
    color: rgba(224, 232, 252, 0.75);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    font-size: 11px;
    line-height: 1.4;
    transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease, opacity 0.2s ease;
    cursor: pointer;
    pointer-events: auto;
    -webkit-appearance: none;
    appearance: none;
    background-clip: padding-box;
  }
  .mode-carousel__item--focus{
    box-shadow: 0 24px 38px rgba(0, 0, 0, 0.65), inset 0 4px 6px rgba(255, 255, 255, 0.22), inset 0 -9px 18px rgba(0, 0, 0, 0.65);
  }
  .mode-carousel__item--active{
    color: rgba(255, 255, 255, 0.95);
    box-shadow: 0 26px 40px rgba(0, 0, 0, 0.68), inset 0 4px 6px rgba(255, 255, 255, 0.24), inset 0 -9px 18px rgba(255, 146, 88, 0.55);
  }
  .mode-carousel__item--deep{
    filter: saturate(0.8);
  }
  .mode-carousel__item.pending{
    filter: saturate(1.25);
  }
  .mode-carousel.pending .mode-carousel__item:not(.pending){
    opacity: 0.45;
    filter: saturate(0.65);
    pointer-events: none;
  }
  .mode-carousel__icon{
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: radial-gradient(circle at 40% 30%, rgba(255, 255, 255, 0.55), rgba(82, 92, 112, 0.25) 55%, rgba(8, 10, 14, 0.88) 100%);
    box-shadow: inset 0 3px 4px rgba(255, 255, 255, 0.2), inset 0 -4px 8px rgba(0, 0, 0, 0.55), 0 8px 16px rgba(0, 0, 0, 0.6);
  }
  .mode-carousel__icon ha-icon{
    color: var(--mode_color);
    --mdc-icon-size: 32px;
    filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.65));
    transition: filter 0.25s ease, color 0.25s ease;
  }
  .mode-carousel__item--active .mode-carousel__icon ha-icon{
    filter: drop-shadow(0 5px 10px rgba(255, 156, 98, 0.8));
  }
  .mode-carousel__label{
    color: rgba(224, 232, 252, 0.64);
    transition: color 0.25s ease;
  }
  .mode-carousel__item--active .mode-carousel__label{
    color: rgba(255, 255, 255, 0.92);
  }
  .dial--blurred{
    filter: blur(6px);
    transform: scale(0.98);
    transform-origin: 50% 50%;
    transform-box: fill-box;
    transition: filter 0.35s ease, transform 0.35s ease;
  }
  .dial__limit-flash{
    opacity: 0;
    fill: rgba(218, 236, 255, 0.45);
    pointer-events: none;
    mix-blend-mode: screen;
    filter: blur(1.2px);
  }
  .dial__limit-flash.flash--min{
    fill: rgba(255, 220, 200, 0.45);
  }
  .dial__limit-flash.flash--max{
    fill: rgba(188, 226, 255, 0.45);
  }
  .dial__limit-flash.flash-active{
    animation: dial-limit-flash 0.32s ease-out;
  }
  @keyframes dial-limit-flash{
    0% { opacity: 0.5; }
    100% { opacity: 0; }
  }
  .dial__drag-overlay {

    opacity: 0;

    fill: rgba(162, 196, 255, 0.18);

    pointer-events: none;

    transition: opacity 0.25s ease, fill 0.25s ease;

    mix-blend-mode: screen;

  }

  .dial--dragging .dial__drag-overlay {

    opacity: 0.28;

    fill: rgba(162, 196, 255, 0.28);

  }

  .dial text, .dial text tspan {

    fill: var(--thermostat-text-color);

    text-anchor: middle;

    font-family: Helvetica, sans-serif;

    alignment-baseline: central;

    dominant-baseline: central;

  }

  .dial__lbl--target {

    font-size: 120px;

    font-weight: bold;

    visibility: hidden;

  }

  .dial__lbl--low, .dial__lbl--high {

    font-size: 90px;

    font-weight: bold;

    visibility: hidden;

  }

  .dial.in_control .dial__lbl--target {

    visibility: visible;

  }

  .dial.in_control .dial__lbl--low {

    visibility: visible;

  }

  .dial.in_control .dial__lbl--high {

    visibility: visible;

  }

  .dial__lbl--ambient {

    font-size: 120px;

    font-weight: bold;

    visibility: visible;

  }
  .dial__temperatureControl {

    fill: transparent;

    transition: fill 0.25s ease, opacity 0.25s ease;

    pointer-events: auto;

  }

  .dial__temperatureControl.control-visible {

    fill: rgba(255, 255, 255, 0.12);

  }


  .dial.in_control.has_dual .dial__chevron--low,

  .dial.in_control.has_dual .dial__chevron--high {

    visibility: visible;

  }

  .dial.in_control .dial__chevron--target {

    visibility: visible;

  }

  .dial.in_control.has_dual .dial__chevron--target {

    visibility: hidden;

  }

  .dial .dial__chevron {

    visibility: hidden;

    fill: none;

    stroke: var(--thermostat-text-color);

    stroke-width: 4px;

    opacity: 0.3;

  }

  .dial .dial__chevron.pressed {

    opacity: 1;

  }

  .dial.in_control .dial__lbl--ambient {

    visibility: hidden;

  }

  .dial__lbl--super--ambient, .dial__lbl--super--target {

    font-size: 40px;

    font-weight: bold;

  }

  .dial__lbl--super--high, .dial__lbl--super--low {

    font-size: 30px;

    font-weight: bold;

  }

  .dial__lbl--ring {

    font-size: 22px;

    font-weight: bold;

  }

  .dial__lbl--title {

    font-size: 24px;

  }

  `

  return css;

  }

  

