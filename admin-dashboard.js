function printReceipt(bookingId) {
  const token = localStorage.getItem("adminToken");

  if (!token) {
    alert("You are not logged in");
    return;
  }

  fetch(`https://vft-backend.onrender.com/api/admin/bookings/${bookingId}/receipt`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
    .then(res => {
      if (!res.ok) throw new Error("Unauthorized");
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
      alert("Session expired. Please login again.");
    });
}