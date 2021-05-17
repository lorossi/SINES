class Sketch extends Engine {
  preload() {
    this._border = 0.26;
    this._scl = 1;
    this._duration = 900;
    this._lines_num = 10;
    this._intro_ratio = 0.05;
    this._lines_width = 2;
    this._recording = false;

    this._line_colors = [new Color(192, 0, 192), new Color(0, 192, 240), new Color(230, 230, 230)];
    this._dpos = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 0 }];
  }

  setup() {
    // size calculations
    this._border_width = (this._border * this.width) / 2;
    this._inner_width = this.width * (1 - this._border);
    this._max_ampl = this._inner_width / 2;
    // setup capturer
    this._capturer_started = false;
    if (this._recording) {
      this._capturer = new CCapture({ format: "png" });
    }
  }

  draw() {
    // start capturer
    if (!this._capturer_started && this._recording) {
      this._capturer_started = true;
      this._capturer.start();
      console.log("%c Recording started", "color: green; font-size: 2rem");
    }

    const percent = (this.frameCount % this._duration) / this._duration;
    // phase 0, 2: line expanding/retracting
    // phse 1: actual sines
    let phase;
    if (percent <= this._intro_ratio) phase = 0;
    else if (percent >= 1 - this._intro_ratio) phase = 2;
    else phase = 1;

    // first compute all coordinates
    let lines = [];
    if (phase == 0) {
      const phase_percent = easeOut(percent / this._intro_ratio);
      lines.push([]);

      for (let x = 0; x < (this._inner_width * phase_percent) / 2; x += this._scl) {
        lines[0].push({ x: Math.floor(this.width / 2 + x), y: Math.floor(0) });
        lines[0].push({ x: Math.floor(this.width / 2 - x), y: Math.floor(0) });
      }
    } else if (phase == 2) {
      const phase_percent = easeIn((percent - 1 + this._intro_ratio) / this._intro_ratio);
      lines.push([]);

      for (let x = 0; x < (this._inner_width * (1 - phase_percent)) / 2; x += this._scl) {
        lines[0].push({ x: Math.floor(this.width / 2 + x), y: Math.floor(0) });
        lines[0].push({ x: Math.floor(this.width / 2 - x), y: Math.floor(0) });
      }
    } else if (phase == 1) {
      // percent relative to this tage
      const phase_percent = (percent - this._intro_ratio) / (1 - 2 * this._intro_ratio);
      // eased percent
      const t = easeOut(phase_percent);
      // moves the inner sines
      const time_phi = -phase_percent * Math.PI * 20;
      // envelope omega
      const omega_1 = 1;
      // inner sines omega
      const omega_2 = Math.sin(t * Math.PI) * 3;

      for (let i = 0; i < this._lines_num; i++) {
        lines.push([]);
      }

      for (let x = 0; x < this.width; x += this._scl) {
        // x relative to width
        const width_percent = (x - this._border_width) / this._inner_width;
        let dy;
        for (let i = 0; i < this._lines_num; i++) {
          if (x > this._border_width && x < this.width - this._border_width) {
            // omega variation, increases with the line
            const d_omega = (i / this._lines_num) + 1;
            // amplification changes over time
            const ampl = this._max_ampl * Math.sin(t * Math.PI);
            dy =
              Math.sin(width_percent * omega_1 * Math.PI) *
              Math.sin(width_percent * (omega_2 * d_omega) * Math.PI + time_phi) *
              ampl;
          }

          lines[i].push({ x: Math.floor(x), y: Math.floor(dy) });
        }
      }
    }

    // now draw all
    this.ctx.save();
    // clear background
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.fillStyle = "rgb(15, 15, 15)";
    this.ctx.fillRect(0, 0, this.width, this.height);
    // all coords are relative to y = height/2
    this.ctx.translate(0, this.height / 2);
    this.ctx.lineWidth = this._lines_width;

    for (let i = 0; i < lines.length; i++) {
      const alpha = easeOut(1 - i / lines.length);

      for (let j = 0; j < this._line_colors.length; j++) {
        this.ctx.save();
        this.ctx.translate(this._dpos[j].x, this._dpos[j].y);

        let current_color = this._line_colors[j];
        if (j < this._line_colors[j] - 1) current_color.alpha = alpha / 4;
        else current_color.alpha = alpha;

        this.ctx.strokeStyle = current_color.rgba;

        this.ctx.beginPath();
        for (let j = 0; j < lines[i].length; j++) {
          if (j == 0) this.ctx.moveTo(lines[i][j].x, lines[i][j].y);
          else this.ctx.lineTo(lines[i][j].x, lines[i][j].y);
        }
        this.ctx.stroke();
        this.ctx.restore();
      }
    }
    this.ctx.restore();

    // handle recording
    if (this._recording) {
      if (this.frameCount <= this._duration) {
        this._capturer.capture(this._canvas);
      } else {
        this._recording = false;
        this._capturer.stop();
        this._capturer.save();
        console.log("%c Recording ended", "color: red; font-size: 2rem");
      }
    }

  }
}

const ease = x => -(Math.cos(Math.PI * x) - 1) / 2;
const easeIn = x => 1 - Math.cos((x * Math.PI) / 2);
const easeOut = x => Math.sin((x * Math.PI) / 2);