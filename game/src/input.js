// Keyboard + mouse input: WASD/arrows to walk, E/Space/click to interact,
// P pause, R restart, M mute. Exposes a fresh "pressed" edge each frame.
export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.pressed = new Set();
    this.mouse = { x: 0, y: 0, clicked: false, down: false };
    this.onKey = null; // callback for single-key actions (pause/restart/mute)
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
      if (!e.repeat) {
        this.pressed.add(e.key.toLowerCase());
        if (this.onKey) this.onKey(e.key.toLowerCase());
      }
      this.keys.add(e.key.toLowerCase());
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => this.keys.clear());
    canvas.addEventListener('mousemove', (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouse.x = (e.clientX - r.left) * (canvas.width / r.width);
      this.mouse.y = (e.clientY - r.top) * (canvas.height / r.height);
    });
    canvas.addEventListener('mousedown', (e) => {
      this.mouse.down = true;
      this.mouse.clicked = true;
      const r = canvas.getBoundingClientRect();
      this.mouse.x = (e.clientX - r.left) * (canvas.width / r.width);
      this.mouse.y = (e.clientY - r.top) * (canvas.height / r.height);
    });
    window.addEventListener('mouseup', () => { this.mouse.down = false; });
  }

  axis() {
    let x = 0;
    let y = 0;
    if (this.keys.has('a') || this.keys.has('arrowleft')) x -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) x += 1;
    if (this.keys.has('w') || this.keys.has('arrowup')) y -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) y += 1;
    if (x && y) { x *= Math.SQRT1_2; y *= Math.SQRT1_2; }
    return { x, y };
  }

  interactPressed() {
    return this.pressed.has('e') || this.pressed.has(' ') || this.mouse.clicked;
  }

  endFrame() {
    this.pressed.clear();
    this.mouse.clicked = false;
  }
}
