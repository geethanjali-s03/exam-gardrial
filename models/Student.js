const mongoose = require("mongoose")

const studentSchema = new mongoose.Schema({

usn:String,
password:String,
trustScore:{type:Number,default:100}

})

module.exports = mongoose.model("Student",studentSchema)