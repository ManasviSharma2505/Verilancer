
const API_BASE = "http://localhost:5001/api";

const form = document.getElementById("profileForm");
const editSection = document.getElementById("profileEditSection");
const viewSection = document.getElementById("profileViewSection");
const editButton = document.getElementById("editProfileBtn");
const message = document.getElementById("profileMessage");
const saveButton = document.getElementById("saveProfileBtn");

const fields = {
    name: document.getElementById("profileName"),
    email: document.getElementById("profileEmail"),
    bio: document.getElementById("profileBio"),
    skills: document.getElementById("profileSkills"),
    phone: document.getElementById("profilePhone"),
    location: document.getElementById("profileLocation"),
    headline: document.getElementById("profileHeadline"),
    portfolio: document.getElementById("profilePortfolio"),
    experience: document.getElementById("profileExperience"),
    education: document.getElementById("profileEducation"),
    certifications: document.getElementById("profileCertifications"),
    availability: document.getElementById("profileAvailability")
};

const display = {
    name: document.getElementById("portfolioDisplayName"),
    headline: document.getElementById("portfolioDisplayHeadline"),
    location: document.getElementById("portfolioDisplayLocation"),
    avatar: document.getElementById("portfolioAvatar"),
    skills: document.getElementById("profileSkillsPreview")
};

let user;
let savedProfile = false;

try {
    user = JSON.parse(localStorage.getItem("verilancerUser"));
} catch {
    user = null;
}

const loggedIn =
    localStorage.getItem("verilancerLoggedIn") === "true";

if (!user?.id || !loggedIn) {
    window.location.href = "login.html";
} else {
    loadProfile();
}

function showMessage(text, success = false) {
    message.textContent = text;
    message.style.color = success ? "#16803c" : "#d93025";
}

function renderText(elementId, value, emptyMessage) {
    const element = document.getElementById(elementId);
    element.replaceChildren();

    const text = (value || "").trim();

    if (!text) {
        element.textContent = emptyMessage;
        element.classList.add("portfolio-empty");
        return;
    }

    element.classList.remove("portfolio-empty");

    text.split(/\r?\n/).forEach(line => {
        const paragraph = document.createElement("p");
        paragraph.style.whiteSpace = "pre-wrap";
        paragraph.style.overflowWrap = "anywhere";
        paragraph.textContent = line;
        element.appendChild(paragraph);
    });
}

function renderSkills() {
    const container = document.getElementById("viewSkills");
    container.replaceChildren();

    const skills = fields.skills.value
        .split(",")
        .map(skill => skill.trim())
        .filter(Boolean);

    if (!skills.length) {
        container.textContent = "No skills added yet.";
        container.classList.add("portfolio-empty");
        return;
    }

    container.classList.remove("portfolio-empty");

    skills.forEach(skill => {
        const tag = document.createElement("span");
        tag.className = "portfolio-skill";
        tag.textContent = skill;
        container.appendChild(tag);
    });
}

function renderPortfolio() {
    renderText("viewBio", fields.bio.value, "No summary added yet.");
    renderSkills();

    renderText(
        "viewAvailability",
        fields.availability.value,
        "Not specified."
    );

    renderText(
        "viewExperience",
        fields.experience.value,
        "No experience added yet."
    );

    renderText(
        "viewEducation",
        fields.education.value,
        "No education added yet."
    );

    renderText(
        "viewCertifications",
        fields.certifications.value,
        "None added yet."
    );

    const container = document.getElementById("viewPortfolio");
    container.replaceChildren();

    const projects = fields.portfolio.value
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean);

    if (!projects.length) {
        container.textContent = "No portfolio projects added yet.";
        container.classList.add("portfolio-empty");
        return;
    }

    container.classList.remove("portfolio-empty");

    projects.forEach(project => {
        const parts = project.split("|").map(part => part.trim());

        const [name, description, github, demo] = parts;

        const card = document.createElement("div");
        card.className = "portfolio-project";

        const title = document.createElement("strong");
        title.textContent = name || "Untitled Project";
        card.appendChild(title);

        if (description) {
            const paragraph = document.createElement("p");
            paragraph.textContent = description;
            card.appendChild(paragraph);
        }

        [
            ["GitHub", github],
            ["Live Demo", demo]
        ].forEach(([label, url]) => {
            if (!url) return;

            try {
                const parsedUrl = new URL(url);

                if (!["http:", "https:"].includes(parsedUrl.protocol)) {
                    return;
                }

                const link = document.createElement("a");
                link.href = parsedUrl.href;
                link.textContent = label;
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                card.appendChild(link);
            } catch {
                // Ignore invalid URLs.
            }
        });

        container.appendChild(card);
    });
}

function setEditMode(enabled) {
    editSection.hidden = !enabled;
    viewSection.hidden = enabled;
    editButton.hidden = enabled || !savedProfile;

    if (enabled) {
        saveButton.innerHTML =
            '<i class="fa-solid fa-floppy-disk"></i> Save Changes';
    }
}

function updatePreview() {
    const name = fields.name.value.trim() || "Your Name";
    const headline = fields.headline.value.trim() ||
        "Add your professional headline";
    const location = fields.location.value.trim() || "Add your location";

    display.name.textContent = name;
    display.headline.textContent = headline;

    display.location.replaceChildren();

    const locationIcon = document.createElement("i");
    locationIcon.className = "fa-solid fa-location-dot";

    display.location.append(
        locationIcon,
        document.createTextNode(" " + location)
    );

    display.avatar.textContent = name.charAt(0).toUpperCase();

    document.getElementById("profileAvatar").textContent =
        name.charAt(0).toUpperCase();

    document.getElementById("headerUserName").textContent = name;

    display.skills.replaceChildren();

    fields.skills.value
        .split(",")
        .map(skill => skill.trim())
        .filter(Boolean)
        .forEach(skill => {
            const tag = document.createElement("span");
            tag.className = "portfolio-skill";
            tag.textContent = skill;
            display.skills.appendChild(tag);
        });
}

[
    fields.name,
    fields.headline,
    fields.location,
    fields.skills
].forEach(field => {
    field.addEventListener("input", updatePreview);
});

editButton.addEventListener("click", () => {
    setEditMode(true);
    showMessage("");
    fields.name.focus();
});

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
        fields.headline.value = data.headline || "";
        fields.portfolio.value = data.portfolio || "";
        fields.experience.value = data.experience || "";
        fields.education.value = data.education || "";
        fields.certifications.value = data.certifications || "";
        fields.availability.value = data.availability || "";

        document.getElementById("headerUserRole").textContent =
            data.role === "client" ? "Business" : "Professional";

        savedProfile = Boolean(
            data.bio ||
            data.skills ||
            data.phone ||
            data.location ||
            data.headline ||
            data.portfolio ||
            data.experience ||
            data.education ||
            data.certifications ||
            data.availability
        );

        updatePreview();
        renderPortfolio();
        setEditMode(!savedProfile);
        showMessage("");
    } catch (error) {
        console.error("Profile loading error:", error);

        showMessage(
            "Unable to load your profile. Check that your backend is running."
        );

        setEditMode(true);
    }
}

form.addEventListener("submit", async event => {
    event.preventDefault();

    const name = fields.name.value.trim();

    if (!name) {
        showMessage("Please enter your full name.");
        fields.name.focus();
        return;
    }

    saveButton.disabled = true;
    saveButton.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

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
                    location: fields.location.value.trim(),
                    headline: fields.headline.value.trim(),
                    portfolio: fields.portfolio.value.trim(),
                    experience: fields.experience.value.trim(),
                    education: fields.education.value.trim(),
                    certifications: fields.certifications.value.trim(),
                    availability: fields.availability.value
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to save profile.");
        }

        user.name = name;
        localStorage.setItem("verilancerUser", JSON.stringify(user));

        savedProfile = true;
        updatePreview();
        renderPortfolio();
        setEditMode(false);

        showMessage("Profile saved successfully!", true);
    } catch (error) {
        console.error("Profile saving error:", error);
        showMessage(error.message || "Unable to save your profile.");
    } finally {
        saveButton.disabled = false;
        saveButton.innerHTML =
            '<i class="fa-solid fa-floppy-disk"></i> Save Changes';
    }
});
