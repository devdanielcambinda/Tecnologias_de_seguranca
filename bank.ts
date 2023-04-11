import * as yargs from "yargs";
import path from "path";
import net from "net";
import { existsSync } from "node:fs";
import * as fs from "node:fs/promises";


type User = {
  account: string,
  balance: number,
  vcc: [string,number,boolean] // ts tuple - [vcc_file_name, numbe ,is_valid]
}

const  users = new Set<User>();

type StoreRequest = {
  store: {
    operations: "get_valid";
    data: {
      name_auth_file: string;
      vcc: string;
      shopping_value: number;
    };
  };
};

type MBECRequest = {
  mbec: {
    operations: "create"  | "deposit" | "withdraw" | "get";
    data: {

    }
  }

};

function generateRandomString(length: number): string {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-=_+[]{}|;:,.<>?/";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function createAccount(data: MBECRequest): boolean{
  //check mbec.data keys and see if they are valid for this operation
  return true
}

function getAccountBalance(data: MBECRequest): boolean{
  //check mbec.data keys and see if they are valid for this operation
  return true
}

function withdrawAccountBalance(data: MBECRequest): boolean{
  //check mbec.data keys and see if they are valid for this operation
  return true
}

function depositAccountBalance(data: MBECRequest): boolean{
  //check mbec.data keys and see if they are valid for this operation
  return true
}

//server excution
const main = async () => {
  try {
    //get arguments from argv
    const args = yargs
      .options({
        p: {
          describe: "bank server port",
          type: "number",
        },
        s: {
          describe: "Name of the auth file",
          type: "string",
        },
      })
      .check((argv): true | void => {
        const argvKeys = Object.keys(argv);
        const permitedKeys = ["p", "s", "_", "$0"];
        const validArgs = argvKeys.every((key) => permitedKeys.includes(key));

        console.log("validArgs: ", validArgs);

        // if there are any invalid arguments
        if (!validArgs) {
          console.log("invalid args");
          return process.exit(125);
        }

        //p can not be provided
        // if there are duplicate p arguments p is an array
        if (argv.p && Array.isArray(argv.p)) {
          console.log("invalid p");
          return process.exit(125);
        }
        //s can not be provided
        // if there are duplicate s arguments s is an array
        if (argv.s && Array.isArray(argv.s)) {
          console.log("invalid s");
          return process.exit(125);
        }

        return true;
      })
      .parseAsync();

    // get the port number and the auth file name
    let { p, s } = await args;

    p == undefined ? (p = 3000) : (p = p); // if p is not provided, use 3000 as default
    s == undefined ? (s = "bank.auth") : (s = s); // if s is not provided, use 'bank.auth' as default

    // check/create the auth file
    const authFilePath = path.join(__dirname, s);
    const authFileExists = existsSync(authFilePath);
    if (authFileExists) {
      //console.log("auth file already exists");
      return process.exit(125);
    }

    // create the auth file
    fs.writeFile(authFilePath, generateRandomString(128)).then(() => {
      console.log("created");
    }).catch((err) => console.error(err));

    // create the server
    const server: net.Server = net.createServer(async (socket) => {

      socket.on("data", async (data: Buffer) => {
        // where I'm going to receive the data from the client
        const data_json = data.toString()
        const data_content = JSON.parse(data_json)

        if(data_content.store){
            console.log('here')
            const store_content = data_content as StoreRequest;
            console.log(store_content);
            socket.write('store content detected');
            socket.end()
        }

        if(data_content.mbec){
            const mbec_content = data_content as MBECRequest;
            switch(mbec_content.mbec.operations){
              case 'create':
                console.log('create')
                break
              case 'deposit':
                console.log('deposit')
                break
              case 'withdraw':
                console.log('withdraw')
                break
              case 'get':
                console.log('get')
                console.log(mbec_content);
                socket.write('mbec content detected');
                break
              default:
                break
            }
        }

        return socket.end()
        
      });

      socket.on('end', () => {
            console.log('mf left');
      })


    });

    server.on("error", (err) => {
      console.error(err);
    });

    server.listen(p, () => {
      console.log(`Server is listening on port ${p}`);
    });
  } catch (err) {
    console.error(err);
  }
};

main();
