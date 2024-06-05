export const CRLF = "\r\n";
export enum HttpMethod {
  GET = "GET",
  POST = "POST",
}
export enum HttpHeaderType {
  CONTENT_TYPE = "Content-Type",
  CONTENT_LENGTH = "Content-Length",
  HOST = "Host",
  USER_AGENT = "User-Agent",
}
export enum ContentType {
  TEXT_PLAIN = "text/plain",
  OCTET_STREAM = "application/octet-stream",
}
export enum HttpStatusCode {
  OK = "200 OK",
  NOT_FOUND = "404 Not Found",
  BAD_REQUEST = "400 Bad Request",
  CREATED = "201 Created",
}
export enum HttpVersion {
  HTTP_1_1 = "HTTP/1.1",
}

export type HttpHeaders = Record<string, string>;

export class HttpResponseBuilder {
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
  setStatusLine(httpVersion: HttpVersion, statusCode: HttpStatusCode) {
    this.statusLine = `${httpVersion} ${statusCode}`;
  }
  setHeaders(headers: HttpHeaders) {
    this.headers =
      Object.entries(headers)
        .map(([key, value]) => `${key}: ${value}`)
        .join(CRLF) + CRLF;
  }
  setResponseBody(responseBody: Buffer) {
    this.responseBody = responseBody;
  }
}
