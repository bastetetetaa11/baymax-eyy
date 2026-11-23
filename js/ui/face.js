/**
 * face.js
 * ------------------------------------------------------------------
 * Builds Baymax's face as pure SVG (no Disney images).
 * ------------------------------------------------------------------
 */

export function createFace(expression = 'idle') {
  const el = document.createElement('div');
  el.className = 'face';

  el.innerHTML = `
    <svg class="face-svg" viewBox="0 0 200 160" role="img" aria-label="Baymax face">
      <!-- Head -->
      <rect class="face-head" x="5" y="5" width="190" height="150" rx="95" ry="95" />
      
      <!-- Normal Eyes Wrapper -->
      <g class="eyes-normal-wrapper">
        <!-- Normal Eyes & Bridge (Inner group handles the blink) -->
        <g class="eyes-normal">
          <ellipse class="face-eye" cx="70" cy="76" rx="14" ry="16" />
          <ellipse class="face-eye" cx="130" cy="76" rx="14" ry="16" />
          <line class="face-bridge" x1="84" y1="76" x2="116" y2="76" />
        </g>
      </g>

      <!-- Happy Eyes Wrapper -->
      <g class="eyes-happy-wrapper">
        <g class="eyes-happy">
          <path class="face-eye-path" d="M 56 76 Q 70 58 84 76" fill="none" stroke="#1F2328" stroke-width="10" stroke-linecap="round"/>
          <path class="face-eye-path" d="M 116 76 Q 130 58 144 76" fill="none" stroke="#1F2328" stroke-width="10" stroke-linecap="round"/>
          <!-- Add the bridge here too so it shows up in happy mode! -->
          <line class="face-bridge" x1="84" y1="76" x2="116" y2="76" />
        </g>
      </g>
    </svg>
  `;

  el.setExpression = (expr) => {
    el.dataset.expression = expr || 'idle';
  };

  el.setExpression(expression);
  return el;
}