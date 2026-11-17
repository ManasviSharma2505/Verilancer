
document.addEventListener("DOMContentLoaded", function () {
    // 1. Check login and load the saved user
    const savedUser = localStorage.getItem("verilancerUser");
    const isLoggedIn = localStorage.getItem("verilancerLoggedIn");

    if (!savedUser || isLoggedIn !== "true") {
        window.location.href = "login.html";
        return;
    }

    let user;

    try {
        user = JSON.parse(savedUser);
    } catch (error) {
        localStorage.removeItem("verilancerLoggedIn");
        window.location.href = "login.html";
        return;
    }

    const userName = user.name || "User";
    const userRole = user.role === "client" ? "business" : "professional";
    const isBusiness = userRole === "business";

    // 2. Helper functions
    const get = (id) => document.getElementById(id);

    const setText = (id, value) => {
        const element = get(id);
        if (element) element.textContent = value;
    };

    const showComingSoon = (feature) => {
        alert(`${feature} is coming soon to Verilancer.`);
    };

    // 3. Personalize the user information
    setText("welcomeUserName", userName);
    setText("headerUserName", userName);
    setText("headerUserRole", isBusiness ? "Business" : "Professional");
    setText("profileAvatar", userName.trim().charAt(0).toUpperCase() || "U");

    // 4. Role-based dashboard content
    setText(
        "welcomeDescription",
        isBusiness
            ? "Manage your projects, discover talent and grow your business."
            : "Discover opportunities, manage your projects and grow your career."
    );

    const mainActionBtn = get("mainActionBtn");
    const projectsAction = get("projectsAction");
    const recommendationAction = get("recommendationAction");

    const postRequirementCard = get("postRequirementCard");

if (postRequirementCard) {
    postRequirementCard.style.display = isBusiness ? "" : "none";
}

    if (mainActionBtn) {
        mainActionBtn.innerHTML = isBusiness
            ? '<i class="fa-solid fa-plus"></i><span>Post a Requirement</span>'
            : '<i class="fa-solid fa-magnifying-glass"></i><span>Explore Opportunities</span>';
    }

    setText(
        "recommendationTitle",
        isBusiness ? "Find the Right Talent" : "Recommended Opportunities"
    );

    setText(
        "recommendationSubtitle",
        isBusiness
            ? "Discover professionals who can help bring your ideas to life."
            : "Explore projects that may match your skills and interests."
    );

    setText(
        "recommendationAction",
        isBusiness ? "Find Talent" : "Explore Opportunities"
    );

    setText(
        "projectsAction",
        isBusiness ? "Post a Requirement" : "Explore Projects"
    );

    // 5. Load live dashboard statistics from the local API.
    const API_BASE = "http://localhost:5001/api";

    async function loadDashboardStats() {
        try {
            if (isBusiness) {
                setText("statLabelOne", "Published Projects");
                setText("statLabelTwo", "Closed Projects");
                setText("statLabelThree", "Proposals Received");
                setText("statLabelFour", "Pending Proposals");

                const response = await fetch(
                    `${API_BASE}/projects/mine/${encodeURIComponent(user.id)}`
                );
                const projects = await response.json();

                if (!response.ok || !Array.isArray(projects)) {
                    throw new Error(projects.message || "Unable to load business statistics.");
                }

                let proposalCount = 0;
                let pendingCount = 0;

                await Promise.all(projects.map(async project => {
                    const proposalResponse = await fetch(
                        `${API_BASE}/projects/${encodeURIComponent(project.id)}/applications?businessId=${encodeURIComponent(user.id)}`
                    );
                    const proposals = await proposalResponse.json();

                    if (!proposalResponse.ok || !Array.isArray(proposals)) {
                        throw new Error(proposals.message || "Unable to load proposal statistics.");
                    }

                    proposalCount += proposals.length;
                    pendingCount += proposals.filter(item =>
                        String(item.status).toLowerCase() === "pending"
                    ).length;
                }));

                setText("activeProjects", projects.filter(project =>
                    String(project.status).toLowerCase() === "published"
                ).length);
                setText("completedProjects", projects.filter(project =>
                    String(project.status).toLowerCase() === "closed"
                ).length);
                setText("totalEarnings", proposalCount);
                setText("pendingPayments", pendingCount);
            } else {
                setText("statLabelOne", "Applications Sent");
                setText("statLabelTwo", "Accepted Bids");
                setText("statLabelThree", "Pending Responses");
                setText("statLabelFour", "Rejected Bids");

                const response = await fetch(
                    `${API_BASE}/applications/mine/${encodeURIComponent(user.id)}`
                );
                const applications = await response.json();

                if (!response.ok || !Array.isArray(applications)) {
                    throw new Error(applications.message || "Unable to load application statistics.");
                }

                const statuses = applications.map(item =>
                    String(item.applicationStatus || "pending").toLowerCase()
                );

                setText("activeProjects", applications.length);
                setText("completedProjects", statuses.filter(status => status === "accepted").length);
                setText("totalEarnings", statuses.filter(status => status === "pending").length);
                setText("pendingPayments", statuses.filter(status => status === "rejected").length);
            }
        } catch (error) {
            console.error("Dashboard statistics error:", error);
            ["activeProjects", "completedProjects", "totalEarnings", "pendingPayments"]
                .forEach(id => setText(id, "—"));
        }
    }

    loadDashboardStats();

    
    // Load real projects into the Recent Projects dashboard card
    const recentProjectsList = get("recentProjectsList");
    const recentProjectsEmpty = get("recentProjectsEmpty");

    async function loadRecentProjects() {
        if (!recentProjectsList) return;

        try {
            
const endpoint = isBusiness
    ? `${API_BASE}/projects/mine/${encodeURIComponent(user.id)}`
    : `${API_BASE}/projects`;

const response = await fetch(endpoint.replace("https://verilancer-backend.onrender.com/api", API_BASE));
const projects = await response.json();


            if (!response.ok) {
                throw new Error(projects.message || "Unable to load projects.");
            }

            if (!Array.isArray(projects) || projects.length === 0) {
                recentProjectsList.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">
                            <i class="fa-solid fa-folder-open"></i>
                        </div>
                        <h4>No projects yet</h4>
                        <p>${
                            isBusiness
                                ? "Projects you publish will appear here."
                                : "New opportunities from businesses will appear here."
                        }</p>
                        <button class="secondary-action" id="projectsAction" type="button">
                            ${isBusiness ? "Post a Requirement" : "Explore Projects"}
                        </button>
                    </div>
                `;

                get("projectsAction")?.addEventListener("click", () => {
                    window.location.href = isBusiness
                        ? "post-project.html"
                        : "projects.html";
                });

                return;
            }

            const recentProjects = projects.slice(0, 3);

            recentProjectsList.innerHTML = recentProjects.map(project => `
                <article class="recent-project-item">
                    <div class="recent-project-heading">
                        <h4>${escapeDashboardHtml(project.title)}</h4>
                        <span class="recent-project-category">
                            ${escapeDashboardHtml(project.category)}
                        </span>
                    </div>
                    <p class="recent-project-description">
                        ${escapeDashboardHtml(project.description)}
                    </p>
                    <div class="recent-project-meta">
                        <span>Budget: ${
                            project.budget === null || project.budget === undefined
                                ? "Not specified"
                                : "₹" + Number(project.budget).toLocaleString("en-IN")
                        }</span>
                        ${
                            project.deadline
                                ? `<span>Deadline: ${escapeDashboardHtml(String(project.deadline).slice(0, 10))}</span>`
                                : ""
                        }
                    </div>
                </article>
            `).join("");

        } catch (error) {
            console.error("Recent projects error:", error);

            recentProjectsList.innerHTML = `
                <div class="empty-state">
                    <h4>Projects couldn't be loaded</h4>
                    <p>Please make sure the Verilancer backend is running, then refresh.</p>
                </div>
            `;
        }
    }

    function escapeDashboardHtml(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]);
    }

    loadRecentProjects();

    
    // 6. Main dashboard actions
    const openMarketplace = () => {
        window.location.href = isBusiness
            ? "post-project.html"
            : "projects.html";
    };

    if (mainActionBtn) {
        mainActionBtn.addEventListener("click", openMarketplace);
    }

    if (projectsAction) {
        projectsAction.addEventListener("click", openMarketplace);
    }

    if (recommendationAction) {
        recommendationAction.addEventListener("click", openMarketplace);
    }

    // 7. Quick action cards
    const quickCards = document.querySelectorAll(".quick-card");

    quickCards.forEach(function (card, index) {
        card.addEventListener("click", function (event) {
            event.preventDefault();

            if (index === 0) {
            window.location.href = "profile.html";
            return;
            }

            if (index === 1) {
                // Explore opportunities / find talent
                openMarketplace();
                return;
            }

            if (index === 2) {
                // Business can post a project; professional can browse
                openMarketplace();
            }
        });
    });

    
    // 8. Sidebar navigation
    const sidebarLinks = document.querySelectorAll(
        ".sidebar-nav .sidebar-link"
    );

    sidebarLinks.forEach(function (link) {
        const label = link.querySelector("span")?.textContent.trim() || "";
        const normalizedLabel = label.toLowerCase();

        if (normalizedLabel.includes("find projects")) {
            link.addEventListener("click", function (event) {
                event.preventDefault();
                window.location.href = "projects.html";
            });
        } else if (normalizedLabel.includes("my projects")) {
            link.addEventListener("click", function (event) {
                event.preventDefault();
                window.location.href = "my-projects.html";
            });
        } else if (link.getAttribute("href") === "#") {
            link.addEventListener("click", function (event) {
                event.preventDefault();
                showComingSoon(label || "This section");

                const sidebar = document.querySelector(".sidebar");
                if (sidebar) sidebar.classList.remove("mobile-open");
            });
        }
    });


    // 9. Logout with final confirmation
    const logoutButton = document.querySelector(
        "[data-dashboard-logout]"
    );

    if (logoutButton) {
        logoutButton.addEventListener("click", function (event) {
            event.preventDefault();

            const confirmLogout = confirm(
                "Are you sure you want to log out?"
            );

            if (confirmLogout) {
                localStorage.removeItem("verilancerLoggedIn");
                localStorage.removeItem("verilancerUser");

                window.location.href = "index.html";
            }
        });
    }

    // 10. Mobile sidebar toggle
    const mobileMenuBtn = get("mobileMenuBtn");
    const sidebar = document.querySelector(".sidebar");

    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.setAttribute("aria-expanded", "false");

        mobileMenuBtn.addEventListener("click", function () {
            const isOpen = sidebar.classList.toggle("mobile-open");
            mobileMenuBtn.setAttribute("aria-expanded", String(isOpen));
        });

        // Close sidebar when clicking outside it on mobile
        document.addEventListener("click", function (event) {
            if (
                window.innerWidth <= 768 &&
                sidebar.classList.contains("mobile-open") &&
                !sidebar.contains(event.target) &&
                !mobileMenuBtn.contains(event.target)
            ) {
                sidebar.classList.remove("mobile-open");
                mobileMenuBtn.setAttribute("aria-expanded", "false");
            }
        });

        // Reset sidebar state when returning to desktop
        window.addEventListener("resize", function () {
            if (window.innerWidth > 768) {
                sidebar.classList.remove("mobile-open");
                mobileMenuBtn.setAttribute("aria-expanded", "false");
            }
        });
    }

    // 11. Load and display real project/proposal notifications.
    const notificationBtn = get("notificationBtn");
    const notificationPanel = get("notificationPanel");
    const notificationList = get("notificationList");
    const notificationCount = get("notificationCount");
    const closeNotifications = get("closeNotifications");
    let notificationItems = [];

    function renderNotifications() {
        if (!notificationList) return;
        const unreadCount = notificationItems.filter(item => !Number(item.isRead)).length;
        if (notificationCount) {
            notificationCount.hidden = unreadCount === 0;
            notificationCount.textContent = unreadCount > 9 ? "9+" : String(unreadCount);
        }
        if (!notificationItems.length) {
            notificationList.innerHTML = '<div class="notification-empty"><i class="fa-regular fa-bell-slash"></i><strong>You’re all caught up</strong><span>New project and proposal updates will appear here.</span></div>';
            return;
        }
        notificationList.innerHTML = notificationItems.map(item => {
            const safeTitle = escapeDashboardHtml(item.title);
            const safeMessage = escapeDashboardHtml(item.message);
            const date = item.createdAt ? new Date(item.createdAt).toLocaleString([], {dateStyle:"medium",timeStyle:"short"}) : "";
            return `<button type="button" class="notification-item ${Number(item.isRead) ? "" : "unread"}" data-notification-id="${Number(item.id)}" data-application-id="${Number(item.applicationId) || ""}" data-notification-type="${escapeDashboardHtml(item.type)}">
                <span class="notification-item-icon"><i class="fa-regular fa-bell"></i></span>
                <span class="notification-item-content"><strong>${safeTitle}</strong><span>${safeMessage}</span><small>${escapeDashboardHtml(date)}</small></span>
                ${Number(item.isRead) ? "" : '<span class="notification-unread-dot"></span>'}
            </button>`;
        }).join("");
    }

    async function loadNotifications() {
        if (!notificationList) return;
        try {
            const response = await fetch(`${API_BASE}/notifications/${encodeURIComponent(user.id)}`);
            const data = await response.json();
            if (!response.ok || !Array.isArray(data)) throw new Error(data.message || "Unable to load notifications.");
            notificationItems = data;
            renderNotifications();
        } catch (error) {
            console.error("Notifications error:", error);
            notificationList.innerHTML = '<p class="notification-empty">Notifications could not be loaded. Please refresh the page.</p>';
        }
    }

    async function openNotification(item) {
        if (!Number(item.isRead)) {
            try {
                const response = await fetch(`${API_BASE}/notifications/${encodeURIComponent(item.id)}/read`, {
                    method: "PATCH", headers: {"Content-Type":"application/json"},
                    body: JSON.stringify({userId: user.id})
                });
                if (!response.ok) throw new Error("Unable to mark notification as read.");
                item.isRead = 1;
                renderNotifications();
            } catch (error) { console.error(error); }
        }
        const applicationId = Number(item.applicationId);
        if (item.type === "proposal_received") {
            window.location.href = "my-projects.html";
        } else if (item.type === "proposal_accepted" && applicationId) {
            window.location.href = `messages.html?applicationId=${applicationId}`;
        } else if (applicationId) {
            window.location.href = "applications.html";
        }
    }

    if (notificationBtn && notificationPanel) {
        notificationBtn.addEventListener("click", () => {
            const isOpen = !notificationPanel.hidden;
            notificationPanel.hidden = isOpen;
            notificationBtn.setAttribute("aria-expanded", String(!isOpen));
            if (!isOpen) loadNotifications();
        });
        closeNotifications?.addEventListener("click", () => {
            notificationPanel.hidden = true;
            notificationBtn.setAttribute("aria-expanded", "false");
        });
        notificationList?.addEventListener("click", event => {
            const itemElement = event.target.closest("[data-notification-id]");
            if (!itemElement) return;
            const item = notificationItems.find(entry => Number(entry.id) === Number(itemElement.dataset.notificationId));
            if (item) openNotification(item);
        });
        document.addEventListener("click", event => {
            if (!event.target.closest(".notification-wrapper")) {
                notificationPanel.hidden = true;
                notificationBtn.setAttribute("aria-expanded", "false");
            }
        });
        loadNotifications();
        window.setInterval(loadNotifications, 30000);
    }
});