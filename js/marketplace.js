
const API_BASE = "http://localhost:5001/api";

function getSavedUser() {
    try {
        if (localStorage.getItem("verilancerLoggedIn") !== "true") {
            return null;
        }

        return JSON.parse(localStorage.getItem("verilancerUser") || "null");
    } catch {
        return null;
    }
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function showMessage(element, message, type = "") {
    element.textContent = message;
    element.className = `form-message ${type}`.trim();
}


// -------------------------------
// POST A PROJECT
// -------------------------------
const projectForm = document.getElementById("projectForm");

if (projectForm) {
    const user = getSavedUser();
    const formMessage = document.getElementById("formMessage");
    const submitButton = document.getElementById("submitProject");
    const deadlineInput = document.getElementById("deadline");

    if (!user) {
        alert("Please log in to continue.");
        window.location.href = "login.html";
    } else if (user.role !== "client") {
        alert("Only business accounts can post projects.");
        window.location.href = "dashboard.html";
    }

    // Prevent selecting a deadline in the past.
    const today = new Date();
    const localToday = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
    ].join("-");

    deadlineInput.min = localToday;

    projectForm.addEventListener("submit", async event => {
        event.preventDefault();

        if (!user || user.role !== "client") return;

        const budgetValue = document.getElementById("budget").value;
        const deadline = deadlineInput.value;

        if (deadline && deadline < localToday) {
            showMessage(formMessage, "Please choose a future deadline.", "error");
            return;
        }

        const project = {
            businessId: user.id,
            title: document.getElementById("title").value.trim(),
            description: document.getElementById("description").value.trim(),
            category: document.getElementById("category").value,
            budget: budgetValue === "" ? null : Number(budgetValue),
            requiredSkills: document.getElementById("requiredSkills").value.trim(),
            deadline: deadline || null
        };

        submitButton.disabled = true;
        submitButton.textContent = "Publishing...";
        showMessage(formMessage, "");

        try {
            const response = await fetch(`${API_BASE}/projects`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(project)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to publish project.");
            }

            deadlineInput.min = localToday;

            showMessage(
                formMessage,
                "Project published successfully!",
                "success"
            );
        } catch (error) {
            console.error("Project publishing error:", error);
            showMessage(
                formMessage,
                error.message || "Unable to connect to the server.",
                "error"
            );
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Publish Project";
        }
    });
}


// -------------------------------
// BROWSE PROJECTS
// -------------------------------
const projectsList = document.getElementById("projectsList");

if (projectsList) {
    const user = getSavedUser();
    const projectsMessage = document.getElementById("projectsMessage");
    const searchInput = document.getElementById("projectSearch");
    const refreshButton = document.getElementById("refreshProjects");

    let allProjects = [];

    if (!user) {
        alert("Please log in to browse projects.");
        window.location.href = "login.html";
    } else {
        loadProjects();
    }

    function formatBudget(budget) {
        if (budget === null || budget === undefined || budget === "") {
            return "Budget not specified";
        }

        return "₹" + Number(budget).toLocaleString("en-IN", {
            maximumFractionDigits: 2
        });
    }

    function formatDeadline(deadline) {
        if (!deadline) return "Flexible";

        const datePart = String(deadline).slice(0, 10);
        const parts = datePart.split("-");

        if (parts.length !== 3) return escapeHtml(deadline);

        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    function renderProjects(projects) {
        if (projects.length === 0) {
            projectsList.innerHTML = `
                <div class="empty-state">
                    <h2>No projects found</h2>
                    <p class="muted">
                        Try another search, or check back for new opportunities.
                    </p>
                </div>
            `;
            return;
        }

        projectsList.innerHTML = projects.map(project => `
            <article class="project-card">
                <span class="project-category">
                    ${escapeHtml(project.category)}
                </span>

                <h2>${escapeHtml(project.title)}</h2>

                <p class="project-description">
                    ${escapeHtml(project.description)}
                </p>

                <p class="project-skills">
                    <strong>Skills:</strong>
                    ${escapeHtml(project.requiredSkills || "Not specified")}
                </p>

                <div class="project-meta">
                    <span><strong>Budget:</strong>
                        ${escapeHtml(formatBudget(project.budget))}
                    </span>
                    <span><strong>Deadline:</strong>
                        ${escapeHtml(formatDeadline(project.deadline))}
                    </span>
                </div>

                <p class="project-business">
                    Posted by ${escapeHtml(project.businessName || "Verilancer business")}
                </p>
            </article>
        `).join("");
    }

    function filterProjects() {
        const query = searchInput.value.trim().toLowerCase();

        const filtered = allProjects.filter(project => {
            const searchableText = [
                project.title,
                project.description,
                project.category,
                project.requiredSkills,
                project.businessName
            ].join(" ").toLowerCase();

            return searchableText.includes(query);
        });

        renderProjects(filtered);
    }

    async function loadProjects() {
        refreshButton.disabled = true;
        showMessage(projectsMessage, "Loading projects...");

        try {
            const response = await fetch(`${API_BASE}/projects`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to load projects.");
            }

            allProjects = data;
            filterProjects();
            showMessage(
                projectsMessage,
                `${allProjects.length} published project(s) available.`
            );
        } catch (error) {
            console.error("Project loading error:", error);
            showMessage(
                projectsMessage,
                "Unable to load projects. Check that the backend is running.",
                "error"
            );
        } finally {
            refreshButton.disabled = false;
        }
    }

    searchInput.addEventListener("input", filterProjects);
    refreshButton.addEventListener("click", loadProjects);
}
