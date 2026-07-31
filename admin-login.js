const API_BASE_URL = window.location.hostname === "localhost"
  || window.location.hostname === "127.0.0.1"
  ? "http://localhost:5000"
  : "https://vft-backend.onrender.com";
const form = document.getElementById("loginForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
   const res = await fetch(
     `${API_BASE_URL}/api/admin/login`,
     {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ username, email, password })
     }
   );

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Login failed");
      return;
    }

    localStorage.setItem("adminToken", data.token);
    window.location.href = "admin-dashboard.html";

  } catch (err) {
    alert("Server error. Try again.");
    console.error(err);
  }
});