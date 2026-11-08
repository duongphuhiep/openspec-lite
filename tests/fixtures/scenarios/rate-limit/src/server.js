const http = require("node:http");

function handler(req, res) {
  res.writeHead(200, { "content-type": "text/plain" });
  res.end("ok\n");
}

const server = http.createServer(handler);
if (require.main === module) server.listen(3000);
module.exports = { handler, server };
