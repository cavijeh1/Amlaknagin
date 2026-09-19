/* املاک نگین Pro */

const ADMIN_U = "cavijeh";
const ADMIN_P = "Alira7770";
const MAX_IMGS = 6;
const MAX_IMG_SIZE = 700 * 1024; // ~700KB after compress target

const ST = { PENDING: "PENDING", APPROVED: "APPROVED", REJECTED: "REJECTED", SOLD: "SOLD" };
const ST_FA = { PENDING: "در انتظار", APPROVED: "تایید شده", REJECTED: "رد شده", SOLD: "فروخته شده" };

let properties = [];
let isAdmin = false;
let lastPage = "home";
let selectedId = null;
let deleteId = null;
let addImages = [];      // base64 array for new listing
let editImages = [];     // base64 array while editing
let lbImages = [];
let lbIndex = 0;
let savedIds = JSON.parse(localStorage.getItem("negin_saved") || "[]");
let adminFilter = "all";

/* ---------- Sample with placeholder images (gradient) ---------- */
const SAMPLE = [
  {
    id: "s1",
    title: "خانه ۱۲۵ متری نوساز شهرک اندیشه",
    price: "۲,۸۰۰,۰۰۰,۰۰۰ تومان",
    location: "مبارکه، شهرک اندیشه",
    area: "۱۲۵ متر",
    rooms: "۳",
    bathrooms: "۲",
    parking: "۱",
    floor: "۱",
    year: "۱۴۰۲",
    type: "خرید",
    category: "خانه",
    description: "خانه نوساز با متریال عالی، سند تک‌برگ، تراس بزرگ، آشپزخانه اوپن و کابینت هایگلاس. موقعیت آرام و مناسب خانواده.",
    status: ST.APPROVED,
    isFeatured: true,
    ownerName: "آقای رضایی",
    ownerPhone: "09131234567",
    images: [],
    video: "",
    createdAt: Date.now() - 86400000 * 4
  },
  {
    id: "s2",
    title: "ویلا ۳۰۰ متری باغ بهاران",
    price: "۴,۵۰۰,۰۰۰,۰۰۰ تومان",
    location: "مبارکه، باغ بهاران",
    area: "۳۰۰ متر",
    rooms: "۴",
    bathrooms: "۳",
    parking: "۲",
    floor: "دوبلکس",
    year: "۱۴۰۰",
    type: "خرید",
    category: "ویلا",
    description: "ویلای دوبلکس با حیاط وسیع، استخر، باربیکیو و فضای سبز کامل. مناسب سرمایه‌گذاری و سکونت دائم.",
    status: ST.APPROVED,
    isFeatured: true,
    ownerName: "خانم محمدی",
    ownerPhone: "09137654321",
    images: [],
    video: "",
    createdAt: Date.now() - 86400000 * 2
  },
  {
    id: "s3",
    title: "آپارتمان ۸۵ متری دو خواب",
    price: "۱,۶۵۰,۰۰۰,۰۰۰ تومان",
    location: "مبارکه، خیابان امام",
    area: "۸۵ متر",
    rooms: "۲",
    bathrooms: "۱",
    parking: "۱",
    floor: "۳",
    year: "۱۳۹۸",
    type: "خرید",
    category: "آپارتمان",
    description: "آپارتمان تمیز و بازسازی‌شده، آسانسور، انباری و پارکینگ اختصاصی.",
    status: ST.APPROVED,
    isFeatured: false,
    ownerName: "مالک",
    ownerPhone: "09130001122",
    images: [],
    video: "",
    createdAt: Date.now() - 86400000
  },
  {
    id: "s4",
    title: "مغازه ۴۰ متری نبش میدان",
    price: "۱۲ میلیون تومان ماهیانه",
    location: "مبارکه، میدان امام",
    area: "۴۰ متر",
    rooms: "—",
    bathrooms: "۱",
    parking: "۰",
    floor: "همکف",
    year: "—",
    type: "اجاره",
    category: "مغازه",
    description: "مغازه موقعیت عالی نبش میدان، مناسب کسب‌وکارهای خرد و پرتردد.",
    status: ST.APPROVED,
    isFeatured: false,
    ownerName: "مالک",
    ownerPhone: "09135556677",
    images: [],
    video: "",
    createdAt: Date.now() - 3600000 * 8
  }
];

/* ---------- Storage ---------- */
function load() {
  try {
    const raw = localStorage.getItem("negin_props_v2");
    if (raw) {
      properties = JSON.parse(raw);
    } else {
      properties = JSON.parse(JSON.stringify(SAMPLE));
      save();
    }
  } catch {
    properties = JSON.parse(JSON.stringify(SAMPLE));
  }
  if (localStorage.getItem("negin_admin") === "1") isAdmin = true;
}

function save() {
  try {
    localStorage.setItem("negin_props_v2", JSON.stringify(properties));
  } catch (e) {
    toast("حافظه مرورگر پر است. عکس‌های کم‌حجم‌تری انتخاب کنید.");
  }
}

function saveSaved() {
  localStorage.setItem("negin_saved", JSON.stringify(savedIds));
}

/* ---------- Utils ---------- */
function uid() {
  return "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.add("hidden"), 2800);
}

function esc(s) {
  if (!s) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function faNum(v) {
  return String(v).replace(/\\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]);
}
function numVal(v) {
  if (v == null) return 0;
  const s = String(v).replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[^0-9.]/g, "");
  return parseFloat(s) || 0;
}
function areaVal(v) { return numVal(v); }
function normalizePhone(v) {
  return String(v || "").replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[^0-9+]/g, "");
}
function shareProperty(id) {
  const p = properties.find(x => x.id === id);
  if (!p) return;
  const url = location.href.split("#")[0] + "#property=" + encodeURIComponent(id);
  const text = `${p.title} | ${p.price} | ${p.location}`;
  if (navigator.share) navigator.share({title:p.title,text,url}).catch(()=>{});
  else navigator.clipboard?.writeText(url).then(()=>toast("لینک آگهی کپی شد")).catch(()=>toast("لینک: "+url));
}

function approved() {
  return properties.filter(p => p.status === ST.APPROVED).sort((a, b) => b.createdAt - a.createdAt);
}

function pendingCount() {
  return properties.filter(p => p.status === ST.PENDING).length;
}

/* ---------- Image compress & handle ---------- */
function compressImage(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("فقط تصویر"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxW = 1200;
        let w = img.width, h = img.height;
        if (w > maxW) {
          h = Math.round(h * maxW / w);
          w = maxW;
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        let quality = 0.72;
        let data = canvas.toDataURL("image/jpeg", quality);
        // shrink if still large
        while (data.length > MAX_IMG_SIZE && quality > 0.35) {
          quality -= 0.1;
          data = canvas.toDataURL("image/jpeg", quality);
        }
        resolve(data);
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function handleImages(e) {
  const files = Array.from(e.target.files || []);
  e.target.value = "";
  if (!files.length) return;
  const remain = MAX_IMGS - addImages.length;
  if (remain <= 0) {
    toast("حداکثر ۶ عکس مجاز است");
    return;
  }
  const toProcess = files.slice(0, remain);
  toast("در حال فشرده‌سازی عکس‌ها...");
  for (const f of toProcess) {
    try {
      const data = await compressImage(f);
      addImages.push(data);
    } catch {
      toast("خطا در بارگذاری یکی از عکس‌ها");
    }
  }
  renderAddPreviews();
}

function renderAddPreviews() {
  const box = document.getElementById("preview-imgs");
  box.innerHTML = addImages.map((src, i) => `
    <div class="preview-item">
      <img src="${src}" alt="" />
      <button type="button" class="rm" onclick="removeAddImg(${i})">×</button>
    </div>
  `).join("");
}

function removeAddImg(i) {
  addImages.splice(i, 1);
  renderAddPreviews();
}

async function handleEditImages(e) {
  const files = Array.from(e.target.files || []);
  e.target.value = "";
  if (!files.length) return;
  const remain = MAX_IMGS - editImages.length;
  if (remain <= 0) {
    toast("حداکثر ۶ عکس");
    return;
  }
  for (const f of files.slice(0, remain)) {
    try {
      editImages.push(await compressImage(f));
    } catch {}
  }
  renderEditPreviews();
}

function renderEditPreviews() {
  const box = document.getElementById("e-preview");
  box.innerHTML = editImages.map((src, i) => `
    <div class="preview-item">
      <img src="${src}" alt="" />
      <button type="button" class="rm" onclick="removeEditImg(${i})">×</button>
    </div>
  `).join("");
}

function removeEditImg(i) {
  editImages.splice(i, 1);
  renderEditPreviews();
}

/* ---------- Navigation ---------- */
function go(page) {
  if (page === "admin" && !isAdmin) {
    go("account");
    return;
  }
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  const el = document.getElementById("page-" + page);
  if (el) el.classList.add("active");

  document.querySelectorAll(".nav-link, .bn").forEach(a => {
    a.classList.toggle("active", a.dataset.page === page);
  });

  if (["home", "search", "saved", "account", "about"].includes(page)) lastPage = page;

  if (page === "home") renderHome();
  if (page === "search") doSearch();
  if (page === "saved") renderSaved();
  if (page === "account") renderAccount();
  if (page === "admin") renderAdmin();
  if (page === "detail") renderDetail();
  if (page === "add") {
    addImages = [];
    renderAddPreviews();
  }
  window.scrollTo(0, 0);
}

/* ---------- Cards ---------- */
function cardHTML(p) {
  const fav = savedIds.includes(p.id);
  const img = (p.images && p.images[0])
    ? `<img src="${p.images[0]}" alt="" loading="lazy" />`
    : `<div class="placeholder">🏡</div>`;
  let badge = p.type === "اجاره" ? `<span class="card-badge rent">اجاره</span>` : `<span class="card-badge">خرید</span>`;
  if (p.status === ST.SOLD) badge = `<span class="card-badge sold">فروخته شد</span>`;

  return `
    <article class="card" onclick="openDetail('${p.id}')">
      <div class="card-img">
        ${img}
        ${badge}
        <button class="card-fav" onclick="event.stopPropagation();toggleFav('${p.id}')" aria-label="مورد علاقه">${fav ? "❤️" : "🤍"}</button>
      </div>
      <div class="card-body">
        <div class="card-title">${esc(p.title)}</div>
        <div class="card-loc">📍 ${esc(p.location)}</div>
        <div class="card-price">${esc(p.price)}</div>
        <div class="card-meta">
          ${p.area ? `<span>📏 ${esc(p.area)}</span>` : ""}
          ${p.rooms && p.rooms !== "—" ? `<span>🛏️ ${esc(p.rooms)} خواب</span>` : ""}
          ${p.parking ? `<span>🅿️ ${esc(p.parking)}</span>` : ""}
        </div>
      </div>
    </article>
  `;
}

/* ---------- Home ---------- */
function renderHome() {
  const list = approved();
  document.getElementById("stat-count").textContent = faNum(list.length);
  const sale = list.filter(p => p.type === "خرید").length;
  const rent = list.filter(p => p.type === "اجاره").length;
  const featuredCount = list.filter(p => p.isFeatured).length;
  const setTxt = (id, v) => { const el = document.getElementById(id); if(el) el.textContent = faNum(v); };
  setTxt("qs-sale", sale); setTxt("qs-rent", rent); setTxt("qs-featured", featuredCount);
  const featured = list.filter(p => p.isFeatured);
  const show = featured.length ? featured : list.slice(0, 6);
  const grid = document.getElementById("featured-grid");
  const loading = document.getElementById("home-loading");
  loading.classList.add("hidden");
  if (!show.length) {
    grid.innerHTML = `<div class="empty"><p>هنوز آگهی تایید‌شده‌ای وجود ندارد</p></div>`;
    return;
  }
  grid.innerHTML = show.map(cardHTML).join("");
}

/* ---------- Search ---------- */
function quickCat(cat) {
  document.getElementById("q").value = "";
  document.getElementById("f-type").value = cat === "اجاره" ? "اجاره" : "";
  document.getElementById("f-cat").value = cat === "اجاره" ? "" : cat;
  document.getElementById("f-rooms").value = "";
  go("search");
}

function doSearch() {
  const q = (document.getElementById("q").value || "").trim();
  const type = document.getElementById("f-type").value;
  const cat = document.getElementById("f-cat").value;
  const rooms = document.getElementById("f-rooms").value;
  const minArea = numVal(document.getElementById("f-minarea")?.value);
  const maxArea = numVal(document.getElementById("f-maxarea")?.value);
  const sort = document.getElementById("f-sort")?.value || "new";
  let list = approved();
  if (type) list = list.filter(p => p.type === type);
  if (cat) list = list.filter(p => p.category === cat);
  if (rooms) list = rooms === "4" ? list.filter(p => numVal(p.rooms) >= 4) : list.filter(p => numVal(p.rooms) === numVal(rooms));
  if (minArea) list = list.filter(p => areaVal(p.area) >= minArea);
  if (maxArea) list = list.filter(p => areaVal(p.area) <= maxArea);
  if (q) {
    const ql = q.toLowerCase();
    list = list.filter(p => [p.title,p.location,p.description,p.category,p.type].some(v => String(v||"").toLowerCase().includes(ql)));
  }
  if (sort === "area") list.sort((a,b) => areaVal(b.area)-areaVal(a.area));
  else if (sort === "rooms") list.sort((a,b) => numVal(b.rooms)-numVal(a.rooms));
  else list.sort((a,b) => b.createdAt-a.createdAt);
  document.getElementById("search-meta").textContent = `${faNum(list.length)} نتیجه`;
  document.getElementById("search-grid").innerHTML =
    list.length ? list.map(cardHTML).join("") : `<div class="empty"><div class="empty-icon">🔎</div><p>با این فیلترها ملکی پیدا نشد.</p><button class="btn-outline" onclick="resetSearch()">پاک کردن فیلترها</button></div>`;
}
function resetSearch() {
  ["q","f-minarea","f-maxarea"].forEach(id => { const el=document.getElementById(id); if(el) el.value=""; });
  ["f-type","f-cat","f-rooms"].forEach(id => { const el=document.getElementById(id); if(el) el.value=""; });
  const sort=document.getElementById("f-sort"); if(sort) sort.value="new";
  doSearch();
}

/* ---------- Detail ---------- */
function openDetail(id) {
  selectedId = id;
  go("detail");
}

function renderDetail() {
  const p = properties.find(x => x.id === selectedId);
  if (!p) {
    document.getElementById("detail-root").innerHTML = "<p>آگهی یافت نشد</p>";
    return;
  }
  const imgs = p.images && p.images.length ? p.images : [];
  const fav = savedIds.includes(p.id);

  let gallery = "";
  if (imgs.length) {
    gallery = `
      <div class="detail-gallery">
        <img class="detail-main-img" id="main-img" src="${imgs[0]}" alt="" onclick="openLightbox(0)" />
        ${imgs.length > 1 ? `
          <div class="detail-thumbs">
            ${imgs.map((src, i) => `<img src="${src}" class="${i === 0 ? "active" : ""}" onclick="setMainImg(${i})" alt="" />`).join("")}
          </div>
        ` : ""}
        ${p.video ? videoEmbed(p.video) : ""}
      </div>
    `;
  } else {
    gallery = `
      <div class="detail-gallery">
        <div class="detail-main-ph">🏡</div>
        ${p.video ? videoEmbed(p.video) : ""}
      </div>
    `;
  }

  // store for lightbox
  window._detailImgs = imgs;

  let contact = "";
  if (isAdmin) {
    contact = `
      <div class="contact-box admin-view">
        <h3>اطلاعات تماس (فقط مدیر)</h3>
        <p>نام: <strong>${esc(p.ownerName || "—")}</strong></p>
        <p>موبایل: <strong>${esc(p.ownerPhone || "ثبت نشده")}</strong></p>
        ${p.ownerPhone ? `<a href="tel:${esc(p.ownerPhone)}" class="btn-main btn-block" style="margin-top:14px;display:block;text-align:center">📞 تماس</a>` : ""}
      </div>
    `;
  } else {
    const ph = normalizePhone(p.ownerPhone);
    contact = `
      <div class="contact-box">
        <div style="font-size:2.2rem;margin-bottom:10px">🏪</div>
        <h3>املاک نگین</h3>
        <p>برای اطلاعات بیشتر و هماهنگی بازدید، با دفتر املاک نگین تماس بگیرید.</p>
        <div class="contact-actions">
          ${ph ? `<a class="btn-main" href="tel:${ph}">📞 تماس با مالک</a><a class="btn-outline" target="_blank" rel="noopener" href="https://wa.me/${ph.replace(/^0/,'98')}">💬 واتساپ</a>` : ""}
          <button class="btn-outline" onclick="shareProperty('${p.id}')">↗️ اشتراک</button>
        </div>
      </div>
    `;
  }

  document.getElementById("detail-root").innerHTML = `
    ${gallery}
    <div class="detail-head">
      <h1>${esc(p.title)}</h1>
      <div class="detail-loc">📍 ${esc(p.location)}</div>
      <div class="detail-price">${esc(p.price)}</div>
      <div class="detail-tags">
        <span class="tag">${esc(p.type)}</span>
        <span class="tag">${esc(p.category)}</span>
        ${p.status === ST.SOLD ? `<span class="tag" style="background:#FEF9C3;color:#A16207">فروخته شده</span>` : ""}
      </div>
      <button class="fav-detail" onclick="toggleFav('${p.id}');renderDetail()">
        ${fav ? "❤️ حذف از موردعلاقه" : "🤍 افزودن به موردعلاقه"}
      </button>
      <button class="share-detail" onclick="shareProperty('${p.id}')">↗️ اشتراک‌گذاری آگهی</button>
    </div>
    <div class="detail-specs">
      <div class="spec"><div class="ic">📏</div><div class="val">${esc(p.area || "—")}</div><div class="lbl">متراژ</div></div>
      <div class="spec"><div class="ic">🛏️</div><div class="val">${esc(p.rooms || "—")}</div><div class="lbl">خواب</div></div>
      <div class="spec"><div class="ic">🚿</div><div class="val">${esc(p.bathrooms || "—")}</div><div class="lbl">سرویس</div></div>
      <div class="spec"><div class="ic">🅿️</div><div class="val">${esc(p.parking || "—")}</div><div class="lbl">پارکینگ</div></div>
      <div class="spec"><div class="ic">🏢</div><div class="val">${esc(p.floor || "—")}</div><div class="lbl">طبقه</div></div>
      <div class="spec"><div class="ic">📅</div><div class="val">${esc(p.year || "—")}</div><div class="lbl">سال ساخت</div></div>
    </div>
    <div class="detail-desc">
      <h3>توضیحات</h3>
      <p>${esc(p.description || "توضیحی ثبت نشده.")}</p>
    </div>
    ${contact}
  `;
}

function setMainImg(i) {
  const imgs = window._detailImgs || [];
  if (!imgs[i]) return;
  document.getElementById("main-img").src = imgs[i];
  document.querySelectorAll(".detail-thumbs img").forEach((el, idx) => {
    el.classList.toggle("active", idx === i);
  });
}

function videoEmbed(url) {
  if (!url) return "";
  let embed = "";
  // YouTube
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (yt) embed = `https://www.youtube.com/embed/${yt[1]}`;
  // Aparat
  const ap = url.match(/aparat\.com\/v\/([\w-]+)/);
  if (ap) embed = `https://www.aparat.com/video/video/embed/videohash/${ap[1]}/vt/frame`;
  if (!embed) {
    return `<div class="detail-video" style="padding:12px"><a href="${esc(url)}" target="_blank" rel="noopener">▶ مشاهده ویدیو</a></div>`;
  }
  return `<div class="detail-video"><iframe src="${embed}" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe></div>`;
}

/* ---------- Lightbox ---------- */
function openLightbox(i) {
  lbImages = window._detailImgs || [];
  if (!lbImages.length) return;
  lbIndex = i;
  document.getElementById("lb-img").src = lbImages[lbIndex];
  document.getElementById("lightbox").classList.remove("hidden");
}

function closeLightbox() {
  document.getElementById("lightbox").classList.add("hidden");
}

function lbNav(dir) {
  if (!lbImages.length) return;
  lbIndex = (lbIndex + dir + lbImages.length) % lbImages.length;
  document.getElementById("lb-img").src = lbImages[lbIndex];
}

/* ---------- Fav ---------- */
function toggleFav(id) {
  const i = savedIds.indexOf(id);
  if (i >= 0) {
    savedIds.splice(i, 1);
    toast("از موردعلاقه‌ها حذف شد");
  } else {
    savedIds.push(id);
    toast("به موردعلاقه‌ها اضافه شد");
  }
  saveSaved();
  const active = document.querySelector(".page.active");
  if (active) {
    const name = active.id.replace("page-", "");
    if (name === "home") renderHome();
    if (name === "search") doSearch();
    if (name === "saved") renderSaved();
  }
}

function renderSaved() {
  const list = properties.filter(p => savedIds.includes(p.id) && p.status === ST.APPROVED);
  const empty = document.getElementById("saved-empty");
  const grid = document.getElementById("saved-grid");
  if (!list.length) {
    grid.innerHTML = "";
    empty.classList.remove("hidden");
  } else {
    empty.classList.add("hidden");
    grid.innerHTML = list.map(cardHTML).join("");
  }
}

/* ---------- Add ---------- */
function submitAdd(e) {
  e.preventDefault();
  const title = document.getElementById("a-title").value.trim();
  const price = document.getElementById("a-price").value.trim();
  const location = document.getElementById("a-location").value.trim();
  if (!title || !price || !location) {
    toast("عنوان، قیمت و موقعیت الزامی است");
    return;
  }
  const prop = {
    id: uid(),
    title,
    price,
    location,
    area: document.getElementById("a-area").value.trim() || "—",
    rooms: document.getElementById("a-rooms").value.trim() || "—",
    bathrooms: document.getElementById("a-bath").value.trim() || "—",
    parking: document.getElementById("a-park").value.trim() || "—",
    floor: document.getElementById("a-floor").value.trim() || "—",
    year: document.getElementById("a-year").value.trim() || "—",
    type: document.getElementById("a-type").value,
    category: document.getElementById("a-cat").value,
    description: document.getElementById("a-desc").value.trim() || "",
    status: ST.PENDING,
    isFeatured: false,
    ownerName: document.getElementById("a-owner").value.trim() || "مالک",
    ownerPhone: document.getElementById("a-phone").value.trim(),
    images: [...addImages],
    video: document.getElementById("a-video").value.trim(),
    createdAt: Date.now()
  };
  properties.unshift(prop);
  save();
  document.getElementById("form-add").reset();
  addImages = [];
  renderAddPreviews();
  document.getElementById("modal-ok").classList.remove("hidden");
}

function closeOk() {
  document.getElementById("modal-ok").classList.add("hidden");
  const hash = location.hash.match(/property=([^&]+)/);
  if (hash) { selectedId = decodeURIComponent(hash[1]); go("detail"); }
  else go("home");
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") { closeLightbox(); closeLogin(); closeDel(); }
    if (e.key === "/" && !/input|textarea|select/i.test(document.activeElement?.tagName||"")) { e.preventDefault(); go("search"); setTimeout(()=>document.getElementById("q")?.focus(),50); }
  });
}

/* ---------- Account / Admin auth ---------- */
function renderAccount() {
  const name = document.getElementById("p-name");
  const role = document.getElementById("p-role");
  const adminBtns = document.getElementById("admin-btns");
  const userBtns = document.getElementById("user-btns");
  const badge = document.getElementById("pending-count");
  const header = document.getElementById("btnHeaderUser");

  if (isAdmin) {
    name.textContent = "مدیر سیستم";
    role.textContent = "دسترسی کامل";
    adminBtns.classList.remove("hidden");
    userBtns.classList.add("hidden");
    header.textContent = "مدیر";
    const c = pendingCount();
    if (c > 0) {
      badge.textContent = faNum(c);
      badge.classList.remove("hidden");
    } else badge.classList.add("hidden");
  } else {
    name.textContent = "کاربر املاک نگین";
    role.textContent = "کاربر عادی";
    adminBtns.classList.add("hidden");
    userBtns.classList.remove("hidden");
    header.textContent = "ورود مدیر";
  }
}

function openLogin() {
  document.getElementById("login-u").value = "";
  document.getElementById("login-p").value = "";
  document.getElementById("login-err").classList.add("hidden");
  document.getElementById("modal-login").classList.remove("hidden");
}

function closeLogin() {
  document.getElementById("modal-login").classList.add("hidden");
}

function doLogin() {
  const u = document.getElementById("login-u").value.trim();
  const p = document.getElementById("login-p").value;
  if (u === ADMIN_U && p === ADMIN_P) {
    isAdmin = true;
    localStorage.setItem("negin_admin", "1");
    closeLogin();
    toast("ورود موفقیت‌آمیز");
    renderAccount();
    go("admin");
  } else {
    const err = document.getElementById("login-err");
    err.textContent = "نام کاربری یا رمز اشتباه است";
    err.classList.remove("hidden");
  }
}

function logout() {
  isAdmin = false;
  localStorage.removeItem("negin_admin");
  toast("خارج شدید");
  renderAccount();
  go("account");
}

/* ---------- Admin ---------- */
function setAdminF(f) {
  adminFilter = f;
  document.querySelectorAll("#admin-tabs .tab").forEach(t => {
    t.classList.toggle("active", t.dataset.f === f);
  });
  renderAdmin();
}

function renderAdmin() {
  let list = [...properties].sort((a, b) => b.createdAt - a.createdAt);
  if (adminFilter !== "all") list = list.filter(p => p.status === adminFilter);
  document.getElementById("admin-meta").textContent = `${faNum(list.length)} آگهی`;
  const counts = { all: properties.length, pending: properties.filter(p=>p.status===ST.PENDING).length, approved: properties.filter(p=>p.status===ST.APPROVED).length, sold: properties.filter(p=>p.status===ST.SOLD).length };
  [["adm-all",counts.all],["adm-pending",counts.pending],["adm-approved",counts.approved],["adm-sold",counts.sold]].forEach(([id,v])=>{const el=document.getElementById(id);if(el)el.textContent=faNum(v);});
  const box = document.getElementById("admin-list");
  if (!list.length) {
    box.innerHTML = `<div class="empty"><p>آگهی‌ای در این بخش نیست</p></div>`;
    return;
  }
  box.innerHTML = list.map(p => {
    const thumb = (p.images && p.images[0])
      ? `<img src="${p.images[0]}" alt="" />`
      : `<div class="ph">🏡</div>`;
    const acts = [];
    acts.push(`<button class="btn-sm outline" onclick="openEdit('${p.id}')">✏️ ویرایش</button>`);
    if (p.status === ST.PENDING) {
      acts.push(`<button class="btn-sm primary" onclick="setStatus('${p.id}','APPROVED')">تایید</button>`);
      acts.push(`<button class="btn-sm danger" onclick="setStatus('${p.id}','REJECTED')">رد</button>`);
    }
    if (p.status === ST.APPROVED) {
      acts.push(`<button class="btn-sm gold" onclick="setStatus('${p.id}','SOLD')">فروخته شد</button>`);
    }
    acts.push(`<button class="btn-sm danger" onclick="askDel('${p.id}')">🗑️</button>`);

    return `
      <div class="admin-card">
        <div class="admin-thumb">${thumb}</div>
        <div class="admin-body">
          <span class="status st-${p.status}">${ST_FA[p.status] || p.status}</span>
          <div class="title">${esc(p.title)}</div>
          <div class="loc">${esc(p.location)}</div>
          <div class="price">${esc(p.price)}</div>
          ${p.ownerPhone ? `<div style="font-size:0.82rem;color:var(--muted)">📞 ${esc(p.ownerPhone)}</div>` : ""}
          <div class="admin-acts">${acts.join("")}</div>
        </div>
      </div>
    `;
  }).join("");
}

function setStatus(id, status) {
  const p = properties.find(x => x.id === id);
  if (!p) return;
  p.status = status;
  save();
  toast(status === "APPROVED" ? "تایید شد" : status === "SOLD" ? "فروخته شد" : "وضعیت به‌روز شد");
  renderAdmin();
  renderAccount();
}

function askDel(id) {
  deleteId = id;
  document.getElementById("modal-del").classList.remove("hidden");
}

function closeDel() {
  deleteId = null;
  document.getElementById("modal-del").classList.add("hidden");
}

function confirmDel() {
  if (!deleteId) return;
  properties = properties.filter(p => p.id !== deleteId);
  save();
  toast("حذف شد");
  closeDel();
  renderAdmin();
}

/* ---------- Backup / tools ---------- */
function exportData() {
  const payload = { version: 3, exportedAt: new Date().toISOString(), properties, savedIds };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {type:"application/json;charset=utf-8"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `amلاک-نگین-پشتیبان-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  toast("فایل پشتیبان ساخته شد");
}
function importData(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!Array.isArray(data.properties)) throw new Error();
      properties = data.properties;
      if (Array.isArray(data.savedIds)) savedIds = data.savedIds;
      save(); saveSaved();
      renderAdmin(); renderAccount(); renderHome();
      toast("اطلاعات با موفقیت بازیابی شد");
    } catch { toast("فایل پشتیبان معتبر نیست"); }
    e.target.value = "";
  };
  reader.readAsText(file);
}
function printAdmin() { window.print(); }

/* ---------- Edit ---------- */
function openEdit(id) {
  const p = properties.find(x => x.id === id);
  if (!p) return;
  document.getElementById("e-id").value = p.id;
  document.getElementById("e-title").value = p.title || "";
  document.getElementById("e-price").value = p.price || "";
  document.getElementById("e-location").value = p.location || "";
  document.getElementById("e-area").value = p.area || "";
  document.getElementById("e-rooms").value = p.rooms || "";
  document.getElementById("e-bath").value = p.bathrooms || "";
  document.getElementById("e-park").value = p.parking || "";
  document.getElementById("e-floor").value = p.floor || "";
  document.getElementById("e-year").value = p.year || "";
  document.getElementById("e-type").value = p.type || "خرید";
  document.getElementById("e-cat").value = p.category || "خانه";
  document.getElementById("e-desc").value = p.description || "";
  document.getElementById("e-video").value = p.video || "";
  document.getElementById("e-owner").value = p.ownerName || "";
  document.getElementById("e-phone").value = p.ownerPhone || "";
  document.getElementById("e-status").value = p.status || "PENDING";
  document.getElementById("e-featured").checked = !!p.isFeatured;
  editImages = [...(p.images || [])];
  renderEditPreviews();
  go("edit");
}

function submitEdit(e) {
  e.preventDefault();
  const id = document.getElementById("e-id").value;
  const p = properties.find(x => x.id === id);
  if (!p) return;
  p.title = document.getElementById("e-title").value.trim();
  p.price = document.getElementById("e-price").value.trim();
  p.location = document.getElementById("e-location").value.trim();
  p.area = document.getElementById("e-area").value.trim() || "—";
  p.rooms = document.getElementById("e-rooms").value.trim() || "—";
  p.bathrooms = document.getElementById("e-bath").value.trim() || "—";
  p.parking = document.getElementById("e-park").value.trim() || "—";
  p.floor = document.getElementById("e-floor").value.trim() || "—";
  p.year = document.getElementById("e-year").value.trim() || "—";
  p.type = document.getElementById("e-type").value;
  p.category = document.getElementById("e-cat").value;
  p.description = document.getElementById("e-desc").value.trim();
  p.video = document.getElementById("e-video").value.trim();
  p.ownerName = document.getElementById("e-owner").value.trim();
  p.ownerPhone = document.getElementById("e-phone").value.trim();
  p.status = document.getElementById("e-status").value;
  p.isFeatured = document.getElementById("e-featured").checked;
  p.images = [...editImages];
  save();
  toast("ذخیره شد");
  go("admin");
}

/* ---------- Init ---------- */
function init() {
  load();
  document.querySelectorAll("[data-page]").forEach(el => {
    el.addEventListener("click", e => {
      e.preventDefault();
      go(el.dataset.page);
    });
  });
  document.getElementById("login-p").addEventListener("keydown", e => {
    if (e.key === "Enter") doLogin();
  });
  // drag & drop upload
  const zone = document.getElementById("upload-zone");
  if (zone) {
    zone.addEventListener("dragover", e => { e.preventDefault(); zone.classList.add("drag"); });
    zone.addEventListener("dragleave", () => zone.classList.remove("drag"));
    zone.addEventListener("drop", async e => {
      e.preventDefault();
      zone.classList.remove("drag");
      const files = Array.from(e.dataTransfer.files || []).filter(f => f.type.startsWith("image/"));
      if (!files.length) return;
      const remain = MAX_IMGS - addImages.length;
      for (const f of files.slice(0, remain)) {
        try { addImages.push(await compressImage(f)); } catch {}
      }
      renderAddPreviews();
    });
  }
  const hash = location.hash.match(/property=([^&]+)/);
  if (hash) { selectedId = decodeURIComponent(hash[1]); go("detail"); }
  else go("home");
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") { closeLightbox(); closeLogin(); closeDel(); }
    if (e.key === "/" && !/input|textarea|select/i.test(document.activeElement?.tagName||"")) { e.preventDefault(); go("search"); setTimeout(()=>document.getElementById("q")?.focus(),50); }
  });
}

document.addEventListener("DOMContentLoaded", () => init());

/* ---------- Online multi-device backend ---------- */
let adminToken = sessionStorage.getItem('negin_admin_token') || '';
const _legacyInit = init;

async function safeJson(r){
  const text = await r.text();
  if(!text || !text.trim()){
    if(!r.ok) throw new Error('سرور پاسخ خالی فرستاد. مطمئن شوید سرور Node در حال اجراست (npm start)');
    return {};
  }
  try{ return JSON.parse(text); }
  catch{ throw new Error('پاسخ سرور نامعتبر است. سرور را با npm start اجرا کنید'); }
}

load = async function(){
  try{
    const headers = adminToken ? {Authorization:`Bearer ${adminToken}`} : {};
    const r = await fetch('/api/properties',{headers});
    if(!r.ok) throw new Error('server');
    properties = await safeJson(r);
  }catch(e){
    properties = [];
    toast('ارتباط با سرور برقرار نشد — سرور را با npm start اجرا کنید');
  }
  isAdmin = !!adminToken;
  renderAccount();
};

save = function(){ /* اطلاعات آنلاین در سرور ذخیره می‌شود */ };

doLogin = async function(){
  const u=document.getElementById('login-u').value.trim();
  const p=document.getElementById('login-p').value;
  if(!u || !p){
    const err=document.getElementById('login-err');
    err.textContent='نام کاربری و رمز عبور را وارد کنید';
    err.classList.remove('hidden');
    return;
  }
  try{
    const r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u,password:p})});
    const data=await safeJson(r);
    if(!r.ok) throw new Error(data.error||'ورود ناموفق بود');
    adminToken=data.token; sessionStorage.setItem('negin_admin_token',adminToken); isAdmin=true;
    closeLogin(); toast('ورود موفقیت‌آمیز'); await load(); go('admin');
  }catch(e){
    const err=document.getElementById('login-err');
    err.textContent=e.message||'خطا در ورود';
    err.classList.remove('hidden');
  }
};

logout = async function(){
  try{if(adminToken) await fetch('/api/logout',{method:'POST',headers:{Authorization:`Bearer ${adminToken}`}});}catch{}
  adminToken=''; isAdmin=false; sessionStorage.removeItem('negin_admin_token'); toast('خارج شدید'); await load(); go('account');
};

submitAdd = async function(e){
  e.preventDefault();
  const title=document.getElementById('a-title').value.trim();
  const price=document.getElementById('a-price').value.trim();
  const location=document.getElementById('a-location').value.trim();
  if(!title||!price||!location){toast('عنوان، قیمت و موقعیت الزامی است');return;}
  const prop={
    title,price,location,
    area:document.getElementById('a-area').value.trim()||'—',
    rooms:document.getElementById('a-rooms').value.trim()||'—',
    bathrooms:document.getElementById('a-bath').value.trim()||'—',
    parking:document.getElementById('a-park').value.trim()||'—',
    floor:document.getElementById('a-floor').value.trim()||'—',
    year:document.getElementById('a-year').value.trim()||'—',
    type:document.getElementById('a-type').value,
    category:document.getElementById('a-cat').value,
    description:document.getElementById('a-desc').value.trim(),
    ownerName:document.getElementById('a-owner').value.trim()||'مالک',
    ownerPhone:document.getElementById('a-phone').value.trim(),
    images:[...addImages],video:document.getElementById('a-video').value.trim()
  };
  try{
    const r=await fetch('/api/properties',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(prop)});
    const data=await safeJson(r); if(!r.ok) throw new Error(data.error||'ثبت آگهی ناموفق بود');
    properties.unshift(data); document.getElementById('form-add').reset(); addImages=[]; renderAddPreviews();
    document.getElementById('modal-ok').classList.remove('hidden');
  }catch(err){toast(err.message||'خطا در ثبت آگهی');}
};

setStatus = async function(id,status){
  if(!adminToken) return openLogin();
  try{
    const r=await fetch(`/api/properties/${encodeURIComponent(id)}/status`,{method:'PATCH',headers:{'Content-Type':'application/json',Authorization:`Bearer ${adminToken}`},body:JSON.stringify({status})});
    const p=await safeJson(r); if(!r.ok) throw new Error(p.error||'خطا');
    const i=properties.findIndex(x=>x.id===id); if(i>=0) properties[i]=p;
    toast(status==='APPROVED'?'آگهی تایید شد':status==='SOLD'?'وضعیت فروش ثبت شد':'وضعیت آگهی تغییر کرد');
    renderAdmin(); renderAccount(); renderHome();
  }catch(e){toast(e.message||'خطا در تغییر وضعیت');}
};

confirmDel = async function(){
  if(!deleteId||!adminToken)return;
  try{
    const r=await fetch(`/api/properties/${encodeURIComponent(deleteId)}`,{method:'DELETE',headers:{Authorization:`Bearer ${adminToken}`}});
    const d=await safeJson(r); if(!r.ok) throw new Error(d.error||'حذف ناموفق بود');
    properties=properties.filter(p=>p.id!==deleteId); closeDel(); toast('آگهی حذف شد'); renderAdmin(); renderAccount(); renderHome();
  }catch(e){toast(e.message||'خطا در حذف آگهی');}
};

submitEdit = async function(e){
  e.preventDefault();
  const id=document.getElementById('e-id').value; if(!id||!adminToken)return;
  const payload={
    title:document.getElementById('e-title').value.trim(),price:document.getElementById('e-price').value.trim(),location:document.getElementById('e-location').value.trim(),
    area:document.getElementById('e-area').value.trim()||'—',rooms:document.getElementById('e-rooms').value.trim()||'—',bathrooms:document.getElementById('e-bath').value.trim()||'—',
    parking:document.getElementById('e-park').value.trim()||'—',floor:document.getElementById('e-floor').value.trim()||'—',year:document.getElementById('e-year').value.trim()||'—',
    type:document.getElementById('e-type').value,category:document.getElementById('e-cat').value,description:document.getElementById('e-desc').value.trim(),video:document.getElementById('e-video').value.trim(),
    ownerName:document.getElementById('e-owner').value.trim(),ownerPhone:document.getElementById('e-phone').value.trim(),status:document.getElementById('e-status').value,
    isFeatured:document.getElementById('e-featured').checked,images:[...editImages]
  };
  try{
    const r=await fetch(`/api/properties/${encodeURIComponent(id)}`,{method:'PUT',headers:{'Content-Type':'application/json',Authorization:`Bearer ${adminToken}`},body:JSON.stringify(payload)});
    const p=await safeJson(r); if(!r.ok)throw new Error(p.error||'ویرایش ناموفق بود');
    const i=properties.findIndex(x=>x.id===id); if(i>=0)properties[i]=p; toast('ویرایش ذخیره شد'); go('admin');
  }catch(err){toast(err.message||'خطا در ویرایش');}
};

init = async function(){
  await load();
  _legacyInit();
};
