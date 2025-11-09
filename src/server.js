require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");

const prisma = require("./db");
const authRoutes = require("./routes/auth");
const postRoutes = require("./routes/posts");
const { isLoggedIn } = require("./middleware/auth");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "views"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => res.render("index"));
app.use("/", authRoutes);

app.get("/profile", isLoggedIn, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { email: req.user.email } });
    const posts = await prisma.post.findMany({
      where: { userId: user.id },
      include: { user: true, likes: true },
      orderBy: { date: "desc" },
    });
    res.render("profile", { user, posts });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
});

app.use("/posts", postRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));