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
const FINAL_PPTX = path.join(outputDir, "Fahim_AI_Hackathon_2026_Competition_v4.pptx");
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

const showcase = path.join(workspaceDir, ".deck-build", "product", "showcase.png");
const how = path.join(workspaceDir, ".deck-build", "product", "how-it-works.png");
const logo = path.join(workspaceDir, "public", "brand", "fahim-logo-dark.svg");
const miniLogo = path.join(workspaceDir, "public", "brand", "fahim-app-icon.svg");
const brandMark = path.join(workspaceDir, "public", "brand", "fahim-symbol-v2-2048.png");
const miniLogoBytes = await imageBytes(miniLogo);
const demoUrl = "https://fahim-ai-egypt.vercel.app/showcase";
const qr = await QRCode.toBuffer(demoUrl, { type: "png", width: 420, margin: 1, color: { dark: C.navy, light: C.paper } });

// 1. Cover
{
  const s = presentation.slides.add();
  s.background.fill = C.navy;
  for (let gx = 0; gx < 1280; gx += 64) line(s, gx, 0, 0, 720, "#1B3151", 0.5);
  for (let gy = 0; gy < 720; gy += 64) line(s, 0, gy, 1280, 0, "#1B3151", 0.5);
  rect(s, 742, 72, 420, 420, "#102A4C", 56, "#21466B");
  await image(s, brandMark, 804, 122, 296, 296, { fit: "contain", alt: "Fahim AI official mark" });
  await image(s, logo, 64, 48, 188, 64, { fit: "contain", alt: "Fahim logo" });
  textBox(s, "Turn every answer into\nevidence of understanding", 64, 164, 650, 184, { size: 48, bold: true, color: C.ivory, font: F.display, lineSpacing: 0.98 });
  textBox(s, "افهمها. اثبتها. افتكرها.", 66, 364, 510, 54, { size: 27, bold: true, color: C.saffron, font: F.arabic, align: "left" });
  textBox(s, "A bilingual learning system that diagnoses misconceptions, teaches the missing concept, tests transfer, and schedules the right review.", 66, 430, 610, 88, { size: 20, color: "#D5DDEC", font: F.body });
  const coverFlow = [[66,"SOURCE",C.teal],[218,"ATTEMPT",C.saffron],[370,"DIAGNOSE",C.vermilion],[522,"PROVE",C.teal]];
  for (let i = 0; i < coverFlow.length; i++) {
    const [x,label,color] = coverFlow[i];
    rect(s, x, 548, 128, 44, color, 14);
    textBox(s, label, x, 560, 128, 20, { size: 12, bold: true, color: color === C.saffron ? C.navy : C.white, align: "center", font: F.fallback });
    if (i < coverFlow.length - 1) line(s, x + 128, 570, 24, 0, "#6F819E", 2);
  }
  rect(s, 748, 530, 410, 78, "#081124", 20, "#2C4568");
  textBox(s, "STUDENT TRACK  ·  ASSESSMENT REVOLUTION", 770, 548, 366, 20, { size: 12, bold: true, color: C.saffron, align: "center", font: F.fallback });
  textBox(s, "WORKING PROTOTYPE", 770, 578, 366, 20, { size: 14, bold: true, color: C.tealLight, align: "center", font: F.fallback });
  textBox(s, "GenAI for Education Hackathon 2026  ·  Team Fahim AI", 66, 648, 660, 24, { size: 14, color: C.ivory, font: F.fallback });
  notes(s, ["Opening hook: a correct answer is not proof of understanding. Fahim turns an answer into a traceable learning decision.", `Live prototype: ${demoUrl}`]);
}

// 2. Problem
{
  const s = presentation.slides.add();
  s.background.fill = C.paper;
  page(s, 2, "01 / PROBLEM");
  title(s, "A correct answer can hide the wrong understanding", "Most platforms score the answer. Generic AI explains the topic. Neither proves what the learner actually understood.");
  rect(s, 64, 218, 360, 304, C.navy, 28);
  textBox(s, "THE ANSWER", 92, 246, 180, 22, { size: 12, bold: true, color: C.saffron, font: F.fallback });
  textBox(s, "Acceleration is −3 m/s²", 92, 300, 292, 72, { size: 30, bold: true, color: C.ivory, font: F.display });
  rect(s, 92, 404, 292, 74, "#162C4C", 18, "#294766");
  textBox(s, "✓ Correct", 112, 422, 112, 28, { size: 18, bold: true, color: C.tealLight, font: F.body });
  textBox(s, "But why?", 250, 422, 108, 28, { size: 18, bold: true, color: C.saffron, align: "right", font: F.body });
  const branches = [
    [506, 218, "MEMORIZED", "Repeated the model answer without a causal explanation.", C.saffron],
    [506, 352, "SIGN CONFUSION", "Treats negative acceleration as slowing down in every case.", C.vermilion],
    [506, 486, "FRAGILE TRANSFER", "Cannot apply the same idea when the direction changes.", C.teal],
  ];
  line(s, 424, 370, 58, 0, C.line, 3);
  line(s, 482, 268, 0, 268, C.line, 3);
  for (const [x,y,head,body,color] of branches) {
    line(s, 482, y + 50, 24, 0, color, 3);
    rect(s, x, y, 646, 104, C.ivory, 22, color);
    rect(s, x + 18, y + 18, 112, 26, color, 10);
    textBox(s, head, x + 18, y + 24, 112, 14, { size: 10, bold: true, color: color === C.saffron ? C.navy : C.white, align: "center", font: F.fallback });
    textBox(s, body, x + 154, y + 24, 458, 56, { size: 18, bold: true, color: C.navy, font: F.body });
  }
  rect(s, 64, 620, 1088, 48, C.tealLight, 14);
  textBox(s, "The problem is not access to content. It is invisible misunderstanding.", 88, 633, 1040, 24, { size: 18, bold: true, color: C.teal, align: "center", font: F.body });
  notes(s, ["Use this example as the hook: the same correct answer can come from different mental models, so the next learning action should not be identical.", "Fahim is designed to reveal that hidden state before it becomes the next repeated mistake."]);
}

// 3. Users and context
{
  const s = presentation.slides.add();
  s.background.fill = C.ivory;
  page(s, 3, "02 / PEOPLE + CONTEXT");
  title(s, "The same blind spot affects the whole learning system", "Fahim starts with Egyptian secondary and university STEM learners studying concepts in Arabic and terminology in English.");
  const users = [
    [64, "01", "LEARNER", "I received an answer, but I still repeat the same mistake.", "Needs a precise next step", C.teal],
    [430, "02", "TEACHER", "I see scores, not the misconception behind each score.", "Needs actionable class signals", C.saffron],
    [796, "03", "FAMILY / SCHOOL", "Completion percentages do not prove durable understanding.", "Needs credible progress evidence", C.vermilion],
  ];
  for (const [x,n,role,quote,need,color] of users) {
    rect(s, x, 222, 334, 322, C.paper, 26, C.line, "shadow-sm");
    rect(s, x + 24, 246, 54, 54, color, 18);
    textBox(s, n, x + 24, 262, 54, 22, { size: 15, bold: true, color: color === C.saffron ? C.navy : C.white, align: "center", font: F.fallback });
    textBox(s, role, x + 96, 258, 200, 28, { size: 15, bold: true, color: C.navy, font: F.fallback });
    textBox(s, `“${quote}”`, x + 24, 330, 286, 100, { size: 22, bold: true, color: C.navy, font: F.display });
    line(s, x + 24, 452, 286, 0, C.line, 1);
    textBox(s, need, x + 24, 474, 286, 42, { size: 16, bold: true, color, font: F.body });
  }
  rect(s, 64, 576, 1066, 72, C.navy, 20);
  textBox(s, "Beachhead", 88, 598, 110, 22, { size: 12, bold: true, color: C.saffron, font: F.fallback });
  textBox(s, "High-stakes bilingual STEM learning where a hidden misconception becomes the next lost mark.", 210, 594, 890, 32, { size: 19, bold: true, color: C.ivory, font: F.body });
  notes(s, ["The learner is the first user, but the value compounds across teacher and institution workflows.", "The initial use case is deliberately narrow: bilingual STEM concepts under assessment pressure."]);
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

// 6. Why GenAI
{
  const s = presentation.slides.add();
  s.background.fill = C.ivory;
  page(s, 6, "05 / WHY GENAI");
  title(s, "GenAI is the adaptive reasoning layer", "The model is not a decorative chatbot. It interprets reasoning, chooses an intervention, and generates the next valid test.");
  const cards = [
    [64, 218, "01", "UNDERSTAND", "Read open-ended Arabic and English answers, not only multiple choice.", C.teal],
    [630, 218, "02", "DIAGNOSE", "Form a revisable misconception hypothesis from the learner’s explanation.", C.vermilion],
    [64, 392, "03", "ADAPT", "Generate the smallest explanation that addresses this exact reasoning gap.", C.saffron],
    [630, 392, "04", "PROVE", "Create a fresh transfer question at the right difficulty and language.", C.navy2],
  ];
  for (const [x,y,n,head,body,color] of cards) {
    rect(s, x, y, 520, 142, C.paper, 24, C.line, "shadow-sm");
    rect(s, x + 22, y + 22, 54, 54, color, 18);
    textBox(s, n, x + 22, y + 38, 54, 20, { size: 14, bold: true, color: color === C.saffron ? C.navy : C.white, align: "center", font: F.fallback });
    textBox(s, head, x + 96, y + 26, 380, 28, { size: 18, bold: true, color: C.navy, font: F.fallback });
    textBox(s, body, x + 96, y + 62, 390, 60, { size: 17, color: C.muted, font: F.body });
  }
  rect(s, 64, 574, 1086, 72, C.navy, 18);
  textBox(s, "SAFETY RAIL", 88, 596, 130, 20, { size: 12, bold: true, color: C.saffron, font: F.fallback });
  textBox(s, "RAG grounding  ·  claim-level citations  ·  confidence boundaries  ·  signed grading  ·  educator review", 232, 592, 890, 32, { size: 17, bold: true, color: C.ivory, font: F.body });
  notes(s, ["Explain why a rules engine is not enough: the input is open-ended reasoning in two languages and the response must adapt to a specific misconception.", "The model operates inside product controls; it does not decide authorization or certificate issuance."]);
}

// 7. Innovation
{
  const s = presentation.slides.add();
  s.background.fill = C.paper;
  page(s, 7, "06 / INNOVATION");
  title(s, "Four ideas competitors rarely connect", "Fahim’s differentiation is not one AI feature. It is the evidence chain connecting the learner’s source, reasoning, intervention, transfer, and review.");
  const innovations = [
    [64, 218, "MISCONCEPTION ATLAS", "Recurring errors become patterns that can guide the next learning action.", "DIAGNOSE", C.vermilion],
    [630, 218, "EVIDENCE CONTRACT", "Separate sourced facts, inference, teaching explanation, and uncertainty.", "TRUST", C.teal],
    [64, 400, "BILINGUAL CONCEPT BRIDGE", "Arabic term, English term, definition, pronunciation, and common confusion.", "ACCESS", C.saffron],
    [630, 400, "LEARNING EVIDENCE GRAPH", "Show how mastery was earned across attempts, transfer, and spaced review.", "PROOF", C.navy2],
  ];
  for (const [x,y,head,body,tag,color] of innovations) {
    rect(s, x, y, 520, 150, C.ivory, 24, C.line);
    rect(s, x + 24, y + 22, 102, 28, color, 10);
    textBox(s, tag, x + 24, y + 29, 102, 14, { size: 10, bold: true, color: color === C.saffron ? C.navy : C.white, align: "center", font: F.fallback });
    textBox(s, head, x + 24, y + 66, 466, 28, { size: 20, bold: true, color: C.navy, font: F.display });
    textBox(s, body, x + 24, y + 100, 466, 38, { size: 16, color: C.muted, font: F.body });
  }
  rect(s, 64, 590, 1086, 62, C.navy, 18);
  textBox(s, "Content platforms deliver lessons  ·  Generic AI delivers answers  ·  Fahim builds verified understanding", 88, 608, 1038, 26, { size: 17, bold: true, color: C.ivory, align: "center", font: F.body });
  notes(s, ["Do not claim competitors cannot build these features. The differentiation is the integrated, persistent workflow and bilingual education context.", "This slide maps directly to the 25% innovation criterion."]);
}

// 8. Technical execution
{
  const s = presentation.slides.add();
  s.background.fill = C.ivory;
  page(s, 8, "07 / TECHNICAL EXECUTION");
  title(s, "From prompt to protected learning record", "A working architecture connects adaptive GenAI to retrieval, assessment, authorization, and a persistent evidence record.");
  const nodes = [
    [64, 236, 168, "Learner UI", "TypeScript web app"],
    [260, 236, 168, "Secure API", "Vercel functions"],
    [456, 236, 168, "AI router", "Gemini + fallback"],
    [652, 236, 168, "Retrieval", "Hybrid context"],
    [848, 236, 168, "Assessment", "Signed grading"],
    [1044, 236, 168, "Learning record", "Supabase + RLS"],
  ];
  for (let i = 0; i < nodes.length; i++) {
    const [x,y,w,head,body] = nodes[i];
    rect(s, x, y, w, 112, i === nodes.length - 1 ? C.teal : C.paper, 20, i === nodes.length - 1 ? C.teal : C.line, "shadow-sm");
    textBox(s, head, x + 12, y + 24, w - 24, 28, { size: 17, bold: true, color: i === nodes.length - 1 ? C.white : C.navy, align: "center", font: F.display });
    textBox(s, body, x + 12, y + 64, w - 24, 28, { size: 13, color: i === nodes.length - 1 ? C.tealLight : C.muted, align: "center", font: F.body });
    if (i < nodes.length - 1) line(s, x + w, y + 56, 28, 0, C.saffron, 3);
  }
  const proof = [["155", "automated tests"],["65", "RLS-protected tables"],["3", "provider paths"],["LIVE", "production deployment"]];
  let px = 64;
  for (const [v,l] of proof) {
    rect(s, px, 414, 250, 110, C.paper, 22, C.line);
    textBox(s, v, px + 20, 432, 210, 46, { size: 34, bold: true, color: v === "LIVE" ? C.teal : C.vermilion, align: "center", font: F.fallback });
    textBox(s, l, px + 20, 482, 210, 24, { size: 15, bold: true, color: C.navy, align: "center", font: F.body });
    px += 276;
  }
  rect(s, 64, 566, 1086, 76, C.navy, 18);
  textBox(s, "TRUST CONTROLS", 88, 590, 160, 20, { size: 12, bold: true, color: C.saffron, font: F.fallback });
  textBox(s, "Auth + RLS  ·  rate limits  ·  schema validation  ·  audit logs  ·  provenance  ·  local-first sync", 262, 586, 860, 32, { size: 17, bold: true, color: C.ivory, font: F.body });
  notes(s, ["The prototype is deployed and testable. The architecture is intentionally modular so providers and curricula can change without rewriting the learner experience.", "Engineering proof is not presented as learning-outcome evidence."]);
}

// 9. Impact and inclusion
{
  const s = presentation.slides.add();
  s.background.fill = C.paper;
  page(s, 9, "08 / IMPACT + INCLUSION");
  title(s, "Designed for Egyptian classrooms, ready to scale", "Inclusion is part of the system architecture, not a later accessibility checklist.");
  const pillars = [
    [64, "AR / EN", "BILINGUAL STEM", "Explain in Arabic while preserving the English terminology students meet in courses and exams.", C.teal],
    [344, "LOW", "LOW BANDWIDTH", "Local-first progress and lightweight learning flows preserve continuity when connectivity is unstable.", C.saffron],
    [624, "AA", "ACCESSIBLE UI", "Keyboard navigation, readable contrast, motion controls, and speech-ready interactions.", C.vermilion],
    [904, "PRIV", "PRIVACY BOUNDARY", "Teachers see misconception patterns and priorities, not private learner conversations by default.", C.navy2],
  ];
  for (const [x,badge,head,body,color] of pillars) {
    rect(s, x, 220, 246, 284, C.ivory, 24, C.line);
    rect(s, x + 24, 244, 70, 48, color, 16);
    textBox(s, badge, x + 24, 258, 70, 20, { size: 13, bold: true, color: color === C.saffron ? C.navy : C.white, align: "center", font: F.fallback });
    textBox(s, head, x + 24, 324, 198, 40, { size: 18, bold: true, color: C.navy, font: F.display });
    textBox(s, body, x + 24, 378, 198, 102, { size: 16, color: C.muted, font: F.body });
  }
  textBox(s, "REACH PATH", 64, 548, 150, 20, { size: 12, bold: true, color: C.teal, font: F.fallback });
  const reach = [[238,"LEARNER",C.teal],[500,"CLASSROOM",C.saffron],[762,"INSTITUTION",C.navy2]];
  for (let i = 0; i < reach.length; i++) {
    const [x,label,color] = reach[i];
    rect(s, x, 536, 210, 62, color, 18);
    textBox(s, label, x, 556, 210, 22, { size: 14, bold: true, color: color === C.saffron ? C.navy : C.white, align: "center", font: F.fallback });
    if (i < reach.length - 1) line(s, x + 210, 567, 52, 0, C.line, 3);
  }
  notes(s, ["Impact begins with immediate individual study value, then expands through teacher signals and institution-level support.", "This slide maps to educational impact and accessibility criteria without claiming measured outcomes that have not yet been collected."]);
}

// 10. Feasibility and adoption
{
  const s = presentation.slides.add();
  s.background.fill = C.ivory;
  page(s, 10, "09 / FEASIBILITY + SCALE");
  title(s, "A credible path from prototype to adoption", "The competition deliverable already works. The next steps convert it into classroom evidence, teacher workflow, and repeatable distribution.");
  const stages = [
    [64, "NOW", "WORKING PRODUCT", "Learner loop, RAG sources, quizzes, spaced review, completion credentials, live deployment.", C.teal],
    [430, "NEXT", "CLASSROOM VALIDATION", "Small consented study of diagnosis quality, immediate transfer, delayed recall, and teacher time.", C.saffron],
    [796, "THEN", "INSTITUTIONAL SCALE", "Classes, analytics, curriculum governance, verified partnerships, and organization controls.", C.vermilion],
  ];
  for (const [x,tag,head,body,color] of stages) {
    rect(s, x, 220, 334, 222, C.paper, 26, C.line, "shadow-sm");
    rect(s, x + 24, 244, 86, 28, color, 10);
    textBox(s, tag, x + 24, 251, 86, 14, { size: 10, bold: true, color: color === C.saffron ? C.navy : C.white, align: "center", font: F.fallback });
    textBox(s, head, x + 24, 302, 286, 34, { size: 20, bold: true, color: C.navy, font: F.display });
    textBox(s, body, x + 24, 350, 286, 72, { size: 16, color: C.muted, font: F.body });
  }
  textBox(s, "SUSTAINABLE MODEL", 64, 482, 190, 20, { size: 12, bold: true, color: C.teal, font: F.fallback });
  const offers = [[64,"FREE","Trust + acquisition"],[334,"STUDENT PLUS","Affordable depth"],[604,"TEACHER PRO","Class insights"],[874,"SCHOOLS","Active learner license"]];
  for (const [x,head,body] of offers) {
    rect(s, x, 518, 246, 92, C.navy, 18);
    textBox(s, head, x + 18, 538, 210, 22, { size: 15, bold: true, color: C.saffron, align: "center", font: F.fallback });
    textBox(s, body, x + 18, 572, 210, 20, { size: 14, color: C.ivory, align: "center", font: F.body });
  }
  textBox(s, "Pricing remains a testable hypothesis; the product architecture and adoption path are already implemented.", 64, 636, 1056, 24, { size: 14, color: C.muted, align: "center", font: F.body });
  notes(s, ["Feasibility is demonstrated by the live prototype and modular infrastructure. Market pricing and retention will be validated rather than asserted.", "The pilot is one next-step workstream, not the center of the competition story."]);
}

// 11. Team
{
  const s = presentation.slides.add();
  s.background.fill = C.paper;
  page(s, 11, "10 / TEAM");
  title(s, "A student team building for a problem we live", "Four contributors united around product engineering, learning design, research, and storytelling.");
  const people = [
    [64, 220, "MA", "Marwan Yasser Hassan\nAbdelghaffar", "TEAM LEADER", C.teal],
    [630, 220, "MY", "Mostafa Yasser Hassan\nAbdelghaffar", "TEAM MEMBER", C.saffron],
    [64, 410, "BZ", "Basel Abdel-Maqsoud\nAbdel-Maqsoud Ziada", "TEAM MEMBER", C.vermilion],
    [630, 410, "JH", "Jana Hossam Salah\nAbdelhakim", "TEAM MEMBER", C.navy2],
  ];
  for (const [x,y,initials,name,role,color] of people) {
    rect(s, x, y, 520, 154, C.ivory, 24, C.line, "shadow-sm");
    rect(s, x + 24, y + 24, 104, 104, color, 26);
    textBox(s, initials, x + 24, y + 56, 104, 36, { size: 26, bold: true, color: color === C.saffron ? C.navy : C.white, align: "center", font: F.fallback });
    textBox(s, name, x + 154, y + 28, 330, 62, { size: 21, bold: true, color: C.navy, font: F.display });
    textBox(s, role, x + 154, y + 106, 250, 20, { size: 12, bold: true, color, font: F.fallback });
  }
  rect(s, 64, 602, 1086, 54, C.navy, 16);
  textBox(s, "No titles for show. One shared responsibility: make learning visible, adaptive, and trustworthy.", 88, 617, 1038, 24, { size: 17, bold: true, color: C.ivory, align: "center", font: F.body });
  notes(s, ["Introduce the team quickly by name and role. Do not use photos, invented specialist titles, or inflated credentials.", "Move directly from the team to the final promise and live prototype."]);
}

// 12. Close
{
  const s = presentation.slides.add();
  s.background.fill = C.navy;
  for (let gx = 0; gx < 1280; gx += 64) line(s, gx, 0, 0, 720, "#1B3151", 0.5);
  for (let gy = 0; gy < 720; gy += 64) line(s, 0, gy, 1280, 0, "#1B3151", 0.5);
  page(s, 12, "11 / CLOSE");
  title(s, "Do not ask whether they finished.\nAsk what they can prove.", "Fahim transforms study from content consumption into a traceable cycle of understanding.", true);
  await image(s, brandMark, 858, 174, 252, 252, { fit: "contain", alt: "Fahim AI mark" });
  const finalProof = [[64,"WORKING","Bilingual prototype"],[282,"DISTINCT","Evidence architecture"],[500,"READY","Clear validation path"]];
  for (const [x,tag,body] of finalProof) {
    rect(s, x, 312, 190, 104, "#132B4A", 20, "#294766");
    textBox(s, tag, x + 18, 334, 154, 20, { size: 12, bold: true, color: C.saffron, align: "center", font: F.fallback });
    textBox(s, body, x + 18, 368, 154, 30, { size: 15, bold: true, color: C.ivory, align: "center", font: F.body });
  }
  rect(s, 64, 470, 680, 112, C.teal, 24);
  textBox(s, "EXPERIENCE FAHIM AI", 92, 492, 300, 20, { size: 12, bold: true, color: C.white, font: F.fallback });
  textBox(s, "fahim-ai-egypt.vercel.app", 92, 530, 520, 32, { size: 24, bold: true, color: C.white, font: F.display });
  s.images.add({ blob: qr, contentType: "image/png", alt: "QR code to Fahim live prototype", fit: "contain", position: { left: 628, top: 482, width: 88, height: 88 } });
  textBox(s, "We are seeking mentorship, classroom access, and direct feedback from educators.", 64, 622, 1040, 30, { size: 19, bold: true, color: C.tealLight, font: F.body });
  notes(s, ["Close on the product promise, not on the absence of pilot data.", "Ask judges to experience the live prototype and evaluate the integrated learning loop.", `Live demo: ${demoUrl}`]);
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
  receiptPath: path.join(TMP_DIR, "Fahim_AI_Hackathon_2026_Competition_v4.validation.json"),
});

console.log(FINAL_PPTX);
