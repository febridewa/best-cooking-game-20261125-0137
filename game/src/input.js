// Keyboard and mouse input: WASD or arrows to walk, E or Space to use the
// station in front of the chef, click a station to walk there and use it,
// P to pause, M to mute, Enter to start, R to restart after a shift ends.
// The game reads the canvas's own coordinates, so it works at any window size.

export function createInput(canvas) {
  const keys = new Set();
  const pressed = new Set();
  let click = null;
  let clickHandled = true;

  function keyName(event) {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    return key;
  }

  function onKeyDown(event) {
    const key = keyName(event);
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();
    if (!event.repeat) pressed.add(key);
    keys.add(key);
  }

  function onKeyUp(event) {
    keys.delete(keyName(event));
  }

  function onClick(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    click = {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
    clickHandled = false;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('click', onClick);

  return {
    /** Movement vector from the held keys, normalised. */
    moveVector() {
      let x = 0;
      let y = 0;
      if (keys.has('a') || keys.has('arrowleft')) x -= 1;
      if (keys.has('d') || keys.has('arrowright')) x += 1;
      if (keys.has('w') || keys.has('arrowup')) y -= 1;
      if (keys.has('s') || keys.has('arrowdown')) y += 1;
      if (x !== 0 && y !== 0) {
        const len = Math.hypot(x, y);
        x /= len;
        y /= len;
      }
      return { x, y };
    },

    /** True once per physical press of any of the given keys. */
    wasPressed(...names) {
      for (const name of names) if (pressed.has(name)) return true;
      return false;
    },

    /** The latest unhandled click in canvas coordinates, or null. */
    takeClick() {
      if (click === null || clickHandled) return null;
      clickHandled = true;
      return click;
    },

    /** Clear one-frame presses; call once per frame after the world steps. */
    endFrame() {
      pressed.clear();
    },
  };
}
