
// ==========================================
// EASY PARK LITE - KONFIGURASI
// ==========================================

const STORAGE_KEY = "easypark_data_v3";
const ROLE_STORAGE_KEY = "easypark_demo_role";
const BOOKING_DURATION = 15 * 60 * 1000;

const defaultSlots = [
  { id: "A01", status: "kosong" },
  { id: "A02", status: "terisi" },
  { id: "A03", status: "kosong" },
  { id: "B01", status: "kosong" },
  { id: "B02", status: "reservasi" },
  { id: "B03", status: "kosong" }
];

const rolePages = {
  user: ["dashboard", "booking", "reservasi"],
  admin: ["dashboard", "manajemen", "laporan"]
};

const pageConfig = {
  dashboard: {
    title: "Dashboard Parkir",
    description: "Pantau ketersediaan slot parkir dengan mudah."
  },
  booking: {
    title: "Booking Parkir",
    description: "Pilih slot dan lakukan reservasi tempat parkir."
  },
  reservasi: {
    title: "Reservasi Saya",
    description: "Lihat status dan detail reservasi parkir."
  },
  manajemen: {
    title: "Manajemen Parkir",
    description: "Kelola dan pantau status slot parkir."
  },
  laporan: {
    title: "Laporan Parkir",
    description: "Lihat ringkasan dan riwayat aktivitas parkir."
  }
};

// ==========================================
// MEMUAT DATA
// ==========================================

function loadData() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));

    if (
      stored &&
      Array.isArray(stored.slots) &&
      stored.slots.length === 6 &&
      defaultSlots.every(defaultSlot =>
        stored.slots.some(slot =>
          slot.id === defaultSlot.id &&
          ["kosong", "terisi", "reservasi"].includes(slot.status)
        )
      )
    ) {
      return {
        slots: stored.slots,
        reservation: stored.reservation || null,
        activities: Array.isArray(stored.activities)
          ? stored.activities
          : []
      };
    }
  } catch (error) {
    console.warn("Gagal membaca data lokal:", error);
  }

  return {
    slots: defaultSlots.map(slot => ({ ...slot })),
    reservation: null,
    activities: []
  };
}

let data = loadData();
let selectedSlot = null;

let currentRole = "user";

try {
  if (localStorage.getItem(ROLE_STORAGE_KEY) === "admin") {
    currentRole = "admin";
  }
} catch (error) {
  console.warn("Preferensi role tidak dapat dibaca:", error);
}

// ==========================================
// PENYIMPANAN DAN RIWAYAT
// ==========================================

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn("Penyimpanan browser tidak tersedia:", error);
  }
}

function addActivity(slotId, description) {
  data.activities.unshift({
    time: new Date().toISOString(),
    slot: slotId,
    description
  });

  data.activities = data.activities.slice(0, 100);
}

// ==========================================
// ICONS
// ==========================================

function refreshIcons() {
  if (
    window.lucide &&
    typeof window.lucide.createIcons === "function"
  ) {
    window.lucide.createIcons();
  }
}

// ==========================================
// ROLE SWITCHER
// ==========================================

function updateRoleButtons() {
  document.querySelectorAll(".role-btn").forEach(button => {
    const active = button.dataset.role === currentRole;

    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function switchRole(role) {
  if (!rolePages[role]) return;

  currentRole = role;
  selectedSlot = null;

  try {
    localStorage.setItem(ROLE_STORAGE_KEY, role);
  } catch (error) {
    console.warn("Role tidak dapat disimpan:", error);
  }

  updateRoleButtons();
  navigate("dashboard");
}

document.querySelectorAll(".role-btn").forEach(button => {
  button.addEventListener("click", () => {
    switchRole(button.dataset.role);
  });
});

// ==========================================
// NAVIGASI HALAMAN
// ==========================================

function navigate(page) {
  if (!rolePages[currentRole].includes(page)) {
    page = "dashboard";
  }

  document.querySelectorAll(".page").forEach(element => {
    element.classList.remove("active");
  });

  document.getElementById(`page-${page}`)
    .classList.add("active");

  document.querySelectorAll(".nav-link").forEach(link => {
    const linkPage = link.dataset.page;
    const allowed = rolePages[currentRole].includes(linkPage);

    link.style.display = allowed ? "flex" : "none";
    link.classList.toggle("active", linkPage === page);
  });

  let title = pageConfig[page].title;
  let description = pageConfig[page].description;

  if (page === "dashboard" && currentRole === "admin") {
    title = "Dashboard Pengelola";
    description = "Pantau kapasitas dan kondisi area parkir.";
  }

  document.getElementById("page-title").textContent = title;
  document.getElementById("page-description").textContent =
    description;

  document.getElementById("role-indicator").textContent =
    currentRole === "user"
      ? "Mode Pengguna"
      : "Mode Pengelola";

  document.body.classList.toggle(
    "role-user", currentRole === "user"
  );

  document.body.classList.toggle(
    "role-admin", currentRole === "admin"
  );

  updateWelcomeBanner();

  if (window.location.hash !== `#${page}`) {
    history.replaceState(null, "", `#${page}`);
  }

  renderAll();
  window.scrollTo(0, 0);
}

document.querySelectorAll(".nav-link").forEach(link => {
  link.addEventListener("click", event => {
    event.preventDefault();
    navigate(link.dataset.page);
  });
});

window.addEventListener("hashchange", () => {
  const page = window.location.hash.replace("#", "");
  navigate(page);
});

// ==========================================
// BANNER BERDASARKAN ROLE
// ==========================================

function updateWelcomeBanner() {
  const title = document.getElementById("welcome-title");
  const description = document.getElementById(
    "welcome-description"
  );

  if (currentRole === "admin") {
    title.textContent = "Dashboard Pengelola Parkir";
    description.textContent =
      "Pantau kapasitas, reservasi, dan kondisi slot parkir dalam satu dashboard.";
  } else {
    title.textContent = "Selamat Datang di Easy Park Lite";
    description.textContent =
      "Temukan slot parkir tersedia dan lakukan reservasi dengan mudah.";
  }
}

// ==========================================
// STATISTIK DAN OKUPANSI
// ==========================================

function getStats() {
  const total = data.slots.length;

  const kosong = data.slots.filter(
    slot => slot.status === "kosong"
  ).length;

  const terisi = data.slots.filter(
    slot => slot.status === "terisi"
  ).length;

  const reservasi = data.slots.filter(
    slot => slot.status === "reservasi"
  ).length;

  const used = terisi + reservasi;

  const occupancy = total > 0
    ? Math.round((used / total) * 100)
    : 0;

  return {
    total, kosong, terisi, reservasi, used, occupancy
  };
}

function updateStats() {
  const stats = getStats();

  document.querySelectorAll("[data-stat]").forEach(element => {
    const key = element.dataset.stat;
    element.textContent = stats[key] ?? 0;
  });

  document.getElementById("occupancy-percent").textContent =
    `${stats.occupancy}%`;

  document.getElementById("occupancy-bar").style.width =
    `${stats.occupancy}%`;

  document.getElementById("dashboard-occupancy").textContent =
    `${stats.occupancy}%`;

  document.getElementById("used-slots-label").textContent =
    `${stats.used} dari ${stats.total}`;

  document.getElementById("dashboard-progress").style.width =
    `${stats.occupancy}%`;

  const circle = document.querySelector(".occupancy-circle");

  circle.style.background = `conic-gradient(
    #0879bf 0%,
    #0879bf ${stats.occupancy}%,
    #e6f0f9 ${stats.occupancy}%,
    #e6f0f9 100%
  )`;

  const availability = document.getElementById(
    "parking-availability"
  );

  if (stats.kosong === 0) {
    availability.textContent =
      "Seluruh slot parkir sedang digunakan atau direservasi.";
  } else if (stats.kosong <= 2) {
    availability.textContent =
      `Parkir hampir penuh. Tersisa ${stats.kosong} slot kosong.`;
  } else {
    availability.textContent =
      `Tersedia ${stats.kosong} slot parkir yang dapat digunakan.`;
  }
}

// ==========================================
// DENAH PARKIR
// ==========================================

function createSlotElement(slot) {
  const button = document.createElement("button");

  button.type = "button";
  button.className = `slot ${slot.status}`;

  if (
    selectedSlot === slot.id &&
    slot.status === "kosong" &&
    currentRole === "user"
  ) {
    button.classList.add("selected");
  }

  const icon = document.createElement("i");
  icon.setAttribute("data-lucide", "car-front");

  const label = document.createElement("span");
  label.textContent = slot.id;

  const statusText = {
    kosong: "Kosong",
    terisi: "Terisi",
    reservasi: "Direservasi"
  };

  const status = document.createElement("small");
  status.textContent = statusText[slot.status];

  button.append(icon, label, status);

  const selectable =
    slot.status === "kosong" &&
    currentRole === "user";

  button.disabled = !selectable;

  if (selectable) {
    button.addEventListener("click", () => {
      selectedSlot = slot.id;
      renderParking();
    });
  }

  return button;
}

function renderParkingArea(context) {
  const rowA = document.getElementById(`${context}-row-a`);
  const rowB = document.getElementById(`${context}-row-b`);

  rowA.replaceChildren();
  rowB.replaceChildren();

  data.slots.forEach(slot => {
    const element = createSlotElement(slot);

    if (slot.id.startsWith("A")) {
      rowA.appendChild(element);
    } else {
      rowB.appendChild(element);
    }
  });
}

function renderParking() {
  const selectedIsAvailable = data.slots.some(
    slot =>
      slot.id === selectedSlot &&
      slot.status === "kosong"
  );

  if (!selectedIsAvailable || currentRole !== "user") {
    selectedSlot = null;
  }

  renderParkingArea("dashboard");
  renderParkingArea("booking");

  document.getElementById("selected-slot").value =
    selectedSlot || "";

  const dashboardButton = document.getElementById(
    "dashboard-book-btn"
  );

  dashboardButton.disabled = !selectedSlot;

  const selectionInfo = document.getElementById(
    "dashboard-selection"
  );

  selectionInfo.textContent = selectedSlot
    ? `Slot ${selectedSlot} tersedia untuk booking.`
    : "Pilih slot kosong untuk melanjutkan booking.";

  refreshIcons();
}

document.getElementById("dashboard-book-btn")
  .addEventListener("click", () => {
    if (selectedSlot && currentRole === "user") {
      navigate("booking");
    }
  });

// ==========================================
// BOOKING PARKIR
// ==========================================

document.getElementById("booking-form")
  .addEventListener("submit", event => {
    event.preventDefault();

    if (currentRole !== "user") return;

    const message = document.getElementById("booking-message");
    message.textContent = "";

    checkExpiredReservation();

    if (data.reservation) {
      message.textContent =
        "Masih ada reservasi aktif. Batalkan terlebih dahulu.";
      return;
    }

    const name = document.getElementById("customer-name")
      .value.trim();

    const plate = document.getElementById("vehicle-plate")
      .value.trim().toUpperCase();

    const vehicleType = document.getElementById("vehicle-type")
      .value;

    const slot = data.slots.find(
      item => item.id === selectedSlot
    );

    if (!slot || slot.status !== "kosong") {
      message.textContent =
        "Pilih slot parkir yang masih kosong.";
      return;
    }

    if (!name || !plate || !vehicleType) {
      message.textContent =
        "Lengkapi semua data kendaraan.";
      return;
    }

    const now = Date.now();

    data.reservation = {
      id: `EP-${now}`,
      slotId: slot.id,
      name,
      plate,
      vehicleType,
      createdAt: now,
      expiresAt: now + BOOKING_DURATION
    };

    slot.status = "reservasi";

    addActivity(
      slot.id,
      `Booking dibuat untuk ${plate}`
    );

    saveData();

    selectedSlot = null;

    document.getElementById("booking-form").reset();

    navigate("reservasi");
  });

// ==========================================
// TIMER RESERVASI
// ==========================================

function formatCountdown(milliseconds) {
  const totalSeconds = Math.max(
    0,
    Math.ceil(milliseconds / 1000)
  );

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return (
    `${String(minutes).padStart(2, "0")}:` +
    `${String(seconds).padStart(2, "0")}`
  );
}

function checkExpiredReservation() {
  const reservation = data.reservation;

  if (!reservation) return false;

  if (Date.now() < reservation.expiresAt) {
    return false;
  }

  const slot = data.slots.find(
    item => item.id === reservation.slotId
  );

  if (slot && slot.status === "reservasi") {
    slot.status = "kosong";
  }

  addActivity(
    reservation.slotId,
    "Reservasi kedaluwarsa"
  );

  data.reservation = null;
  saveData();

  return true;
}

// ==========================================
// TAMPILAN RESERVASI
// ==========================================

function makeDetailRow(label, value) {
  const row = document.createElement("div");
  row.className = "detail-row";

  const title = document.createElement("span");
  title.textContent = label;

  const description = document.createElement("strong");
  description.textContent = value;

  row.append(title, description);

  return row;
}

function renderReservation() {
  const container = document.getElementById(
    "reservation-container"
  );

  container.replaceChildren();

  const reservation = data.reservation;

  if (!reservation) {
    const empty = document.createElement("div");
    empty.className = "empty-state";

    const title = document.createElement("h3");
    title.textContent = "Belum Ada Reservasi Aktif";

    const description = document.createElement("p");
    description.textContent =
      "Silakan pilih slot parkir dan lakukan booking terlebih dahulu.";

    const button = document.createElement("button");
    button.className = "btn btn-primary";
    button.textContent = "Booking Sekarang";

    button.addEventListener("click", () => {
      navigate("booking");
    });

    empty.append(title, description, button);
    container.appendChild(empty);
    return;
  }

  const card = document.createElement("div");
  card.className = "reservation-card";

  const heading = document.createElement("h3");
  heading.textContent = "Reservasi Aktif";

  card.appendChild(heading);

  const details = [
    ["Kode Booking", reservation.id],
    ["Slot Parkir", reservation.slotId],
    ["Nama Pengendara", reservation.name],
    ["Nomor Kendaraan", reservation.plate],
    ["Jenis Kendaraan", reservation.vehicleType],
    [
      "Waktu Booking",
      new Date(reservation.createdAt)
        .toLocaleString("id-ID")
    ]
  ];

  details.forEach(([label, value]) => {
    card.appendChild(makeDetailRow(label, value));
  });

  const countdown = document.createElement("div");
  countdown.className = "countdown-box";

  const countdownTitle = document.createElement("p");
  countdownTitle.textContent = "Sisa Waktu Reservasi";

  const countdownValue = document.createElement("h2");
  countdownValue.id = "countdown";

  countdownValue.textContent = formatCountdown(
    reservation.expiresAt - Date.now()
  );

  countdown.append(countdownTitle, countdownValue);
  card.appendChild(countdown);

  const cancelButton = document.createElement("button");
  cancelButton.className = "btn btn-danger";
  cancelButton.textContent = "Batalkan Reservasi";

  cancelButton.addEventListener("click", cancelReservation);

  card.appendChild(cancelButton);
  container.appendChild(card);
}

function cancelReservation() {
  if (!data.reservation) return;

  const reservation = data.reservation;

  const confirmed = confirm(
    `Batalkan reservasi slot ${reservation.slotId}?`
  );

  if (!confirmed) return;

  const slot = data.slots.find(
    item => item.id === reservation.slotId
  );

  if (slot && slot.status === "reservasi") {
    slot.status = "kosong";
  }

  addActivity(
    reservation.slotId,
    "Reservasi dibatalkan"
  );

  data.reservation = null;
  saveData();
  renderAll();
}

// ==========================================
// MANAJEMEN PARKIR
// ==========================================

function renderManagement() {
  const table = document.getElementById(
    "management-table"
  );

  table.replaceChildren();

  const statusLabels = {
    kosong: "Kosong",
    terisi: "Terisi",
    reservasi: "Direservasi"
  };

  data.slots.forEach(slot => {
    const row = document.createElement("tr");

    const slotCell = document.createElement("td");
    slotCell.textContent = slot.id;

    const statusCell = document.createElement("td");

    const badge = document.createElement("span");
    badge.className =
      `status-badge status-${slot.status}`;

    badge.textContent = statusLabels[slot.status];
    statusCell.appendChild(badge);

    const actionCell = document.createElement("td");
    const select = document.createElement("select");
    select.className = "status-select";

    Object.entries(statusLabels).forEach(([value, label]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      select.appendChild(option);
    });

    select.value = slot.status;

    const hasActiveBooking =
      data.reservation &&
      data.reservation.slotId === slot.id;

    if (hasActiveBooking) {
      select.disabled = true;
      select.title =
        "Batalkan atau tunggu reservasi aktif berakhir.";
    }

    select.addEventListener("change", () => {
      if (currentRole !== "admin") return;

      const previousStatus = slot.status;
      slot.status = select.value;

      addActivity(
        slot.id,
        `Status ${previousStatus} menjadi ${slot.status}`
      );

      saveData();
      renderAll();
    });

    actionCell.appendChild(select);

    row.append(slotCell, statusCell, actionCell);
    table.appendChild(row);
  });
}

// ==========================================
// LAPORAN PARKIR
// ==========================================

function renderActivities() {
  const table = document.getElementById(
    "activity-table"
  );

  table.replaceChildren();

  if (data.activities.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = 3;
    cell.textContent = "Belum ada aktivitas.";
    cell.style.color = "#64748b";

    row.appendChild(cell);
    table.appendChild(row);
    return;
  }

  data.activities.forEach(activity => {
    const row = document.createElement("tr");

    const timeCell = document.createElement("td");
    timeCell.textContent = new Date(
      activity.time
    ).toLocaleString("id-ID");

    const slotCell = document.createElement("td");
    slotCell.textContent = activity.slot;

    const descriptionCell = document.createElement("td");
    descriptionCell.textContent = activity.description;

    row.append(
      timeCell,
      slotCell,
      descriptionCell
    );

    table.appendChild(row);
  });
}

// ==========================================
// EXPORT CSV
// ==========================================

function csvEscape(value) {
  const str = String(value ?? "");

  const safe = /^[\s]*[=+\-@]/.test(str)
    ? "'" + str
    : str;

  return '"' + safe.replace(/"/g, '""') + '"';
}

document.getElementById("export-csv")
  .addEventListener("click", () => {
    if (currentRole !== "admin") return;

    const rows = [
      ["Waktu", "Slot", "Aktivitas"],
      ...data.activities.map(activity => [
        new Date(activity.time).toLocaleString("id-ID"),
        activity.slot,
        activity.description
      ])
    ];

    const csv = rows.map(row =>
      row.map(csvEscape).join(",")
    ).join("\r\n");

    const blob = new Blob(
      ["\uFEFF", csv],
      { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "laporan-easy-park-lite.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  });

// ==========================================
// RENDER SEMUA KOMPONEN
// ==========================================

function renderAll() {
  checkExpiredReservation();

  updateStats();
  renderParking();
  renderReservation();
  renderManagement();
  renderActivities();

  refreshIcons();
}

// ==========================================
// TIMER OTOMATIS
// ==========================================

setInterval(() => {
  if (checkExpiredReservation()) {
    renderAll();
    return;
  }

  if (!data.reservation) return;

  const countdown = document.getElementById("countdown");

  if (countdown) {
    countdown.textContent = formatCountdown(
      data.reservation.expiresAt - Date.now()
    );
  }
}, 1000);

// ==========================================
// INISIALISASI APLIKASI
// ==========================================

updateRoleButtons();

const initialPage =
  window.location.hash.replace("#", "") || "dashboard";

navigate(initialPage);