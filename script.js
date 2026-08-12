// ============================================
// Vexom - All-in-one Script
// ============================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ——— Firebase Config (بياناتك محفوظة) ———
const firebaseConfig = {
  apiKey: "AIzaSyD_Z-GbBt2H0UTPsoYONlzkf0SfWG5_mKM",
  authDomain: "vexome-c19d2.firebaseapp.com",
  projectId: "vexome-c19d2",
  storageBucket: "vexome-c19d2.firebasestorage.app",
  messagingSenderId: "341921128697",
  appId: "1:341921128697:web:7f96d1c6561b2f92be0228",
};

export const ORDER_EMAIL = "xrammar4@gmail.com";
export const OWNER_EMAIL = "xrammar4@gmail.com";
export const WHATSAPP_NUMBER = "966500000000";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export const DEMO_PRODUCTS = [
  {
    id: "demo1",
    name: "لوحة مفاتيح ميكانيكية RGB",
    price: 189,
    category: "pc-accessories",
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80",
    createdAt: Date.now()
  },
  {
    id: "demo2",
    name: "فأرة ألعاب لاسلكية",
    price: 129,
    category: "pc-accessories",
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80",
    createdAt: Date.now()
  },
  {
    id: "demo3",
    name: "سماعة رأس احترافية",
    price: 249,
    category: "pc-accessories",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
    createdAt: Date.now()
  },
  {
    id: "demo4",
    name: "شاحن لابتوب سريع 65W",
    price: 99,
    category: "laptop",
    image: "https://images.unsplash.com/photo-1583863788434-e58a36338f18?w=600&q=80",
    createdAt: Date.now()
  },
  {
    id: "demo5",
    name: "حقيبة لابتوب أنيقة 15.6",
    price: 79,
    category: "laptop",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80",
    createdAt: Date.now()
  },
  {
    id: "demo6",
    name: "شاشة ألعاب 27 بوصة 165Hz",
    price: 899,
    category: "monitors",
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&q=80",
    createdAt: Date.now()
  },
  {
    id: "demo7",
    name: "كاميرا مراقبة IP لاسلكية",
    price: 199,
    category: "cameras",
    image: "https://images.unsplash.com/photo-1557324232-b8917d3c068b?w=600&q=80",
    createdAt: Date.now()
  },
  {
    id: "demo8",
    name: "تجميعة PC Gaming RTX 4060",
    price: 3499,
    category: "pc-builds",
    image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&q=80",
    createdAt: Date.now()
  }
];

export const CATEGORY_LABELS = {
  all: "الكل",
  "pc-accessories": "إكسسوارات كمبيوتر",
  "mobile-accessories": "إكسسوارات موبايل",
  cameras: "كاميرات مراقبة",
  laptop: "لابتوب",
  monitors: "شاشات",
  "pc-original": "PC ORIGINAL",
  "pc-builds": "تجميعات PC"
};

// ========== Helpers ==========
function normalizeEmail(e) {
  return (e || "").trim().toLowerCase();
}

async function isAllowedAdmin(email) {
  const em = normalizeEmail(email);
  if (em === normalizeEmail(OWNER_EMAIL)) return true;
  try {
    const id = em.replace(/[.#$[\]]/g, "_");
    const snap = await getDoc(doc(db, "admins", id));
    return snap.exists();
  } catch {
    return em === normalizeEmail(OWNER_EMAIL);
  }
}

function showToast(msg, type = "success") {
  const toastEl = document.getElementById("toast");
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.className = `toast ${type} show`;
  setTimeout(() => toastEl.classList.remove("show"), 3000);
}

// ========== SPA Navigation ==========
function showPage(page) {
  document.querySelectorAll(".page-section").forEach((s) => s.classList.remove("active"));
  const el = document.getElementById(`page-${page}`);
  if (el) el.classList.add("active");

  document.querySelectorAll(".nav-link").forEach((a) => {
    a.classList.toggle("active", a.dataset.page === page);
  });

  // mobile menu active text
  document.querySelectorAll("#mobile-menu .nav-goto").forEach((a) => {
    if (a.dataset.page === page) {
      a.classList.add("text-vexom-red", "font-medium");
    } else {
      a.classList.remove("text-vexom-red", "font-medium");
    }
  });

  document.getElementById("mobile-menu")?.classList.add("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });

  if (page === "products") loadProducts();
  if (page === "admin") {
    loadAdminProducts();
    if (isOwner) loadAdminsList();
  }
}

document.querySelectorAll(".nav-goto").forEach((el) => {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    const page = el.dataset.page || "home";
    if (page === "admin" && !currentUserEmail) {
      openLoginModal();
      return;
    }
    history.replaceState({}, "", `#${page}`);
    showPage(page);
  });
});

// hash on load
const hash = (location.hash || "#home").replace("#", "") || "home";
showPage(["home", "products", "about", "stats", "faq", "admin"].includes(hash) ? hash : "home");

// ========== Mobile menu ==========
document.getElementById("mobile-menu-btn")?.addEventListener("click", () => {
  document.getElementById("mobile-menu")?.classList.toggle("hidden");
});

// ========== WhatsApp ==========
const waFloat = document.getElementById("whatsapp-float");
if (waFloat) waFloat.href = `https://wa.me/${WHATSAPP_NUMBER}`;

// ========== FAQ ==========
document.querySelectorAll(".faq-item").forEach((item) => {
  const btn = item.querySelector(".faq-toggle");
  const text = item.querySelector(".faq-toggle-text");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const isOpen = item.classList.contains("open");
    document.querySelectorAll(".faq-item.open").forEach((other) => {
      if (other !== item) {
        other.classList.remove("open");
        other.querySelector(".faq-toggle")?.setAttribute("aria-expanded", "false");
        const t = other.querySelector(".faq-toggle-text");
        if (t) t.textContent = "عرض الإجابة";
      }
    });
    item.classList.toggle("open", !isOpen);
    btn.setAttribute("aria-expanded", String(!isOpen));
    if (text) text.textContent = isOpen ? "عرض الإجابة" : "إخفاء الإجابة";
  });
});

// ========== Login Modal ==========
const loginModal = document.getElementById("login-modal");
const loginForm = document.getElementById("login-modal-form");
const loginError = document.getElementById("modal-login-error");
const loginSubmitBtn = document.getElementById("modal-login-btn");
const googleBtn = document.getElementById("google-login-btn");
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

function openLoginModal() {
  if (!loginModal) return;
  loginModal.classList.remove("hidden");
  loginModal.setAttribute("aria-hidden", "false");
  loginError?.classList.add("hidden");
}

function closeLoginModal() {
  if (!loginModal) return;
  loginModal.classList.add("hidden");
  loginModal.setAttribute("aria-hidden", "true");
}

document.querySelectorAll(".open-login-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    openLoginModal();
  });
});
document.querySelectorAll("[data-close-login]").forEach((el) => {
  el.addEventListener("click", closeLoginModal);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeLoginModal();
    closeOrderModal();
  }
});

function showLoginError(msg) {
  if (!loginError) return;
  loginError.textContent = msg;
  loginError.classList.remove("hidden");
}

async function finishLogin(user) {
  if (!user?.email) {
    showLoginError("لم يتم الحصول على الإيميل من جوجل.");
    await signOut(auth);
    return false;
  }
  const allowed = await isAllowedAdmin(user.email);
  if (!allowed) {
    await signOut(auth);
    showLoginError(`الحساب ${user.email} غير مصرّح له. تأكد أن OWNER_EMAIL هو نفس إيميل جوجل.`);
    return false;
  }
  closeLoginModal();
  history.replaceState({}, "", "#admin");
  showPage("admin");
  return true;
}

loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError?.classList.add("hidden");
  if (loginSubmitBtn) {
    loginSubmitBtn.disabled = true;
    loginSubmitBtn.textContent = "جاري الدخول...";
  }
  const email = document.getElementById("modal-email").value.trim();
  const password = document.getElementById("modal-password").value;
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await finishLogin(cred.user);
  } catch (err) {
    console.error(err);
    showLoginError("فشل الدخول. تحقق من البريد وكلمة المرور.");
  } finally {
    if (loginSubmitBtn) {
      loginSubmitBtn.disabled = false;
      loginSubmitBtn.textContent = "دخول";
    }
  }
});

googleBtn?.addEventListener("click", async () => {
  loginError?.classList.add("hidden");
  googleBtn.disabled = true;
  const original = googleBtn.innerHTML;
  googleBtn.innerHTML = "جاري فتح جوجل...";
  try {
    const result = await signInWithPopup(auth, googleProvider);
    await finishLogin(result.user);
  } catch (err) {
    console.error(err);
    if (err.code === "auth/popup-blocked" || err.code === "auth/popup-closed-by-user") {
      try {
        await signInWithRedirect(auth, googleProvider);
        return;
      } catch (e2) {
        showLoginError("تعذر فتح نافذة جوجل. اسمح بالنوافذ المنبثقة ثم أعد المحاولة.");
      }
    } else if (err.code === "auth/unauthorized-domain") {
      showLoginError("أضف localhost ونطاق موقعك في Firebase → Authentication → Authorized domains");
    } else if (err.code === "auth/operation-not-allowed") {
      showLoginError("فعّل تسجيل Google من Firebase → Authentication → Sign-in method");
    } else {
      showLoginError("فشل تسجيل الدخول بجوجل. تأكد من إعدادات Firebase.");
    }
  } finally {
    googleBtn.disabled = false;
    googleBtn.innerHTML = original;
  }
});

getRedirectResult(auth).then(async (result) => {
  if (result?.user) await finishLogin(result.user);
}).catch(() => {});

// ========== Auth state ==========
let currentUserEmail = "";
let isOwner = false;

onAuthStateChanged(auth, async (user) => {
  const loginBtns = document.querySelectorAll(".open-login-btn");
  const navAdmin = document.getElementById("nav-admin-link");
  const navAdminM = document.getElementById("nav-admin-link-m");

  if (user && user.email) {
    const allowed = await isAllowedAdmin(user.email);
    if (!allowed) {
      currentUserEmail = "";
      isOwner = false;
      return;
    }
    currentUserEmail = normalizeEmail(user.email);
    isOwner = currentUserEmail === normalizeEmail(OWNER_EMAIL);

    const short = user.email.split("@")[0];
    loginBtns.forEach((btn) => {
      btn.textContent = short;
      btn.title = user.email;
      btn.classList.add("is-logged-in");
      btn.onclick = (e) => {
        e.preventDefault();
        history.replaceState({}, "", "#admin");
        showPage("admin");
      };
    });
    navAdmin?.classList.remove("hidden");
    navAdminM?.classList.remove("hidden");

    const emailDisplay = document.getElementById("admin-email-display");
    if (emailDisplay) {
      emailDisplay.textContent = short;
      emailDisplay.title = user.email;
    }
    const adminsTabBtn = document.getElementById("admins-tab-btn");
    if (adminsTabBtn) {
      if (isOwner) {
        adminsTabBtn.classList.remove("hidden");
      } else {
        adminsTabBtn.classList.add("hidden");
      }
    }
  } else {
    currentUserEmail = "";
    isOwner = false;
    loginBtns.forEach((btn) => {
      btn.textContent = "تسجيل الدخول";
      btn.title = "";
      btn.classList.remove("is-logged-in");
      btn.onclick = (e) => {
        e.preventDefault();
        openLoginModal();
      };
    });
    navAdmin?.classList.add("hidden");
    navAdminM?.classList.add("hidden");
    if (document.getElementById("page-admin")?.classList.contains("active")) {
      showPage("home");
    }
  }
});

document.getElementById("logout-btn")?.addEventListener("click", async () => {
  await signOut(auth);
  showPage("home");
  history.replaceState({}, "", "#home");
});

// ========== Products ==========
let allProducts = [];
let currentCat = "all";
let searchQuery = "";
let selectedProduct = null;

function productCardHTML(p, index = 0) {
  const catLabel = CATEGORY_LABELS[p.category] || p.category;
  const safeName = (p.name || "").replace(/'/g, "\\'");
  return `
    <div class="product-card" style="animation-delay: ${index * 0.06}s">
      <div class="img-wrap">
        <img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.src='https://placehold.co/400x300/1a1a1a/f43f5e?text=Vexom'">
      </div>
      <div class="content">
        <span class="category-badge">${catLabel}</span>
        <h3>${p.name}</h3>
        <div class="price">${Number(p.price).toLocaleString("ar-SA")} ر.س</div>
        <button type="button" class="buy-btn" data-id="${p.id || index}" data-name="${safeName}" data-price="${p.price}">شراء</button>
      </div>
    </div>
  `;
}

function getFiltered() {
  let list = allProducts;
  if (currentCat !== "all") list = list.filter((p) => p.category === currentCat);
  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    list = list.filter((p) => (p.name || "").toLowerCase().includes(q));
  }
  return list;
}

function renderProducts() {
  const grid = document.getElementById("products-grid");
  const noProducts = document.getElementById("no-products");
  const countEl = document.getElementById("products-count");
  const loading = document.getElementById("loading");
  if (loading) loading.classList.add("hidden");
  if (!grid) return;

  const filtered = getFiltered();
  if (countEl) countEl.textContent = filtered.length === 0 ? "" : `${filtered.length} منتج`;

  if (filtered.length === 0) {
    grid.innerHTML = "";
    noProducts?.classList.remove("hidden");
    return;
  }
  noProducts?.classList.add("hidden");
  grid.innerHTML = filtered.map((p, i) => productCardHTML(p, i)).join("");
  bindBuyButtons();
}

function bindBuyButtons() {
  document.querySelectorAll(".buy-btn").forEach((btn) => {
    btn.onclick = () => {
      selectedProduct = {
        id: btn.dataset.id,
        name: btn.dataset.name,
        price: btn.dataset.price
      };
      openOrderModal();
    };
  });
}

function bindPills() {
  const container = document.getElementById("category-pills");
  if (!container) return;
  container.querySelectorAll(".cat-pill").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.cat === currentCat);
    btn.onclick = () => {
      currentCat = btn.dataset.cat || "all";
      container.querySelectorAll(".cat-pill").forEach((b) => {
        b.classList.toggle("active", b.dataset.cat === currentCat);
      });
      renderProducts();
    };
  });
}

function setupSearch() {
  const input = document.getElementById("search-input");
  const btn = document.getElementById("search-btn");
  if (!input) return;
  const run = () => {
    searchQuery = input.value || "";
    renderProducts();
  };
  btn?.addEventListener("click", run);
  input.addEventListener("input", run);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      run();
    }
  });
}

async function loadProducts() {
  try {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    allProducts = [];
    snap.forEach((d) => allProducts.push({ id: d.id, ...d.data() }));
  } catch (e) {
    allProducts = [...DEMO_PRODUCTS];
  }
  if (allProducts.length === 0) allProducts = [...DEMO_PRODUCTS];
  bindPills();
  renderProducts();
}

setupSearch();
bindPills();

// ========== Order Modal ==========
const orderModal = document.getElementById("order-modal");
const orderStepPay = document.getElementById("order-step-pay");
const orderStepForm = document.getElementById("order-step-form");
const orderProductName = document.getElementById("order-product-name");
const orderProductPrice = document.getElementById("order-product-price");
const orderForm = document.getElementById("order-cod-form");
const orderMsg = document.getElementById("order-msg");

function openOrderModal() {
  if (!orderModal || !selectedProduct) return;
  orderStepPay?.classList.remove("hidden");
  orderStepForm?.classList.add("hidden");
  orderMsg?.classList.add("hidden");
  if (orderProductName) orderProductName.textContent = selectedProduct.name;
  if (orderProductPrice)
    orderProductPrice.textContent = `${Number(selectedProduct.price).toLocaleString("ar-SA")} ر.س`;
  orderModal.classList.remove("hidden");
  orderModal.setAttribute("aria-hidden", "false");
}

function closeOrderModal() {
  orderModal?.classList.add("hidden");
  orderModal?.setAttribute("aria-hidden", "true");
  selectedProduct = null;
}

document.querySelectorAll("[data-close-order]").forEach((el) => {
  el.addEventListener("click", closeOrderModal);
});

document.getElementById("pay-cod-btn")?.addEventListener("click", () => {
  orderStepPay?.classList.add("hidden");
  orderStepForm?.classList.remove("hidden");
});

document.getElementById("pay-now-btn")?.addEventListener("click", () => {
  if (!selectedProduct) return;
  const msg = encodeURIComponent(
    `مرحباً، أريد الدفع الآن للمنتج: ${selectedProduct.name} بسعر ${selectedProduct.price} ر.س`
  );
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
});

document.getElementById("order-back-btn")?.addEventListener("click", () => {
  orderStepForm?.classList.add("hidden");
  orderStepPay?.classList.remove("hidden");
});

orderForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!selectedProduct) return;

  const governorate = document.getElementById("order-governorate").value.trim();
  const address = document.getElementById("order-address").value.trim();
  const phone = document.getElementById("order-phone").value.trim();
  const notes = document.getElementById("order-notes")?.value.trim() || "";

  const submitBtn = document.getElementById("order-submit-btn");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "جاري إرسال الطلب...";
  }

  const body = {
    _subject: `طلب جديد من Vexom: ${selectedProduct.name}`,
    المنتج: selectedProduct.name,
    السعر: selectedProduct.price + " ر.س",
    طريقة_الدفع: "الدفع عند الاستلام",
    المحافظة: governorate,
    العنوان: address,
    الموبايل: phone,
    ملاحظات: notes || "-",
    _template: "table"
  };

  try {
    const res = await fetch(`https://formsubmit.co/ajax/${ORDER_EMAIL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error("send failed");

    if (orderMsg) {
      orderMsg.textContent = "تم إرسال طلبك بنجاح ✓ سنتواصل معك قريباً";
      orderMsg.className = "text-center text-green-400 text-sm mt-3";
      orderMsg.classList.remove("hidden");
    }
    orderForm.reset();
    setTimeout(closeOrderModal, 1800);
  } catch (err) {
    console.error(err);
    const subject = encodeURIComponent(`طلب Vexom: ${selectedProduct.name}`);
    const mailBody = encodeURIComponent(
      `المنتج: ${selectedProduct.name}\nالسعر: ${selectedProduct.price} ر.س\nالدفع: عند الاستلام\nالمحافظة: ${governorate}\nالعنوان: ${address}\nالموبايل: ${phone}\nملاحظات: ${notes}`
    );
    window.location.href = `mailto:${ORDER_EMAIL}?subject=${subject}&body=${mailBody}`;
    if (orderMsg) {
      orderMsg.textContent = "تم فتح البريد لإرسال الطلب";
      orderMsg.className = "text-center text-gray-300 text-sm mt-3";
      orderMsg.classList.remove("hidden");
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "تأكيد الطلب";
    }
  }
});

// ========== Admin ==========
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach((c) => c.classList.add("hidden"));
    btn.classList.add("active");
    document.getElementById(`tab-${btn.dataset.tab}`)?.classList.remove("hidden");
  });
});

const imageInput = document.getElementById("p-image");
const imagePreview = document.getElementById("image-preview");
const previewImg = document.getElementById("preview-img");
imageInput?.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (file) {
    previewImg.src = URL.createObjectURL(file);
    imagePreview.classList.remove("hidden");
  } else {
    imagePreview.classList.add("hidden");
  }
});

const addForm = document.getElementById("add-product-form");
const addBtn = document.getElementById("add-btn");

/** ضغط الصورة وإرجاعها كـ Data URL (بدون Storage) */
function compressToDataURL(file, maxW = 700, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let w = img.width;
      let h = img.height;
      if (w > maxW) {
        h = Math.round((h * maxW) / w);
        w = maxW;
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      try {
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        // حد تقريبي أقل من 900KB عشان Firestore
        if (dataUrl.length > 900000) {
          const smaller = canvas.toDataURL("image/jpeg", 0.45);
          resolve(smaller);
        } else {
          resolve(dataUrl);
        }
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("تعذر قراءة الصورة"));
    };
    img.src = url;
  });
}

function firebaseErrorMessage(err) {
  const code = err?.code || "";
  const msg = err?.message || String(err);
  if (code.includes("permission-denied") || /permission/i.test(msg)) {
    return "مرفوض: عدّل قواعد Firestore → allow write: if request.auth != null;";
  }
  if (code.includes("unauthenticated") || /unauthenticated/i.test(msg)) {
    return "يجب تسجيل الدخول أولاً ثم أعد المحاولة.";
  }
  if (/invalid-argument|exceeds|too large|1 MiB|1048576/i.test(msg)) {
    return "الصورة كبيرة جداً. اختر صورة أصغر أو أقل دقة.";
  }
  if (/network|fetch|Failed to fetch/i.test(msg)) {
    return "مشكلة شبكة. شغّل الموقع عبر خادم محلي (npx serve).";
  }
  if (msg.length < 140) return msg;
  return "فشل النشر. افتح Console (F12) وشوف الخطأ.";
}

addForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const user = auth.currentUser;
  if (!user) {
    showToast("يجب تسجيل الدخول أولاً", "error");
    openLoginModal();
    return;
  }

  addBtn.disabled = true;
  addBtn.textContent = "جاري النشر...";

  const name = document.getElementById("p-name").value.trim();
  const price = parseFloat(document.getElementById("p-price").value);
  const category = document.getElementById("p-category").value;
  const file = imageInput?.files?.[0];
  const imageUrlInput = document.getElementById("p-image-url");
  const externalUrl = (imageUrlInput?.value || "").trim();

  if (!name || !Number.isFinite(price) || price < 0) {
    showToast("أدخل اسم وسعر صحيح", "error");
    addBtn.disabled = false;
    addBtn.textContent = "نشر المنتج";
    return;
  }

  if (!file && !externalUrl) {
    showToast("اختر صورة أو الصق رابط صورة", "error");
    addBtn.disabled = false;
    addBtn.textContent = "نشر المنتج";
    return;
  }

  try {
    let imageUrl = externalUrl;

    if (file) {
      addBtn.textContent = "جاري ضغط الصورة...";
      imageUrl = await compressToDataURL(file);
    }

    addBtn.textContent = "جاري حفظ المنتج...";
    await addDoc(collection(db, "products"), {
      name,
      price,
      category,
      image: imageUrl,
      createdAt: serverTimestamp(),
      createdBy: user.email || ""
    });

    showToast("تم نشر المنتج بنجاح ✓");
    addForm.reset();
    if (imagePreview) imagePreview.classList.add("hidden");
    if (previewImg) previewImg.src = "";
    await loadAdminProducts();
    await loadProducts();
    document.querySelector('[data-tab="list"]')?.click();
  } catch (err) {
    console.error("Publish error:", err);
    showToast(firebaseErrorMessage(err), "error");
  } finally {
    addBtn.disabled = false;
    addBtn.textContent = "نشر المنتج";
  }
});

async function loadAdminProducts() {
  const container = document.getElementById("admin-products");
  const empty = document.getElementById("admin-empty");
  const countEl = document.getElementById("admin-count");
  if (!container) return;

  try {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    const products = [];
    snap.forEach((d) => products.push({ id: d.id, ...d.data() }));

    if (countEl) countEl.textContent = `(${products.length})`;

    if (products.length === 0) {
      container.innerHTML = "";
      empty?.classList.remove("hidden");
      return;
    }
    empty?.classList.add("hidden");
    container.innerHTML = products
      .map(
        (p) => `
      <div class="flex items-center gap-4 bg-vexom-card border border-vexom-border rounded-xl p-3 sm:p-4">
        <img src="${p.image}" alt="${p.name}" class="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg flex-shrink-0" onerror="this.src='https://placehold.co/80x80/1a1a1a/f43f5e?text=V'">
        <div class="flex-1 min-w-0">
          <h3 class="font-bold truncate">${p.name}</h3>
          <p class="text-vexom-red font-semibold">${Number(p.price).toLocaleString("ar-SA")} ر.س</p>
          <span class="text-xs text-gray-500">${CATEGORY_LABELS[p.category] || p.category}</span>
        </div>
        <button type="button" data-delete-id="${p.id}" class="delete-product-btn flex-shrink-0 p-2.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors" title="حذف">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>
      </div>
    `
      )
      .join("");

    container.querySelectorAll(".delete-product-btn").forEach((btn) => {
      btn.addEventListener("click", () => window.deleteProduct(btn.dataset.deleteId));
    });
  } catch (err) {
    console.error(err);
    container.innerHTML = `<p class="text-gray-400 text-center py-8">تعذر تحميل المنتجات.</p>`;
  }
}

window.deleteProduct = async (id) => {
  if (!confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;
  try {
    await deleteDoc(doc(db, "products", id));
    showToast("تم حذف المنتج");
    loadAdminProducts();
    loadProducts();
  } catch (err) {
    showToast("فشل الحذف", "error");
  }
};

// Admins
const addAdminForm = document.getElementById("add-admin-form");
addAdminForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!isOwner) {
    showToast("فقط المالك يمكنه إضافة مشرفين", "error");
    return;
  }
  const email = normalizeEmail(document.getElementById("admin-email-input").value);
  if (!email) return;
  if (email === normalizeEmail(OWNER_EMAIL)) {
    showToast("هذا هو إيميل المالك بالفعل", "error");
    return;
  }
  try {
    const id = email.replace(/[.#$[\]]/g, "_");
    await setDoc(doc(db, "admins", id), {
      email,
      addedBy: currentUserEmail,
      createdAt: serverTimestamp()
    });
    showToast("تم إضافة المشرف ✓");
    document.getElementById("admin-email-input").value = "";
    loadAdminsList();
  } catch (err) {
    console.error(err);
    showToast("فشل الإضافة. تأكد من قواعد Firestore.", "error");
  }
});

async function loadAdminsList() {
  const list = document.getElementById("admins-list");
  if (!list) return;
  const rows = [];
  rows.push(`
    <div class="flex items-center justify-between bg-vexom-card border border-vexom-border rounded-xl px-4 py-3">
      <div>
        <span class="font-medium">${OWNER_EMAIL}</span>
        <span class="text-xs text-vexom-red mr-2">(المالك)</span>
      </div>
    </div>
  `);
  try {
    const snap = await getDocs(collection(db, "admins"));
    snap.forEach((d) => {
      const data = d.data();
      rows.push(`
        <div class="flex items-center justify-between bg-vexom-card border border-vexom-border rounded-xl px-4 py-3">
          <span class="font-medium">${data.email}</span>
          ${isOwner ? `<button type="button" data-remove-admin="${d.id}" class="remove-admin-btn text-red-400 text-sm hover:underline">إزالة</button>` : ""}
        </div>
      `);
    });
  } catch (e) {
    /* ignore */
  }
  list.innerHTML = rows.join("");
  list.querySelectorAll(".remove-admin-btn").forEach((btn) => {
    btn.addEventListener("click", () => window.removeAdmin(btn.dataset.removeAdmin));
  });
}

window.removeAdmin = async (id) => {
  if (!isOwner) return;
  if (!confirm("إزالة هذا المشرف؟")) return;
  try {
    await deleteDoc(doc(db, "admins", id));
    showToast("تم الإزالة");
    loadAdminsList();
  } catch (e) {
    showToast("فشل الإزالة", "error");
  }
};
