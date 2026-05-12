const token = localStorage.getItem("adminToken");

if (!token) {
  alert("Session expired. Please login again.");
  window.location.href = "index.html";
}

const API_BASE_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000"
    : "https://vft-backend.onrender.com";

const enquiryTable = document.getElementById("enquiryTable");
const totalEnquiriesEl = document.getElementById("totalEnquiries");
const newEnquiriesEl = document.getElementById("newEnquiries");
const confirmedEnquiriesEl = document.getElementById("confirmedEnquiries");
const pendingEnquiriesEl = document.getElementById("pendingEnquiries");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");

let enquiries = [];

function getHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };
}

async function parseJsonSafely(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

async function handleAuth(response) {
  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem("adminToken");
    alert("Session expired. Please login again.");
    window.location.href = "index.html";
    throw new Error("AUTH_EXPIRED");
  }

  return response;
}

function getCurrentFilteredEnquiries() {
  const search = searchInput.value.trim().toLowerCase();
  const status = statusFilter.value;

  return enquiries.filter((enquiry) => {
    const matchesSearch =
      enquiry.full_name?.toLowerCase().includes(search) ||
      enquiry.email?.toLowerCase().includes(search) ||
      enquiry.phone?.toLowerCase().includes(search);

    const matchesStatus = !status || (enquiry.status || "new") === status;
    return matchesSearch && matchesStatus;
  });
}

async function fetchEnquiries() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/enquiries`, {
      headers: getHeaders()
    });

    await handleAuth(response);
    const data = await parseJsonSafely(response);

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch enquiries");
    }

    enquiries = Array.isArray(data) ? data : [];
    updateStats();
    renderTable(getCurrentFilteredEnquiries());
  } catch (error) {
    if (error.message !== "AUTH_EXPIRED") {
      console.error("Failed to fetch enquiries:", error);
      alert(error.message || "Failed to fetch enquiries");
    }
  }
}

function renderTable(data) {
  enquiryTable.innerHTML = "";

  if (!data.length) {
    enquiryTable.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding:1rem;">
          No enquiries found
        </td>
      </tr>
    `;
    return;
  }

  data.forEach((enquiry) => {
    const currentStatus = enquiry.status || "new";
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${enquiry.full_name || "-"}</td>
      <td>${enquiry.email || "-"}</td>
      <td>${enquiry.room_type || "-"}</td>
      <td>${formatDate(enquiry.check_in)}</td>
      <td>${formatDate(enquiry.check_out)}</td>
      <td>
        <select 
          class="status-dropdown ${currentStatus}"
          data-previous-status="${currentStatus}"
          onchange="updateStatus('${enquiry._id}', this)"
        >
          <option value="new" ${currentStatus === "new" ? "selected" : ""}>New</option>
          <option value="contacted" ${currentStatus === "contacted" ? "selected" : ""}>Contacted</option>
          <option value="confirmed" ${currentStatus === "confirmed" ? "selected" : ""}>Confirmed</option>
          <option value="cancelled" ${currentStatus === "cancelled" ? "selected" : ""}>Cancelled</option>
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

function updateStats() {
  totalEnquiriesEl.textContent = enquiries.length;
  newEnquiriesEl.textContent = enquiries.filter((e) => (e.status || "new") === "new").length;
  confirmedEnquiriesEl.textContent = enquiries.filter((e) => e.status === "confirmed").length;
  pendingEnquiriesEl.textContent = enquiries.filter((e) => e.status === "contacted").length;
}

function applyFilters() {
  renderTable(getCurrentFilteredEnquiries());
}

function viewEnquiry(id) {
  const enquiry = enquiries.find((item) => item._id === id);
  if (!enquiry) return;

  alert(`
Name: ${enquiry.full_name || "-"}
Email: ${enquiry.email || "-"}
Phone: ${enquiry.phone || "-"}
Country: ${enquiry.country || "-"}
Room Type: ${enquiry.room_type || "-"}
Rooms: ${enquiry.rooms || "-"}
Check-in: ${formatDate(enquiry.check_in)}
Check-out: ${formatDate(enquiry.check_out)}
Adults: ${enquiry.adults || "-"}
Children: ${enquiry.children ?? "-"}
Board: ${enquiry.board_preference || "-"}
Airport Transfer: ${enquiry.airport_transfer || "-"}
Preferred Contact: ${enquiry.contact_method || "-"}
Arrival Time: ${enquiry.arrival_time || "N/A"}
Status: ${enquiry.status || "new"}

Special Requests:
${enquiry.special_requests || "None"}
`);
}

async function deleteEnquiry(id) {
  const confirmDelete = confirm("Are you sure you want to delete this enquiry?");
  if (!confirmDelete) return;

  try {
    const response = await fetch(`${API_BASE_URL}/api/enquiries/${id}`, {
      method: "DELETE",
      headers: getHeaders()
    });

    await handleAuth(response);
    const data = await parseJsonSafely(response);

    if (!response.ok) {
      throw new Error(data.message || "Failed to delete enquiry");
    }

    enquiries = enquiries.filter((enquiry) => enquiry._id !== id);
    updateStats();
    applyFilters();
  } catch (error) {
    if (error.message !== "AUTH_EXPIRED") {
      console.error("Failed to delete enquiry:", error);
      alert(error.message || "Failed to delete enquiry");
    }
  }
}

async function updateStatus(id, selectElement) {
  const newStatus = selectElement.value;
  const previousStatus = selectElement.dataset.previousStatus || "new";

  try {
    const response = await fetch(`${API_BASE_URL}/api/enquiries/${id}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ status: newStatus })
    });

    await handleAuth(response);
    const data = await parseJsonSafely(response);

    if (!response.ok) {
      throw new Error(data.message || "Failed to update enquiry status");
    }

    const enquiry = enquiries.find((item) => item._id === id);
    if (enquiry) {
      enquiry.status = data.enquiry?.status || newStatus;
    }

    selectElement.className = `status-dropdown ${enquiry?.status || newStatus}`;
    selectElement.dataset.previousStatus = enquiry?.status || newStatus;
    updateStats();
    applyFilters();
  } catch (error) {
    selectElement.value = previousStatus;
    selectElement.className = `status-dropdown ${previousStatus}`;

    if (error.message !== "AUTH_EXPIRED") {
      console.error("Failed to update status:", error);
      alert(error.message || "Failed to update enquiry status");
    }
  }
}

function formatDate(date) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString();
}

searchInput.addEventListener("input", applyFilters);
statusFilter.addEventListener("change", applyFilters);

fetchEnquiries();
