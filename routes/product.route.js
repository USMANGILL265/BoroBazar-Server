
import { Router } from "express";
import upload from "../middlewares/multer.js";
import auth from "../middlewares/auth.js";

import {
  imagesUplaod,
  createProduct,
  getAllProduct,
  getAllProductByCatName,
  getAllProductByPrice,
  getAllProductByRating,
  getAllProductsCount,
  getAllFeaturedProducts,
  deleteProducts,
  deleteMultipleProducts,
  getSingleProducts,
  deleteImage,
  updateProduct,
  filters,
  sortBy,
  searchProductController,
} from "../controllers/product.controller.js";

const productRouter = Router();

// Protected routes - Login required
productRouter.post("/upload", auth, upload.array("images"), imagesUplaod);
productRouter.post("/create", auth, createProduct);
productRouter.delete("/deleteMultiple", auth, deleteMultipleProducts);
productRouter.delete("/delete/:id", auth, deleteProducts);
productRouter.delete("/deleteImage", auth, deleteImage);
productRouter.put("/update/:id", auth, updateProduct);

// Public routes - No login required
productRouter.get("/getAll", getAllProduct);
productRouter.get("/getAllProductByCatName", getAllProductByCatName);
productRouter.get("/getAllProductByPrice", getAllProductByPrice);
productRouter.get("/getAllProductByRating", getAllProductByRating);
productRouter.get("/getAllProductsCount", getAllProductsCount);
productRouter.get("/getAllFeaturedProducts", getAllFeaturedProducts);
productRouter.get("/get/:id", getSingleProducts);

productRouter.post("/filters", filters);
productRouter.post("/sortBy", sortBy);
productRouter.post("/search", searchProductController);

export default productRouter;
