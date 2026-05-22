// Add default admins if not already present
(function () {
  let users = JSON.parse(localStorage.getItem("users")) || [];
  // Check if any admin exists
  const hasAdmin = users.some(u => u.role === "admin");
  if (!hasAdmin) {
    users.push(
      { id: "1", username: "admin1", password: "admin123", role: "admin", email: "admin1@hospital.com", status: "Active" },
      { id: "2", username: "admin2", password: "admin456", role: "admin", email: "admin2@hospital.com", status: "Active" },
      { id: "3", username: "mario", password: "m1", role: "admin", email: "admin3@hospital.com", status: "Active" }
    );
    localStorage.setItem("users", JSON.stringify(users));
  }
})();

document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const username = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPassword").value;
  const users = JSON.parse(localStorage.getItem("users")) || [];
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    localStorage.setItem("loggedInUser", JSON.stringify(user));
    if (user.role === "admin") {
      window.location.href = "admin.html";
    } else if (user.role === "doctor") {
      window.location.href = "doctor.html";
    } else {
      window.location.href = "patient.html";
    }
  } else {
    document.getElementById("loginMsg").textContent = "Incorrect username or password";
  }
});
