// Simple configuration for the scanner.
// You can tweak these defaults for different systems.

const CONFIG = {
  requiredFields: ["event_name", "user_id", "timestamp", "environment"],
  fieldTypes: {
    event_name: "string",
    user_id: "number",
    timestamp: "string",
    environment: "string",
    source: "string",
    action_type: "string",
  },
  namingConvention: "snake_case", // future: allow "camelCase" or "mixed"
  domainRules: {
    environment: ["prod", "staging", "dev"],
    action_type: ["LOGIN", "LOGOUT", "PURCHASE", "VIEW"],
  },
};

// ---------- Helpers ----------

function safeParseJSON(text) {
  try {
    const parsed = JSON.parse(text);
    if (parsed === null || Array.isArray(parsed) || typeof parsed !== "object") {
      return { error: "Please provide a single JSON object, not an array or primitive." };
    }
    return { value: parsed };
  } catch (err) {
    return { error: err.message || "Invalid JSON." };
  }
}

function isSnakeCase(key) {
  return /^[a-z0-9]+(_[a-z0-9]+)*$/.test(key);
}

// ---------- Validation ----------

function validateEvent(eventObj, config) {
  const issues = [];

  // Required fields
  config.requiredFields.forEach((field) => {
    if (!(field in eventObj)) {
      issues.push({
        category: "required",
        field,
        message: `Missing required field "${field}".`,
        severity: "error",
      });
    } else if (
      eventObj[field] === null ||
      eventObj[field] === "" ||
      (typeof eventObj[field] === "string" && eventObj[field].trim() === "")
    ) {
      issues.push({
        category: "required",
        field,
        message: `Required field "${field}" is present but empty.`,
        severity: "warning",
      });
    }
  });

  // Types
  Object.entries(config.fieldTypes).forEach(([field, expected]) => {
    if (!(field in eventObj)) return;

    const value = eventObj[field];
    const actual = Array.isArray(value) ? "array" : typeof value;

    if (expected !== actual) {
      issues.push({
        category: "type",
        field,
        message: `Type mismatch for "${field}": expected ${expected}, got ${actual}.`,
        severity: "error",
      });
    }

    if (field === "timestamp" && typeof value === "string") {
      const likelyIso = /^\d{4}-\d{2}-\d{2}T/.test(value);
      if (!likelyIso) {
        issues.push({
          category: "type",
          field,
          message: `Timestamp "${value}" does not look like an ISO-8601 value.`,
          severity: "warning",
        });
      }
    }
  });

  // Naming convention
  Object.keys(eventObj).forEach((key) => {
    if (config.namingConvention === "snake_case" && !isSnakeCase(key)) {
      issues.push({
        category: "naming",
        field: key,
        message: `Field "${key}" does not follow snake_case naming.`,
        severity: "warning",
      });
    }
  });

  // Domain rules
  Object.entries(config.domainRules).forEach(([field, allowed]) => {
    if (!(field in eventObj)) return;
    const value = eventObj[field];

    if (!allowed.includes(value)) {
      issues.push({
        category: "domain",
        field,
        message: `Value "${value}" for "${field}" is not in allowed set: [${allowed.join(
          ", "
        )}].`,
        severity: "warning",
      });
    }
  });

  const passed = issues.filter((i) => i.severity === "error").length === 0;

  return { passed, issues };
}

// ---------- Rendering ----------

function clearIssuesLists() {
  ["required-issues", "type-issues", "naming-issues", "domain-issues"].forEach((id) => {
    const ul = document.getElementById(id);
    ul.innerHTML = "";
    ul.classList.add("empty");
  });

  document.getElementById("raw-issues").textContent = "No issues — event meets all configured rules.";
}

function renderSummary(result) {
  const container = document.getElementById("summary");
  container.innerHTML = "";

  const badge = document.createElement("div");
  const total = result.issues.length;
  const errors = result.issues.filter((i) => i.severity === "error").length;

  if (total === 0) {
    badge.className = "summary-badge summary-badge-ok";
    badge.textContent = "All checks passed. No issues detected.";
  } else if (errors === 0) {
    badge.className = "summary-badge summary-badge-fail";
    badge.innerHTML = `
      <span class="count">${total}</span> issue${total === 1 ? "" : "s"} detected (warnings only).
    `;
  } else {
    badge.className = "summary-badge summary-badge-fail";
    badge.innerHTML = `
      <span class="count">${total}</span> issue${total === 1 ? "" : "s"} detected
      · <span class="count">${errors}</span> error${errors === 1 ? "" : "s"}.
    `;
  }

  container.appendChild(badge);
}

function addIssueToList(listId, issue) {
  const ul = document.getElementById(listId);
  ul.classList.remove("empty");

  const li = document.createElement("li");

  const pill = document.createElement("span");
  pill.className = "issue-pill";
  pill.textContent = issue.field || "event";

  const msg = document.createElement("span");
  msg.className = "issue-message";
  msg.textContent = issue.message;

  li.appendChild(pill);
  li.appendChild(msg);

  ul.appendChild(li);
}

function renderIssues(result) {
  clearIssuesLists();

  if (result.issues.length === 0) {
    renderSummary(result);
    return;
  }

  renderSummary(result);

  result.issues.forEach((issue) => {
    switch (issue.category) {
      case "required":
        addIssueToList("required-issues", issue);
        break;
      case "type":
        addIssueToList("type-issues", issue);
        break;
      case "naming":
        addIssueToList("naming-issues", issue);
        break;
      case "domain":
        addIssueToList("domain-issues", issue);
        break;
      default:
        break;
    }
  });

  const raw = result.issues.map((i) => `- [${i.category}] ${i.message}`).join("\n");
  document.getElementById("raw-issues").textContent = raw;
}

// ---------- Example events ----------

const VALID_EVENT = {
  event_name: "user.login",
  user_id: 123,
  timestamp: "2025-11-22T15:00:00Z",
  environment: "prod",
  source: "web",
  action_type: "LOGIN",
};

const BROKEN_EVENT = {
  // wrong name (camelCase instead of snake) -> naming issue
  eventName: "user.login",
  // wrong type (string instead of number) -> type issue
  user_id: "123",
  // non-ISO timestamp -> format warning
  timestamp: "2025/11/22 15:00",
  // missing "environment" (required) -> required error
  // wrong field name + bad domain value
  env: "production",
  // invalid domain value for action_type
  action_type: "LOGIN-FAILED",
};

// ---------- UI handlers ----------

function onScan() {
  const input = document.getElementById("event-input").value.trim();
  const parseStatus = document.getElementById("parse-status");

  if (!input) {
    parseStatus.textContent = "Please paste a JSON event first.";
    clearIssuesLists();
    document.getElementById("summary").innerHTML =
      '<div class="summary-badge summary-badge-idle">No event scanned yet.</div>';
    return;
  }

  const { value, error } = safeParseJSON(input);

  if (error) {
    parseStatus.textContent = "JSON error: " + error;
    clearIssuesLists();
    document.getElementById("summary").innerHTML =
      '<div class="summary-badge summary-badge-fail">Cannot scan: invalid JSON.</div>';
    document.getElementById("raw-issues").textContent = "No results due to invalid JSON.";
    return;
  }

  parseStatus.textContent = "JSON parsed successfully.";
  const result = validateEvent(value, CONFIG);
  renderIssues(result);
}

function loadExample(eventObj, label) {
  const textarea = document.getElementById("event-input");
  textarea.value = JSON.stringify(eventObj, null, 2);
  document.getElementById("parse-status").textContent = `Loaded ${label} example.`;
  clearIssuesLists();
  document.getElementById("summary").innerHTML =
    '<div class="summary-badge summary-badge-idle">Ready to scan the loaded event.</div>';
  document.getElementById("raw-issues").textContent = "No scan yet.";
}

function onLoadValid() {
  loadExample(VALID_EVENT, "valid");
}

function onLoadBroken() {
  loadExample(BROKEN_EVENT, "broken");
}

// ---------- Wire up ----------

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("scan-button").addEventListener("click", onScan);
  const validBtn = document.getElementById("load-valid");
  const brokenBtn = document.getElementById("load-broken");

  if (validBtn) validBtn.addEventListener("click", onLoadValid);
  if (brokenBtn) brokenBtn.addEventListener("click", onLoadBroken);

  // Optional: start with the broken example loaded
  loadExample(BROKEN_EVENT, "broken");
});
