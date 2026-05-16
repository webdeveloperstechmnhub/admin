import React, { useEffect, useMemo, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";
import { Eye, Plus, Save, Trash2 } from "lucide-react";
import EventAdminLayout from "../components/EventAdminLayout";
import GoBackButton from "../components/GoBackButton";
import { eventCategories, requestJson } from "../utils/eventApi";

const draftKey = (id) => `techmnhub-event-draft-${id || "new"}`;

const emptyEvent = {
  title: "TechMNHub Future Skills Summer Camp 2026",
  subtitle: "Future-ready learning for school students",
  slug: "future-skills-summer-camp-2026",
  shortName: "Future Skills Summer Camp 2026",
  date: "Coming Soon",
  dateLabel: "Coming Soon",
  comingSoon: true,
  tagline: "Create. Code. Communicate. Compete.",
  shortDescription: "",
  fullDescription: "",
  bannerImage: "",
  thumbnailImage: "",
  gallery: [],
  promoVideoUrl: "",
  startDate: "",
  endDate: "",
  timings: "",
  venue: "",
  googleMapsLink: "",
  organizer: "TechMNHub",
  contact: { phone: "", email: "" },
  category: "Summer Camp",
  eligibility: { minClass: "", maxClass: "", boardsAccepted: [], ageGroup: "" },
  highlights: ["AI Image Generation", "Coding Basics", "Public Speaking", "Team Competitions"],
  dailySchedules: [{ dayTitle: "Day 1", activities: ["Orientation"], sessionTimings: "10:00 AM - 1:00 PM", speakers: ["TechMNHub Mentor"] }],
  ticketTypes: [
    { name: "Basic Pass", price: 499, features: ["Camp access"], highlighted: false, total: 100, remainingSeats: 100 },
    { name: "Smart Pass", price: 999, features: ["Camp access", "Certificate"], highlighted: true, total: 60, remainingSeats: 60 },
    { name: "Premium Pass", price: 1499, features: ["Camp access", "Certificate", "Rewards kit"], highlighted: false, total: 30, remainingSeats: 30 },
  ],
  registrationSettings: { enabled: false, deadline: "", maxRegistrations: 190, waitingList: true, autoConfirmation: true },
  referralCodes: [{ code: "TMH2026", discountType: "flat", discountValue: 100, active: true, maxUses: 0, usedCount: 0 }],
  displayOptions: {
    mediaTile: true,
    statsTile: true,
    eligibilityTile: true,
    highlightsTile: true,
    scheduleTile: true,
    passesTile: true,
    rewardsTile: true,
    seoTile: true,
    contactTile: true,
    registrationTile: true,
  },
  certificates: ["Participation Certificate"],
  awards: ["Top performer award"],
  gifts: ["Learning kit"],
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
    ticketTypes: (form.ticketTypes || []).map((pass) => ({ ...pass, price: Number(pass.price || 0), total: Number(pass.total || 0), remainingSeats: Number(pass.remainingSeats || pass.total || 0), features: splitText(listText(pass.features)) })),
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
            <>
              {(form.dailySchedules || []).map((item, index) => (
                <div className="event-card schedule-card" key={`schedule-${index}`}>
                  <div className="inline-actions"><strong>Day {index + 1}</strong><button className="event-btn danger" type="button" onClick={() => removeArrayItem("dailySchedules", index)}><Trash2 size={15} /></button></div>
                  <div className="event-form-grid">
                    <div className="event-field"><label>Day title</label><input className="event-input" value={item.dayTitle} onChange={(e) => updateArrayItem("dailySchedules", index, { ...item, dayTitle: e.target.value })} /></div>
                    <div className="event-field"><label>Session timings</label><input className="event-input" value={item.sessionTimings} onChange={(e) => updateArrayItem("dailySchedules", index, { ...item, sessionTimings: e.target.value })} /></div>
                    <div className="event-field"><label>Activities</label><input className="event-input" value={listText(item.activities)} onChange={(e) => updateArrayItem("dailySchedules", index, { ...item, activities: splitText(e.target.value) })} /></div>
                    <div className="event-field"><label>Speaker names</label><input className="event-input" value={listText(item.speakers)} onChange={(e) => updateArrayItem("dailySchedules", index, { ...item, speakers: splitText(e.target.value) })} /></div>
                  </div>
                </div>
              ))}
              <button className="event-btn ghost" type="button" onClick={() => addArrayItem("dailySchedules", { dayTitle: "", activities: [], sessionTimings: "", speakers: [] })}><Plus size={15} /> Add Day</button>
            </>
          )}

          {step === 6 && (
            <>
              {(form.ticketTypes || []).map((pass, index) => (
                <div className="event-card pass-card" key={`pass-${index}`}>
                  <div className="inline-actions"><strong>{pass.name || `Pass ${index + 1}`}</strong><button className="event-btn danger" type="button" onClick={() => removeArrayItem("ticketTypes", index)}><Trash2 size={15} /></button></div>
                  <div className="event-form-grid">
                    <div className="event-field"><label>Pass name</label><input className="event-input" value={pass.name} onChange={(e) => updateArrayItem("ticketTypes", index, { ...pass, name: e.target.value })} /></div>
                    <div className="event-field"><label>Price</label><input type="number" className="event-input" value={pass.price} onChange={(e) => updateArrayItem("ticketTypes", index, { ...pass, price: e.target.value })} /></div>
                    <div className="event-field full"><label>Features</label><input className="event-input" value={listText(pass.features)} onChange={(e) => updateArrayItem("ticketTypes", index, { ...pass, features: splitText(e.target.value) })} /></div>
                    <div className="event-field"><label>Seat limit</label><input type="number" className="event-input" value={pass.total} onChange={(e) => updateArrayItem("ticketTypes", index, { ...pass, total: e.target.value })} /></div>
                    <div className="event-field"><label>Remaining seats</label><input type="number" className="event-input" value={pass.remainingSeats} onChange={(e) => updateArrayItem("ticketTypes", index, { ...pass, remainingSeats: e.target.value })} /></div>
                    <label className="event-field"><input type="checkbox" checked={Boolean(pass.highlighted)} onChange={(e) => updateArrayItem("ticketTypes", index, { ...pass, highlighted: e.target.checked })} /> Highlighted pass</label>
                  </div>
                </div>
              ))}
              <button className="event-btn ghost" type="button" onClick={() => addArrayItem("ticketTypes", { name: "", price: 0, features: [], highlighted: false, total: 0, remainingSeats: 0 })}><Plus size={15} /> Add Pass</button>
            </>
          )}

          {step === 7 && (
            <div className="event-form-grid">
              <label className="event-field"><input type="checkbox" checked={Boolean(form.registrationSettings?.enabled)} disabled={Boolean(form.comingSoon)} onChange={(e) => updateNested("registrationSettings", "enabled", e.target.checked)} /> Enable registration</label>
              <label className="event-field"><input type="checkbox" checked={Boolean(form.registrationSettings?.waitingList)} onChange={(e) => updateNested("registrationSettings", "waitingList", e.target.checked)} /> Waiting list</label>
              <label className="event-field"><input type="checkbox" checked={Boolean(form.registrationSettings?.autoConfirmation)} onChange={(e) => updateNested("registrationSettings", "autoConfirmation", e.target.checked)} /> Auto confirmation</label>
              <div className="event-field"><label>Registration deadline</label><input type="date" className="event-input" value={form.registrationSettings?.deadline || ""} onChange={(e) => updateNested("registrationSettings", "deadline", e.target.value)} /></div>
              <div className="event-field"><label>Maximum registrations</label><input type="number" className="event-input" value={form.registrationSettings?.maxRegistrations || 0} onChange={(e) => updateNested("registrationSettings", "maxRegistrations", e.target.value)} /></div>
              {form.comingSoon && <div className="event-field full"><span className="status-pill draft">Coming Soon blocks registrations automatically.</span></div>}
            </div>
          )}

          {step === 8 && (
            <>
              {(form.referralCodes || []).map((item, index) => (
                <div className="event-card pass-card" key={`referral-${index}`}>
                  <div className="inline-actions"><strong>{item.code || `Referral ${index + 1}`}</strong><button className="event-btn danger" type="button" onClick={() => removeArrayItem("referralCodes", index)}><Trash2 size={15} /></button></div>
                  <div className="event-form-grid">
                    <div className="event-field"><label>Referral code</label><input className="event-input" value={item.code || ""} onChange={(e) => updateArrayItem("referralCodes", index, { ...item, code: e.target.value.toUpperCase() })} /></div>
                    <div className="event-field"><label>Discount type</label><select className="event-select" value={item.discountType || "flat"} onChange={(e) => updateArrayItem("referralCodes", index, { ...item, discountType: e.target.value })}><option value="flat">Flat amount</option><option value="percent">Percent</option></select></div>
                    <div className="event-field"><label>Discount value</label><input type="number" className="event-input" value={item.discountValue || 0} onChange={(e) => updateArrayItem("referralCodes", index, { ...item, discountValue: e.target.value })} /></div>
                    <div className="event-field"><label>Maximum uses</label><input type="number" className="event-input" value={item.maxUses || 0} onChange={(e) => updateArrayItem("referralCodes", index, { ...item, maxUses: e.target.value })} /></div>
                    <div className="event-field"><label>Used count</label><input type="number" className="event-input" value={item.usedCount || 0} readOnly /></div>
                    <label className="event-field"><input type="checkbox" checked={item.active !== false} onChange={(e) => updateArrayItem("referralCodes", index, { ...item, active: e.target.checked })} /> Active</label>
                  </div>
                </div>
              ))}
              <button className="event-btn ghost" type="button" onClick={() => addArrayItem("referralCodes", { code: "", discountType: "flat", discountValue: 0, active: true, maxUses: 0, usedCount: 0 })}><Plus size={15} /> Add Referral Code</button>
            </>
          )}

          {step === 9 && (
            <div className="event-form-grid">
              {Object.entries({
                mediaTile: "Media tile",
                statsTile: "Stats tile",
                eligibilityTile: "Eligibility tile",
                highlightsTile: "Highlights tile",
                scheduleTile: "Schedule tile",
                passesTile: "Passes tile",
                rewardsTile: "Rewards tile",
                seoTile: "SEO tile",
                contactTile: "Contact tile",
                registrationTile: "Registration tile",
              }).map(([key, label]) => (
                <label className="event-field" key={key}>
                  <input type="checkbox" checked={form.displayOptions?.[key] !== false} onChange={(e) => updateDisplayOption(key, e.target.checked)} /> {label}
                </label>
              ))}
            </div>
          )}

          {step === 10 && <div className="event-form-grid">{dynamicTextList("certificates", "Certificates", "Participation Certificate")}{dynamicTextList("awards", "Awards", "Top Innovator")}{dynamicTextList("gifts", "Gifts", "Learning Kit")}{dynamicTextList("rewardPrizes", "Prizes", "Premium goodies")}</div>}

          {step === 11 && (
            <div className="event-form-grid">
              <div className="event-field"><label>Meta title</label><input className="event-input" value={form.seo?.metaTitle || ""} onChange={(e) => updateNested("seo", "metaTitle", e.target.value)} /></div>
              <div className="event-field"><label>Open Graph image</label><input className="event-input" value={form.seo?.openGraphImage || ""} onChange={(e) => updateNested("seo", "openGraphImage", e.target.value)} /></div>
              <div className="event-field full"><label>Meta description</label><textarea className="event-textarea" value={form.seo?.metaDescription || ""} onChange={(e) => updateNested("seo", "metaDescription", e.target.value)} /></div>
              <div className="event-field full"><label>Keywords</label><input className="event-input" value={listText(form.seo?.keywords)} onChange={(e) => updateNested("seo", "keywords", splitText(e.target.value))} /></div>
              <label className="event-field"><input type="checkbox" checked={Boolean(form.featured)} onChange={(e) => update("featured", e.target.checked)} /> Featured event</label>
            </div>
          )}

          <div className="pagination-row">
            <button className="event-btn ghost" type="button" disabled={step === 0} onClick={() => setStep((prev) => prev - 1)}>Previous</button>
            <span>{step + 1} / {steps.length}</span>
            <button className="event-btn primary" type="button" disabled={step === steps.length - 1} onClick={() => setStep((prev) => prev + 1)}>Next</button>
          </div>
        </section>

        <aside className="event-card event-preview">
          <h2>Live Preview</h2>
          <div className="preview-banner">
            {form.bannerImage && <img src={form.bannerImage} alt={form.title} />}
            <strong>{form.title}</strong>
            <span>{form.tagline || form.subtitle}</span>
          </div>
          <div className="preview-list">
            <span className={`status-pill ${form.comingSoon ? "draft" : form.status}`}>{form.comingSoon ? "coming soon" : form.status}</span>
            <strong>{form.category}</strong>
            <span>{form.dateLabel || form.date || form.startDate || "Start date"}{form.endDate ? ` to ${form.endDate}` : ""}</span>
            <span>{form.timings || "Timings TBA"}</span>
            <span>{form.venue || "Venue TBA"}</span>
            <strong>Live registration counter: {form.registrationSettings?.maxRegistrations || "Unlimited"}</strong>
            {form.comingSoon && <span className="seat-warning">Registrations will not start until Coming Soon is off.</span>}
            {(form.ticketTypes || []).map((pass) => <span key={pass.name}>{pass.name}: Rs {pass.price} {Number(pass.remainingSeats) <= 10 && Number(pass.remainingSeats) > 0 ? "Low seats" : ""}</span>)}
          </div>
        </aside>
      </main>
    </EventAdminLayout>
  );
}
