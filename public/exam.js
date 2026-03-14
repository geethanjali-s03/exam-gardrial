const socket = io()

let student = localStorage.getItem("student")

let trust = 100

/* VIOLATION FUNCTION */

function violation(type, info){

trust -= 5

if(trust < 0){
trust = 0
}

document.getElementById("score").innerText = trust

socket.emit("violation",{
student,
type,
info,
trust
})

/* TERMINATE EXAM IF TRUST TOO LOW */

if(trust <= 50){
alert("Too many violations. Exam terminated.")
window.location="login.html"
}

}

/* TAB SWITCH DETECTION */

let blurTime = 0

window.addEventListener("blur",()=>{
blurTime = Date.now()
})

window.addEventListener("focus",()=>{

if(!blurTime) return

let away = Math.floor((Date.now()-blurTime)/1000)

if(away > 1){
violation("Tab Switch", away + " seconds")
}

})

/* WINDOW RESIZE DETECTION */

window.addEventListener("resize",()=>{

if(window.innerWidth < screen.width*0.8){
violation("Resize","Window too small")
}

})

/* BLOCK CHEATING KEYS */

document.addEventListener("keydown",(e)=>{

if(
(e.ctrlKey && e.key=="c") ||
(e.ctrlKey && e.key=="v") ||
(e.ctrlKey && e.key=="u") ||
(e.key=="F12")
){

e.preventDefault()

violation("Keyboard", e.key)

}

})

/* IDLE DETECTION */

let idleTimer

function resetIdle(){

clearTimeout(idleTimer)

idleTimer = setTimeout(()=>{

violation("Idle","No activity for 60 seconds")

},60000)

}

document.onmousemove = resetIdle
document.onkeypress = resetIdle
document.onclick = resetIdle

resetIdle()

/* EXAM TIMER */

let time = 1800   // 30 minutes

let timerInterval = setInterval(()=>{

if(time <= 0){

clearInterval(timerInterval)

alert("Time Up. Submitting Exam.")

submitExam()

return
}

let m = Math.floor(time/60)
let s = time % 60

document.getElementById("timer").innerText =
m + ":" + (s<10?"0":"") + s

time--

},1000)