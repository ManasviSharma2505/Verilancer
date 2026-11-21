const ADMIN_API_BASE = "http://localhost:5001/api";
const adminToken = sessionStorage.getItem("verilancerAdminToken");

if (!adminToken) {
    window.location.replace("admin-login.html");
}

async function adminFetch(path) {
    const response = await fetch(`${ADMIN_API_BASE}${path}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) {
        sessionStorage.removeItem("verilancerAdminToken");
        window.location.replace("admin-login.html");
        throw new Error("Admin session expired.");
    }
    if (!response.ok) throw new Error(data.message || "Unable to load admin data.");
    return data;
}

function setCellContent(element, value) {
    element.textContent = value === null || value === undefined || value === "" ? "—" : String(value);
}

function statusPill(status) {
    const value = String(status || "unknown").toLowerCase();
    const pill = document.createElement("span");
    pill.className = `admin-status ${value}`;
    pill.textContent = value.charAt(0).toUpperCase() + value.slice(1);
    return pill;
}

function addTextCell(row, value, strong = false) {
    const cell = document.createElement("td");
    if (strong) {
        const label = document.createElement("strong");
        label.textContent = value ?? "—";
        cell.appendChild(label);
    } else {
        cell.textContent = value === null || value === undefined || value === "" ? "—" : String(value);
    }
    row.appendChild(cell);
    return cell;
}

function showEmpty(tbody, columns, message) {
    tbody.replaceChildren();
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = columns;
    cell.className = "admin-table-empty";
    cell.textContent = message;
    row.appendChild(cell);
    tbody.appendChild(row);
}

let cachedUsers = [];
let cachedProjects = [];
let cachedProposals = [];

function renderUsers(search = "") {
    const tbody = document.getElementById("usersTable");
    const query = search.toLowerCase();
    const rows = cachedUsers.filter(user => [user.name, user.email, user.role, user.id].join(" ").toLowerCase().includes(query));
    if (!rows.length) return showEmpty(tbody, 4, "No matching users found.");
    tbody.replaceChildren();
    rows.forEach(user => {
        const row = document.createElement("tr");
        addTextCell(row, user.name, true);
        addTextCell(row, user.email);
        const roleCell = document.createElement("td");
        const role = document.createElement("span");
        role.className = `admin-role ${user.role === "client" ? "business" : "professional"}`;
        role.textContent = user.role === "client" ? "Business" : "Professional";
        roleCell.appendChild(role);
        row.appendChild(roleCell);
        addTextCell(row, `#${user.id}`);
        tbody.appendChild(row);
    });
}

function renderProjects(search = "") {
    const tbody = document.getElementById("projectsTable");
    const query = search.toLowerCase();
    const rows = cachedProjects.filter(project => [project.title, project.businessName, project.category, project.status, project.id].join(" ").toLowerCase().includes(query));
    if (!rows.length) return showEmpty(tbody, 6, "No matching projects found.");
    tbody.replaceChildren();
    rows.forEach(project => {
        const row = document.createElement("tr");
        addTextCell(row, project.title, true);
        addTextCell(row, project.businessName);
        addTextCell(row, project.category);
        addTextCell(row, project.budget === null ? "Not specified" : `₹${Number(project.budget).toLocaleString("en-IN")}`);
        const statusCell = document.createElement("td");
        statusCell.appendChild(statusPill(project.status));
        row.appendChild(statusCell);
        addTextCell(row, `#${project.id}`);
        tbody.appendChild(row);
    });
}

function renderProposals(search = "") {
    const tbody = document.getElementById("proposalsTable");
    const query = search.toLowerCase();
    const rows = cachedProposals.filter(proposal => [proposal.projectTitle, proposal.professionalName, proposal.businessName, proposal.status, proposal.id].join(" ").toLowerCase().includes(query));
    if (!rows.length) return showEmpty(tbody, 6, "No matching proposals found.");
    tbody.replaceChildren();
    rows.forEach(proposal => {
        const row = document.createElement("tr");
        addTextCell(row, proposal.projectTitle, true);
        addTextCell(row, proposal.professionalName);
        addTextCell(row, proposal.businessName);
        addTextCell(row, proposal.bidAmount === null ? "—" : `₹${Number(proposal.bidAmount).toLocaleString("en-IN")}`);
        const statusCell = document.createElement("td");
        statusCell.appendChild(statusPill(proposal.status));
        row.appendChild(statusCell);
        addTextCell(row, `#${proposal.id}`);
        tbody.appendChild(row);
    });
}

let adminRefreshInProgress = false;

async function loadAdminData() {
    if (adminRefreshInProgress) return;
    adminRefreshInProgress = true;

    const loadMessage = document.getElementById("adminLoadMessage");
    const refreshButton = document.getElementById("adminRefresh");
    const refreshIcon = refreshButton?.querySelector("i");

    loadMessage.textContent = "Refreshing platform data…";
    loadMessage.className = "admin-load-message";
    if (refreshButton) {
        refreshButton.disabled = true;
        refreshButton.setAttribute("aria-busy", "true");
        refreshButton.title = "Refreshing data…";
    }
    refreshIcon?.classList.add("fa-spin");

    try {
        const [overview, users, projects, proposals] = await Promise.all([
            adminFetch("/admin/overview"),
            adminFetch("/admin/users"),
            adminFetch("/admin/projects"),
            adminFetch("/admin/proposals")
        ]);

        cachedUsers = Array.isArray(users) ? users : [];
        cachedProjects = Array.isArray(projects) ? projects : [];
        cachedProposals = Array.isArray(proposals) ? proposals : [];

        const stats = {
            statTotalUsers: overview.totalUsers,
            statProfessionals: overview.professionals,
            statBusinesses: overview.businesses,
            statActiveProjects: overview.activeProjects,
            statClosedProjects: overview.closedProjects,
            statTotalProposals: overview.totalProposals,
            statPendingProposals: overview.pendingProposals
        };
        Object.entries(stats).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) setCellContent(element, Number(value || 0).toLocaleString("en-IN"));
        });

        renderUsers(document.getElementById("usersSearch")?.value || "");
        renderProjects(document.getElementById("projectsSearch")?.value || "");
        renderProposals(document.getElementById("proposalsSearch")?.value || "");

        const updatedAt = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        document.getElementById("adminLastUpdated").textContent = `Updated ${updatedAt}`;
        loadMessage.textContent = "All platform data is up to date.";
    } catch (error) {
        loadMessage.textContent = error.message || "Refresh failed. Check that the backend is running and try again.";
        loadMessage.className = "admin-load-message error";
    } finally {
        adminRefreshInProgress = false;
        if (refreshButton) {
            refreshButton.disabled = false;
            refreshButton.removeAttribute("aria-busy");
            refreshButton.title = "Refresh data";
        }
        refreshIcon?.classList.remove("fa-spin");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".admin-nav-link").forEach(button => {
        button.addEventListener("click", () => {
            document.querySelectorAll(".admin-nav-link").forEach(item => item.classList.remove("active"));
            document.querySelectorAll(".admin-section").forEach(section => section.classList.remove("active"));
            button.classList.add("active");
            document.getElementById(`section-${button.dataset.section}`).classList.add("active");
            document.getElementById("adminPageTitle").textContent = button.textContent.trim();
        });
    });

    document.getElementById("usersSearch").addEventListener("input", event => renderUsers(event.target.value));
    document.getElementById("projectsSearch").addEventListener("input", event => renderProjects(event.target.value));
    document.getElementById("proposalsSearch").addEventListener("input", event => renderProposals(event.target.value));
    document.getElementById("adminRefresh").addEventListener("click", loadAdminData);
    document.getElementById("adminLogout").addEventListener("click", () => {
        sessionStorage.removeItem("verilancerAdminToken");
        window.location.replace("admin-login.html");
    });
    loadAdminData();
});