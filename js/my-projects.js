
const API_BASE = "http://localhost:5001/api";

document.addEventListener("DOMContentLoaded", () => {
    const list = document.getElementById("myProjectsList");
    const message = document.getElementById("myProjectsMessage");

    let user;

    try {
        user = JSON.parse(localStorage.getItem("verilancerUser"));
    } catch {
        user = null;
    }

    if (
        localStorage.getItem("verilancerLoggedIn") !== "true" ||
        !user
    ) {
        window.location.href = "login.html";
        return;
    }

    if (user.role !== "client") {
        message.textContent =
            "This page is available to business accounts.";
        list.innerHTML = "";
        return;
    }

    const escapeHtml = value =>
        String(value ?? "").replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);

    function formatMoney(value) {
        if (value === null || value === undefined || value === "") {
            return "Not provided";
        }

        return "₹" + Number(value).toLocaleString("en-IN", {
            maximumFractionDigits: 2
        });
    }

    async function loadProposals(projectId, panel) {
        panel.innerHTML = "<p>Loading proposals...</p>";

        try {
            const response = await fetch(
                `${API_BASE}/projects/${encodeURIComponent(projectId)}/applications?businessId=${encodeURIComponent(user.id)}`
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to load proposals."
                );
            }

            if (!Array.isArray(data) || data.length === 0) {
                panel.innerHTML = `
                    <div class="proposal-empty">
                        <h3>No bids yet</h3>
                        <p>
                            Proposals from professionals will appear here
                            when they apply to your project.
                        </p>
                    </div>
                `;
                return;
            }

            panel.innerHTML = `
                <div class="proposal-summary">
                    <h3>Proposals received</h3>
                    <span>${data.length} bid${data.length === 1 ? "" : "s"}</span>
                </div>

                <div class="proposal-list">
                    ${data.map(application => `
                        <article class="proposal-card">
                            <div class="proposal-card-heading">
                                <div>
                                    <h4>${escapeHtml(
                                        application.professionalName
                                        || "Professional"
                                    )}</h4>

                                    <p class="proposal-email">
                                        ${escapeHtml(
                                            application.professionalEmail
                                            || "Email unavailable"
                                        )}
                                    </p>
                                </div>

                                <span class="proposal-status ${escapeHtml(
                                    application.status
                                )}">
                                    ${escapeHtml(application.status)}
                                </span>
                            </div>

                            <div class="proposal-bid">
                                <span>Professional's bid</span>
                                <strong>${formatMoney(
                                    application.bidAmount
                                )}</strong>
                            </div>

                            <div class="proposal-details">
                                <p>
                                    <strong>Skills:</strong>
                                    ${escapeHtml(
                                        application.skills || "Not provided"
                                    )}
                                </p>

                                <p>
                                    <strong>Location:</strong>
                                    ${escapeHtml(
                                        application.location || "Not provided"
                                    )}
                                </p>

                                <p>
                                    <strong>About:</strong>
                                    ${escapeHtml(
                                        application.bio || "Not provided"
                                    )}
                                </p>
                            </div>

                            <div class="proposal-message">
                                <h5>Proposal</h5>
                                <p>${escapeHtml(
                                    application.proposal
                                )}</p>
                            </div>

                            <p class="proposal-date">
                                Submitted: ${escapeHtml(
                                    application.createdAt
                                        ? new Date(
                                            application.createdAt
                                        ).toLocaleString("en-IN")
                                        : "Date unavailable"
                                )}
                            </p>
                        </article>
                    `).join("")}
                </div>
            `;
        } catch (error) {
            console.error("Proposal loading error:", error);

            panel.innerHTML = `
                <p class="proposal-error">
                    ${escapeHtml(error.message)}
                </p>
                <button
                    type="button"
                    class="my-project-button retry-proposals-btn"
                    data-project-id="${Number(projectId)}">
                    Try Again
                </button>
            `;
        }
    }

    async function loadProjects() {
        list.innerHTML = "<p>Loading your projects...</p>";

        try {
            const response = await fetch(
                `${API_BASE}/projects/mine/${encodeURIComponent(user.id)}`
            );

            const projects = await response.json();

            if (!response.ok) {
                throw new Error(
                    projects.message || "Could not load projects."
                );
            }

            if (!Array.isArray(projects) || projects.length === 0) {
                list.innerHTML = `
                    <div class="empty-state">
                        <h3>You haven't posted any projects yet</h3>
                        <p>Your published projects will appear here.</p>
                        <a class="secondary-action" href="post-project.html">
                            Post a Project
                        </a>
                    </div>
                `;
                return;
            }

            list.innerHTML = projects.map(project => `
                <article class="my-project-card">
                    <h2>${escapeHtml(project.title)}</h2>

                    <span class="my-project-category">
                        ${escapeHtml(
                            project.category || "Uncategorised"
                        )}
                    </span>

                    <p class="my-project-description">
                        ${escapeHtml(
                            project.description || "No description provided."
                        )}
                    </p>

                    <div class="my-project-meta">
                        <span>
                            Budget
                            <strong>${formatMoney(project.budget)}</strong>
                        </span>

                        <span>
                            Deadline
                            <strong>${escapeHtml(
                                project.deadline
                                    ? String(project.deadline).slice(0, 10)
                                    : "Not specified"
                            )}</strong>
                        </span>
                    </div>

                    <span class="my-project-status ${
                        project.status === "published"
                            ? "published"
                            : "closed"
                    }">
                        ${escapeHtml(project.status)}
                    </span>

                    <button
                        type="button"
                        class="my-project-button view-proposals-btn"
                        data-project-id="${Number(project.id)}"
                        aria-expanded="false">
                        View Proposals
                    </button>

                    ${
                        project.status === "published"
                            ? `<button
                                class="my-project-button close-project-btn"
                                data-project-id="${Number(project.id)}"
                                type="button">
                                Close Project
                            </button>`
                            : `<span class="my-project-button secondary">
                                Project Closed
                            </span>`
                    }

                    <section
                        class="project-proposals-panel"
                        id="proposals-${Number(project.id)}"
                        hidden>
                    </section>
                </article>
            `).join("");

        } catch (error) {
            console.error(error);
            message.textContent =
                error.message ||
                "Couldn't load projects. Check that the backend is running.";
            list.innerHTML = "";
        }
    }

    list.addEventListener("click", async event => {
        const viewButton = event.target.closest(".view-proposals-btn");

        if (viewButton) {
            const projectId = Number(viewButton.dataset.projectId);
            const panel = document.getElementById(
                `proposals-${projectId}`
            );

            if (!panel) return;

            const isExpanded =
                viewButton.getAttribute("aria-expanded") === "true";

            panel.hidden = isExpanded;
            viewButton.setAttribute(
                "aria-expanded",
                String(!isExpanded)
            );

            if (isExpanded) {
                viewButton.textContent = "View Proposals";
                return;
            }

            viewButton.textContent = "Hide Proposals";
            await loadProposals(projectId, panel);
            return;
        }

        const retryButton = event.target.closest(".retry-proposals-btn");

        if (retryButton) {
            const projectId = Number(retryButton.dataset.projectId);
            const panel = document.getElementById(
                `proposals-${projectId}`
            );

            if (panel) {
                await loadProposals(projectId, panel);
            }
            return;
        }

        const closeButton = event.target.closest(".close-project-btn");

        if (!closeButton) return;

        const projectId = closeButton.dataset.projectId;

        if (!confirm("Are you sure you want to close this project?")) {
            return;
        }

        closeButton.disabled = true;
        message.textContent = "";

        try {
            const response = await fetch(
                `${API_BASE}/projects/${encodeURIComponent(projectId)}/close`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        businessId: user.id
                    })
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Could not close project."
                );
            }

            message.textContent = result.message;
            await loadProjects();

        } catch (error) {
            message.textContent = error.message;
            closeButton.disabled = false;
        }
    });

    loadProjects();
});
