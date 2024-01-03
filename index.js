const {Server} = require('socket.io');

const io = new Server(80,{
    cors:true
});
const socketToemail = new Map();
const socketToRoom= new Map();
const emailTosocket = new Map();

io.on('connection', (socket)=>{
    console.log("We're connected ", socket.id);

    socket.on("room:join", (data)=>roomJoin(data,socket));
    socket.on("user:call", (data)=>userCall(data,socket));
    socket.on('call:accepted', data=>callAccepted(data,socket));
    socket.on("peer:nego:needed", data=>handleNegotiation(data,socket));
    socket.on("peer:nego:done", data=> NegotiationDone(data,socket));
    socket.on("send:stream", data=>streamHandler(data,socket));
    socket.on("disconnect",(d)=>{

        io.to(socketToRoom.get(socket.id)).emit("user:left",
        {email: socketToemail.get(socket.id)});
    })
})


const roomJoin = (data,socket)=>{
    const {roomId,email} = data;
   console.log("room",email)

    socketToemail.set(socket.id, data.email);
    emailTosocket.set(data.email,socket.id);
  
    io.to(roomId).emit("user:joined",{email,id:socket.id});
    socket.join(roomId);
    socketToRoom.set(socket.id, roomId);

    io.to(emailTosocket.get(email)).emit("room:join",data);

}
const streamHandler = (data,socket)=>{
    let {to} = data;
    io.to(emailTosocket.get(to)).emit("send:stream");
}

const userCall = (data,socket)=>{
    let {to, offer} = data;
    console.log("call", to);
    io.to(emailTosocket.get(to)).emit("incomming:call", {from:socketToemail.get(socket.id), offer});
}
const callAccepted = (data,socket)=>{

    let {to, ans} = data;
    console.log("accecpted frpm", socketToemail.get(socket.id), "now sending final to", to);
    io.to(emailTosocket.get(to)).emit('call:accepted', {from:socketToemail.get(socket.id), ans});
}

const handleNegotiation = ({to,offer}, socket)=>{
    console.log(to, "nego")
    
    io.to(emailTosocket.get(to)).emit("peer:nego:needed", {from:socketToemail.get(socket.id) ,offer});
}

const NegotiationDone = ({to,ans}, socket)=>{
   
    io.to(emailTosocket.get(to)).emit("peer:nego:final", {from:socketToemail.get(socket.id), ans});
}