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
    { name: "Basic Pass", price: 499, features: ["Camp access"], highlighted: false, total: 100, remainingSeats: 100, description: "" },
    { name: "Smart Pass", price: 999, features: ["Camp access", "Certificate"], highlighted: true, total: 60, remainingSeats: 60, description: "" },
    { name: "Premium Pass", price: 1499, features: ["Camp access", "Certificate", "Rewards kit"], highlighted: false, total: 30, remainingSeats: 30, description: "" },
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
  themeColor: "#D4AF37",
  seatsAvailable: 0,
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
