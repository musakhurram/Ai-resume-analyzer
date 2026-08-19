require("dotenv").config()
const app = require("./src/app")

app.listen(300,()=>{
    console.log("Server is running on port 3000")
})