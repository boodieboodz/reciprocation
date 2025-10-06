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

  const taskPrompts = ["Draw a house", "Draw a sun", "Draw a boy"];

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

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
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

    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  canvas.addEventListener("pointerdown", startPosition);
  canvas.addEventListener("pointerup", endPosition);
  canvas.addEventListener("pointermove", draw);

  canvas.addEventListener("touchstart", e => e.preventDefault(), { passive: false });
  canvas.addEventListener("touchmove", e => e.preventDefault(), { passive: false });

  window.getStrokeData = () => ({ strokes, penLifts });

  const taskCounter = document.createElement("p");
  taskCounter.textContent = `Drawing Task ${currentTask + 1} of ${totalTasks} — ${taskPrompts[currentTask]}`;
  document.body.insertBefore(taskCounter, canvas);

  const buttonContainer = document.createElement("div");
  buttonContainer.style.position = "fixed";
  buttonContainer.style.top = "15px";
  buttonContainer.style.right = "15px";
  buttonContainer.style.display = "flex";
  buttonContainer.style.flexDirection = "row";
  buttonContainer.style.gap = "10px";
  document.body.appendChild(buttonContainer);

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Next";
  nextBtn.style.fontSize = "18px";
  nextBtn.style.padding = "10px 18px";
  nextBtn.style.borderRadius = "8px";
  nextBtn.style.cursor = "pointer";
  buttonContainer.appendChild(nextBtn);

  function saveCurrentDrawing() {
    const strokeData = getStrokeData();
    const pngData = canvas.toDataURL("image/png");

    userData.drawings.push({
      strokeData,
      png: pngData
    });

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokes = [];
    penLifts = 0;
  }

  nextBtn.onclick = () => {
    saveCurrentDrawing();
    currentTask++;

    if (currentTask < totalTasks - 1) {
      taskCounter.textContent = `Drawing Task ${currentTask + 1} of ${totalTasks} — ${taskPrompts[currentTask]}`;
    } else if (currentTask === totalTasks - 1) {
      nextBtn.style.display = "none";
      taskCounter.textContent = `Drawing Task ${currentTask + 1} of ${totalTasks} — ${taskPrompts[currentTask]}`;

      const submitBtn = document.createElement("button");
      submitBtn.textContent = "Submit";
      submitBtn.style.fontSize = "18px";
      submitBtn.style.padding = "10px 18px";
      submitBtn.style.borderRadius = "8px";
      submitBtn.style.cursor = "pointer";
      buttonContainer.appendChild(submitBtn);

      submitBtn.onclick = () => {
        console.log(userData.drawings);

        const overlay = document.createElement("div");
        overlay.style.position = "fixed";
        overlay.style.left = "0";
        overlay.style.top = "0";
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.display = "flex";
        overlay.style.alignItems = "center";
        overlay.style.justifyContent = "center";
        overlay.style.backgroundColor = "rgba(0,0,0,0.35)";
        overlay.style.zIndex = 9999;

        const box = document.createElement("div");
        box.style.background = "#fff";
        box.style.padding = "20px 28px";
        box.style.borderRadius = "8px";
        box.style.boxShadow = "0 6px 18px rgba(0,0,0,0.2)";
        box.style.textAlign = "center";
        box.style.position = "relative";
        box.style.minWidth = "300px";
        box.style.minHeight = "150px";

        const headline = document.createElement("h3");
        headline.textContent = "ASD Instance Confidence Score";
        headline.style.margin = "0 0 8px 0";

        const score = document.createElement("p");
        score.textContent = "---%";
        score.style.margin = "0 0 12px 0";
        score.style.fontSize = "18px";

        const closeBtn = document.createElement("button");
        closeBtn.textContent = "Close";
        closeBtn.style.padding = "6px 12px";
        closeBtn.style.fontSize = "13px";
        closeBtn.onclick = () => overlay.remove();

        const viewDataBtn = document.createElement("button");
        viewDataBtn.textContent = "View Stroke Data";
        viewDataBtn.style.position = "absolute";
        viewDataBtn.style.bottom = "10px";
        viewDataBtn.style.right = "10px";
        viewDataBtn.style.fontSize = "11px";
        viewDataBtn.style.padding = "4px 8px";
        viewDataBtn.style.cursor = "pointer";
        viewDataBtn.style.borderRadius = "6px";
        viewDataBtn.style.opacity = "0.8";

        viewDataBtn.onclick = () => {
          const dataOverlay = document.createElement("div");
          dataOverlay.style.position = "fixed";
          dataOverlay.style.left = "0";
          dataOverlay.style.top = "0";
          dataOverlay.style.width = "100%";
          dataOverlay.style.height = "100%";
          dataOverlay.style.background = "rgba(0,0,0,0.5)";
          dataOverlay.style.display = "flex";
          dataOverlay.style.justifyContent = "center";
          dataOverlay.style.alignItems = "center";
          dataOverlay.style.zIndex = 10000;

          const dataBox = document.createElement("div");
          dataBox.style.background = "#fff";
          dataBox.style.padding = "20px";
          dataBox.style.borderRadius = "8px";
          dataBox.style.width = "80%";
          dataBox.style.height = "80%";
          dataBox.style.overflow = "auto";
          dataBox.style.fontFamily = "monospace";
          dataBox.style.whiteSpace = "pre-wrap";

          const closeDataBtn = document.createElement("button");
          closeDataBtn.textContent = "Close Data";
          closeDataBtn.style.marginBottom = "10px";
          closeDataBtn.style.padding = "6px 12px";
          closeDataBtn.style.cursor = "pointer";
          closeDataBtn.onclick = () => dataOverlay.remove();

          const dataText = document.createElement("pre");
          dataText.textContent = JSON.stringify(userData.drawings, null, 2);

          dataBox.appendChild(closeDataBtn);
          dataBox.appendChild(dataText);
          dataOverlay.appendChild(dataBox);
          document.body.appendChild(dataOverlay);
        };

        box.appendChild(headline);
        box.appendChild(score);
        box.appendChild(closeBtn);
        box.appendChild(viewDataBtn);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
      };
    }
  };
});
