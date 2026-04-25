const API_BASE = "https://vft-backend.onrender.com";
const token = localStorage.getItem("adminToken");

// 🔒 Hard guard: no token → login
if (!token) {
  alert("Please login first");
  window.location.href = "/index.html";
}

// 🔓 Logout function
function forceLogout(message = "Session expired. Please login again.") {
  localStorage.removeItem("adminToken");
  alert(message);
  window.location.href = "/index.html";
}

// 📦 Fetch bookings safely
async function loadBookings() {
  try {
    const res = await fetch(`${API_BASE}/api/admin/bookings`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // 🔴 ONLY logout on auth errors
    if (res.status === 401 || res.status === 403) {
      forceLogout();
      return;
    }

    if (!res.ok) {
      console.error("Failed to load bookings:", res.status);
      return; // ❗ do NOT logout
    }

    const bookings = await res.json();
    renderBookings(bookings);

  } catch (err) {
    console.error("Network error:", err);
    // ❗ do NOT logout on network failure
  }
}

// 🧾 Render bookings
function renderBookings(bookings) {
  const tbody = document.getElementById("bookingTableBody");
  tbody.innerHTML = "";

  if (!Array.isArray(bookings) || bookings.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5">No bookings found</td></tr>`;
    return;
  }

  bookings.forEach(b => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${b.ref || "-"}</td>
      <td>${b.name || "-"}</td>
      <td>${b.email || "-"}</td>
      <td>${b.total || "-"}</td>
      <td>
        <button onclick="printReceipt('${b._id}')">Receipt</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// 🧾 Receipt download (SAFE)
function printReceipt(bookingId) {
  fetch(`${API_BASE}/api/admin/bookings/${bookingId}/receipt`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
    .then(res => {
      if (res.status === 401 || res.status === 403) {
        forceLogout();
        throw new Error("Unauthorized");
      }
      return res.blob();
    })
    .then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "receipt.pdf";
      a.click();
      URL.revokeObjectURL(url);
    })
    .catch(err => console.error(err));
}

// 🚀 Load dashboard
loadBookings();

// 🔴 Logout button
document.getElementById("logoutBtn")?.addEventListener("click", () => {
  localStorage.removeItem("adminToken");
  window.location.href = "/index.html";
});