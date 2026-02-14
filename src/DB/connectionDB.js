import mongoose from "mongoose";

const checkConnectionDB = async () => {
    return await mongoose.connect("mongodb://127.0.0.1:27017/Saraha_App")
        .then(() => {
            console.log("Database connected successfully...✅");
        })
        .catch((err) => {
            console.log(`Fail to connect to Database...❌ ${err}`);
        });
};

export default checkConnectionDB;