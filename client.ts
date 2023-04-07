import net from "net";

const socket: net.Socket = net.connect(3000, "localhost", () => {
  console.log("Connected to server");

  // Send data to the server
  const content_data ='{"store":{"operations":"get_valid","data":{"name_auth_file": "name_auth_file.auth","vcc":"grvcc.vcc","shopping_value": 420}}}'

  socket.write(content_data);

  // Close the socket after sending the data
  socket.end();
});
