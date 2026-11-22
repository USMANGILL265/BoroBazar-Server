import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import cookieParser from "cookie-parser";
import helmet from "helmet";
import connectDb from "./config/connectDb.js";

import homeSliderRouter from "./routes/homeSlider.routes.js";
import userRouter from "./routes/user.route.js";
import categoryRouter from "./routes/category.routes.js";
import productRouter from "./routes/product.route.js";
const app = express();
app.use(cors());
app.options("/{*splat}", cors());

app.use(express.json());
app.use(cookieParser());

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  }),
);

app.use(async (req, res, next) => {
  try {
    await connectDb();
    next();
  } catch (error) {
    console.error("DB connection failed:", error);
    res.status(500).json({ message: "Database connection failed" });
  }
});

app.get("/", (request, response) => {
  response.json({
    message: "Server is running",
  });
});

app.use("/api/user", userRouter);
app.use("/api/homeSlider", homeSliderRouter);
app.use("/api/category", categoryRouter);
app.use("/api/product", productRouter);

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 8000;
  app.listen(PORT, () => {
    console.log("Server is Running at", PORT);
  });
}

export default app;
