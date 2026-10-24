
document.addEventListener("DOMContentLoaded", () => {
    const API_BASE = "http://localhost:5001/api";

    let user;

    try {
        user = JSON.parse(localStorage.getItem("verilancerUser") || "null");
    } catch {
        user = null;
    }

    if (!user?.id || localStorage.getItem("verilancerLoggedIn") !== "true") {
        window.location.href = "login.html";
        return;
    }

    const isBusiness = user.role === "client";
    const $ = id => document.getElementById(id);

    const conversationList = $("conversationList");
    const chatEmpty = $("chatEmpty");
    const activeChat = $("activeChat");
    const messageList = $("messageList");
    const messageForm = $("messageForm");
    const messageInput = $("messageInput");
    const sendButton = $("sendMessageBtn");
    const feedback = $("messageFeedback");

    let conversations = [];
    let selectedApplicationId = null;
    let loadingMessages = false;

    $("messagesUserName").textContent = user.name || "User";
    $("messagesUserRole").textContent = isBusiness ? "Business" : "Professional";
    $("messagesAvatar").textContent =
        (user.name || "U").trim().charAt(0).toUpperCase();

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]);
    }

    function formatDate(value) {
        if (!value) return "";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "";

        return date.toLocaleString([], {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    function contactFor(conversation) {
        return isBusiness
            ? conversation.professionalName
            : conversation.businessName;
    }

    function setFeedback(message, success = false) {
        feedback.textContent = message;
        feedback.classList.toggle("success", success);
    }

    async function requestJSON(url, options = {}) {
        const response = await fetch(url, options);
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.message || "Something went wrong.");
        }

        return data;
    }

    function renderConversations() {
        if (!conversations.length) {
            conversationList.innerHTML = `
                <div class="conversation-empty">
                    <strong>No conversations yet</strong>
                    <p>When a professional applies to a project, a conversation becomes available to the applicant and project owner.</p>
                </div>
            `;
            return;
        }

        conversationList.innerHTML = conversations.map(conversation => {
            const id = Number(conversation.applicationId);
            const contact = contactFor(conversation) || "Verilancer user";
            const selected = id === selectedApplicationId;
            const preview = conversation.lastMessage || "Start the conversation";
            const date = formatDate(conversation.lastMessageAt);

            return `
                <button type="button"
                    class="conversation-item ${selected ? "selected" : ""}"
                    data-application-id="${id}">
                    <span class="conversation-item-top">
                        <span class="conversation-avatar">
                            ${escapeHTML(contact.trim().charAt(0).toUpperCase() || "U")}
                        </span>
                        <span class="conversation-details">
                            <strong>${escapeHTML(contact)}</strong>
                            <small>${escapeHTML(conversation.projectTitle)}</small>
                        </span>
                    </span>
                    <span class="conversation-preview">
                        ${escapeHTML(preview)}
                        ${date ? " · " + escapeHTML(date) : ""}
                    </span>
                </button>
            `;
        }).join("");
    }

    async function loadConversations(preferredId = selectedApplicationId) {
        conversationList.innerHTML =
            '<p class="messages-state">Loading conversations...</p>';

        try {
            const data = await requestJSON(
                `${API_BASE}/messages/conversations/${encodeURIComponent(user.id)}`
            );

            if (!Array.isArray(data)) {
                throw new Error("Unexpected conversations response.");
            }

            conversations = data;
            renderConversations();

            if (!conversations.length) {
                selectedApplicationId = null;
                activeChat.hidden = true;
                chatEmpty.hidden = false;
                return;
            }

            const target = conversations.find(
                item => Number(item.applicationId) === Number(preferredId)
            ) || conversations[0];

            await openConversation(Number(target.applicationId));
        } catch (error) {
            console.error("Load conversations error:", error);
            conversationList.innerHTML = `
                <p class="messages-state">
                    ${escapeHTML(error.message)}
                    <br><br>Check that your local backend is running.
                </p>
            `;
        }
    }

    async function openConversation(applicationId) {
        const conversation = conversations.find(
            item => Number(item.applicationId) === Number(applicationId)
        );

        if (!conversation) return;

        selectedApplicationId = applicationId;
        renderConversations();

        chatEmpty.hidden = true;
        activeChat.hidden = false;
        $("chatPersonName").textContent = contactFor(conversation) || "Contact";
        $("chatProjectName").textContent =
            conversation.projectTitle || "Project conversation";
        $("chatAvatar").textContent =
            (contactFor(conversation) || "U").trim().charAt(0).toUpperCase();
        $("applicationStatus").textContent =
            conversation.applicationStatus || "Applied";

        messageList.innerHTML =
            '<p class="messages-state">Loading messages...</p>';
        setFeedback("");

        await loadMessages(applicationId);
    }

    async function loadMessages(applicationId) {
        if (loadingMessages) return;

        loadingMessages = true;

        try {
            const messages = await requestJSON(
                `${API_BASE}/messages/${encodeURIComponent(applicationId)}?userId=${encodeURIComponent(user.id)}`
            );

            if (selectedApplicationId !== applicationId) return;

            if (!Array.isArray(messages) || !messages.length) {
                messageList.innerHTML = `
                    <p class="messages-state">
                        No messages yet. Send a message to start the conversation.
                    </p>
                `;
                return;
            }

            messageList.innerHTML = messages.map(message => {
                const mine = Number(message.senderId) === Number(user.id);

                return `
                    <article class="message-bubble ${mine ? "mine" : ""}">
                        <p>${escapeHTML(message.message)}</p>
                        <span class="message-meta">
                            ${mine ? "You" : escapeHTML(message.senderName || "Contact")}
                            ${message.createdAt ? " · " + escapeHTML(formatDate(message.createdAt)) : ""}
                        </span>
                    </article>
                `;
            }).join("");

            messageList.scrollTop = messageList.scrollHeight;
        } catch (error) {
            console.error("Load messages error:", error);
            if (selectedApplicationId === applicationId) {
                messageList.innerHTML = `
                    <p class="messages-state">${escapeHTML(error.message)}</p>
                `;
            }
        } finally {
            loadingMessages = false;
        }
    }

    conversationList.addEventListener("click", async event => {
        const button = event.target.closest("[data-application-id]");
        if (!button) return;

        await openConversation(Number(button.dataset.applicationId));
    });

    messageForm.addEventListener("submit", async event => {
        event.preventDefault();

        const message = messageInput.value.trim();
        const applicationId = selectedApplicationId;

        if (!applicationId || !message || sendButton.disabled) return;

        sendButton.disabled = true;
        setFeedback("");

        try {
            await requestJSON(
                `${API_BASE}/messages/${encodeURIComponent(applicationId)}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        userId: user.id,
                        message
                    })
                }
            );

            messageInput.value = "";
            await loadMessages(applicationId);
            await loadConversations(applicationId);
            setFeedback("Message sent.", true);
        } catch (error) {
            console.error("Send message error:", error);
            setFeedback(error.message);
        } finally {
            sendButton.disabled = false;
            messageInput.focus();
        }
    });

    $("refreshConversations").addEventListener("click", () => {
        loadConversations(selectedApplicationId);
    });

    $("paymentsLink").addEventListener("click", event => {
        event.preventDefault();
        alert("Payments is not available yet.");
    });

    const mobileMenuBtn = $("mobileMenuBtn");
    const sidebar = document.querySelector(".sidebar");

    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener("click", () => {
            sidebar.classList.toggle("mobile-open");
        });
    }

    document.querySelector("[data-dashboard-logout]")?.addEventListener("click", event => {
        event.preventDefault();

        if (confirm("Are you sure you want to log out?")) {
            localStorage.removeItem("verilancerLoggedIn");
            localStorage.removeItem("verilancerUser");
            window.location.href = "index.html";
        }
    });

    loadConversations();
});
