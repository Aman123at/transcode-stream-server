import { User } from "../models/user.models.js";

const findUserById = async(userId,withPassword=false)=>{
    const user = withPassword ? User.findById(userId).select("-password") : await User.findById(userId);
    return user;
}
const findOneUser = async (query)=>{
    return await User.findOne(query);
}
const saveUserInDB = async (user)=>{
    await user.save({ validateBeforeSave: false });
}
const createNewUser = async(payload)=>{
    return await User.create(payload)
}
export {findUserById,findOneUser,saveUserInDB,createNewUser}