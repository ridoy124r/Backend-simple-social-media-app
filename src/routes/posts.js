const express = require("express");
const prisma = require("../db");
const { isLoggedIn } = require("../middleware/auth");

const router = express.Router();

router.post("/create-post", isLoggedIn, async (req, res) => {
  try {
    const { content } = req.body;
    await prisma.post.create({
      data: { content, userId: req.user.user_id },
    });
    res.redirect("/profile");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating post");
  }
});

router.post("/like/:id", isLoggedIn, async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.user_id;
  try {
    const existing = await prisma.postLike.findFirst({ where: { postId, userId } });
    if (existing) {
      await prisma.postLike.delete({ where: { id: existing.id } });
    } else {
      await prisma.postLike.create({ data: { postId, userId } });
    }
    res.redirect("/profile");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error liking post");
  }
});

router.get("/edit/:id", isLoggedIn, async (req, res) => {
  const { id } = req.params;
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return res.status(404).send("Post not found");
  if (post.userId !== req.user.user_id) return res.status(403).send("You cannot edit this post");
  res.render("edit-post", { post });
});

router.post("/edit/:id", isLoggedIn, async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return res.status(404).send("Post not found");
  if (post.userId !== req.user.user_id) return res.status(403).send("You cannot edit this post");

  await prisma.post.update({ where: { id }, data: { content } });
  res.redirect("/profile");
});

router.get("/delete/:id", isLoggedIn, async (req, res) => {
  const { id } = req.params;
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return res.status(404).send("Post not found");
  if (post.userId !== req.user.user_id) return res.status(403).send("Not authorized");

  await prisma.postLike.deleteMany({ where: { postId: id } });
  await prisma.post.delete({ where: { id } });
  res.redirect("/profile");
});

module.exports = router;