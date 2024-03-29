import * as yargs from "yargs";
import path from "path";
import net from "net";
import { existsSync, writeFile} from "fs";
import {verifyAuthFile, generateHash, parseRequest} from './util'


// type definitions
type User = {
  account: string;
  account_file: string
  balance: number;
  vcc: [string, number, boolean] | null; // ts tuple - [vcc_file_name, vcc_balance , used] or null when account is created
};

const users = new Set<User>();

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
    operations: "create" | "deposit" | "get" | "add_card" | "withdraw"
    data: {
      account?: string;
      account_file?: string;
      initial_balance?: number;
      deposit?: number;
      vcc_amount?: number;
      auth_file : string 
      vcc_file?: string
    };
  };
};

type Response = [boolean, string]; // [sucessful, message]

// functions
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

function createAccount(data: MBECRequest, runningServerAuthFile: string): Response {
  //check mbec.data keys and see if they are valid for this operation
  const requiredKeys = ["account", "initial_balance","auth_file", "account_file"];
  const dataKeys = Object.keys(data.mbec.data);
  const isValid = requiredKeys.every((key) => dataKeys.includes(key)); //check if all required keys are in the data object, the other will be ignored

  if (!isValid) {
    // true if both required keys are in the data object
    return [false, "essential keys are missing"];
  }

  //check if auth file matches the running server auth file
  const valid = verifyAuthFile(data.mbec.data.auth_file, "Mbec",runningServerAuthFile);
  if (!valid) {
    return [false, "auth file does not match"];
  }

  //check if account already exists
  const accountExists = Array.from(users).some(
    (user) => user.account === data.mbec.data.account
  ); //check if any user has the same account as the one provided

  if (accountExists) {
    return [false, "account already exists"];
  }

  const { account, initial_balance, account_file } = data.mbec.data;

  if (initial_balance! < 15.0) {
    return [false, "initial balance must be at least 15"];
  } // ! is used to tell ts that the value is not null (it is not null because of the check above

  //create the account
  const newUser: User = {
    account: account!,
    account_file: account_file!,
    balance: initial_balance!,
    vcc: null,
  };
  //add the new user to the users set
  users.add(newUser);
  const jsonMessage = JSON.stringify({ account, initial_balance });
  return [true, jsonMessage];
}

function depositAccountBalance(data: MBECRequest, runningServerAuthFile: string): Response {
  //check mbec.data keys and see if they are valid for this operation
  const requiredKeys = ["account", "deposit", "auth_file"];
  const dataKeys = Object.keys(data.mbec.data);
  const isValid = requiredKeys.every((key) => dataKeys.includes(key)); //check if all required keys are in the data object, the other will be ignored

  if (!isValid) {
    // true if both required keys are in the data object
    return [false, "essential keys are missing"];
  }

  //check if auth file matches the running server auth file
  const valid = verifyAuthFile(data.mbec.data.auth_file, "Mbec",runningServerAuthFile);
  if (!valid) {
    return [false, "auth file does not match"];
  }

  //check if account exists
  const accountExists = Array.from(users).some(
    (user) => user.account === data.mbec.data.account
  ); //check if any user has the same account as the one provided

  if (!accountExists) {
    return [false, "account does not exist"];
  }

  const { account, deposit } = data.mbec.data;

  if (deposit! <= 0.0) {
    return [false, "deposit must be greater than 0"];
  }

  //update the balance
  users.forEach((user) => {
    if (user.account === account) {
      user.balance += deposit!;
      return
    }
  });

  const jsonMessage = JSON.stringify({ account, deposit });

  return [true, jsonMessage];
}

function getAccountBalance(data: MBECRequest, runningServerAuthFile: string): Response {
  //check mbec.data keys and see if they are valid for this operation
  const requiredKeys = ["account", "auth_file", "account_file"];
  const dataKeys = Object.keys(data.mbec.data);
  const isValid = requiredKeys.every((key) => dataKeys.includes(key)); //check if all required keys are in the data object, the other will be ignored

  if (!isValid) {
    // true if both required keys are in the data object
    return [false, "essential keys are missing"];
  }

  //check if auth file matches the running server auth file
  const valid = verifyAuthFile(data.mbec.data.auth_file, "Mbec",runningServerAuthFile);
  if (!valid) {
    return [false, "auth file does not match"];
  }

  //check if account exists
  const accountExists = Array.from(users).some(
    (user) => user.account === data.mbec.data.account
  ); //check if any user has the same account as the one provided

  if (!accountExists) {
    return [false, "account does not exist"];
  }

  const { account, account_file } = data.mbec.data;

  const user = Array.from(users).find((user) => user.account === account);

  if(user?.account_file !== account_file){
    return [false, "account file does not match"];
  }

  //get the balance
  const jsonMessage = JSON.stringify({ account, balance: user!.balance });

  return [true, jsonMessage];
}

function addCard(data: MBECRequest, runningServerAuthFile: string): Response {
  // account auth_file vcc_amount
  const requiredKeys = ["account", "auth_file", "vcc_amount", "vcc_file" , "account_file"];
  const dataKeys = Object.keys(data.mbec.data);
  const isValid = requiredKeys.every((key) => dataKeys.includes(key)); //check if all required keys are in the data object, the other will be ignored

  if (!isValid) {
    // true if both required keys are in the data object
    return [false, "essential keys are missing"];
  }

  //check if auth file matches the running server auth file
  const valid = verifyAuthFile(data.mbec.data.auth_file, "Mbec",runningServerAuthFile);
  if (!valid) {
    return [false, "auth file does not match"];
  }

  //check if account exists
  const accountExists = Array.from(users).some(
    (user) => user.account === data.mbec.data.account
  ); //check if any user has the same account as the one provided

  if (!accountExists) {
    return [false, "account does not exist"];
  }

  const { account, vcc_amount, vcc_file } = data.mbec.data;

  const user = Array.from(users).find((user) => user.account === account);

  if (vcc_amount! <= 0.0) {
    return [false, "vcc amount must be greater than 0"];
  }

  if(vcc_amount! > user!.balance! ){
    return [false, "vcc amount must be less or equal to the account balance"];
  }

  // add to account 
  let sucessful = false
  users.forEach((user) => {
    if (user.account === data.mbec.data.account) {

      if(user.vcc !== null && user.vcc[2] === false){ // se existir cartão e o cartão não tiver sido usado
        return sucessful = false;
      } // se for diferente de null e o cartão estiver tiver sido usado... não entra no if -- pode ser mudado 

      user.vcc = [vcc_file!,vcc_amount!,false]
      return sucessful = true;
    }
  });
  
  if(!sucessful){
    return [false, "card exists and has not been used"];
  }

  const jsonMessage = JSON.stringify({ account, vcc_amount, vcc_file });

  return [true, jsonMessage];
}

function validatePurchase(data: StoreRequest, runningServerAuthFile: string): Response {
  //TODO verify if works 
        // verificar se o auth file coincide --done 
        // verificar se o cartão está ativo --d one 
        // verificar se a conta do cartão tem dinheiro suficiente
  const requiredKeys = ["vcc", "shopping_value", "name_auth_file"];
  const dataKeys = Object.keys(data.store.data);
  const isValid = requiredKeys.every((key) => dataKeys.includes(key)); //check if all required keys are in the data object, the other will be ignored
  
  if (!isValid) {
    // true if both required keys are in the data object
    return [false, JSON.stringify({isCardValid: false, message: 'essitial operation keys missing', auth_file_name: runningServerAuthFile })];
  }
  
  //check if auth file matches the running server auth file
  const valid = verifyAuthFile(data.store.data.name_auth_file, "Store",runningServerAuthFile);
  if (!valid) {
    return [false, JSON.stringify({isCardValid: false, message: 'auth file do not match', auth_file_name: runningServerAuthFile })];
  }

  const cardExists = Array.from(users).some( user => user.vcc![0] === data.store.data.vcc);

  if (!cardExists){
    return [false, JSON.stringify({isCardValid: false, message: 'card does not exist', auth_file_name: runningServerAuthFile })];
  }

  let sucessful:boolean = false
  let message: string = '' 
  users.forEach((user) => {
    if (user.vcc![0] === data.store.data.vcc) {
      if(user.vcc![2] === true){ //[vcc_file_name, vcc_balance , used]
        sucessful = false;
        return message += "card has already been used"
      }

      if(user.balance - data.store.data.shopping_value < 0.00){
        sucessful = false;
        return message += 'insufficient funds'
      }

      user.balance -= data.store.data.shopping_value!;
      sucessful = true;
      return message = "card is valid"
    }
  });

  if(!sucessful){
    return [false, JSON.stringify({isCardValid: false, message , auth_file_name: runningServerAuthFile })];
  }

  const jsonMessage = JSON.stringify({isCardValid: true, message, auth_file_name: runningServerAuthFile })
  return [true, jsonMessage];
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

    p === undefined ? p = 3000 : p = p; // if p is not provided, use 3000 as default
    s === undefined ? s = "bank.auth" : s = s; // if s is not provided, use 'bank.auth' as default

    // check/create the auth file
    const authFilePath = path.join(__dirname, s);
    const authFileExists = existsSync(authFilePath);
    if (authFileExists) {
      console.log("auth file already exists");
      return process.exit(125);
    }

    // create the auth file
    writeFile(authFilePath, generateRandomString(128), () => {
      console.log("created");
    });

    // create the server
    const server: net.Server = net.createServer(async (socket) => {
      socket.on("data", async (data: Buffer) => {

        const [requestJson,hashValue] = parseRequest(data.toString());

        const hashedRequest = generateHash(requestJson,s!);

        if( hashValue !== hashedRequest){
          return console.log("hash value do not match");
        }

        const data_content = JSON.parse(requestJson);
        console.log(data_content);
        
        
        if (data_content.store) {
          const store_content = data_content as StoreRequest;
          let [_sucessful, message] = validatePurchase(store_content, s!);
          const dataToSend = message + "###_hash_value: " + generateHash(message,'./bank.auth')
          socket.write(dataToSend);
          return socket.end();
        }

        if (data_content.mbec) {
          const mbec_content = data_content as MBECRequest;
          switch (mbec_content.mbec.operations) {
            case "create":
              let [sucessful, message] = createAccount(mbec_content,s!);

              if (!sucessful) {
                return console.log(message);
              }

              socket.write(message);
              console.log(message);
              break;
            case "deposit":
              let [sucessfulDeposit, messageDeposit] = depositAccountBalance(mbec_content,s!);
              if (!sucessfulDeposit) {
                return console.log(messageDeposit);
              }
              socket.write(messageDeposit);
              console.log(messageDeposit);
              break;
            case "add_card":
              let [sucessfulAddCard, messageAddCard] = addCard(mbec_content,s!);
              if (!sucessfulAddCard) {
                return console.log(messageAddCard);
              }
              socket.write(messageAddCard);
              console.log(messageAddCard);
              break
            case "get":
              let [sucessfulGet, messageGet] = getAccountBalance(mbec_content,s!);
              if (!sucessfulGet) {
                return console.log(messageGet);
              }
              socket.write(messageGet);
              console.log(messageGet);
              break;
            default:
              break;
          }
        } 

        return socket.end();
      });

    });

    server.on("error", () => {
      console.error("protocol_error");
    });

    server.listen(p, () => {
      console.log(`Server is listening on port ${p}`);
    });

    process.on("SIGINT", () => {
      // Perform any cleanup or additional actions as needed
      server.close(() => {
        process.exit(0); // Exit the process with a status code of 0 (success)
      });
    });
  } catch (err) {
    console.error(err)
  }
};

main();
