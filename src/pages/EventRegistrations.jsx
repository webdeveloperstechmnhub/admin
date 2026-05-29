import React, { useEffect, useMemo, useState } from "react";
import { Download, QrCode, RefreshCw, Search, ScanLine, UserCheck, UserX } from "lucide-react";
import EventAdminLayout from "../components/EventAdminLayout";
import { downloadFile, requestJson } from "../utils/eventApi";

export default function EventRegistrations() {
  const [registrations, setRegistrations] = useState([]);
  const [events, setEvents] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ q: "", eventId: "", pass: "all", paymentStatus: "all", status: "all", page: 1 });
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const query = useMemo(() => {
    const params = new URLSearchParams({ page: String(filters.page), limit: "15" });
    Object.entries(filters).forEach(([key, value]) => {
      if (value && !["page"].includes(key) && value !== "all") params.set(key, value);
    });
    return params.toString();
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [registrationData, eventData, analyticsData] = await Promise.all([
        requestJson(`/events/registrations?${query}`),
        requestJson("/events?limit=100"),
        requestJson(`/events/analytics/summary${filters.eventId ? `?eventId=${filters.eventId}` : ""}`),
      ]);
      setRegistrations(registrationData.items || []);
      setPagination(registrationData.pagination || { page: 1, totalPages: 1, total: 0 });
      setEvents(eventData.items || eventData || []);
      setAnalytics(analyticsData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData().catch((err) => alert(err.message));
  }, [query]);

  const updateRegistration = async (id, body) => {
    await requestJson(`/events/registrations/${id}`, { method: "PUT", body: JSON.stringify(body) });
    await loadData();
  };

  const markAttendance = async (id) => {
    try {
      await requestJson(`/admin/users/${id}/checkin?allowEarlyCheckin=1`, { method: "PUT" });
      await loadData();
    } catch (err) {
      alert(err.message || "Failed to mark attendance");
    }
  };

  const exportData = async (format) => {
    await downloadFile(`/events/registrations/export?${query}&format=${format}`, `event-registrations.${format}`);
  };

  return (
    <EventAdminLayout
      title="Event Registrations"
      subtitle="Approve students, track payment, export reports, and mark attendance."
      actions={
        <div className="event-form-actions">
          <button className="event-btn ghost" type="button" onClick={() => exportData("csv")}><Download size={16} /> Export CSV</button>
          <button className="event-btn ghost" type="button" onClick={() => exportData("pdf")}><Download size={16} /> Export PDF</button>
          <button className="event-btn" type="button"><ScanLine size={16} /> Attendance Scanner</button>
        </div>
      }
    >
      <section className="analytics-grid">
        <div className="event-card analytics-card"><span>Total registrations</span><strong>{analytics?.totalRegistrations || 0}</strong></div>
        <div className="event-card analytics-card"><span>Revenue generated</span><strong>Rs {analytics?.revenue || 0}</strong></div>
        <div className="event-card analytics-card"><span>Seat occupancy</span><strong>{analytics?.seatOccupancy || 0}%</strong></div>
        <div className="event-card analytics-card"><span>Conversion rate</span><strong>{analytics?.conversionRate || 0}%</strong></div>
      </section>

      <section className="event-card event-toolbar">
        <label><Search size={16} /> Search students<input className="event-input" value={filters.q} onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value, page: 1 }))} /></label>
        <label>Event<select className="event-select" value={filters.eventId} onChange={(e) => setFilters((prev) => ({ ...prev, eventId: e.target.value, page: 1 }))}><option value="">All events</option>{events.map((event) => <option key={event._id} value={event._id}>{event.title || event.name}</option>)}</select></label>
        <label>Payment<select className="event-select" value={filters.paymentStatus} onChange={(e) => setFilters((prev) => ({ ...prev, paymentStatus: e.target.value, page: 1 }))}><option value="all">All</option><option value="paid">Paid</option><option value="pending">Pending</option><option value="failed">Failed</option></select></label>
        <button className="event-btn" type="button" onClick={loadData}><RefreshCw size={16} /> Refresh</button>
      </section>

      <section className="event-panel">
        <div className="event-table-wrap">
          <table className="event-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Parent / Contact</th>
                <th>School</th>
                <th>Pass</th>
                <th>Payment</th>
                <th>Registration</th>
                <th>Attendance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8">Loading registrations...</td></tr>
              ) : registrations.length === 0 ? (
                <tr><td colSpan="8">No registrations found.</td></tr>
              ) : registrations.map((item) => (
                <tr key={item._id}>
                  <td><strong>{item.fullName}</strong><div>{item.email}</div><div>{item.city}</div></td>
                  <td>{item.parentName || "N/A"}<div>{item.mobile}</div></td>
                  <td>{item.school || item.college || "N/A"}<div>{item.className || item.courseYear}</div></td>
                  <td>{item.passName || "N/A"}</td>
                  <td><span className={`status-pill ${item.paymentStatus}`}>{item.paymentStatus}</span></td>
                  <td><span className={`status-pill ${item.registrationStatus}`}>{item.registrationStatus || "pending"}</span><div>{item.createdAt ? new Date(item.createdAt).toLocaleString() : "N/A"}</div></td>
                  <td><span className={`status-pill ${item.checkedIn ? "approved" : "pending"}`}>{item.checkedIn ? "Present" : "Pending"}</span></td>
                  <td>
                    <div className="inline-actions">
                      <button className="event-btn success" type="button" onClick={() => updateRegistration(item._id, { registrationStatus: "approved" })}><UserCheck size={15} /></button>
                      <button className="event-btn danger" type="button" onClick={() => updateRegistration(item._id, { registrationStatus: "rejected" })}><UserX size={15} /></button>
                      <button className="event-btn ghost" type="button" onClick={() => markAttendance(item._id)} title="Mark attendance"><QrCode size={15} /></button>
                      <button className="event-btn ghost" type="button" onClick={() => setSelected(item)}>View</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pagination-row">
          <span>{pagination.total} registrations</span>
          <div className="inline-actions">
            <button className="event-btn ghost" disabled={filters.page <= 1} onClick={() => setFilters((prev) => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}>Previous</button>
            <span>Page {pagination.page} of {pagination.totalPages}</span>
            <button className="event-btn ghost" disabled={filters.page >= pagination.totalPages} onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}>Next</button>
          </div>
        </div>
      </section>

      <section className="event-panel" style={{ padding: 18, marginTop: 18 }}>
        <h2>Daily Registration Graph</h2>
        <div className="graph-bars">
          {(analytics?.dailyRegistrations || []).map((item) => (
            <div key={item.date} className="graph-bar" title={`${item.date}: ${item.registrations}`} style={{ height: `${Math.max(item.registrations * 18, 12)}px` }} />
          ))}
        </div>
      </section>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content wide-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selected.fullName}</h3>
              <button className="close-btn" onClick={() => setSelected(null)}>Close</button>
            </div>
            <div className="detail-grid grid-3col">
              {Object.entries({
                "Student name": selected.fullName,
                "Parent name": selected.parentName,
                Phone: selected.mobile,
                Email: selected.email,
                School: selected.school || selected.college,
                Class: selected.className || selected.courseYear,
                City: selected.city,
                "Selected pass": selected.passName,
                "Payment status": selected.paymentStatus,
                "Registration ID": selected.registrationId,
                "QR placeholder": selected.qrPlaceholder || selected.qrCode || "Ready for scanner integration",
              }).map(([label, value]) => (
                <div className="detail-section" key={label}>
                  <h4>{label}</h4>
                  <p>{value || "N/A"}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </EventAdminLayout>
  );
}
