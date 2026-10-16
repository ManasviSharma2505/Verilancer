const express = require("express");
const cors = require("cors");
const db = require("./db");
const bcrypt = require("bcrypt");


const app = express();
app.use(cors());
const PORT = 5001;

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Verilancer backend is running!");
});

app.post("/api/signup", async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({
            message: "All fields are required."
        });
    }

    try {
        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = `
            INSERT INTO users (name, email, password, role)
            VALUES (?, ?, ?, ?)
        `;

        db.query(
            sql,
            [name, email, hashedPassword, role],
            (err, result) => {
                if (err) {
                    console.error("Signup error:", err);

                    if (err.code === "ER_DUP_ENTRY") {
                        return res.status(409).json({
                            message: "An account with this email already exists."
                        });
                    }

                    return res.status(500).json({
                        message: "Failed to create account."
                    });
                }

                res.status(201).json({
                    message: "Account created successfully!",
                    userId: result.insertId
                });
            }
        );
    } catch (error) {
        console.error("Password hashing error:", error);

        res.status(500).json({
            message: "Failed to create account."
        });
    }
});

app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password are required."
        });
    }

    const sql = `
        SELECT id, name, email, password, role
        FROM users
        WHERE email = ?
    `;

    db.query(sql, [email], async (err, results) => {
        if (err) {
            console.error("Login error:", err);

            return res.status(500).json({
                message: "Login failed."
            });
        }

        if (results.length === 0) {
            return res.status(401).json({
                message: "Incorrect email or password."
            });
        }

        const user = results[0];

        try {
            // Compare entered password with the stored bcrypt hash
            const isPasswordCorrect = await bcrypt.compare(
                password,
                user.password
            );

            if (!isPasswordCorrect) {
                return res.status(401).json({
                    message: "Incorrect email or password."
                });
            }

            res.status(200).json({
                message: "Login successful!",
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (error) {
            console.error("Password verification error:", error);

            res.status(500).json({
                message: "Login failed."
            });
        }
    });
});

app.get("/api/test", (req, res) => {
    res.json({ message: "API routes are working" });
});

app.get("/api/profile/:userId", (req, res) => {
    const { userId } = req.params;

    const sql = `
        SELECT 
            u.name,
            u.email,
            u.role,
            p.bio,
            p.skills,
            p.phone,
            p.location
        FROM users u
        LEFT JOIN professional_profiles p
            ON u.id = p.user_id
        WHERE u.id = ?
    `;

    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error("Profile fetch error:", err);

            return res.status(500).json({
                message: "Failed to fetch profile."
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        res.status(200).json(results[0]);
    });
});


/* =====================================
   PROJECT MARKETPLACE API
===================================== */

// Business posts a project
app.post("/api/projects", (req, res) => {
    const {
        businessId,
        title,
        description,
        category,
        budget,
        requiredSkills,
        deadline
    } = req.body;

    if (
        !businessId ||
        !title?.trim() ||
        !description?.trim() ||
        !category?.trim()
    ) {
        return res.status(400).json({
            message: "Business ID, title, description and category are required."
        });
    }

    const parsedBudget =
        budget === "" || budget === null || budget === undefined
            ? null
            : Number(budget);

    if (
        parsedBudget !== null &&
        (!Number.isFinite(parsedBudget) || parsedBudget < 0)
    ) {
        return res.status(400).json({
            message: "Please enter a valid, non-negative budget."
        });
    }

    // Confirm that the account is a business (client)
    db.query(
        "SELECT id FROM users WHERE id = ? AND role = 'client'",
        [businessId],
        (err, users) => {
            if (err) {
                console.error("Business verification error:", err);
                return res.status(500).json({
                    message: "Unable to verify business account."
                });
            }

            if (users.length === 0) {
                return res.status(403).json({
                    message: "Only business accounts can post projects."
                });
            }

            const sql = `
                INSERT INTO projects
                (business_id, title, description, category, budget,
                 required_skills, deadline)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            const values = [
                businessId,
                title.trim(),
                description.trim(),
                category.trim(),
                parsedBudget,
                requiredSkills?.trim() || null,
                deadline || null
            ];

            db.query(sql, values, (insertError, result) => {
                if (insertError) {
                    console.error("Project creation error:", insertError);
                    return res.status(500).json({
                        message: "Failed to post project."
                    });
                }

                res.status(201).json({
                    message: "Project posted successfully!",
                    projectId: result.insertId
                });
            });
        }
    );
});


// Browse published projects
app.get("/api/projects", (req, res) => {
    const sql = `
        SELECT
            p.id,
            p.title,
            p.description,
            p.category,
            p.budget,
            p.required_skills AS requiredSkills,
            p.deadline,
            p.status,
            p.created_at AS createdAt,
            u.name AS businessName
        FROM projects p
        JOIN users u ON p.business_id = u.id
        WHERE p.status = 'published'
        ORDER BY p.created_at DESC
    `;

    db.query(sql, (err, projects) => {
        if (err) {
            console.error("Project browsing error:", err);
            return res.status(500).json({
                message: "Failed to load projects."
            });
        }

        res.status(200).json(projects);
    });
});


// View projects posted by a business
app.get("/api/projects/mine/:businessId", (req, res) => {
    const { businessId } = req.params;

    db.query(
        "SELECT id FROM users WHERE id = ? AND role = 'client'",
        [businessId],
        (err, users) => {
            if (err) {
                console.error("Business verification error:", err);
                return res.status(500).json({
                    message: "Unable to verify business account."
                });
            }

            if (users.length === 0) {
                return res.status(403).json({
                    message: "A valid business account is required."
                });
            }

            const sql = `
                SELECT
                    id,
                    title,
                    description,
                    category,
                    budget,
                    required_skills AS requiredSkills,
                    deadline,
                    status,
                    created_at AS createdAt
                FROM projects
                WHERE business_id = ?
                ORDER BY created_at DESC
            `;

            db.query(sql, [businessId], (projectError, projects) => {
                if (projectError) {
                    console.error("My projects error:", projectError);
                    return res.status(500).json({
                        message: "Failed to load your projects."
                    });
                }

                res.status(200).json(projects);
            });
        }
    );
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});