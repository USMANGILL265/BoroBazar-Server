import { Router } from "express";
import auth from "../middlewares/auth.js";
import upload from "../middlewares/multer.js";

import {
  deleteImage,
  imagesUplaod,
  addHomeSlide,
  updateHomeSlide,
  deleteHomeSlide,
  getHomeSlides
} from "../controllers/homeSlider.controller.js";

const homeSliderRouter = Router();

homeSliderRouter.get("/getHomeSlides", getHomeSlides);
homeSliderRouter.post(
  "/uploadImages",
  auth,
  upload.array("images"),
  imagesUplaod
);

homeSliderRouter.delete(
  "/deleteImage",
  auth,
  deleteImage
);


homeSliderRouter.post(
  "/addHomeSlide",
  auth,
  addHomeSlide
);


homeSliderRouter.put(
  "/updateHomeSlide/:id",
  auth,
  updateHomeSlide
);

homeSliderRouter.delete(
  "/deleteHomeSlide/:id",
  auth,
  deleteHomeSlide
);

export default homeSliderRouter;
