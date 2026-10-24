
const API_BASE = "http://localhost:5001/api";

const form = document.getElementById("profileForm");
const message = document.getElementById("profileMessage");
const saveButton = document.getElementById("saveProfileBtn");

const fields = {
    name: document.getElementById("profileName"),
    email: document.getElementById("profileEmail"),
    bio: document.getElementById("profileBio"),
    skills: document.getElementById("profileSkills"),
    phone: document.getElementById("profilePhone"),
    location: document.getElementById("profileLocation")
};

let user;

try {
    user = JSON.parse(localStorage.getItem("verilancerUser"));
} catch {
    user = null;
}

const loggedIn = localStorage.getItem("verilancerLoggedIn") === "true";

if (!user?.id || !loggedIn) {
    window.location.href = "login.html";
} else {
    loadProfile();
}

function showMessage(text, success = false) {
    message.textContent = text;
    message.style.color = success ? "#16803c" : "#d93025";
}

async function loadProfile() {
    try {
        showMessage("Loading your profile...", true);

        const response = await fetch(
            `${API_BASE}/profile/${encodeURIComponent(user.id)}`
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to load profile.");
        }

        fields.name.value = data.name || "";
        fields.email.value = data.email || "";
        fields.bio.value = data.bio || "";
        fields.skills.value = data.skills || "";
        fields.phone.value = data.phone || "";
        fields.location.value = data.location || "";

        showMessage("");
    } catch (error) {
        console.error("Profile loading error:", error);
        showMessage(
            "Unable to load your profile. Check that your local backend is running."
        );
    }
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = fields.name.value.trim();

    if (!name) {
        showMessage("Please enter your full name.");
        return;
    }

    saveButton.disabled = true;
    saveButton.textContent = "Saving...";

    try {
        const response = await fetch(
            `${API_BASE}/profile/${encodeURIComponent(user.id)}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name,
                    bio: fields.bio.value.trim(),
                    skills: fields.skills.value.trim(),
                    phone: fields.phone.value.trim(),
                    location: fields.location.value.trim()
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to save profile.");
        }

        user.name = name;
        localStorage.setItem("verilancerUser", JSON.stringify(user));

        showMessage("Profile updated successfully!", true);
    } catch (error) {
        console.error("Profile saving error:", error);
        showMessage(error.message || "Unable to save your profile.");
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = "Save Changes";
    }
});
