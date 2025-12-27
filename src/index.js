 import express from "express";
 const app=express();
import connectDB from "./db/index.js";
import dotenv from "dotenv"
dotenv.config({path: './env'})  //require('dotenv').config({path: './env'})

connectDB()
.then(()=>{
     app.on("error", (error) => {
      //(error) for recieving the error
      console.log("ERR:", error);
      throw error;
    })
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`Server is running at port:${process.env.PORT}`);
    })
})
.catch((err)=>{
    console.log("MONGODB Connection Failed!!!",err);
})






// (async () => {
//   try {
//     await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
//     app.on("error", (error) => {
//       //(error) for recieving the error
//       console.log("ERR:", error);
//       throw error;
//     });

//     app.listen(process.env.PORT, () => {
//       console.log(`App is Listening on port ${process.env.PORT}`);
//     });
//   } catch (error) {
//     console.error("ERROR:", error);
//     throw err;
//   }
// })();
