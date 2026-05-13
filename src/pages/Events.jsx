import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Copy, Edit, Eye, Filter, RefreshCw, Search, Star, Trash2 } from "lucide-react";
import EventAdminLayout from "../components/EventAdminLayout";
import { eventCategories, requestJson } from "../utils/eventApi";

const formatDate = (event) => {
  if (event?.comingSoon) return "Coming Soon";
  if (event?.dateLabel || event?.date) return event.dateLabel || event.date;
  return event?.startDate ? new Date(event.startDate).toLocaleDateString() : "TBA";
};

export default function Events() {
  const [events, setEvents] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ q: "", status: "all", category: "all", page: 1 });
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const query = useMemo(() => {
    const params = new URLSearchParams({ page: String(filters.page), limit: "12" });
    if (filters.q) params.set("q", filters.q);
    if (filters.status !== "all") params.set("status", filters.status);
    if (filters.category !== "all") params.set("category", filters.category);
    return params.toString();
  }, [filters]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const [eventData, analyticsData] = await Promise.all([
        requestJson(`/events?${query}`),
        requestJson("/events/analytics/summary"),
      ]);
      setEvents(Array.isArray(eventData) ? eventData : eventData.items || []);
      setPagination(eventData.pagination || { page: 1, totalPages: 1, total: eventData.length || 0 });
      setAnalytics(analyticsData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents().catch((err) => alert(err.message));
  }, [query]);

  const mutateEvent = async (path, options = {}) => {
    await requestJson(path, options);
    await loadEvents();
  };

  const deleteEvent = async (event) => {
    if (!window.confirm(`Delete ${event.title || event.name}?`)) return;
    await mutateEvent(`/events/${event._id}`, { method: "DELETE" });
  };

  return (
    <EventAdminLayout
      title="Event Management"
      subtitle="Create, publish, monitor, and optimize TechMNHub events."
    >
      <section className="analytics-grid">
        <div className="event-card analytics-card">
          <span>Total registrations</span>
          <strong>{analytics?.totalRegistrations || 0}</strong>
        </div>
        <div className="event-card analytics-card">
          <span>Revenue generated</span>
          <strong>Rs {analytics?.revenue || 0}</strong>
        </div>
        <div className="event-card analytics-card">
          <span>Most popular pass</span>
          <strong>{analytics?.mostPopularPass || "N/A"}</strong>
        </div>
        <div className="event-card analytics-card">
          <span>Attendance stats</span>
          <strong>{analytics?.attendanceRate || 0}%</strong>
        </div>
      </section>

      <section className="event-card event-toolbar">
        <label>
          <Search size={16} /> Search
          <input
            className="event-input"
            value={filters.q}
            onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value, page: 1 }))}
            placeholder="Search events, slug, category"
          />
        </label>
        <label>
          <Filter size={16} /> Status
          <select
            className="event-select"
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value, page: 1 }))}
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
          </select>
        </label>
        <label>
          Category
          <select
            className="event-select"
            value={filters.category}
            onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value, page: 1 }))}
          >
            <option value="all">All categories</option>
            {eventCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <button className="event-btn" type="button" onClick={loadEvents}>
          <RefreshCw size={16} /> Refresh
        </button>
      </section>

      <section className="event-panel">
        <div className="event-table-wrap">
          <table className="event-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Category</th>
                <th>Schedule</th>
                <th>Passes</th>
                <th>Status</th>
                <th>Seats</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7">Loading events...</td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan="7">No events found.</td>
                </tr>
              ) : (
                events.map((event) => {
                  const seatLimit = event.registrationSettings?.maxRegistrations || event.ticketTypes?.reduce((sum, pass) => sum + (pass.total || 0), 0) || 0;
                  const hasSeatWarning = seatLimit > 0 && seatLimit <= 20;
                  return (
                    <tr key={event._id}>
                      <td>
                        <strong>{event.title || event.name}</strong>
                        <div>{event.subtitle || event.tagline || event.slug}</div>
                        {event.featured && <span className="status-pill published"><Star size={12} /> Featured</span>}
                      </td>
                      <td>{event.category || "General"}</td>
                      <td>
                        {formatDate(event)}
                        <div>{event.timings || event.time}</div>
                      </td>
                      <td>{event.ticketTypes?.length || 0} passes</td>
                      <td>
                        <span className={`status-pill ${event.status}`}>{event.status}</span>
                      </td>
                      <td className={hasSeatWarning ? "seat-warning" : ""}>{seatLimit || "Unlimited"}</td>
                      <td>
                        <div className="inline-actions">
                          <Link className="event-btn ghost" to={`/admin/events/${event._id}/edit`}>
                            <Edit size={15} />
                          </Link>
                          <button
                            className="event-btn ghost"
                            type="button"
                            onClick={() => mutateEvent(`/events/${event._id}/duplicate`, { method: "POST" })}
                          >
                            <Copy size={15} />
                          </button>
                          <button
                            className="event-btn ghost"
                            type="button"
                            onClick={() => mutateEvent(`/events/${event._id}/${event.status === "draft" ? "publish" : "unpublish"}`, { method: "PATCH" })}
                          >
                            <Eye size={15} />
                          </button>
                          <button className="event-btn danger" type="button" onClick={() => deleteEvent(event)}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination-row">
          <span>{pagination.total} events</span>
          <div className="inline-actions">
            <button
              className="event-btn ghost"
              disabled={filters.page <= 1}
              onClick={() => setFilters((prev) => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
            >
              Previous
            </button>
            <span>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              className="event-btn ghost"
              disabled={filters.page >= pagination.totalPages}
              onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </EventAdminLayout>
  );
}
