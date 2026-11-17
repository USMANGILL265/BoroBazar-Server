import express, { response } from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import cookieParser from "cookie-parser";
import helmet from "helmet";
import connectDb from "./config/connectDb.js";

import homeSliderRouter from './routes/homeSlider.routes.js'

import userRouter from "./routes/user.route.js";

const app = express();
app.use(cors());
app.options('/{*splat}', cors());

app.use(express.json());
app.use(cookieParser());

app.use(helmet({
    crossOriginResourcePolicy: false
}))


app.get("/", (request , response)=>{
    response.json({
        message: "Server is running at" + process.env.PORT
    })
})

app.use('/api/user', userRouter)
app.use('/api/homeSlider', homeSliderRouter);

connectDb().then(()=>{
    app.listen(process.env.PORT, ()=>{
        console.log("Server is Running at", process.env.PORT)
    })
})