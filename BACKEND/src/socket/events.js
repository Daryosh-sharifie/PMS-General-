module.exports = {
  EVENTS: {
    CONNECTION: 'connection',
    JOIN_PHARMACY: 'pharmacy:join',
    JOIN_DOCTOR: 'doctor:join',
    PRESCRIPTION_NEW: 'prescription:new',
    PRESCRIPTION_STATUS_UPDATE: 'prescription:status',
    // Pagination events
    REQUEST_PENDING_PRESCRIPTIONS: 'prescriptions:pending:request',
    SEND_PENDING_PRESCRIPTIONS: 'prescriptions:pending:response',
    REQUEST_ALL_PRESCRIPTIONS: 'prescriptions:all:request',
    SEND_ALL_PRESCRIPTIONS: 'prescriptions:all:response',
  },
  ROOMS: {
    PHARMACY: 'pharmacy',
    doctorRoom: (doctorId) => `doctor:${doctorId}`,
  }
};