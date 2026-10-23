const urlParams = new URLSearchParams(window.location.search);
const selectedRoleFromURL = urlParams.get("role");

if (selectedRoleFromURL) {
    localStorage.setItem("verilancerRole", selectedRoleFromURL);
}


document.addEventListener("DOMContentLoaded", () => {

    const signupForm = document.querySelector(".signup-form");

    if (!signupForm) return;

    signupForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirm-password").value;

        // Get role selected on Get Started page
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

        // Convert frontend role to database role
        const role = selectedRole === "professional"
            ? "student"
            : "client";

        try {

            const response = await fetch("https://verilancer-backend.onrender.com/api/signup", {
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

            // Remove stored role after successful signup
            localStorage.removeItem("verilancerRole");

            window.location.href = "login.html";

        } catch (error) {

            console.error("Signup error:", error);

            alert("Unable to connect to the server. Make sure the backend is running.");

        }

    });

});

const loginForm = document.querySelector(".login-form");

if (loginForm) {

    loginForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        try {

            const response = await fetch("https://verilancer-backend.onrender.com/api/login", {
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

            // Store logged-in user
            localStorage.setItem(
                "verilancerUser",
                JSON.stringify(data.user)
            );
            localStorage.setItem("verilancerLoggedIn", "true");

            alert("Login successful!");

            // Redirect based on role
            if (data.user.role === "student") {
                window.location.href = "dashboard.html";
            } else {
                window.location.href = "dashboard.html";
            }

        } catch (error) {

            console.error("Login error:", error);

            alert(
                "Unable to connect to the server. Make sure the backend is running."
            );
        }

    });

}