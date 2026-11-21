const ADMIN_API_BASE = "http://localhost:5001/api";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("adminLoginForm");
    const passwordInput = document.getElementById("adminPassword");
    const message = document.getElementById("adminLoginMessage");
    const submitButton = document.getElementById("adminLoginButton");
    const toggleButton = document.getElementById("togglePassword");

    if (sessionStorage.getItem("verilancerAdminToken")) {
        window.location.replace("admin.html");
        return;
    }

    toggleButton.addEventListener("click", () => {
        const showing = passwordInput.type === "text";
        passwordInput.type = showing ? "password" : "text";
        toggleButton.innerHTML = showing
            ? '<i class="fa-solid fa-eye"></i>'
            : '<i class="fa-solid fa-eye-slash"></i>';
        toggleButton.setAttribute("aria-label", showing ? "Show password" : "Hide password");
    });

    form.addEventListener("submit", async event => {
        event.preventDefault();
        message.hidden = true;
        submitButton.disabled = true;
        submitButton.textContent = "Verifying…";

        try {
            const response = await fetch(`${ADMIN_API_BASE}/admin/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: passwordInput.value })
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to sign in.");
            }

            sessionStorage.setItem("verilancerAdminToken", data.token);
            window.location.replace("admin.html");
        } catch (error) {
            message.textContent = error.message || "Unable to connect to the Verilancer backend.";
            message.className = "admin-message";
            message.hidden = false;
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = 'Secure sign in <span>→</span>';
        }
    });
});