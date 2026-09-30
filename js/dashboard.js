
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
    const userRole = user.role === "business" ? "business" : "professional";
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

    // 6. Main dashboard actions
    if (mainActionBtn) {
        mainActionBtn.addEventListener("click", function () {
            showComingSoon(
                isBusiness ? "Post Requirement" : "Explore Opportunities"
            );
        });
    }

    if (projectsAction) {
        projectsAction.addEventListener("click", function () {
            showComingSoon(
                isBusiness ? "Post Requirement" : "Project Discovery"
            );
        });
    }

    if (recommendationAction) {
        recommendationAction.addEventListener("click", function () {
            showComingSoon(
                isBusiness ? "Talent Discovery" : "Opportunities"
            );
        });
    }

    // 7. Quick action cards
    const quickCards = document.querySelectorAll(".quick-card");

    quickCards.forEach(function (card, index) {
        card.addEventListener("click", function (event) {
            event.preventDefault();

            const actions = isBusiness
                ? ["Profile", "Find Talent", "Post a Requirement"]
                : ["Profile", "Explore Opportunities", "Project Discovery"];

            showComingSoon(actions[index] || "This feature");
        });
    });

    // 8. Sidebar navigation placeholders
    const sidebarLinks = document.querySelectorAll(
        ".sidebar-nav .sidebar-link"
    );

    sidebarLinks.forEach(function (link) {
        if (link.getAttribute("href") === "#") {
            link.addEventListener("click", function (event) {
                event.preventDefault();

                const label = link.querySelector("span")?.textContent.trim()
                    || "This section";

                showComingSoon(label);

                // Close mobile sidebar after selection
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