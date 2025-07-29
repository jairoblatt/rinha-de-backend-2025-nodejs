interface Config {
  SocketPath: string;
  ForeignState: string;
  isFireMotherFucker: boolean;
}

const config: Config = {
  SocketPath: process.env.SOCKET_PATH || "/tmp/app.sock",
  ForeignState: process.env.FOREIGN_STATE || "",
  isFireMotherFucker: process.env.MODE === "🔥",
};

export { config };
