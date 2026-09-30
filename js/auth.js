/* =========================================
   VERILANCER AUTHENTICATION - FRONTEND DEMO
========================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* -----------------------------------------
       GET STARTED PAGE
    ----------------------------------------- */

    const roleButtons = document.querySelectorAll("[data-role]");

    roleButtons.forEach(button => {
        button.addEventListener("click", () => {
            const role = button.dataset.role;

            localStorage.setItem("verilancerRole", role);
        });
    });


    /* -----------------------------------------
       SIGNUP PAGE
    ----------------------------------------- */

    const signupForm = document.querySelector(".signup-form");

    if (signupForm) {

        signupForm.addEventListener("submit", (event) => {

            event.preventDefault();

            const name = document.querySelector("#name").value.trim();
            const email = document.querySelector("#email").value.trim();
            const password = document.querySelector("#password").value;
            const confirmPassword =
                document.querySelector("#confirm-password").value;

            const role =
                localStorage.getItem("verilancerRole") || "professional";


            /* Validation */

            if (name === "") {
                showMessage("Please enter your full name.", "error");
                return;
            }

            if (email === "") {
                showMessage("Please enter your email address.", "error");
                return;
            }

            if (!isValidEmail(email)) {
                showMessage("Please enter a valid email address.", "error");
                return;
            }

            if (password.length < 6) {
                showMessage(
                    "Password must contain at least 6 characters.",
                    "error"
                );
                return;
            }

            if (password !== confirmPassword) {
                showMessage(
                    "Passwords do not match.",
                    "error"
                );
                return;
            }


            /* Check existing account */

            const existingUser =
                JSON.parse(localStorage.getItem("verilancerUser"));

            if (
                existingUser &&
                existingUser.email.toLowerCase() === email.toLowerCase()
            ) {
                showMessage(
                    "An account with this email already exists.",
                    "error"
                );
                return;
            }


            /* Create demo account */

            const user = {
                name: name,
                email: email,
                password: password,
                role: role
            };

            localStorage.setItem(
                "verilancerUser",
                JSON.stringify(user)
            );


            /* Login user automatically */

            localStorage.setItem(
                "verilancerLoggedIn",
                "true"
            );


            showMessage(
                "Account created successfully! Redirecting...",
                "success"
            );


            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 1200);

        });
    }


    /* -----------------------------------------
       LOGIN PAGE
    ----------------------------------------- */

    const loginForm = document.querySelector(".login-form");

    if (loginForm) {

        loginForm.addEventListener("submit", (event) => {

            event.preventDefault();

            const email =
                document.querySelector("#email").value.trim();

            const password =
                document.querySelector("#password").value;


            if (email === "" || password === "") {
                showMessage(
                    "Please enter your email and password.",
                    "error"
                );
                return;
            }


            const savedUser =
                JSON.parse(localStorage.getItem("verilancerUser"));


            if (!savedUser) {

                showMessage(
                    "No account found. Please create an account first.",
                    "error"
                );

                return;
            }


            if (
                savedUser.email.toLowerCase() !== email.toLowerCase() ||
                savedUser.password !== password
            ) {

                showMessage(
                    "Incorrect email or password.",
                    "error"
                );

                return;
            }


            /* Successful login */

            localStorage.setItem(
                "verilancerLoggedIn",
                "true"
            );


            showMessage(
                "Login successful! Redirecting...",
                "success"
            );


            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 1000);

        });
    }


    /* -----------------------------------------
       FORGOT PASSWORD
    ----------------------------------------- */

    const forgotPassword =
        document.querySelector(".password-label a");

    if (forgotPassword) {

        forgotPassword.addEventListener("click", (event) => {

            event.preventDefault();

            const email =
                document.querySelector("#email").value.trim();

            if (email === "") {

                showMessage(
                    "Enter your email address first.",
                    "error"
                );

                document.querySelector("#email").focus();

                return;
            }


            if (!isValidEmail(email)) {

                showMessage(
                    "Please enter a valid email address.",
                    "error"
                );

                return;
            }


            showMessage(
                "Password reset functionality will be available soon.",
                "info"
            );

        });
    }


    /* -----------------------------------------
       SHOW USER NAME WHEN LOGGED IN
    ----------------------------------------- */

    updateNavigation();


    /* -----------------------------------------
       LOGOUT
    ----------------------------------------- */

    const logoutButton =
        document.querySelector("[data-logout]");

    if (logoutButton) {

        logoutButton.addEventListener("click", (event) => {

            event.preventDefault();

            localStorage.removeItem("verilancerLoggedIn");

            window.location.href = "dashboard.html";

        });
    }

});


/* =========================================
   EMAIL VALIDATION
========================================= */

function isValidEmail(email) {

    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emailPattern.test(email);
}


/* =========================================
   MESSAGE SYSTEM
========================================= */

function showMessage(message, type = "info") {

    let messageBox =
        document.querySelector(".auth-message");


    if (!messageBox) {

        messageBox = document.createElement("div");

        messageBox.className = "auth-message";

        const form =
            document.querySelector(
                ".login-form, .signup-form"
            );

        if (form) {
            form.parentNode.insertBefore(
                messageBox,
                form
            );
        } else {
            document.body.appendChild(messageBox);
        }
    }


    messageBox.textContent = message;

    messageBox.className =
        `auth-message ${type}`;


    setTimeout(() => {

        if (messageBox) {
            messageBox.remove();
        }

    }, 4000);
}


/* =========================================
   NAVIGATION STATE
========================================= */

function updateNavigation() {

    const loggedIn =
        localStorage.getItem("verilancerLoggedIn");

    const user =
        JSON.parse(localStorage.getItem("verilancerUser"));


    if (!loggedIn || !user) {
        return;
    }


    const buttons =
        document.querySelector(".buttons");

    if (!buttons) {
        return;
    }


    buttons.innerHTML = `
        <span class="welcome-user">
            Hi, ${escapeHTML(user.name.split(" ")[0])}
        </span>

        <a href="#" class="logout-btn" data-logout>
            Log Out
        </a>
    `;


    const logoutButton =
        buttons.querySelector("[data-logout]");


    logoutButton.addEventListener("click", (event) => {

        event.preventDefault();

        localStorage.removeItem("verilancerLoggedIn");

        window.location.href = "dashboard.html";

    });

}


/* =========================================
   BASIC HTML ESCAPING
========================================= */

function escapeHTML(value) {

    const div = document.createElement("div");

    div.textContent = value;

    return div.innerHTML;
}