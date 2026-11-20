import { Router } from "express";
import auth from "../middlewares/auth.js";
import upload from "../middlewares/multer.js";

import {
  imagesUplaod,
  createCategory,
  getCategory,
  deleteImage,
  deleteCategory,
  updateCategory,
  getSingleCategory,
} from "../controllers/category.controller.js";

const categoryRouter = Router();

// Upload images
categoryRouter.post("/upload", auth, upload.array("images"), imagesUplaod);
categoryRouter.get("/:id", getSingleCategory);
// Create category
categoryRouter.post("/add", auth, createCategory);

// Get all categories
categoryRouter.get("/", getCategory);

// Delete uploaded image
categoryRouter.delete("/deleteImage", auth, deleteImage);

// Update category
categoryRouter.put("/update/:id", auth, updateCategory);

// Delete category
categoryRouter.delete("/delete/:id", auth, deleteCategory);

export default categoryRouter;
