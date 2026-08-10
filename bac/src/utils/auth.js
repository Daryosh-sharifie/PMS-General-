const jwt = require("jsonwebtoken");
const bcrypt= require("bcryptjs");
const crypto= require("crypto");

const ACCESS_JWT_SECRET= process.env.ACCESS_JWT_SECRET;
const REFRESH_JWT_SECRET= process.env.REFRESH_JWT_SECRET;

exports.genrateAccessToken = (userId)=>{
        return jwt.sign({userId},ACCESS_JWT_SECRET,{
             expiresIn:"15m"
         });
         
          
};

exports.genrateRefreshToken=(userId)=>{
     return crypto.randomBytes(64).toString("hex");
};


exports.hashRefreshToken= async (refreshToken)=>{
    return await bcrypt.hash(refreshToken,10);
};

exports.verifyRefreshToken= async (refreshToken,hashedRefreshToken)=>{
    return await bcrypt.compare(refreshToken,hashedRefreshToken);
};

exports.verifyAccessToken= (token)=>{
    try{
        return jwt.verify(token,ACCESS_JWT_SECRET);
    }catch(err){
        return null;
    }
};

