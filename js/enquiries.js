const token = localStorage.getItem("adminToken");

if (!token) {
  alert("Session expired. Please login again.");
  window.location.href = "/admin/login.html";
}

/* ==============================
   CONFIG
================================ */
const API_BASE_URL = "https://vft-backend.onrender.com";

// Change to your backend URL
// Example local:
// const API_BASE_URL = "http://localhost:5000";

/* ==============================
   DOM ELEMENTS
================================ */
const enquiryTable = document.getElementById("enquiryTable");
const totalEnquiriesEl = document.getElementById("totalEnquiries");
const newEnquiriesEl = document.getElementById("newEnquiries");
const confirmedEnquiriesEl = document.getElementById("confirmedEnquiries");
const pendingEnquiriesEl = document.getElementById("pendingEnquiries");

const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");

/* ==============================
   STATE
================================ */
let enquiries = [];

/* ==============================
   FETCH ENQUIRIES
================================ */
async function fetchEnquiries() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/enquiries`, {
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  }
});

    const data = await res.json();
    enquiries = data;

    updateStats();
    renderTable(enquiries);

  } catch (error) {
    console.error("Failed to fetch enquiries:", error);
  }
}

/* ==============================
   RENDER TABLE
================================ */
function renderTable(data) {
  enquiryTable.innerHTML = "";

  if (data.length === 0) {
    enquiryTable.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center; padding:1rem;">
          No enquiries found
        </td>
      </tr>
    `;
    return;
  }

  data.forEach(enquiry => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${enquiry.full_name || "-"}</td>
      <td>${enquiry.email || "-"}</td>
      <td>${enquiry.room_type || "-"}</td>
      <td>${formatDate(enquiry.check_in)}</td>
      <td>${formatDate(enquiry.check_out)}</td>
      <td>
        <select 
          class="status-dropdown ${enquiry.status || "new"}"
          onchange="updateStatus('${enquiry._id}', this.value)"
        >
          <option value="new" ${enquiry.status === "new" ? "selected" : ""}>New</option>
          <option value="contacted" ${enquiry.status === "contacted" ? "selected" : ""}>Contacted</option>
          <option value="confirmed" ${enquiry.status === "confirmed" ? "selected" : ""}>Confirmed</option>
          <option value="cancelled" ${enquiry.status === "cancelled" ? "selected" : ""}>Cancelled</option>
        </select>
      </td>
      <td class="actions">
        <button class="view-btn" onclick="viewEnquiry('${enquiry._id}')">View</button>
        <button class="delete-btn" onclick="deleteEnquiry('${enquiry._id}')">Delete</button>
      </td>
    `;

    enquiryTable.appendChild(tr);
  });
}
/* ==============================
   STATS
================================ */
function updateStats() {
  totalEnquiriesEl.textContent = enquiries.length;

  const newCount = enquiries.filter(e => !e.status || e.status === "new").length;
  const confirmedCount = enquiries.filter(e => e.status === "confirmed").length;
  const pendingCount = enquiries.filter(e => e.status === "contacted").length;

  newEnquiriesEl.textContent = newCount;
  confirmedEnquiriesEl.textContent = confirmedCount;
  pendingEnquiriesEl.textContent = pendingCount;
}

/* ==============================
   SEARCH & FILTER
================================ */
function applyFilters() {
  const search = searchInput.value.toLowerCase();
  const status = statusFilter.value;

  const filtered = enquiries.filter(e => {
    const matchesSearch =
      e.name?.toLowerCase().includes(search) ||
      e.email?.toLowerCase().includes(search) ||
      e.phone?.includes(search);

    const matchesStatus = !status || e.status === status;

    return matchesSearch && matchesStatus;
  });

  renderTable(filtered);
}

searchInput.addEventListener("input", applyFilters);
statusFilter.addEventListener("change", applyFilters);

/* ==============================
   ACTIONS (HOOK READY)
================================ */
function viewEnquiry(id) {
  const enquiry = enquiries.find(e => e._id === id);
  if (!enquiry) return;

  alert(`
Name: ${enquiry.full_name}
Email: ${enquiry.email}
Phone: ${enquiry.phone}
Country: ${enquiry.country}
Room Type: ${enquiry.room_type}
Rooms: ${enquiry.rooms}
Check-in: ${formatDate(enquiry.check_in)}
Check-out: ${formatDate(enquiry.check_out)}
Adults: ${enquiry.adults}
Children: ${enquiry.children}
Board: ${enquiry.board_preference}
Airport Transfer: ${enquiry.airport_transfer}
Arrival Time: ${enquiry.arrival_time || "N/A"}

Special Requests:
${enquiry.special_requests || "None"}
`);
}

/* ==============================
   DELETE ENQUIRY
================================ */
async function deleteEnquiry(id) {
  const confirmDelete = confirm("Are you sure you want to delete this enquiry?");
  if (!confirmDelete) return;

  try {
    await fetch(`${API_BASE_URL}/api/enquiries/${id}`, {
  method: "DELETE",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  }
});

    enquiries = enquiries.filter(e => e._id !== id);
    updateStats();
    renderTable(enquiries);

  } catch (error) {
    console.error("Failed to delete enquiry:", error);
  }
}

/* ==============================
   UPDATE STATUS ENQUIRY 
================================ */

async function updateStatus(id, newStatus) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/enquiries/${id}`, {
  method: "PATCH",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  },
  body: JSON.stringify({ status: newStatus })
});
    if (!res.ok) throw new Error("Status update failed");

    // Update local state
    const enquiry = enquiries.find(e => e._id === id);
    if (enquiry) enquiry.status = newStatus;

    updateStats();

  } catch (error) {
    alert("Failed to update status");
    console.error(error);
  }
}

/* ==============================
   HELPERS
================================ */
function formatDate(date) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString();
}

/* ==============================
   INIT
================================ */
fetchEnquiries();