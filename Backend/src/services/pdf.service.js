const PDFDocument = require("pdfkit");

/**
 * Modern Executive Design Palette
 */
const PALETTE = {
  // Brand & Slate Tones
  brandDark: "#0F172A",
  brandNavy: "#1E293B",
  brandPrimary: "#4F46E5",
  brandPrimaryDark: "#4338CA",
  brandLight: "#EEF2FF",
  brandBorder: "#C7D2FE",

  // Typography & Neutrals
  textHeading: "#0F172A",
  textBody: "#334155",
  textMuted: "#64748B",
  textLight: "#94A3B8",

  // Backgrounds & Panels
  bgWhite: "#FFFFFF",
  bgSubtle: "#F8FAFC",
  bgCard: "#F1F5F9",
  borderLight: "#E2E8F0",
  borderSubtle: "#CBD5E1",

  // Severity & Tone Colors
  high: "#DC2626",
  highBg: "#FEF2F2",
  highBorder: "#FECACA",
  highText: "#991B1B",

  medium: "#D97706",
  mediumBg: "#FFFBEB",
  mediumBorder: "#FDE68A",
  mediumText: "#92400E",

  low: "#16A34A",
  lowBg: "#F0FDF4",
  lowBorder: "#BBF7D0",
  lowText: "#166534",

  // Question Tags
  tagTechBg: "#EEF2FF",
  tagTechBorder: "#C7D2FE",
  tagTechText: "#4338CA",

  tagBehBg: "#F5F3FF",
  tagBehBorder: "#DDD6FE",
  tagBehText: "#6D28D9",
};

// Page geometry constants (A4 standard: 595.28 x 841.89 points)
const PAGE_CONFIG = {
  width: 595.28,
  height: 841.89,
  marginLeft: 42,
  marginRight: 42,
  marginTop: 40,
  marginBottom: 44,
};
const CONTENT_WIDTH =
  PAGE_CONFIG.width - PAGE_CONFIG.marginLeft - PAGE_CONFIG.marginRight; // 511.28
const USABLE_BOTTOM = PAGE_CONFIG.height - PAGE_CONFIG.marginBottom; // 797.89

/**
 * Clean up markdown artifacts from AI-generated or user-pasted text
 */
function stripMarkdown(text = "") {
  if (!text) return "";
  return String(text)
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`{1,3}([^`]*)`{1,3}/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "• ")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

/**
 * Extract clean role title from job description
 */
function parseJobTitle(jd = "") {
  if (!jd) return "Target Role Analysis";
  const lines = jd
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  for (const line of lines) {
    if (
      !line.toLowerCase().startsWith("company:") &&
      !line.toLowerCase().startsWith("location:")
    ) {
      const cleaned = stripMarkdown(line).trim();
      if (cleaned.length > 0) {
        return cleaned.length > 70 ? `${cleaned.slice(0, 70)}…` : cleaned;
      }
    }
  }
  return "Target Role Analysis";
}

/**
 * Extract company name if indicated in the job description
 */
function parseJobCompany(jd = "") {
  if (!jd) return "";
  const match = jd.match(/\*{0,2}company\*{0,2}\s*:\s*([^\n|]+)/i);
  if (!match) return "";
  return stripMarkdown(match[1]).trim();
}

/**
 * Get unified job metadata
 */
function parseJobMeta(jd = "") {
  return {
    title: parseJobTitle(jd),
    company: parseJobCompany(jd),
  };
}

/**
 * Assess match score tier and styling
 */
function getFitInfo(score = 0) {
  if (score >= 85) {
    return {
      label: "EXCEPTIONAL ALIGNMENT",
      summary: "High synergy across core technical stack and requirements.",
      color: PALETTE.low,
      bg: PALETTE.lowBg,
      border: PALETTE.lowBorder,
      text: PALETTE.lowText,
    };
  }
  if (score >= 70) {
    return {
      label: "COMPETITIVE FIT",
      summary: "Solid qualification match with targeted growth areas.",
      color: PALETTE.brandPrimary,
      bg: PALETTE.brandLight,
      border: PALETTE.brandBorder,
      text: PALETTE.brandPrimaryDark,
    };
  }
  return {
    label: "REMEDIATION RECOMMENDED",
    summary: "Key technical or domain gaps identified requiring preparation.",
    color: PALETTE.high,
    bg: PALETTE.highBg,
    border: PALETTE.highBorder,
    text: PALETTE.highText,
  };
}

/**
 * Format timestamp into display date
 */
function formatDate(val) {
  const d = val ? new Date(val) : new Date();
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Check if the upcoming block fits on the current page; otherwise trigger a new page
 */
function ensureSpace(doc, neededHeight) {
  if (doc.y + neededHeight > USABLE_BOTTOM) {
    doc.addPage();
    doc.y = 52; // standard top offset on subsequent pages
    return true;
  }
  return false;
}

/**
 * Draws a rounded rectangle pill badge with centered text
 */
function drawBadge(
  doc,
  {
    x,
    y,
    width,
    height,
    text,
    bg,
    border,
    textColor,
    fontSize = 7.5,
    font = "Helvetica-Bold",
  },
) {
  doc.save();
  doc
    .roundedRect(x, y, width, height, height / 2)
    .fillColor(bg)
    .fill();
  if (border) {
    doc
      .roundedRect(x, y, width, height, height / 2)
      .strokeColor(border)
      .lineWidth(0.8)
      .stroke();
  }
  doc.font(font).fontSize(fontSize).fillColor(textColor);
  const textH = doc.heightOfString(text, { width });
  const textY = y + (height - textH) / 2 + 0.5;
  doc.text(text, x, textY, { width, align: "center" });
  doc.restore();
}

/**
 * Draws the executive header hero banner on Page 1
 */
function drawHeroBanner(doc, report, jobMeta) {
  const startY = PAGE_CONFIG.marginTop;
  const cardX = PAGE_CONFIG.marginLeft;
  const cardW = CONTENT_WIDTH;

  doc.font("Helvetica-Bold").fontSize(17);
  const titleText = jobMeta.title;
  const titleHeight = doc.heightOfString(titleText, {
    width: cardW - 36,
    lineGap: 2,
  });
  const bannerHeight = Math.max(
    94,
    54 + titleHeight + (jobMeta.company ? 20 : 8),
  );

  doc.save();
  // Main Banner Background
  doc
    .roundedRect(cardX, startY, cardW, bannerHeight, 8)
    .fillColor(PALETTE.brandDark)
    .fill();

  // Top Indigo Accent Stripe
  doc
    .roundedRect(cardX, startY, cardW, 4, 2)
    .fillColor(PALETTE.brandPrimary)
    .fill();

  // Eyebrow row inside banner
  let currentY = startY + 14;
  doc.font("Helvetica-Bold").fontSize(8).fillColor("#818CF8");
  doc.text("INTERVIEW READINESS DOSSIER", cardX + 18, currentY, {
    characterSpacing: 0.8,
  });

  // Right side dossier tag
  const dossierTag = `DOSSIER #${(report._id ? String(report._id).slice(-6) : "EXP").toUpperCase()}`;
  doc.font("Helvetica-Bold").fontSize(8).fillColor("#94A3B8");
  doc.text(dossierTag, cardX, currentY, { width: cardW - 18, align: "right" });

  // Main Job Title
  currentY += 14;
  doc.font("Helvetica-Bold").fontSize(16.5).fillColor("#FFFFFF");
  doc.text(titleText, cardX + 18, currentY, {
    width: cardW - 36,
    lineGap: 2,
  });
  currentY += titleHeight + 4;

  // Company tag / Date row
  if (jobMeta.company) {
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#CBD5E1");
    doc.text(`Target: ${jobMeta.company}`, cardX + 18, currentY, {
      continued: true,
    });
    doc.font("Helvetica").fontSize(9).fillColor("#94A3B8");
    doc.text(`  •  Evaluated: ${formatDate(report.createdAt)}`);
  } else {
    doc.font("Helvetica").fontSize(9).fillColor("#94A3B8");
    doc.text(`Evaluated: ${formatDate(report.createdAt)}`, cardX + 18, currentY);
  }

  doc.restore();
  doc.y = startY + bannerHeight + 14;
}

/**
 * Draws the Executive Assessment HUD / Match Score Grid
 */
function drawExecutiveSummary(doc, report, fit) {
  const cardX = PAGE_CONFIG.marginLeft;
  const cardW = CONTENT_WIDTH;
  const scoreCardW = 148;
  const gap = 12;
  const metricsCardW = cardW - scoreCardW - gap;
  const cardH = 92;

  const startY = doc.y;

  // Left Card: Match Score Dial / Box
  doc.save();
  doc
    .roundedRect(cardX, startY, scoreCardW, cardH, 6)
    .fillColor(PALETTE.bgSubtle)
    .fill();
  doc
    .roundedRect(cardX, startY, scoreCardW, cardH, 6)
    .strokeColor(PALETTE.borderLight)
    .lineWidth(1)
    .stroke();

  // Score Box Header
  doc.font("Helvetica-Bold").fontSize(7.5).fillColor(PALETTE.textMuted);
  doc.text("COMPATIBILITY RATING", cardX + 12, startY + 10, {
    characterSpacing: 0.5,
  });

  // Score Numbers
  const scoreVal = typeof report.matchScore === "number" ? report.matchScore : 0;
  const scoreStr = `${scoreVal}%`;
  doc.font("Helvetica-Bold").fontSize(28).fillColor(fit.color);
  doc.text(scoreStr, cardX + 12, startY + 24, { continued: false });

  // Fit Pill Badge
  drawBadge(doc, {
    x: cardX + 12,
    y: startY + 62,
    width: scoreCardW - 24,
    height: 18,
    text: fit.label,
    bg: fit.bg,
    border: fit.border,
    textColor: fit.text,
    fontSize: 7.2,
    font: "Helvetica-Bold",
  });
  doc.restore();

  // Right Card: Readiness Metrics Grid
  doc.save();
  const rx = cardX + scoreCardW + gap;
  doc
    .roundedRect(rx, startY, metricsCardW, cardH, 6)
    .fillColor(PALETTE.bgSubtle)
    .fill();
  doc
    .roundedRect(rx, startY, metricsCardW, cardH, 6)
    .strokeColor(PALETTE.borderLight)
    .lineWidth(1)
    .stroke();

  // Header Title
  doc.font("Helvetica-Bold").fontSize(7.5).fillColor(PALETTE.textMuted);
  doc.text("EXECUTIVE READINESS METRICS", rx + 14, startY + 10, {
    characterSpacing: 0.5,
  });

  // 4 KPI Cells (2x2 Grid)
  const cellW = (metricsCardW - 28) / 2;
  const cellH = 30;

  const kpis = [
    {
      label: "Skill Gaps Identified",
      val: `${report.skillGaps?.length || 0} Areas`,
      color: report.skillGaps?.length ? PALETTE.highText : PALETTE.lowText,
    },
    {
      label: "Technical Probes",
      val: `${report.technicalQuestions?.length || 0} Scenarios`,
      color: PALETTE.brandPrimary,
    },
    {
      label: "Behavioral Probes",
      val: `${report.behavioralQuestions?.length || 0} STAR Vectors`,
      color: "#6D28D9",
    },
    {
      label: "Preparation Protocol",
      val: `${report.preparationPlan?.length || 7}-Day Sprint`,
      color: PALETTE.textHeading,
    },
  ];

  kpis.forEach((kpi, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const cx = rx + 14 + col * cellW;
    const cy = startY + 28 + row * cellH;

    doc.font("Helvetica").fontSize(7.5).fillColor(PALETTE.textMuted);
    doc.text(kpi.label, cx, cy);
    doc.font("Helvetica-Bold").fontSize(10).fillColor(kpi.color);
    doc.text(kpi.val, cx, cy + 11);
  });

  doc.restore();
  doc.y = startY + cardH + 14;
}

/**
 * Draws Candidate Strategic Context & Notes if available
 */
function drawStrategicContext(doc, report) {
  const cardX = PAGE_CONFIG.marginLeft;
  const cardW = CONTENT_WIDTH;

  if (report.selfDescription) {
    const cleanSelf = stripMarkdown(report.selfDescription);
    doc.font("Helvetica").fontSize(9);
    const selfTextH = doc.heightOfString(cleanSelf, {
      width: cardW - 28,
      lineGap: 2,
    });
    const boxH = Math.max(46, selfTextH + 28);

    ensureSpace(doc, boxH + 10);
    const startY = doc.y;

    doc.save();
    doc
      .roundedRect(cardX, startY, cardW, boxH, 6)
      .fillColor("#F8FAFC")
      .fill();
    doc
      .roundedRect(cardX, startY, cardW, boxH, 6)
      .strokeColor(PALETTE.borderLight)
      .lineWidth(1)
      .stroke();
    // Left Accent Bar
    doc
      .roundedRect(cardX, startY, 4, boxH, 2)
      .fillColor(PALETTE.brandPrimary)
      .fill();

    doc.font("Helvetica-Bold").fontSize(8).fillColor(PALETTE.brandPrimary);
    doc.text("CANDIDATE STRATEGIC CONTEXT & FOCUS", cardX + 14, startY + 8);

    doc.font("Helvetica").fontSize(9).fillColor(PALETTE.textBody);
    doc.text(cleanSelf, cardX + 14, startY + 22, {
      width: cardW - 28,
      lineGap: 2,
    });
    doc.restore();

    doc.y = startY + boxH + 14;
  }
}

/**
 * Draws a stylized section header
 */
function drawSectionHeader(doc, { number, title, subtitle, countBadge }) {
  ensureSpace(doc, 52);
  const startY = doc.y;
  const x = PAGE_CONFIG.marginLeft;
  const w = CONTENT_WIDTH;

  doc.save();
  // Number Badge
  if (number) {
    doc.roundedRect(x, startY, 20, 15, 3).fillColor(PALETTE.brandDark).fill();
    doc.font("Helvetica-Bold").fontSize(8).fillColor("#FFFFFF");
    doc.text(number, x, startY + 3.5, { width: 20, align: "center" });
  }

  // Section Title
  const titleX = number ? x + 26 : x;
  doc.font("Helvetica-Bold").fontSize(11).fillColor(PALETTE.textHeading);
  doc.text(title.toUpperCase(), titleX, startY + 2, { characterSpacing: 0.6 });

  // Count Badge if present
  if (countBadge) {
    const titleWidth = doc.widthOfString(title.toUpperCase(), {
      characterSpacing: 0.6,
    });
    drawBadge(doc, {
      x: titleX + titleWidth + 8,
      y: startY + 1,
      width: 58,
      height: 16,
      text: countBadge,
      bg: PALETTE.brandLight,
      border: PALETTE.brandBorder,
      textColor: PALETTE.brandPrimaryDark,
      fontSize: 7.2,
    });
  }

  // Subtitle
  if (subtitle) {
    doc.font("Helvetica").fontSize(8.5).fillColor(PALETTE.textMuted);
    doc.text(subtitle, x, startY + 18, { width: w });
  }

  // Subtle divider rule
  const lineY = startY + (subtitle ? 32 : 22);
  doc
    .moveTo(x, lineY)
    .lineTo(x + w, lineY)
    .strokeColor(PALETTE.borderLight)
    .lineWidth(1)
    .stroke();
  doc.restore();

  doc.y = lineY + 10;
}

/**
 * Draws the Skill Gap Matrix
 */
function drawSkillGaps(doc, skillGaps = []) {
  drawSectionHeader(doc, {
    number: "01",
    title: "Skill Gap Matrix",
    subtitle:
      "Identified qualification deltas between candidate profile and role prerequisites.",
    countBadge: `${skillGaps.length} Gaps`,
  });

  const cardX = PAGE_CONFIG.marginLeft;
  const cardW = CONTENT_WIDTH;

  if (!skillGaps.length) {
    ensureSpace(doc, 36);
    doc.save();
    doc
      .roundedRect(cardX, doc.y, cardW, 36, 6)
      .fillColor(PALETTE.lowBg)
      .fill();
    doc
      .roundedRect(cardX, doc.y, cardW, 36, 6)
      .strokeColor(PALETTE.lowBorder)
      .lineWidth(1)
      .stroke();
    doc.font("Helvetica-Bold").fontSize(9).fillColor(PALETTE.lowText);
    doc.text(
      "✓  No critical skill gaps surfaced — candidate qualifications strongly align with job requirements.",
      cardX + 14,
      doc.y + 12,
    );
    doc.restore();
    doc.y += 44;
    return;
  }

  const SEV_CONFIG = {
    high: {
      label: "HIGH PRIORITY",
      bg: PALETTE.highBg,
      border: PALETTE.highBorder,
      text: PALETTE.highText,
    },
    medium: {
      label: "MEDIUM PRIORITY",
      bg: PALETTE.mediumBg,
      border: PALETTE.mediumBorder,
      text: PALETTE.mediumText,
    },
    low: {
      label: "LOW PRIORITY",
      bg: PALETTE.lowBg,
      border: PALETTE.lowBorder,
      text: PALETTE.lowText,
    },
  };

  const sorted = [...skillGaps].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
  });

  sorted.forEach((gap, i) => {
    const sev = SEV_CONFIG[gap.severity] || SEV_CONFIG.medium;
    const rowH = 34;

    ensureSpace(doc, rowH + 6);
    const startY = doc.y;

    doc.save();
    // Card Box
    doc
      .roundedRect(cardX, startY, cardW, rowH, 5)
      .fillColor(PALETTE.bgSubtle)
      .fill();
    doc
      .roundedRect(cardX, startY, cardW, rowH, 5)
      .strokeColor(PALETTE.borderLight)
      .lineWidth(0.8)
      .stroke();

    // Skill Name
    doc.font("Helvetica-Bold").fontSize(9.5).fillColor(PALETTE.textHeading);
    doc.text(`${i + 1}.  ${gap.skill}`, cardX + 12, startY + 10, {
      width: cardW - 140,
    });

    // Severity Pill on Right
    drawBadge(doc, {
      x: cardX + cardW - 105,
      y: startY + 8,
      width: 95,
      height: 18,
      text: sev.label,
      bg: sev.bg,
      border: sev.border,
      textColor: sev.text,
      fontSize: 7.2,
    });

    doc.restore();
    doc.y = startY + rowH + 6;
  });

  doc.y += 8;
}

/**
 * Draws a structured Question Card (Technical or Behavioral)
 */
function drawQuestionCard(doc, item, index, type = "technical") {
  const cardX = PAGE_CONFIG.marginLeft;
  const cardW = CONTENT_WIDTH;
  const padX = 14;
  const innerW = cardW - padX * 2;

  const isTech = type === "technical";
  const accentColor = isTech ? PALETTE.brandPrimary : "#7C3AED";
  const badgeLabel = isTech
    ? `TECH PROBE Q${String(index + 1).padStart(2, "0")}`
    : `STAR BEHAVIORAL Q${String(index + 1).padStart(2, "0")}`;
  const badgeBg = isTech ? PALETTE.tagTechBg : PALETTE.tagBehBg;
  const badgeBorder = isTech ? PALETTE.tagTechBorder : PALETTE.tagBehBorder;
  const badgeText = isTech ? PALETTE.tagTechText : PALETTE.tagBehText;

  // Clean text and pre-calculate heights
  const cleanQ = stripMarkdown(item.question || "");
  const cleanIntention = stripMarkdown(item.intention || "");
  const cleanAnswer = stripMarkdown(item.answer || "");

  doc.font("Helvetica-Bold").fontSize(10);
  const qH = doc.heightOfString(cleanQ, { width: innerW, lineGap: 2 });

  doc.font("Helvetica").fontSize(8.8);
  const intentionH = cleanIntention
    ? doc.heightOfString(cleanIntention, {
        width: innerW - 18,
        lineGap: 1.5,
      })
    : 0;
  const intentionBoxH = cleanIntention ? intentionH + 24 : 0;

  doc.font("Helvetica").fontSize(8.8);
  const answerH = cleanAnswer
    ? doc.heightOfString(cleanAnswer, { width: innerW - 18, lineGap: 2 })
    : 0;
  const answerBoxH = cleanAnswer ? answerH + 24 : 0;

  const totalCardH =
    14 +
    18 +
    6 +
    qH +
    (intentionBoxH ? intentionBoxH + 8 : 0) +
    (answerBoxH ? answerBoxH + 8 : 0) +
    12;

  // Space check: If entire card doesn't fit on this page, move to next page
  ensureSpace(doc, Math.min(totalCardH, 200));

  const startY = doc.y;

  doc.save();
  // Card Container Box
  doc
    .roundedRect(cardX, startY, cardW, totalCardH, 6)
    .fillColor(PALETTE.bgWhite)
    .fill();
  doc
    .roundedRect(cardX, startY, cardW, totalCardH, 6)
    .strokeColor(PALETTE.borderLight)
    .lineWidth(1)
    .stroke();

  // Left Accent Bar
  doc
    .roundedRect(cardX, startY, 4, totalCardH, 2)
    .fillColor(accentColor)
    .fill();

  let innerY = startY + 12;

  // Top Category Badge
  drawBadge(doc, {
    x: cardX + padX,
    y: innerY,
    width: 120,
    height: 16,
    text: badgeLabel,
    bg: badgeBg,
    border: badgeBorder,
    textColor: badgeText,
    fontSize: 7.2,
  });
  innerY += 22;

  // Question Text
  doc.font("Helvetica-Bold").fontSize(10).fillColor(PALETTE.textHeading);
  doc.text(cleanQ, cardX + padX, innerY, { width: innerW, lineGap: 2 });
  innerY += qH + 8;

  // Intention Box
  if (cleanIntention) {
    const boxX = cardX + padX;
    doc
      .roundedRect(boxX, innerY, innerW, intentionBoxH, 4)
      .fillColor(PALETTE.bgSubtle)
      .fill();
    doc
      .roundedRect(boxX, innerY, innerW, intentionBoxH, 4)
      .strokeColor(PALETTE.borderLight)
      .lineWidth(0.8)
      .stroke();

    doc.font("Helvetica-Bold").fontSize(7.5).fillColor(accentColor);
    doc.text(
      "INTERVIEWER ANGLE & EVALUATION OBJECTIVE",
      boxX + 9,
      innerY + 6,
      { characterSpacing: 0.4 },
    );

    doc.font("Helvetica-Oblique").fontSize(8.8).fillColor(PALETTE.textBody);
    doc.text(cleanIntention, boxX + 9, innerY + 17, {
      width: innerW - 18,
      lineGap: 1.5,
    });
    innerY += intentionBoxH + 8;
  }

  // Answer / Talking Points Box
  if (cleanAnswer) {
    const boxX = cardX + padX;
    doc
      .roundedRect(boxX, innerY, innerW, answerBoxH, 4)
      .fillColor("#F8FAFC")
      .fill();
    doc
      .roundedRect(boxX, innerY, innerW, answerBoxH, 4)
      .strokeColor(PALETTE.borderLight)
      .lineWidth(0.8)
      .stroke();

    doc.font("Helvetica-Bold").fontSize(7.5).fillColor(PALETTE.textHeading);
    doc.text(
      "RECOMMENDED RESPONSE FRAMEWORK & TALKING POINTS",
      boxX + 9,
      innerY + 6,
      { characterSpacing: 0.4 },
    );

    doc.font("Helvetica").fontSize(8.8).fillColor(PALETTE.textBody);
    doc.text(cleanAnswer, boxX + 9, innerY + 17, {
      width: innerW - 18,
      lineGap: 2,
    });
    innerY += answerBoxH + 8;
  }

  doc.restore();
  doc.y = startY + totalCardH + 12;
}

/**
 * Draws the 7-Day Tactical Preparation Protocol
 */
function drawPreparationPlan(doc, plan = []) {
  drawSectionHeader(doc, {
    number: "04",
    title: "7-Day Tactical Preparation Protocol",
    subtitle:
      "Structured milestone roadmap designed for rapid concept retention and interview readiness.",
    countBadge: "7-Day Sprint",
  });

  if (!plan.length) {
    return;
  }

  const cardX = PAGE_CONFIG.marginLeft;
  const cardW = CONTENT_WIDTH;

  const sorted = [...plan].sort((a, b) => a.day - b.day);

  sorted.forEach((item) => {
    const cleanFocus = stripMarkdown(item.focus || "");
    const cleanTasks = stripMarkdown(item.tasks || "");

    doc.font("Helvetica-Bold").fontSize(9.5);
    const focusH = doc.heightOfString(cleanFocus, {
      width: cardW - 84,
      lineGap: 1,
    });

    doc.font("Helvetica").fontSize(8.8);
    const tasksH = doc.heightOfString(cleanTasks, {
      width: cardW - 84,
      lineGap: 1.5,
    });

    const rowH = Math.max(44, 16 + focusH + tasksH + 12);

    ensureSpace(doc, rowH + 8);
    const startY = doc.y;

    doc.save();
    // Card Box
    doc
      .roundedRect(cardX, startY, cardW, rowH, 5)
      .fillColor(PALETTE.bgSubtle)
      .fill();
    doc
      .roundedRect(cardX, startY, cardW, rowH, 5)
      .strokeColor(PALETTE.borderLight)
      .lineWidth(0.8)
      .stroke();

    // Day Pill Badge on Left
    drawBadge(doc, {
      x: cardX + 10,
      y: startY + 10,
      width: 52,
      height: 20,
      text: `DAY ${String(item.day).padStart(2, "0")}`,
      bg: PALETTE.brandDark,
      border: null,
      textColor: "#FFFFFF",
      fontSize: 8,
      font: "Helvetica-Bold",
    });

    // Day Focus Title
    const textX = cardX + 72;
    doc.font("Helvetica-Bold").fontSize(9.5).fillColor(PALETTE.textHeading);
    doc.text(cleanFocus, textX, startY + 9, {
      width: cardW - 84,
      lineGap: 1,
    });

    // Day Tasks Text
    doc.font("Helvetica").fontSize(8.8).fillColor(PALETTE.textBody);
    doc.text(cleanTasks, textX, startY + 9 + focusH + 4, {
      width: cardW - 84,
      lineGap: 1.5,
    });

    doc.restore();
    doc.y = startY + rowH + 8;
  });

  doc.y += 10;
}

/**
 * Streams a PDF export of an interview report directly to the given
 * writable stream (typically the HTTP response).
 */
function renderInterviewReportPdf(report, stream) {
  const doc = new PDFDocument({
    size: "A4",
    margin: 0, // Controlled margins manually for pixel-perfect coordinates
    bufferPages: true,
  });

  doc.pipe(stream);

  const jobMeta = parseJobMeta(report.jobDescription);
  const fit = getFitInfo(report.matchScore || 0);

  // 1. Hero Header Banner (Page 1)
  drawHeroBanner(doc, report, jobMeta);

  // 2. Executive Assessment HUD / Match Score Grid
  drawExecutiveSummary(doc, report, fit);

  // 3. Candidate Strategic Context (if available)
  drawStrategicContext(doc, report);

  // 4. Skill Gap Matrix
  if (report.skillGaps?.length) {
    drawSkillGaps(doc, report.skillGaps);
  }

  // 5. Technical Questions Section
  if (report.technicalQuestions?.length) {
    drawSectionHeader(doc, {
      number: "02",
      title: "Predicted Technical Probes",
      subtitle:
        "High-probability architecture, systems, and code analysis questions tailored to this role.",
      countBadge: `${report.technicalQuestions.length} Probes`,
    });
    report.technicalQuestions.forEach((q, i) =>
      drawQuestionCard(doc, q, i, "technical"),
    );
  }

  // 6. Behavioral Questions Section
  if (report.behavioralQuestions?.length) {
    drawSectionHeader(doc, {
      number: "03",
      title: "Behavioral & Leadership Scenarios",
      subtitle:
        "Targeted situational questions assessing conflict resolution, leadership, and execution.",
      countBadge: `${report.behavioralQuestions.length} Probes`,
    });
    report.behavioralQuestions.forEach((q, i) =>
      drawQuestionCard(doc, q, i, "behavioral"),
    );
  }

  // 7. Tactical 7-Day Preparation Plan
  if (report.preparationPlan?.length) {
    drawPreparationPlan(doc, report.preparationPlan);
  }

  // 8. Multi-Page Running Headers & Footers (Post-Pass)
  const range = doc.bufferedPageRange();
  const totalPages = range.count;

  for (let i = range.start; i < range.start + totalPages; i++) {
    doc.switchToPage(i);
    const x = PAGE_CONFIG.marginLeft;
    const w = CONTENT_WIDTH;

    // Running Header (Page 2+)
    if (i > 0) {
      doc.save();
      doc.font("Helvetica-Bold").fontSize(7.5).fillColor(PALETTE.textMuted);
      doc.text("RESUME ANALYZER STUDIO", x, 22, {
        continued: true,
        characterSpacing: 0.5,
      });
      doc.font("Helvetica").fontSize(7.5).fillColor(PALETTE.textLight);
      doc.text("  •  INTERVIEW READINESS DOSSIER");

      doc.font("Helvetica").fontSize(7.5).fillColor(PALETTE.textMuted);
      doc.text(jobMeta.title, x, 22, { width: w, align: "right" });

      // Thin header rule
      doc
        .moveTo(x, 34)
        .lineTo(x + w, 34)
        .strokeColor(PALETTE.borderLight)
        .lineWidth(0.8)
        .stroke();
      doc.restore();
    }

    // Running Footer (ALL pages)
    doc.save();
    const footerY = PAGE_CONFIG.height - 32;
    doc
      .moveTo(x, footerY - 8)
      .lineTo(x + w, footerY - 8)
      .strokeColor(PALETTE.borderLight)
      .lineWidth(0.8)
      .stroke();

    doc.font("Helvetica-Bold").fontSize(7.5).fillColor(PALETTE.textMuted);
    doc.text("CONFIDENTIAL", x, footerY, { continued: true });
    doc.font("Helvetica").fontSize(7.5).fillColor(PALETTE.textLight);
    doc.text(`  •  Evaluated on ${formatDate(report.createdAt)}`);

    const pageStr = `Page ${i + 1} of ${totalPages}`;
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor(PALETTE.textMuted);
    doc.text(pageStr, x, footerY, { width: w, align: "right" });
    doc.restore();
  }

  doc.end();
}

module.exports = { renderInterviewReportPdf };

