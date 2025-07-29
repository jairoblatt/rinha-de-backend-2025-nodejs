interface Config {
  SocketPath: string;
  ForeignState: string;
}

const config: Config = {
  SocketPath: process.env.SOCKET_PATH || "/tmp/app.sock",
  ForeignState: process.env.FOREIGN_STATE || "",
};

export { config };
