"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// =====================================================================
//  CLIENT CONFIGURATION (Mr. Nitin Bhujbal - Organic Farming Advisor)
// =====================================================================
const PLACE_ID = "ChIJj2jXU1B5xDsRRQ1moJkjnwU"; // Nitin Bhujbal Place ID

const CLIENT_CONFIG = {
  businessName: "Mr. Nitin Bhujbal",
  subHeading: "Organic Farming Advisor & Consultant",
  tagline: "ORGANIC FARMING • FARM PLANNING • SOIL TESTING • CROP YIELD",
  description:
    "Best Organic Farming Advisor & Consultant in Maharashtra. 17+ years of experience helping farmers with organic farming, soil testing, and sustainable farm planning to increase yield and reduce costs.",
  city: "Indapur, Pune, Maharashtra 413106",
  areaLabel: "Indapur, Pune",
  fullAddress: "Tirupati Shopping Center, Old Pune-Solapur Highway, Indapur, Pune, Maharashtra 413106",
  phone: "+919960836343",
  cleanPhone: "919960836343",
  logoUrl: "/logo.png",

  googleReviewUrl: `https://search.google.com/local/writereview?placeid=${PLACE_ID}`,
  mapsDirectionUrl: `https://www.google.com/maps/dir/?api=1&destination=Mr.+Nitin+Bhujbal&destination_place_id=${PLACE_ID}`,

  instagramUrl: "https://www.instagram.com/nitin_bhujbal2141/",
  facebookUrl: "https://www.facebook.com/shetitumachikhatriamachi/",
  youtubeUrl: "",
  websiteUrl: "https://nitinbhujbal.com/",

  // Developer / branding (footer)
  developerName: "Sandesh Koshti",
  developerWhatsapp: "917972195009",
  developerPhoneDisplay: "+91 79721 95009",

  // Must match exactly with the route.js CHIPS keys
  chips: [
    'Organic Farming',
    'Farm Planning',
    'Soil Testing',
    'Crop Yield Increase',
    'Cost Saving',
    'Expert Guidance',
    'Organic Fertilizers',
    'Govt Schemes'
  ],
};

const HAS_SOCIAL = !!(CLIENT_CONFIG.instagramUrl || CLIENT_CONFIG.facebookUrl || CLIENT_CONFIG.youtubeUrl || CLIENT_CONFIG.websiteUrl);

const MAP_EMBED_URL = `https://www.google.com/maps?q=${encodeURIComponent(
  `${CLIENT_CONFIG.businessName}, ${CLIENT_CONFIG.fullAddress}`
)}&output=embed`;

const DEVELOPER_WA_LINK = `https://wa.me/${CLIENT_CONFIG.developerWhatsapp}?text=${encodeURIComponent(
  "Hi Sandesh, I saw your work on Mr. Nitin Bhujbal's review page and I'd like a similar setup for my business."
)}`;

function useTypewriter(fullText, speed = 10) {
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!fullText) {
      setDisplayText("");
      setIsTyping(false);
      return;
    }
    setDisplayText("");
    setIsTyping(true);
    let index = 0;
    const timer = setInterval(() => {
      index++;
      setDisplayText(fullText.slice(0, index));
      if (index >= fullText.length) {
        clearInterval(timer);
        setIsTyping(false);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [fullText, speed]);

  return { displayText, isTyping };
}

async function copyToClipboard(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {}
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch (e) {
    return false;
  }
}

export default function AgriReviewPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedChips, setSelectedChips] = useState([]);

  // Default Language Set to Marathi
  const [language, setLanguage] = useState("MARATHI");

  const [reviewDraft, setReviewDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const abortControllerRef = useRef(null);
  const requestIdRef = useRef(0);
  const recentLengthsRef = useRef([]);
  const { displayText, isTyping } = useTypewriter(reviewDraft, 10);

  useEffect(() => {
    setMounted(true);
    return () => {
      requestIdRef.current++;
      abortControllerRef.current?.abort();
    };
  }, []);

  const generateAIReview = useCallback(async (chipsToUse, lang) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const requestId = ++requestIdRef.current;

    setLoading(true);
    setCopied(false);
    setError("");
    setReviewDraft("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          businessName: CLIENT_CONFIG.businessName,
          category: CLIENT_CONFIG.tagline,
          description: CLIENT_CONFIG.description,
          city: CLIENT_CONFIG.city,
          selectedChips: chipsToUse,
          language: lang,
          nonce: Math.random().toString(36).substring(2, 12),
          timestamp: Date.now(),
          recentLengths: recentLengthsRef.current,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Draft generation failed (${res.status}).`);
      if (!data.review?.trim()) throw new Error("The API returned an empty draft.");
      if (requestId !== requestIdRef.current) return;

      if (data.meta) {
        recentLengthsRef.current = [...recentLengthsRef.current, data.meta].slice(-6);
      }
      setReviewDraft(data.review.trim());
    } catch (err) {
      if (err.name === "AbortError") return;
      if (requestId === requestIdRef.current) {
        setError(err.message || "Unable to generate a draft.");
      }
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    generateAIReview(selectedChips, language);
    return () => abortControllerRef.current?.abort();
  }, [mounted, selectedChips, language, generateAIReview]);

  function toggleChip(chip) {
    let updated;
    if (selectedChips.includes(chip)) {
      updated = selectedChips.filter((c) => c !== chip);
    } else {
      if (selectedChips.length >= 3) {
        alert("तुम्ही जास्तीत जास्त ३ पर्याय निवडू शकता."); // Marathi alert
        return;
      }
      updated = [...selectedChips, chip];
    }
    setSelectedChips(updated);
  }

  function handleLanguageChange(lang) {
    if (lang === language) {
      generateAIReview(selectedChips, lang);
      return;
    }
    setLanguage(lang);
  }

  async function handleCopyAndRedirect() {
    if (!reviewDraft || loading || isTyping) return;
    const ok = await copyToClipboard(reviewDraft);
    if (!ok) {
      setError("Could not copy the draft. Please select and copy it manually.");
      return;
    }
    setCopied(true);
    setTimeout(() => {
      window.location.href = CLIENT_CONFIG.googleReviewUrl;
    }, 550);
  }

  function handleSaveContact() {
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${CLIENT_CONFIG.businessName}
ORG:${CLIENT_CONFIG.businessName}
TEL;TYPE=CELL:${CLIENT_CONFIG.phone}
ADR;TYPE=WORK:;;${CLIENT_CONFIG.fullAddress};;;;
NOTE:${CLIENT_CONFIG.subHeading}
END:VCARD`;

    const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${CLIENT_CONFIG.businessName.replace(/\s+/g, "_")}.vcf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  if (!mounted) return <div style={{ minHeight: "100vh", backgroundColor: "#f4fbf4" }} />;

  return (
    <main className="agri-glass-viewport">
      {/* BULLETPROOF FIXED BACKGROUND */}
      <div className="fixed-bg"></div>

      <div className="main-content-flow">

        {/* Logo */}
        <div className="brand-medallion-badge">
          <div
            className="logo-circle-container"
            style={{ backgroundImage: `url(${CLIENT_CONFIG.logoUrl})` }}
            role="img"
            aria-label={`${CLIENT_CONFIG.businessName} logo`}
          ></div>
          <h1 className="brand-main-title">{CLIENT_CONFIG.businessName}</h1>
        </div>

        <p className="brand-serif-subtitle">{CLIENT_CONFIG.subHeading}</p>

        <div className="organic-divider">
          <span className="divider-line"></span>
          <span className="divider-leaf">🌱</span>
          <span className="divider-line"></span>
        </div>

        <div className="stars-cluster" aria-hidden="true">
          <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
        </div>

        <p className="experience-tracker-title">तुमचा अनुभव शेअर करा</p>

        {/* Filter Chips */}
        <div className="floating-pills-cloud">
          {CLIENT_CONFIG.chips.map((chip) => {
            const active = selectedChips.includes(chip);
            return (
              <button
                key={chip}
                type="button"
                onClick={() => toggleChip(chip)}
                aria-pressed={active}
                className={`embossed-pill ${active ? "active" : ""}`}
              >
                {chip} {active && "✓"}
              </button>
            );
          })}
        </div>
        <p className="chip-hint">Select up to 3 points</p>

        {/* Language Selector (Marathi First, then English, Hindi) */}
        <div className="capsule-lang-dock">
          {["MARATHI", "ENGLISH", "HINDI"].map((lang) => {
            const active = language === lang;
            return (
              <button
                key={lang}
                type="button"
                onClick={() => handleLanguageChange(lang)}
                aria-pressed={active}
                className={`capsule-lang-btn ${active ? "active" : ""}`}
              >
                {lang}
              </button>
            );
          })}
        </div>

        {/* Review Box (Glassmorphism) */}
        <div className="signature-review-box glass-panel">
          <div className="box-top-ribbon">
            <div className="label-badge">
              <span className="dot-ping"></span>
              YOUR REVIEW
            </div>
            <button
              type="button"
              disabled={loading || isTyping}
              onClick={() => generateAIReview(selectedChips, language)}
              className="top-rewrite-btn"
            >
              <span>Rewrite</span>
            </button>
          </div>

          <div className="review-display-zone">
            {loading ? (
              <div className="loader-shimmer-wrap">
                <span className="sparkle-icon">✦</span>
                <span className="shimmer-text"> Crafting authentic review...</span>
              </div>
            ) : error ? (
              <p className="review-error">{error}</p>
            ) : reviewDraft ? (
              <p className="review-body-text">
                {displayText}
                {isTyping && <span className="typewriter-cursor"></span>}
              </p>
            ) : (
              <p className="review-placeholder">Your review draft will appear here.</p>
            )}
          </div>

          <div className="card-ornament-center"><span>🌱</span></div>

          <button
            type="button"
            disabled={loading || isTyping || !reviewDraft}
            onClick={handleCopyAndRedirect}
            className={`full-luxury-copy-btn ${copied ? "copied" : ""}`}
          >
            <span>{copied ? "Copied! Opening Google..." : "Copy & Paste on Google"}</span>
          </button>
          <p className="card-disclaimer-note">Please review the wording before posting.</p>
        </div>

        {/* Quick Actions (Glassmorphism) */}
        <div className="quick-actions-card glass-panel">
          <div className="soft-action-grid">
            <div className="action-row-upper">
              {/* WhatsApp */}
              <a href={`https://wa.me/${CLIENT_CONFIG.cleanPhone}`} target="_blank" rel="noreferrer" className="soft-circle-action">
                <div className="icon-disc whatsapp-disc">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                </div>
                <span className="icon-tag">WhatsApp</span>
              </a>

              {/* Call Us */}
              <a href={`tel:${CLIENT_CONFIG.phone}`} className="soft-circle-action">
                <div className="icon-disc call-disc">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </div>
                <span className="icon-tag">Call Us</span>
              </a>

              {/* Save Contact */}
              <button type="button" onClick={handleSaveContact} className="soft-circle-action">
                <div className="icon-disc contact-disc">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                </div>
                <span className="icon-tag">Save Contact</span>
              </button>

              {/* Directions */}
              <a href={CLIENT_CONFIG.mapsDirectionUrl} target="_blank" rel="noreferrer" className="soft-circle-action">
                <div className="icon-disc map-disc">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <span className="icon-tag">Directions</span>
              </a>
            </div>

            <div className="action-row-lower" style={HAS_SOCIAL ? undefined : { display: "none" }}>
              {CLIENT_CONFIG.instagramUrl && (
                <a href={CLIENT_CONFIG.instagramUrl} target="_blank" rel="noreferrer" className="soft-circle-action">
                  <div className="icon-disc insta-disc">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                  </div>
                  <span className="icon-tag">Instagram</span>
                </a>
              )}
              {CLIENT_CONFIG.facebookUrl && (
                <a href={CLIENT_CONFIG.facebookUrl} target="_blank" rel="noreferrer" className="soft-circle-action">
                  <div className="icon-disc fb-disc">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                  </div>
                  <span className="icon-tag">Facebook</span>
                </a>
              )}
              {CLIENT_CONFIG.websiteUrl && (
                <a href={CLIENT_CONFIG.websiteUrl} target="_blank" rel="noreferrer" className="soft-circle-action">
                  <div className="icon-disc web-disc">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  </div>
                  <span className="icon-tag">Website</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Map Card (Glassmorphism) */}
        <div className="embedded-map-card glass-panel">
          <a href={CLIENT_CONFIG.mapsDirectionUrl} target="_blank" rel="noreferrer" className="map-card-header-link">
            <div className="address-highlight-box">
              <p className="agency-clean-address"><strong>📍 Address:</strong> {CLIENT_CONFIG.fullAddress}</p>
            </div>
            <div className="map-card-header">
              <span>Visit Us • {CLIENT_CONFIG.areaLabel}</span>
            </div>
          </a>
          <div className="map-iframe-container">
            <iframe
              title={`${CLIENT_CONFIG.businessName} Location`}
              src={MAP_EMBED_URL}
              width="100%"
              height="170"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <a
            href={CLIENT_CONFIG.mapsDirectionUrl}
            target="_blank"
            rel="noreferrer"
            className="map-directions-link"
          >
            Get Directions on Google Maps &rarr;
          </a>
        </div>

        {/* Mini Footer */}
        <footer className="mini-footer">
          <span className="mini-footer-pill glass-panel">
            Designed &amp; Developed by <strong>{CLIENT_CONFIG.developerName}</strong>
            <span className="mini-footer-dot">•</span>
            <a href={DEVELOPER_WA_LINK} target="_blank" rel="noreferrer">
              {CLIENT_CONFIG.developerPhoneDisplay}
            </a>
          </span>
        </footer>
      </div>

      <style jsx global>{`
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background-color: #f4fbf4 !important;
          min-height: 100% !important;
          overflow-x: hidden !important;
        }

        .agri-glass-viewport {
          position: relative;
          isolation: isolate;
          --tx-main: #14532d;
          --tx-sub: #166534;
          --brand-primary: #15803d;
          --brand-dark: #0f6130;
          --brand-light: #22a355;
          --brand-gold: #eab308;
          --glass-bg: rgba(255, 255, 255, 0.85);
          --glass-border: rgba(255, 255, 255, 0.6);
          --glass-shadow: rgba(21, 128, 61, 0.08);

          min-height: 100vh;
          min-height: 100dvh;
          background-color: transparent;
          padding: 10px 16px 24px;
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: var(--tx-main);
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* FIXED BACKGROUND */
        .fixed-bg {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          height: 100dvh;
          background-image: url('/bg.png');
          background-size: cover;
          background-position: center bottom;
          background-repeat: no-repeat;
          z-index: 0;
          pointer-events: none;
        }

        .main-content-flow {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 410px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .glass-panel {
          background: var(--glass-bg);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid var(--glass-border);
          box-shadow:
            0 8px 32px var(--glass-shadow),
            inset 0 1px 1px rgba(255, 255, 255, 0.85);
        }

        .brand-medallion-badge {
          margin-top: 12px;
          margin-bottom: 6px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .logo-circle-container {
          width: 110px;
          height: 110px;
          border-radius: 50%;
          background-color: #ffffff;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          box-shadow: 0 10px 25px rgba(21, 128, 61, 0.2);
          margin-bottom: 12px;
          animation: floatLogo 3.5s ease-in-out infinite;
          border: 3px solid var(--brand-primary);
          transition: transform 0.2s ease;
        }

        .logo-circle-container:active {
          transform: scale(0.96);
        }

        @keyframes floatLogo {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }

        .brand-main-title {
          font-family: Georgia, serif;
          font-size: 26px;
          font-weight: 800;
          color: var(--tx-main);
          margin: 0 0 4px;
          letter-spacing: 0.3px;
          text-shadow: 0 1px 2px rgba(255,255,255,0.8);
        }

        .brand-serif-subtitle {
          font-family: Georgia, serif;
          font-style: italic;
          font-size: 13.5px;
          color: var(--tx-sub);
          margin: 0 0 10px;
        }

        .organic-divider {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 85%;
          margin: 4px auto 12px;
          gap: 10px;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--brand-primary), transparent);
          opacity: 0.3;
        }

        .divider-leaf {
          color: var(--brand-primary);
          font-size: 10px;
        }

        .stars-cluster {
          display: flex;
          gap: 4px;
          color: var(--brand-gold);
          font-size: 16px;
          margin-bottom: 4px;
        }

        .experience-tracker-title {
          font-size: 9.5px;
          font-weight: 800;
          letter-spacing: 2px;
          color: var(--brand-primary);
          text-transform: uppercase;
          margin: 0 0 6px;
        }

        .chip-hint {
          font-size: 10px;
          color: var(--tx-sub);
          margin: 0 0 12px;
          opacity: 0.9;
        }

        .floating-pills-cloud {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 6px;
          margin-bottom: 6px;
          width: 100%;
        }

        /* =========================================
           PREMIUM 3D FILTER CHIPS
           ========================================= */

        .embossed-pill {
          position: relative;
          border-radius: 999px;
          padding: 6px 14px;
          font-size: 11px;

          background: linear-gradient(
            145deg,
            #ffffff 0%,
            #e9f7ec 100%
          );

          color: var(--tx-sub);
          border: 1px solid #bfe6c9;
          cursor: pointer;

          box-shadow:
            0 4px 8px rgba(21, 128, 61, 0.12),
            0 1px 2px rgba(21, 128, 61, 0.08),
            inset 0 1px 1px rgba(255, 255, 255, 0.95),
            inset 0 -1px 2px rgba(21, 128, 61, 0.10);

          transition:
            transform 0.16s ease,
            box-shadow 0.16s ease,
            background 0.18s ease,
            color 0.18s ease,
            border-color 0.18s ease;
        }

        .embossed-pill:hover {
          transform: translateY(-2px);
          box-shadow:
            0 7px 12px rgba(21, 128, 61, 0.16),
            inset 0 1px 1px rgba(255, 255, 255, 0.95);
        }

        .embossed-pill:active {
          transform: translateY(2px) scale(0.98);
          box-shadow:
            0 1px 3px rgba(21, 128, 61, 0.14),
            inset 0 2px 4px rgba(21, 128, 61, 0.14);
        }

        .embossed-pill.active {
          background: linear-gradient(
            145deg,
            var(--brand-light) 0%,
            var(--brand-dark) 100%
          );

          color: #ffffff;
          font-weight: 700;
          border: 1px solid var(--brand-dark);

          box-shadow:
            0 6px 12px rgba(21, 128, 61, 0.35),
            0 2px 3px rgba(21, 128, 61, 0.20),
            inset 0 1px 1px rgba(255, 255, 255, 0.28),
            inset 0 -2px 2px rgba(5, 46, 22, 0.25);
        }

        .embossed-pill.active:active {
          transform: translateY(2px);
          box-shadow:
            0 1px 3px rgba(21, 128, 61, 0.25),
            inset 0 2px 4px rgba(5, 46, 22, 0.25);
        }

        /* =========================================
           PREMIUM 3D LANGUAGE SELECTOR
           ========================================= */

        .capsule-lang-dock {
          display: inline-flex;
          background: linear-gradient(
            145deg,
            #ffffff,
            #e9f7ec
          );
          border-radius: 999px;
          padding: 4px;
          gap: 3px;
          margin-bottom: 16px;

          box-shadow:
            0 5px 12px rgba(21, 128, 61, 0.13),
            inset 0 1px 2px rgba(255, 255, 255, 0.95);

          border: 1px solid #bfe6c9;
        }

        .capsule-lang-btn {
          position: relative;
          padding: 6px 15px;
          border-radius: 999px;
          border: 1px solid transparent;
          background: transparent;
          font-size: 10px;
          font-weight: 700;
          color: var(--tx-sub);
          cursor: pointer;

          transition:
            transform 0.16s ease,
            background 0.18s ease,
            box-shadow 0.18s ease;
        }

        .capsule-lang-btn.active {
          background: linear-gradient(
            145deg,
            #f6c91f,
            #d19c05
          );
          color: #14532d;
          border-color: #b98a04;

          box-shadow:
            0 4px 9px rgba(234, 179, 8, 0.40),
            inset 0 1px 1px rgba(255, 255, 255, 0.45),
            inset 0 -2px 2px rgba(120, 80, 0, 0.20);
        }

        .capsule-lang-btn:active {
          transform: translateY(2px);
        }

        /* =========================================
           REVIEW CARD
           ========================================= */

        .signature-review-box {
          width: 100%;
          border-radius: 24px;
          padding: 18px;
          box-sizing: border-box;
          margin-bottom: 16px;
          text-align: left;
          border-top: 4px solid var(--brand-primary);
        }

        .box-top-ribbon {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .label-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 8.5px;
          font-weight: 800;
          letter-spacing: 1.8px;
          color: var(--tx-sub);
          text-transform: uppercase;
        }

        .dot-ping {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--brand-primary);
        }

        /* =========================================
           PREMIUM 3D REWRITE BUTTON
           ========================================= */

        .top-rewrite-btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          padding: 6px 13px;
          border-radius: 999px;

          background: linear-gradient(
            145deg,
            #ffffff 0%,
            #e4f5e8 100%
          );

          border: 1px solid #bbf7d0;
          color: var(--brand-primary);
          font-size: 10.5px;
          font-weight: 700;
          cursor: pointer;

          box-shadow:
            0 3px 7px rgba(21, 128, 61, 0.12),
            inset 0 1px 1px rgba(255, 255, 255, 0.95),
            inset 0 -1px 2px rgba(21, 128, 61, 0.10);

          transition:
            transform 0.16s ease,
            box-shadow 0.16s ease,
            background 0.18s ease;
        }

        .top-rewrite-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow:
            0 6px 10px rgba(21, 128, 61, 0.16),
            inset 0 1px 1px rgba(255, 255, 255, 0.95);
        }

        .top-rewrite-btn:active:not(:disabled) {
          transform: translateY(2px);
          box-shadow:
            0 1px 2px rgba(21, 128, 61, 0.14),
            inset 0 2px 3px rgba(21, 128, 61, 0.16);
        }

        .top-rewrite-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .review-display-zone {
          min-height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px 2px 8px;
        }

        .loader-shimmer-wrap {
          color: var(--brand-primary);
          font-size: 12px;
          font-style: italic;
        }

        .review-body-text {
          font-family: Georgia, serif;
          font-size: 14.5px;
          line-height: 1.6;
          color: var(--tx-main);
          margin: 0;
          width: 100%;
          white-space: pre-wrap;
        }

        .review-placeholder {
          font-family: Georgia, serif;
          font-size: 13px;
          font-style: italic;
          color: #64748b;
          margin: 0;
        }

        .review-error {
          font-size: 12px;
          color: #ef4444;
          margin: 0;
        }

        .typewriter-cursor {
          display: inline-block;
          width: 2px;
          height: 13px;
          background: var(--brand-primary);
          margin-left: 3px;
          vertical-align: middle;
          animation: blink 0.7s infinite;
        }

        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

        .card-ornament-center {
          text-align: center;
          color: var(--brand-primary);
          font-size: 12px;
          margin: 6px 0 10px;
          opacity: 0.8;
        }

        /* =========================================
           PREMIUM 3D MAIN COPY BUTTON
           ========================================= */

        .full-luxury-copy-btn {
          position: relative;
          overflow: hidden;
          width: 100%;
          height: 50px;
          border-radius: 999px;

          background: linear-gradient(
            145deg,
            #22a355 0%,
            #15803d 48%,
            #0f6130 100%
          );

          border: 1px solid #0f6130;
          color: #ffffff;
          font-size: 12.5px;
          font-weight: 800;
          cursor: pointer;

          box-shadow:
            0 8px 15px rgba(21, 128, 61, 0.30),
            0 3px 6px rgba(15, 97, 48, 0.20),
            inset 0 1px 1px rgba(255, 255, 255, 0.30),
            inset 0 -2px 3px rgba(5, 46, 22, 0.28);

          transition:
            transform 0.16s ease,
            background 0.18s ease,
            box-shadow 0.16s ease,
            opacity 0.18s ease;
        }

        .full-luxury-copy-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow:
            0 12px 20px rgba(21, 128, 61, 0.34),
            0 4px 8px rgba(15, 97, 48, 0.20),
            inset 0 1px 1px rgba(255, 255, 255, 0.32);
        }

        .full-luxury-copy-btn:active:not(:disabled) {
          transform: translateY(2px);
          box-shadow:
            0 2px 5px rgba(21, 128, 61, 0.26),
            inset 0 3px 6px rgba(5, 46, 22, 0.30);
        }

        .full-luxury-copy-btn.copied {
          background: linear-gradient(
            145deg,
            #1b8f48,
            #0d5428
          );
        }

        .full-luxury-copy-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          box-shadow: none;
        }

        .card-disclaimer-note {
          font-size: 9.5px;
          color: var(--tx-sub);
          text-align: center;
          margin: 8px 0 0;
          font-style: italic;
        }

        /* =========================================
           QUICK ACTIONS CARD
           ========================================= */

        .quick-actions-card {
          width: 100%;
          border-radius: 22px;
          padding: 18px 12px;
          box-sizing: border-box;
          margin-bottom: 16px;
        }

        .soft-action-grid {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          width: 100%;
        }

        .action-row-upper, .action-row-lower {
          display: flex;
          justify-content: center;
          gap: 14px;
          width: 100%;
        }

        /* =========================================
           PREMIUM 3D ACTION BUTTONS
           ========================================= */

        .soft-circle-action {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          gap: 7px;
          text-decoration: none !important;
          color: var(--tx-sub);
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 3px 4px 5px;
          -webkit-tap-highlight-color: transparent;
          transition: transform 0.18s ease;
        }

        .soft-circle-action:hover {
          transform: translateY(-3px);
        }

        .soft-circle-action:active {
          transform: translateY(2px) scale(0.97);
        }

        .soft-circle-action:focus-visible {
          outline: 2px solid var(--brand-primary);
          outline-offset: 4px;
          border-radius: 14px;
        }

        .icon-disc {
          position: relative;
          width: 54px;
          height: 54px;
          border-radius: 50%;

          background: linear-gradient(
            145deg,
            #ffffff 0%,
            #e4f5e8 100%
          );

          display: grid;
          place-items: center;
          border: 1px solid #bbf7d0;

          box-shadow:
            0 7px 12px rgba(21, 128, 61, 0.16),
            0 2px 4px rgba(21, 128, 61, 0.10),
            inset 0 2px 3px rgba(255, 255, 255, 0.95),
            inset 0 -2px 3px rgba(21, 128, 61, 0.12);

          transition:
            transform 0.18s ease,
            box-shadow 0.18s ease,
            background 0.18s ease,
            border-color 0.18s ease;
        }

        /* Soft inner highlight */
        .icon-disc::before {
          content: "";
          position: absolute;
          top: 3px;
          left: 7px;
          right: 7px;
          height: 35%;
          border-radius: 50%;
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.55),
            rgba(255, 255, 255, 0)
          );
          pointer-events: none;
        }

        /* Icon depth */
        .icon-disc svg {
          position: relative;
          z-index: 1;
          width: 21px;
          height: 21px;
          stroke: var(--brand-primary);
          stroke-width: 1.8;
          filter: drop-shadow(0 1px 0 rgba(255, 255, 255, 0.7));
          transition: stroke 0.18s ease, transform 0.18s ease;
        }

        .soft-circle-action:hover .icon-disc {
          transform: translateY(-2px);
          box-shadow:
            0 10px 16px rgba(21, 128, 61, 0.20),
            0 3px 5px rgba(21, 128, 61, 0.12),
            inset 0 2px 3px rgba(255, 255, 255, 0.95);
        }

        .soft-circle-action:active .icon-disc {
          transform: translateY(2px);
          box-shadow:
            0 2px 4px rgba(21, 128, 61, 0.16),
            inset 0 3px 5px rgba(21, 128, 61, 0.18);
        }

        /* WhatsApp */
        .whatsapp-disc:hover {
          background: linear-gradient(145deg, #42e486, #1aaf58);
          border-color: #169c4d;
          box-shadow:
            0 7px 14px rgba(37, 211, 102, 0.28),
            inset 0 2px 3px rgba(255, 255, 255, 0.35);
        }
        .whatsapp-disc:hover svg { stroke: #ffffff; }

        /* Call */
        .call-disc:hover {
          background: linear-gradient(145deg, #45a4ff, #0874d1);
          border-color: #0868bd;
          box-shadow:
            0 7px 14px rgba(0, 122, 255, 0.24),
            inset 0 2px 3px rgba(255, 255, 255, 0.35);
        }
        .call-disc:hover svg { stroke: #ffffff; }

        /* Save Contact */
        .contact-disc:hover {
          background: linear-gradient(145deg, var(--brand-light), var(--brand-dark));
          border-color: var(--brand-dark);
          box-shadow:
            0 7px 14px rgba(21, 128, 61, 0.28),
            inset 0 2px 3px rgba(255, 255, 255, 0.30);
        }
        .contact-disc:hover svg { stroke: #ffffff; }

        /* Directions */
        .map-disc:hover {
          background: linear-gradient(145deg, #ff776b, #e34539);
          border-color: #cf382e;
          box-shadow:
            0 7px 14px rgba(234, 67, 53, 0.24),
            inset 0 2px 3px rgba(255, 255, 255, 0.30);
        }
        .map-disc:hover svg { stroke: #ffffff; }

        /* Website */
        .web-disc:hover {
          background: linear-gradient(145deg, var(--brand-light), var(--brand-dark));
          border-color: var(--brand-dark);
          box-shadow:
            0 7px 14px rgba(21, 128, 61, 0.28),
            inset 0 2px 3px rgba(255, 255, 255, 0.30);
        }
        .web-disc:hover svg { stroke: #ffffff; }

        /* Instagram */
        .insta-disc:hover {
          background: radial-gradient(
            circle at 30% 107%,
            #fdf497 0%,
            #fdf497 5%,
            #fd5949 45%,
            #d6249f 60%,
            #285AEB 90%
          );
          border-color: #d6249f;
          box-shadow:
            0 7px 14px rgba(214, 36, 159, 0.22),
            inset 0 2px 3px rgba(255, 255, 255, 0.30);
        }
        .insta-disc:hover svg { stroke: #ffffff; }

        /* Facebook */
        .fb-disc:hover {
          background: linear-gradient(145deg, #4095ff, #1877f2);
          border-color: #1266cf;
          box-shadow:
            0 7px 14px rgba(24, 119, 242, 0.24),
            inset 0 2px 3px rgba(255, 255, 255, 0.30);
        }
        .fb-disc:hover svg { stroke: #ffffff; }

        .icon-tag {
          font-size: 9.5px;
          font-weight: 700;
          color: var(--tx-main);
          line-height: 1.3;
          white-space: nowrap;
        }

        /* =========================================
           MAP CARD
           ========================================= */

        .embedded-map-card {
          width: 100%;
          border-radius: 22px;
          padding: 14px 16px;
          box-sizing: border-box;
          margin-bottom: 12px;
          text-align: left;
        }

        .map-card-header-link { text-decoration: none; }

        .map-card-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 11.5px;
          font-weight: 800;
          color: var(--brand-primary);
          margin-bottom: 8px;
        }

        .map-iframe-container {
          width: 100%;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid var(--glass-border);
          margin-bottom: 8px;
        }

        .map-directions-link {
          font-size: 11px;
          font-weight: 750;
          color: var(--brand-primary);
          text-decoration: none;
          display: block;
          text-align: center;
          margin-bottom: 8px;
        }

        .address-highlight-box {
          background: rgba(255,255,255,0.5);
          border-radius: 12px;
          padding: 10px 12px;
          border: 1px solid var(--glass-border);
          margin-bottom: 8px;
        }

        .agency-clean-address {
          font-size: 10.5px;
          color: var(--tx-main);
          margin: 0;
          line-height: 1.4;
          text-align: center;
        }

        /* =========================================
           MINI FOOTER
           ========================================= */

        .mini-footer {
          width: 100%;
          display: flex;
          justify-content: center;
          margin-top: 2px;
        }

        .mini-footer-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 4px;
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 8.5px;
          letter-spacing: 0.3px;
          color: var(--tx-sub);
          line-height: 1.4;
        }

        .mini-footer-pill strong { color: var(--tx-main); font-weight: 700; }
        .mini-footer-dot { color: var(--brand-gold); }
        .mini-footer-pill a { color: var(--brand-primary); font-weight: 700; text-decoration: none; }

        /* =========================================
           ACCESSIBILITY & MOBILE TOUCH
           ========================================= */

        button,
        a {
          -webkit-tap-highlight-color: transparent;
        }

        button:focus-visible,
        a:focus-visible {
          outline: 2px solid var(--brand-primary);
          outline-offset: 3px;
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            scroll-behavior: auto !important;
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </main>
  );
}
