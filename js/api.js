/**
 * Minimal fetch wrapper for talking to the backend API, plus simple
 * session-storage helpers for the voter and admin tokens.
 */
const Api = (function () {
  const BASE = "/api";

  async function request(path, { method = "GET", body, token } = {}) {
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(BASE + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    let data = {};
    try {
      data = await res.json();
    } catch (e) {
      /* empty body */
    }

    if (!res.ok) {
      throw new Error(data.error || `Request failed (${res.status})`);
    }
    return data;
  }

  return {
    get: (path, token) => request(path, { token }),
    post: (path, body, token) => request(path, { method: "POST", body, token }),
    put: (path, body, token) => request(path, { method: "PUT", body, token }),
    del: (path, token) => request(path, { method: "DELETE", token }),
  };
})();

const Session = {
  setVoter(token, voter) {
    sessionStorage.setItem("voter_token", token);
    sessionStorage.setItem("voter_info", JSON.stringify(voter));
  },
  getVoterToken() {
    return sessionStorage.getItem("voter_token");
  },
  getVoterInfo() {
    try {
      return JSON.parse(sessionStorage.getItem("voter_info"));
    } catch (e) {
      return null;
    }
  },
  clearVoter() {
    sessionStorage.removeItem("voter_token");
    sessionStorage.removeItem("voter_info");
  },
  setAdmin(token, admin) {
    sessionStorage.setItem("admin_token", token);
    sessionStorage.setItem("admin_info", JSON.stringify(admin));
  },
  getAdminToken() {
    return sessionStorage.getItem("admin_token");
  },
  clearAdmin() {
    sessionStorage.removeItem("admin_token");
    sessionStorage.removeItem("admin_info");
  },
};

/** Requires an active voter session; redirects to login if absent. */
function requireVoterSession() {
  const token = Session.getVoterToken();
  if (!token) {
    window.location.href = "login.html";
    return null;
  }
  return token;
}

/** Requires an active admin session; redirects to admin login if absent. */
function requireAdminSession() {
  const token = Session.getAdminToken();
  if (!token) {
    window.location.href = "admin-login.html";
    return null;
  }
  return token;
}

function showStatus(el, message, type = "success") {
  el.textContent = message;
  el.className = "status-message " + type;
  el.hidden = false;
  el.setAttribute("role", type === "error" ? "alert" : "status");
}

function hideStatus(el) {
  el.hidden = true;
  el.textContent = "";
}
