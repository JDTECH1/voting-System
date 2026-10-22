let ADMIN_TOKEN = null;

document.addEventListener("DOMContentLoaded", async () => {
  ADMIN_TOKEN = requireAdminSession();
  if (!ADMIN_TOKEN) return;

  document.getElementById("logout-btn").addEventListener("click", () => {
    Session.clearAdmin();
    window.location.href = "admin-login.html";
  });

  await loadSummary();
  await loadElections();
  await loadAuditLog();

  document.getElementById("create-election-form").addEventListener("submit", onCreateElection);
  document.getElementById("add-candidate-form").addEventListener("submit", onAddCandidate);
  document.getElementById("close-candidate-panel").addEventListener("click", () => {
    document.getElementById("candidate-panel").hidden = true;
  });
});

const statusEl = () => document.getElementById("status");

async function loadSummary() {
  const container = document.getElementById("summary-container");
  try {
    const s = await Api.get("/admin/summary", ADMIN_TOKEN);
    container.innerHTML = `
      <table>
        <tbody>
          <tr><th scope="row">Total registered voters</th><td>${s.totalVoters}</td></tr>
          <tr><th scope="row">Total elections</th><td>${s.totalElections}</td></tr>
          <tr><th scope="row">Currently open elections</th><td>${s.openElections}</td></tr>
          <tr><th scope="row">Total votes cast (all time)</th><td>${s.totalVotesCast}</td></tr>
        </tbody>
      </table>
    `;
  } catch (err) {
    showStatus(statusEl(), err.message, "error");
  }
}

async function onCreateElection(e) {
  e.preventDefault();
  hideStatus(statusEl());

  const title = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value.trim();
  const startTime = document.getElementById("startTime").value;
  const endTime = document.getElementById("endTime").value;

  if (!title || !startTime || !endTime) {
    showStatus(statusEl(), "Please fill in the title, start time, and end time.", "error");
    return;
  }

  try {
    await Api.post(
      "/elections/admin",
      { title, description, startTime: new Date(startTime).toISOString(), endTime: new Date(endTime).toISOString() },
      ADMIN_TOKEN
    );
    showStatus(statusEl(), "Election created successfully.", "success");
    e.target.reset();
    await loadElections();
    await loadSummary();
  } catch (err) {
    showStatus(statusEl(), err.message, "error");
  }
}

async function loadElections() {
  const container = document.getElementById("elections-container");
  try {
    const { elections } = await Api.get("/elections/admin/all", ADMIN_TOKEN);

    if (elections.length === 0) {
      container.textContent = "No elections created yet.";
      return;
    }

    container.innerHTML = "";
    for (const election of elections) {
      const tally = await Api.get(`/elections/admin/${election.id}/live-tally`, ADMIN_TOKEN);

      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <h3>${escapeHtml(election.title)} <span class="badge ${election.status}">${election.status.toUpperCase()}</span></h3>
        <p>${escapeHtml(election.description || "")}</p>
        <p class="hint">Window: ${formatDate(election.start_time)} to ${formatDate(election.end_time)}</p>
        <p><strong>Participants so far:</strong> ${tally.totalParticipants} | <strong>Total votes:</strong> ${tally.totalVotes}</p>
        <ul>
          ${tally.results.map((r) => `<li>${escapeHtml(r.name)}: ${r.voteCount} vote(s)</li>`).join("")}
        </ul>
        <div class="election-actions">
          <button type="button" data-action="add-candidate" data-id="${election.id}">Add candidate</button>
          ${election.status !== "open" ? `<button type="button" data-action="open" data-id="${election.id}">Open for voting</button>` : ""}
          ${election.status !== "closed" ? `<button type="button" data-action="close" data-id="${election.id}">Close election</button>` : ""}
          ${election.status !== "draft" ? `<button type="button" data-action="draft" data-id="${election.id}">Revert to draft</button>` : ""}
          <button type="button" class="danger" data-action="delete" data-id="${election.id}">Delete election</button>
        </div>
      `;
      container.appendChild(card);
    }

    container.querySelectorAll("button[data-action]").forEach((btn) => {
      btn.addEventListener("click", () => handleElectionAction(btn.dataset.action, btn.dataset.id));
    });
  } catch (err) {
    showStatus(statusEl(), err.message, "error");
  }
}

async function handleElectionAction(action, electionId) {
  hideStatus(statusEl());

  if (action === "add-candidate") {
    document.getElementById("candidateElectionId").value = electionId;
    const panel = document.getElementById("candidate-panel");
    panel.hidden = false;
    panel.scrollIntoView({ behavior: "smooth" });
    document.getElementById("candidateName").focus();
    return;
  }

  if (action === "delete") {
    const confirmed = window.confirm("Delete this election and all its candidates and votes? This cannot be undone.");
    if (!confirmed) return;
    try {
      await Api.del(`/elections/admin/${electionId}`, ADMIN_TOKEN);
      showStatus(statusEl(), "Election deleted.", "success");
      await loadElections();
      await loadSummary();
    } catch (err) {
      showStatus(statusEl(), err.message, "error");
    }
    return;
  }

  const statusMap = { open: "open", close: "closed", draft: "draft" };
  const newStatus = statusMap[action];
  if (!newStatus) return;

  try {
    await Api.put(`/elections/admin/${electionId}`, { status: newStatus }, ADMIN_TOKEN);
    showStatus(statusEl(), `Election status updated to "${newStatus}".`, "success");
    await loadElections();
    await loadSummary();
  } catch (err) {
    showStatus(statusEl(), err.message, "error");
  }
}

async function onAddCandidate(e) {
  e.preventDefault();
  hideStatus(statusEl());

  const electionId = Number(document.getElementById("candidateElectionId").value);
  const name = document.getElementById("candidateName").value.trim();
  const manifesto = document.getElementById("candidateManifesto").value.trim();
  const photoUrl = document.getElementById("candidatePhotoUrl").value.trim();

  if (!name) {
    showStatus(statusEl(), "Candidate name is required.", "error");
    return;
  }

  try {
    await Api.post("/candidates/admin", { electionId, name, manifesto, photoUrl }, ADMIN_TOKEN);
    showStatus(statusEl(), "Candidate added.", "success");
    e.target.reset();
    document.getElementById("candidate-panel").hidden = true;
    await loadElections();
  } catch (err) {
    showStatus(statusEl(), err.message, "error");
  }
}

async function loadAuditLog() {
  const container = document.getElementById("audit-container");
  try {
    const { logs } = await Api.get("/admin/audit-log", ADMIN_TOKEN);
    if (logs.length === 0) {
      container.textContent = "No audit events recorded yet.";
      return;
    }
    const table = document.createElement("table");
    table.innerHTML = `
      <thead><tr><th scope="col">Time</th><th scope="col">Actor</th><th scope="col">Action</th><th scope="col">Details</th></tr></thead>
      <tbody>
        ${logs
          .map(
            (l) => `<tr>
              <td>${formatDate(l.created_at)}</td>
              <td>${l.actor_type}${l.actor_id ? " #" + l.actor_id : ""}</td>
              <td>${l.action}</td>
              <td>${escapeHtml(l.details || "")}</td>
            </tr>`
          )
          .join("")}
      </tbody>
    `;
    container.innerHTML = "";
    container.appendChild(table);
  } catch (err) {
    showStatus(statusEl(), err.message, "error");
  }
}

function formatDate(iso) {
  try {
    return new Date(iso + (iso.endsWith("Z") ? "" : "Z")).toLocaleString();
  } catch (e) {
    return iso;
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
