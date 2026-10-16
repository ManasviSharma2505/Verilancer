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

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});