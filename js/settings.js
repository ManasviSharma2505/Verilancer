document.addEventListener("DOMContentLoaded", async () => {
 const API_BASE = "http://localhost:5001/api";
 const get = id => document.getElementById(id);
 let user;
 try { user = JSON.parse(localStorage.getItem("verilancerUser")); } catch { user = null; }
 if (!user?.id || localStorage.getItem("verilancerLoggedIn") !== "true") {
  window.location.href = "login.html"; return;
 }
 const isBusiness = user.role === "client";
 get("headerUserName").textContent = user.name || "User";
 get("headerUserRole").textContent = isBusiness ? "Business" : "Professional";
 get("profileAvatar").textContent = (user.name || "U").trim().charAt(0).toUpperCase();
 get("accountRole").value = isBusiness ? "Business" : "Professional";
 const form = get("accountForm");
 const saveButton = get("saveAccount");
 const accountMessage = get("accountMessage");
 try {
  const response = await fetch(`${API_BASE}/profile/${encodeURIComponent(user.id)}`);
  const profile = await response.json();
  if (!response.ok) throw new Error(profile.message || "Unable to load account.");
  get("accountName").value = profile.name || user.name || "";
  get("accountEmail").value = profile.email || user.email || "";
 } catch (error) {
  accountMessage.textContent = error.message + " Make sure the local backend is running.";
  accountMessage.style.color = "#c0392b";
  get("accountName").value = user.name || "";
  get("accountEmail").value = user.email || "";
 }
 form.addEventListener("submit", async event => {
  event.preventDefault();
  const name = get("accountName").value.trim();
  if (!name) { accountMessage.textContent = "Please enter your name."; accountMessage.style.color = "#c0392b"; return; }
  saveButton.disabled = true; saveButton.textContent = "Saving...";
  accountMessage.textContent = "";
  try {
   const response = await fetch(`${API_BASE}/account/${encodeURIComponent(user.id)}/name`, {
    method: "PATCH", headers: {"Content-Type":"application/json"}, body: JSON.stringify({name})
   });
   const data = await response.json();
   if (!response.ok) throw new Error(data.message || "Unable to save changes.");
   user.name = name;
   localStorage.setItem("verilancerUser", JSON.stringify(user));
   get("headerUserName").textContent = name;
   get("profileAvatar").textContent = name.charAt(0).toUpperCase();
   accountMessage.textContent = "Your account name has been updated.";
   accountMessage.style.color = "#16803c";
  } catch (error) {
   accountMessage.textContent = error.message;
   accountMessage.style.color = "#c0392b";
  } finally { saveButton.disabled = false; saveButton.textContent = "Save changes"; }
 });
 const preferencesKey = `verilancerNotificationPreferences_${user.id}`;
 let preferences = {projects:true,messages:true};
 try { preferences = {...preferences,...JSON.parse(localStorage.getItem(preferencesKey) || "{}")}; } catch {}
 get("projectNotifications").checked = preferences.projects;
 get("messageNotifications").checked = preferences.messages;
 const savePreferences = () => {
  preferences = {projects:get("projectNotifications").checked,messages:get("messageNotifications").checked};
  localStorage.setItem(preferencesKey, JSON.stringify(preferences));
  const status = get("preferencesMessage");
  status.textContent = "Preferences saved in this browser.";
  status.style.color = "#16803c";
 };
 get("projectNotifications").addEventListener("change", savePreferences);
 get("messageNotifications").addEventListener("change", savePreferences);
 const logout = () => {
  if (!confirm("Are you sure you want to log out?")) return;
  localStorage.removeItem("verilancerLoggedIn");
  localStorage.removeItem("verilancerUser");
  window.location.href = "index.html";
 };
 get("logoutButton").addEventListener("click", event => {event.preventDefault();logout();});
 get("securityLogout").addEventListener("click", logout);
 get("paymentsLink").addEventListener("click", event => {event.preventDefault();alert("Payments are coming soon to Verilancer.");});
 const menuButton = get("mobileMenuBtn");
 const sidebar = document.querySelector(".sidebar");
 menuButton.addEventListener("click", () => sidebar.classList.toggle("mobile-open"));
 document.addEventListener("click", event => {
  if (window.innerWidth <= 768 && sidebar.classList.contains("mobile-open") && !sidebar.contains(event.target) && !menuButton.contains(event.target)) sidebar.classList.remove("mobile-open");
 });
});