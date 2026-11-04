// ---------- Data (saved in the browser with localStorage) ----------
function load(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; }
  catch (e) { return []; }
}
function save(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

let assignments = load("st_assignments");
let grades = load("st_grades");

// ---------- Helpers ----------
const $ = (id) => document.getElementById(id);
const today = () => new Date().toISOString().slice(0, 10);

// Weighted average for a list of grades: sum(score/max * weight) / sum(weight)
function weightedAverage(list) {
  const totalWeight = list.reduce((sum, g) => sum + g.weight, 0);
  if (totalWeight === 0) return null;
  const earned = list.reduce((sum, g) => sum + (g.score / g.max) * g.weight, 0);
  return (earned / totalWeight) * 100;
}

// ---------- Assignments ----------
function renderAssignments() {
  const list = $("assignList");
  list.innerHTML = "";
  if (assignments.length === 0) {
    list.innerHTML = '<p class="empty">No assignments yet. Add your first one above.</p>';
  }
  assignments
    .slice()
    .sort((a, b) => a.due.localeCompare(b.due))
    .forEach((a) => {
      const late = !a.done && a.due < today();
      const li = document.createElement("li");
      li.className = (a.done ? "done " : "") + (late ? "late" : "");
      li.innerHTML = `
        <input type="checkbox" ${a.done ? "checked" : ""} aria-label="Mark done" style="flex:0 0 auto">
        <div class="info">
          <span class="title"></span>
          <small></small>
        </div>
        <button class="link">Delete</button>`;
      li.querySelector(".title").textContent = a.title;           // textContent keeps user input safe
      li.querySelector("small").textContent = `${a.course} · due ${a.due}${late ? " · overdue" : ""}`;
      li.querySelector("input").onchange = () => { a.done = !a.done; save("st_assignments", assignments); renderAll(); };
      li.querySelector("button").onclick = () => { assignments = assignments.filter((x) => x.id !== a.id); save("st_assignments", assignments); renderAll(); };
      list.appendChild(li);
    });
}

$("assignForm").addEventListener("submit", (e) => {
  e.preventDefault();
  assignments.push({ id: Date.now(), title: $("aTitle").value.trim(), course: $("aCourse").value.trim(), due: $("aDue").value, done: false });
  save("st_assignments", assignments);
  e.target.reset();
  renderAll();
});

// ---------- Grades ----------
function renderGrades() {
  const box = $("gradeList");
  box.innerHTML = "";
  if (grades.length === 0) {
    box.innerHTML = '<p class="empty">No grades yet. Add a score to see your average.</p>';
    return;
  }
  const courses = [...new Set(grades.map((g) => g.course))];
  courses.forEach((course) => {
    const items = grades.filter((g) => g.course === course);
    const avg = weightedAverage(items);
    const div = document.createElement("div");
    div.className = "course";
    div.innerHTML = `<h3><span></span><span>${avg === null ? "–" : avg.toFixed(1) + "%"}</span></h3>
      <table><tr><th>Assessment</th><th>Score</th><th>Weight</th><th></th></tr></table>`;
    div.querySelector("h3 span").textContent = course;
    const table = div.querySelector("table");
    items.forEach((g) => {
      const tr = document.createElement("tr");
      tr.innerHTML = "<td></td><td></td><td></td><td><button class='link'>Delete</button></td>";
      tr.children[0].textContent = g.name;
      tr.children[1].textContent = `${g.score}/${g.max}`;
      tr.children[2].textContent = `${g.weight}%`;
      tr.querySelector("button").onclick = () => { grades = grades.filter((x) => x.id !== g.id); save("st_grades", grades); renderAll(); };
      table.appendChild(tr);
    });
    box.appendChild(div);
  });
}

$("gradeForm").addEventListener("submit", (e) => {
  e.preventDefault();
  grades.push({
    id: Date.now(),
    course: $("gCourse").value.trim(),
    name: $("gName").value.trim(),
    score: Number($("gScore").value),
    max: Number($("gMax").value),
    weight: Number($("gWeight").value),
  });
  save("st_grades", grades);
  e.target.reset();
  renderAll();
});

// ---------- Summary ----------
function renderSummary() {
  const courses = [...new Set(grades.map((g) => g.course))];
  const avgs = courses.map((c) => weightedAverage(grades.filter((g) => g.course === c))).filter((v) => v !== null);
  $("overall").textContent = avgs.length ? (avgs.reduce((a, b) => a + b, 0) / avgs.length).toFixed(1) + "%" : "–";
  $("pending").textContent = assignments.filter((a) => !a.done).length;
  $("overdue").textContent = assignments.filter((a) => !a.done && a.due < today()).length;
}

function renderAll() { renderAssignments(); renderGrades(); renderSummary(); }
renderAll();
