import net from "net";

const socket: net.Socket = net.connect(3000, "localhost", () => {
  console.log("Connected to server");

  // Send data to the server
  const content_data ='{"store":{"operations":"get_valid","data":{"name_auth_file": "name_auth_file.auth","vcc":"grvcc.card","shopping_value": 420.00 }}}'

  //const content_data = '{"ciphertext": "XdU/p2zqAl2TwxlMbymkkXPqoJiaQcg7LcYTY5QdxSNfi2gI0WIBpa4JnlxkMjpVIjd8/EVbPpDt2P5doVuCrqZYlQx+GK3LoFb4OOUx2oj8oysW6Jxye2QV9+auC028NlvMnUjnJU7ZN1++wEuXn58MkdvQk+kFVO4MVcn1MIWPeN47x2uXkVk9Pirj01VaJEhgJ3V6/m//y84geQvQyuPK34fctUK7MpmmlPVaHo0mRpZdSykX/8zTSFE8L9D3hDSNWJg/HmcVSaiq7xyJH/b/u7HhZ6SA1Bz8HRgSsztIT0Cii47RK+wrulQNFuga", "iv": "ckj+LwPaJMYepJ46WUsNiw=="}'
  
  socket.write(content_data);

  // Close the socket after sending the data
  //socket.end();
});

socket.on("data", (data: Buffer) => {
  console.log(data.toString());
})
