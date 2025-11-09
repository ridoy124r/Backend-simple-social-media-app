const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../db");


const router = express.Router();


// Register GET
router.get("/register", (req, res) => res.render("register"));


// Register POST
router.post("/register", async (req, res) => {
const { email, password, name } = req.body;
try {
const existingUser = await prisma.user.findUnique({ where: { email } });
if (existingUser) return res.status(400).send("Email already exists");


const hashedPassword = await bcrypt.hash(password, 10);
const user = await prisma.user.create({
data: { email, password: hashedPassword, name }
});


const token = jwt.sign({ email: user.email, user_id: user.id }, process.env.JWT_SECRET);
res.cookie("token", token, { httpOnly: true });
res.redirect("/profile");
} catch (err) {
console.error(err);
res.status(500).send("Server error during registration");
}
});



router.get("/login", (req, res) => res.render("login"));



router.post("/login", async (req, res) => {
const { email, password } = req.body;
try {
const user = await prisma.user.findUnique({ where: { email } });
if (!user) return res.status(404).send("User not found");


const match = await bcrypt.compare(password, user.password);
if (!match) return res.status(401).send("Invalid password");


const token = jwt.sign({ email: user.email, user_id: user.id }, process.env.JWT_SECRET);
res.cookie("token", token, { httpOnly: true });
res.redirect("/profile");
} catch (err) {
console.error(err);
res.status(500).send("Server error");
}
});


// Logout
router.get("/logout", (req, res) => {
res.cookie("token", "", { maxAge: 0 });
res.redirect("/login");
});


module.exports = router;