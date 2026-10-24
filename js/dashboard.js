
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

    // 5. Demo overview data (replace with backend data later)
    setText("activeProjects", "0");
    setText("completedProjects", "0");
    setText("totalEarnings", "₹0");
    setText("pendingPayments", "₹0");

    
    // Load real projects into the Recent Projects dashboard card
    const recentProjectsList = get("recentProjectsList");
    const recentProjectsEmpty = get("recentProjectsEmpty");

    async function loadRecentProjects() {
        if (!recentProjectsList) return;

        try {
            
const API_BASE = "https://verilancer-backend.onrender.com/api";

const endpoint = isBusiness
    ? `${API_BASE}/projects/mine/${encodeURIComponent(user.id)}`
    : `${API_BASE}/projects`;

const response = await fetch(endpoint);
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

    // 11. Notification placeholder
    const notificationBtn = document.querySelector(".notification-btn");

    if (notificationBtn) {
        notificationBtn.addEventListener("click", function () {
            showComingSoon("Notifications");
        });
    }
});