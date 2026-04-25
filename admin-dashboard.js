function printReceipt(bookingId) {
  const token = localStorage.getItem("adminToken");

  if (!token) {
    alert("Session expired. Please login again.");
    window.location.href = "index.html"; // admin login
    return;
  }

  fetch(`https://vft-backend.onrender.com/api/admin/bookings/${bookingId}/receipt`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
    .then(res => {
      if (res.status === 401 || res.status === 403) {
        throw new Error("TOKEN_EXPIRED");
      }
      return res.blob();
    })
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "receipt.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    })
    .catch(err => {
      console.error(err);

      // 🔐 force logout on expired token
      localStorage.removeItem("adminToken");
      alert("Session expired. Please login again.");
      window.location.href = "index.html"; // admin login
    });
}