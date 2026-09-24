(() => {
  const API_BASE = "http://127.0.0.1:8000";
  const form = document.getElementById("predict-form"),
    btn = document.getElementById("submit-btn"),
    stress = document.getElementById("stress_level"),
    stressBox = document.getElementById("stress_level_group");
  const states = {
    idle: document.getElementById("idle"),
    loading: document.getElementById("loading"),
    result: document.getElementById("result"),
    error: document.getElementById("error"),
  };
  const show = (s) => {
    Object.values(states).forEach((x) => (x.hidden = true));
    states[s].hidden = false;
  };
  stressBox.querySelectorAll("button").forEach(
    (b) =>
      (b.onclick = () => {
        stressBox
          .querySelectorAll("button")
          .forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        stress.value = b.dataset.value;
        stressBox.parentElement.classList.remove("error");
      }),
  );
  function clear() {
    document
      .querySelectorAll(".field.error")
      .forEach((x) => x.classList.remove("error"));
    document.querySelectorAll(".err").forEach((x) => (x.textContent = ""));
    stressBox.parentElement.classList.remove("error");
  }
  function payload() {
    let f = new FormData(form);
    return {
      age: f.get("age") === "" ? NaN : +f.get("age"),
      gender: f.get("gender") || "",
      country: (f.get("country") || "").trim(),
      academic_level: f.get("academic_level") || "",
      most_used_platform: f.get("most_used_platform") || "",
      purpose_of_use: f.get("purpose_of_use") || "",
      avg_daily_usage_hours:
        f.get("avg_daily_usage_hours") === ""
          ? NaN
          : +f.get("avg_daily_usage_hours"),
      daily_unlocks:
        f.get("daily_unlocks") === "" ? NaN : +f.get("daily_unlocks"),
      study_hours: f.get("study_hours") === "" ? NaN : +f.get("study_hours"),
      physical_activity_hours:
        f.get("physical_activity_hours") === ""
          ? NaN
          : +f.get("physical_activity_hours"),
      sleep_hours_per_night:
        f.get("sleep_hours_per_night") === ""
          ? NaN
          : +f.get("sleep_hours_per_night"),
      stress_level: f.get("stress_level") || "",
    };
  }
  function invalid(d) {
    let bad = null;
    [
      ["age", 10, 100],
      ["avg_daily_usage_hours", 0, 24],
      ["daily_unlocks", 0, Infinity],
      ["study_hours", 0, 24],
      ["physical_activity_hours", 0, 24],
      ["sleep_hours_per_night", 0, 24],
    ].forEach(([k, min, max]) => {
      if (!Number.isFinite(d[k]) || d[k] < min || d[k] > max) {
        let e = document.getElementById(k).closest(".field");
        e.classList.add("error");
        e.querySelector(".err").textContent = "Required or invalid";
        bad ??= document.getElementById(k);
      }
    });
    [
      "gender",
      "country",
      "academic_level",
      "most_used_platform",
      "purpose_of_use",
    ].forEach((k) => {
      if (!d[k]) {
        let e = document.getElementById(k).closest(".field");
        e.classList.add("error");
        e.querySelector(".err").textContent = "Required";
        bad ??= document.getElementById(k);
      }
    });
    if (!d.stress_level) {
      stressBox.parentElement.classList.add("error");
      stressBox.parentElement.querySelector(".stress-err").textContent =
        "Select a stress level";
      bad ??= stressBox.querySelector("button");
    }
    bad?.focus();
    return !!bad;
  }
  function band(s) {
    return s < 4
      ? [
          "Strained signal",
          "Your modeled score indicates a higher level of strain in the supplied inputs.",
        ]
      : s < 7
        ? [
            "Balanced signal",
            "Your modeled score sits in the middle range based on the information provided.",
          ]
        : [
            "Strong signal",
            "Your modeled score is in the higher range based on the information provided.",
          ];
  }
  form.onsubmit = async (e) => {
    e.preventDefault();
    clear();
    let d = payload();
    if (invalid(d)) return;
    btn.disabled = true;
    show("loading");
    try {
      let r = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(d),
      });
      let body = await r.json().catch(() => null);
      if (!r.ok) {
        show("error");
        document.getElementById("error-label").textContent =
          r.status === 422 ? "Check your inputs" : "Prediction failed";
        document.getElementById("error-copy").textContent = body?.detail
          ? JSON.stringify(body.detail)
          : `API returned ${r.status}`;
        return;
      }
      let s = body.predicted_mental_health_score;
      if (typeof s !== "number") throw Error("Missing score");
      document.getElementById("score-number").textContent = s.toFixed(2);
      let [lab, txt] = band(s);
      document.getElementById("score-band").textContent = lab;
      document.getElementById("score-context").textContent = txt;
      document.getElementById("stat-screen").textContent =
        d.avg_daily_usage_hours + " hrs";
      document.getElementById("stat-sleep").textContent =
        d.sleep_hours_per_night + " hrs";
      document.getElementById("stat-stress").textContent = d.stress_level;
      let c = 2 * Math.PI * 92,
        p = document.getElementById("progress");
      p.style.strokeDasharray = c;
      p.style.strokeDashoffset = c;
      requestAnimationFrame(
        () =>
          (p.style.strokeDashoffset =
            c * (1 - Math.max(0, Math.min(10, s)) / 10)),
      );
      show("result");
    } catch (err) {
      show("error");
      document.getElementById("error-label").textContent =
        "Can't reach the server";
      document.getElementById("error-copy").textContent =
        "Start FastAPI with: uvicorn main:app --reload";
    } finally {
      btn.disabled = false;
    }
  };
  function reset() {
    form.reset();
    clear();
    stress.value = "";
    stressBox
      .querySelectorAll("button")
      .forEach((x) => x.classList.remove("active"));
    show("idle");
  }
  document.getElementById("reset-btn").onclick = reset;
  document.getElementById("retry").onclick = reset;
})();
