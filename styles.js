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
    position: relative; /* Anchor absolute overlays like the HVAC mode button. */

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

    -ms-touch-action: none; /* Prevent legacy Edge from hijacking the gesture for panning. */

    touch-action: none; /* Keep browsers from cancelling the drag to start scrolling. */

    user-select: none; /* Stop accidental text selection while dragging on the dial. */

    --thermostat-off-fill: rgba(10, 16, 27, 0.92); /* Base face color when no heating/cooling glow is active. */

    --thermostat-path-color: rgba(148, 163, 184, 0.2); /* Default muted color for inactive tick marks. */

    --thermostat-path-active-color: rgba(241, 245, 249, 0.92); /* Bright highlight applied to the active tick arc. */

    --thermostat-path-active-color-large: rgba(241, 245, 249, 0.98); /* Slightly brighter highlight used for the major ticks. */

    --thermostat-text-color: rgba(244, 247, 254, 0.95); /* Gentle white tone for the dial's text labels. */

    --dial-shape-shadow: drop-shadow(0 26px 46px rgba(7, 11, 18, 0.68)); /* Drop shadow that makes the dial appear 3D. */

    --dial-shape-filter: var(--dial-shape-shadow); /* Placeholder for mode-specific glow filters. */

  }

  /* Remove any default focus/tap highlight artifacts on the SVG and its children */
  .dial, .dial * {
    outline: none;
    -webkit-tap-highlight-color: rgba(0,0,0,0);
  }
  svg.dial:focus { outline: none; }

  /* Outer ground shadow beneath the dial */
  .outer__shadow{
    fill: rgba(0,0,0,0.6);
    filter: blur(28px);
    mix-blend-mode: multiply;
    opacity: 0.35;
    pointer-events: none;
    transition: opacity 0.3s ease, filter 0.3s ease;
  }

  /* Inner face vignette for depth */
  .face__vignette{
    mix-blend-mode: multiply;
    pointer-events: none;
    opacity: 0.85;
    transition: opacity 0.3s ease;
  }

  /* Glass highlights */
  .dial__glass{ pointer-events: none; }
  .glass__diag{
    fill: white;
    mix-blend-mode: screen;
    filter: blur(5px);
    opacity: 0.20;
    transition: transform 0.25s ease, opacity 0.25s ease;
  }
  .glass__diag--tl{ opacity: 0.26; filter: blur(6px); }
  .glass__diag--br{ opacity: 0.18; filter: blur(5px); }
  .glass__bottom{
    fill: white;
    opacity: 0.18;
    filter: blur(9px);
    mix-blend-mode: screen;
    transition: transform 0.25s ease, opacity 0.25s ease;
  }

  /* Ring groups */
  .dial__ring-static{ pointer-events: none; }
  .dial__ring-spin{ pointer-events: none; }

  .dial .dial__shape {

    fill: var(--thermostat-off-fill); /* Apply the base dial face color. */

    filter: var(--dial-shape-filter); /* Add the drop shadow or glow defined by the current mode. */

    transition: fill 0.4s ease, filter 0.4s ease; /* Smoothly animate when the HVAC state changes. */

  }

  .dial__metal-ring {

    fill: var(--dial-metal-ring-fill, radial-gradient(circle at 38% 34%, #fefefe 0%, #e7eaef 32%, #cdd1d8 55%, #a3a8b0 72%, #6c737b 88%, #464b52 100%)); /* Reapply the brushed metal base using the generated gradient or a close CSS fallback. */

    stroke: var(--dial-metal-ring-stroke, rgba(243, 244, 247, 0.68)); /* Use the dynamic sheen gradient when available so the edge glints correctly. */

    stroke-width: 1.4; /* Match the SVG stroke width set when constructing the path. */

    filter: var(--dial-metal-ring-filter, drop-shadow(0 3px 7px rgba(0, 0, 0, 0.45)) drop-shadow(0 -1px 1.2px rgba(255, 255, 255, 0.6))); /* Stronger layered lighting for realism. */

    transition: filter 0.35s ease, fill 0.45s ease, stroke 0.45s ease; /* Smooth the response when the ring gains active emphasis. */

  }

  .dial.in_control .dial__metal-ring {

    filter: var(--dial-metal-ring-filter-active, drop-shadow(0 4px 8px rgba(0, 0, 0, 0.45)) drop-shadow(0 -1px 1.5px rgba(255, 255, 255, 0.55))); /* Intensify the glow while the dial is actively being adjusted. */

  }

  .dial__metal-ring-sheen {

    fill: var(--dial-metal-ring-stroke, linear-gradient(to bottom, rgba(255, 255, 255, 0.95) 0%, rgba(243, 244, 247, 0.5) 30%, rgba(182, 187, 195, 0.2) 60%, rgba(60, 65, 74, 0.7) 100%)); /* Tighter brighter specular falloff. */

    mix-blend-mode: screen; /* Allow the sheen to brighten the metal subtly instead of obscuring it. */

    opacity: 0.95; /* Brighter specular for chrome-like rim. */

    pointer-events: none; /* Ensure the sheen never blocks pointer interactions with the dial. */

  }

  .dial__metal-ring-shadow {

    fill: linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.35) 55%, rgba(0, 0, 0, 0.7) 100%); /* Deeper lower shadow for depth. */

    mix-blend-mode: multiply; /* Let the shadow darken the existing tones rather than covering them. */

    opacity: 0.75; /* Balance the shadow strength so the bevel stays readable. */

    pointer-events: none; /* Prevent the shadow overlay from catching pointer events. */

  }

  .dial__ring-grip {
    /* Use a solid fill; CSS gradients are not applied to SVG fill in all engines */
    fill: rgba(255, 255, 255, 0.28);

    stroke: rgba(0, 0, 0, 0.12); /* Softer outline to avoid darkening the rim. */

    stroke-width: 0.15; /* Thinner stroke to keep bands bright. */

    vector-effect: non-scaling-stroke; /* Maintain a consistent grip edge when the dial scales. */

    mix-blend-mode: screen; /* Brighten the rim without muddying it. */

    pointer-events: none; /* Prevent the grips from blocking drag gestures or darkening on hover. */

  }

  /* Rotating reflection band on ring */
  .dial__ring-reflection{
    fill: rgba(255,255,255,0.18);
    filter: blur(2.2px);
    mix-blend-mode: screen;
    opacity: 0.22;
    pointer-events: none;
    transition: opacity 0.25s ease;
  }

  /* Specular rim line */
  .dial__rim-spec{
    mix-blend-mode: screen;
    filter: blur(0.6px);
    opacity: 0.95;
    pointer-events: none;
  }
  .dial__rim-spec--inner{ opacity: 0.6; filter: blur(0.4px); }

  /* Inner bevel ring */
  .dial__inner-bevel{
    mix-blend-mode: multiply;
    opacity: 0.9;
    pointer-events: none;
  }
  .dial__metal-brush{ mix-blend-mode: overlay; opacity: 0.18; pointer-events: none; }

  .dial__editableIndicator {
    /* Use a solid semi-transparent fill; CSS gradients are not supported on SVG fills in all engines */
    fill: rgba(255, 255, 255, 0.16); /* Light halo that appears when the dial enters edit mode. */

    stroke: none; /* Avoid thin outline artifacts on press/focus. */

    opacity: 0; /* Hidden by default until the dial becomes editable. */

    pointer-events: none; /* Keep the halo from intercepting pointer actions. */

    transition: opacity 0.3s ease; /* Fade the halo in and out smoothly. */

  }

  .dial.in_control .dial__editableIndicator {

    opacity: 1; /* Reveal the halo while the user is actively manipulating the dial. */

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

    opacity: 0.45; /* Darker, more subdued for glassy face. */

    transition: fill 0.25s ease, opacity 0.25s ease; /* Smooth changes when ticks light up. */

  }

  .dial__ticks path.active {

    fill: var(--mode_color); /* Highlight active ticks with the current mode colour. */

    opacity: 1; /* Brighter for emphasis. */

  }

  .dial__ticks path.large {

    opacity: 0.75; /* Major ticks a bit more prominent, still subtle. */

  }

  .mode-menu{
    pointer-events: none; /* Allow interactions to fall through until explicitly enabled. */
  }
  .mode-menu.mode-menu--overlay{
    pointer-events: auto; /* Enable pointer interaction for the HTML-based toggle. */
    position: absolute; /* Allow precise centering over the dial. */
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%); /* Center the button around the computed anchor. */
    z-index: 32; /* Keep the toggle above the SVG dial layers. */
    width: var(--mode-toggle-size, 72px); /* Fallback size; overridden inline during layout. */
    height: var(--mode-toggle-size, 72px);
    display: block;
  }
  .mode-menu.mode-menu--overlay .mode-menu__toggler{
    width: 100%;
    height: 100%;
    padding: 0;
    margin: 0;
    border: none;
    border-radius: 50%;
    background: none;
    cursor: pointer;
    position: relative;
    outline: none;
  }
  .mode-menu.mode-menu--overlay .mode-menu__toggler-body{
    position: relative;
    width: 100%;
    height: 100%;
    display: block;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, rgba(88, 108, 138, 0.85), rgba(26, 34, 48, 0.95));
    border: 1.2px solid rgba(255, 255, 255, 0.22);
    box-shadow: 0 12px 20px rgba(0, 0, 0, 0.55);
    filter: none; /* Use box-shadow for depth instead of SVG drop-shadows. */
    transition: opacity 0.25s ease, box-shadow 0.3s ease;
  }
  .mode-menu.mode-menu--overlay .mode-menu__toggler:focus-visible .mode-menu__toggler-body{
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.45), 0 12px 20px rgba(0, 0, 0, 0.55);
  }
  .mode-menu.mode-menu--overlay .mode-menu__toggler-icon{
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: calc(var(--mode-toggle-bar-gap, 8px) * 0.55);
    pointer-events: none;
  }
  .mode-menu.mode-menu--overlay .mode-menu__toggler-bar{
    display: block;
    width: 52%;
    height: max(2px, calc(var(--mode-toggle-size, 60px) * 0.09));
    border-radius: 999px;
    background: rgba(18, 24, 38, 0.85);
    transform-origin: center;
  }
  .mode-menu.mode-menu--overlay .mode-menu__toggler-bar--top{
    transform: translateY(calc(-1 * var(--mode-toggle-bar-gap, 8px)));
  }
  .mode-menu.mode-menu--overlay .mode-menu__toggler-bar--middle{
    transform: translateY(0);
  }
  .mode-menu.mode-menu--overlay .mode-menu__toggler-bar--bottom{
    transform: translateY(var(--mode-toggle-bar-gap, 8px));
  }
  .mode-menu.menu-open.mode-menu--overlay .mode-menu__toggler-bar--top{
    transform: translateY(0) rotate(45deg);
  }
  .mode-menu.menu-open.mode-menu--overlay .mode-menu__toggler-bar--bottom{
    transform: translateY(0) rotate(-45deg);
  }
  .mode-menu.menu-open{
    pointer-events: auto; /* Permit menu interaction while expanded. */
  }
  .mode-menu__toggler{
    cursor: pointer; /* Indicate interactivity on the SVG group. */
    pointer-events: auto; /* Accept pointer events even though the parent group may ignore them. */
    transform-box: fill-box; /* Ensure transforms operate relative to the rendered geometry. */
    transform-origin: center; /* Keep scale effects centered on the control. */
    outline: none; /* Reset default focus outlines so we can style them manually. */
  }
  .mode-menu__toggler:focus-visible .mode-menu__toggler-circle{
    stroke: rgba(255, 255, 255, 0.55); /* Brighten the ring when keyboard focused. */
    stroke-width: 1.6px; /* Thicken outline for accessibility. */
  }
  .mode-menu__toggler-body{
    transition: transform 0.3s ease; /* Animate subtle press effect. */
  }
  .mode-menu.menu-open .mode-menu__toggler-body,
  .mode-menu__toggler-body--open{
    transform: scale(0.95); /* Compress slightly while the menu is open. */
  }
  .mode-menu__toggler-circle{
    fill: rgba(44, 54, 72, 0.92); /* Rich metallic base. */
    stroke: rgba(255, 255, 255, 0.22); /* Subtle rim. */
    stroke-width: 1.2px; /* Light outline thickness. */
    filter: drop-shadow(0 12px 20px rgba(0, 0, 0, 0.55)); /* Depth similar to original button. */
    transition: filter 0.3s ease, opacity 0.25s ease; /* Fade gently when the carousel opens. */
  }
  .mode-menu.menu-open .mode-menu__toggler-circle{
    filter: drop-shadow(0 10px 18px rgba(0, 0, 0, 0.5)); /* Adjust lighting while pressed. */
  }
  .mode-menu__toggler-inner{
    fill: rgba(28, 34, 48, 0.85); /* Slightly darker inner disk. */
    stroke: rgba(255, 255, 255, 0.08); /* Soft rim highlight. */
    stroke-width: 0.5px; /* Minimal thickness. */
    transition: opacity 0.25s ease; /* Fade gently while carousel is open. */
  }
  .mode-menu__toggler-gloss{
    fill: rgba(255, 255, 255, 0.18); /* Hint of reflective sheen. */
    transition: opacity 0.25s ease; /* Fade gently while carousel is open. */
  }
  .mode-menu__toggler-icon{
    pointer-events: none; /* Icon should not intercept clicks. */
    transition: opacity 0.25s ease; /* Fade gently while carousel is open. */
  }
  .mode-menu.menu-open .mode-menu__toggler-circle,
  .mode-menu.menu-open .mode-menu__toggler-inner,
  .mode-menu.menu-open .mode-menu__toggler-gloss,
  .mode-menu.menu-open .mode-menu__toggler-icon{
    opacity: 0; /* Hide the physical button while the carousel overlay is visible. */
  }
  .mode-menu.menu-open.mode-menu--overlay .mode-menu__toggler-body{
    opacity: 0; /* Hide the HTML toggle skin when the carousel overlay is active. */
  }
  .mode-menu__toggler-bar{
    fill: rgba(18, 24, 38, 0.85); /* Dark accent for hamburger lines. */
    transition: transform 0.3s ease, opacity 0.3s ease; /* Animate between hamburger and close states. */
    transform-box: fill-box; /* Rotate around its center. */
    transform-origin: center; /* Keep rotation centered. */
  }
  .mode-menu.menu-open .mode-menu__toggler-bar--top{
    transform: translateY(var(--bar-shift, 0px)) rotate(45deg); /* Form the "X" shape. */
  }
  .mode-menu.menu-open .mode-menu__toggler-bar--middle{
    opacity: 0; /* Hide middle bar while open. */
  }
  .mode-menu.menu-open .mode-menu__toggler-bar--bottom{
    transform: translateY(var(--bar-shift, 0px)) rotate(-45deg); /* Mirror rotation for lower bar. */
  }
  .mode-menu__items{
    pointer-events: none; /* Disabled until menu opens. */
  }
  .menu-item{
    transform-box: fill-box; /* Allow CSS transforms to respect the rendered bounds. */
    transform-origin: center; /* Keep radial transforms centered. */
  }
  .menu-item__foreign{
    overflow: visible; /* Permit shadows to render fully. */
    pointer-events: none; /* Delegate pointer events to the inner button. */
  }
  .menu-item__wrapper{
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none; /* Prevent the wrapper from intercepting events before the button. */
  }
  .menu-item__wrapper > .menu-item__button{
    pointer-events: auto; /* The button itself handles user interaction. */
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
  /* Mode carousel glass UI */
  .mode-carousel{
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    visibility: hidden;
    z-index: 34;
    opacity: 0;
    transform: translateY(8%) scale(0.95);
    transition: opacity 0.3s ease, transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .mode-carousel--open{
    opacity: 1;
    pointer-events: auto;
    visibility: visible;
    transform: translateY(0) scale(1);
  }
  .mode-carousel__blur{
    position: absolute;
    left: 50%;
    top: 50%;
    width: 0;
    height: 0;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    clip-path: circle(50% at 50% 50%);
    pointer-events: none;
    z-index: 31;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    background: rgba(9, 13, 22, 0.22);
    opacity: 0;
    transition: opacity 0.3s ease;
    overflow: hidden;
  }
  .mode-carousel__blur--visible{
    opacity: 1;
  }
  .mode-carousel__surface{
    position: absolute;
    transform: translate(-50%, -50%);
    transform-origin: center;
    border-radius: 24px;
    background: linear-gradient(165deg, rgba(255, 255, 255, 0.28), rgba(120, 141, 168, 0.12));
    box-shadow: 0 24px 38px rgba(9, 13, 22, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.35);
    border: 1px solid rgba(255, 255, 255, 0.26);
    backdrop-filter: blur(18px) saturate(140%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: min(5%, 18px) min(4%, 16px);
    overflow: hidden;
  }
  .mode-carousel__surface::after{
    content: '';
    position: absolute;
    inset: 6% 8%;
    border-radius: 18px;
    border: 1px solid rgba(255, 255, 255, 0.18);
    pointer-events: none;
  }
  .mode-carousel__track{
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: clamp(12px, 6%, 24px);
    touch-action: pan-y;
  }
  .mode-carousel__item{
    position: relative;
    flex: 0 0 auto;
    min-width: clamp(70px, 24%, 120px);
    aspect-ratio: 0.68 / 1;
    padding: clamp(0.5rem, 1.4vw, 0.9rem) clamp(0.45rem, 1.2vw, 0.8rem) clamp(0.85rem, 2.2vw, 1.45rem);
    border-radius: 22px;
    border: 1px solid rgba(255, 255, 255, 0.32);
    background: linear-gradient(182deg, rgba(255, 255, 255, 0.42), rgba(148, 168, 191, 0.16) 55%, rgba(95, 113, 136, 0.08) 100%);
    box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.35);
    color: rgba(235, 242, 255, 0.88);
    text-transform: capitalize;
    letter-spacing: 0.02em;
    font-weight: 600;
    font-size: clamp(0.62rem, 1.4vw, 0.82rem);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    gap: clamp(0.2rem, 0.6vw, 0.45rem);
    cursor: pointer;
    opacity: 0.12;
    transform: scale(0.35);
    transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s ease, filter 0.3s ease, border-color 0.3s ease;
    backdrop-filter: blur(24px);
  }
  .mode-carousel__item:focus-visible{
    outline: 2px solid rgba(255, 255, 255, 0.75);
    outline-offset: 4px;
  }
  .mode-carousel__item--active{
    opacity: 1;
    transform: scale(1);
    border-color: rgba(255, 255, 255, 0.68);
    box-shadow: 0 18px 28px rgba(9, 13, 22, 0.45), inset 0 2px 4px rgba(255, 255, 255, 0.45);
  }
  .mode-carousel__item--prev,
  .mode-carousel__item--next{
    opacity: 0.3;
    transform: scale(0.5);
  }
  .mode-carousel__item--away{
    opacity: 0;
    transform: scale(0.35);
    pointer-events: none;
  }
  .mode-carousel__icon{
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
  }
  .mode-carousel__icon ha-icon{
    width: clamp(22px, 2.8vw, 30px);
    height: clamp(22px, 2.8vw, 30px);
    filter: drop-shadow(0 6px 10px rgba(9, 13, 22, 0.5));
  }
  .mode-carousel__label{
    display: block;
    white-space: nowrap;
  }
  .mode-carousel__reflection{
    position: absolute;
    left: 50%;
    bottom: -32%;
    width: 72%;
    height: 46%;
    transform: translateX(-50%) scaleY(-1);
    background: radial-gradient(ellipse at center, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.08) 55%, rgba(255, 255, 255, 0) 75%);
    filter: blur(6px);
    opacity: 0.25;
    pointer-events: none;
  }
  .mode-carousel__item--active .mode-carousel__reflection{
    opacity: 0.38;
  }
  .mode-carousel__item--prev .mode-carousel__reflection,
  .mode-carousel__item--next .mode-carousel__reflection{
    opacity: 0.3;
  }
  .dial--blurred{
    transform: scale(0.98); /* Documented property purpose for clarity. */
    transform-origin: 50% 50%; /* Define the pivot point for transforms so rotations look natural. */
    transform-box: fill-box; /* Documented property purpose for clarity. */
    transition: transform 0.35s ease; /* Animate property changes smoothly for a polished feel. */
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

    stroke: none; /* Prevent any focus/press outline from appearing. */

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

  /* Always render face gradient regardless of hvac state */
  .dial--state--heat .dial__shape,
  .dial--state--cool .dial__shape,
  .dial--state--auto .dial__shape,
  .dial--state--heat_cool .dial__shape,
  .dial--state--fan_only .dial__shape,
  .dial--state--dry .dial__shape,
  .dial--state--idle .dial__shape,
  .dial--state--unknown .dial__shape {
    fill: var(--thermostat-off-fill) !important;
  }

  /* Weather FX */
  @keyframes rain-drop {
    0%   { transform: translateY(-24%); opacity: 0.05; }
    50%  { opacity: 0.35; }
    100% { transform: translateY(24%); opacity: 0.05; }
  }
  @keyframes lightning-flicker {
    0%, 96%, 100% { opacity: 0; }
    97% { opacity: 1; }
    98% { opacity: 0.2; }
    99% { opacity: 1; }
  }
  .weather__rain .rain-drop{
    stroke: rgba(255,255,255,0.35);
    stroke-width: 1.2px;
    stroke-linecap: round;
    filter: blur(0.3px);
    opacity: 0.25;
    animation: rain-drop 1.9s linear infinite;
  }
  .weather__lightning .lightning-bolt{
    fill: none;
    stroke: rgba(255,255,255,0.9);
    stroke-width: 2.4px;
    filter: drop-shadow(0 0 8px rgba(255,255,255,0.9)) blur(0.5px);
    animation: lightning-flicker 3.7s steps(1,end) infinite;
  }

  `

  return css; /* Provide the assembled stylesheet to callers. */

  }
