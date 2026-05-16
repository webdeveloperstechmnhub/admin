import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Users,
  Calendar,
  CreditCard,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Download,
  Trash2,
  Edit,
  ChevronLeft,
  ChevronRight,
  LogOut,
  RefreshCw,
  UserCheck,
  UserX,
  Award,
  TrendingUp,
  DollarSign,
  XCircle,
  Eye,
  Link as LinkIcon,
  Users as TeamIcon,
  Building2,
} from "lucide-react";
import "./AdminDashboard.css";

const ADMIN_ACTIVE_PAGE_KEY = "adminActivePage";
const VALID_PAGES = new Set(["dashboard", "events", "employees", "institutes", "participants", "student-management", "session-bookings", "analytics"]);

const extractNumber = (value, fallback = 0) => {
  const num = Number(value);
  if (Number.isFinite(num) && num >= 0) return num;

  if (typeof value === "string") {
    const match = value.match(/\d+/);
    if (match) return Number(match[0]);
  }

  return fallback;
};

const createTicketTypeRow = (overrides = {}) => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  name: "",
  price: "0",
  total: "0",
  appliesTo: "All",
  description: "",
  ...overrides,
});

const createReferralCodeRow = (overrides = {}) => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  code: "",
  discountType: "flat",
  discountValue: "0",
  maxUses: "0",
  active: true,
  usedCount: 0,
  ...overrides,
});

const createEmptyEventForm = () => ({
  name: "",
  shortName: "",
  date: "",
  day: "",
  time: "",
  location: "",
  venue: "",
  city: "",
  organizer: "TechMNHub",
  expectedParticipants: "",
  skillZones: "",
  prizes: "",
  description: "",
  highlights: "",
  categories: "",
  tags: "",
  registrationDeadline: "",
  refundPolicy: "",
  registrationLink: "",
  contactEmail: "",
  contactPhone: "",
  referralCodes: [],
  status: "published",
  ticketTypes: [
    createTicketTypeRow({
      name: "Pro Participation",
      price: "150",
      total: "0",
      appliesTo: "Participation",
    }),
    createTicketTypeRow({
      name: "Visitor Pass",
      price: "150",
      total: "0",
      appliesTo: "Visitor",
    }),
  ],
});

const mapEventToForm = (event) => ({
  name: event.name || "",
  shortName: event.shortName || "",
  date: event.date || "",
  day: event.day || "",
  time: event.time || "",
  location: event.location || "",
  venue: event.venue || "",
  city: event.city || "",
  organizer: event.organizer || "TechMNHub",
  expectedParticipants: event.expectedParticipants || "",
  skillZones: event.skillZones || "",
  prizes: event.prizes || "",
  description: event.description || "",
  highlights: Array.isArray(event.highlights) ? event.highlights.join(", ") : "",
  categories: Array.isArray(event.categories) ? event.categories.join(", ") : "",
  tags: Array.isArray(event.tags) ? event.tags.join(", ") : "",
  registrationDeadline: event.registrationDeadline || "",
  refundPolicy: event.refundPolicy || "",
  registrationLink: event.registrationLink || "",
  contactEmail: event.contact?.email || "",
  contactPhone: event.contact?.phone || "",
  status: event.status || "published",
  referralCodes: Array.isArray(event.referralCodes)
    ? event.referralCodes.map((referral) =>
        createReferralCodeRow({
          code: referral.code || "",
          discountType: referral.discountType === "percent" ? "percent" : "flat",
          discountValue: String(referral.discountValue ?? 0),
          maxUses: String(referral.maxUses ?? 0),
          active: referral.active !== false,
          usedCount: referral.usedCount || 0,
        }),
      )
    : [],
  ticketTypes:
    Array.isArray(event.ticketTypes) && event.ticketTypes.length > 0
      ? event.ticketTypes.map((ticketType) =>
          createTicketTypeRow({
            name: ticketType.name || "",
            price: String(ticketType.price ?? 0),
            total: String(ticketType.total ?? 0),
            appliesTo: ticketType.appliesTo || "All",
            description: ticketType.description || "",
          }),
        )
      : [
          createTicketTypeRow({
            name: "Pro Participation",
            price: String(event.ticketInventory?.pro?.price ?? extractNumber(event.entryFee?.pro, 150)),
            total: String(event.ticketInventory?.pro?.total ?? 0),
            appliesTo: "Participation",
          }),
          createTicketTypeRow({
            name: "Visitor Pass",
            price: String(event.ticketInventory?.visitor?.price ?? extractNumber(event.entryFee?.visitor, 150)),
            total: String(event.ticketInventory?.visitor?.total ?? 0),
            appliesTo: "Visitor",
          }),
        ],
});

const buildEventPayload = (eventForm) => {
  const normalizedTicketTypes = (eventForm.ticketTypes || [])
    .map((ticketType) => ({
      name: String(ticketType.name || "").trim(),
      price: extractNumber(ticketType.price, 0),
      total: extractNumber(ticketType.total, 0),
      appliesTo: ["Participation", "Visitor", "All"].includes(ticketType.appliesTo)
        ? ticketType.appliesTo
        : "All",
      description: String(ticketType.description || "").trim(),
    }))
    .filter((ticketType) => ticketType.name);

  return {
    name: eventForm.name || eventForm.shortName,
    shortName: eventForm.shortName,
    date: eventForm.date,
    day: eventForm.day,
    time: eventForm.time,
    location: eventForm.location,
    venue: eventForm.venue,
    city: eventForm.city,
    organizer: eventForm.organizer,
    expectedParticipants: eventForm.expectedParticipants,
    skillZones: eventForm.skillZones,
    prizes: eventForm.prizes,
    description: eventForm.description,
    highlights: eventForm.highlights,
    categories: eventForm.categories,
    tags: eventForm.tags,
    registrationDeadline: eventForm.registrationDeadline,
    refundPolicy: eventForm.refundPolicy,
    registrationLink: eventForm.registrationLink,
    contact: {
      email: eventForm.contactEmail,
      phone: eventForm.contactPhone,
    },
    status: eventForm.status || "published",
    referralCodes: (eventForm.referralCodes || [])
      .map((referral) => ({
        code: String(referral.code || "").trim().toUpperCase(),
        discountType: referral.discountType === "percent" ? "percent" : "flat",
        discountValue: extractNumber(referral.discountValue, 0),
        maxUses: extractNumber(referral.maxUses, 0),
        active: referral.active !== false,
        usedCount: extractNumber(referral.usedCount, 0),
      }))
      .filter((referral) => referral.code),
    ticketTypes: normalizedTicketTypes,
  };
};

const createEmptyEmployeeForm = () => ({
  name: "",
  empId: "",
  photoUrl: "",
  mobile: "",
  email: "",
  joiningDate: "",
  designation: "",
  department: "",
  description: "",
});

const mapEmployeeToForm = (employee) => ({
  name: employee.name || "",
  empId: employee.empId || "",
  photoUrl: employee.photoUrl || "",
  mobile: employee.mobile || "",
  email: employee.email || "",
  joiningDate: employee.joiningDate ? String(employee.joiningDate).slice(0, 10) : "",
  designation: employee.designation || "",
  department: employee.department || "",
  description: employee.description || "",
});

const buildEmployeeQrPayload = (employee) => {
  const empId = String(employee?.empId || "").trim();
  if (!empId) return "";

  const envVerifyPage = String(import.meta.env.VITE_EMPLOYEE_VERIFY_URL || "").trim();
  const fallbackVerifyPage =
    typeof window !== "undefined" && window.location.hostname === "localhost"
      ? "http://localhost:5173/employee-card"
      : "https://www.techmnhub.com/employee-card";
  const verifyPage = envVerifyPage || fallbackVerifyPage;

  try {
    const normalizedVerifyPage = /^https?:\/\//i.test(verifyPage)
      ? verifyPage
      : `https://${verifyPage}`;

    const verifyUrl = new URL(normalizedVerifyPage);
    verifyUrl.searchParams.set("empId", empId);
    verifyUrl.searchParams.set("registrationId", empId);
    return verifyUrl.toString();
  } catch {
    return `${fallbackVerifyPage}?empId=${encodeURIComponent(empId)}&registrationId=${encodeURIComponent(empId)}`;
  }
};

const buildEmployeeQrUrl = (employee) => {
  const payload = buildEmployeeQrPayload(employee);
  if (!payload) return "";
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(payload)}`;
};

const getEmployeePhoto = (employee) => String(employee?.photoUrl || "").trim();
const getEmployeeEmploymentStatus = (employee) =>
  String(employee?.employmentStatus || "active").trim().toLowerCase() === "terminated"
    ? "terminated"
    : "active";
const isEmployeeTerminated = (employee) => getEmployeeEmploymentStatus(employee) === "terminated";
const getEmployeeStatusLabel = (employee) =>
  isEmployeeTerminated(employee) ? "Terminated" : "Active";

const inferDbNameFromUri = (uri) => {
  try {
    const parsed = new URL(uri);
    return parsed.pathname.replace(/^\//, "").trim();
  } catch {
    return "";
  }
};

export default function AdminDashboard({ onLogout }) {
  // States
  const [activePage, setActivePage] = useState(() => {
    const savedPage = localStorage.getItem(ADMIN_ACTIVE_PAGE_KEY);
    return VALID_PAGES.has(savedPage) ? savedPage : "dashboard";
  });
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterEvent, setFilterEvent] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventSubmitting, setEventSubmitting] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [institutes, setInstitutes] = useState([]);
  const [institutesLoading, setInstitutesLoading] = useState(false);
  const [studentSignups, setStudentSignups] = useState([]);
  const [studentSignupsLoading, setStudentSignupsLoading] = useState(false);
  const [employeePage, setEmployeePage] = useState(1);
  const [employeeTotal, setEmployeeTotal] = useState(0);
  const [employeeTotalPages, setEmployeeTotalPages] = useState(1);
  const [employeeSubmitting, setEmployeeSubmitting] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState(null);
  const [employeeForm, setEmployeeForm] = useState(createEmptyEmployeeForm());
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employeeSort, setEmployeeSort] = useState("latest");
  const [studentSignupSearch, setStudentSignupSearch] = useState("");
  const [studentSignupStatus, setStudentSignupStatus] = useState("pending");
  const [studentSignupSubmitting, setStudentSignupSubmitting] = useState(false);
  const [sessionBookings, setSessionBookings] = useState([]);
  const [sessionBookingsLoading, setSessionBookingsLoading] = useState(false);
  const [sessionBookingFilter, setSessionBookingFilter] = useState("all");
  const [sessionSearch, setSessionSearch] = useState("");
  const [sessionSavingId, setSessionSavingId] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showEntriesModal, setShowEntriesModal] = useState(false);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [selectedEventForEntries, setSelectedEventForEntries] = useState(null);
  const [selectedEventEntries, setSelectedEventEntries] = useState([]);
  const [eventForm, setEventForm] = useState(createEmptyEventForm());
  const [notice, setNotice] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [cloneForm, setCloneForm] = useState({
    sourceUri: "",
    sourceDbName: "",
    destinationUri: "",
    destinationDbName: "",
    collections: "",
  });
  const [cloneSubmitting, setCloneSubmitting] = useState(false);
  const [exportSubmitting, setExportSubmitting] = useState(false);
  const [cloneResult, setCloneResult] = useState(null);
  const [explorerForm, setExplorerForm] = useState({
    sourceUri: "",
  });
  const [explorerLoading, setExplorerLoading] = useState(false);
  const [databaseOverview, setDatabaseOverview] = useState(null);
  const [selectedDatabaseName, setSelectedDatabaseName] = useState("");
  const [selectedCollectionName, setSelectedCollectionName] = useState("");
  const [collectionPreview, setCollectionPreview] = useState(null);
  const itemsPerPage = 10;
  const employeeItemsPerPage = 20;

  // Fetch data on mount
  const location = useLocation();

  useEffect(() => {
    fetchData();
    fetchStats();
    fetchEvents();
  }, []);

  useEffect(() => {
    if (location.pathname === "/admin/session-bookings") {
      setActivePage("session-bookings");
    }
  }, [location.pathname]);

  useEffect(() => {
    if (activePage !== "employees") {
      return undefined;
    }

    const timerId = setTimeout(() => {
      fetchEmployees();
    }, 250);

    return () => clearTimeout(timerId);
  }, [activePage, employeePage, employeeSearch, employeeSort]);

  useEffect(() => {
    if (activePage !== "institutes") {
      return undefined;
    }

    fetchInstitutes();
    return undefined;
  }, [activePage]);

  useEffect(() => {
    if (activePage !== "student-management") {
      return undefined;
    }

    fetchStudentSignups();
    return undefined;
  }, [activePage]);

  useEffect(() => {
    if (activePage !== "session-bookings") {
      return undefined;
    }

    fetchSessionBookings();
    return undefined;
  }, [activePage, sessionBookingFilter]);

  useEffect(() => {
    localStorage.setItem(ADMIN_ACTIVE_PAGE_KEY, activePage);
  }, [activePage]);

  useEffect(() => {
    if (!notice) return undefined;

    const timerId = setTimeout(() => {
      setNotice(null);
    }, 3500);

    return () => clearTimeout(timerId);
  }, [notice]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterCategory, filterEvent]);

  const showNotice = (type, message) => {
    setNotice({
      id: Date.now(),
      type,
      message,
    });
  };

  const parseResponseData = async (res) => {
    const contentType = String(res.headers.get("content-type") || "").toLowerCase();

    if (contentType.includes("application/json")) {
      try {
        return await res.json();
      } catch {
        return {};
      }
    }

    const text = await res.text().catch(() => "");
    if (text && !text.trim().startsWith("<!DOCTYPE")) {
      return { msg: text };
    }

    return { msg: "API returned an invalid response. Verify backend URL and routes." };
  };

  const handleUnauthorizedResponse = (res, fallbackMsg) => {
    if (res.status !== 401) {
      return false;
    }

    localStorage.removeItem("adminToken");
    showNotice("error", fallbackMsg || "Session expired. Please sign in again.");
    onLogout(false);
    return true;
  };

  const resetParticipantFilters = () => {
    setSearchTerm("");
    setFilterStatus("all");
    setFilterCategory("all");
    setFilterEvent("all");
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await parseResponseData(res);
      if (handleUnauthorizedResponse(res)) return;
      if (res.ok) {
        setUsers(data);
      } else {
        showNotice("error", data.msg || "Failed to load participants.");
      }
    } catch (err) {
      console.error(err);
      showNotice("error", "Failed to load participants.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await parseResponseData(res);
      if (handleUnauthorizedResponse(res)) return;
      if (res.ok) {
        setStats(data);
      } else {
        showNotice("error", data.msg || "Failed to load dashboard stats.");
      }
    } catch (err) {
      console.error(err);
      showNotice("error", "Failed to load dashboard stats.");
    }
  };

  const fetchEvents = async () => {
    try {
      setEventsLoading(true);
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/events`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await parseResponseData(res);
      if (handleUnauthorizedResponse(res)) return;
      if (res.ok) {
        setEvents(Array.isArray(data) ? data : Array.isArray(data.items) ? data.items : []);
      } else {
        showNotice("error", data.msg || "Failed to load events.");
      }
    } catch (err) {
      console.error(err);
      showNotice("error", "Failed to load events.");
    } finally {
      setEventsLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      setEmployeesLoading(true);
      const token = localStorage.getItem("adminToken");
      const params = new URLSearchParams({
        page: String(employeePage),
        limit: String(employeeItemsPerPage),
        sort: employeeSort,
      });

      const search = employeeSearch.trim();
      if (search) {
        params.set("q", search);
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/employees?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await parseResponseData(res);
      if (handleUnauthorizedResponse(res)) return;
      if (res.ok) {
        if (Array.isArray(data)) {
          setEmployees(data);
          setEmployeeTotal(data.length);
          setEmployeeTotalPages(1);
          return;
        }

        const items = Array.isArray(data.items) ? data.items : [];
        const total = Number(data.pagination?.total) || items.length;
        const totalPages = Number(data.pagination?.totalPages) || 1;

        setEmployees(items);
        setEmployeeTotal(total);
        setEmployeeTotalPages(totalPages);
      } else {
        showNotice("error", data.msg || "Failed to load employees.");
      }
    } catch (err) {
      console.error(err);
      showNotice("error", "Failed to load employees.");
    } finally {
      setEmployeesLoading(false);
    }
  };

  const fetchInstitutes = async () => {
    try {
      setInstitutesLoading(true);
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/institutes`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await parseResponseData(res);
      if (handleUnauthorizedResponse(res)) return;
      if (res.ok) {
        setInstitutes(Array.isArray(data) ? data : []);
      } else {
        showNotice("error", data.msg || "Failed to load institutes.");
      }
    } catch (err) {
      console.error(err);
      showNotice("error", "Failed to load institutes.");
    } finally {
      setInstitutesLoading(false);
    }
  };

  const fetchStudentSignups = async () => {
    try {
      setStudentSignupsLoading(true);
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/student-signups`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await parseResponseData(res);
      if (handleUnauthorizedResponse(res)) return;
      if (res.ok) {
        setStudentSignups(Array.isArray(data) ? data : []);
      } else {
        showNotice("error", data.msg || "Failed to load student signups.");
      }
    } catch (err) {
      console.error(err);
      showNotice("error", "Failed to load student signups.");
    } finally {
      setStudentSignupsLoading(false);
    }
  };

  const fetchSessionBookings = async () => {
    try {
      setSessionBookingsLoading(true);
      const token = localStorage.getItem("adminToken");
      const params = new URLSearchParams();
      if (sessionBookingFilter !== "all") {
        params.set("status", sessionBookingFilter);
      }
      const endpoint = `${import.meta.env.VITE_API_URL}/sessions${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await parseResponseData(res);
      if (handleUnauthorizedResponse(res)) return;
      if (res.ok) {
        setSessionBookings(Array.isArray(data.bookings) ? data.bookings : []);
      } else {
        showNotice("error", data.msg || "Failed to load session bookings.");
      }
    } catch (err) {
      console.error(err);
      showNotice("error", "Failed to load session bookings.");
    } finally {
      setSessionBookingsLoading(false);
    }
  };

  const updateSessionBooking = async (id, payload) => {
    if (!id) return;
    setSessionSavingId(id);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/sessions/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await parseResponseData(res);
      if (handleUnauthorizedResponse(res)) return;
      if (res.ok) {
        setSessionBookings((current) => current.map((item) => (item._id === id ? data.booking : item)));
        showNotice("success", "Booking updated successfully.");
      } else {
        showNotice("error", data.msg || "Failed to update booking.");
      }
    } catch (err) {
      console.error(err);
      showNotice("error", "Failed to update booking.");
    } finally {
      setSessionSavingId("");
    }
  };

  const deleteSessionBooking = async (id) => {
    if (!id) return;
    setSessionSavingId(id);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/sessions/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await parseResponseData(res);
      if (handleUnauthorizedResponse(res)) return;
      if (res.ok) {
        setSessionBookings((current) => current.filter((item) => item._id !== id));
        showNotice("success", "Booking deleted successfully.");
      } else {
        showNotice("error", data.msg || "Failed to delete booking.");
      }
    } catch (err) {
      console.error(err);
      showNotice("error", "Failed to delete booking.");
    } finally {
      setSessionSavingId("");
    }
  };

  const filteredSessionBookings = useMemo(() => {
    const term = sessionSearch.trim().toLowerCase();
    if (!term) return sessionBookings;
    return sessionBookings.filter((booking) =>
      [booking.topic, booking.instituteName, booking.department, booking.city, booking.contactName, booking.email, booking.phone, booking.mode, booking.audience]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    );
  }, [sessionBookings, sessionSearch]);

  const sessionBookingCounts = useMemo(() => {
    const summary = {
      total: sessionBookings.length,
      pending: 0,
      confirmed: 0,
      rescheduled: 0,
      completed: 0,
      cancelled: 0,
    };
    sessionBookings.forEach((booking) => {
      const status = String(booking.status || "pending").toLowerCase();
      if (Object.prototype.hasOwnProperty.call(summary, status)) {
        summary[status] += 1;
      }
    });
    return summary;
  }, [sessionBookings]);

  const handleResetSessionFilters = () => {
    setSessionSearch("");
    setSessionBookingFilter("all");
  };

  const handleStudentSignupReview = async (signup, status) => {
    if (!signup?._id || !status) {
      return;
    }

    if (status === "rejected" && !window.confirm(`Reject signup request for ${signup.fullName}?`)) {
      return;
    }

    try {
      setStudentSignupSubmitting(true);
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/student-signups/${encodeURIComponent(signup._id)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = await parseResponseData(res);
      if (handleUnauthorizedResponse(res)) return;
      if (!res.ok) {
        showNotice("error", data.msg || "Failed to update student signup.");
        return;
      }

      await fetchStudentSignups();
      showNotice("success", data.msg || `Student signup ${status}.`);
    } catch (err) {
      console.error(err);
      showNotice("error", "Failed to update student signup.");
    } finally {
      setStudentSignupSubmitting(false);
    }
  };

  const handleCloneInput = (e) => {
    const { name, value } = e.target;
    setCloneForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCloneSubmit = async (e) => {
    e.preventDefault();

    const sourceUri = cloneForm.sourceUri.trim();
    const sourceDbName = cloneForm.sourceDbName.trim();
    const destinationUri = cloneForm.destinationUri.trim();
    const destinationDbName = cloneForm.destinationDbName.trim();
    const collectionsText = cloneForm.collections.trim();
    const inferredSourceDbName = inferDbNameFromUri(sourceUri);
    const inferredDestinationDbName = inferDbNameFromUri(destinationUri);
    const selectedCollections = collectionsText
      ? collectionsText
          .split(",")
          .map((name) => name.trim())
          .filter(Boolean)
      : [];

    if (!sourceUri) {
      showNotice("warning", "Enter the old MongoDB URI first.");
      return;
    }

    if (!destinationUri) {
      showNotice("warning", "Enter the new MongoDB URI as destination.");
      return;
    }

    if (!sourceDbName && !inferredSourceDbName) {
      showNotice("warning", "Enter the old database name when it is not part of the URI.");
      return;
    }

    if (!destinationDbName && !inferredDestinationDbName) {
      showNotice("warning", "Enter the new database name when it is not part of the URI.");
      return;
    }

    const resolvedSourceDbName = sourceDbName || inferredSourceDbName;
    const resolvedDestinationDbName = destinationDbName || inferredDestinationDbName;

    if (sourceUri === destinationUri && resolvedSourceDbName === resolvedDestinationDbName) {
      showNotice("warning", "Source and destination cannot be the same database.");
      return;
    }

    if (
      !window.confirm(
        "This will copy every collection from the old database into the new database using upserts by _id. Continue?",
      )
    ) {
      return;
    }

    try {
      setCloneSubmitting(true);
      setCloneResult(null);

      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/database-clone`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sourceUri,
          sourceDbName: resolvedSourceDbName,
          destinationUri,
          destinationDbName: resolvedDestinationDbName,
          collections: selectedCollections,
        }),
      });

      const data = await parseResponseData(res);
      if (handleUnauthorizedResponse(res)) return;

      if (!res.ok) {
        showNotice("error", data.msg || "Failed to clone database.");
        return;
      }

      setCloneResult(data);
      await Promise.all([fetchData(), fetchStats(), fetchEvents(), fetchEmployees()]);
      showNotice("success", data.msg || "Database cloned successfully.");
    } catch (err) {
      console.error(err);
      showNotice("error", "Failed to clone database.");
    } finally {
      setCloneSubmitting(false);
    }
  };

  const handleExportData = async () => {
    const sourceUri = cloneForm.sourceUri.trim();
    const sourceDbName = cloneForm.sourceDbName.trim();
    const collectionsText = cloneForm.collections.trim();
    const inferredSourceDbName = inferDbNameFromUri(sourceUri);
    const selectedCollections = collectionsText
      ? collectionsText
          .split(",")
          .map((name) => name.trim())
          .filter(Boolean)
      : [];

    if (!sourceUri) {
      showNotice("warning", "Enter the old MongoDB URI first.");
      return;
    }

    if (!sourceDbName && !inferredSourceDbName) {
      showNotice("warning", "Enter the old database name when it is not part of the URI.");
      return;
    }

    try {
      setExportSubmitting(true);

      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/database-export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sourceUri,
          sourceDbName: sourceDbName || inferredSourceDbName,
          collections: selectedCollections,
        }),
      });

      const data = await parseResponseData(res);
      if (handleUnauthorizedResponse(res)) return;

      if (!res.ok) {
        showNotice("error", data.msg || "Failed to export database data.");
        return;
      }

      let downloadPayload = data;
      let fileName = `db-export-${data.sourceDbName || "source"}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;

      // If a single collection was requested, export plain documents only.
      if (selectedCollections.length === 1) {
        const collectionName = selectedCollections[0];
        if (data?.data && Object.prototype.hasOwnProperty.call(data.data, collectionName)) {
          downloadPayload = data.data[collectionName];
          fileName = `${collectionName}-data-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
        }
      }

      const blob = new Blob([JSON.stringify(downloadPayload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      showNotice("success", `Exported ${data.collections?.length || 0} collection(s) to JSON.`);
    } catch (err) {
      console.error(err);
      showNotice("error", "Failed to export database data.");
    } finally {
      setExportSubmitting(false);
    }
  };

  const handleExplorerInput = (e) => {
    const { name, value } = e.target;
    setExplorerForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const loadDatabaseOverview = async (sourceUri) => {
    const token = localStorage.getItem("adminToken");
    const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/database-overview`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ sourceUri }),
    });

    const data = await parseResponseData(res);
    if (handleUnauthorizedResponse(res)) return null;

    if (!res.ok) {
      throw new Error(data.msg || "Failed to load database overview.");
    }

    return data;
  };

  const loadCollectionPreview = async (sourceUri, databaseName, collectionName) => {
    const token = localStorage.getItem("adminToken");
    const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/database-collection-preview`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        sourceUri,
        databaseName,
        collectionName,
        limit: 10,
      }),
    });

    const data = await parseResponseData(res);
    if (handleUnauthorizedResponse(res)) return null;

    if (!res.ok) {
      throw new Error(data.msg || "Failed to load collection preview.");
    }

    return data;
  };

  const handleLoadExplorer = async (e) => {
    e.preventDefault();

    const sourceUri = explorerForm.sourceUri.trim();
    if (!sourceUri) {
      showNotice("warning", "Enter the source MongoDB URI first.");
      return;
    }

    try {
      setExplorerLoading(true);
      setCollectionPreview(null);
      setSelectedDatabaseName("");
      setSelectedCollectionName("");

      const overview = await loadDatabaseOverview(sourceUri);
      if (!overview) return;

      setDatabaseOverview(overview);
      showNotice("success", `Loaded ${overview.databases?.length || 0} database(s).`);
    } catch (err) {
      console.error(err);
      showNotice("error", err.message || "Failed to load database overview.");
    } finally {
      setExplorerLoading(false);
    }
  };

  const handleSelectDatabase = async (databaseName) => {
    const sourceUri = explorerForm.sourceUri.trim();
    setSelectedDatabaseName(databaseName);
    setSelectedCollectionName("");
    setCollectionPreview(null);

    const db = (databaseOverview?.allDatabases || []).find((item) => item.name === databaseName);
    if (!db || !db.collections?.length) {
      showNotice("warning", "This database has no collections to preview.");
      return;
    }

    try {
      setExplorerLoading(true);
      const preview = await loadCollectionPreview(sourceUri, databaseName, db.collections[0].name);
      if (!preview) return;

      setSelectedCollectionName(preview.collectionName);
      setCollectionPreview(preview);
    } catch (err) {
      console.error(err);
      showNotice("error", err.message || "Failed to load collection preview.");
    } finally {
      setExplorerLoading(false);
    }
  };

  const handleSelectCollection = async (databaseName, collectionName) => {
    const sourceUri = explorerForm.sourceUri.trim();
    try {
      setExplorerLoading(true);
      setSelectedDatabaseName(databaseName);
      setSelectedCollectionName(collectionName);

      const preview = await loadCollectionPreview(sourceUri, databaseName, collectionName);
      if (!preview) return;

      setCollectionPreview(preview);
    } catch (err) {
      console.error(err);
      showNotice("error", err.message || "Failed to load collection preview.");
    } finally {
      setExplorerLoading(false);
    }
  };

  const handleEventInput = (e) => {
    const { name, value } = e.target;
    setEventForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTicketTypeChange = (ticketTypeId, field, value) => {
    setEventForm((prev) => ({
      ...prev,
      ticketTypes: prev.ticketTypes.map((ticketType) =>
        ticketType.id === ticketTypeId
          ? { ...ticketType, [field]: value }
          : ticketType,
      ),
    }));
  };

  const handleAddTicketType = () => {
    setEventForm((prev) => ({
      ...prev,
      ticketTypes: [...prev.ticketTypes, createTicketTypeRow()],
    }));
  };

  const handleRemoveTicketType = (ticketTypeId) => {
    setEventForm((prev) => ({
      ...prev,
      ticketTypes:
        prev.ticketTypes.length > 1
          ? prev.ticketTypes.filter((ticketType) => ticketType.id !== ticketTypeId)
          : prev.ticketTypes,
    }));
  };

  const handleAddReferralCode = () => {
    setEventForm((prev) => ({
      ...prev,
      referralCodes: [...(prev.referralCodes || []), createReferralCodeRow()],
    }));
  };

  const handleReferralCodeChange = (referralId, field, value) => {
    setEventForm((prev) => ({
      ...prev,
      referralCodes: (prev.referralCodes || []).map((referral) =>
        referral.id === referralId
          ? { ...referral, [field]: field === "code" ? String(value).toUpperCase() : value }
          : referral,
      ),
    }));
  };

  const handleRemoveReferralCode = (referralId) => {
    setEventForm((prev) => ({
      ...prev,
      referralCodes: (prev.referralCodes || []).filter((referral) => referral.id !== referralId),
    }));
  };

  const resetEventForm = () => {
    setEditingEventId(null);
    setEventForm(createEmptyEventForm());
  };

  const resetEmployeeForm = () => {
    setEditingEmployeeId(null);
    setEmployeeForm(createEmptyEmployeeForm());
  };

  const handleEmployeeInput = (e) => {
    const { name, value } = e.target;
    setEmployeeForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEmployeePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showNotice("warning", "Please select a valid image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      if (!result) {
        showNotice("error", "Failed to read selected image.");
        return;
      }

      setEmployeeForm((prev) => ({
        ...prev,
        photoUrl: result,
      }));
      showNotice("success", "Employee photo selected.");
    };

    reader.onerror = () => {
      showNotice("error", "Unable to load selected image.");
    };

    reader.readAsDataURL(file);
  };

  const handleEditEmployee = (employee) => {
    setEditingEmployeeId(employee.empId);
    setEmployeeForm(mapEmployeeToForm(employee));
    setActivePage("employees");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();

    if (!employeeForm.empId.trim() || !employeeForm.name.trim()) {
      showNotice("warning", "Employee ID and name are required.");
      return;
    }

    try {
      setEmployeeSubmitting(true);
      const token = localStorage.getItem("adminToken");
      const isEdit = Boolean(editingEmployeeId);
      const endpoint = isEdit
        ? `${import.meta.env.VITE_API_URL}/admin/employees/${encodeURIComponent(editingEmployeeId)}`
        : `${import.meta.env.VITE_API_URL}/admin/employees`;

      const res = await fetch(endpoint, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(employeeForm),
      });

      const data = await parseResponseData(res);
      if (handleUnauthorizedResponse(res)) return;
      if (!res.ok) {
        showNotice("error", data.msg || `Failed to ${isEdit ? "update" : "create"} employee.`);
        return;
      }

      await fetchEmployees();
      resetEmployeeForm();
      showNotice("success", isEdit ? "Employee updated successfully." : "Employee created successfully.");
    } catch (err) {
      console.error(err);
      showNotice("error", `Failed to ${editingEmployeeId ? "update" : "create"} employee.`);
    } finally {
      setEmployeeSubmitting(false);
    }
  };

  const handleDeleteEmployee = async (employee) => {
    if (!confirm(`Delete employee ${employee.name || employee.empId}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/employees/${encodeURIComponent(employee.empId)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await parseResponseData(res);
      if (handleUnauthorizedResponse(res)) return;
      if (!res.ok) {
        showNotice("error", data.msg || "Failed to delete employee.");
        return;
      }

      if (editingEmployeeId === employee.empId) {
        resetEmployeeForm();
      }

      await fetchEmployees();
      showNotice("success", "Employee deleted successfully.");
    } catch (err) {
      console.error(err);
      showNotice("error", "Failed to delete employee.");
    }
  };

  const handleTerminateEmployee = async (employee) => {
    if (isEmployeeTerminated(employee)) {
      showNotice("warning", "Employee is already terminated.");
      return;
    }

    const reasonInput = window.prompt(
      `Enter termination reason for ${employee.name || employee.empId}:`,
      "",
    );

    if (reasonInput === null) {
      return;
    }

    const reason = String(reasonInput).trim();
    if (!reason) {
      showNotice("warning", "Termination reason is required.");
      return;
    }

    if (!confirm(`Terminate employee ${employee.name || employee.empId}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/employees/${encodeURIComponent(employee.empId)}/terminate`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason }),
        },
      );

      const data = await parseResponseData(res);
      if (handleUnauthorizedResponse(res)) return;
      if (!res.ok) {
        showNotice("error", data.msg || "Failed to terminate employee.");
        return;
      }

      if (selectedEmployee?.empId === employee.empId && data.employee) {
        setSelectedEmployee(data.employee);
      }

      await fetchEmployees();

      let successMessage = data.msg || "Employee terminated.";
      if (data.emailStatus === "failed") {
        successMessage += " Termination letter could not be sent.";
      } else if (data.emailStatus === "skipped") {
        successMessage += " Termination letter skipped because employee email is missing.";
      }

      showNotice(data.emailStatus === "failed" ? "warning" : "success", successMessage);
    } catch (err) {
      console.error(err);
      showNotice("error", "Failed to terminate employee.");
    }
  };

  const handleEditEvent = (event) => {
    setEditingEventId(event._id);
    setEventForm(mapEventToForm(event));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();

    if (
      !eventForm.shortName ||
      !eventForm.date ||
      !eventForm.time ||
      !eventForm.venue ||
      !eventForm.city ||
      !eventForm.description
    ) {
      showNotice("warning", "Fill required fields: short name, date, time, venue, city, and description.");
      return;
    }

    if (!(eventForm.ticketTypes || []).some((ticketType) => String(ticketType.name || "").trim())) {
      showNotice("warning", "Add at least one ticket type with a valid name.");
      return;
    }

    try {
      setEventSubmitting(true);
      const token = localStorage.getItem("adminToken");
      const isEdit = Boolean(editingEventId);
      const actionLabel = isEdit ? "update" : "create";
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/events${isEdit ? `/${editingEventId}` : ""}`,
        {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(buildEventPayload(eventForm)),
      },
      );

      const data = await parseResponseData(res);
      if (handleUnauthorizedResponse(res)) return;
      if (!res.ok) {
        showNotice("error", data.msg || `Failed to ${actionLabel} event.`);
        return;
      }

      resetEventForm();
      await fetchEvents();
      showNotice("success", isEdit ? "Event updated successfully." : "Event created successfully.");
    } catch (err) {
      console.error(err);
      showNotice("error", `Failed to ${editingEventId ? "update" : "create"} event.`);
    } finally {
      setEventSubmitting(false);
    }
  };

  const handleDeleteEvent = async (event) => {
    if (!confirm(`Delete event "${event.shortName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/events/${event._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await parseResponseData(res);
      if (handleUnauthorizedResponse(res)) return;
      if (!res.ok) {
        showNotice("error", data.msg || "Failed to delete event.");
        return;
      }

      if (editingEventId === event._id) {
        resetEventForm();
      }

      await fetchEvents();
      showNotice("success", `Event ${event.shortName || ""} deleted.`.trim());
    } catch (err) {
      console.error(err);
      showNotice("error", "Failed to delete event.");
    }
  };

  const handleViewEntries = async (eventId) => {
    try {
      setEntriesLoading(true);
      setShowEntriesModal(true);
      setSelectedEventForEntries(null);
      setSelectedEventEntries([]);

      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/events/${eventId}/entries`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await parseResponseData(res);
      if (handleUnauthorizedResponse(res)) return;
      if (!res.ok) {
        showNotice("error", data.msg || "Failed to load entries.");
        setShowEntriesModal(false);
        return;
      }

      setSelectedEventForEntries(data.event);
      setSelectedEventEntries(data.entries || []);
    } catch (err) {
      console.error(err);
      showNotice("error", "Failed to load entries.");
      setShowEntriesModal(false);
    } finally {
      setEntriesLoading(false);
    }
  };

  const handleCloseEvent = async (eventId) => {
    if (!confirm("Close this event on frontend?")) return;

    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/events/${eventId}/close`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await parseResponseData(res);
      if (handleUnauthorizedResponse(res)) return;
      if (!res.ok) {
        showNotice("error", data.msg || "Failed to close event.");
        return;
      }

      await fetchEvents();
      showNotice("success", "Event closed successfully.");
    } catch (err) {
      console.error(err);
      showNotice("error", "Failed to close event.");
    }
  };

  const handleReopenEvent = async (eventId) => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/events/${eventId}/reopen`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await parseResponseData(res);
      if (handleUnauthorizedResponse(res)) return;
      if (!res.ok) {
        showNotice("error", data.msg || "Failed to reopen event.");
        return;
      }

      await fetchEvents();
      showNotice("success", "Event reopened successfully.");
    } catch (err) {
      console.error(err);
      showNotice("error", "Failed to reopen event.");
    }
  };

  const handlePublishEvent = async (eventId) => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/events/${eventId}/publish`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await parseResponseData(res);
      if (handleUnauthorizedResponse(res)) return;
      if (!res.ok) {
        showNotice("error", data.msg || "Failed to publish event.");
        return;
      }

      await fetchEvents();
      showNotice("success", "Event published on frontend.");
    } catch (err) {
      console.error(err);
      showNotice("error", "Failed to publish event.");
    }
  };

  const handleUnpublishEvent = async (eventId) => {
    if (!confirm("Unpublish this event from frontend?")) return;

    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/events/${eventId}/unpublish`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await parseResponseData(res);
      if (handleUnauthorizedResponse(res)) return;
      if (!res.ok) {
        showNotice("error", data.msg || "Failed to unpublish event.");
        return;
      }

      await fetchEvents();
      showNotice("success", "Event unpublished from frontend.");
    } catch (err) {
      console.error(err);
      showNotice("error", "Failed to unpublish event.");
    }
  };

  // Handle check-in
  const handleCheckIn = async (userId) => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/users/${userId}/checkin`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await parseResponseData(res);
      if (handleUnauthorizedResponse(res)) return;
      if (res.ok) {
        await fetchData();
        await fetchStats();
        showNotice("success", "Participant checked in successfully.");
      } else {
        showNotice("error", data.msg || "Failed to check in participant.");
      }
    } catch (err) {
      console.error(err);
      showNotice("error", "Failed to check in participant.");
    }
  };

  // Handle delete
  const handleDelete = async (userId) => {
    if (!confirm("Are you sure you want to delete this registration?")) return;
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/users/${userId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await parseResponseData(res);
      if (handleUnauthorizedResponse(res)) return;
      if (res.ok) {
        await fetchData();
        await fetchStats();
        showNotice("success", "Registration deleted.");
      } else {
        showNotice("error", data.msg || "Failed to delete registration.");
      }
    } catch (err) {
      console.error(err);
      showNotice("error", "Failed to delete registration.");
    }
  };

  // Compute total revenue from users list
  const totalRevenue = useMemo(() => {
    return users
      .filter((u) => u.paymentStatus === "paid")
      .reduce((sum, u) => sum + (u.amountPaid || 0), 0);
  }, [users]);

  // Filter & search logic
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.registrationId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.mobile?.includes(searchTerm);

      const matchesStatus =
        filterStatus === "all" || user.paymentStatus === filterStatus;
      const matchesCategory =
        filterCategory === "all" || user.category === filterCategory;
      const matchesEvent =
        filterEvent === "all" ||
        (user.eventShortName || "") === filterEvent;

      return matchesSearch && matchesStatus && matchesCategory && matchesEvent;
    });
  }, [users, searchTerm, filterStatus, filterCategory, filterEvent]);

  // Pagination
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    onLogout(false);
  };

  // Export CSV – now includes all fields from the model
  const exportToCSV = () => {
    const formatDateForCSV = (value) => {
      if (!value) return "";
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? "" : date.toISOString();
    };

    const sanitizeCsvCell = (value) => {
      const raw = String(value ?? "")
        .replace(/\r\n|\n|\r/g, " ")
        .trim();

      // Prevent spreadsheet formula execution in CSV clients.
      const formulaSafe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
      return `"${formulaSafe.replace(/"/g, '""')}"`;
    };

    const headers = [
      "Registration ID",
      "Name",
      "Email",
      "Mobile",
      "Event",
      "College",
      "Course Year",
      "City",
      "Category",
      "SubCategory",
      "Portfolio",
      "GitHub",
      "Instagram",
      "Team Leader",
      "Team Members",
      "Order ID",
      "Payment ID",
      "Payment Status",
      "Amount Paid",
      "Pass Name",
      "Checked In",
      "Check-in Time",
      "Created At",
      "Referral Code",
    ];

    const csvData = filteredUsers.map((u) => [
      u.registrationId || "",
      u.fullName || "",
      u.email || "",
      u.mobile || "",
      u.eventShortName || "",
      u.college || "",
      u.courseYear || "",
      u.city || "",
      u.category || "",
      Array.isArray(u.subCategory)
        ? u.subCategory.join("; ")
        : u.subCategory || "",
      u.portfolio || "",
      u.github || "",
      u.instagram || "",
      u.teamLeader || "",
      Array.isArray(u.teamMembers) ? u.teamMembers.join("; ") : "",
      u.orderId || "",
      u.paymentId || "",
      u.paymentStatus || "",
      u.amountPaid || "",
      u.passName || "",
      u.checkedIn ? "Yes" : "No",
      formatDateForCSV(u.checkInTime),
      formatDateForCSV(u.createdAt),
      u.referralCode || "",
    ]);

    const csvRows = [headers, ...csvData].map((row) =>
      row.map((cell) => sanitizeCsvCell(cell)).join(","),
    );
    const csv = `\uFEFF${csvRows.join("\r\n")}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zonex-participants-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Categories for filter
  const categories = useMemo(() => {
    return [...new Set(users.map((u) => u.category).filter(Boolean))];
  }, [users]);

  const eventOptions = useMemo(() => {
    const userEvents = users.map((u) => u.eventShortName || "").filter(Boolean);
    const createdEvents = (Array.isArray(events) ? events : []).map((e) => e.shortName).filter(Boolean);
    return [...new Set([...userEvents, ...createdEvents])];
  }, [users, events]);

  const eventList = useMemo(() => (Array.isArray(events) ? events : []), [events]);

  const studentSignupCounts = useMemo(() => {
    return studentSignups.reduce(
      (accumulator, signup) => {
        const status = String(signup?.status || "pending").toLowerCase();
        accumulator.total += 1;
        if (status === "approved") accumulator.approved += 1;
        else if (status === "rejected") accumulator.rejected += 1;
        else accumulator.pending += 1;
        return accumulator;
      },
      { total: 0, pending: 0, approved: 0, rejected: 0 },
    );
  }, [studentSignups]);

  const filteredStudentSignups = useMemo(() => {
    const search = studentSignupSearch.trim().toLowerCase();

    return studentSignups.filter((signup) => {
      const status = String(signup?.status || "pending").toLowerCase();
      const matchesStatus = studentSignupStatus === "all" ? true : status === studentSignupStatus;
      if (!matchesStatus) return false;

      if (!search) return true;

      return [signup.fullName, signup.email, signup.phone, signup.college, signup.year, signup.city, signup.interests]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search));
    });
  }, [studentSignups, studentSignupSearch, studentSignupStatus]);

  const filteredEmployees = useMemo(() => {
    return employees;
  }, [employees]);

  const checkedInUsers = useMemo(() => {
    return users
      .filter((u) => u.checkedIn)
      .sort((a, b) => new Date(b.checkInTime || 0) - new Date(a.checkInTime || 0))
      .slice(0, 10);
  }, [users]);

  const hasActiveParticipantFilters =
    searchTerm.trim() !== "" ||
    filterStatus !== "all" ||
    filterCategory !== "all" ||
    filterEvent !== "all";

  const paidPercentage = stats?.total
    ? ((stats.paid / stats.total) * 100).toFixed(1)
    : "0.0";

  const checkedInPercentage = stats?.paid
    ? ((stats.checkedIn / stats.paid) * 100).toFixed(1)
    : "0.0";

  // Helper to display array fields nicely
  const formatArray = (arr) => {
    if (!arr || !Array.isArray(arr)) return "";
    return arr.filter(Boolean).join(", ");
  };

  // Stats cards
  const StatCard = ({ title, value, icon, color, change }) => {
    const CardIcon = icon;
    return (
      <div className="stat-card">
        <div className="stat-info">
          <span className="stat-label">{title}</span>
          <span className="stat-value">{value}</span>
          {change && <span className="stat-change">{change}</span>}
        </div>
        <div className={`stat-icon ${color}`}>
          <CardIcon size={24} />
        </div>
      </div>
    );
  };

  if (loading && !stats) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Sidebar (unchanged) */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <Award size={32} />
            <span>TechMNHub</span>
          </div>
        </div>

        <nav className="nav-menu">
          <button
            type="button"
            onClick={() => setActivePage("dashboard")}
            className={`nav-item ${activePage === "dashboard" ? "active" : ""}`}
          >
            <Users size={20} />
            <span>Dashboard</span>
          </button>
          <button
            type="button"
            onClick={() => setActivePage("events")}
            className={`nav-item ${activePage === "events" ? "active" : ""}`}
          >
            <Calendar size={20} />
            <span>Events</span>
          </button>
          <button
            type="button"
            onClick={() => setActivePage("employees")}
            className={`nav-item ${activePage === "employees" ? "active" : ""}`}
          >
            <UserCheck size={20} />
            <span>Employee Management</span>
          </button>
          <button
            type="button"
            onClick={() => setActivePage("participants")}
            className={`nav-item ${activePage === "participants" ? "active" : ""}`}
          >
            <Users size={20} />
            <span>Event Registrations</span>
          </button>
          <button
            type="button"
            onClick={() => setActivePage("session-bookings")}
            className={`nav-item ${activePage === "session-bookings" ? "active" : ""}`}
          >
            <Clock size={20} />
            <span>Session Bookings</span>
          </button>
          <button
            type="button"
            onClick={() => setActivePage("institutes")}
            className={`nav-item ${activePage === "institutes" ? "active" : ""}`}
          >
            <Building2 size={20} />
            <span>Institute Management</span>
          </button>
          <button
            type="button"
            onClick={() => setActivePage("student-management")}
            className={`nav-item ${activePage === "student-management" ? "active" : ""}`}
          >
            <UserCheck size={20} />
            <span>Student Management</span>
          </button>
          <button
            type="button"
            onClick={() => setActivePage("analytics")}
            className={`nav-item ${activePage === "analytics" ? "active" : ""}`}
          >
            <TrendingUp size={20} />
            <span>Analytics</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="content-header">
          <h1>
            {activePage === "dashboard" && "Admin Dashboard"}
            {activePage === "events" && "Events"}
            {activePage === "employees" && "Employee Management"}
            {activePage === "institutes" && "Institute Management"}
            {activePage === "participants" && "Participants"}
            {activePage === "student-management" && "Student Management"}
            {activePage === "session-bookings" && "Session Bookings"}
            {activePage === "analytics" && "Analytics"}
          </h1>
          <div className="header-actions">
            <button
              onClick={async () => {
                setRefreshing(true);
                try {
                  if (activePage === "events") {
                    await fetchEvents();
                  } else if (activePage === "employees") {
                    await fetchEmployees();
                  } else if (activePage === "institutes") {
                    await fetchInstitutes();
                  } else if (activePage === "student-management") {
                    await fetchStudentSignups();
                  } else if (activePage === "session-bookings") {
                    await fetchSessionBookings();
                  } else {
                    await fetchData();
                    await fetchStats();
                  }
                } finally {
                  setRefreshing(false);
                }
              }}
              disabled={refreshing}
              className="icon-btn"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            </button>
            {activePage === "participants" && (
              <button onClick={exportToCSV} className="export-btn">
                <Download size={18} />
                Export CSV
              </button>
            )}
          </div>
        </header>

        {notice && (
          <div className={`inline-notice ${notice.type}`} key={notice.id} role="status" aria-live="polite">
            <span>{notice.message}</span>
            <button
              type="button"
              className="inline-notice-close"
              onClick={() => setNotice(null)}
              aria-label="Dismiss notification"
            >
              <XCircle size={16} />
            </button>
          </div>
        )}

        {/* Stats Grid (unchanged) */}
        {activePage === "dashboard" && stats && (
          <div className="stats-grid">
            <StatCard
              title="Total Registrations"
              value={stats.total}
              icon={Users}
              color="blue"
              change={`${stats.pending} pending`}
            />
            <StatCard
              title="Paid"
              value={stats.paid}
              icon={CreditCard}
              color="green"
              change={`${paidPercentage}%`}
            />
            <StatCard
              title="Checked In"
              value={stats.checkedIn}
              icon={CheckCircle}
              color="purple"
              change={`${checkedInPercentage}% of paid`}
            />
            <StatCard
              title="Revenue"
              value={`₹${totalRevenue}`} // ✅ Now uses actual sum
              icon={DollarSign}
              color="yellow"
            />
          </div>
        )}

        {activePage === "dashboard" && (
          <section className="participants-section">
            <div className="section-header">
              <h2>Recently Checked-in Participants</h2>
              <span className="total-badge">{checkedInUsers.length} shown</span>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Event</th>
                    <th>Registration ID</th>
                    <th>Check-in Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {checkedInUsers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="no-data">
                        No checked-in participants yet.
                      </td>
                    </tr>
                  ) : (
                    checkedInUsers.map((user) => (
                      <tr key={user._id}>
                        <td>{user.fullName}</td>
                        <td>{user.eventShortName || "—"}</td>
                        <td>{user.registrationId || "N/A"}</td>
                        <td>
                          {user.checkInTime
                            ? new Date(user.checkInTime).toLocaleString()
                            : "N/A"}
                        </td>
                        <td>
                          <span className="checkin-badge checked">
                            <CheckCircle size={14} /> Checked In
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Events Section */}
        {activePage === "institutes" && (
          <section className="participants-section">
            <div className="section-header">
              <h2>Institute Accounts</h2>
              <div className="header-actions">
                <span className="total-badge">{institutes.length} total</span>
                <Link to="/admin/create-institute" className="export-btn">
                  <Building2 size={16} />
                  Create Institute
                </Link>
              </div>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Institute</th>
                    <th>Type</th>
                    <th>City</th>
                    <th>Contact</th>
                    <th>Login Email</th>
                    <th>Verified</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {institutesLoading ? (
                    <tr>
                      <td colSpan="7" className="no-data">Loading institutes...</td>
                    </tr>
                  ) : institutes.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="no-data">No institute accounts yet.</td>
                    </tr>
                  ) : (
                    institutes.map((item) => (
                      <tr key={item._id}>
                        <td>
                          <div className="name-cell">{item.instituteName}</div>
                          <div className="email-subtext">{item.address}</div>
                        </td>
                        <td>{item.type}</td>
                        <td>{item.city}</td>
                        <td>
                          <div>{item.contactPerson}</div>
                          <div className="email-subtext">{item.phone}</div>
                        </td>
                        <td>{item.account?.email || "-"}</td>
                        <td>
                          <span className={`status ${item.verified ? "status-active" : "status-upcoming"}`}>
                            {item.verified ? "Verified" : "Pending"}
                          </span>
                        </td>
                        <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activePage === "student-management" && (
          <section className="participants-section">
            <div className="section-header">
              <div className="section-title-wrap">
                <h2>Student Signups</h2>
                <p className="section-subtitle">Review new requests, approve verified students, and keep rejected requests tracked.</p>
              </div>
              <span className="total-badge">{studentSignupCounts.pending} pending</span>
            </div>

            <div className="stats-grid">
              <StatCard title="Total Requests" value={studentSignupCounts.total} icon={Users} color="blue" />
              <StatCard title="Pending" value={studentSignupCounts.pending} icon={Clock} color="yellow" />
              <StatCard title="Approved" value={studentSignupCounts.approved} icon={CheckCircle} color="green" />
              <StatCard title="Rejected" value={studentSignupCounts.rejected} icon={XCircle} color="purple" />
            </div>

            <div className="filters-bar">
              <div className="search-box">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search by name, email, college, city, or interests..."
                  value={studentSignupSearch}
                  onChange={(e) => setStudentSignupSearch(e.target.value)}
                />
              </div>

              <div className="filter-group">
                <select
                  className="filter-select"
                  value={studentSignupStatus}
                  onChange={(e) => setStudentSignupStatus(e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="all">All statuses</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>

                <button
                  type="button"
                  className="filter-reset-btn"
                  onClick={() => {
                    setStudentSignupSearch("");
                    setStudentSignupStatus("pending");
                  }}
                  disabled={!studentSignupSearch && studentSignupStatus === "pending"}
                >
                  <Filter size={14} />
                  Reset
                </button>
              </div>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Contact</th>
                    <th>Institution</th>
                    <th>Interests</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {studentSignupsLoading ? (
                    <tr>
                      <td colSpan="7" className="no-data">Loading student signups...</td>
                    </tr>
                  ) : filteredStudentSignups.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="no-data">No student signups found.</td>
                    </tr>
                  ) : (
                    filteredStudentSignups.map((signup) => (
                      <tr key={signup._id}>
                        <td>
                          <div className="name-cell">{signup.fullName}</div>
                          <div className="email-subtext">{signup.city || "—"}</div>
                        </td>
                        <td>
                          <div>{signup.email}</div>
                          <div className="email-subtext">{signup.phone}</div>
                        </td>
                        <td>
                          <div>{signup.college}</div>
                          <div className="email-subtext">{signup.year}</div>
                        </td>
                        <td>{signup.interests}</td>
                        <td>
                          <span className={`status-badge ${signup.status || "pending"}`}>
                            {signup.status || "pending"}
                          </span>
                          {signup.reviewedAt ? (
                            <div className="email-subtext">
                              Reviewed {new Date(signup.reviewedAt).toLocaleDateString()}
                            </div>
                          ) : null}
                        </td>
                        <td>{signup.createdAt ? new Date(signup.createdAt).toLocaleString() : "N/A"}</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              type="button"
                              className="action-btn view"
                              onClick={() => handleStudentSignupReview(signup, "approved")}
                              disabled={studentSignupSubmitting || signup.status === "approved"}
                              title="Approve signup"
                            >
                              <CheckCircle size={16} />
                            </button>
                            <button
                              type="button"
                              className="action-btn delete"
                              onClick={() => handleStudentSignupReview(signup, "rejected")}
                              disabled={studentSignupSubmitting || signup.status === "rejected"}
                              title="Reject signup"
                            >
                              <XCircle size={16} />
                            </button>
                            <button
                              type="button"
                              className="action-btn view"
                              onClick={() => handleStudentSignupReview(signup, "pending")}
                              disabled={studentSignupSubmitting || signup.status === "pending"}
                              title="Move back to pending"
                            >
                              <RefreshCw size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activePage === "session-bookings" && (
          <section className="participants-section session-bookings-section">
            <div className="section-header">
              <div className="section-title-wrap">
                <h2>Session Bookings</h2>
                <p className="section-subtitle">Review and manage session bookings directly from the admin dashboard.</p>
              </div>
              <span className="total-badge">{sessionBookings.length} total</span>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-card-icon">
                  <Clock size={18} />
                </div>
                <div className="stat-card-content">
                  <span>Total</span>
                  <strong>{sessionBookingCounts.total}</strong>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon">
                  <Clock size={18} />
                </div>
                <div className="stat-card-content">
                  <span>Pending</span>
                  <strong>{sessionBookingCounts.pending}</strong>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon">
                  <CheckCircle size={18} />
                </div>
                <div className="stat-card-content">
                  <span>Confirmed</span>
                  <strong>{sessionBookingCounts.confirmed}</strong>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon">
                  <CheckCircle size={18} />
                </div>
                <div className="stat-card-content">
                  <span>Completed</span>
                  <strong>{sessionBookingCounts.completed}</strong>
                </div>
              </div>
            </div>

            <div className="filters-bar">
              <div className="search-box">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search bookings, institutes, contacts..."
                  value={sessionSearch}
                  onChange={(e) => setSessionSearch(e.target.value)}
                />
              </div>
              <div className="filter-group">
                <select
                  className="filter-select"
                  value={sessionBookingFilter}
                  onChange={(e) => setSessionBookingFilter(e.target.value)}
                >
                  <option value="all">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="rescheduled">Rescheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button
                  type="button"
                  className="filter-reset-btn"
                  onClick={handleResetSessionFilters}
                  disabled={!sessionSearch && sessionBookingFilter === "all"}
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Topic</th>
                    <th>Institute</th>
                    <th>Contact</th>
                    <th>Schedule</th>
                    <th>Status</th>
                    <th>Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessionBookingsLoading ? (
                    <tr>
                      <td colSpan="7" className="no-data">Loading session bookings...</td>
                    </tr>
                  ) : !filteredSessionBookings.length ? (
                    <tr>
                      <td colSpan="7" className="no-data">No session bookings found.</td>
                    </tr>
                  ) : (
                    filteredSessionBookings.map((booking) => (
                      <tr key={booking._id}>
                        <td>
                          <div className="name-cell">{booking.topic || "-"}</div>
                          <div className="email-subtext">{booking.mode || ""}</div>
                        </td>
                        <td>
                          <div>{booking.instituteName || "-"}</div>
                          <div className="email-subtext">{booking.department || ""}</div>
                          <div className="email-subtext">{booking.city || ""}</div>
                        </td>
                        <td>
                          <div>{booking.contactName || "-"}</div>
                          <div className="email-subtext">{booking.email || ""}</div>
                          <div className="email-subtext">{booking.phone || ""}</div>
                        </td>
                        <td>
                          <div>{booking.date || "-"}</div>
                          <div className="email-subtext">{booking.time || ""}</div>
                        </td>
                        <td>
                          <span className={`status-badge ${booking.status || "pending"}`}>
                            {booking.status || "pending"}
                          </span>
                        </td>
                        <td>{booking.adminNotes || booking.notes || "-"}</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              type="button"
                              className="action-btn confirm"
                              onClick={() => updateSessionBooking(booking._id, { status: "confirmed" })}
                              disabled={sessionSavingId === booking._id}
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              className="action-btn reschedule"
                              onClick={() => updateSessionBooking(booking._id, { status: "rescheduled" })}
                              disabled={sessionSavingId === booking._id}
                            >
                              Reschedule
                            </button>
                            <button
                              type="button"
                              className="action-btn complete"
                              onClick={() => updateSessionBooking(booking._id, { status: "completed" })}
                              disabled={sessionSavingId === booking._id}
                            >
                              Complete
                            </button>
                            <button
                              type="button"
                              className="action-btn cancel"
                              onClick={() => updateSessionBooking(booking._id, { status: "cancelled" })}
                              disabled={sessionSavingId === booking._id}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className="action-btn delete"
                              onClick={() => deleteSessionBooking(booking._id)}
                              disabled={sessionSavingId === booking._id}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Events Section */}
        {activePage === "events" && (
        <section className="participants-section events-section">
          <div className="section-header">
            <h2>Events Management</h2>
            <span className="total-badge">
              {eventList.filter((item) => item.status === "active" || item.status === "published").length} active / {eventList.length} total
            </span>
          </div>

          <form className="event-form" onSubmit={handleCreateEvent}>
            <h3 className="event-form-title">
              {editingEventId ? "Update Event" : "Create Event"}
            </h3>
            <div className="event-form-grid event-form-grid-lg">
              <input
                name="name"
                value={eventForm.name}
                onChange={handleEventInput}
                placeholder="Full event title"
              />
              <input
                name="shortName"
                value={eventForm.shortName}
                onChange={handleEventInput}
                placeholder="Short event name (e.g., TechFront 2026)"
                required
              />
              <input
                name="date"
                value={eventForm.date}
                onChange={handleEventInput}
                placeholder="Date (e.g., 7 March, 2026)"
                required
              />
              <input
                name="day"
                value={eventForm.day}
                onChange={handleEventInput}
                placeholder="Day (e.g., Saturday)"
              />
              <input
                name="time"
                value={eventForm.time}
                onChange={handleEventInput}
                placeholder="Time (e.g., 9:00 AM - 5:00 PM)"
                required
              />
              <input
                name="venue"
                value={eventForm.venue}
                onChange={handleEventInput}
                placeholder="Venue"
                required
              />
              <input
                name="city"
                value={eventForm.city}
                onChange={handleEventInput}
                placeholder="City"
                required
              />
              <input
                name="location"
                value={eventForm.location}
                onChange={handleEventInput}
                placeholder="Full location"
              />
              <input
                name="organizer"
                value={eventForm.organizer}
                onChange={handleEventInput}
                placeholder="Organizer"
              />
              <input
                name="expectedParticipants"
                value={eventForm.expectedParticipants}
                onChange={handleEventInput}
                placeholder="Expected participants (e.g., 800+)"
              />
              <input
                name="skillZones"
                value={eventForm.skillZones}
                onChange={handleEventInput}
                placeholder="Skill zones (e.g., 10+)"
              />
              <input
                name="prizes"
                value={eventForm.prizes}
                onChange={handleEventInput}
                placeholder="Prize info"
              />
              <input
                name="registrationDeadline"
                value={eventForm.registrationDeadline}
                onChange={handleEventInput}
                placeholder="Registration deadline"
              />
              <input
                name="refundPolicy"
                value={eventForm.refundPolicy}
                onChange={handleEventInput}
                placeholder="Refund policy"
              />
              <input
                name="contactEmail"
                value={eventForm.contactEmail}
                onChange={handleEventInput}
                placeholder="Contact email"
              />
              <input
                name="contactPhone"
                value={eventForm.contactPhone}
                onChange={handleEventInput}
                placeholder="Contact phone"
              />
              <input
                name="registrationLink"
                value={eventForm.registrationLink}
                onChange={handleEventInput}
                placeholder="Registration link (optional)"
              />
              <select
                name="status"
                value={eventForm.status}
                onChange={handleEventInput}
              >
                <option value="published">Published on frontend</option>
                <option value="draft">Draft / hidden</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div className="ticket-types-section">
              <div className="section-header compact-section-header">
                <h2>Ticket Types</h2>
                <button type="button" className="export-btn" onClick={handleAddTicketType}>
                  Add Ticket Type
                </button>
              </div>
              <div className="ticket-type-list">
                {eventForm.ticketTypes.map((ticketType, index) => (
                  <div className="ticket-type-card" key={ticketType.id}>
                    <div className="ticket-type-grid">
                      <input
                        value={ticketType.name}
                        onChange={(e) => handleTicketTypeChange(ticketType.id, "name", e.target.value)}
                        placeholder={`Ticket type ${index + 1} name`}
                      />
                      <select
                        value={ticketType.appliesTo}
                        onChange={(e) => handleTicketTypeChange(ticketType.id, "appliesTo", e.target.value)}
                      >
                        <option value="All">All Categories</option>
                        <option value="Participation">Participation</option>
                        <option value="Visitor">Visitor</option>
                      </select>
                      <input
                        type="number"
                        min="0"
                        value={ticketType.price}
                        onChange={(e) => handleTicketTypeChange(ticketType.id, "price", e.target.value)}
                        placeholder="Price"
                      />
                      <input
                        type="number"
                        min="0"
                        value={ticketType.total}
                        onChange={(e) => handleTicketTypeChange(ticketType.id, "total", e.target.value)}
                        placeholder="Total tickets (0 = unlimited)"
                      />
                    </div>
                    <div className="ticket-type-actions">
                      <textarea
                        value={ticketType.description}
                        onChange={(e) => handleTicketTypeChange(ticketType.id, "description", e.target.value)}
                        placeholder="Ticket description (optional)"
                        rows={2}
                      />
                      <button
                        type="button"
                        className="action-btn delete"
                        onClick={() => handleRemoveTicketType(ticketType.id)}
                        title="Remove ticket type"
                        disabled={eventForm.ticketTypes.length === 1}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="ticket-types-section">
              <div className="section-header compact-section-header">
                <h2>Referral Codes</h2>
                <button type="button" className="export-btn" onClick={handleAddReferralCode}>
                  Add Referral Code
                </button>
              </div>
              <div className="ticket-type-list">
                {(eventForm.referralCodes || []).length === 0 ? (
                  <div className="no-data">No referral codes added. Add one to enable discounts.</div>
                ) : (
                  eventForm.referralCodes.map((referral) => (
                    <div className="ticket-type-card" key={referral.id}>
                      <div className="ticket-type-grid">
                        <input
                          value={referral.code}
                          onChange={(e) => handleReferralCodeChange(referral.id, "code", e.target.value)}
                          placeholder="Referral code (e.g., TMH2026)"
                        />
                        <select
                          value={referral.discountType}
                          onChange={(e) => handleReferralCodeChange(referral.id, "discountType", e.target.value)}
                        >
                          <option value="flat">Flat discount</option>
                          <option value="percent">Percent discount</option>
                        </select>
                        <input
                          type="number"
                          min="0"
                          value={referral.discountValue}
                          onChange={(e) => handleReferralCodeChange(referral.id, "discountValue", e.target.value)}
                          placeholder="Discount value"
                        />
                        <input
                          type="number"
                          min="0"
                          value={referral.maxUses}
                          onChange={(e) => handleReferralCodeChange(referral.id, "maxUses", e.target.value)}
                          placeholder="Max uses (0 = unlimited)"
                        />
                      </div>
                      <div className="ticket-type-actions">
                        <label className="referral-active-toggle">
                          <input
                            type="checkbox"
                            checked={referral.active !== false}
                            onChange={(e) => handleReferralCodeChange(referral.id, "active", e.target.checked)}
                          />
                          Active
                        </label>
                        <span className="event-description">Used {referral.usedCount || 0} time(s)</span>
                        <button
                          type="button"
                          className="action-btn delete"
                          onClick={() => handleRemoveReferralCode(referral.id)}
                          title="Remove referral code"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <textarea
              name="description"
              value={eventForm.description}
              onChange={handleEventInput}
              placeholder="Event description"
              required
              rows={3}
            />
            <textarea
              name="highlights"
              value={eventForm.highlights}
              onChange={handleEventInput}
              placeholder="Highlights (comma separated)"
              rows={2}
            />
            <textarea
              name="categories"
              value={eventForm.categories}
              onChange={handleEventInput}
              placeholder="Categories (comma separated)"
              rows={2}
            />
            <textarea
              name="tags"
              value={eventForm.tags}
              onChange={handleEventInput}
              placeholder="Tags (comma separated)"
              rows={2}
            />
            <div className="event-form-actions">
              <button type="submit" className="export-btn" disabled={eventSubmitting}>
                {eventSubmitting
                  ? editingEventId
                    ? "Updating..."
                    : "Creating..."
                  : editingEventId
                    ? "Update Event"
                    : "Create Event"}
              </button>
              {editingEventId && (
                <button type="button" className="export-btn" onClick={resetEventForm}>
                  Cancel Edit
                </button>
              )}
              <button type="button" className="icon-btn" onClick={fetchEvents}>
                <RefreshCw size={18} />
              </button>
            </div>
          </form>

          {eventsLoading ? (
            <p>Loading events...</p>
          ) : (
            <div className="events-grid">
              {eventList.length === 0 ? (
                <div className="no-data">No events created yet</div>
              ) : (
                eventList.map((event) => (
                  <div key={event._id} className="event-card">
                    <div className="event-details">
                      <div className={`event-status status-${event.status === "active" || event.status === "published" ? "active" : "completed"}`}>
                        {event.status === "published" ? "published" : event.status}
                      </div>
                      <h3 className="event-name">{event.shortName}</h3>
                      <div className="event-meta compact-event-meta">
                        <div className="event-meta-item">
                          <Calendar size={14} />
                          <span>{event.date || "Date to be announced"}</span>
                        </div>
                      </div>
                      <p className="event-description">{event.description || "No description added yet."}</p>
                      <div className="event-meta">
                        <button
                          onClick={() => handleViewEntries(event._id)}
                          className="export-btn"
                          type="button"
                        >
                          <Eye size={14} />
                          View Entries Window
                        </button>
                      </div>
                      <div className="event-actions">
                        <button
                          onClick={() => handleEditEvent(event)}
                          className="action-btn view"
                          title="Edit Event"
                          type="button"
                        >
                          <Edit size={16} />
                        </button>
                        {event.status === "draft" ? (
                          <button
                            onClick={() => handlePublishEvent(event._id)}
                            className="action-btn view"
                            title="Publish Event"
                            type="button"
                          >
                            <Eye size={16} />
                          </button>
                        ) : event.status === "active" || event.status === "published" ? (
                          <button
                            onClick={() => handleCloseEvent(event._id)}
                            className="action-btn delete"
                            title="Close Event"
                            type="button"
                          >
                            <XCircle size={16} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReopenEvent(event._id)}
                            className="action-btn view"
                            title="Reopen Event"
                            type="button"
                          >
                            <RefreshCw size={16} />
                          </button>
                        )}
                        {(event.status === "active" || event.status === "published") && (
                          <button
                            onClick={() => handleUnpublishEvent(event._id)}
                            className="action-btn delete"
                            title="Unpublish Event"
                            type="button"
                          >
                            <XCircle size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteEvent(event)}
                          className="action-btn delete"
                          title="Delete Event"
                          type="button"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </section>
        )}

        {activePage === "employees" && (
          <section className="participants-section employees-section">
            <div className="section-header">
              <div className="section-title-wrap">
                <h2>Employee Management</h2>
                <p className="section-subtitle">Manage profile fields, contact info, joining date, and QR records.</p>
              </div>
              <span className="total-badge">{employeeTotal} employees</span>
            </div>

            <form className="event-form employee-form" onSubmit={handleSaveEmployee}>
              <h3 className="event-form-title">
                {editingEmployeeId ? "Update Employee" : "Create Employee"}
              </h3>
              <div className="event-form-grid employee-form-grid">
                <input
                  name="empId"
                  value={employeeForm.empId}
                  onChange={handleEmployeeInput}
                  placeholder="Employee ID"
                  required
                  readOnly={Boolean(editingEmployeeId)}
                />
                <input
                  name="name"
                  value={employeeForm.name}
                  onChange={handleEmployeeInput}
                  placeholder="Employee name"
                  required
                />
                <input
                  name="mobile"
                  value={employeeForm.mobile}
                  onChange={handleEmployeeInput}
                  placeholder="Mobile number"
                />
                <input
                  name="email"
                  type="email"
                  value={employeeForm.email}
                  onChange={handleEmployeeInput}
                  placeholder="Email"
                />
                <input
                  name="joiningDate"
                  type="date"
                  value={employeeForm.joiningDate}
                  onChange={handleEmployeeInput}
                  placeholder="Joining date"
                />
                <input
                  name="photoUrl"
                  value={employeeForm.photoUrl}
                  onChange={handleEmployeeInput}
                  placeholder="Photo URL (optional)"
                />
                <input
                  name="designation"
                  value={employeeForm.designation}
                  onChange={handleEmployeeInput}
                  placeholder="Designation"
                />
                <input
                  name="department"
                  value={employeeForm.department}
                  onChange={handleEmployeeInput}
                  placeholder="Department"
                />
              </div>
              <div className="employee-photo-upload-row">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleEmployeePhotoUpload}
                  className="employee-photo-file-input"
                />
                {employeeForm.photoUrl && (
                  <button
                    type="button"
                    className="filter-reset-btn"
                    onClick={() => setEmployeeForm((prev) => ({ ...prev, photoUrl: "" }))}
                  >
                    Remove Photo
                  </button>
                )}
              </div>
              {employeeForm.photoUrl && (
                <div className="employee-photo-preview-wrap">
                  <img src={employeeForm.photoUrl} alt="Employee preview" className="employee-photo-preview" />
                </div>
              )}
              <textarea
                className="employee-description-input"
                name="description"
                value={employeeForm.description}
                onChange={handleEmployeeInput}
                placeholder="Employee description"
                rows={3}
              />
              <div className="event-form-actions">
                <button type="submit" className="export-btn" disabled={employeeSubmitting}>
                  {employeeSubmitting
                    ? editingEmployeeId
                      ? "Updating..."
                      : "Creating..."
                    : editingEmployeeId
                      ? "Update Employee"
                      : "Create Employee"}
                </button>
                {editingEmployeeId && (
                  <button type="button" className="export-btn" onClick={resetEmployeeForm}>
                    Cancel Edit
                  </button>
                )}
                <button type="button" className="icon-btn" onClick={fetchEmployees}>
                  <RefreshCw size={18} />
                </button>
              </div>
            </form>

            <div className="filters-bar employee-filters-bar">
              <div className="search-box">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search by name, ID, email, mobile, designation..."
                  value={employeeSearch}
                  onChange={(e) => {
                    setEmployeeSearch(e.target.value);
                    setEmployeePage(1);
                  }}
                />
              </div>
              <div className="filter-group">
                <select
                  value={employeeSort}
                  onChange={(e) => {
                    setEmployeeSort(e.target.value);
                    setEmployeePage(1);
                  }}
                  className="filter-select"
                >
                  <option value="latest">Latest employees first</option>
                  <option value="oldest">Oldest employees first</option>
                </select>
              </div>
            </div>

            {employeesLoading ? (
              <p className="employee-loading-note">Loading employees...</p>
            ) : (
              <div className="table-container employee-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Photo</th>
                      <th>Employee ID</th>
                      <th>Name</th>
                      <th>Status</th>
                      <th>Mobile</th>
                      <th>Email</th>
                      <th>Joining Date</th>
                      <th>Designation</th>
                      <th>Department</th>
                      <th>Description</th>
                      <th>Updated</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.length === 0 ? (
                      <tr>
                        <td colSpan="12" className="no-data">
                          No employees found.
                        </td>
                      </tr>
                    ) : (
                      filteredEmployees.map((employee) => (
                        <tr key={employee._id}>
                          <td>
                            <div className="employee-table-avatar">
                              {getEmployeePhoto(employee) ? (
                                <img
                                  src={getEmployeePhoto(employee)}
                                  alt={`${employee.name || employee.empId} photo`}
                                  className="employee-table-avatar-img"
                                />
                              ) : (
                                <span className="employee-table-avatar-fallback">
                                  {(employee.name || employee.empId || "?")
                                    .split(" ")
                                    .filter(Boolean)
                                    .slice(0, 2)
                                    .map((part) => part[0])
                                    .join("")
                                    .toUpperCase() || "?"}
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className="id-badge">{employee.empId}</span>
                          </td>
                          <td>
                            <div className="user-info">
                              <span className="user-name">{employee.name}</span>
                            </div>
                          </td>
                          <td>
                            <span className={`employee-status-badge ${getEmployeeEmploymentStatus(employee)}`}>
                              {getEmployeeStatusLabel(employee)}
                            </span>
                          </td>
                          <td>{employee.mobile || "N/A"}</td>
                          <td>{employee.email || "N/A"}</td>
                          <td>{employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : "N/A"}</td>
                          <td>{employee.designation || "N/A"}</td>
                          <td>{employee.department || "N/A"}</td>
                          <td className="employee-description-cell">{employee.description || "N/A"}</td>
                          <td>
                            {employee.updatedAt ? new Date(employee.updatedAt).toLocaleString() : "N/A"}
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                onClick={() => {
                                  setSelectedEmployee(employee);
                                  setShowEmployeeModal(true);
                                }}
                                className="action-btn view"
                                title="View QR"
                                type="button"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={() => handleEditEmployee(employee)}
                                className="action-btn view"
                                title="Edit Employee"
                                type="button"
                              >
                                <Edit size={16} />
                              </button>
                              {isEmployeeTerminated(employee) ? (
                                <span className="employee-action-note">Terminated</span>
                              ) : (
                                <button
                                  onClick={() => handleTerminateEmployee(employee)}
                                  className="action-btn delete"
                                  title="Terminate Employee"
                                  type="button"
                                >
                                  <UserX size={16} />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteEmployee(employee)}
                                className="action-btn delete"
                                title="Delete Employee"
                                type="button"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {employeeTotalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setEmployeePage((p) => Math.max(1, p - 1))}
                  disabled={employeePage === 1}
                  className="page-btn"
                  type="button"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="page-info">
                  Page {employeePage} of {employeeTotalPages}
                </span>
                <button
                  onClick={() => setEmployeePage((p) => Math.min(employeeTotalPages, p + 1))}
                  disabled={employeePage === employeeTotalPages}
                  className="page-btn"
                  type="button"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </section>
        )}

        {/* Participants Section */}
        {activePage === "participants" && (
        <section className="participants-section">
          <div className="section-header">
            <h2>Participants Management</h2>
            <span className="total-badge">
              {filteredUsers.length} participants
            </span>
          </div>

          {/* Filters (unchanged) */}
          <div className="filters-bar">
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search by name, email, ID, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <select
                value={filterEvent}
                onChange={(e) => setFilterEvent(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Events</option>
                {eventOptions.map((eventName) => (
                  <option key={eventName} value={eventName}>
                    {eventName}
                  </option>
                ))}
              </select>

              <button
                type="button"
                className="filter-reset-btn"
                onClick={resetParticipantFilters}
                disabled={!hasActiveParticipantFilters}
              >
                <Filter size={14} />
                Reset
              </button>
            </div>
          </div>

          {/* Table – only minor fix: display subCategory properly */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Reg ID</th>
                  <th>Participant</th>
                  <th>Event</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Check-in</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="no-data">
                      No participants found
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => (
                    <tr key={user._id}>
                      <td className="reg-id">
                        <span className="id-badge">
                          {user.registrationId || "N/A"}
                        </span>
                      </td>
                      <td>
                        <div className="user-info">
                          <span className="user-name">{user.fullName}</span>
                          <span className="user-email">{user.email}</span>
                          <span className="user-mobile">{user.mobile}</span>
                        </div>
                      </td>
                      <td>
                        <span className="category">{user.eventShortName || "—"}</span>
                      </td>
                      <td>
                        <div className="category-info">
                          <span className="category">
                            {user.category || "N/A"}
                          </span>
                          {user.subCategory && user.subCategory.length > 0 && (
                            <span className="subcategory">
                              {formatArray(user.subCategory)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="amount">₹{user.amountPaid || 0}</span>
                      </td>
                      <td>
                        <span className={`status-badge ${user.paymentStatus}`}>
                          {user.paymentStatus}
                        </span>
                      </td>
                      <td>
                        {user.checkedIn ? (
                          <span className="checkin-badge checked">
                            <CheckCircle size={14} />
                            {user.checkInTime
                              ? new Date(user.checkInTime).toLocaleTimeString()
                              : "Checked"}
                          </span>
                        ) : (
                          <button
                            onClick={() => handleCheckIn(user._id)}
                            className="checkin-btn"
                            disabled={user.paymentStatus !== "paid"}
                          >
                            <UserCheck size={14} />
                            Check In
                          </button>
                        )}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowUserModal(true);
                            }}
                            className="action-btn view"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(user._id)}
                            className="action-btn delete"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination (unchanged) */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="page-btn"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="page-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="page-btn"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </section>
        )}

        {activePage === "cloner" && (
          <section className="participants-section clone-section">
            <div className="section-header">
              <h2>Clone Old Database Into New Database</h2>
              <span className="total-badge">Source to Destination Transfer</span>
            </div>

            <form className="event-form clone-form" onSubmit={handleCloneSubmit}>
              <div className="clone-note">
                This copies data from the old database URI into the new destination database URI. You can transfer only selected collections (entries) instead of the whole database.
              </div>

              <div className="clone-form-grid">
                <div className="input-group">
                  <label htmlFor="sourceUri">Old MongoDB URI</label>
                  <input
                    id="sourceUri"
                    name="sourceUri"
                    value={cloneForm.sourceUri}
                    onChange={handleCloneInput}
                    placeholder="mongodb+srv://user:pass@cluster.example.mongodb.net/"
                    autoComplete="off"
                    spellCheck="false"
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="sourceDbName">Old Database Name (optional if in URI)</label>
                  <input
                    id="sourceDbName"
                    name="sourceDbName"
                    value={cloneForm.sourceDbName}
                    onChange={handleCloneInput}
                    placeholder="test"
                    autoComplete="off"
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="destinationUri">New MongoDB URI</label>
                  <input
                    id="destinationUri"
                    name="destinationUri"
                    value={cloneForm.destinationUri}
                    onChange={handleCloneInput}
                    placeholder="mongodb+srv://user:pass@cluster.example.mongodb.net/"
                    autoComplete="off"
                    spellCheck="false"
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="destinationDbName">New Database Name (optional if in URI)</label>
                  <input
                    id="destinationDbName"
                    name="destinationDbName"
                    value={cloneForm.destinationDbName}
                    onChange={handleCloneInput}
                    placeholder="techmnhub"
                    autoComplete="off"
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="collections">Collections To Transfer (optional, comma-separated)</label>
                  <input
                    id="collections"
                    name="collections"
                    value={cloneForm.collections}
                    onChange={handleCloneInput}
                    placeholder="users"
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="event-form-actions clone-actions">
                <button type="submit" className="export-btn" disabled={cloneSubmitting}>
                  <Database size={18} />
                  {cloneSubmitting ? "Cloning..." : "Start Clone"}
                </button>
                <button
                  type="button"
                  className="export-btn"
                  disabled={exportSubmitting}
                  onClick={handleExportData}
                >
                  <Download size={18} />
                  {exportSubmitting ? "Exporting..." : "Export Data JSON"}
                </button>
              </div>
            </form>

            {cloneResult && (
              <div className="clone-result-card">
                <div className="section-header compact-section-header">
                  <h2>Last Clone Summary</h2>
                  <span className="total-badge">
                    {cloneResult.collections?.length || 0} collections copied
                  </span>
                </div>

                <div className="clone-meta-grid">
                  <div className="clone-meta-item">
                    <span className="clone-meta-label">Source Database</span>
                    <strong>{cloneResult.sourceDbName}</strong>
                  </div>
                  <div className="clone-meta-item">
                    <span className="clone-meta-label">Destination Database</span>
                    <strong>{cloneResult.destinationDbName}</strong>
                  </div>
                </div>

                <div className="clone-collection-list">
                  {(cloneResult.collections || []).map((collection) => (
                    <div className="clone-collection-item" key={collection.collectionName}>
                      <span>{collection.collectionName}</span>
                      <strong>{collection.documents} document(s)</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {activePage === "explorer" && (
          <section className="participants-section explorer-section">
            <div className="section-header">
              <h2>Database Explorer</h2>
              <span className="total-badge">
                {databaseOverview?.databases?.length || 0} database(s) loaded
              </span>
            </div>

            <form className="event-form clone-form" onSubmit={handleLoadExplorer}>
              <div className="clone-note">
                Enter the old MongoDB URI here to inspect how many databases exist, which collections they contain, and preview collection documents from inside the admin panel.
              </div>

              <div className="clone-form-grid">
                <div className="input-group">
                  <label htmlFor="explorerSourceUri">Source MongoDB URI</label>
                  <input
                    id="explorerSourceUri"
                    name="sourceUri"
                    value={explorerForm.sourceUri}
                    onChange={handleExplorerInput}
                    placeholder="mongodb+srv://user:pass@cluster.example.mongodb.net/"
                    autoComplete="off"
                    spellCheck="false"
                  />
                </div>
              </div>

              <div className="event-form-actions clone-actions">
                <button type="submit" className="export-btn" disabled={explorerLoading}>
                  <Database size={18} />
                  {explorerLoading ? "Loading..." : "Load Databases"}
                </button>
              </div>
            </form>

            {databaseOverview && (
              <div className="explorer-summary-grid">
                <div className="clone-meta-item">
                  <span className="clone-meta-label">Visible Databases</span>
                  <strong>{databaseOverview.databases?.length || 0}</strong>
                </div>
                <div className="clone-meta-item">
                  <span className="clone-meta-label">System Databases</span>
                  <strong>{databaseOverview.systemDatabases?.length || 0}</strong>
                </div>
                <div className="clone-meta-item">
                  <span className="clone-meta-label">Total Databases</span>
                  <strong>{databaseOverview.totalDatabases || 0}</strong>
                </div>
              </div>
            )}

            {databaseOverview?.allDatabases?.length > 0 && (
              <div className="explorer-grid">
                <div className="explorer-panel">
                  <div className="section-header compact-section-header">
                    <h2>Databases</h2>
                  </div>
                  <div className="explorer-list">
                    {databaseOverview.allDatabases.map((database) => (
                      <button
                        type="button"
                        key={database.name}
                        className={`explorer-item ${selectedDatabaseName === database.name ? "active" : ""} ${database.isSystemDatabase ? "system" : ""}`}
                        onClick={() => handleSelectDatabase(database.name)}
                      >
                        <div>
                          <strong>{database.name}</strong>
                          <span>{database.collections?.length || 0} collection(s)</span>
                        </div>
                        <span>{database.isSystemDatabase ? "System" : "Open"}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="explorer-panel">
                  <div className="section-header compact-section-header">
                    <h2>Collections</h2>
                  </div>

                  {!selectedDatabaseName && <div className="no-data">Select a database to view its collections.</div>}

                  {selectedDatabaseName && (
                    <div className="explorer-list">
                      {(databaseOverview.allDatabases.find((item) => item.name === selectedDatabaseName)?.collections || []).map((collection) => (
                        <button
                          type="button"
                          key={collection.name}
                          className={`explorer-item collection-item ${selectedCollectionName === collection.name ? "active" : ""}`}
                          onClick={() => handleSelectCollection(selectedDatabaseName, collection.name)}
                        >
                          <div>
                            <strong>{collection.name}</strong>
                            <span>{collection.documentCount} document(s)</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {collectionPreview && (
              <div className="clone-result-card explorer-preview-card">
                <div className="section-header compact-section-header">
                  <h2>Collection Preview</h2>
                  <span className="total-badge">
                    Showing {collectionPreview.returnedDocuments} of {collectionPreview.totalDocuments}
                  </span>
                </div>

                <div className="clone-meta-grid">
                  <div className="clone-meta-item">
                    <span className="clone-meta-label">Database</span>
                    <strong>{collectionPreview.databaseName}</strong>
                  </div>
                  <div className="clone-meta-item">
                    <span className="clone-meta-label">Collection</span>
                    <strong>{collectionPreview.collectionName}</strong>
                  </div>
                  <div className="clone-meta-item">
                    <span className="clone-meta-label">Preview Limit</span>
                    <strong>{collectionPreview.limit}</strong>
                  </div>
                </div>

                <div className="preview-doc-list">
                  {(collectionPreview.documents || []).map((doc, index) => (
                    <div className="preview-doc-card" key={doc._id || index}>
                      <div className="preview-doc-index">Document {index + 1}</div>
                      <pre>{JSON.stringify(doc, null, 2)}</pre>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {activePage === "analytics" && (
          <section className="participants-section">
            <div className="section-header">
              <h2>Analytics</h2>
            </div>
            <p className="event-description">
              Detailed analytics can be added here. Your event and participant data is already connected.
            </p>
          </section>
        )}
      </main>

      {showEmployeeModal && selectedEmployee && (
        <div className="modal-overlay" onClick={() => setShowEmployeeModal(false)}>
          <div className="modal-content employee-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Employee QR</h3>
              <button
                onClick={() => setShowEmployeeModal(false)}
                className="close-btn"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="employee-modal-grid">
              <div className="detail-section">
                <h4>Employee Details</h4>
                <div className="employee-modal-photo-card">
                  <div className="employee-modal-photo-frame">
                    {getEmployeePhoto(selectedEmployee) ? (
                      <img
                        src={getEmployeePhoto(selectedEmployee)}
                        alt={`${selectedEmployee.name || selectedEmployee.empId} photo`}
                        className="employee-modal-photo"
                      />
                    ) : (
                      <span className="employee-modal-photo-fallback">
                        {(selectedEmployee.name || selectedEmployee.empId || "?")
                          .split(" ")
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((part) => part[0])
                          .join("")
                          .toUpperCase() || "?"}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="employee-modal-photo-label">Employee Photo</p>
                    <p className="employee-modal-photo-note">
                      {getEmployeePhoto(selectedEmployee) ? "Stored photo preview" : "No photo uploaded yet"}
                    </p>
                  </div>
                </div>
                <div className="detail-row">
                  <span>Employee ID:</span>
                  <strong className="reg-highlight">{selectedEmployee.empId}</strong>
                </div>
                <div className="detail-row">
                  <span>Name:</span>
                  <span>{selectedEmployee.name || "N/A"}</span>
                </div>
                <div className="detail-row">
                  <span>Status:</span>
                  <span className={`employee-status-badge ${getEmployeeEmploymentStatus(selectedEmployee)}`}>
                    {getEmployeeStatusLabel(selectedEmployee)}
                  </span>
                </div>
                <div className="detail-row">
                  <span>Mobile:</span>
                  <span>{selectedEmployee.mobile || "N/A"}</span>
                </div>
                <div className="detail-row">
                  <span>Email:</span>
                  <span>{selectedEmployee.email || "N/A"}</span>
                </div>
                <div className="detail-row">
                  <span>Joining Date:</span>
                  <span>{selectedEmployee.joiningDate ? new Date(selectedEmployee.joiningDate).toLocaleDateString() : "N/A"}</span>
                </div>
                <div className="detail-row">
                  <span>Photo URL:</span>
                  <span>{selectedEmployee.photoUrl || "N/A"}</span>
                </div>
                <div className="detail-row">
                  <span>Last Updated:</span>
                  <span>{selectedEmployee.updatedAt ? new Date(selectedEmployee.updatedAt).toLocaleString() : "N/A"}</span>
                </div>
                <div className="detail-row">
                  <span>Designation:</span>
                  <span>{selectedEmployee.designation || "N/A"}</span>
                </div>
                <div className="detail-row">
                  <span>Department:</span>
                  <span>{selectedEmployee.department || "N/A"}</span>
                </div>
                <div className="detail-row">
                  <span>Description:</span>
                  <span>{selectedEmployee.description || "N/A"}</span>
                </div>
                {isEmployeeTerminated(selectedEmployee) && (
                  <>
                    <div className="detail-row">
                      <span>Termination Date:</span>
                      <span>
                        {selectedEmployee.terminationDate
                          ? new Date(selectedEmployee.terminationDate).toLocaleString()
                          : "N/A"}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span>Termination Reason:</span>
                      <span>{selectedEmployee.terminationReason || "N/A"}</span>
                    </div>
                    <div className="detail-row">
                      <span>Letter Sent:</span>
                      <span>
                        {selectedEmployee.terminationLetterSentAt
                          ? new Date(selectedEmployee.terminationLetterSentAt).toLocaleString()
                          : "No"}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="detail-section employee-qr-section">
                <h4>QR Code</h4>
                <p className="event-description">
                  Scan this QR to open employee verification on the frontend route. It uses VITE_EMPLOYEE_VERIFY_URL when available and falls back to localhost frontend during local development.
                </p>
                <div className="employee-qr-preview">
                  <img
                    src={buildEmployeeQrUrl(selectedEmployee)}
                    alt={`${selectedEmployee.name || selectedEmployee.empId} QR code`}
                  />
                </div>
                <div className="employee-qr-actions">
                  <button
                    type="button"
                    className="export-btn"
                    onClick={() => navigator.clipboard?.writeText(selectedEmployee.empId)}
                  >
                    Copy Employee ID
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEntriesModal && (
        <div className="modal-overlay" onClick={() => setShowEntriesModal(false)}>
          <div className="modal-content wide-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {selectedEventForEntries?.shortName || "Event"} Entries
              </h3>
              <button
                onClick={() => setShowEntriesModal(false)}
                className="close-btn"
              >
                <XCircle size={20} />
              </button>
            </div>

            {entriesLoading ? (
              <p>Loading entries...</p>
            ) : (
              <div className="table-container">
                <p className="event-description" style={{ marginBottom: "12px" }}>
                  Date: {selectedEventForEntries?.date || "N/A"}
                </p>
                <p className="event-description" style={{ marginBottom: "16px" }}>
                  {selectedEventForEntries?.description || "No description"}
                </p>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Reg ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Mobile</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedEventEntries.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="no-data">
                          No entries for this event yet.
                        </td>
                      </tr>
                    ) : (
                      selectedEventEntries.map((entry) => (
                        <tr key={entry._id}>
                          <td>{entry.registrationId || "N/A"}</td>
                          <td>{entry.fullName || "N/A"}</td>
                          <td>{entry.email || "N/A"}</td>
                          <td>{entry.mobile || "N/A"}</td>
                          <td>
                            <span className={`status-badge ${entry.paymentStatus || "pending"}`}>
                              {entry.paymentStatus || "pending"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Enhanced User Detail Modal – includes all fields */}
      {showUserModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div
            className="modal-content wide-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Participant Details</h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="close-btn"
              >
                <XCircle size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-grid grid-3col">
                {/* Personal Information */}
                <div className="detail-section">
                  <h4>Personal Information</h4>
                  <div className="detail-row">
                    <span>Full Name:</span>
                    <strong>{selectedUser.fullName}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Email:</span>
                    <span>{selectedUser.email}</span>
                  </div>
                  <div className="detail-row">
                    <span>Mobile:</span>
                    <span>{selectedUser.mobile}</span>
                  </div>
                  <div className="detail-row">
                    <span>College:</span>
                    <span>{selectedUser.college || "N/A"}</span>
                  </div>
                  <div className="detail-row">
                    <span>Course Year:</span>
                    <span>{selectedUser.courseYear || "N/A"}</span>
                  </div>
                  <div className="detail-row">
                    <span>City:</span>
                    <span>{selectedUser.city || "N/A"}</span>
                  </div>
                </div>

                {/* Social & Links */}
                <div className="detail-section">
                  <h4>Social & Portfolio</h4>
                  <div className="detail-row">
                    <span>Portfolio:</span>
                    {selectedUser.portfolio ? (
                      <a
                        href={selectedUser.portfolio}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <LinkIcon size={14} /> Link
                      </a>
                    ) : (
                      <span>N/A</span>
                    )}
                  </div>
                  <div className="detail-row">
                    <span>GitHub:</span>
                    {selectedUser.github ? (
                      <a
                        href={selectedUser.github}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <LinkIcon size={14} /> Link
                      </a>
                    ) : (
                      <span>N/A</span>
                    )}
                  </div>
                  <div className="detail-row">
                    <span>Instagram:</span>
                    {selectedUser.instagram ? (
                      <a
                        href={selectedUser.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <LinkIcon size={14} /> Link
                      </a>
                    ) : (
                      <span>N/A</span>
                    )}
                  </div>
                </div>

                {/* Event Details */}
                <div className="detail-section">
                  <h4>Event Details</h4>
                  <div className="detail-row">
                    <span>Registration ID:</span>
                    <strong className="reg-highlight">
                      {selectedUser.registrationId}
                    </strong>
                  </div>
                  <div className="detail-row">
                    <span>Category:</span>
                    <span>{selectedUser.category}</span>
                  </div>
                  <div className="detail-row">
                    <span>Sub-Category:</span>
                    <span>
                      {formatArray(selectedUser.subCategory) || "N/A"}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span>Pass Name:</span>
                    <span>{selectedUser.passName || "N/A"}</span>
                  </div>
                </div>

                {/* Team Information (new) */}
                <div className="detail-section">
                  <h4>
                    <TeamIcon size={16} /> Team Information
                  </h4>
                  <div className="detail-row">
                    <span>Team Leader:</span>
                    <span>{selectedUser.teamLeader || "N/A"}</span>
                  </div>
                  <div className="detail-row">
                    <span>Team Members:</span>
                    <span>
                      {formatArray(selectedUser.teamMembers) || "None"}
                    </span>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="detail-section">
                  <h4>Payment Information</h4>
                  <div className="detail-row">
                    <span>Order ID:</span>
                    <span>{selectedUser.orderId || "N/A"}</span>
                  </div>
                  <div className="detail-row">
                    <span>Payment ID:</span>
                    <span>{selectedUser.paymentId || "N/A"}</span>
                  </div>
                  <div className="detail-row">
                    <span>Payment Status:</span>
                    <span
                      className={`status-badge ${selectedUser.paymentStatus}`}
                    >
                      {selectedUser.paymentStatus}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span>Amount Paid:</span>
                    <span className="amount">
                      ₹{selectedUser.amountPaid || 0}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span>Referral Code:</span>
                    <span>{selectedUser.referralCode || "N/A"}</span>
                  </div>
                </div>

                {/* Check-in & Timestamps */}
                <div className="detail-section">
                  <h4>Check-in & System</h4>
                  <div className="detail-row">
                    <span>Checked In:</span>
                    {selectedUser.checkedIn ? (
                      <span className="checkin-status checked">
                        <CheckCircle size={16} />
                        Yes -{" "}
                        {selectedUser.checkInTime
                          ? new Date(selectedUser.checkInTime).toLocaleString()
                          : ""}
                      </span>
                    ) : (
                      <span className="checkin-status pending">
                        <UserX size={16} />
                        Not checked in
                      </span>
                    )}
                  </div>
                  <div className="detail-row">
                    <span>Registered At:</span>
                    <span>
                      {selectedUser.createdAt
                        ? new Date(selectedUser.createdAt).toLocaleString()
                        : "N/A"}
                    </span>
                  </div>
                </div>

                {/* QR Code */}
                {selectedUser.qrCode && (
                  <div className="detail-section qr-section">
                    <h4>QR Code</h4>
                    <img
                      src={selectedUser.qrCode}
                      alt="QR Code"
                      className="qr-preview"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
