
const API_BASE = "http://localhost:5001/api";

const urlParams = new URLSearchParams(window.location.search);
const selectedRoleFromURL = urlParams.get("role");

if (selectedRoleFromURL) {
    localStorage.setItem("verilancerRole", selectedRoleFromURL);
}

document.addEventListener("DOMContentLoaded", () => {

    // SIGNUP
    const signupForm = document.querySelector(".signup-form");

    if (signupForm) {
        signupForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const name = document.getElementById("name").value.trim();
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;
            const confirmPassword =
                document.getElementById("confirm-password").value;

            const selectedRole = localStorage.getItem("verilancerRole");

            if (!selectedRole) {
                alert("Please select your account type first.");
                window.location.href = "get-started.html";
                return;
            }

            if (password !== confirmPassword) {
                alert("Passwords do not match.");
                return;
            }

            const role = selectedRole === "professional"
                ? "student"
                : "client";

            try {
                const response = await fetch(`${API_BASE}/signup`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        name,
                        email,
                        password,
                        role
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    alert(data.message || "Signup failed.");
                    return;
                }

                alert("Account created successfully!");
                localStorage.removeItem("verilancerRole");
                window.location.href = "login.html";

            } catch (error) {
                console.error("Signup error:", error);
                alert(
                    "Unable to connect to the local backend. Make sure it is running on port 5001."
                );
            }
        });
    }

    // LOGIN
    const loginForm = document.querySelector(".login-form");

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;

            try {
                const response = await fetch(`${API_BASE}/login`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email,
                        password
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    alert(data.message || "Login failed.");
                    return;
                }

                if (!data.user || !data.user.id) {
                    console.error("Unexpected login response:", data);
                    alert("Login response is missing user information.");
                    return;
                }

                localStorage.setItem(
                    "verilancerUser",
                    JSON.stringify(data.user)
                );

                localStorage.setItem("verilancerLoggedIn", "true");

                alert("Login successful!");
                window.location.href = "dashboard.html";

            } catch (error) {
                console.error("Login error:", error);

                alert(
                    "Unable to connect to the local backend. Check that it is running on port 5001."
                );
            }
        });
    }
});
