const express = require("express");
const cors = require("cors");
const db = require("./db");
const bcrypt = require("bcrypt");


const app = express();
app.use(cors());
const PORT = 5001;

app.use((req, res, next) => {
    console.log("REQUEST RECEIVED:", req.method, req.url);
    next();
});

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


app.post("/api/login", (req, res) => {
    console.log("LOGIN REQUEST RECEIVED");

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
            console.error("LOGIN DATABASE ERROR:", err);
            return res.status(500).json({
                message: "Database query failed."
            });
        }

        if (results.length === 0) {
            return res.status(401).json({
                message: "Incorrect email or password."
            });
        }

        try {
            const user = results[0];

            const isPasswordCorrect = await bcrypt.compare(
                password,
                user.password
            );

            if (!isPasswordCorrect) {
                return res.status(401).json({
                    message: "Incorrect email or password."
                });
            }

            console.log("LOGIN SUCCESS:", user.email);

            return res.status(200).json({
                message: "Login successful!",
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (error) {
            console.error("LOGIN PASSWORD ERROR:", error);

            return res.status(500).json({
                message: "Password verification failed."
            });
        }
    });
});


app.get("/api/test", (req, res) => {
    res.json({ message: "API routes are working" });
});




app.get("/api/profile/:userId", (req, res) => {
    const userId = Number(req.params.userId);

    if (!Number.isInteger(userId) || userId <= 0) {
        return res.status(400).json({
            message: "Valid user ID is required."
        });
    }

    const sql = `
        SELECT
            u.name,
            u.email,
            u.role,
            p.bio,
            p.skills,
            p.phone,
            p.location,
            p.headline,
            p.portfolio,
            p.experience,
            p.education,
            p.certifications,
            p.availability
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




app.put("/api/profile/:userId", (req, res) => {
    const userId = Number(req.params.userId);

    const {
        name,
        bio,
        skills,
        phone,
        location,
        headline,
        portfolio,
        experience,
        education,
        certifications,
        availability
    } = req.body;

    if (!Number.isInteger(userId) || userId <= 0) {
        return res.status(400).json({
            message: "Valid user ID is required."
        });
    }

    if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
            message: "Name is required."
        });
    }

    const updateUserSql = `
        UPDATE users
        SET name = ?
        WHERE id = ?
    `;

    db.query(updateUserSql, [name.trim(), userId], (err, result) => {
        if (err) {
            console.error("Profile name update error:", err);
            return res.status(500).json({
                message: "Unable to update profile."
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        const profileSql = `
            INSERT INTO professional_profiles (
                user_id,
                bio,
                skills,
                phone,
                location,
                headline,
                portfolio,
                experience,
                education,
                certifications,
                availability
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                bio = VALUES(bio),
                skills = VALUES(skills),
                phone = VALUES(phone),
                location = VALUES(location),
                headline = VALUES(headline),
                portfolio = VALUES(portfolio),
                experience = VALUES(experience),
                education = VALUES(education),
                certifications = VALUES(certifications),
                availability = VALUES(availability)
        `;

        db.query(
            profileSql,
            [
                userId,
                bio || "",
                skills || "",
                phone || "",
                location || "",
                headline || "",
                portfolio || "",
                experience || "",
                education || "",
                certifications || "",
                availability || ""
            ],
            (profileErr) => {
                if (profileErr) {
                    console.error("Profile details update error:", profileErr);
                    return res.status(500).json({
                        message: "Name was updated, but profile details could not be saved."
                    });
                }

                res.json({
                    message: "Profile updated successfully."
                });
            }
        );
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



/* =====================================
   CLOSE PROJECT API
===================================== */

app.patch("/api/projects/:projectId/close", (req, res) => {
    const { projectId } = req.params;
    const { businessId } = req.body;

    if (!Number.isInteger(Number(projectId)) ||
        Number(projectId) <= 0 ||
        !Number.isInteger(Number(businessId)) ||
        Number(businessId) <= 0) {
        return res.status(400).json({
            message: "Valid project and business IDs are required."
        });
    }

    const sql = `
        UPDATE projects
        SET status = 'closed'
        WHERE id = ?
          AND business_id = ?
          AND status = 'published'
    `;

    db.query(sql, [Number(projectId), Number(businessId)], (err, result) => {
        if (err) {
            console.error("Close project error:", err);
            return res.status(500).json({
                message: "Unable to close project."
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Project not found, already closed, or not owned by this business."
            });
        }

        return res.json({
            message: "Project closed successfully."
        });
    });
});


/* =====================================
   PROJECT APPLICATIONS API
===================================== */

// Professional applies to a published project
app.post("/api/projects/:projectId/applications", (req, res) => {
    const projectId = Number(req.params.projectId);
    const professionalId = Number(req.body.professionalId);
    const proposal = req.body.proposal?.trim();
    const bidAmount = Number(req.body.bidAmount);

    if (
    !Number.isInteger(projectId) ||
    projectId <= 0 ||
    !Number.isInteger(professionalId) ||
    professionalId <= 0 ||
    !proposal ||
    !Number.isFinite(bidAmount) ||
    bidAmount <= 0
) {
    return res.status(400).json({
        message: "Valid IDs, a proposal, and a bid amount greater than zero are required."
    });
}

    db.query(
        "SELECT id FROM users WHERE id = ? AND role = 'student'",
        [professionalId],
        (userError, users) => {
            if (userError) {
                console.error("Applicant verification error:", userError);
                return res.status(500).json({
                    message: "Unable to verify professional account."
                });
            }

            if (users.length === 0) {
                return res.status(403).json({
                    message: "Only professional accounts can apply."
                });
            }

            db.query(
                "SELECT id FROM projects WHERE id = ? AND status = 'published'",
                [projectId],
                (projectError, projects) => {
                    if (projectError) {
                        console.error("Application project check error:", projectError);
                        return res.status(500).json({
                            message: "Unable to verify project."
                        });
                    }

                    if (projects.length === 0) {
                        return res.status(404).json({
                            message: "Project not found or no longer accepting applications."
                        });
                    }

                    const sql = `
    INSERT INTO project_applications
        (project_id, professional_id, bid_amount, proposal)
    VALUES (?, ?, ?, ?)
`;

db.query(
    sql,
    [projectId, professionalId, bidAmount, proposal],
    (insertErr, result) => {
        if (insertErr) {
            if (insertErr.code === "ER_DUP_ENTRY") {
                return res.status(409).json({
                    message: "You have already applied to this project."
                });
            }

            console.error("Application insert error:", insertErr);

            return res.status(500).json({
                message: "Unable to submit your application."
            });
        }

        return res.status(201).json({
            message: "Your bid and proposal have been submitted successfully!",
            applicationId: result.insertId
        });
    }
);
                }
            );
        }
    );
});


// Professional views their applications
app.get("/api/applications/mine/:professionalId", (req, res) => {
    const professionalId = Number(req.params.professionalId);

    if (!Number.isInteger(professionalId) || professionalId <= 0) {
        return res.status(400).json({
            message: "A valid professional ID is required."
        });
    }

    db.query(
        "SELECT id FROM users WHERE id = ? AND role = 'student'",
        [professionalId],
        (userError, users) => {
            if (userError) {
                console.error("Professional verification error:", userError);
                return res.status(500).json({
                    message: "Unable to verify professional account."
                });
            }

            if (users.length === 0) {
                return res.status(403).json({
                    message: "A valid professional account is required."
                });
            }

            const sql = `
                SELECT
                    a.id AS applicationId,
                    a.project_id AS projectId,
                    a.proposal,
                    a.status AS applicationStatus,
                    a.created_at AS appliedAt,
                    p.title,
                    p.category,
                    p.budget,
                    p.deadline,
                    p.status AS projectStatus,
                    u.name AS businessName
                FROM project_applications a
                JOIN projects p ON a.project_id = p.id
                JOIN users u ON p.business_id = u.id
                WHERE a.professional_id = ?
                ORDER BY a.created_at DESC
            `;

            db.query(sql, [professionalId], (err, applications) => {
                if (err) {
                    console.error("My applications error:", err);
                    return res.status(500).json({
                        message: "Failed to load applications."
                    });
                }

                return res.json(applications);
            });
        }
    );
});


// Business views applicants for its own project

app.get("/api/projects/:projectId/applications", (req, res) => {
    const projectId = Number(req.params.projectId);
    const businessId = Number(req.query.businessId);

    if (
        !Number.isInteger(projectId) || projectId <= 0 ||
        !Number.isInteger(businessId) || businessId <= 0
    ) {
        return res.status(400).json({
            message: "Valid project and business IDs are required."
        });
    }

    const sql = `
        SELECT
            pa.id AS applicationId,
            pa.project_id AS projectId,
            pa.professional_id AS professionalId,
            pa.bid_amount AS bidAmount,
            pa.proposal,
            pa.status,
            pa.created_at AS createdAt,
            u.name AS professionalName,
            u.email AS professionalEmail,
            pp.skills,
            pp.bio,
            pp.location
        FROM project_applications pa
        JOIN projects p
            ON p.id = pa.project_id
        JOIN users u
            ON u.id = pa.professional_id
        LEFT JOIN professional_profiles pp
            ON pp.user_id = u.id
        WHERE pa.project_id = ?
          AND p.business_id = ?
        ORDER BY pa.created_at DESC
    `;

    db.query(sql, [projectId, businessId], (err, applications) => {
        if (err) {
            console.error("Fetch proposals error:", err);
            return res.status(500).json({
                message: "Unable to load proposals."
            });
        }

        return res.json(applications);
    });
});



// Business updates an application's status
app.patch("/api/applications/:applicationId/status", (req, res) => {
    const applicationId = Number(req.params.applicationId);
    const businessId = Number(req.body.businessId);
    const status = req.body.status;

    if (
        !Number.isInteger(applicationId) || applicationId <= 0 ||
        !Number.isInteger(businessId) || businessId <= 0 ||
        !["accepted", "rejected"].includes(status)
    ) {
        return res.status(400).json({
            message: "Valid application, business and status are required."
        });
    }

    const sql = `
        UPDATE project_applications a
        JOIN projects p ON a.project_id = p.id
        SET a.status = ?
        WHERE a.id = ?
          AND p.business_id = ?
          AND p.status = 'published'
          AND a.status = 'pending'
    `;

    db.query(
        sql,
        [status, applicationId, businessId],
        (err, result) => {
            if (err) {
                console.error("Application status update error:", err);
                return res.status(500).json({
                    message: "Failed to update application status."
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Pending application not found for your published project."
                });
            }

            return res.json({
                message: `Application ${status} successfully.`
            });
        }
    );
});



app.get("/api/professional-profiles/:userId", (req, res) => {
    const userId = Number(req.params.userId);

    if (!Number.isInteger(userId) || userId <= 0) {
        return res.status(400).json({
            message: "Valid professional ID is required."
        });
    }

    const sql = `
        SELECT
            u.id,
            u.name,
            pp.skills,
            pp.bio,
            pp.location
        FROM users u
        LEFT JOIN professional_profiles pp
            ON pp.user_id = u.id
        WHERE u.id = ?
          AND u.role = 'student'
    `;

    db.query(sql, [userId], (err, rows) => {
        if (err) {
            console.error("Professional profile error:", err);
            return res.status(500).json({
                message: "Unable to load your professional profile."
            });
        }

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Professional profile not found."
            });
        }

        return res.json(rows[0]);
    });
});


/* =====================================
   PROJECT MESSAGES API
===================================== */

// List conversations for a professional or business.
app.get("/api/messages/conversations/:userId", (req, res) => {
    const userId = Number(req.params.userId);

    if (!Number.isInteger(userId) || userId <= 0) {
        return res.status(400).json({ message: "Valid user ID required." });
    }

    const sql = `
        SELECT
            a.id AS applicationId,
            p.id AS projectId,
            p.title AS projectTitle,
            a.status AS applicationStatus,
            professional.id AS professionalId,
            professional.name AS professionalName,
            business.id AS businessId,
            business.name AS businessName,
            latest.message AS lastMessage,
            latest.created_at AS lastMessageAt
        FROM project_applications a
        JOIN projects p ON p.id = a.project_id
        JOIN users professional ON professional.id = a.professional_id
        JOIN users business ON business.id = p.business_id
        LEFT JOIN project_messages latest
            ON latest.id = (
                SELECT m.id
                FROM project_messages m
                WHERE m.application_id = a.id
                ORDER BY m.created_at DESC, m.id DESC
                LIMIT 1
            )
        WHERE a.professional_id = ?
           OR p.business_id = ?
        ORDER BY COALESCE(latest.created_at, a.created_at) DESC
    `;

    db.query(sql, [userId, userId], (err, rows) => {
        if (err) {
            console.error("Conversations error:", err);
            return res.status(500).json({
                message: "Unable to load conversations."
            });
        }

        db.query(
            "SELECT role FROM users WHERE id = ?",
            [userId],
            (userErr, users) => {
                if (userErr) {
                    return res.status(500).json({
                        message: "Unable to verify account."
                    });
                }

                if (!users.length) {
                    return res.status(404).json({
                        message: "Account not found."
                    });
                }

                const role = users[0].role;

                if (!["student", "client"].includes(role)) {
                    return res.status(403).json({
                        message: "Account type cannot access messages."
                    });
                }

                const conversations = rows.filter(row =>
                    role === "student"
                        ? Number(row.professionalId) === userId
                        : Number(row.businessId) === userId
                );

                return res.json(conversations);
            }
        );
    });
});


// Load messages after verifying application participation.
app.get("/api/messages/:applicationId", (req, res) => {
    const applicationId = Number(req.params.applicationId);
    const userId = Number(req.query.userId);

    if (
        !Number.isInteger(applicationId) || applicationId <= 0 ||
        !Number.isInteger(userId) || userId <= 0
    ) {
        return res.status(400).json({
            message: "Valid application and user IDs required."
        });
    }

    const sql = `
        SELECT
            m.id,
            m.application_id AS applicationId,
            m.sender_id AS senderId,
            m.message,
            m.created_at AS createdAt,
            u.name AS senderName
        FROM project_messages m
        JOIN users u ON u.id = m.sender_id
        WHERE m.application_id = ?
          AND EXISTS (
              SELECT 1
              FROM project_applications a
              JOIN projects p ON p.id = a.project_id
              WHERE a.id = m.application_id
                AND (a.professional_id = ? OR p.business_id = ?)
          )
        ORDER BY m.created_at ASC, m.id ASC
    `;

    // Verify access even when the conversation has no messages yet.
    db.query(
        `SELECT a.id
         FROM project_applications a
         JOIN projects p ON p.id = a.project_id
         WHERE a.id = ?
           AND (a.professional_id = ? OR p.business_id = ?)`,
        [applicationId, userId, userId],
        (checkErr, access) => {
            if (checkErr) {
                console.error("Message access check error:", checkErr);
                return res.status(500).json({
                    message: "Unable to verify conversation access."
                });
            }

            if (!access.length) {
                return res.status(403).json({
                    message: "You cannot access this conversation."
                });
            }

            db.query(sql, [applicationId, userId, userId], (err, messages) => {
                if (err) {
                    console.error("Load messages error:", err);
                    return res.status(500).json({
                        message: "Unable to load messages."
                    });
                }

                return res.json(messages);
            });
        }
    );
});


// Send a message within an existing application conversation.
app.post("/api/messages/:applicationId", (req, res) => {
    const applicationId = Number(req.params.applicationId);
    const senderId = Number(req.body.userId);
    const message = typeof req.body.message === "string"
        ? req.body.message.trim()
        : "";

    if (
        !Number.isInteger(applicationId) || applicationId <= 0 ||
        !Number.isInteger(senderId) || senderId <= 0 ||
        !message || message.length > 5000
    ) {
        return res.status(400).json({
            message: "Valid IDs and a message of 1–5000 characters are required."
        });
    }

    const accessSql = `
        SELECT a.id
        FROM project_applications a
        JOIN projects p ON p.id = a.project_id
        WHERE a.id = ?
          AND (a.professional_id = ? OR p.business_id = ?)
    `;

    db.query(
        accessSql,
        [applicationId, senderId, senderId],
        (checkErr, rows) => {
            if (checkErr) {
                console.error("Send message access check error:", checkErr);
                return res.status(500).json({
                    message: "Unable to verify conversation access."
                });
            }

            if (!rows.length) {
                return res.status(403).json({
                    message: "You cannot send messages in this conversation."
                });
            }

            db.query(
                `INSERT INTO project_messages
                    (application_id, sender_id, message)
                 VALUES (?, ?, ?)`,
                [applicationId, senderId, message],
                (insertErr, result) => {
                    if (insertErr) {
                        console.error("Send message error:", insertErr);
                        return res.status(500).json({
                            message: "Unable to send message."
                        });
                    }

                    return res.status(201).json({
                        message: "Message sent successfully.",
                        id: result.insertId
                    });
                }
            );
        }
    );
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});