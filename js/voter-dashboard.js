document.addEventListener("DOMContentLoaded", async () => {
  const token = requireVoterSession();
  if (!token) return;

  const voter = Session.getVoterInfo();
  document.getElementById("welcome-msg").textContent = voter ? `Welcome, ${voter.fullName}` : "";

  document.getElementById("logout-btn").addEventListener("click", () => {
    Session.clearVoter();
    window.location.href = "index.html";
  });

  const listEl = document.getElementById("elections-list");
  const statusEl = document.getElementById("status");

  try {
    const { elections } = await Api.get("/elections", token);

    if (elections.length === 0) {
      listEl.textContent = "There are no elections available at this time.";
      return;
    }

    listEl.innerHTML = "";
    elections.forEach((election) => {
      const card = document.createElement("section");
      card.className = "card";
      card.setAttribute("aria-labelledby", `election-${election.id}-title`);

      const statusBadge = `<span class="badge ${election.status}">${election.status.toUpperCase()}</span>`;

      let actionHtml = "";
      if (election.status === "open" && !election.hasVoted) {
        actionHtml = `<a class="btn" href="vote.html?election=${election.id}">Cast your vote</a>`;
      } else if (election.hasVoted) {
        actionHtml = `<p><strong>You have already voted in this election.</strong> Thank you for participating.</p>`;
      } else if (election.status === "closed") {
        actionHtml = `<a class="btn secondary" href="results.html?election=${election.id}">View results</a>`;
      } else {
        actionHtml = `<p>This election has not opened for voting yet.</p>`;
      }

      card.innerHTML = `
        <h2 id="election-${election.id}-title">${escapeHtml(election.title)} ${statusBadge}</h2>
        <p>${escapeHtml(election.description || "")}</p>
        <p class="hint">Voting window: ${formatDate(election.start_time)} to ${formatDate(election.end_time)}</p>
        ${actionHtml}
      `;
      listEl.appendChild(card);
    });
  } catch (err) {
    showStatus(statusEl, err.message, "error");
    listEl.textContent = "";
  }
});

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch (e) {
    return iso;
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
