const API_BASE = "http://localhost:5001/api";

document.addEventListener("DOMContentLoaded", async () => {
    const list = document.getElementById("myApplicationsList");
    const message = document.getElementById("applicationsMessage");

    let user = null;
    try {
        user = JSON.parse(localStorage.getItem("verilancerUser") || "null");
    } catch {
        user = null;
    }

    if (localStorage.getItem("verilancerLoggedIn") !== "true" || !user) {
        window.location.href = "login.html";
        return;
    }

    if (user.role !== "student") {
        message.textContent = "My Applications is available to professional accounts.";
        list.innerHTML = "";
        return;
    }

    // Keep the shared dashboard shell functional on this page.
    const displayName = user.name || "User";
    const headerName = document.getElementById("headerUserName");
    const avatar = document.getElementById("profileAvatar");
    if (headerName) headerName.textContent = displayName;
    if (avatar) avatar.textContent = displayName.trim().charAt(0).toUpperCase() || "U";

    const sidebar = document.querySelector(".sidebar");
    const menuButton = document.getElementById("mobileMenuBtn");
    if (menuButton && sidebar) {
        menuButton.addEventListener("click", () => {
            const open = sidebar.classList.toggle("mobile-open");
            menuButton.setAttribute("aria-expanded", String(open));
        });
    }

    document.querySelectorAll("[data-coming-soon]").forEach(link => {
        link.addEventListener("click", event => {
            event.preventDefault();
            alert(link.dataset.comingSoon + " is coming soon to Verilancer.");
        });
    });

    const logoutButton = document.querySelector("[data-dashboard-logout]");
    if (logoutButton) {
        logoutButton.addEventListener("click", event => {
            event.preventDefault();
            if (confirm("Are you sure you want to log out?")) {
                localStorage.removeItem("verilancerLoggedIn");
                localStorage.removeItem("verilancerUser");
                window.location.href = "index.html";
            }
        });
    }

    const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);

    const money = value => value === null || value === undefined || value === ""
        ? "Not specified"
        : "₹" + Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 });

    const date = value => value
        ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
        : "Date unavailable";

    try {
        const response = await fetch(`${API_BASE}/applications/mine/${encodeURIComponent(user.id)}`);
        const applications = await response.json();

        if (!response.ok) throw new Error(applications.message || "Unable to load your applications.");

        if (!Array.isArray(applications) || applications.length === 0) {
            list.innerHTML = `
                <div class="applications-empty">
                    <h2>No applications yet</h2>
                    <p>When you submit a proposal for a project, it will appear here.</p>
                    <a href="projects.html">Explore Projects</a>
                </div>`;
            return;
        }

        list.innerHTML = applications.map(application => {
            const status = String(application.applicationStatus || "pending").toLowerCase();
            return `
                <article class="application-card">
                    <div class="application-card-top">
                        <span class="application-category">${escapeHtml(application.category || "Project")}</span>
                        <span class="application-status ${escapeHtml(status)}">${escapeHtml(status)}</span>
                    </div>
                    <h2>${escapeHtml(application.title || "Untitled project")}</h2>
                    <p class="application-business">Posted by ${escapeHtml(application.businessName || "Business")}</p>
                    <div class="application-meta">
                        <span>Project budget<strong>${money(application.budget)}</strong></span>
                        <span>Your bid<strong>${money(application.bidAmount)}</strong></span>
                        <span>Deadline<strong>${escapeHtml(date(application.deadline))}</strong></span>
                        <span>Applied on<strong>${escapeHtml(date(application.appliedAt))}</strong></span>
                        <span>Project status<strong>${escapeHtml(application.projectStatus || "Unknown")}</strong></span>
                    </div>
                    <div class="application-proposal">
                        <h3>Your proposal</h3>
                        <p>${escapeHtml(application.proposal)}</p>
                    </div>
                    ${status === "accepted" ? `
                        <a class="application-message-link" href="messages.html?applicationId=${Number(application.applicationId)}">
                            Message Business
                        </a>
                    ` : ""}
                </article>`;
        }).join("");
    } catch (error) {
        console.error("My applications error:", error);
        message.textContent = error.message || "Couldn't load your applications. Check that the backend is running.";
        list.innerHTML = "";
    }
});