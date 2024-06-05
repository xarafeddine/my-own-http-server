import net from "net";
import { getProcessArgs } from "./utils";
import { handleServerResponse } from "./controler";
const processArgs = getProcessArgs();
const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    console.log("received data: ", data.toString());
    const httpResponse = handleServerResponse(data, processArgs);
    console.log("sent data: ", httpResponse.replace(/\r\n/gi, "\\r\\n"));
    socket.write(httpResponse);
    // socket.end();
  });
});

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");
// Uncomment this to pass the first stage
server.listen(4221, "localhost", () => {
  console.log("Server is running on port 4221");
});
