const { io } = require('socket.io-client');

const socket = io('http://localhost:3000', {
  withCredentials: true,
});

socket.on('connect', () => {
  socket.emit('pharmacy:join');
});

socket.on('prescription:new', ({ prescription }) => {
});

socket.on('prescription:status', ({ id, status }) => {
});

socket.on('disconnect', () => {
});
