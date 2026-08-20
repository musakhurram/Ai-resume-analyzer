const  express = require("express")
const cookieParser =require("cookie-parser")
const cors=require("cors")
const app = express()

app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true
}))
/* reqqire all the routes*/
const authRouter=require("./routes/auth.routes")
/*using all the routes here*/
app.use("/api/auth",authRouter)

module.exports= app