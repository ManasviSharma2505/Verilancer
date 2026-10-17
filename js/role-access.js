
document.addEventListener("DOMContentLoaded", function () {
    let user = null;

    try {
        if (localStorage.getItem("verilancerLoggedIn") === "true") {
            user = JSON.parse(localStorage.getItem("verilancerUser") || "null");
        }
    } catch {
        user = null;
    }

    const isBusiness = user?.role === "client";

    document.querySelectorAll(".business-only").forEach(function (element) {
        element.style.display = isBusiness ? "" : "none";
    });
});
