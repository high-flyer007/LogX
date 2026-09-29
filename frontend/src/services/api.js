const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000/api/v1";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();

    throw new Error(
      message || `API request failed: ${response.status}`
    );
  }

  return response.json();
}

export const api = {
  health() {
    return request("/health");
  },

  processEvent(rawData) {
    return request("/events/process", {
      method: "POST",
      body: JSON.stringify({
        raw_data: rawData,
      }),
    });
  },

  events(limit = 100) {
    return request(`/events?limit=${limit}`);
  },

  event(eventId) {
    return request(
      `/events/${encodeURIComponent(eventId)}`
    );
  },

  quarantine() {
    return request("/quarantine");
  },

  parsers() {
    return request("/parsers");
  },

  testParser(payload) {
    return request("/parsers/test", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  analyzeParser(payload) {
    return request("/parsers/analyze", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  registerParser(payload) {
    return request("/parsers/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  replayParser(payload) {
    return request("/parsers/replay", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  replay(payload) {
    return request("/replay", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  replayHistory() {
    return request("/replay/history");
  },

  analyticsSummary() {
    return request("/analytics/summary");
  },
};