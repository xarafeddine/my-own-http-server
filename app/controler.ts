import fs from "fs";
import zlib from "zlib";
import net from "net";
import {
  ContentType,
  HttpHeaderType,
  HttpMethod,
  HttpResponseBuilder,
  HttpStatusCode,
  HttpVersion,
} from "./types";

export function handleServerResponse(
  data: Buffer,
  processArgs: Record<string, string>,
  socket: net.Socket
) {
  const [requestLine, ...headers] = data.toString().split("\r\n");
  const [body] = headers.splice(headers.length - 1);
  const [method, path] = requestLine.split(" ");
  const [root, pathRoute, content, ...restParameters] = path.split("/");

  const httpResponseBuilder = new HttpResponseBuilder();

  switch (method) {
    case HttpMethod.GET:
      const AcceptEncodingHeader = headers.filter((header) => {
        const headerName = header.split(":")[0].toLocaleLowerCase();
        return headerName === HttpHeaderType.ACCEPT_ENCODING.toLowerCase();
      })[0];
      const acceptEncodingvalues =
        AcceptEncodingHeader?.split(":")[1]
          ?.split(",")
          .map((value) => value?.trim()) || [];
      if (acceptEncodingvalues.includes("gzip")) {
        httpResponseBuilder.setHeaders({
          [HttpHeaderType.CONTENT_ENCODING]: "gzip",
        });
      }

      if (pathRoute === "") {
        httpResponseBuilder.setStatusLine(
          HttpVersion.HTTP_1_1,
          HttpStatusCode.OK
        );
      } else if (pathRoute === "echo" && content) {
        httpResponseBuilder.setStatusLine(
          HttpVersion.HTTP_1_1,
          HttpStatusCode.OK
        );
        if (content) {
          const contentLength = content.length;

          httpResponseBuilder.setHeaders({
            [HttpHeaderType.CONTENT_TYPE]: ContentType.TEXT_PLAIN,
            [HttpHeaderType.CONTENT_LENGTH]: contentLength.toString(),
          });
          const buffer = Buffer.from(content, "utf8");
          let response = buffer;
          if (
            httpResponseBuilder.headers[HttpHeaderType.CONTENT_ENCODING] ===
            "gzip"
          ) {
            const zipped = zlib.gzipSync(buffer);
            httpResponseBuilder.setHeaders({
              [HttpHeaderType.CONTENT_LENGTH]: zipped.length.toString(),
            });
            socket.write(httpResponseBuilder.buildHttpResponse());
            socket.write(zipped);
            return;
          }

          httpResponseBuilder.setResponseBody(response);
        }
      } else if (pathRoute === HttpHeaderType.USER_AGENT.toLowerCase()) {
        httpResponseBuilder.setStatusLine(
          HttpVersion.HTTP_1_1,
          HttpStatusCode.OK
        );
        const userAgentHeader = headers.filter((header) => {
          const headerName = header.split(":")[0].toLocaleLowerCase();
          return headerName === HttpHeaderType.USER_AGENT.toLowerCase();
        })[0];
        const userAgent = userAgentHeader.split(":")[1].trim();
        const userAgentLength = userAgent.length;
        httpResponseBuilder.setHeaders({
          [HttpHeaderType.CONTENT_TYPE]: ContentType.TEXT_PLAIN,
          [HttpHeaderType.CONTENT_LENGTH]: userAgentLength.toString(),
        });
        httpResponseBuilder.setResponseBody(Buffer.from(userAgent));
      } else if (pathRoute === "files" && content && processArgs?.directory) {
        const directoryPath = processArgs?.directory;
        const filePath = `${directoryPath}/${content}`;
        try {
          if (fs.existsSync(filePath)) {
            const contents = fs.readFileSync(filePath);
            httpResponseBuilder.setStatusLine(
              HttpVersion.HTTP_1_1,
              HttpStatusCode.OK
            );

            httpResponseBuilder.setHeaders({
              [HttpHeaderType.CONTENT_TYPE]: ContentType.OCTET_STREAM,
              [HttpHeaderType.CONTENT_LENGTH]: contents.length.toString(),
            });
            httpResponseBuilder.setResponseBody(contents);
          } else {
            httpResponseBuilder.setStatusLine(
              HttpVersion.HTTP_1_1,
              HttpStatusCode.NOT_FOUND
            );
          }
        } catch (err) {
          httpResponseBuilder.setStatusLine(
            HttpVersion.HTTP_1_1,
            HttpStatusCode.NOT_FOUND
          );
        }
      } else {
        httpResponseBuilder.setStatusLine(
          HttpVersion.HTTP_1_1,
          HttpStatusCode.NOT_FOUND
        );
      }
      break;

    case HttpMethod.POST:
      if (pathRoute === "files" && content && processArgs?.directory) {
        const directoryPath = processArgs?.directory;
        const filePath = `${directoryPath}/${content}`;
        try {
          fs.writeFileSync(filePath, body);
          httpResponseBuilder.setStatusLine(
            HttpVersion.HTTP_1_1,
            HttpStatusCode.CREATED
          );
        } catch (err) {
          httpResponseBuilder.setStatusLine(
            HttpVersion.HTTP_1_1,
            HttpStatusCode.NOT_FOUND
          );
        }
      } else {
        httpResponseBuilder.setStatusLine(
          HttpVersion.HTTP_1_1,
          HttpStatusCode.NOT_FOUND
        );
      }
      break;
    default:
      httpResponseBuilder.setStatusLine(
        HttpVersion.HTTP_1_1,
        HttpStatusCode.BAD_REQUEST
      );
  }

  return httpResponseBuilder.buildHttpResponse();
}
