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
  const candidatesContainer = document.getElementById("candidates-container");
  const voteForm = document.getElementById("vote-form");
  const confirmPanel = document.getElementById("confirm-panel");

  if (!electionId) {
    showStatus(statusEl, "No election specified.", "error");
    return;
  }

  try {
    const { election, candidates, hasVoted } = await Api.get(`/elections/${electionId}`, token);

    document.getElementById("election-title").textContent = election.title;
    document.getElementById("election-description").textContent = election.description || "";

    if (hasVoted) {
      candidatesContainer.textContent = "";
      showStatus(statusEl, "You have already voted in this election. Only one vote per election is permitted.", "error");
      voteForm.hidden = true;
      return;
    }
    if (election.status !== "open") {
      candidatesContainer.textContent = "";
      showStatus(statusEl, "This election is not currently open for voting.", "error");
      voteForm.hidden = true;
      return;
    }
    if (candidates.length === 0) {
      candidatesContainer.textContent = "No candidates have been added to this election yet.";
      voteForm.hidden = true;
      return;
    }

    candidatesContainer.innerHTML = "";
    candidates.forEach((c) => {
      const wrapper = document.createElement("div");
      wrapper.className = "candidate-option";
      wrapper.innerHTML = `
        <input type="radio" name="candidate" id="candidate-${c.id}" value="${c.id}" data-name="${escapeHtml(c.name)}" />
        <div>
          <label for="candidate-${c.id}">${escapeHtml(c.name)}</label>
          <p class="manifesto">${escapeHtml(c.manifesto || "")}</p>
        </div>
      `;
      candidatesContainer.appendChild(wrapper);
    });
  } catch (err) {
    showStatus(statusEl, err.message, "error");
    return;
  }

  let selectedCandidateId = null;
  let selectedCandidateName = null;

  voteForm.addEventListener("submit", (e) => {
    e.preventDefault();
    hideStatus(statusEl);

    const checked = voteForm.querySelector('input[name="candidate"]:checked');
    if (!checked) {
      showStatus(statusEl, "Please select a candidate before continuing.", "error");
      return;
    }

    selectedCandidateId = checked.value;
    selectedCandidateName = checked.dataset.name;

    document.getElementById("confirm-candidate-name").textContent = selectedCandidateName;
    voteForm.hidden = true;
    confirmPanel.hidden = false;
    document.getElementById("confirm-btn").focus();
  });

  document.getElementById("back-btn").addEventListener("click", () => {
    confirmPanel.hidden = true;
    voteForm.hidden = false;
  });

  document.getElementById("confirm-btn").addEventListener("click", async () => {
    const confirmBtn = document.getElementById("confirm-btn");
    confirmBtn.disabled = true;
    confirmBtn.textContent = "Submitting…";

    try {
      await Api.post("/votes", { electionId: Number(electionId), candidateId: Number(selectedCandidateId) }, token);
      confirmPanel.hidden = true;
      showStatus(statusEl, "Your vote has been recorded. Thank you for participating!", "success");
      setTimeout(() => (window.location.href = "voter-dashboard.html"), 1800);
    } catch (err) {
      confirmPanel.hidden = true;
      showStatus(statusEl, err.message, "error");
      confirmBtn.disabled = false;
      confirmBtn.textContent = "Confirm and submit vote";
    }
  });
});

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
