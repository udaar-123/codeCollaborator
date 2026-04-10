import {Schema , model} from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new Schema({
    name:{
        type:String,
        required:[true,"Name is required"],
        trim:true
    },
    email:{
        type:String,
        required:[true,"Email is required"],
        unique:true,
        trim:true,

    },
    password:{
        type:String,
        required:[true,"Password is required"],
        minlength:[6,"Password must be at least 6 characters long"],
    },
    avatar:{
        type:String,
        default:""
    }
},{timestamps:true});

userSchema.pre("save",async function(){
    if(!this.isModified("password")){
        return ;
    }
    try {
        this.password = await bcrypt.hash(this.password,10);
    
    } catch (error) {
        return next(error)
    }
});

userSchema.methods.comparePassword = async function (userPass){
    if(!userPass){
        throw new Error("Password is required on userSchema.methods.comparePassword");
    }
    return await bcrypt.compare(userPass,this.password);
}

const User = model("User",userSchema);
export default User;    