import React from "react";
import { Link, NavLink } from "react-router-dom";
import { BarChart3, CalendarDays, LayoutDashboard, Plus, Users } from "lucide-react";
import "../pages/EventManagement.css";

export default function EventAdminLayout({ title, subtitle, actions, children }) {
  return (
    <div className="event-admin-shell">
      <header className="event-admin-topbar">
        <div className="event-admin-brand">
          <Link className="event-admin-brand-mark" to="/admin">
            TMH
          </Link>
          <div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
        </div>

        <nav className="event-admin-nav">
          <NavLink className="event-btn ghost" to="/admin">
            <LayoutDashboard size={16} /> Dashboard
          </NavLink>
          <NavLink className="event-btn ghost" to="/admin/events">
            <CalendarDays size={16} /> Events
          </NavLink>
          <NavLink className="event-btn ghost" to="/admin/event-registrations">
            <Users size={16} /> Registrations
          </NavLink>
          <NavLink className="event-btn primary" to="/admin/events/create">
            <Plus size={16} /> Add Event
          </NavLink>
        </nav>
      </header>

      {actions && <div className="event-admin-actions">{actions}</div>}
      {children}

      <div style={{ marginTop: 18, color: "#64748b", display: "flex", gap: 8, alignItems: "center" }}>
        <BarChart3 size={16} /> Live counters, drafts, analytics, exports, and attendance tools are connected to admin APIs.
      </div>
    </div>
  );
}
