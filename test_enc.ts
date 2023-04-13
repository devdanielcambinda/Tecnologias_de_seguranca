import { encrypt, decrypt } from "./util";
import net from "net";

const auth_file = "abc.txt";

//const content_data ='{"store":{"operations":"get_valid","data":{"name_auth_file": "name_auth_file.auth","vcc":"grvcc.card","shopping_value": 420.00 }}}'
const content_data = '{"ciphertext": "8yRdTfGwx0NDsZ01fnVbzQiuo+2E6Hhd01ey2n+ibP+bLy5HH+KyYCGdTl0+ZHKBiQVSGOo/xnSPrTnPDBv+pkpBNy5KgRIpynibrX5PjFWa05eLAM1drfivPMNOuSO9jopvJafMPjjcPBkBo0euPVzhh3FfOtUMIT4y1zODtHMtxcT+X7y2nCa98TBKt97XsczaA7haPMNhdQLr9cHSYA==", "iv": "vNPpkSdlqLtG85iB8GC9Xw=="}'
//const enc_dict = encrypt(content_data, "abc.txt");
//console.log(enc_dict)

const socket: net.Socket = net.connect(3000, "localhost", () => {
    console.log("Connected to server");
    
    // Send data to the server
    //socket.write(enc_dict);
    socket.write(content_data);
    
    // Close the socket after sending the data
    //socket.end();



});

socket.on("data", (data: Buffer) => {
    console.log(data.toString());
})