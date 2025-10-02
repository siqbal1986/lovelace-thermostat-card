export function cssData(user) {
  // The optional "user" argument is accepted for future overrides but is not
  // currently used; the function simply returns a long CSS template literal.
  var css =`

  @keyframes thermostat-flame {

    0% {

      transform: scale(0.92); /* Start the icon slightly smaller than normal. */

      filter: drop-shadow(0 0 6px rgba(255, 142, 84, 0.55)); /* Add a dim fiery glow. */

    }

    50% {

      transform: scale(1.06); /* Briefly enlarge the icon to simulate a flicker. */

      filter: drop-shadow(0 0 10px rgba(255, 112, 67, 0.85)); /* Intensify the glow at the peak of the animation. */

    }

    100% {

      transform: scale(0.92); /* Return to the original shrunken size. */

      filter: drop-shadow(0 0 6px rgba(255, 142, 84, 0.55)); /* Fade the glow back to the initial subtle level. */

    }

  }

  @keyframes thermostat-ice-spin {

    from {

      transform: rotate(0deg); /* Begin the snowflake in its default orientation. */

    }

    to {

      transform: rotate(360deg); /* Spin the snowflake all the way around for a gentle rotation effect. */

    }

  }

  @keyframes thermostat-dual {

    0% {

      color: #8acbff; /* Start with the cool blue hue. */

      filter: drop-shadow(0 0 6px rgba(110, 198, 255, 0.55)); /* Give the icon a subtle blue aura. */

    }

    45% {

      color: #ff9a6a; /* Midway through, shift to a warm orange tone. */

      filter: drop-shadow(0 0 9px rgba(255, 146, 86, 0.65)); /* Highlight the warm tone with a brighter glow. */

    }

    100% {

      color: #8acbff; /* Loop back to the original cool color. */

      filter: drop-shadow(0 0 6px rgba(110, 198, 255, 0.55)); /* Reset the glow so the loop can repeat smoothly. */

    }

  }



  

  ha-card {

    overflow: hidden; /* Hide anything that extends outside the rounded edges. */

    --rail_border_color: transparent; /* Neutral default for optional UI rails. */

    --auto_color: rgb(227, 99, 4, 1); /* Warm orange accent for automatic heat/cool mode. */

    --cool_color: rgba(0, 122, 241, 0.6); /* Translucent cool blue used for inactive cool states. */

    --cool_colorc: rgba(0, 122, 241, 1); /* Opaque cool blue for active cool highlights. */

    --heat_color: #ff8100; /* Vibrant orange for heating state backgrounds. */

    --heat_colorc: rgb(227, 99, 4, 1); /* Slightly darker orange for heating glows. */

    --manual_color: #44739e; /* Muted blue-grey for manual mode. */

    --off_color: #8a8a8a; /* Neutral grey when the system is off. */

    --fan_only_color: #D7DBDD; /* Pale silver tone for fan-only mode. */

    --dry_color: #efbd07; /* Golden hue representing dehumidify mode. */

    --idle_color: #808080; /* Medium grey while the system is idle. */

    --unknown_color: #bac; /* Soft lavender fallback for unknown states. */

    --text-color: white; /* Default text color inside the card. */

  }

  ha-card.no_card{

    background-color: transparent; /* Allow the card to sit directly on the dashboard background. */

    border: none; /* Remove the standard material design outline. */

    box-shadow: none; /* Remove the raised shadow so the widget blends in. */

  }

  ha-card.no_card .prop{

    display: none; /* Hide the kebab/overflow menu when the wrapper is transparent. */

  }

  .auto, .heat_cool {

    --mode_color: var(--auto_color); /* Share the automatic mode accent across auto and heat_cool classes. */

  }



  .cool {

    --mode_color: var(--cool_color); /* Assign the blue highlight to cool mode elements. */

  }



  .heat {

    --mode_color: var(--heat_color); /* Apply the orange highlight when heating. */

  }



  .manual {

    --mode_color: var(--manual_color); /* Use the muted tone for manual operations. */

  }

  

  .off {

    --mode_color: var(--off_color); /* Default grey highlight when the system is powered down. */

  }

  .more {

    --mode_color: var(--off_color); /* Reuse the neutral grey for the overflow state indicator. */

  }

  .fan_only {

    --mode_color: var(--fan_only_color); /* Assign the pale tone to pure ventilation mode. */

  }



  .eco {

    --mode_color: var(--auto_color); /* Treat eco mode similarly to automatic heat/cool for accents. */

  }



  .dry {

    --mode_color: var(--dry_color); /* Use the gold color whenever dehumidification is active. */

  }



  .idle {

    --mode_color: var(--idle_color); /* Soft grey for the idle-but-ready visual state. */

  }



  .unknown-mode {

    --mode_color: var(--unknown_color); /* Apply the lavender fallback if the HVAC mode is unknown. */

  }

  .c_body {

    padding: 5% 5% 5% 5%; /* Give the dial breathing room within the card. */

  }

  .c_icon{

    position: absolute; /* Pin the kebab icon to the corner without affecting layout flow. */

    cursor: pointer; /* Indicate the icon can be clicked. */

    top: 0; /* Anchor the icon to the top edge of the card. */

    right: 0; /* Anchor the icon to the right edge of the card. */

    z-index: 25; /* Keep the icon above the SVG dial layers. */

  }

  .dial {

    position: relative; /* Allow absolutely positioned overlays to align to the dial container. */

    display: block; /* Ensure the SVG consumes the available width like a block-level element. */

    width: 100%; /* Let the dial stretch to the container's width. */

    max-width: 420px; /* Prevent the dial from becoming too large on wide dashboards. */

    margin: 0 auto; /* Center the dial horizontally. */

    user-select: none; /* Stop accidental text selection while dragging on the dial. */

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

    --dial-shape-filter: var(--dial-shape-shadow); /* Keep the base drop shadow without an extra glow. */

    --mode_color: var(--off_color); /* Neutral grey accent while off. */

  }

  .dial--state--heat {

    --dial-shape-filter: var(--dial-shape-shadow) drop-shadow(0 0 32px rgba(255, 129, 0, 0.4)); /* Surround the dial with a fiery halo. */

    --mode_color: var(--heat_colorc); /* Strong orange accent while heating. */

  }

  .dial--state--cool {

    --dial-shape-filter: var(--dial-shape-shadow) drop-shadow(0 0 30px rgba(0, 122, 241, 0.32)); /* Bathe the dial in a cool blue glow. */

    --mode_color: var(--cool_colorc); /* Bright blue accent while cooling. */

  }

  .dial--state--auto,

  .dial--state--heat_cool {

    --dial-shape-filter: var(--dial-shape-shadow) drop-shadow(0 0 30px rgba(14, 165, 233, 0.32)); /* Teal glow signalling both heating and cooling readiness. */

    --mode_color: var(--auto_color); /* Shared accent for the blended modes. */

  }

  .dial--state--fan_only {

    --dial-shape-filter: var(--dial-shape-shadow) drop-shadow(0 0 28px rgba(215, 219, 221, 0.28)); /* Soft white halo for gentle airflow mode. */

    --mode_color: var(--fan_only_color); /* Light metallic accent suited to ventilation. */

  }

  .dial--state--dry {

    --dial-shape-filter: var(--dial-shape-shadow) drop-shadow(0 0 30px rgba(239, 189, 7, 0.35)); /* Warm gold glow for dehumidifying. */

    --mode_color: var(--dry_color); /* Match the highlight to the dry mode colour. */

  }

  .dial--state--idle {

    --dial-shape-filter: var(--dial-shape-shadow); /* No extra glow while the system waits on standby. */

    --mode_color: var(--idle_color); /* Subtle grey accent to show readiness. */

  }

  .dial--state--unknown {

    --dial-shape-filter: var(--dial-shape-shadow); /* Default to the neutral shadow when the mode is unknown. */

    --mode_color: var(--unknown_color); /* Apply the lavender fallback accent. */

  }

  .dial--state--heat .dial__shape {

    fill: var(--heat_colorc); /* Paint the disc with the heating accent colour. */

  }

  .dial--state--cool .dial__shape {

    fill: var(--cool_colorc); /* Use the cooling accent while the AC runs. */

  }

  .dial--state--auto .dial__shape,

  .dial--state--heat_cool .dial__shape {

    fill: var(--auto_color); /* Share the blended accent for hybrid modes. */

  }

  .dial--state--fan_only .dial__shape {

    fill: var(--fan_only_color); /* Present a silver tone when only the fan operates. */

  }

  .dial--state--dry .dial__shape {

    fill: var(--dry_color); /* Highlight the disc with the drying gold. */

  }

  .dial--state--idle .dial__shape {

    fill: var(--idle_color); /* Show a calm grey while idle. */

  }

  .dial--state--unknown .dial__shape {

    fill: var(--unknown_color); /* Use the fallback colour when the state is unclear. */

  }

  .dial__ticks path {

    fill: var(--thermostat-path-color); /* Default muted colour for inactive tick marks. */

    opacity: 0.65; /* Slightly translucent so the active arc stands out. */

    transition: fill 0.25s ease, opacity 0.25s ease; /* Smooth changes when ticks light up. */

  }

  .dial__ticks path.active {

    fill: var(--mode_color); /* Highlight active ticks with the current mode colour. */

    opacity: 0.95; /* Increase opacity so the active arc appears brighter. */

  }

  .dial__ticks path.large {

    opacity: 0.85; /* Make major ticks slightly more prominent than minor ones. */

  }

  .mode-menu{
    position: absolute; /* Anchor the menu in the middle of the dialog overlay. */
    inset: 0; /* Stretch the container so menu items can radiate in any direction. */
    display: flex; /* Center the toggler in the available space. */
    align-items: center; /* Vertically center the toggler. */
    justify-content: center; /* Horizontally center the toggler. */
    pointer-events: none; /* Keep the container itself from capturing events. */
    --menu-distance-scale: 0; /* Collapse radial items by default. */
    z-index: 40; /* Sit above the dial graphics like the legacy carousel. */
  }
  .mode-menu.menu-open{
    pointer-events: auto; /* Allow menu items to receive interaction while open. */
    --menu-distance-scale: 1; /* Expand the radial layout. */
  }
  .mode-menu__toggler{
    position: relative; /* Create a stacking context for the toggle button. */
    z-index: 2; /* Sit above the fanned out menu items. */
    width: 58px; /* Provide a large tap target. */
    height: 58px; /* Match width to keep the control circular. */
    border-radius: 50%; /* Round shape echoes the dial. */
    border: 1px solid rgba(255, 255, 255, 0.22); /* Subtle outline to lift the button. */
    background: radial-gradient(circle at 40% 30%, rgba(255, 255, 255, 0.65), rgba(44, 54, 72, 0.92)); /* Soft highlight for depth. */
    box-shadow: 0 12px 20px rgba(0, 0, 0, 0.55), inset 0 3px 6px rgba(255, 255, 255, 0.25), inset 0 -6px 10px rgba(0, 0, 0, 0.55); /* Layered shadows enhance realism. */
    cursor: pointer; /* Indicate the control is interactive. */
    pointer-events: auto; /* Allow clicks to pass through to the toggler. */
    display: inline-flex; /* Center the decorative bars. */
    align-items: center; /* Align internal spans vertically. */
    justify-content: center; /* Align internal spans horizontally. */
    gap: 6px; /* Even spacing for the bars. */
    padding: 0; /* Remove default button padding. */
    color: inherit; /* Inherit text/icon color. */
    -webkit-appearance: none; /* Reset browser button styles. */
    appearance: none; /* Reset browser button styles. */
    transition: transform 0.3s ease, box-shadow 0.3s ease; /* Smooth hover feedback. */
  }
  .mode-menu.menu-open .mode-menu__toggler{
    transform: scale(0.95); /* Slightly compress when active. */
    box-shadow: 0 10px 18px rgba(0, 0, 0, 0.5), inset 0 4px 8px rgba(255, 255, 255, 0.2), inset 0 -4px 8px rgba(0, 0, 0, 0.55); /* Adjust lighting while open. */
  }
  .mode-menu__toggler span{
    display: block; /* Treat each bar as a block element. */
    width: 18px; /* Consistent bar width. */
    height: 2px; /* Thin bar to mimic a menu icon. */
    border-radius: 2px; /* Slightly round the ends. */
    background: rgba(28, 34, 48, 0.85); /* Dark accent against the bright button. */
    transition: transform 0.3s ease, opacity 0.3s ease; /* Animate to an X when open. */
  }
  .mode-menu.menu-open .mode-menu__toggler span:nth-child(1){
    transform: translateY(6px) rotate(45deg); /* Form the first arm of the close icon. */
  }
  .mode-menu.menu-open .mode-menu__toggler span:nth-child(2){
    opacity: 0; /* Hide the middle bar while open. */
  }
  .mode-menu.menu-open .mode-menu__toggler span:nth-child(3){
    transform: translateY(-6px) rotate(-45deg); /* Form the second arm of the close icon. */
  }
  .mode-menu__items{
    list-style: none; /* Remove default list bullets. */
    padding: 0; /* Strip default list padding. */
    margin: 0; /* Strip default list margin. */
    position: absolute; /* Allow radial positioning around the toggler. */
    inset: 0; /* Fill the container so transforms pivot around the center. */
    pointer-events: none; /* Only enable interaction when the container is open. */
  }
  .mode-menu.menu-open .mode-menu__items{
    pointer-events: auto; /* Allow buttons to be clicked while the menu is expanded. */
  }
  .menu-item{
    position: absolute; /* Absolute positioning lets each item fan out from the middle. */
    top: 50%; /* Start centered vertically. */
    left: 50%; /* Start centered horizontally. */
    transform-origin: center; /* Keep transforms balanced around the button center. */
    transform: translate(-50%, -50%) rotate(var(--menu-angle, 0deg)) translate(calc(var(--menu-distance, 0px) * var(--menu-distance-scale))) rotate(var(--menu-angle-negative, 0deg)); /* Rotate outwards and keep labels upright. */
    opacity: 0; /* Hidden until the menu opens. */
    transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.25s ease; /* Smoothly animate the radial layout. */
    pointer-events: none; /* Disable interaction until open. */
  }
  .mode-menu.menu-open .menu-item{
    opacity: 1; /* Fade in when expanded. */
    pointer-events: auto; /* Enable pointer interaction once visible. */
  }
  .menu-item__button{
    display: inline-flex; /* Align icon and label vertically. */
    flex-direction: column; /* Stack the icon over the label. */
    align-items: center; /* Center contents horizontally. */
    justify-content: center; /* Center contents vertically. */
    gap: 8px; /* Space between icon and text. */
    min-width: 86px; /* Provide a generous tap target. */
    padding: 14px 18px; /* Comfortable touch padding. */
    border-radius: 32px; /* Pill shape matches existing UI. */
    border: none; /* Remove the native border. */
    background: linear-gradient(155deg, rgba(54, 62, 78, 0.92), rgba(22, 26, 34, 0.88)); /* Soft gradient similar to legacy carousel. */
    box-shadow: 0 16px 26px rgba(0, 0, 0, 0.55), inset 0 2px 4px rgba(255, 255, 255, 0.18), inset 0 -6px 12px rgba(0, 0, 0, 0.6); /* Depth to emphasize floating buttons. */
    color: rgba(224, 232, 252, 0.78); /* Neutral label color. */
    font-size: 12px; /* Legible but compact text. */
    line-height: 1.35; /* Comfortable spacing for multi-line labels. */
    letter-spacing: 0.08em; /* Slight tracking to mirror original design language. */
    text-transform: uppercase; /* Preserve menu styling. */
    cursor: pointer; /* Clarify interactivity. */
    -webkit-appearance: none; /* Reset browser styles. */
    appearance: none; /* Reset browser styles. */
    transition: transform 0.2s ease, box-shadow 0.2s ease, color 0.2s ease; /* Provide tactile feedback. */
  }
  .menu-item__button:hover,
  .menu-item__button:focus{
    outline: none; /* Remove default outlines while we style focus ourselves. */
    transform: translateY(-4px); /* Lift slightly on hover/focus. */
    box-shadow: 0 20px 30px rgba(0, 0, 0, 0.6), inset 0 3px 6px rgba(255, 255, 255, 0.22), inset 0 -6px 14px rgba(0, 0, 0, 0.6); /* Enhance shadow for depth. */
    color: rgba(255, 255, 255, 0.92); /* Brighten label for accessibility. */
  }
  .menu-item--active .menu-item__button{
    color: rgba(255, 255, 255, 0.95); /* Highlight active mode. */
    box-shadow: 0 22px 34px rgba(0, 0, 0, 0.62), inset 0 4px 7px rgba(255, 255, 255, 0.24), inset 0 -6px 16px rgba(255, 146, 90, 0.55); /* Warm inner glow to signal selection. */
  }
  .menu-item__icon{
    display: flex; /* Center the icon in its circular badge. */
    align-items: center; /* Vertical centering. */
    justify-content: center; /* Horizontal centering. */
    width: 52px; /* Circular badge size. */
    height: 52px; /* Match width for perfect circle. */
    border-radius: 50%; /* Circular badge. */
    background: radial-gradient(circle at 40% 30%, rgba(255, 255, 255, 0.55), rgba(82, 92, 112, 0.28) 55%, rgba(10, 12, 18, 0.82) 100%); /* Metallic inspired highlight. */
    box-shadow: inset 0 3px 5px rgba(255, 255, 255, 0.2), inset 0 -5px 10px rgba(0, 0, 0, 0.6), 0 8px 16px rgba(0, 0, 0, 0.55); /* Depth to match dial. */
  }
  .menu-item__icon ha-icon{
    --mdc-icon-size: 30px; /* Balance icon within the badge. */
    color: var(--mode_color); /* Match icon color to HVAC mode. */
    filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.6)); /* Glow for readability. */
    transition: color 0.25s ease, filter 0.25s ease; /* Animate when state changes. */
  }
  .menu-item--active .menu-item__icon ha-icon{
    filter: drop-shadow(0 4px 9px rgba(255, 156, 98, 0.75)); /* Warmer glow when active. */
  }
  .menu-item__label{
    color: inherit; /* Follow button color changes. */
    text-align: center; /* Keep labels centered. */
  }
  .dial--blurred{
    filter: blur(6px); /* Apply visual effects such as blur or drop shadows for depth cues. */
    transform: scale(0.98); /* Documented property purpose for clarity. */
    transform-origin: 50% 50%; /* Define the pivot point for transforms so rotations look natural. */
    transform-box: fill-box; /* Documented property purpose for clarity. */
    transition: filter 0.35s ease, transform 0.35s ease; /* Animate property changes smoothly for a polished feel. */
  }
  .dial__limit-flash{
    opacity: 0; /* Adjust transparency to blend the layer into the dial. */
    fill: rgba(218, 236, 255, 0.45); /* Set the SVG fill colour for this shape. */
    pointer-events: none; /* Allow or block pointer interaction as appropriate for the layer. */
    mix-blend-mode: screen; /* Blend this layer with those below for a glow effect. */
    filter: blur(1.2px); /* Apply visual effects such as blur or drop shadows for depth cues. */
  }
  .dial__limit-flash.flash--min{
    fill: rgba(255, 220, 200, 0.45); /* Set the SVG fill colour for this shape. */
  }
  .dial__limit-flash.flash--max{
    fill: rgba(188, 226, 255, 0.45); /* Set the SVG fill colour for this shape. */
  }
  .dial__limit-flash.flash-active{
    animation: dial-limit-flash 0.32s ease-out; /* Documented property purpose for clarity. */
  }
  @keyframes dial-limit-flash{
    0% { opacity: 0.5; /* Start with a bright flash. */ }
    100% { opacity: 0; /* Fade the flash to transparent. */ }
  }
  .dial__drag-overlay {

    opacity: 0; /* Adjust transparency to blend the layer into the dial. */

    fill: rgba(162, 196, 255, 0.18); /* Set the SVG fill colour for this shape. */

    pointer-events: none; /* Allow or block pointer interaction as appropriate for the layer. */

    transition: opacity 0.25s ease, fill 0.25s ease; /* Animate property changes smoothly for a polished feel. */

    mix-blend-mode: screen; /* Blend this layer with those below for a glow effect. */

  }

  .dial--dragging .dial__drag-overlay {

    opacity: 0.28; /* Adjust transparency to blend the layer into the dial. */

    fill: rgba(162, 196, 255, 0.28); /* Set the SVG fill colour for this shape. */

  }

  .dial text, .dial text tspan {

    fill: var(--thermostat-text-color); /* Set the SVG fill colour for this shape. */

    text-anchor: middle; /* Align text relative to its anchor point. */

    font-family: Helvetica, sans-serif; /* Select the typeface used for the dial labels. */

    alignment-baseline: central; /* Align the baseline of the SVG text relative to the anchor. */

    dominant-baseline: central; /* Control vertical alignment for SVG text. */

  }

  .dial__lbl--target {

    font-size: 120px; /* Size the text appropriately for readability. */

    font-weight: bold; /* Set the weight to emphasise important numbers. */

    visibility: hidden; /* Toggle whether the element is visibly rendered. */

  }

  .dial__lbl--low, .dial__lbl--high {

    font-size: 90px; /* Size the text appropriately for readability. */

    font-weight: bold; /* Set the weight to emphasise important numbers. */

    visibility: hidden; /* Toggle whether the element is visibly rendered. */

  }

  .dial.in_control .dial__lbl--target {

    visibility: visible; /* Toggle whether the element is visibly rendered. */

  }

  .dial.in_control .dial__lbl--low {

    visibility: visible; /* Toggle whether the element is visibly rendered. */

  }

  .dial.in_control .dial__lbl--high {

    visibility: visible; /* Toggle whether the element is visibly rendered. */

  }

  .dial__lbl--ambient {

    font-size: 120px; /* Size the text appropriately for readability. */

    font-weight: bold; /* Set the weight to emphasise important numbers. */

    visibility: visible; /* Toggle whether the element is visibly rendered. */

  }
  .dial__temperatureControl {

    fill: transparent; /* Set the SVG fill colour for this shape. */

    transition: fill 0.25s ease, opacity 0.25s ease; /* Animate property changes smoothly for a polished feel. */

    pointer-events: auto; /* Allow or block pointer interaction as appropriate for the layer. */

  }

  .dial__temperatureControl.control-visible {

    fill: rgba(255, 255, 255, 0.12); /* Light translucent fill to highlight the active control area. */

  }


  .dial.in_control.has_dual .dial__chevron--low,

  .dial.in_control.has_dual .dial__chevron--high {

    visibility: visible; /* Toggle whether the element is visibly rendered. */

  }

  .dial.in_control .dial__chevron--target {

    visibility: visible; /* Toggle whether the element is visibly rendered. */

  }

  .dial.in_control.has_dual .dial__chevron--target {

    visibility: hidden; /* Toggle whether the element is visibly rendered. */

  }

  .dial .dial__chevron {

    visibility: hidden; /* Toggle whether the element is visibly rendered. */

    fill: none; /* Set the SVG fill colour for this shape. */

    stroke: var(--thermostat-text-color); /* Choose the stroke colour for the SVG outline. */

    stroke-width: 4px; /* Define how thick the SVG outline appears. */

    opacity: 0.3; /* Adjust transparency to blend the layer into the dial. */

  }

  .dial .dial__chevron.pressed {

    opacity: 1; /* Adjust transparency to blend the layer into the dial. */

  }

  .dial.in_control .dial__lbl--ambient {

    visibility: hidden; /* Toggle whether the element is visibly rendered. */

  }

  .dial__lbl--super--ambient, .dial__lbl--super--target {

    font-size: 40px; /* Size the text appropriately for readability. */

    font-weight: bold; /* Set the weight to emphasise important numbers. */

  }

  .dial__lbl--super--high, .dial__lbl--super--low {

    font-size: 30px; /* Size the text appropriately for readability. */

    font-weight: bold; /* Set the weight to emphasise important numbers. */

  }

  .dial__lbl--ring {

    font-size: 22px; /* Size the text appropriately for readability. */

    font-weight: bold; /* Set the weight to emphasise important numbers. */

  }

  .dial__lbl--title {

    font-size: 24px; /* Size the text appropriately for readability. */

  }

  `

  return css; /* Provide the assembled stylesheet to callers. */

  }

  

