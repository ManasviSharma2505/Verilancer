
const API_BASE = "http://localhost:5001/api";

document.addEventListener("DOMContentLoaded", () => {
    const list = document.getElementById("myProjectsList");
    const message = document.getElementById("myProjectsMessage");

    const loggedIn = localStorage.getItem("verilancerLoggedIn");
    let user;

    try {
        user = JSON.parse(localStorage.getItem("verilancerUser"));
    } catch {
        user = null;
    }

    if (loggedIn !== "true" || !user) {
        window.location.href = "login.html";
        return;
    }

    if (user.role !== "client") {
        message.textContent = "This page is available to business accounts.";
        list.innerHTML = "";
        return;
    }

    const escapeHtml = (value) =>
        String(value ?? "").replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);

    async function loadProjects() {
        list.innerHTML = "<p>Loading your projects...</p>";

        try {
            const response = await fetch(
                `${API_BASE}/projects/mine/${encodeURIComponent(user.id)}`
            );
            const projects = await response.json();

            if (!response.ok) {
                throw new Error(projects.message || "Could not load projects.");
            }

            if (!Array.isArray(projects) || projects.length === 0) {
                list.innerHTML = `
                    <div class="empty-state">
                        <h3>You haven't posted any projects yet</h3>
                        <p>Your published projects will appear here.</p>
                        <a class="secondary-action" href="post-project.html">
                            Post a Project
                        </a>
                    </div>`;
                return;
            }

            

list.innerHTML = projects.map(project => `
    <article class="my-project-card">
        <h2>${escapeHtml(project.title)}</h2>

        <span class="my-project-category">
            ${escapeHtml(project.category || "Uncategorised")}
        </span>

        <p class="my-project-description">${escapeHtml(
            project.description || "No description provided."
        )}</p>

        <div class="my-project-meta">
            <span>
                Budget
                <strong>${
                    project.budget == null
                        ? "Not specified"
                        : "₹" + Number(project.budget).toLocaleString("en-IN")
                }</strong>
            </span>

            <span>
                Deadline
                <strong>${
                    project.deadline
                        ? escapeHtml(String(project.deadline).slice(0, 10))
                        : "Not specified"
                }</strong>
            </span>
        </div>

        <span class="my-project-status ${
            project.status === "published" ? "published" : "closed"
        }">
            ${escapeHtml(project.status)}
        </span>

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
    </article>
`).join("");



        } catch (error) {
            console.error(error);
            message.textContent =
                "Couldn't load projects. Check that the backend is running.";
            list.innerHTML = "";
        }
    }

    list.addEventListener("click", async event => {
        const button = event.target.closest(".close-project-btn");
        if (!button) return;

        const projectId = button.dataset.projectId;

        if (!confirm("Are you sure you want to close this project?")) {
            return;
        }

        button.disabled = true;
        message.textContent = "";

        try {
            const response = await fetch(
                `${API_BASE}/projects/${encodeURIComponent(projectId)}/close`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ businessId: user.id })
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Could not close project.");
            }

            message.textContent = result.message;
            await loadProjects();

        } catch (error) {
            message.textContent = error.message;
            button.disabled = false;
        }
    });

    loadProjects();
});
