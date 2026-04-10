import {createClient} from 'redis';
import dotenv from 'dotenv';
dotenv.config();

const redis = createClient({
    url: process.env.REDIS_URL
})
redis.on('error',(err)=>{
    console.log("error connecting redis",err)
})
redis.on("connect",()=>{
    console.log("connected to redis successfully");
})
await redis.connect()

export default redis;