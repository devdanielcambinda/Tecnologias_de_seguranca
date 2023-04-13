import net from 'net'


const socket: net.Socket = net.connect(3000, "localhost", () => {
  console.log("Connected to server");

  // Send data to the server
  const create  = '{"mbec":{"operations":"create","data":{"account": "55555","initial_balance": 1000.00, "auth_file":"bank.auth" , "account_file":"55555.user"}}}'
  const deposit = '{"mbec":{"operations":"deposit","data":{"account": "55555","deposit": 1000.00,"auth_file":"bank.auth" }}}'
  const add_card ='{"mbec":{"operations":"add_card","data":{"account": "55555", "auth_file":"bank.auth", "vcc_amount": 51.34, "vcc_file": "55555.card", "account_file":"55555.user" }}}'
  const get_balance = '{"mbec":{"operations":"get","data":{"account": "55555", "auth_file":"bank.auth", "account_file":"55555.user"}}}'


  //create account works ✔️
  //deposit works ✔️
  //get balance works ✔️
  socket.write(get_balance);

  // Close the socket after sending the data
  //socket.end();
});

socket.on("data", (data: Buffer) => {
  console.log(data.toString());
})