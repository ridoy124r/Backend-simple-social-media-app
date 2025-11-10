const express = require("express");
const prisma = require("../db");
const { isLoggedIn } = require("../middleware/auth"); 

// FILE HANDLING 
const multer = require("multer");
const path = require("path");
const fs = require("fs"); 


const router = express.Router();


//  ==> MULTER CONFIGURATION


// storage settings
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    
    const uploadDir = path.join(__dirname, '..', '..', 'Public', 'uploads');
    
    
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    
    cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
  },
});


const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5 MB file size limit
});



// :=>Create Post 

router.post(
  "/create-post",
  isLoggedIn,
  upload.single("image"), 
  async (req, res) => {
    try {
      const { content } = req.body;
      
    
      const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

      await prisma.post.create({
        data: {
          content,
          userId: req.user.user_id,
          imagePath: imagePath, 
        },
      });
      res.redirect("/profile");
    } catch (err) {
      console.error(err);
      res.status(500).send("Error creating post");
    }
  }
);


// =>:Like/Unlike Post 

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


// => Get Edit 

router.get("/edit/:id", isLoggedIn, async (req, res) => {
  const { id } = req.params;
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return res.status(404).send("Post not found");
  if (post.userId !== req.user.user_id) return res.status(403).send("You cannot edit this post");
  res.render("edit-post", { post });
});


//  => Post Edit 

router.post(
  "/edit/:id", 
  isLoggedIn, 
  upload.single("image"), 
  async (req, res) => {
    const { id } = req.params;
    const { content } = req.body;
    const post = await prisma.post.findUnique({ where: { id } });
    
    if (!post) return res.status(404).send("Post not found");
    if (post.userId !== req.user.user_id)
      return res.status(403).send("You cannot edit this post");

    let updateData = { content };
    
    
    if (req.file) {
      const newImagePath = `/uploads/${req.file.filename}`;
      updateData.imagePath = newImagePath;

     
      if (post.imagePath) {
       
        const fullPath = path.join(__dirname, '..', '..', 'Public', post.imagePath);
        fs.unlink(fullPath, (err) => {
          if (err && err.code !== 'ENOENT') {
            console.error("Failed to delete old image:", err);
          }
        });
      }
    }

    await prisma.post.update({ where: { id }, data: updateData });
    res.redirect("/profile");
  }
);


// => Delete Post

router.get("/delete/:id", isLoggedIn, async (req, res) => {
  const { id } = req.params;
  const post = await prisma.post.findUnique({ where: { id } });

  if (!post) return res.status(404).send("Post not found");
  if (post.userId !== req.user.user_id) return res.status(403).send("Not authorized");


  if (post.imagePath) {
    const fullPath = path.join(__dirname, '..', '..', 'Public', post.imagePath);
    fs.unlink(fullPath, (err) => {
      if (err && err.code !== 'ENOENT') {
        console.error("Failed to delete image file:", err);
      }
    });
  }


  await prisma.postLike.deleteMany({ where: { postId: id } });
  await prisma.post.delete({ where: { id } });
  res.redirect("/profile");
});

module.exports = router;