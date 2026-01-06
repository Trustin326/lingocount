/* LingoCount™ — No-backend demo SaaS
   - Tabs (Counting/Colors/Alphabet)
   - Quiz mode + streaks
   - Text-to-speech (SpeechSynthesis)
   - Progress in localStorage
   - Pricing toggle monthly/annual
   - Confetti burst + toast
*/

const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

/* ---------------------------
   Data inspired by PDF themes
---------------------------- */
// Counting sets: 1–10, multi-lingual
// (Spelling variants kept simple for demo UI.)
const COUNT = {
  EN_FR_AR: {
    label: "English • French • Arabic",
    langs: ["EN","FR","AR"],
    items: {
      1:{EN:"one",FR:"un",AR:"wahed"},
      2:{EN:"two",FR:"deux",AR:"ethnein"},
      3:{EN:"three",FR:"trois",AR:"thalata"},
      4:{EN:"four",FR:"quatre",AR:"arba-a"},
      5:{EN:"five",FR:"cinq",AR:"khamsa"},
      6:{EN:"six",FR:"six",AR:"sitta"},
      7:{EN:"seven",FR:"sept",AR:"sab-a"},
      8:{EN:"eight",FR:"huit",AR:"thamanya"},
      9:{EN:"nine",FR:"neuf",AR:"tis-a"},
      10:{EN:"ten",FR:"dix",AR:"ashara"},
    }
  },
  EN_FR_ES: {
    label: "English • French • Spanish",
    langs: ["EN","FR","ES"],
    items: {
      1:{EN:"one",FR:"un",ES:"uno"},
      2:{EN:"two",FR:"deux",ES:"dos"},
      3:{EN:"three",FR:"trois",ES:"tres"},
      4:{EN:"four",FR:"quatre",ES:"cuatro"},
      5:{EN:"five",FR:"cinq",ES:"cinco"},
      6:{EN:"six",FR:"six",ES:"seis"},
      7:{EN:"seven",FR:"sept",ES:"siete"},
      8:{EN:"eight",FR:"huit",ES:"ocho"},
      9:{EN:"nine",FR:"neuf",ES:"nueve"},
      10:{EN:"ten",FR:"dix",ES:"diez"},
    }
  },
  EN_ES_AR: {
    label: "English • Spanish • Arabic",
    langs: ["EN","ES","AR"],
    items: {
      1:{EN:"one",ES:"uno",AR:"wahed"},
      2:{EN:"two",ES:"dos",AR:"ethnein"},
      3:{EN:"three",ES:"tres",AR:"thalata"},
      4:{EN:"four",ES:"cuatro",AR:"arba-a"},
      5:{EN:"five",ES:"cinco",AR:"khamsa"},
      6:{EN:"six",ES:"seis",AR:"sitta"},
      7:{EN:"seven",ES:"siete",AR:"sab-a"},
      8:{EN:"eight",ES:"ocho",AR:"thamanya"},
      9:{EN:"nine",ES:"nueve",AR:"tis-a"},
      10:{EN:"ten",ES:"diez",AR:"ashara"},
    }
  },
  EN_ES_ZH: {
    label: "English • Spanish • Chinese",
    langs: ["EN","ES","ZH"],
    items: {
      1:{EN:"one",ES:"uno",ZH:"yi"},
      2:{EN:"two",ES:"dos",ZH:"er"},
      3:{EN:"three",ES:"tres",ZH:"san"},
      4:{EN:"four",ES:"cuatro",ZH:"si"},
      5:{EN:"five",ES:"cinco",ZH:"wu"},
      6:{EN:"six",ES:"seis",ZH:"liu"},
      7:{EN:"seven",ES:"siete",ZH:"qi"},
      8:{EN:"eight",ES:"ocho",ZH:"ba"},
      9:{EN:"nine",ES:"nueve",ZH:"jiu"},
      10:{EN:"ten",ES:"diez",ZH:"shi"},
    }
  }
};

// Color lab (from PDF: red/green/blue in EN/ES/FR)
const COLORS = [
  {key:"red",   EN:"red",   ES:"rojo",  FR:"rouge"},
  {key:"green", EN:"green", ES:"verde", FR:"vert"},
  {key:"blue",  EN:"blue",  ES:"azul",  FR:"bleu"},
];

// Alphabet lab (simple demo mapping)
const ALPHA = {
  A:{EN:"A (ay)", ES:"a (ah)", FR:"a (ah)"},
  B:{EN:"B (bee)", ES:"be (beh)", FR:"bé (beh)"},
  C:{EN:"C (see)", ES:"ce (seh)", FR:"cé (seh)"},
  D:{EN:"D (dee)", ES:"de (deh)", FR:"dé (deh)"},
  E:{EN:"E (ee)", ES:"e (eh)", FR:"e (uh/eh)"},
  F:{EN:"F (ef)", ES:"efe (eh-feh)", FR:"eff (ef)"},
  G:{EN:"G (gee)", ES:"ge (heh)", FR:"gé (zhay)"},
  H:{EN:"H (aitch)", ES:"hache (ah-cheh)", FR:"ache (ahsh)"},
};

/* ---------------------------
   Local storage state
---------------------------- */
const LS_KEY = "lingocount_demo_v1";
const state = loadState();

function loadState(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    if(!raw) return { mastered: {}, streak: 0, lastCorrectDay: null, theme: null, annual: false };
    return JSON.parse(raw);
  }catch(e){
    return { mastered: {}, streak: 0, lastCorrectDay: null, theme: null, annual: false };
  }
}
function saveState(){
  localStorage.setItem(LS_KEY, JSON.stringify(state));
  updateStats();
}

/* ---------------------------
   UI wiring
---------------------------- */
$("#year").textContent = new Date().getFullYear();

// Theme
const prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
const initialTheme = state.theme || (prefersLight ? "light" : "dark");
setTheme(initialTheme);

$("#themeToggle").addEventListener("click", () => {
  const next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
  setTheme(next);
});
function setTheme(mode){
  document.documentElement.setAttribute("data-theme", mode === "light" ? "light" : "dark");
  state.theme = mode;
  saveState();
  $("#themeToggle").textContent = mode === "light" ? "🌞" : "🌙";
}

// Modals / CTAs
const loginModal = $("#loginModal");
$("#openLogin").addEventListener("click", () => loginModal.showModal());
$("#openApp").addEventListener("click", () => scrollToId("demo"));
$("#ctaStart").addEventListener("click", () => {
  scrollToId("demo");
  burstConfetti();
  toast("Demo unlocked ✨ Try Quiz Mode in Counting Lab!");
});
$("#ctaOpenApp2").addEventListener("click", () => scrollToId("demo"));

$("#ctaTour").addEventListener("click", () => {
  toast("Tour tip: Switch sets + click 🔊 to hear pronunciations.");
});

// Tabs
$$(".appNav__btn[data-tab]").forEach(btn => {
  btn.addEventListener("click", () => {
    $$(".appNav__btn").forEach(b => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    const tab = btn.dataset.tab;
    $$(".tab").forEach(t => t.classList.remove("is-active"));
    $(`#tab-${tab}`).classList.add("is-active");
  });
});

// Reset
$("#resetProgress").addEventListener("click", () => {
  state.mastered = {};
  state.streak = 0;
  state.lastCorrectDay = null;
  saveState();
  renderCards();
  toast("Progress reset.");
});

/* ---------------------------
   Hero mini translate
---------------------------- */
$("#miniGo").addEventListener("click", runMiniTranslate);
$("#miniNumber").addEventListener("keydown", (e) => { if(e.key==="Enter") runMiniTranslate(); });

function runMiniTranslate(){
  const setKey = $("#miniSet").value;
  const n = parseInt($("#miniNumber").value, 10);
  const res = $("#miniResults");
  res.innerHTML = "";
  if(!n || n<1 || n>10){
    res.innerHTML = `<div class="mini__empty">Please enter a number from 1–10.</div>`;
    return;
  }
  const set = COUNT[setKey];
  const item = set.items[n];
  set.langs.forEach(code => {
    const row = document.createElement("div");
    row.className = "miniRow";
    row.style.display = "flex";
    row.style.justifyContent = "space-between";
    row.style.gap = "12px";
    row.style.padding = "6px 2px";
    row.innerHTML = `<strong>${code}</strong><span>${escapeHtml(item[code])}</span>`;
    res.appendChild(row);
  });
  const speakBtn = document.createElement("button");
  speakBtn.className = "btn btn--soft";
  speakBtn.type = "button";
  speakBtn.style.marginTop = "8px";
  speakBtn.textContent = "🔊 Speak";
  speakBtn.addEventListener("click", () => {
    speak(Object.values(item).join(", "));
  });
  res.appendChild(speakBtn);
}

/* ---------------------------
   Counting Lab
---------------------------- */
const cardsEl = $("#cards");
const setSelect = $("#setSelect");
const modeSelect = $("#modeSelect");

setSelect.addEventListener("change", () => renderCards());
modeSelect.addEventListener("change", () => toggleMode());

function cardId(setKey, n){ return `${setKey}:${n}`; }

function isMastered(setKey, n){
  return Boolean(state.mastered[cardId(setKey, n)]);
}
function setMastered(setKey, n, val){
  const id = cardId(setKey, n);
  if(val) state.mastered[id] = true;
  else delete state.mastered[id];
  saveState();
}

function renderCards(){
  const setKey = setSelect.value;
  const set = COUNT[setKey];

  cardsEl.innerHTML = "";
  for(let n=1; n<=10; n++){
    const item = set.items[n];
    const el = document.createElement("article");
    el.className = "cardItem";

    const mastered = isMastered(setKey, n);
    if(mastered){
      const badge = document.createElement("div");
      badge.className = "mastered";
      badge.textContent = "✓ mastered";
      el.appendChild(badge);
    }

    el.innerHTML += `
      <div class="cardItem__num">${n}</div>
      <div class="cardItem__meta">${escapeHtml(set.label)}</div>
      <div class="cardItem__row">
        ${set.langs.map(code => `<span class="pillTag"><b>${code}</b> ${escapeHtml(item[code])}</span>`).join("")}
      </div>
      <div class="cardItem__actions">
        <button class="smallBtn" data-speak="${n}">🔊 Speak</button>
        <button class="smallBtn" data-master="${n}">${mastered ? "Unmark" : "Mark mastered"}</button>
      </div>
    `;

    // events
    el.querySelector(`[data-speak="${n}"]`).addEventListener("click", () => {
      speak(set.langs.map(c => item[c]).join(", "));
    });
    el.querySelector(`[data-master="${n}"]`).addEventListener("click", () => {
      setMastered(setKey, n, !isMastered(setKey, n));
      renderCards();
      toast(isMastered(setKey, n) ? "Card marked mastered ✅" : "Card unmarked.");
      burstConfetti(22);
    });

    cardsEl.appendChild(el);
  }

  toggleMode(); // ensure mode UI matches
}

function toggleMode(){
  const mode = modeSelect.value;
  const quizBar = $("#quizBar");
  if(mode === "quiz"){
    quizBar.hidden = false;
    startQuiz();
  }else{
    quizBar.hidden = true;
  }
}

let quiz = { setKey: "EN_FR_AR", n: 1, askLang: "EN", answerLang: "FR" };

function startQuiz(){
  quiz.setKey = setSelect.value;
  nextQuizQuestion();
  $("#quizCheck").onclick = checkQuiz;
  $("#quizSkip").onclick = () => { toast("Skipped."); nextQuizQuestion(); };
  $("#quizAnswer").onkeydown = (e) => { if(e.key==="Enter") checkQuiz(); };
}

function nextQuizQuestion(){
  const set = COUNT[quiz.setKey];
  quiz.n = randInt(1,10);
  const langs = [...set.langs];
  quiz.askLang = langs[randInt(0, langs.length-1)];
  do {
    quiz.answerLang = langs[randInt(0, langs.length-1)];
  } while(quiz.answerLang === quiz.askLang);

  const item = set.items[quiz.n];
  $("#quizQ").textContent = `Translate “${item[quiz.askLang]}” (${quiz.askLang}) to ${quiz.answerLang}.`;
  $("#quizAnswer").value = "";
  $("#quizMsg").textContent = "";
  $("#quizMsg").className = "quizMsg";
}

function checkQuiz(){
  const set = COUNT[quiz.setKey];
  const item = set.items[quiz.n];
  const expected = (item[quiz.answerLang] || "").trim().toLowerCase();
  const got = ($("#quizAnswer").value || "").trim().toLowerCase();

  const msg = $("#quizMsg");
  if(!got){
    msg.textContent = "Type an answer first.";
    msg.className = "quizMsg bad";
    return;
  }

  if(got === expected){
    msg.textContent = `Correct ✅ (${item[quiz.answerLang]})`;
    msg.className = "quizMsg ok";
    bumpStreak();
    burstConfetti(28);
    setTimeout(nextQuizQuestion, 600);
  }else{
    msg.textContent = `Not quite. Correct answer: ${item[quiz.answerLang]}`;
    msg.className = "quizMsg bad";
    // small penalty: reset streak
    state.streak = 0;
    state.lastCorrectDay = null;
    saveState();
  }
}

function bumpStreak(){
  const today = new Date();
  const dayKey = today.toISOString().slice(0,10);
  if(state.lastCorrectDay === dayKey){
    // already counted today
    return;
  }
  state.lastCorrectDay = dayKey;
  state.streak = (state.streak || 0) + 1;
  saveState();
}

/* ---------------------------
   Color Lab
---------------------------- */
$("#colorNext").addEventListener("click", () => nextColor());
$("#colorLang").addEventListener("change", () => nextColor());

let colorIndex = 0;

function nextColor(){
  colorIndex = randInt(0, COLORS.length-1);
  const c = COLORS[colorIndex];
  $("#colorWord").textContent = c.EN; // prompt in English
  $("#colorMsg").textContent = "";
  $("#colorMsg").className = "quizMsg";

  const lang = $("#colorLang").value;
  const correct = c[lang];

  // choices: correct + 2 random
  const pool = COLORS.map(x => x[lang]);
  const picks = new Set([correct]);
  while(picks.size < 3){
    picks.add(pool[randInt(0, pool.length-1)]);
  }
  const choices = shuffle(Array.from(picks));

  const box = $("#colorChoices");
  box.innerHTML = "";
  choices.forEach(word => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "choice";
    b.textContent = word;
    b.addEventListener("click", () => {
      if(word === correct){
        $("#colorMsg").textContent = "Correct ✅";
        $("#colorMsg").className = "quizMsg ok";
        burstConfetti(18);
        bumpStreak();
        setTimeout(nextColor, 550);
      }else{
        $("#colorMsg").textContent = `Nope — correct is “${correct}”.`;
        $("#colorMsg").className = "quizMsg bad";
        state.streak = 0;
        state.lastCorrectDay = null;
        saveState();
      }
      speak(word);
    });
    box.appendChild(b);
  });
}

/* ---------------------------
   Alphabet Lab
---------------------------- */
const alphaSelect = $("#alphaLetter");
Object.keys(ALPHA).forEach(letter => {
  const opt = document.createElement("option");
  opt.value = letter;
  opt.textContent = letter;
  alphaSelect.appendChild(opt);
});

alphaSelect.addEventListener("change", renderAlpha);
$("#alphaSpeak").addEventListener("click", () => {
  const letter = alphaSelect.value;
  const data = ALPHA[letter];
  speak(`${letter}. English: ${data.EN}. Spanish: ${data.ES}. French: ${data.FR}`);
});

function renderAlpha(){
  const letter = alphaSelect.value;
  $("#alphaBig").textContent = letter;
  const data = ALPHA[letter];
  const cols = $("#alphaCols");
  cols.innerHTML = "";
  ["EN","ES","FR"].forEach(code => {
    const col = document.createElement("div");
    col.className = "alphaCol";
    col.innerHTML = `<b>${code}</b><div class="muted">${escapeHtml(data[code])}</div>`;
    col.addEventListener("click", () => speak(`${letter}. ${data[code]}`));
    cols.appendChild(col);
  });
}

/* ---------------------------
   Pricing toggle
---------------------------- */
const pricingMap = {
  starter: { monthly: 9, annual: 9 * 12 * 0.8 },
  pro:     { monthly: 19, annual: 19 * 12 * 0.8 },
  studio:  { monthly: 39, annual: 39 * 12 * 0.8 },
};

$("#billingToggle").addEventListener("click", () => {
  state.annual = !state.annual;
  saveState();
  renderPricing();
});
$$("[data-buy]").forEach(btn => {
  btn.addEventListener("click", () => {
    const plan = btn.dataset.buy;
    toast(`Checkout: ${plan.toUpperCase()} (demo). Replace with your Stripe link later.`);
    burstConfetti(20);
  });
});

function renderPricing(){
  $("#toggleKnob").style.left = state.annual ? "29px" : "3px";
  $$("[data-price]").forEach(span => {
    const key = span.dataset.price;
    const val = state.annual ? pricingMap[key].annual : pricingMap[key].monthly;
    span.textContent = Math.round(val);
  });
  // Update "/mo" text visuals
  $$(".price__per").forEach(p => p.textContent = state.annual ? "/yr" : "/mo");
}

/* ---------------------------
   Stats + init
---------------------------- */
function masteredCount(){
  return Object.keys(state.mastered || {}).length;
}
function updateStats(){
  $("#streakChip").textContent = state.streak || 0;
  $("#masteredChip").textContent = masteredCount();
  $("#statStreak").textContent = state.streak || 0;
  $("#statMastered").textContent = masteredCount();
}

function init(){
  renderCards();
  renderPricing();
  renderAlpha();
  nextColor();
  updateStats();
  initConfetti();
}
init();

/* ---------------------------
   Helpers
---------------------------- */
function scrollToId(id){
  const el = document.getElementById(id);
  if(!el) return;
  el.scrollIntoView({behavior:"smooth", block:"start"});
}

function toast(text){
  const el = $("#toast");
  el.textContent = text;
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("show"), 2800);
}

function speak(text){
  try{
    if(!("speechSynthesis" in window)) return toast("Speech not supported in this browser.");
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1;
    u.pitch = 1.05;
    window.speechSynthesis.speak(u);
  }catch(e){
    toast("Could not speak (browser restriction).");
  }
}

function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }

function shuffle(arr){
  for(let i=arr.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]] = [arr[j],arr[i]];
  }
  return arr;
}

function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

/* ---------------------------
   Confetti (tiny canvas)
---------------------------- */
let confetti = { ctx:null, w:0, h:0, parts:[], raf:0 };

function initConfetti(){
  const canvas = $("#confetti");
  const ctx = canvas.getContext("2d");
  confetti.ctx = ctx;

  const resize = () => {
    confetti.w = canvas.width = window.innerWidth * devicePixelRatio;
    confetti.h = canvas.height = window.innerHeight * devicePixelRatio;
  };
  window.addEventListener("resize", resize);
  resize();
  loop();
}

function burstConfetti(count=26){
  for(let i=0;i<count;i++){
    confetti.parts.push({
      x: (window.innerWidth/2 + randInt(-220,220)) * devicePixelRatio,
      y: (window.innerHeight/2 - 120 + randInt(-120,120)) * devicePixelRatio,
      vx: randInt(-18,18),
      vy: randInt(-22,-10),
      g: 0.85 + Math.random()*0.45,
      r: 4 + Math.random()*5,
      a: 1,
      rot: Math.random()*Math.PI,
      vr: (Math.random()-.5)*0.22
    });
  }
}

function loop(){
  const ctx = confetti.ctx;
  if(!ctx){ confetti.raf = requestAnimationFrame(loop); return; }

  ctx.clearRect(0,0,confetti.w,confetti.h);
  const next = [];
  for(const p of confetti.parts){
    p.vy += p.g;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;
    p.a *= 0.985;

    // draw
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.a);
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = pickColor(p.x);
    ctx.fillRect(-p.r, -p.r, p.r*2, p.r*2);
    ctx.restore();

    if(p.a > 0.05 && p.y < confetti.h + 80) next.push(p);
  }
  confetti.parts = next;
  confetti.raf = requestAnimationFrame(loop);
}

function pickColor(seed){
  const colors = [
    "rgba(110,231,255,.95)",
    "rgba(167,139,250,.95)",
    "rgba(52,211,153,.95)",
    "rgba(255,180,214,.95)",
    "rgba(255,213,106,.95)"
  ];
  const idx = Math.abs(Math.floor(seed)) % colors.length;
  return colors[idx];
}
