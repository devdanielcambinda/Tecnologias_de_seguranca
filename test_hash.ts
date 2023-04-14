import net from "net";
import {generateHash} from './util'


// '{"store":{"operations":"get_valid","data":{"vcc": "5555.vcc","shopping_value":55.96 } } }###_hash_value: a2e689a1ac7ebbca5eac590075601615baaed36a3263c013e671f4667f838548
const content_data = '{"store":{"operations":"get_valid","data":{"vcc": "5555.vcc","shopping_value":55.96 } } }'



const dataToSend = content_data + "###_hash_value: " + generateHash(content_data,'./bank.auth')

const socket: net.Socket = net.connect(3000, "localhost", () => {
    console.log("Connected to server");
    
    // Send data to the server
    socket.write(dataToSend);
    //socket.write(content_data);
    
    // Close the socket after sending the data
    //socket.end();



});

socket.on("data", (data: Buffer) => {

    
})