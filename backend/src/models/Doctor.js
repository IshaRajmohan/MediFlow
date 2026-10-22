const mongoose=require('mongoose');
const doctorSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true
    },
    specialty:{
        type:String,
        required:true
    },
    clinic:{
        type:String,
        required:false
    },
    consultationFee:{
        type:Number,
        required:true,
        min:[0]
    },
    available:{
        type:Boolean,
        default:true
    }
})
const doctor=mongoose.model('Doctor',doctorSchema);
module.exports=doctor;