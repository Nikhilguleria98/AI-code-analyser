export const registerSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    socket.on('project:join', (projectId) => {
      socket.join(`project:${projectId}`);
    });

    socket.on('project:leave', (projectId) => {
      socket.leave(`project:${projectId}`);
    });
  });
};
