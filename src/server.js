require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path"); // path module is used here

const prisma = require("./db");
const authRoutes = require("./routes/auth");
const postRoutes = require("./routes/posts");
const { isLoggedIn } = require("./middleware/auth");

const app = express();

// --- Middleware ---
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "views"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '..', 'Public')));


app.use(cookieParser());

// --- Routes ---
app.get("/", (req, res) => res.render("index"));
app.use("/", authRoutes);

// Profile Route
app.get("/profile", isLoggedIn, async (req, res) => {
  try {
    
    const user = await prisma.user.findUnique({ 
        where: { email: req.user.email } 
    });

    const posts = await prisma.post.findMany({
      where: { userId: user.id },
      include: { user: true, likes: true },
      orderBy: { date: "desc" },
    });
    
   
    if (!user) {
        return res.redirect('/login');
    }

    res.render("profile", { user, posts });
  } catch (err) {
    console.error("Error loading profile:", err);
    res.status(500).send("Internal server error");
  }
});

// Post Routes
app.use("/posts", postRoutes);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));