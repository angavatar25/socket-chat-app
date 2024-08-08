const express = require("express")

const app = express()

const socketIo = require('socket.io');

const cors = require("cors")
const http = require('http').Server(app);

const fs = require('fs');
const path = require('path');

const PORT = 4000

const CorsPayload = {
  origin: "http://localhost:3000"
}

const socketIO = socketIo(http, {
  cors: CorsPayload
});

let users = [];

socketIO.on('connection', (socket) => {
  console.log(`⚡: ${socket.id} user just connected!`);
  //Listens and logs the message to the console
  socket.on('message', (data) => {
    socketIO.emit('messageResponse', data);
  });

  socket.on('newUser', (data) => {
    users.push(data);
    socketIO.emit('newUserResponse', users);
  });

  socket.on('file-upload', (fileData) => {
    const { name, data } = fileData;
    const buffer = Buffer.from(data, 'base64');
    const filePath = path.join(__dirname, 'uploads', name);

    fs.writeFile(filePath, buffer, (err) => {
      if (err) {
        console.error('Error saving file:', err);
        socket.emit('upload-failed');
      } else {
          console.log(`File ${name} saved successfully`);
          socket.emit('upload-success',  { name, path: filePath });
          socketIO.emit('new-file', { name, path: filePath });
      }
    })
  })

  socket.on('disconnect', () => {
    console.log('🔥: A user disconnected');

    users = users.filter((user) => user.socketID !== socket.id);
    socketIO.emit('newUserResponse', users);
    socket.disconnect();
  });
});

app.use(cors());

app.get('/api', (req, res) => {
  res.json({
    message: 'Hello world'
  })
});

http.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
