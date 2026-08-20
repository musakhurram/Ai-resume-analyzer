const  express = require("express")
const cookieParser =require("cookie-parser")

const app = express()

app.use(express.json())
app.use(cookieParser())
/* reqqire all the routes*/
const authRouter=require("./routes/auth.routes")
/*using all the routes here*/
app.use("/api/auth",authRouter)

module.exports= app