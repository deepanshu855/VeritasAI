import mongoose from "mongoose";

const connectToDb= async()=>{
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Database connected!")
    } catch (err) {
        console.log("Database not connected ", err)
    }
}

export default connectToDb;