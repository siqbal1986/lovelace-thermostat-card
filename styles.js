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

  .dial__metal-ring {

    fill: var(--dial-metal-ring-fill, radial-gradient(circle at 38% 34%, #fefefe 0%, #e7eaef 32%, #cdd1d8 55%, #a3a8b0 72%, #6c737b 88%, #464b52 100%)); /* Reapply the brushed metal base using the generated gradient or a close CSS fallback. */

    stroke: var(--dial-metal-ring-stroke, rgba(243, 244, 247, 0.68)); /* Use the dynamic sheen gradient when available so the edge glints correctly. */

    stroke-width: 1.4; /* Match the SVG stroke width set when constructing the path. */

    filter: var(--dial-metal-ring-filter, drop-shadow(0 3px 5px rgba(0, 0, 0, 0.35)) drop-shadow(0 -1px 1px rgba(255, 255, 255, 0.45))); /* Restore the layered lighting that makes the ring look recessed. */

    transition: filter 0.35s ease, fill 0.45s ease, stroke 0.45s ease; /* Smooth the response when the ring gains active emphasis. */

  }

  .dial.in_control .dial__metal-ring {

    filter: var(--dial-metal-ring-filter-active, drop-shadow(0 4px 8px rgba(0, 0, 0, 0.45)) drop-shadow(0 -1px 1.5px rgba(255, 255, 255, 0.55))); /* Intensify the glow while the dial is actively being adjusted. */

  }

  .dial__metal-ring-sheen {

    fill: var(--dial-metal-ring-stroke, linear-gradient(to bottom, rgba(255, 255, 255, 0.85) 0%, rgba(243, 244, 247, 0.4) 35%, rgba(182, 187, 195, 0.15) 65%, rgba(107, 112, 120, 0.55) 100%)); /* Overlay the reflective sheen using the same gradient fallback for consistency. */

    mix-blend-mode: screen; /* Allow the sheen to brighten the metal subtly instead of obscuring it. */

    opacity: 0.85; /* Keep the highlight soft so it reads as polished metal. */

    pointer-events: none; /* Ensure the sheen never blocks pointer interactions with the dial. */

  }

  .dial__metal-ring-shadow {

    fill: linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.25) 55%, rgba(0, 0, 0, 0.55) 100%); /* Reinstate the lower shadow that sells the metal depth. */

    mix-blend-mode: multiply; /* Let the shadow darken the existing tones rather than covering them. */

    opacity: 0.75; /* Balance the shadow strength so the bevel stays readable. */

    pointer-events: none; /* Prevent the shadow overlay from catching pointer events. */

  }

  .dial__ring-grip {

    fill: linear-gradient(to bottom, rgba(255, 255, 255, 0.18) 0%, rgba(120, 125, 134, 0.22) 50%, rgba(36, 38, 45, 0.18) 100%); /* Give each etched grip a subtle metallic gradient without overpowering the ring. */

    stroke: rgba(0, 0, 0, 0.22); /* Add a faint outline so the grooves remain crisp. */

    stroke-width: 0.25; /* Keep the outline delicate to avoid banding. */

    vector-effect: non-scaling-stroke; /* Maintain a consistent grip edge when the dial scales. */

    mix-blend-mode: soft-light; /* Blend the grips with the underlying ring to avoid harsh dark patches. */

    pointer-events: none; /* Prevent the grips from blocking drag gestures or darkening on hover. */

  }

  .dial__editableIndicator {

    fill: radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.28) 0%, rgba(255, 255, 255, 0.08) 70%, rgba(255, 255, 255, 0) 100%); /* Light halo that appears when the dial enters edit mode. */

    stroke: rgba(255, 255, 255, 0.38); /* Faint rim to separate the halo from the ring surface. */

    stroke-width: 0.6; /* Light stroke matching the thin highlight geometry. */

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

  .climate_info {

    position: absolute; /* Float the mode indicator above the dial. */

    top: 82%; /* Position the badge near the lower portion of the dial. */

    left: 50%; /* Centre horizontally relative to the dial. */

    transform: translate(-50%, -50%); /* Offset the badge so its centre aligns with the dial centre. */

    width: 16%; /* Size the mode widget proportionally to the dial. */

    aspect-ratio: 1; /* Force the badge to remain circular. */

    border-radius: 50%; /* Round every corner for a smooth circle. */

    display: flex; /* Use flex layout to centre inner elements. */

    align-items: center; /* Vertically centre the HVAC icon. */

    justify-content: center; /* Horizontally centre the HVAC icon. */

    background: radial-gradient(155% 115% at 35% 25%, rgba(255, 255, 255, 0.28), rgba(22, 27, 35, 1) 58%, rgba(5, 7, 10, 1) 100%); /* Metallic-looking knob texture behind the HVAC mode icon. */

    box-shadow: 0 14px 22px rgba(0, 0, 0, 0.55), inset 0 6px 12px rgba(255, 255, 255, 0.16), inset 0 -6px 18px rgba(0, 0, 0, 0.65); /* Outer and inner shadows to create depth. */

    overflow: hidden; /* Clip internal layers to the badge outline. */

  }

  .climate_info::before {

    content: ""; /* Create a pseudo-element purely for decoration. */

    position: absolute; /* Stack directly on top of the main badge. */

    inset: 10%; /* Reduce the circle slightly for a layered effect. */

    border-radius: 50%; /* Maintain a circular highlight. */

    background: radial-gradient(circle at 35% 25%, rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0.07) 60%, transparent 100%); /* Apply gradient shading to reinforce depth. */

    opacity: 0.75; /* Keep the sheen translucent. */

    pointer-events: none; /* Ensure the highlight does not block clicks. */

  }

  .climate_info__bezel {

    position: absolute; /* Place the bezel directly above the coloured core. */

    inset: 4%; /* Pull the bezel slightly inward to reveal the outer rim. */

    border-radius: 50%; /* Keep the bezel circular. */

    background: linear-gradient(135deg, rgba(255, 255, 255, 0.28), rgba(67, 74, 84, 0.9)); /* Gradient simulating light catching the bezel. */

    box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.35), inset 0 -3px 6px rgba(0, 0, 0, 0.45); /* Add highlights and shadows for depth. */

    opacity: 0.6; /* Allow the bezel to blend with layers beneath. */

    pointer-events: none; /* Ensure the bezel does not capture pointer input. */

  }

  .mode_color {

    position: absolute; /* Anchor the coloured disc relative to the badge. */

    inset: 18%; /* Leave a margin to reveal the metallic rim. */

    border-radius: 50%; /* Keep the colour plate circular. */

    display: flex; /* Centre any text placed on the colour plate. */

    align-items: center; /* Vertically align content. */

    justify-content: center; /* Horizontally align content. */

    background: radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.4), rgba(92, 104, 120, 0.15) 55%, rgba(0, 0, 0, 0.45) 100%); /* Subtle shading to mimic a metallic insert. */

    pointer-events: none; /* Purely decorative; should not block input. */

  }

  .mode_color span {

    display: block; /* Expand to fill the coloured disk area. */

    width: 100%; /* Match the width of the parent disk. */

    height: 100%; /* Match the height of the parent disk. */

    border-radius: 50%; /* Ensure the glow stays circular. */

    background: radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.08)); /* Bright centre highlight for the mode disk. */

    opacity: 0.18; /* Keep the overlay subtle so the mode colour shows through. */

  }

  .modes {

    position: relative; /* Establish the positioning context for layered elements. */

    width: 58%; /* Control the component's width for consistent sizing. */

    height: 58%; /* Control the component's height so proportions stay balanced. */

    display: flex; /* Choose a layout model that supports the intended alignment. */

    align-items: center; /* Vertically align child content within the flex container. */

    justify-content: center; /* Horizontally align child content within the flex container. */

  }

  .modes__glow {

    position: absolute; /* Establish the positioning context for layered elements. */

    inset: -6%; /* Offset the absolutely positioned layer from each edge. */

    border-radius: 50%; /* Round the corners for a softer, circular appearance. */

    background: radial-gradient(circle, rgba(180, 210, 255, 0.45), transparent 62%); /* Apply gradient shading to reinforce depth. */

    filter: blur(6px); /* Apply visual effects such as blur or drop shadows for depth cues. */

    opacity: 0.55; /* Adjust transparency to blend the layer into the dial. */

    pointer-events: none; /* Allow or block pointer interaction as appropriate for the layer. */

  }

  .mode-indicator {

    color: var(--mode_color); /* Set the text or icon colour to match the current mode. */

    --mdc-icon-size: 100%; /* Scale the Material Design icon to fill its container. */

    filter: drop-shadow(0 1px 4px rgba(0, 0, 0, 0.6)); /* Apply visual effects such as blur or drop shadows for depth cues. */

    transition: transform 0.3s ease, filter 0.3s ease, color 0.3s ease; /* Animate property changes smoothly for a polished feel. */

    transform-origin: 50% 50%; /* Define the pivot point for transforms so rotations look natural. */

  }

  .climate_info--heat .modes__glow {

    background: radial-gradient(circle, rgba(255, 142, 84, 0.55), transparent 62%); /* Apply gradient shading to reinforce depth. */

  }

  .climate_info--cool .modes__glow,

  .climate_info--fan_only .modes__glow {

    background: radial-gradient(circle, rgba(124, 198, 255, 0.5), transparent 62%); /* Apply gradient shading to reinforce depth. */

  }

  .climate_info--heat_cool .modes__glow {

    background: radial-gradient(circle, rgba(110, 198, 255, 0.5), transparent 35%, rgba(255, 146, 86, 0.48) 82%, transparent 100%); /* Apply gradient shading to reinforce depth. */

  }

  .climate_info--dry .modes__glow {

    background: radial-gradient(circle, rgba(240, 180, 41, 0.45), transparent 62%); /* Apply gradient shading to reinforce depth. */

  }

  .climate_info--heat .mode-indicator {

    color: #ff8a50; /* Set the text or icon colour to match the current mode. */

    animation: thermostat-flame 1.8s ease-in-out infinite; /* Documented property purpose for clarity. */

  }

  .climate_info--cool .mode-indicator {

    color: #6ac8ff; /* Set the text or icon colour to match the current mode. */

    animation: thermostat-ice-spin 3s linear infinite; /* Documented property purpose for clarity. */

  }

  .climate_info--heat_cool .mode-indicator {

    color: #8acbff; /* Set the text or icon colour to match the current mode. */

    animation: thermostat-dual 2.4s ease-in-out infinite; /* Documented property purpose for clarity. */

  }

  .climate_info--heat .mode_color span {

    opacity: 0.28; /* Adjust transparency to blend the layer into the dial. */

  }

  .climate_info--cool .mode_color span {

    opacity: 0.24; /* Adjust transparency to blend the layer into the dial. */

  }

  .climate_info--heat_cool .mode_color span {

    opacity: 0.26; /* Adjust transparency to blend the layer into the dial. */

  }

  }

  .mode-carousel{
    position: absolute; /* Establish the positioning context for layered elements. */
    inset: 0; /* Offset the absolutely positioned layer from each edge. */
    display: flex; /* Choose a layout model that supports the intended alignment. */
    align-items: center; /* Vertically align child content within the flex container. */
    justify-content: center; /* Horizontally align child content within the flex container. */
    pointer-events: auto; /* Allow or block pointer interaction as appropriate for the layer. */
    transition: opacity 0.3s ease; /* Animate property changes smoothly for a polished feel. */
    opacity: 1; /* Adjust transparency to blend the layer into the dial. */
    z-index: 40; /* Documented property purpose for clarity. */
  }
  .mode-carousel.hide{
    opacity: 0; /* Adjust transparency to blend the layer into the dial. */
    pointer-events: none; /* Allow or block pointer interaction as appropriate for the layer. */
  }
  .mode-carousel__track{
    position: relative; /* Establish the positioning context for layered elements. */
    display: flex; /* Choose a layout model that supports the intended alignment. */
    align-items: center; /* Vertically align child content within the flex container. */
    justify-content: center; /* Horizontally align child content within the flex container. */
    gap: 28px; /* Space out child items evenly. */
    width: 78%; /* Control the component's width for consistent sizing. */
    max-width: 560px; /* Prevent the element from growing too wide on large layouts. */
    perspective: 1400px; /* Provide depth to 3D transformed children. */
    pointer-events: auto; /* Allow or block pointer interaction as appropriate for the layer. */
    touch-action: pan-y; /* Limit touch gestures to avoid interfering with drag interactions. */
    cursor: grab; /* Indicate the pointer feedback expected for this element. */
  }
  .mode-carousel__track:active{
    cursor: grabbing; /* Indicate the pointer feedback expected for this element. */
  }
  .mode-carousel__halo{
    position: absolute; /* Establish the positioning context for layered elements. */
    width: 36%; /* Control the component's width for consistent sizing. */
    aspect-ratio: 1; /* Maintain a consistent proportional shape. */
    border-radius: 50%; /* Round the corners for a softer, circular appearance. */
    border: 1px solid rgba(255, 255, 255, 0.18); /* Outline the element to reinforce its shape. */
    box-shadow: inset 0 0 25px rgba(120, 160, 255, 0.35); /* Add highlights and shadows to create dimensionality. */
    opacity: 0.4; /* Adjust transparency to blend the layer into the dial. */
    pointer-events: none; /* Allow or block pointer interaction as appropriate for the layer. */
    transition: opacity 0.25s ease; /* Animate property changes smoothly for a polished feel. */
  }
  .mode-carousel__halo.mode-carousel__halo--hidden{
    opacity: 0; /* Adjust transparency to blend the layer into the dial. */
  }
  .mode-carousel__item{
    display: flex; /* Choose a layout model that supports the intended alignment. */
    flex-direction: column; /* Documented property purpose for clarity. */
    align-items: center; /* Vertically align child content within the flex container. */
    justify-content: center; /* Horizontally align child content within the flex container. */
    gap: 10px; /* Space out child items evenly. */
    min-width: 88px; /* Documented property purpose for clarity. */
    min-height: 120px; /* Documented property purpose for clarity. */
    padding: 14px 20px 18px; /* Documented property purpose for clarity. */
    border-radius: 36px; /* Round the corners for a softer, circular appearance. */
    border: none; /* Outline the element to reinforce its shape. */
    background: linear-gradient(155deg, rgba(54, 62, 78, 0.96), rgba(20, 24, 32, 0.88)); /* Apply gradient shading to reinforce depth. */
    box-shadow: 0 20px 32px rgba(0, 0, 0, 0.6), inset 0 3px 5px rgba(255, 255, 255, 0.15), inset 0 -8px 16px rgba(0, 0, 0, 0.65); /* Add highlights and shadows to create dimensionality. */
    color: rgba(224, 232, 252, 0.75); /* Set the text or icon colour to match the current mode. */
    text-transform: uppercase; /* Control casing for the label text. */
    letter-spacing: 0.12em; /* Adjust spacing between characters for style. */
    font-size: 11px; /* Size the text appropriately for readability. */
    line-height: 1.4; /* Set the line height to keep text legible. */
    transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease, opacity 0.2s ease; /* Animate property changes smoothly for a polished feel. */
    cursor: pointer; /* Indicate the pointer feedback expected for this element. */
    pointer-events: auto; /* Allow or block pointer interaction as appropriate for the layer. */
    -webkit-appearance: none; /* Remove native button styling in WebKit browsers. */
    appearance: none; /* Reset default form-control styling across browsers. */
    background-clip: padding-box; /* Confine background painting to the padding box for crisp edges. */
  }
  .mode-carousel__item--focus{
    box-shadow: 0 24px 38px rgba(0, 0, 0, 0.65), inset 0 4px 6px rgba(255, 255, 255, 0.22), inset 0 -9px 18px rgba(0, 0, 0, 0.65); /* Add highlights and shadows to create dimensionality. */
  }
  .mode-carousel__item--active{
    color: rgba(255, 255, 255, 0.95); /* Set the text or icon colour to match the current mode. */
    box-shadow: 0 26px 40px rgba(0, 0, 0, 0.68), inset 0 4px 6px rgba(255, 255, 255, 0.24), inset 0 -9px 18px rgba(255, 146, 88, 0.55); /* Add highlights and shadows to create dimensionality. */
  }
  .mode-carousel__item--deep{
    filter: saturate(0.8); /* Soften colours when the item sits deeper in the carousel. */
  }
  .mode-carousel__item.pending{
    filter: saturate(1.25); /* Intensify colours when the item is pending interaction. */
  }
  .mode-carousel.pending .mode-carousel__item:not(.pending){
    opacity: 0.45; /* Adjust transparency to blend the layer into the dial. */
    filter: saturate(0.65); /* Desaturate unfocused options while showing a pending state. */
    pointer-events: none; /* Allow or block pointer interaction as appropriate for the layer. */
  }
  .mode-carousel__icon{
    display: flex; /* Choose a layout model that supports the intended alignment. */
    align-items: center; /* Vertically align child content within the flex container. */
    justify-content: center; /* Horizontally align child content within the flex container. */
    width: 56px; /* Control the component's width for consistent sizing. */
    height: 56px; /* Control the component's height so proportions stay balanced. */
    border-radius: 50%; /* Round the corners for a softer, circular appearance. */
    background: radial-gradient(circle at 40% 30%, rgba(255, 255, 255, 0.55), rgba(82, 92, 112, 0.25) 55%, rgba(8, 10, 14, 0.88) 100%); /* Apply gradient shading to reinforce depth. */
    box-shadow: inset 0 3px 4px rgba(255, 255, 255, 0.2), inset 0 -4px 8px rgba(0, 0, 0, 0.55), 0 8px 16px rgba(0, 0, 0, 0.6); /* Add highlights and shadows to create dimensionality. */
  }
  .mode-carousel__icon ha-icon{
    color: var(--mode_color); /* Set the text or icon colour to match the current mode. */
    --mdc-icon-size: 32px; /* Scale the Material Design icon to fill its container. */
    filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.65)); /* Apply visual effects such as blur or drop shadows for depth cues. */
    transition: filter 0.25s ease, color 0.25s ease; /* Animate property changes smoothly for a polished feel. */
  }
  .mode-carousel__item--active .mode-carousel__icon ha-icon{
    filter: drop-shadow(0 5px 10px rgba(255, 156, 98, 0.8)); /* Apply visual effects such as blur or drop shadows for depth cues. */
  }
  .mode-carousel__label{
    color: rgba(224, 232, 252, 0.64); /* Set the text or icon colour to match the current mode. */
    transition: color 0.25s ease; /* Animate property changes smoothly for a polished feel. */
  }
  .mode-carousel__item--active .mode-carousel__label{
    color: rgba(255, 255, 255, 0.92); /* Set the text or icon colour to match the current mode. */
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

  

