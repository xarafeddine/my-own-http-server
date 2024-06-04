import { createServer, Socket } from "net";

const server = createServer((socket: Socket) => {
  socket.on("data", (data) => {
    const request = data.toString();
    console.log("Request:", request);

    const [header] = request.split("\r\n");
    const [method, url] = header.split(" ");

    if (method && url) {
      const responseHeaders = [
        `HTTP/1.1 ${url === "/" ? "200 OK" : "404 Not Found"}`,
        "Content-Type: text/plain",
        "Connection: close",
        "",
        "",
      ];

      const response = responseHeaders.join("\r\n");
      socket.write(response);
      socket.end();
    }
  });

  socket.on("error", (err) => {
    console.error("Socket error:", err);
  });
});

const PORT = 4221;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

server.on("error", (err) => {
  console.error("Server error:", err);
});
