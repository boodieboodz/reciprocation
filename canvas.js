window.addEventListener('load', () => {
  const canvas = document.querySelector("#canvas");
  const ctx = canvas.getContext("2d");

  canvas.height = window.innerHeight; 
  canvas.width = window.innerWidth;

  let painting = false;
  let penLifts = 0;
  let strokes = [];
  let lastTime = null;

  const totalTasks = 3;
  let currentTask = 0;
  const userData = { drawings: [] };

  function startPosition(e) {
    painting = true;
    lastTime = Date.now();

    strokes.push({
      points: [],
      duration: 0,
      avgSpeed: 0
    });

    draw(e);
  }

  function endPosition() {
    if (painting) {
      painting = false;
      penLifts++;

      const s = strokes[strokes.length - 1];
      if (s.points.length > 1) {
        s.duration = s.points[s.points.length - 1].tTotal;

        const speeds = [];
        for (let i = 1; i < s.points.length; i++) {
          const dx = s.points[i].x - s.points[i-1].x;
          const dy = s.points[i].y - s.points[i-1].y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          const dt = s.points[i].dt;
          if (dt > 0) speeds.push(dist / dt);
        }
        s.avgSpeed = speeds.reduce((a,b) => a+b, 0) / speeds.length;
      }

      ctx.beginPath();
    }
  }

  function draw(e) {
    if (!painting) return;

    const x = e.clientX;
    const y = e.clientY;
    const pressure = e.pressure || 0;
    const now = Date.now();

    const dt = now - lastTime;
    const tTotal = strokes[strokes.length - 1].points.length > 0
      ? strokes[strokes.length - 1].points[strokes[strokes.length - 1].points.length - 1].tTotal + dt
      : 0;

    strokes[strokes.length - 1].points.push({
      x,
      y,
      pressure,
      dt,
      tTotal
    });

    lastTime = now;

    ctx.lineWidth = (pressure || 0.5) * 20;
    ctx.lineCap = "round";
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  // pointer events
  canvas.addEventListener("pointerdown", startPosition);
  canvas.addEventListener("pointerup", endPosition);
  canvas.addEventListener("pointermove", draw);

  // touch support for iPad
  canvas.addEventListener("touchstart", e => e.preventDefault(), { passive: false });
  canvas.addEventListener("touchmove", e => e.preventDefault(), { passive: false });

  window.getStrokeData = () => ({ strokes, penLifts });

  // Next / Submit buttons
  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Next";
  document.body.appendChild(nextBtn);

  const taskCounter = document.createElement("p");
  taskCounter.textContent = `Drawing Task ${currentTask + 1} of ${totalTasks}`;
  document.body.insertBefore(taskCounter, canvas);

  function saveCurrentDrawing() {
    const strokeData = getStrokeData();
    const pngData = canvas.toDataURL("image/png");

    userData.drawings.push({
      strokeData,
      png: pngData
    });

    // reset canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokes = [];
    penLifts = 0;
  }

  nextBtn.onclick = () => {
    saveCurrentDrawing();
    currentTask++;

    if (currentTask < totalTasks - 1) {
      // Task 1 or 2 → Next
      taskCounter.textContent = `Drawing Task ${currentTask + 1} of ${totalTasks}`;
    } else if (currentTask === totalTasks - 1) {
      // Task 3 → show Submit instead of Next
      nextBtn.style.display = "none";
      taskCounter.textContent = `Drawing Task ${currentTask + 1} of ${totalTasks}`;

      const submitBtn = document.createElement("button");
      submitBtn.textContent = "Submit";
      document.body.appendChild(submitBtn);

      submitBtn.onclick = () => {
        // Process userData.drawings for SVM/CNN later
        console.log(userData.drawings);
        alert("All drawings submitted!");
      };
    }
  };
});
