const express = require("express")
const mongoose = require("mongoose")
const bodyParser = require("body-parser")
const http = require("http")
const socketio = require("socket.io")
const cors = require("cors")

const app = express()
const server = http.createServer(app)
const io = socketio(server)

app.use(express.static("public"))
app.use(bodyParser.json())
app.use(cors())

/* ---------------- DATABASE ---------------- */

mongoose.connect("mongodb://127.0.0.1:27017/examDB")

/* ---------------- STUDENT MODEL ---------------- */

const studentSchema = new mongoose.Schema({
usn:String,
password:String,
trustScore:{type:Number,default:100}
})

const Student = mongoose.model("Student",studentSchema)

/* ---------------- QUESTION MODEL ---------------- */

const questionSchema = new mongoose.Schema({
usn:String,
semester:String,
subject:String,
questions:Array
})

const QuestionSet = mongoose.model("QuestionSet",questionSchema)

/* ---------------- DEFAULT USERS ---------------- */

mongoose.connection.once("open", async ()=>{

console.log("MongoDB Connected")

const count = await Student.countDocuments()

if(count===0){

await Student.insertMany([
{usn:"U24E01BS005",password:"1234",trustScore:100},
{usn:"U24E01BS017",password:"1234",trustScore:100}
])

console.log("Default Students Created")

}

})

/* ---------------- LOGIN API ---------------- */

app.post("/login",async(req,res)=>{

let {usn,password}=req.body

let user=await Student.findOne({usn})

if(!user || user.password!==password){

return res.json({status:"fail"})

}

res.json({
status:"success",
trust:user.trustScore
})

})

/* ---------------- QUESTION BANK ---------------- */

const bank={

"Python":[
{q:"Python is ___ language?",options:["Compiled","Interpreted","Assembly","Binary"],answer:1},
{q:"Which symbol starts comment?",options:["//","#","--","/*"],answer:1},
{q:"Function keyword?",options:["func","define","def","function"],answer:2},
{q:"Output function?",options:["echo","display","print","show"],answer:2},
{q:"List is?",options:["Mutable","Immutable","Fixed","None"],answer:0},
{q:"Loop keyword?",options:["repeat","while","loop","iterate"],answer:1}
],

"C Programming":[
{q:"C developed by?",options:["Dennis","Guido","James","Linus"],answer:0},
{q:"Statement end symbol?",options:[";","{}","()","."],answer:0},
{q:"Integer datatype?",options:["float","int","char","double"],answer:1},
{q:"Pointer symbol?",options:["*","&","#","@"],answer:0},
{q:"Header for IO?",options:["stdio.h","math.h","stdlib.h","string.h"],answer:0},
{q:"Array index start?",options:["0","1","-1","10"],answer:0}
]

}

/* ---------------- RANDOM QUESTION GENERATOR ---------------- */

function generateQuestions(subject){

let arr = [...bank[subject]]

/* shuffle questions */

arr.sort(()=>Math.random()-0.5)

/* return first 10 */

return arr.slice(0,10)

}

/* ---------------- GET QUESTIONS ---------------- */

app.post("/getQuestions",async(req,res)=>{

let {usn,semester,subject}=req.body

/* SAME QUESTIONS FOR SAME STUDENT */

let existing = await QuestionSet.findOne({
usn,
semester,
subject
})

if(existing){
return res.json(existing.questions)
}

/* GENERATE QUESTIONS */

let questions = generateQuestions(subject)

await QuestionSet.create({
usn,
semester,
subject,
questions
})

res.json(questions)

})

/* ---------------- CHEATING LOG SYSTEM ---------------- */

let violations=[]

io.on("connection",(socket)=>{

console.log("Admin/Student Connected")

socket.on("violation",async(data)=>{

data.time = new Date().toLocaleTimeString()

violations.push(data)

/* LIMIT LOG SIZE */

if(violations.length>100){
violations.shift()
}

/* UPDATE TRUST SCORE IN DATABASE */

await Student.updateOne(
{usn:data.student},
{$set:{trustScore:data.trust}}
)

io.emit("updateLogs",violations)

})

})

/* ---------------- SERVER ---------------- */

server.listen(3000,()=>{

console.log("Server running at http://localhost:3000")

})