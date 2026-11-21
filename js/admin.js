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
let cachedConversations = [];

function renderUsers(search = "") {
    const tbody = document.getElementById("usersTable");
    const query = search.toLowerCase();
    const rows = cachedUsers.filter(user => [user.name, user.email, user.role, user.id].join(" ").toLowerCase().includes(query));
    if (!rows.length) return showEmpty(tbody, 5, "No matching users found.");
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
        const actionCell = document.createElement("td");
        const viewButton = document.createElement("button");
        viewButton.type = "button";
        viewButton.className = "admin-user-view-btn";
        viewButton.textContent = "View details";
        viewButton.addEventListener("click", () => loadUserDetails(user.id));
        actionCell.appendChild(viewButton);
        row.appendChild(actionCell);
        tbody.appendChild(row);
    });
}

const userDetailFields = [
    ["Email", "email"], ["Account type", "role"], ["Phone", "phone"],
    ["Location", "location"], ["Headline", "headline"], ["Bio", "bio"],
    ["Skills", "skills"], ["Portfolio", "portfolio"], ["Experience", "experience"],
    ["Education", "education"], ["Certifications", "certifications"],
    ["Availability", "availability"], ["Projects posted", "projectsPosted"],
    ["Proposals submitted", "proposalsSubmitted"]
];

async function loadUserDetails(userId) {
    const modal = document.getElementById("userDetailsModal");
    const content = document.getElementById("userDetailsContent");
    const title = document.getElementById("userDetailsTitle");
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("admin-modal-open");
    title.textContent = "Loading user…";
    content.replaceChildren();
    const loading = document.createElement("p");
    loading.className = "admin-table-empty";
    loading.textContent = "Loading account details…";
    content.appendChild(loading);

    try {
        const user = await adminFetch(`/admin/users/${encodeURIComponent(userId)}`);
        title.textContent = user.name || `User #${user.id}`;
        content.replaceChildren();

        const identity = document.createElement("div");
        identity.className = "admin-user-identity";
        const avatar = document.createElement("span");
        avatar.className = "admin-user-avatar";
        avatar.textContent = String(user.name || "U").trim().charAt(0).toUpperCase();
        const identityText = document.createElement("div");
        const name = document.createElement("strong");
        name.textContent = user.name || "Unnamed user";
        const id = document.createElement("small");
        id.textContent = `User ID #${user.id}`;
        identityText.append(name, id);
        identity.append(avatar, identityText);
        content.appendChild(identity);

        const grid = document.createElement("div");
        grid.className = "admin-user-details-grid";
        userDetailFields.forEach(([label, key]) => {
            const card = document.createElement("div");
            card.className = "admin-user-detail";
            const caption = document.createElement("span");
            caption.textContent = label;
            const value = document.createElement("p");
            let displayValue = user[key];
            if (key === "role") displayValue = user.role === "client" ? "Business" : "Professional";
            if (displayValue === null || displayValue === undefined || displayValue === "") displayValue = "Not provided";
            value.textContent = String(displayValue);
            card.append(caption, value);
            grid.appendChild(card);
        });
        content.appendChild(grid);
    } catch (error) {
        content.replaceChildren();
        const message = document.createElement("p");
        message.className = "admin-table-empty";
        message.textContent = error.message || "Unable to load user details.";
        content.appendChild(message);
    }
}

function closeUserDetails() {
    const modal = document.getElementById("userDetailsModal");
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("admin-modal-open");
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

function renderConversations(search = "") {
    const container = document.getElementById("conversationsList");
    const query = search.toLowerCase();
    const rows = cachedConversations.filter(thread =>
        [thread.projectTitle, thread.professionalName, thread.professionalEmail,
         thread.businessName, thread.businessEmail, thread.lastMessage]
        .join(" ").toLowerCase().includes(query)
    );
    document.getElementById("conversationCount").textContent = `${rows.length} threads`;
    container.replaceChildren();
    if (!rows.length) {
        const empty = document.createElement("div");
        empty.className = "admin-table-empty";
        empty.textContent = "No conversations found.";
        container.appendChild(empty);
        return;
    }
    rows.forEach(thread => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "admin-conversation-item";
        button.dataset.applicationId = thread.applicationId;
        const title = document.createElement("strong");
        title.textContent = thread.projectTitle || `Project #${thread.applicationId}`;
        const people = document.createElement("span");
        people.textContent = `${thread.professionalName} ↔ ${thread.businessName}`;
        const preview = document.createElement("small");
        preview.textContent = thread.lastMessage || "No message preview";
        const meta = document.createElement("small");
        meta.textContent = `${thread.messageCount} messages · ${thread.lastMessageAt ? new Date(thread.lastMessageAt).toLocaleString() : "Date unavailable"}`;
        button.append(title, people, preview, meta);
        button.addEventListener("click", () => loadConversation(thread.applicationId, button));
        container.appendChild(button);
    });
}

async function loadConversation(applicationId, selectedButton) {
    document.querySelectorAll(".admin-conversation-item").forEach(item => item.classList.remove("active"));
    selectedButton?.classList.add("active");
    const detail = document.getElementById("conversationDetail");
    detail.replaceChildren();
    const loading = document.createElement("div");
    loading.className = "admin-conversation-placeholder";
    loading.textContent = "Loading message history…";
    detail.appendChild(loading);
    try {
        const messages = await adminFetch(`/admin/conversations/${encodeURIComponent(applicationId)}`);
        const thread = cachedConversations.find(item => Number(item.applicationId) === Number(applicationId));
        detail.replaceChildren();
        const header = document.createElement("div");
        header.className = "admin-thread-header";
        const heading = document.createElement("strong");
        heading.textContent = thread?.projectTitle || `Conversation #${applicationId}`;
        const subheading = document.createElement("span");
        subheading.textContent = thread ? `${thread.professionalName} (${thread.professionalEmail}) · ${thread.businessName} (${thread.businessEmail})` : `Application #${applicationId}`;
        const readOnly = document.createElement("small");
        readOnly.textContent = "READ ONLY · MESSAGE HISTORY";
        header.append(heading, subheading, readOnly);
        const messageList = document.createElement("div");
        messageList.className = "admin-thread-messages";
        if (!messages.length) {
            const empty = document.createElement("p");
            empty.className = "admin-table-empty";
            empty.textContent = "No messages in this conversation.";
            messageList.appendChild(empty);
        }
        messages.forEach(message => {
            const item = document.createElement("article");
            item.className = "admin-thread-message";
            const meta = document.createElement("div");
            meta.className = "admin-thread-message-meta";
            const sender = document.createElement("strong");
            sender.textContent = message.senderName || "Unknown sender";
            const timestamp = document.createElement("time");
            const date = new Date(message.createdAt);
            timestamp.textContent = Number.isNaN(date.getTime()) ? "" : date.toLocaleString();
            meta.append(sender, timestamp);
            const body = document.createElement("p");
            body.textContent = message.message || "";
            item.append(meta, body);
            messageList.appendChild(item);
        });
        detail.append(header, messageList);
    } catch (error) {
        detail.replaceChildren();
        const message = document.createElement("p");
        message.className = "admin-table-empty";
        message.textContent = error.message || "Unable to load conversation.";
        detail.appendChild(message);
    }
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
        const [overview, users, projects, proposals, conversations] = await Promise.all([
            adminFetch("/admin/overview"),
            adminFetch("/admin/users"),
            adminFetch("/admin/projects"),
            adminFetch("/admin/proposals"),
            adminFetch("/admin/conversations")
        ]);

        cachedUsers = Array.isArray(users) ? users : [];
        cachedProjects = Array.isArray(projects) ? projects : [];
        cachedProposals = Array.isArray(proposals) ? proposals : [];
        cachedConversations = Array.isArray(conversations) ? conversations : [];

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
        renderConversations(document.getElementById("conversationsSearch")?.value || "");

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
    document.getElementById("closeUserDetails").addEventListener("click", closeUserDetails);
    document.querySelectorAll("[data-close-user-modal]").forEach(element => element.addEventListener("click", closeUserDetails));
    document.addEventListener("keydown", event => {
        if (event.key === "Escape") closeUserDetails();
    });
    document.getElementById("projectsSearch").addEventListener("input", event => renderProjects(event.target.value));
    document.getElementById("proposalsSearch").addEventListener("input", event => renderProposals(event.target.value));
    document.getElementById("conversationsSearch").addEventListener("input", event => renderConversations(event.target.value));
    document.getElementById("adminRefresh").addEventListener("click", loadAdminData);
    document.getElementById("adminLogout").addEventListener("click", () => {
        sessionStorage.removeItem("verilancerAdminToken");
        window.location.replace("admin-login.html");
    });
    loadAdminData();
});