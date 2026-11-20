  const DAYS = ["Mon", "Tue", "Wed", "Thur", "Fri"];
  const GRADES = ["Grade 9", "Grade 10", "Grade 11", "Grade 12"];
  const WEEKS = 13;

  const roster = {
    "Grade 9": ["Daniel Otieno", "John Kamau", "Roger Mwangi", "Amina Hassan", "Grace Wanjiru", "Brian Kiptoo", "Faith Achieng", "Kevin Njoroge"],
    "Grade 10": ["Mercy Chebet", "Samuel Odhiambo", "Lucy Nyambura", "Peter Mutua", "Esther Akinyi", "David Kariuki"],
    "Grade 11": ["Joy Wambui", "Michael Ouma", "Sarah Njeri", "Collins Kibet", "Ann Mumbi"],
    "Grade 12": ["Victor Omondi", "Diana Jeptoo", "James Maina", "Ruth Wairimu", "Ian Barasa", "Cynthia Atieno"],
  };

  const records = {};
  let sortAsc = true;

  const todayIndex = (() => { const d = new Date().getDay(); return d >= 1 && d <= 5 ? d - 1 : -1; })();

  const $ = (id) => document.getElementById(id);
  const gradeEl = $("grade"), weekEl = $("week"), searchEl = $("search");

  GRADES.forEach((g) => gradeEl.add(new Option(g, g)));
  for (let w = 1; w <= WEEKS; w++) weekEl.add(new Option("Week: " + w, w));

  const key = () => gradeEl.value + "|" + weekEl.value;

  function getRecord() {
    const k = key();
    if (!records[k]) {
      records[k] = {};
      if (gradeEl.value === "Grade 9" && weekEl.value === "1") {
        const sample = {
          "Daniel Otieno": ["P", "P", "P", "P", "A"],
          "John Kamau": ["A", "P", "P", "P", "P"],
          "Roger Mwangi": ["P", "P", "A", "P", "P"],
        };
        Object.assign(records[k], JSON.parse(JSON.stringify(sample)));
      }
    }
    roster[gradeEl.value].forEach((n) => { if (!records[k][n]) records[k][n] = ["", "", "", "", ""]; });
    return records[k];
  }

  const icons = {
    P: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    A: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    "": "",
  };
  const labels = { P: "present", A: "absent", "": "not marked" };
  const next = { "": "P", P: "A", A: "" };

  function renderHead() {
    $("thead").innerHTML =
      '<tr><th scope="col"><div class="name-head">Student Name <button class="sort" id="sortBtn" type="button" aria-label="Sort by name">' +
      (sortAsc ? "A-Z" : "Z-A") + "</button></div></th>" +
      DAYS.map((d, i) =>
        '<th scope="col" class="' + (i === todayIndex ? "today" : "") + '">' + d +
        '<div class="day-actions"><button type="button" data-all="' + i + '" aria-label="Mark all present on ' + d + '">All ✓</button></div></th>'
      ).join("") +
      '<th scope="col">Total</th><th scope="col"><span class="sr-only">Row actions</span></th></tr>';
    $("sortBtn").onclick = () => { sortAsc = !sortAsc; render(); };
    document.querySelectorAll("[data-all]").forEach((b) => {
      b.onclick = () => {
        const rec = getRecord(), i = +b.dataset.all;
        visibleNames().forEach((n) => { if (!rec[n][i]) rec[n][i] = "P"; });
        render();
      };
    });
  }

  function visibleNames() {
    const q = searchEl.value.trim().toLowerCase();
    return roster[gradeEl.value]
      .filter((n) => n.toLowerCase().includes(q))
      .sort((a, b) => (sortAsc ? a.localeCompare(b) : b.localeCompare(a)));
  }

  function render() {
    const rec = getRecord();
    renderHead();
    const names = visibleNames();
    const tbody = $("tbody");
    if (!names.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty">No students match your search.</td></tr>';
    } else {
      tbody.innerHTML = names.map((n) => {
        const row = rec[n];
        const present = row.filter((v) => v === "P").length;
        return "<tr><td class='student'>" + escapeHtml(n) + "</td>" +
          row.map((v, i) =>
            '<td><button type="button" class="mark ' + (v === "P" ? "present" : v === "A" ? "absent" : "") +
            '" data-name="' + escapeHtml(n) + '" data-day="' + i + '" aria-label="' + escapeHtml(n) + ", " + DAYS[i] + ": " + labels[v] + '">' +
            icons[v] + "</button></td>"
          ).join("") +
          '<td class="total">' + present + "/5</td>" +
          '<td><select class="row-menu" data-name="' + escapeHtml(n) + '" aria-label="Actions for ' + escapeHtml(n) + '">' +
          '<option value="">Actions</option>' +
          '<option value="present">Mark all present</option>' +
          '<option value="absent">Mark all absent</option>' +
          '<option value="clear">Clear row</option>' +
          '<option value="remove">Remove student</option>' +
          "</select></td></tr>";
      }).join("");
    }
    tbody.querySelectorAll(".row-menu").forEach((s) => {
      s.onchange = () => {
        const n = s.dataset.name, action = s.value;
        if (action === "present") rec[n] = ["P", "P", "P", "P", "P"];
        else if (action === "absent") rec[n] = ["A", "A", "A", "A", "A"];
        else if (action === "clear") { rec[n] = ["", "", "", "", ""]; toast("Cleared marks for " + n + "."); }
        else if (action === "remove") {
          roster[gradeEl.value] = roster[gradeEl.value].filter((x) => x !== n);
          Object.keys(records).forEach((k) => { if (k.startsWith(gradeEl.value + "|")) delete records[k][n]; });
          toast(n + " removed from " + gradeEl.value + ".", "var(--absent)");
        }
        render();
      };
    });
    tbody.querySelectorAll(".mark").forEach((b) => {
      b.onclick = () => {
        const r = rec[b.dataset.name], d = +b.dataset.day;
        r[d] = next[r[d]];
        render();
        const again = tbody.querySelector('.mark[data-name="' + CSS.escape(b.dataset.name) + '"][data-day="' + d + '"]');
        if (again) again.focus();
      };
    });

    const all = roster[gradeEl.value];
    $("tfoot").innerHTML = "<tr><td>Present per day</td>" +
      DAYS.map((_, i) => "<td>" + all.filter((n) => rec[n][i] === "P").length + "/" + all.length + "</td>").join("") +
      "<td></td><td></td></tr>";

    const cells = all.flatMap((n) => rec[n]);
    const marked = cells.filter(Boolean).length;
    const present = cells.filter((v) => v === "P").length;
    $("sCount").textContent = all.length;
    $("sToday").textContent = todayIndex >= 0 ? all.filter((n) => rec[n][todayIndex] === "P").length + "/" + all.length : "Weekend";
    $("sRate").textContent = marked ? Math.round((present / marked) * 100) + "%" : "0%";
    $("sUnmarked").textContent = cells.length - marked;
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function toast(msg, color) {
    const t = $("toast");
    t.style.color = color || "var(--present)";
    t.textContent = msg;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => (t.textContent = ""), 3500);
  }

  function addStudent() {
    const input = $("newName"), name = input.value.trim().replace(/\s+/g, " ");
    if (!name) {
      toast("Type a student name first.", "var(--absent)");
      input.focus();
      return;
    }
    if (roster[gradeEl.value].some((n) => n.toLowerCase() === name.toLowerCase())) {
      toast(name + " is already in " + gradeEl.value + ".", "var(--absent)");
      return;
    }
    roster[gradeEl.value].push(name);
    input.value = "";
    searchEl.value = "";
    render();
    toast(name + " added to " + gradeEl.value + ".");
    input.focus();
  }
  $("addBtn").onclick = addStudent;
  $("newName").onkeydown = (e) => {
    if (e.key !== "Enter" || e.isComposing || e.keyCode === 229) return;
    e.preventDefault();
    addStudent();
  };

  const clearAllBtn = $("clearAllBtn");
  function resetClearAll() {
    clearTimeout(resetClearAll.timer);
    clearAllBtn.classList.remove("confirming");
    clearAllBtn.textContent = "Clear all";
  }
  clearAllBtn.onclick = () => {
    if (!clearAllBtn.classList.contains("confirming")) {
      clearAllBtn.classList.add("confirming");
      clearAllBtn.textContent = "Tap again to confirm";
      resetClearAll.timer = setTimeout(resetClearAll, 3000);
      return;
    }
    const rec = getRecord();
    roster[gradeEl.value].forEach((n) => { rec[n] = ["", "", "", "", ""]; });
    resetClearAll();
    render();
    toast("All marks cleared for " + gradeEl.value + ", Week " + weekEl.value + ".", "var(--absent)");
  };

  $("saveBtn").onclick = () => {
    const rec = getRecord();
    const unmarked = roster[gradeEl.value].filter((n) => todayIndex >= 0 && !rec[n][todayIndex]);
    if (unmarked.length) {
      toast(unmarked.length + " student(s) not marked for today. Mark them before submitting.", "var(--absent)");
      return;
    }
    toast("Register for " + gradeEl.value + ", Week " + weekEl.value + " submitted.");
  };

  $("exportBtn").onclick = () => {
    const rec = getRecord();
    const rows = [["Student", ...DAYS, "Days present"]];
    roster[gradeEl.value].slice().sort().forEach((n) => {
      rows.push([n, ...rec[n].map((v) => (v === "P" ? "Present" : v === "A" ? "Absent" : "")), rec[n].filter((v) => v === "P").length]);
    });
    const csv = rows.map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = gradeEl.value.replace(" ", "-") + "-week-" + weekEl.value + "-attendance.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  searchEl.oninput = render;
  gradeEl.onchange = render;
  weekEl.onchange = render;
  render();
