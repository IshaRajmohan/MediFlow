const mongoose=require('mongoose');
const appointmentScheme=new mongoose.Schema({
    patient:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Patient',
    },
    doctor:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Doctor',

    },
    scheduledAt:{
        type:Date
    },
    reason:{
        type:String,
        required:false
    },
    status:{
        type:String,
        enum:['booked','completed','cancelled'],
        default:'booked'
    }
})
const Appointment=mongoose.model('Appointment', appointmentScheme);
module.exports=Appointment;