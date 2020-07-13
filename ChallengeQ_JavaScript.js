const buf = Buffer.from("YWRtaW46cGFzc3dvcmQ=", "base64");

console.clear;

console.log("Without toString(): ");
console.log(buf);

console.log("With toString(): ");
console.log(buf.toString());

// -----------------------------
const authHeader = "Basic YWRtaW46cGFzc3dvcmQ=";

var auth = new Buffer.from(authHeader.split(" ")[1], "base64")
  .toString()
  .split(":");
var user = auth[0];
var pass = auth[1];

console.log("typeof auth: " + typeof auth);
console.log("Printing: auth" + JSON.stringify(auth));
