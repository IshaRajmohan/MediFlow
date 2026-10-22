require('dotenv').config();
const server=require('./src/app');
const connectDB=require('./src/config/db');
const startServer=async()=>{
    try{
        await connectDB();
        server.listen(3000,()=>{console.log('server is running on port 3000')});
    }
    catch(error){
        console.error('Error starting server:', error);
        process.exit(1); // Exit the process with an error code
    }
}
startServer();