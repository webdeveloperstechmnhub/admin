import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plus, Save, Trash2, Eye } from "lucide-react";
import EventAdminLayout from "../components/EventAdminLayout";
import GoBackButton from "../components/GoBackButton";
import { requestJson, eventCategories } from "../utils/eventApi";

const draftKey = (id) => `event-draft-${id || "new"}`;

const emptyEvent = {
  title: "",
  subtitle: "",
  slug: "",
  shortName: "",
  tagline: "",
  shortDescription: "",
  fullDescription: "",
  bannerImage: "",
  thumbnailImage: "",
  promoVideoUrl: "",
  gallery: [],
  date: "",
  dateLabel: "",
  startDate: "",
  endDate: "",
  timings: "",
  category: "Technology",
  venue: "",
  googleMapsLink: "",
  organizer: "",
  contact: { phone: "", email: "" },
  comingSoon: false,
  themeColor: "#D4AF37",
  seatsAvailable: 0,
  seatsLeft: null,
  certificates: [],
  highlights: [],
  schedule: { sessions: [] },
  ticketTypes: [],
  registrationSettings: {
    enabled: true,
    deadline: "",
    maxParticipants: 0,
    requiresApproval: false,
  },
  referralCodes: [],
  displayOptions: {
    showParticipants: true,
    showSchedule: true,
    showTickets: true,
    showRewards: true,
  },
  rewardPrizes: ["Premium goodies"],
  seo: { metaTitle: "", metaDescription: "", keywords: ["summer camp", "future skills"], openGraphImage: "" },
  featured: true,
  status: "draft",
};

const steps = [
  "Basic Information",
  "Media",
  "Event Details",
  "Eligibility",
  "Highlights",
  "Schedule",
  "Passes",
  "Registration",
  "Referrals",
  "Tiles",
  "Rewards",
  "SEO",
];

const splitText = (value) => String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
const listText = (value) => (Array.isArray(value) ? value.join(", ") : value || "");

export default function EventEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(emptyEvent);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);

  const isEditing = Boolean(id);

  useEffect(() => {
    const localDraft = localStorage.getItem(draftKey(id));
    if (localDraft) {
      setForm(JSON.parse(localDraft));
      setLoading(false);
      return;
    }

    if (!id) return;
    requestJson(`/events/${id}`)
      .then((event) => {
        setForm({
          ...emptyEvent,
          ...event,
          date: event.dateLabel || event.date || "",
          dateLabel: event.dateLabel || event.date || "",
          comingSoon: Boolean(event.comingSoon),
          startDate: event.startDate ? event.startDate.slice(0, 10) : "",
          endDate: event.endDate ? event.endDate.slice(0, 10) : "",
          registrationSettings: {
            ...emptyEvent.registrationSettings,
            ...(event.registrationSettings || {}),
            deadline: event.registrationSettings?.deadline ? event.registrationSettings.deadline.slice(0, 10) : "",
          },
          seo: { ...emptyEvent.seo, ...(event.seo || {}) },
          displayOptions: { ...emptyEvent.displayOptions, ...(event.displayOptions || {}) },
          contact: { ...emptyEvent.contact, ...(event.contact || {}) },
          eligibility: { ...emptyEvent.eligibility, ...(event.eligibility || {}) },
          referralCodes: Array.isArray(event.referralCodes) ? event.referralCodes : [],
        });
      })
      .catch((err) => alert(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(draftKey(id), JSON.stringify(form));
      setLastSavedAt(new Date());
    }, 800);
    return () => clearTimeout(timer);
  }, [form, id]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const updateNested = (group, key, value) => setForm((prev) => ({ ...prev, [group]: { ...prev[group], [key]: value } }));

  const addArrayItem = (key, item = "") => update(key, [...(form[key] || []), item]);
  const updateArrayItem = (key, index, value) => update(key, form[key].map((item, itemIndex) => (itemIndex === index ? value : item)));
  const removeArrayItem = (key, index) => update(key, form[key].filter((_, itemIndex) => itemIndex !== index));
  const updateDisplayOption = (key, value) => setForm((prev) => ({
    ...prev,
    displayOptions: { ...prev.displayOptions, [key]: value },
  }));

  const payload = useMemo(() => ({
    ...form,
    gallery: (form.gallery || []).map((item) => (typeof item === "string" ? { url: item, alt: "" } : item)).filter((item) => item.url),
    seo: { ...form.seo, keywords: splitText(listText(form.seo?.keywords)) },
    eligibility: { ...form.eligibility, boardsAccepted: splitText(listText(form.eligibility?.boardsAccepted)) },
    ticketTypes: (form.ticketTypes || []).map((pass) => ({ ...pass, price: Number(pass.price || 0), total: Number(pass.total || 0), remainingSeats: pass.remainingSeats !== undefined && pass.remainingSeats !== "" ? Number(pass.remainingSeats) : Number(pass.total || 0), features: splitText(listText(pass.features)) })),
    date: form.dateLabel || form.date,
    dateLabel: form.dateLabel || form.date,
    comingSoon: Boolean(form.comingSoon) || /coming\s*soon/i.test(form.dateLabel || form.date || ""),
    referralCodes: (form.referralCodes || []).map((item) => ({
      ...item,
      code: String(item.code || "").trim().toUpperCase(),
      discountValue: Number(item.discountValue || 0),
      maxUses: Number(item.maxUses || 0),
      usedCount: Number(item.usedCount || 0),
      active: item.active !== false,
    })).filter((item) => item.code),
  }), [form]);

  const save = async (status = form.status) => {
    if (!form.title.trim()) {
      alert("Event title is required.");
      setStep(0);
      return;
    }
    setSaving(true);
    try {
      const data = await requestJson(isEditing ? `/events/${id}` : "/events", {
        method: isEditing ? "PUT" : "POST",
        body: JSON.stringify({ ...payload, status }),
      });
      localStorage.removeItem(draftKey(id));
      const event = data.event || data;
      navigate(`/admin/events/${event._id}/edit`);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const dynamicTextList = (key, label, placeholder) => (
    <div className="event-field full">
      <label>{label}</label>
      {(form[key] || []).map((item, index) => (
        <div className="dynamic-row" key={`${key}-${index}`}>
          <input className="event-input" value={item} placeholder={placeholder} onChange={(e) => updateArrayItem(key, index, e.target.value)} />
          <button className="event-btn danger" type="button" onClick={() => removeArrayItem(key, index)}>
            <Trash2 size={15} />
          </button>
        </div>
      ))}
      <button className="event-btn ghost" type="button" onClick={() => addArrayItem(key)}>
        <Plus size={15} /> Add {label}
      </button>
    </div>
  );

  if (loading) {
    return <EventAdminLayout title="Event Editor" subtitle="Loading event..."><section className="event-panel" style={{ padding: 18 }}>Loading...</section></EventAdminLayout>;
  }

  return (
    <EventAdminLayout
      title={isEditing ? "Edit Event" : "Create Event"}
      subtitle="Premium multi-step builder with autosave draft and live preview."
      actions={
        <div className="event-form-actions">
          <GoBackButton to="/admin/events" label="Back" className="event-btn ghost" />
          <span>{lastSavedAt ? `Draft autosaved ${lastSavedAt.toLocaleTimeString()}` : "Draft autosave ready"}</span>
          <button className="event-btn" type="button" disabled={saving} onClick={() => save("draft")}><Save size={16} /> Save Draft</button>
          <button className="event-btn success" type="button" disabled={saving} onClick={() => save("published")}><Eye size={16} /> Publish</button>
        </div>
      }
    >
      <main className="event-editor-grid">
        <aside className="event-card event-steps">
          {steps.map((item, index) => (
            <button key={item} className={`event-step ${step === index ? "active" : ""}`} type="button" onClick={() => setStep(index)}>
              {index + 1}. {item}
            </button>
          ))}
        </aside>

        <section className="event-card event-form-panel">
          <h2>{steps[step]}</h2>

          {step === 0 && (
            <div className="event-form-grid">
              <div className="event-field full"><label>Event title</label><input className="event-input" value={form.title} onChange={(e) => update("title", e.target.value)} /></div>
              <div className="event-field"><label>Subtitle</label><input className="event-input" value={form.subtitle} onChange={(e) => update("subtitle", e.target.value)} /></div>
              <div className="event-field"><label>Slug</label><input className="event-input" value={form.slug} onChange={(e) => update("slug", e.target.value)} /></div>
              <div className="event-field"><label>Short name</label><input className="event-input" value={form.shortName} onChange={(e) => update("shortName", e.target.value)} /></div>
              <div className="event-field"><label>Tagline</label><input className="event-input" value={form.tagline} onChange={(e) => update("tagline", e.target.value)} /></div>
              <div className="event-field full"><label>Short description</label><textarea className="event-textarea" value={form.shortDescription} onChange={(e) => update("shortDescription", e.target.value)} /></div>
              <div className="event-field full"><label>Full description</label><textarea className="event-textarea" value={form.fullDescription} onChange={(e) => update("fullDescription", e.target.value)} /></div>
            </div>
          )}

          {step === 1 && (
            <div className="event-form-grid">
              <div className="event-field"><label>Banner image URL</label><input className="event-input" value={form.bannerImage} onChange={(e) => update("bannerImage", e.target.value)} /></div>
              <div className="event-field"><label>Thumbnail URL</label><input className="event-input" value={form.thumbnailImage} onChange={(e) => update("thumbnailImage", e.target.value)} /></div>
              <div className="event-field full"><label>Promo video URL</label><input className="event-input" value={form.promoVideoUrl} onChange={(e) => update("promoVideoUrl", e.target.value)} /></div>
              <div className="event-field full">
                <label>Gallery uploads</label>
                {(form.gallery || []).map((item, index) => (
                  <div className="dynamic-row" key={`gallery-${index}`}>
                    <input className="event-input" value={item.url || item} onChange={(e) => updateArrayItem("gallery", index, { url: e.target.value, alt: "" })} />
                    <button className="event-btn danger" type="button" onClick={() => removeArrayItem("gallery", index)}><Trash2 size={15} /></button>
                  </div>
                ))}
                <button className="event-btn ghost" type="button" onClick={() => addArrayItem("gallery", { url: "", alt: "" })}><Plus size={15} /> Add Gallery Image</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="event-form-grid">
              <div className="event-field">
                <label>Date display</label>
                <input className="event-input" value={form.dateLabel || form.date || ""} placeholder="Coming Soon or 15 June 2026" onChange={(e) => {
                  update("dateLabel", e.target.value);
                  update("date", e.target.value);
                  if (/coming\s*soon/i.test(e.target.value)) {
                    update("comingSoon", true);
                    updateNested("registrationSettings", "enabled", false);
                  }
                }} />
              </div>
              <div className="event-field"><label>Start date</label><input type="date" className="event-input" value={form.startDate || ""} onChange={(e) => update("startDate", e.target.value)} /></div>
              <div className="event-field"><label>End date</label><input type="date" className="event-input" value={form.endDate || ""} onChange={(e) => update("endDate", e.target.value)} /></div>
              <div className="event-field"><label>Timings</label><input className="event-input" value={form.timings} onChange={(e) => update("timings", e.target.value)} /></div>
              <div className="event-field"><label>Category</label><select className="event-select" value={form.category} onChange={(e) => update("category", e.target.value)}>{eventCategories.map((category) => <option key={category}>{category}</option>)}</select></div>
              <div className="event-field full"><label>Venue</label><input className="event-input" value={form.venue} onChange={(e) => update("venue", e.target.value)} /></div>
              <div className="event-field full"><label>Google Maps link</label><input className="event-input" value={form.googleMapsLink} onChange={(e) => update("googleMapsLink", e.target.value)} /></div>
              <div className="event-field"><label>Organizer name</label><input className="event-input" value={form.organizer} onChange={(e) => update("organizer", e.target.value)} /></div>
              <div className="event-field"><label>Contact number</label><input className="event-input" value={form.contact?.phone || ""} onChange={(e) => updateNested("contact", "phone", e.target.value)} /></div>
              <div className="event-field"><label>Email</label><input className="event-input" value={form.contact?.email || ""} onChange={(e) => updateNested("contact", "email", e.target.value)} /></div>
              <div className="event-field"><label>Seats Left</label><input type="number" className="event-input" min="0" value={form.seatsAvailable || 0} onChange={(e) => update("seatsAvailable", parseInt(e.target.value) || 0)} /></div>
              <label className="event-field"><input type="checkbox" checked={Boolean(form.comingSoon)} onChange={(e) => {
                update("comingSoon", e.target.checked);
                if (e.target.checked) updateNested("registrationSettings", "enabled", false);
              }} /> Coming soon</label>
            </div>
          )}

          {step === 3 && (
            <div className="event-form-grid">
              <div className="event-field"><label>Minimum class</label><input className="event-input" value={form.eligibility?.minClass || ""} onChange={(e) => updateNested("eligibility", "minClass", e.target.value)} /></div>
              <div className="event-field"><label>Maximum class</label><input className="event-input" value={form.eligibility?.maxClass || ""} onChange={(e) => updateNested("eligibility", "maxClass", e.target.value)} /></div>
              <div className="event-field"><label>Boards accepted</label><input className="event-input" value={listText(form.eligibility?.boardsAccepted)} onChange={(e) => updateNested("eligibility", "boardsAccepted", splitText(e.target.value))} /></div>
              <div className="event-field"><label>Age group</label><input className="event-input" value={form.eligibility?.ageGroup || ""} onChange={(e) => updateNested("eligibility", "ageGroup", e.target.value)} /></div>
            </div>
          )}

          {step === 4 && <div className="event-form-grid">{dynamicTextList("highlights", "Highlights", "AI Image Generation")}</div>}

          {step === 5 && (
            <div className="event-form-grid">
              <div className="event-field full">
                <label>Schedule Sessions</label>
                {(form.schedule?.sessions || []).map((session, index) => (
                  <div className="dynamic-row" key={`session-${index}`}>
                    <input className="event-input" placeholder="Session title" value={session.title || ""} onChange={(e) => updateArrayItem("schedule.sessions", index, { ...session, title: e.target.value })} />
                    <button className="event-btn danger" type="button" onClick={() => removeArrayItem("schedule.sessions", index)}><Trash2 size={15} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="event-form-grid">
              <div className="event-field full">
                <label>Ticket Types / Passes</label>
                {(form.ticketTypes || []).map((pass, index) => (
                  <div className="pass-card" key={`pass-${index}`}>
                    <label className="event-field-inline">Name: <input className="event-input" placeholder="Pass name" value={pass.name || ""} onChange={(e) => updateArrayItem("ticketTypes", index, { ...pass, name: e.target.value })} /></label>
                    <label className="event-field-inline">Price: <input className="event-input" type="number" placeholder="Price" value={pass.price || 0} onChange={(e) => updateArrayItem("ticketTypes", index, { ...pass, price: e.target.value })} /></label>
                    <label className="event-field-inline">Desc: <input className="event-input" placeholder="Description" value={pass.description || ""} onChange={(e) => updateArrayItem("ticketTypes", index, { ...pass, description: e.target.value })} /></label>
                    <label className="event-field-inline">Total Seats: <input className="event-input" type="number" placeholder="Total seats" value={pass.total || 0} onChange={(e) => updateArrayItem("ticketTypes", index, { ...pass, total: e.target.value })} /></label>
                    <label className="event-field-inline">Seats Left: <input className="event-input" type="number" placeholder="Seats Left" value={pass.remainingSeats !== undefined ? pass.remainingSeats : pass.total || 0} onChange={(e) => updateArrayItem("ticketTypes", index, { ...pass, remainingSeats: e.target.value })} /></label>
                    <button className="event-btn danger" type="button" onClick={() => removeArrayItem("ticketTypes", index)}><Trash2 size={15} /></button>
                  </div>
                ))}
                <button className="event-btn ghost" type="button" onClick={() => addArrayItem("ticketTypes", { name: "", price: 0, description: "", total: 0, remainingSeats: 0, features: [], highlighted: false, appliesTo: "All", key: `pass-${Date.now()}` })}><Plus size={15} /> Add Pass</button>
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="event-form-grid">
              <label className="event-field"><input type="checkbox" checked={form.registrationSettings?.enabled} onChange={(e) => updateNested("registrationSettings", "enabled", e.target.checked)} /> Enable Registration</label>
              <div className="event-field"><label>Registration deadline</label><input type="date" className="event-input" value={form.registrationSettings?.deadline || ""} onChange={(e) => updateNested("registrationSettings", "deadline", e.target.value)} /></div>
              <div className="event-field"><label>Max participants</label><input type="number" className="event-input" min="0" value={form.registrationSettings?.maxParticipants || 0} onChange={(e) => updateNested("registrationSettings", "maxParticipants", parseInt(e.target.value) || 0)} /></div>
              <div className="event-field"><label>Seats Left (Optional - overrides default)</label><input type="number" className="event-input" min="0" placeholder="Leave empty to auto-calculate" value={form.seatsLeft || ""} onChange={(e) => setForm({ ...form, seatsLeft: e.target.value ? parseInt(e.target.value) : null })} /></div>
              <label className="event-field"><input type="checkbox" checked={form.registrationSettings?.requiresApproval} onChange={(e) => updateNested("registrationSettings", "requiresApproval", e.target.checked)} /> Requires approval</label>
            </div>
          )}

          {step === 8 && (
            <div className="event-form-grid">
              <div className="event-field full">
                <label>Referral Codes</label>
                {(form.referralCodes || []).map((code, index) => (
                  <div className="dynamic-row" key={`code-${index}`}>
                    <input className="event-input" placeholder="Code (auto-uppercase)" value={code.code || ""} onChange={(e) => updateArrayItem("referralCodes", index, { ...code, code: e.target.value })} />
                    <input className="event-input" type="number" placeholder="Discount %" value={code.discountValue || 0} onChange={(e) => updateArrayItem("referralCodes", index, { ...code, discountValue: e.target.value })} />
                    <button className="event-btn danger" type="button" onClick={() => removeArrayItem("referralCodes", index)}><Trash2 size={15} /></button>
                  </div>
                ))}
                <button className="event-btn ghost" type="button" onClick={() => addArrayItem("referralCodes", { code: "", discountValue: 0, maxUses: 0, usedCount: 0, active: true })}><Plus size={15} /> Add Code</button>
              </div>
            </div>
          )}

          {step === 9 && (
            <div className="event-form-grid">
              <label className="event-field"><input type="checkbox" checked={form.displayOptions?.showParticipants} onChange={(e) => updateDisplayOption("showParticipants", e.target.checked)} /> Show Participants</label>
              <label className="event-field"><input type="checkbox" checked={form.displayOptions?.showSchedule} onChange={(e) => updateDisplayOption("showSchedule", e.target.checked)} /> Show Schedule</label>
              <label className="event-field"><input type="checkbox" checked={form.displayOptions?.showTickets} onChange={(e) => updateDisplayOption("showTickets", e.target.checked)} /> Show Tickets</label>
              <label className="event-field"><input type="checkbox" checked={form.displayOptions?.showRewards} onChange={(e) => updateDisplayOption("showRewards", e.target.checked)} /> Show Rewards</label>
              <div className="event-field"><label>Theme Color</label><input type="color" className="event-input" value={form.themeColor || "#D4AF37"} onChange={(e) => update("themeColor", e.target.value)} /></div>
            </div>
          )}

          {step === 10 && (
            <div className="event-form-grid">
              {dynamicTextList("rewardPrizes", "Reward Prizes", "Prize description")}
            </div>
          )}

          {step === 11 && (
            <div className="event-form-grid">
              <div className="event-field full"><label>Meta title</label><input className="event-input" value={form.seo?.metaTitle || ""} onChange={(e) => updateNested("seo", "metaTitle", e.target.value)} /></div>
              <div className="event-field full"><label>Meta description</label><textarea className="event-textarea" value={form.seo?.metaDescription || ""} onChange={(e) => updateNested("seo", "metaDescription", e.target.value)} /></div>
              <div className="event-field full"><label>Keywords</label><input className="event-input" placeholder="Comma-separated" value={listText(form.seo?.keywords)} onChange={(e) => updateNested("seo", "keywords", splitText(e.target.value))} /></div>
            </div>
          )}
        </section>
      </main>
    </EventAdminLayout>
  );
}
