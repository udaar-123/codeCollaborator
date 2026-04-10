import {Schema,model} from "mongoose";
import {nanoid} from "nanoid";

const participantSchema = new Schema({
  userId : {
    type:Schema.Types.ObjectId,
    ref:"User",
    required:true
  },
  color:{
    type:String,
     default: "#58a6ff"
  },
  role:{
    type:String,
    enum:["owner","editor","viewer"],
    default:"editor"
  },
  joinedAt:{
    type:Date,
    default:Date.now
  }
},{_id:false});

const roomSchema = new Schema({
  roomId : {
    type:String,
    required:true,
    unique:true,
    default: ()=> nanoid(10)
  },
  name:{
    type:String,
    required: [true, "Room name is required"],
    trim: true,
  },
  owner:{
    type:Schema.Types.ObjectId,
    ref:"User",
    required:true
  },
  participants:[participantSchema],
  language:{
    type:String,
    default:"javascript",
    enum: ["javascript", "python", "cpp", "java", "typescript"]
  },
  content:{
    type:String,
     default:"",
  },
  isPublic:{
    type:Boolean,
    default:true
  },
  version:{
    type:Number,
    default:0 
  }
},{timestamps:true});

const Room = model("Room",roomSchema);
export default Room;