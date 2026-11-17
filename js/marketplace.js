
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

alert("Project published successfully!");
window.location.href = "dashboard.html";
return;


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
                Posted by ${escapeHtml(
                    project.businessName || "Verilancer business"
                )}
            </p>

            ${user?.role === "student" ? `
                <button
                    type="button"
                    class="apply-project-btn"
                    data-project-id="${Number(project.id)}">
                    Apply to Project
                </button>
            ` : ""}
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

    searchInput.addEventListener("input", filterProjects);if (projectsList)
    refreshButton.addEventListener("click", loadProjects);

    

projectsList.addEventListener("click", async event => {
    const button = event.target.closest(".apply-project-btn");
    if (!button) return;

    const user = getSavedUser();

    if (!user || user.role !== "student") {
        showMessage(
            projectsMessage,
            "Please log in with a professional account to apply.",
            "error"
        );
        return;
    }

    // Create the modal once.
    let modal = document.getElementById("applicationModal");

    if (!modal) {
        modal = document.createElement("div");
        modal.id = "applicationModal";
        modal.className = "application-modal";
        modal.innerHTML = `
            <div class="application-modal-backdrop"
                 data-close-modal></div>

            <section class="application-dialog"
                     role="dialog"
                     aria-modal="true"
                     aria-labelledby="applicationTitle">

                <div class="application-heading">
                    <div>
                        <span class="application-eyebrow">
                            VERILANCER APPLICATION
                        </span>
                        <h2 id="applicationTitle">
                            Submit Your Proposal
                        </h2>
                        <p id="applicationProjectTitle"></p>
                    </div>

                    <button type="button"
                            class="application-close"
                            aria-label="Close application"
                            data-close-modal>&times;</button>
                </div>

                <div id="applicationProfile"
                     class="application-profile">
                    Loading your profile...
                </div>

                <form id="applicationForm">
                    <div class="application-field">
                        <label for="applicationBid">
                            Your Bid Amount (₹)
                        </label>
                        <input
                            type="number"
                            id="applicationBid"
                            min="0.01"
                            step="0.01"
                            placeholder="Enter your bid"
                            required>
                    </div>

                    <div class="application-field">
                        <label for="applicationProposal">
                            Your Proposal
                        </label>
                        <textarea
                            id="applicationProposal"
                            rows="5"
                            maxlength="5000"
                            placeholder="Explain how you will complete this project..."
                            required></textarea>
                    </div>

                    <p id="applicationFormMessage"
                       class="application-form-message"
                       role="status"></p>

                    <div class="application-actions">
                        <button type="button"
                                class="application-cancel"
                                data-close-modal>
                            Cancel
                        </button>

                        <button type="submit"
                                class="application-submit"
                                id="submitApplication">
                            Submit Proposal
                            <span aria-hidden="true">→</span>
                        </button>
                    </div>
                </form>
            </section>
        `;

        document.body.appendChild(modal);

        modal.addEventListener("click", event => {
            if (event.target.closest("[data-close-modal]")) {
                if (modal.dataset.submitting === "true") return;

                modal.classList.remove("is-open");
                document.body.classList.remove("modal-open");
            }
        });

        document.addEventListener("keydown", event => {
            if (
                event.key === "Escape" &&
                modal.classList.contains("is-open") &&
                modal.dataset.submitting !== "true"
            ) {
                modal.classList.remove("is-open");
                document.body.classList.remove("modal-open");
            }
        });

        modal.querySelector("#applicationForm")
            .addEventListener("submit", async event => {
                event.preventDefault();

                const submitButton =
                    modal.querySelector("#submitApplication");
                const message =
                    modal.querySelector("#applicationFormMessage");
                const bidInput =
                    modal.querySelector("#applicationBid");
                const proposalInput =
                    modal.querySelector("#applicationProposal");

                const bidAmount = Number(bidInput.value);
                const proposal = proposalInput.value.trim();
                const projectId = Number(modal.dataset.projectId);

                if (!Number.isFinite(bidAmount) || bidAmount <= 0) {
                    message.textContent =
                        "Enter a bid amount greater than zero.";
                    return;
                }

                if (!proposal) {
                    message.textContent =
                        "Please write your proposal.";
                    return;
                }

                submitButton.disabled = true;
                submitButton.textContent = "Submitting...";
                message.textContent = "";
                modal.dataset.submitting = "true";

                try {
                    const response = await fetch(
                        `${API_BASE}/projects/${projectId}/applications`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                professionalId: user.id,
                                bidAmount,
                                proposal
                            })
                        }
                    );

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(
                            data.message || "Unable to submit proposal."
                        );
                    }

                    const projectButton = projectsList.querySelector(
                        `.apply-project-btn[data-project-id="${projectId}"]`
                    );

                    if (projectButton) {
                        projectButton.disabled = true;
                        projectButton.textContent = "Application Submitted";
                    }

                    modal.classList.remove("is-open");
                    document.body.classList.remove("modal-open");

                    showMessage(
                        projectsMessage,
                        "Your proposal and bid were submitted successfully.",
                        "success"
                    );

                    bidInput.value = "";
                    proposalInput.value = "";

                } catch (error) {
                    message.textContent =
                        error.message || "Unable to submit your proposal.";
                } finally {
                    submitButton.disabled = false;
                    submitButton.innerHTML =
                        'Submit Proposal <span aria-hidden="true">→</span>';
                    modal.dataset.submitting = "false";
                }
            });
    }

    const projectCard = button.closest(".project-card");
    const title = projectCard?.querySelector("h2")?.textContent || "Project";

    modal.dataset.projectId = button.dataset.projectId;
    modal.querySelector("#applicationProjectTitle").textContent = title;
    modal.querySelector("#applicationProfile").textContent =
        "Loading your profile...";
    modal.querySelector("#applicationFormMessage").textContent = "";
    modal.querySelector("#applicationBid").value = "";
    modal.querySelector("#applicationProposal").value = "";

    modal.classList.add("is-open");
    document.body.classList.add("modal-open");

    try {
        const response = await fetch(
            `${API_BASE}/professional-profiles/${user.id}`
        );
        const profile = await response.json();

        if (!response.ok) {
            throw new Error(
                profile.message || "Unable to load your profile."
            );
        }

        const profileBox = modal.querySelector("#applicationProfile");

        profileBox.innerHTML = `
            <div class="application-profile-top">
                <div class="application-avatar">
                    ${escapeHtml(
                        (profile.name || "P").trim().charAt(0).toUpperCase()
                    )}
                </div>
                <div>
                    <h3>${escapeHtml(profile.name || "Professional")}</h3>
                    <p>Professional profile</p>
                </div>
            </div>

            <div class="application-profile-detail">
                <span>SKILLS</span>
                <p>${escapeHtml(profile.skills || "Not added yet")}</p>
            </div>

            <div class="application-profile-detail">
                <span>LOCATION</span>
                <p>${escapeHtml(profile.location || "Not added yet")}</p>
            </div>

            <div class="application-profile-detail">
                <span>ABOUT</span>
                <p>${escapeHtml(profile.bio || "No introduction added yet.")}</p>
            </div>
        `;

    } catch (error) {
        modal.querySelector("#applicationProfile").textContent =
            error.message || "Unable to load your profile.";
    }
});


}
