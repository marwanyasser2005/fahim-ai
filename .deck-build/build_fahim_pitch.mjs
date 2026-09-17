import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import QRCode from "../node_modules/qrcode/lib/index.js";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

process.env.RUNTIME_NODE_MODULES ??= "C:/Users/Marwan Yasser/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";
process.env.RUNTIME_NODE ??= process.execPath;
process.env.RUNTIME_PYTHON ??= "C:/Users/Marwan Yasser/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe";

const workspaceDir = "D:/FahimAI";
const SKILL_DIR = "C:/Users/Marwan Yasser/.codex/plugins/cache/openai-primary-runtime/presentations/26.909.11809/skills/presentations";
const TMP_DIR = path.join(workspaceDir, ".deck-build", "fahim-pitch");
const outputDir = path.join(workspaceDir, "deliverables", "fahim-hackathon-2026");
const FINAL_PPTX = path.join(outputDir, "Fahim_AI_Hackathon_2026_Identity_v3.pptx");
const candidatePath = path.join(TMP_DIR, "candidate.pptx");
const assets = path.join(outputDir, "assets");

await fs.mkdir(TMP_DIR, { recursive: true });
await fs.mkdir(outputDir, { recursive: true });

const C = {
  navy: "#0B1733",
  navy2: "#132B4A",
  teal: "#008C83",
  tealLight: "#D9F0EC",
  saffron: "#F6B93B",
  vermilion: "#E6521F",
  ivory: "#F7F1E7",
  paper: "#FFFDF8",
  ink: "#15223B",
  muted: "#667085",
  line: "#D7DEE8",
  white: "#FFFFFF",
  green: "#1F9D6A",
};

const F = {
  display: "Segoe UI",
  body: "Segoe UI",
  arabic: "Noto Kufi Arabic",
  fallback: "Segoe UI",
};

const presentation = Presentation.create({ slideSize: { width: 1280, height: 720 } });

function rect(slide, x, y, w, h, fill, radius = 0, line = "none", shadow = "shadow-none") {
  return slide.shapes.add({
    geometry: radius ? "roundRect" : "rect",
    position: { left: x, top: y, width: w, height: h },
    fill,
    line: line === "none" ? { fill: "none", width: 0 } : { style: "solid", fill: line, width: 1 },
    ...(radius ? { borderRadius: radius } : {}),
    shadow,
  });
}

function line(slide, x, y, w, h, color, width = 2) {
  return slide.shapes.add({
    geometry: "line",
    position: { left: x, top: y, width: w, height: h },
    fill: "none",
    line: { style: "solid", fill: color, width },
  });
}

function textBox(slide, text, x, y, w, h, options = {}) {
  const shape = slide.shapes.add({
    geometry: "textbox",
    position: { left: x, top: y, width: w, height: h },
    fill: options.fill ?? "none",
    line: { fill: "none", width: 0 },
  });
  shape.text = text;
  shape.text.style = {
    typeface: options.font ?? F.body,
    fontSize: options.size ?? 24,
    bold: options.bold ?? false,
    color: options.color ?? C.ink,
    alignment: options.align ?? "left",
    verticalAlignment: options.valign ?? "top",
    autoFit: options.autoFit ?? "shrinkText",
    wrap: "square",
    insets: options.insets ?? { top: 0, right: 0, bottom: 0, left: 0 },
    ...(options.lineSpacing ? { lineSpacing: options.lineSpacing } : {}),
  };
  return shape;
}

function addImage(slide, file, x, y, w, h, options = {}) {
  return slide.images.add({
    blob: new Uint8Array(options.bytes ?? []),
    contentType: options.contentType ?? "image/png",
    alt: options.alt ?? "",
    fit: options.fit ?? "cover",
    position: { left: x, top: y, width: w, height: h },
    ...(options.geometry ? { geometry: options.geometry } : {}),
    ...(options.radius ? { borderRadius: options.radius } : {}),
  });
}

async function imageBytes(file) {
  return new Uint8Array(await fs.readFile(file));
}

async function image(slide, file, x, y, w, h, options = {}) {
  const ext = path.extname(file).toLowerCase();
  const contentType = ext === ".svg" ? "image/svg+xml" : ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/png";
  return slide.images.add({
    blob: await imageBytes(file),
    contentType,
    alt: options.alt ?? path.basename(file),
    fit: options.fit ?? "cover",
    position: { left: x, top: y, width: w, height: h },
    ...(options.geometry ? { geometry: options.geometry } : {}),
    ...(options.radius ? { borderRadius: options.radius } : {}),
    ...(options.crop ? { crop: options.crop } : {}),
  });
}

function page(slide, n, section = "CORE PITCH") {
  rect(slide, 0, 0, 1280, 5, C.saffron);
  rect(slide, 0, 5, 330, 3, C.teal);
  slide.images.add({ blob: miniLogoBytes, contentType: "image/svg+xml", alt: "Fahim mark", fit: "contain", position: { left: 1144, top: 18, width: 30, height: 30 } });
  textBox(slide, section, 64, 27, 310, 20, { size: 11, bold: true, color: C.teal, font: F.fallback });
  textBox(slide, String(n).padStart(2, "0"), 1186, 27, 30, 20, { size: 11, bold: true, color: C.muted, align: "right", font: F.fallback });
}

function title(slide, value, subtitle, dark = false) {
  textBox(slide, value, 64, 66, 1080, 64, { size: 40, bold: true, color: dark ? C.ivory : C.navy, font: F.display, autoFit: "shrinkText" });
  if (subtitle) textBox(slide, subtitle, 64, 138, 1080, 42, { size: 17, color: dark ? "#D5DDEC" : C.muted, font: F.body });
}

function notes(slide, lines) {
  slide.speakerNotes.textFrame.setText(lines.join("\n"));
}

const cover = path.join(assets, "cover-learning-evidence.png");
const learner = path.join(assets, "learner-problem.png");
const teacher = path.join(assets, "teacher-adoption.png");
const closing = path.join(assets, "closing-path.png");
const showcase = path.join(workspaceDir, ".deck-build", "product", "showcase.png");
const how = path.join(workspaceDir, ".deck-build", "product", "how-it-works.png");
const founder = path.join(workspaceDir, "public", "images", "founder", "marwan-abdelghaffar.png");
const logo = path.join(workspaceDir, "public", "brand", "fahim-logo-dark.svg");
const miniLogo = path.join(workspaceDir, "public", "brand", "fahim-app-icon.svg");
const miniLogoBytes = await imageBytes(miniLogo);
const demoUrl = "https://fahim-ai-egypt.vercel.app/showcase";
const qr = await QRCode.toBuffer(demoUrl, { type: "png", width: 420, margin: 1, color: { dark: C.navy, light: C.paper } });

// 1. Cover
{
  const s = presentation.slides.add();
  s.background.fill = C.navy;
  await image(s, cover, 0, 0, 1280, 720, { fit: "cover", alt: "Knowledge becoming visible evidence" });
  rect(s, 0, 0, 700, 720, { type: "gradient", gradientKind: "linear", angleDeg: 0, stops: [
    { offset: 0, color: "#0B1733" }, { offset: 85000, color: "#0B1733D9" }, { offset: 100000, color: "#0B173300" },
  ]});
  await image(s, logo, 64, 48, 188, 64, { fit: "contain", alt: "Fahim logo" });
  textBox(s, "Evidence that\nlearning happened", 64, 180, 630, 190, { size: 52, bold: true, color: C.ivory, font: F.display, lineSpacing: 0.94 });
  textBox(s, "افهمها. اثبتها. افتكرها.", 66, 382, 510, 54, { size: 28, bold: true, color: C.saffron, font: F.arabic, align: "left" });
  textBox(s, "Fahim finds the misconception behind an answer, chooses the next learning action, and checks retention.", 66, 452, 570, 72, { size: 20, color: "#D5DDEC", font: F.body });
  line(s, 66, 540, 170, 0, C.teal, 5);
  textBox(s, "STUDENT TRACK   ASSESSMENT REVOLUTION", 66, 560, 500, 26, { size: 13, bold: true, color: C.tealLight, font: F.fallback });
  textBox(s, "GenAI for Education Hackathon 2026", 66, 604, 500, 24, { size: 15, color: C.ivory, font: F.fallback });
  textBox(s, "Team Fahim AI", 66, 636, 220, 24, { size: 15, bold: true, color: C.ivory, font: F.fallback });
  notes(s, ["Opening: Fahim turns each learning interaction into evidence that a learner understood, corrected a misconception, and retained the concept.", `Live prototype: ${demoUrl}`]);
}

// 2. Problem
{
  const s = presentation.slides.add();
  s.background.fill = C.paper;
  page(s, 2, "01 / PROBLEM");
  title(s, "Correct answers can conceal persistent misconceptions", "Arabic-speaking STEM learners can reach explanations quickly. Most tools stop before diagnosing the failed reasoning or checking whether the learning lasts.");
  await image(s, learner, 64, 210, 500, 390, { geometry: "roundRect", radius: 28, fit: "cover", alt: "Egyptian student studying bilingual STEM material" });
  rect(s, 92, 516, 430, 62, C.navy, 18);
  textBox(s, "“I found the answer. I still cannot explain it.”", 110, 532, 392, 34, { size: 18, bold: true, color: C.ivory, font: F.body });
  textBox(s, "THE FAILURE MODE", 624, 214, 250, 24, { size: 12, bold: true, color: C.vermilion, font: F.fallback });
  textBox(s, "One-off correctness", 624, 252, 520, 42, { size: 27, bold: true, color: C.navy, font: F.display });
  textBox(s, "The learner repeats the right answer, but the underlying reasoning remains wrong. The same gap returns in the next unit.", 624, 300, 520, 76, { size: 20, color: C.muted, font: F.body });
  line(s, 624, 400, 520, 0, C.line, 1);
  textBox(s, "25M+", 624, 434, 180, 62, { size: 44, bold: true, color: C.teal, font: F.fallback });
  textBox(s, "pre-university learners in Egypt", 624, 496, 200, 52, { size: 16, color: C.ink, font: F.body });
  textBox(s, "785,099", 892, 434, 240, 62, { size: 44, bold: true, color: C.saffron, font: F.fallback });
  textBox(s, "general secondary exam applicants, 2024/2025", 892, 496, 250, 54, { size: 16, color: C.ink, font: F.body });
  textBox(s, "Sources: Egypt Ministry of Education strategy and 22 July 2025 results release", 624, 586, 530, 32, { size: 12, color: C.muted, font: F.fallback });
  notes(s, ["Problem statement: content access has improved faster than evidence of understanding.", "Sources: https://moe.gov.eg/media/ekfp2puv/strategic_plan_en.pdf ; https://moe.gov.eg/ar/what-s-on/news/22-7-2025/"]);
}

// 3. User and evidence
{
  const s = presentation.slides.add();
  s.background.fill = C.ivory;
  page(s, 3, "02 / USER + EVIDENCE");
  title(s, "The first user: Mariam under exam pressure", "She studies STEM in Arabic and English and needs to recover a specific concept gap before it appears again.");
  rect(s, 64, 210, 470, 398, C.navy, 30);
  textBox(s, "MARIAM", 96, 246, 250, 28, { size: 14, bold: true, color: C.saffron, font: F.fallback });
  textBox(s, "High-stakes learner\nArabic explanation\nEnglish terminology", 96, 294, 370, 140, { size: 28, bold: true, color: C.ivory, font: F.display, lineSpacing: 1.08 });
  textBox(s, "Her job: understand the concept well enough to explain it, apply it, and recall it later.", 96, 470, 368, 96, { size: 20, color: "#D5DDEC", font: F.body });
  textBox(s, "WHAT WE KNOW TODAY", 604, 218, 300, 24, { size: 12, bold: true, color: C.teal, font: F.fallback });
  line(s, 604, 262, 540, 0, C.line, 1);
  textBox(s, "Desk research", 604, 286, 210, 34, { size: 20, bold: true, color: C.navy, font: F.display });
  textBox(s, "National scale and documented capacity and infrastructure constraints.", 830, 286, 314, 54, { size: 17, color: C.muted, font: F.body });
  line(s, 604, 358, 540, 0, C.line, 1);
  textBox(s, "Working MVP", 604, 382, 210, 34, { size: 20, bold: true, color: C.navy, font: F.display });
  textBox(s, "Authentication, retrieval, citations, AI generation, signed grading, and spaced review run end to end.", 830, 376, 314, 76, { size: 17, color: C.muted, font: F.body });
  line(s, 604, 470, 540, 0, C.line, 1);
  textBox(s, "Evidence boundary", 604, 494, 210, 34, { size: 20, bold: true, color: C.vermilion, font: F.display });
  textBox(s, "We do not claim pilot learning outcomes yet. The next step is a consented classroom pilot.", 830, 488, 314, 78, { size: 17, color: C.muted, font: F.body });
  rect(s, 604, 590, 540, 46, C.tealLight, 14);
  textBox(s, "Proven today: the workflow runs end to end. Next proof: measured learning improvement.", 624, 602, 500, 24, { size: 15, bold: true, color: C.teal, font: F.body });
  notes(s, ["Evidence today: desk research plus a production MVP. Do not imply that the pilot has already happened.", "Application states a planned four-week pilot with one teacher and 12–20 learners."]);
}

// 4. Solution and GenAI
{
  const s = presentation.slides.add();
  s.background.fill = C.paper;
  page(s, 4, "03 / SOLUTION + WHY GENAI");
  title(s, "The Fahim learning loop", "Each session links the learner’s source and reasoning to a specific intervention, a transfer task, and a scheduled review.");
  await image(s, how, 64, 205, 510, 330, { geometry: "roundRect", radius: 22, fit: "cover", alt: "Fahim learning process page" });
  rect(s, 78, 500, 482, 56, C.navy, 16);
  textBox(s, "Live product journey, not a concept mockup", 98, 516, 442, 28, { size: 17, bold: true, color: C.ivory, font: F.body });
  const steps = [
    ["1", "Trusted source", C.teal], ["2", "Learner attempt", C.saffron], ["3", "Misconception", C.vermilion], ["4", "Targeted intervention", C.teal], ["5", "New application", C.saffron], ["6", "Evidence + review", C.navy],
  ];
  let y = 212;
  for (const [n, label, color] of steps) {
    rect(s, 630, y, 44, 44, color, 22);
    textBox(s, n, 630, y + 7, 44, 26, { size: 16, bold: true, color: color === C.saffron ? C.navy : C.white, align: "center", valign: "middle", font: F.fallback });
    textBox(s, label, 694, y + 4, 390, 34, { size: 21, bold: true, color: C.navy, font: F.display });
    if (n !== "6") line(s, 652, y + 44, 0, 22, C.line, 2);
    y += 64;
  }
  textBox(s, "WHY GENAI IS REQUIRED", 630, 602, 220, 20, { size: 12, bold: true, color: C.vermilion, font: F.fallback });
  textBox(s, "It interprets free-text reasoning, grounds the response in evidence, and creates the next test for this learner.", 856, 592, 300, 48, { size: 15, color: C.muted, font: F.body });
  notes(s, ["GenAI is the adaptive reasoning layer. Fixed rules cannot respond to each learner's source, language, reasoning path, and misconception at scale.", `Product reference captured from ${demoUrl.replace('/showcase','/how-it-works')}`]);
}

// 5. Demo story
{
  const s = presentation.slides.add();
  s.background.fill = C.navy;
  page(s, 5, "04 / DEMO STORY");
  title(s, "Demo: Newton’s second law", "Mariam explains one answer in her own words. Fahim identifies the likely misconception and tests it with a new task.", true);
  await image(s, showcase, 64, 202, 760, 410, { geometry: "roundRect", radius: 26, fit: "cover", alt: "Fahim interactive showcase" });
  rect(s, 846, 202, 370, 410, C.paper, 26);
  const frames = [
    ["01", "Start", "Mariam opens Newton’s second law from a trusted source."],
    ["02", "Reason", "She explains the answer in her own words."],
    ["03", "Diagnose", "Fahim proposes a revisable misconception hypothesis."],
    ["04", "Prove", "A new task checks transfer, then schedules review."],
  ];
  let fy = 228;
  for (const [n, h, body] of frames) {
    textBox(s, n, 872, fy, 40, 22, { size: 12, bold: true, color: C.vermilion, font: F.fallback });
    textBox(s, h, 922, fy - 2, 110, 28, { size: 18, bold: true, color: C.navy, font: F.display });
    textBox(s, body, 922, fy + 28, 252, 46, { size: 15, color: C.muted, font: F.body });
    if (n !== "04") line(s, 872, fy + 78, 302, 0, C.line, 1);
    fy += 90;
  }
  rect(s, 64, 630, 1152, 48, C.teal, 14);
  textBox(s, "One evidence chain connects the source, the learner’s reasoning, the diagnosis and the delayed review.", 88, 641, 930, 26, { size: 17, bold: true, color: C.white, font: F.body });
  s.images.add({ blob: qr, contentType: "image/png", alt: "QR code to Fahim live demo", fit: "contain", position: { left: 1118, top: 625, width: 62, height: 62 } });
  notes(s, ["Demo timing: 20 seconds hook, 30 seconds setup, 90 seconds hero path, 50 seconds trust, 30 seconds outcome, 20 seconds buffer.", `Live demo: ${demoUrl}`]);
}

// 6. Impact and pilot
{
  const s = presentation.slides.add();
  s.background.fill = C.ivory;
  page(s, 6, "05 / IMPACT + PROOF");
  title(s, "Pilot measurement plan", "The working MVP is ready for a consented four-week study of misconception correction and seven-day retention.");
  textBox(s, "EVIDENCE LADDER", 64, 214, 240, 24, { size: 12, bold: true, color: C.teal, font: F.fallback });
  line(s, 116, 306, 990, 0, C.line, 6);
  const ladder = [
    [116, "Need", "Desk research", true], [364, "Usability", "Working MVP", true], [612, "Behavior", "Pilot", false], [860, "Learning", "Delayed check", false], [1106, "Adoption", "Repeat cohort", false],
  ];
  for (const [x, h, b, done] of ladder) {
    rect(s, x - 18, 288, 36, 36, done ? C.teal : C.paper, 18, done ? C.teal : C.line);
    if (done) textBox(s, "✓", x - 18, 293, 36, 20, { size: 16, bold: true, color: C.white, align: "center", font: F.fallback });
    textBox(s, h, x - 70, 342, 140, 28, { size: 18, bold: true, color: C.navy, align: "center", font: F.display });
    textBox(s, b, x - 84, 374, 168, 42, { size: 14, color: C.muted, align: "center", font: F.body });
  }
  rect(s, 64, 462, 1110, 146, C.paper, 24, C.line);
  textBox(s, "4 weeks", 94, 492, 180, 50, { size: 36, bold: true, color: C.vermilion, font: F.fallback });
  textBox(s, "12–20 learners\n1 teacher", 300, 492, 200, 68, { size: 23, bold: true, color: C.navy, font: F.display });
  textBox(s, "Primary outcome", 550, 484, 180, 22, { size: 12, bold: true, color: C.teal, font: F.fallback });
  textBox(s, "Misconception correction rate", 550, 516, 250, 54, { size: 21, bold: true, color: C.navy, font: F.display });
  textBox(s, "Delayed measure", 820, 484, 170, 22, { size: 12, bold: true, color: C.saffron, font: F.fallback });
  textBox(s, "Retention after 7 days", 820, 516, 230, 54, { size: 21, bold: true, color: C.navy, font: F.display });
  textBox(s, "Guardrails: unsafe-answer rate and teacher review time", 550, 578, 530, 24, { size: 14, color: C.muted, font: F.body });
  rect(s, 64, 628, 1110, 36, C.tealLight, 12);
  textBox(s, "No pilot results are claimed in this deck.", 84, 635, 1070, 20, { size: 14, bold: true, color: C.teal, align: "center", font: F.body });
  notes(s, ["Pilot design: pre-check, guided learning session, immediate post-check, delayed check after seven days.", "The pilot target is a hypothesis and should be approved with the partner teacher before launch."]);
}

// 7. Adoption + trust
{
  const s = presentation.slides.add();
  s.background.fill = C.paper;
  page(s, 7, "06 / ADOPTION + TRUST");
  title(s, "Adoption starts with the learner", "Immediate study value creates the entry point. Teachers and institutions gain visibility into learning gaps without reading private chats.");
  await image(s, teacher, 790, 210, 426, 400, { geometry: "roundRect", radius: 28, fit: "cover", alt: "Egyptian teacher reviewing class learning patterns" });
  rect(s, 64, 214, 660, 110, C.navy, 24);
  textBox(s, "BEACHHEAD", 92, 238, 130, 22, { size: 12, bold: true, color: C.saffron, font: F.fallback });
  textBox(s, "Secondary and university STEM learners preparing for high-stakes assessment", 92, 270, 590, 40, { size: 21, bold: true, color: C.ivory, font: F.display });
  textBox(s, "ADOPTION PATH", 64, 356, 180, 22, { size: 12, bold: true, color: C.teal, font: F.fallback });
  const pathItems = [
    ["1", "Student self-serve", "Immediate study value"],
    ["2", "Teacher cohort", "Misconception signals"],
    ["3", "School license", "Outcome review"],
  ];
  let ax = 64;
  for (const [n, h, b] of pathItems) {
    rect(s, ax, 392, 200, 114, C.ivory, 20, C.line);
    textBox(s, n, ax + 16, 410, 30, 24, { size: 14, bold: true, color: C.vermilion, font: F.fallback });
    textBox(s, h, ax + 16, 444, 164, 28, { size: 18, bold: true, color: C.navy, font: F.display });
    textBox(s, b, ax + 16, 478, 164, 22, { size: 13, color: C.muted, font: F.body });
    ax += 220;
  }
  textBox(s, "PRICING HYPOTHESES", 64, 542, 200, 22, { size: 12, bold: true, color: C.vermilion, font: F.fallback });
  textBox(s, "Free access, Student Plus 99–149 EGP/month, Teacher Pro 249–399 EGP/month, schools priced per active learner", 64, 576, 650, 48, { size: 17, bold: true, color: C.navy, font: F.body });
  textBox(s, "Pilot discovery will test willingness to pay and retention. Prices are not final.", 64, 630, 650, 26, { size: 13, color: C.muted, font: F.body });
  rect(s, 816, 548, 374, 84, "#0B1733D9", 18);
  textBox(s, "Privacy boundary", 838, 564, 156, 22, { size: 14, bold: true, color: C.saffron, font: F.display });
  textBox(s, "Teachers see patterns and priorities, not private learner chats.", 838, 590, 322, 34, { size: 14, color: C.ivory, font: F.body });
  notes(s, ["Pricing is a hypothesis for validation, not a final commercial decision.", "Adoption roles: learner uses, parent or school may fund, institution approves, teacher champions the workflow."]);
}

// 8. Team and ask
{
  const s = presentation.slides.add();
  s.background.fill = C.navy;
  await image(s, closing, 0, 0, 1280, 720, { fit: "cover", alt: "Verified learning milestone path" });
  rect(s, 0, 0, 1280, 720, "#0B1733D9");
  page(s, 8, "07 / TEAM + ASK");
  title(s, "Pilot partnership", "We seek one school or university partner for four weeks with 12–20 learners and one teacher.", true);
  await image(s, founder, 70, 222, 156, 156, { geometry: "ellipse", fit: "cover", alt: "Marwan Abdelghaffar" });
  textBox(s, "Marwan Yasser Hassan Abdelghaffar", 258, 230, 430, 34, { size: 22, bold: true, color: C.ivory, font: F.display });
  textBox(s, "Team Leader, Helwan University, Level 3", 258, 272, 430, 30, { size: 16, color: C.tealLight, font: F.body });
  textBox(s, "Mostafa Yasser Hassan Abdelghaffar", 72, 430, 380, 28, { size: 18, bold: true, color: C.ivory, font: F.display });
  textBox(s, "Capital University, Level 2", 72, 464, 300, 24, { size: 14, color: "#D5DDEC", font: F.body });
  textBox(s, "Basel Abdel-Maqsoud Ziada", 72, 514, 380, 28, { size: 18, bold: true, color: C.ivory, font: F.display });
  textBox(s, "New Mansoura University, Fresh graduate", 72, 548, 360, 24, { size: 14, color: "#D5DDEC", font: F.body });
  textBox(s, "Jana Hossam Salah Abdelhakim", 72, 598, 380, 28, { size: 18, bold: true, color: C.ivory, font: F.display });
  textBox(s, "Capital University, Level 4", 72, 632, 300, 24, { size: 14, color: "#D5DDEC", font: F.body });
  rect(s, 742, 218, 458, 322, C.paper, 28);
  textBox(s, "THE ASK", 774, 248, 150, 22, { size: 12, bold: true, color: C.vermilion, font: F.fallback });
  textBox(s, "A consented pilot partner", 774, 286, 380, 44, { size: 28, bold: true, color: C.navy, font: F.display });
  textBox(s, "Success after four weeks", 774, 354, 300, 24, { size: 14, bold: true, color: C.teal, font: F.fallback });
  textBox(s, "Measure misconception correction, delayed retention, teacher review time, and safety guardrails.", 774, 388, 378, 92, { size: 19, color: C.muted, font: F.body });
  s.images.add({ blob: qr, contentType: "image/png", alt: "QR code to live prototype", fit: "contain", position: { left: 1026, top: 552, width: 120, height: 120 } });
  textBox(s, "LIVE PROTOTYPE", 774, 574, 220, 22, { size: 12, bold: true, color: C.saffron, font: F.fallback });
  textBox(s, "Scan to open the live prototype", 774, 606, 238, 50, { size: 15, color: C.ivory, font: F.fallback });
  notes(s, ["Close with a single ask: access to one partner setting for a measured four-week pilot.", `Contact: marwanyasser23@science.helwan.edu.eg ; Demo: ${demoUrl}`]);
}

// 9. Competitive difference
{
  const s = presentation.slides.add();
  s.background.fill = C.paper;
  page(s, 9, "APPENDIX / DIFFERENCE");
  title(s, "Competitive difference", "Fahim keeps the learner’s source, attempt, misconception, intervention, transfer task, and later review in one evidence chain.");
  const cols = [64, 350, 610, 870];
  const widths = [270, 244, 244, 340];
  const headers = ["Alternative", "What it does well", "What remains missing", "Fahim’s difference"];
  headers.forEach((h, i) => { rect(s, cols[i], 210, widths[i], 54, i === 3 ? C.teal : C.navy, 12); textBox(s, h, cols[i] + 14, 226, widths[i] - 28, 24, { size: 15, bold: true, color: C.white, font: F.body }); });
  const rows = [
    ["Generic AI assistants", "Fast explanations and dialogue", "Weak continuity between attempt, error, and later retention", "Claim-level evidence and a persistent learning record"],
    ["Content and video platforms", "Breadth and structured courses", "Consumption can look like progress", "Attempt, transfer task, and delayed review"],
    ["Practice apps", "Repeatable questions and scoring", "Limited free-text reasoning diagnosis", "Revisable misconception hypothesis and targeted intervention"],
  ];
  let ry = 282;
  for (let r = 0; r < rows.length; r++) {
    const bg = r % 2 === 0 ? C.ivory : C.paper;
    for (let i = 0; i < 4; i++) {
      rect(s, cols[i], ry, widths[i], 104, bg, 0, C.line);
      textBox(s, rows[r][i], cols[i] + 14, ry + 18, widths[i] - 28, 72, { size: i === 0 ? 17 : 15, bold: i === 0 || i === 3, color: i === 3 ? C.teal : C.ink, font: F.body });
    }
    ry += 104;
  }
  rect(s, 64, 614, 1146, 52, C.navy, 16);
  textBox(s, "Defensible asset: a consented evidence graph of misconceptions, interventions, and retained understanding.", 88, 628, 1098, 26, { size: 17, bold: true, color: C.ivory, align: "center", font: F.body });
  notes(s, ["Competitor references reviewed in product planning: ChatGPT Study Mode, NotebookLM, Perplexity Learn, Khan Academy, Coursera, and regional Arabic learning products.", "Avoid claiming that no competitor can add similar features. The current differentiation is the integrated evidence workflow."]);
}

// 10. Architecture
{
  const s = presentation.slides.add();
  s.background.fill = C.ivory;
  page(s, 10, "APPENDIX / TECHNICAL EXECUTION");
  title(s, "Technical architecture and trust controls", "Each model response passes through retrieval, authorization, provenance checks, and auditable product rules.");
  const nodes = [
    [70, 250, 170, 96, "Trusted sources", "Files, curriculum, verified web"],
    [280, 250, 170, 96, "Hybrid retrieval", "Keyword + semantic context"],
    [490, 250, 170, 96, "AI model router", "Three-provider failover"],
    [700, 250, 170, 96, "Evidence contract", "Verified, inferred, teaching"],
    [910, 250, 170, 96, "Signed grading", "Server-side assessment"],
    [1120, 250, 110, 96, "Record", "Progress + review"],
  ];
  for (let i = 0; i < nodes.length; i++) {
    const [x, y, w, h, head, body] = nodes[i];
    rect(s, x, y, w, h, i === 5 ? C.teal : C.paper, 18, i === 5 ? C.teal : C.line, "shadow-sm");
    textBox(s, head, x + 14, y + 16, w - 28, 26, { size: 16, bold: true, color: i === 5 ? C.white : C.navy, align: "center", font: F.display });
    textBox(s, body, x + 12, y + 50, w - 24, 34, { size: 12, color: i === 5 ? C.tealLight : C.muted, align: "center", font: F.body });
    if (i < nodes.length - 1) line(s, x + w, y + h / 2, nodes[i + 1][0] - (x + w), 0, C.saffron, 3);
  }
  const metrics = [
    ["155", "automated tests"], ["65", "RLS-protected tables"], ["3", "AI provider failover"], ["23", "production routes checked"],
  ];
  let mx = 90;
  for (const [v, l] of metrics) {
    textBox(s, v, mx, 432, 180, 62, { size: 44, bold: true, color: C.vermilion, align: "center", font: F.fallback });
    textBox(s, l, mx, 494, 180, 28, { size: 15, bold: true, color: C.navy, align: "center", font: F.body });
    mx += 284;
  }
  rect(s, 70, 566, 1160, 72, C.navy, 18);
  textBox(s, "Security boundary", 94, 588, 174, 22, { size: 13, bold: true, color: C.saffron, font: F.fallback });
  textBox(s, "Supabase Auth and RLS, protected routes, server-side authorization, signed quiz results, and credential issuance outside the model", 278, 580, 920, 44, { size: 16, color: C.ivory, font: F.body });
  notes(s, ["Technical validation reflects the current repository verification: 155 tests, 65 tables with RLS coverage, three AI provider failover paths, and 23 production routes checked.", "Do not present these engineering checks as learning-outcome evidence."]);
}

// 11. Pilot plan
{
  const s = presentation.slides.add();
  s.background.fill = C.paper;
  page(s, 11, "APPENDIX / PILOT PLAN");
  title(s, "Four-week pilot protocol", "The study tests whether the workflow corrects misconceptions and preserves improvement under classroom conditions.");
  const phases = [
    [64, "WEEK 0", "Prepare", "Consent, teacher review, baseline task, known-good content"],
    [344, "WEEK 1", "Observe", "Run the hero workflow and log failure modes"],
    [624, "WEEKS 2–3", "Adapt", "Target misconceptions and schedule spaced review"],
    [904, "WEEK 4", "Measure", "Post-check, seven-day retention, teacher debrief"],
  ];
  for (const [x, tag, head, body] of phases) {
    textBox(s, tag, x, 220, 220, 22, { size: 12, bold: true, color: C.teal, font: F.fallback });
    line(s, x, 256, 220, 0, C.saffron, 5);
    textBox(s, head, x, 278, 220, 42, { size: 25, bold: true, color: C.navy, font: F.display });
    textBox(s, body, x, 332, 220, 86, { size: 16, color: C.muted, font: F.body });
  }
  rect(s, 64, 470, 1100, 154, C.ivory, 24, C.line);
  textBox(s, "DECISION GATE", 92, 498, 180, 22, { size: 12, bold: true, color: C.vermilion, font: F.fallback });
  textBox(s, "Continue only if the pilot shows usable diagnosis, measurable delayed retention, acceptable teacher review time, and no unresolved safety issue.", 92, 536, 690, 66, { size: 20, bold: true, color: C.navy, font: F.body });
  textBox(s, "Pilot outputs", 840, 498, 200, 24, { size: 14, bold: true, color: C.teal, font: F.display });
  textBox(s, "Anonymized evidence report\nTeacher workflow findings\nPriority product changes", 840, 532, 260, 82, { size: 16, color: C.muted, font: F.body });
  notes(s, ["Pilot scope should remain small enough for direct observation and fast iteration.", "All pilot outcomes must be reported with sample size, dates, setting, method, and limitations."]);
}

// 12. Q&A defense / close
{
  const s = presentation.slides.add();
  s.background.fill = C.navy;
  page(s, 12, "APPENDIX / Q&A DEFENSE");
  title(s, "Judge questions and direct answers", "The current evidence boundary stays clear: the product works, while learning impact still requires a measured pilot.", true);
  const qs = [
    ["Why GenAI?", "It adapts to source, language, reasoning, and misconception. Rules alone cannot do this at scale."],
    ["How do you limit wrong answers?", "Retrieval, citations, evidence labels, human review paths, and model failover."],
    ["What works today?", "A production MVP with end-to-end auth, RAG, grading, review, and learning evidence."],
    ["What remains unproven?", "Learning outcomes, willingness to pay, and classroom adoption under real conditions."],
    ["What do you need now?", "One partner for a consented four-week pilot with 12–20 learners and one teacher."],
  ];
  let qy = 208;
  for (let i = 0; i < qs.length; i++) {
    textBox(s, String(i + 1).padStart(2, "0"), 72, qy, 50, 24, { size: 13, bold: true, color: C.saffron, font: F.fallback });
    textBox(s, qs[i][0], 136, qy - 2, 340, 30, { size: 19, bold: true, color: C.ivory, font: F.display });
    textBox(s, qs[i][1], 500, qy - 2, 650, 48, { size: 16, color: "#D5DDEC", font: F.body });
    if (i < qs.length - 1) line(s, 136, qy + 58, 1014, 0, "#334663", 1);
    qy += 84;
  }
  rect(s, 72, 646, 1078, 42, C.teal, 14);
  textBox(s, "Live demo: fahim-ai-egypt.vercel.app/showcase", 96, 655, 680, 24, { size: 16, bold: true, color: C.white, font: F.fallback });
  textBox(s, "marwanyasser23@science.helwan.edu.eg", 790, 655, 332, 24, { size: 14, color: C.white, align: "right", font: F.fallback });
  notes(s, ["Use this slide only for Q&A or as a backup close.", `Live demo: ${demoUrl}`]);
}

await (await PresentationFile.exportPptx(presentation)).save(candidatePath);

const { finalizePresentation } = await import(pathToFileURL(path.join(SKILL_DIR, "container_tools/artifact_tool_utils.mjs")).href);
const requirements = {
  explicitTotalSlideCount: 12,
  requiredNativeTableOwnerSlides: [],
  requiredNativeChartOwnerSlides: [],
};
const fontPolicy = {
  basis: "design",
  families: [F.fallback, F.arabic],
};

await finalizePresentation({
  ...requirements,
  workspaceDir,
  candidatePath,
  finalPath: FINAL_PPTX,
  pythonExecutable: "C:/Users/Marwan Yasser/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe",
  integrityValidatorPath: path.join(SKILL_DIR, "container_tools/inspect_presentation_package_integrity.py"),
  layoutValidatorPath: path.join(SKILL_DIR, "container_tools/inspect_presentation_layout_geometry.py"),
  layoutArgs: ["--expected-slide-size-emu", "12192000,6858000", "--validate-heading-fit"],
  fontPolicy,
  verifyArtifactToolImport: true,
  receiptPath: path.join(TMP_DIR, "Fahim_AI_Hackathon_2026_Identity_v3.validation.json"),
});

console.log(FINAL_PPTX);
