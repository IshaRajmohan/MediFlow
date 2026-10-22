const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    unique: true, 
    lowercase: true, 
    required: true,
    
    match: [/^\s*[\w\.\-]+@([\w\-]+\.)+[\w\-]{2,4}\s*$/, 'Please provide a valid email address']
  },
  password: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['patient', 'admin'], 
    default: 'patient' 
  }
});


const User = mongoose.model('User', userSchema);
module.exports = User;
