const prisma = require('../DBconfig/Prisma');
const { EVENTS, ROOMS } = require('./events');

function initSocket(io) {
  io.on(EVENTS.CONNECTION, (socket) => {
    // Join pharmacy room (for pharmacists)
    socket.on(EVENTS.JOIN_PHARMACY, () => {
      socket.join(ROOMS.PHARMACY);
    });

    // Join doctor-specific room to receive updates
    socket.on(EVENTS.JOIN_DOCTOR, (doctorId) => {
      if (!doctorId) return;
      socket.join(ROOMS.doctorRoom(doctorId));
    });

    // Handle paginated pending prescriptions request
    socket.on(EVENTS.REQUEST_PENDING_PRESCRIPTIONS, async (data) => {
      try {
        const page = data?.page || 1;
        const limit = data?.limit || 10;
        const skip = (page - 1) * limit;

        const prescriptions = await prisma.prescription.findMany({
          where: { status: 'PENDING' },
          include: {
            patient: true,
            doctor: { select: { id: true, name: true, email: true } },
            medicines: true,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        });

        const total = await prisma.prescription.count({
          where: { status: 'PENDING' },
        });

        socket.emit(EVENTS.SEND_PENDING_PRESCRIPTIONS, {
          prescriptions,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasMore: page < Math.ceil(total / limit),
          },
        });
      } catch (error) {
        console.error('Error fetching pending prescriptions:', error);
        socket.emit(EVENTS.SEND_PENDING_PRESCRIPTIONS, {
          prescriptions: [],
          error: 'Failed to fetch prescriptions',
        });
      }
    });

    // Handle paginated all prescriptions request
    socket.on(EVENTS.REQUEST_ALL_PRESCRIPTIONS, async (data) => {
      try {
        const page = data?.page || 1;
        const limit = data?.limit || 10;
        const skip = (page - 1) * limit;
        const status = data?.status || null;

        const where = status ? { status } : {};

        const prescriptions = await prisma.prescription.findMany({
          where,
          include: {
            patient: true,
            doctor: { select: { id: true, name: true, email: true } },
            medicines: true,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        });

        const total = await prisma.prescription.count({ where });

        socket.emit(EVENTS.SEND_ALL_PRESCRIPTIONS, {
          prescriptions,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasMore: page < Math.ceil(total / limit),
          },
        });
      } catch (error) {
        console.error('Error fetching prescriptions:', error);
        socket.emit(EVENTS.SEND_ALL_PRESCRIPTIONS, {
          prescriptions: [],
          error: 'Failed to fetch prescriptions',
        });
      }
    });

    socket.on('disconnect', () => {
      // No-op for now
    });
  });
}

module.exports = { initSocket };