import net from 'net'


const socket: net.Socket = net.connect(3000, "localhost", () => {
  console.log("Connected to server");

  // Send data to the server
  const content_data ='{"mbec":{"operations":"create","data":{"account": "55555","initial_balance": 1000.00 }}}'


  //create account works ✔️
  //deposit works ✔️
  //get balance works ✔️
  socket.write(content_data);

  // Close the socket after sending the data
  //socket.end();
});

socket.on("data", (data: Buffer) => {
  console.log(data.toString());
})