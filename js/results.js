document.addEventListener("DOMContentLoaded", async () => {
  const token = requireVoterSession();
  if (!token) return;

  document.getElementById("logout-btn").addEventListener("click", () => {
    Session.clearVoter();
    window.location.href = "index.html";
  });

  const params = new URLSearchParams(window.location.search);
  const electionId = params.get("election");
  const statusEl = document.getElementById("status");
  const container = document.getElementById("results-container");

  if (!electionId) {
    showStatus(statusEl, "No election specified.", "error");
    container.textContent = "";
    return;
  }

  try {
    const { election, results, totalVotes } = await Api.get(`/elections/${electionId}/results`, token);
    document.getElementById("election-title").textContent = `Results: ${election.title}`;

    if (results.length === 0) {
      container.textContent = "No candidates were registered for this election.";
      return;
    }

    const maxVotes = Math.max(...results.map((r) => r.voteCount), 1);

    const table = document.createElement("table");
    table.innerHTML = `
      <caption class="visually-hidden">Vote counts per candidate, highest first</caption>
      <thead>
        <tr><th scope="col">Candidate</th><th scope="col">Votes</th><th scope="col">Share</th></tr>
      </thead>
      <tbody></tbody>
    `;
    const tbody = table.querySelector("tbody");

    results.forEach((r) => {
      const pct = totalVotes > 0 ? ((r.voteCount / totalVotes) * 100).toFixed(1) : "0.0";
      const barPct = (r.voteCount / maxVotes) * 100;
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${escapeHtml(r.name)}</td>
        <td>${r.voteCount}</td>
        <td>
          ${pct}%
          <div class="result-bar-track" role="img" aria-label="${escapeHtml(r.name)}: ${pct} percent of votes">
            <div class="result-bar-fill" style="width:${barPct}%"></div>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });

    container.innerHTML = "";
    container.appendChild(table);

    const summary = document.createElement("p");
    summary.innerHTML = `<strong>Total votes cast: ${totalVotes}</strong>`;
    container.appendChild(summary);
  } catch (err) {
    showStatus(statusEl, err.message, "error");
    container.textContent = "";
  }
});

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
