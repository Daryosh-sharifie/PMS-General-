const { io } = require('socket.io-client');

const doctorId = parseInt(process.env.DOCTOR_ID || '1');

const socket = io('http://localhost:3000', {
  withCredentials: true,
});

socket.on('connect', () => {
  socket.emit('doctor:join', doctorId);
});

socket.on('prescription:new', ({ prescription }) => {
});

socket.on('prescription:status', ({ id, status }) => {
});

socket.on('disconnect', () => {
});
