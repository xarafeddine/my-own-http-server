import * as net from "net";
import * as fs from "fs";
const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    const httpResponseBuilder = new HttpResponseBuilder();
    const [requestLine, ...headers] = data.toString().split("\r\n");
    const [body] = headers.splice(headers.length - 1);
    const [method, path] = requestLine.split(" ");
    const [root, pathRoute, content, ...restParameters] = path.split("/");
    if (pathRoute === "") {
      httpResponseBuilder.setStatusLine("HTTP/1.1 200 OK");
    } else if (pathRoute === "echo" && content) {
      httpResponseBuilder.setStatusLine("HTTP/1.1 200 OK");
      if (content) {
        const contentLength = content.length;
        httpResponseBuilder.setHeaders({
          "Content-Type": "text/plain",
          "Content-Length": contentLength,
        });
        httpResponseBuilder.setResponseBody(Buffer.from(content));
      }
    } else if (pathRoute === "user-agent") {
      httpResponseBuilder.setStatusLine("HTTP/1.1 200 OK");
      const userAgentHeader = headers.filter((header) => {
        const headerName = header.split(":")[0].toLocaleLowerCase();
        return headerName === "user-agent";
      })[0];
      const userAgent = userAgentHeader.split(":")[1].trim();
      const userAgentLength = userAgent.length;
      httpResponseBuilder.setHeaders({
        "Content-Type": "text/plain",
        "Content-Length": userAgentLength,
      });
      httpResponseBuilder.setResponseBody(Buffer.from(userAgent));
    } else if (
      pathRoute === "files" &&
      content &&
      process.argv[2] === "--directory" &&
      process.argv[3]
    ) {
    } else if (
      method === "GET" &&
      pathRoute === "files" &&
      content &&
      process.argv[2] === "--directory" &&
      process.argv[3]
    ) {
      const directoryPath = process.argv[3];
      const filePath = `${directoryPath}${content}`;
      try {
        if (fs.existsSync(filePath)) {
          const contents = fs.readFileSync(filePath);
          httpResponseBuilder.setStatusLine("HTTP/1.1 200 OK");
          httpResponseBuilder.setHeaders({
            "Content-Type": "application/octet-stream",
            "Content-Length": contents.length,
          });
          httpResponseBuilder.setResponseBody(contents);
        } else {
          httpResponseBuilder.setStatusLine("HTTP/1.1 404 Not Found");
        }
      } catch (err) {
        httpResponseBuilder.setStatusLine("HTTP/1.1 404 Not Found");
      }
    } else if (
      method === "POST" &&
      pathRoute === "files" &&
      content &&
      process.argv[2] === "--directory" &&
      process.argv[3]
    ) {
      const directoryPath = process.argv[3];
      const filePath = `${directoryPath}/${content}`;
      try {
        fs.writeFileSync(filePath, body);
        httpResponseBuilder.setStatusLine("HTTP/1.1 201 Created");
      } catch (err) {
        httpResponseBuilder.setStatusLine("HTTP/1.1 404 Not Found");
      }
    } else {
      httpResponseBuilder.setStatusLine("HTTP/1.1 404 Not Found");
    }
    const httpResponse = httpResponseBuilder.buildHttpResponse();
    console.log(httpResponse);
    socket.write(httpResponse);
    socket.end();
  });
});
type Headers = {
  "Content-Type": string;
  "Content-Length": number;
};
class HttpResponseBuilder {
  statusLine: string;
  headers: string;
  responseBody: Buffer;
  httpResponse: string;

  constructor() {
    this.statusLine = "";
    this.responseBody = Buffer.from("");
    this.headers = "";
    this.httpResponse = "";
  }
  buildHttpResponse() {
    this.httpResponse = `${this.statusLine}\r\n${this.headers}\r\n${this.responseBody}`;
    return this.httpResponse;
  }
  setStatusLine(statusLine: string) {
    this.statusLine = statusLine;
  }
  setHeaders(headers: Headers) {
    this.headers = "";
    for (const header in headers) {
      this.headers += `${header}: ${headers[header as keyof Headers]}\r\n`;
    }
  }
  setResponseBody(responseBody: Buffer) {
    this.responseBody = responseBody;
  }
}
// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");
// Uncomment this to pass the first stage
server.listen(4221, "localhost", () => {
  console.log("Server is running on port 4221");
});
