import * as yargs from "yargs";
import path from "path";
import net from "net";
import { existsSync, writeFile } from "node:fs";

// type definitions
type User = {
  account: string;
  balance: number;
  vcc: [string, number, boolean] | null; // ts tuple - [vcc_file_name, vcc_balance , is_used] or null when account is created
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
    operations: "create" | "deposit" | "get" | "add_card";
    data: {
      account?: string;
      initial_balance?: number;
      deposit?: number;
      vcc ?: any
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

function createAccount(data: MBECRequest): Response {
  //check mbec.data keys and see if they are valid for this operation
  const requiredKeys = ["account", "initial_balance","auth_file"];
  const dataKeys = Object.keys(data.mbec.data);
  const isValid = requiredKeys.every((key) => dataKeys.includes(key)); //check if all required keys are in the data object, the other will be ignored

  if (!isValid) {
    // true if both required keys are in the data object
    return [false, "essential keys are missing"];
  }

  //check if account already exists
  const accountExists = Array.from(users).some(
    (user) => user.account === data.mbec.data.account
  ); //check if any user has the same account as the one provided

  if (accountExists) {
    return [false, "account already exists"];
  }

  const { account, initial_balance,vcc } = data.mbec.data;

  if (initial_balance! < 15.0) {
    return [false, "initial balance must be at least 15"];
  } // ! is used to tell ts that the value is not null (it is not null because of the check above

  //create the account
  const newUser: User = {
    account: account!,
    balance: initial_balance!,
    vcc: null,
  };
  //add the new user to the users set
  users.add(newUser);
  const jsonMessage = JSON.stringify({ account, initial_balance });
  return [true, jsonMessage];
}

function withdraw(data: MBECRequest): Response{
  //account auth_file card_file withdraw
  return [true, "withdraw"];
}

function depositAccountBalance(data: MBECRequest): Response {
  //check mbec.data keys and see if they are valid for this operation
  const requiredKeys = ["account", "deposit", "auth_file"];
  const dataKeys = Object.keys(data.mbec.data);
  const isValid = requiredKeys.every((key) => dataKeys.includes(key)); //check if all required keys are in the data object, the other will be ignored

  if (!isValid) {
    // true if both required keys are in the data object
    return [false, "essential keys are missing"];
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

function getAccountBalance(data: MBECRequest): Response {
  //check mbec.data keys and see if they are valid for this operation
  const requiredKeys = ["account", "auth_file","card_file"];
  const dataKeys = Object.keys(data.mbec.data);
  const isValid = requiredKeys.every((key) => dataKeys.includes(key)); //check if all required keys are in the data object, the other will be ignored

  if (!isValid) {
    // true if both required keys are in the data object
    return [false, "essential keys are missing"];
  }

  //check if account exists
  const accountExists = Array.from(users).some(
    (user) => user.account === data.mbec.data.account
  ); //check if any user has the same account as the one provided

  if (!accountExists) {
    return [false, "account does not exist"];
  }

  const { account } = data.mbec.data;

  //get the balance
  const user = Array.from(users).find((user) => user.account === account);
  const jsonMessage = JSON.stringify({ account, balance: user!.balance });

  return [true, jsonMessage];
}

function addCard(data: MBECRequest): Response {
  // account auth_file card_file virtual_credit_card
  return [true, "add card"];
}

function validatePurchase(data: StoreRequest, runningServerAuthFile: string): Response {
  //TODO verify if works 
        // verificar se o auth file coincide --done 
        // verificar se o cartão está ativo --d one 
        // verificar se a conta do cartão tem dinheiro suficiente
  let balanceBeforeOperation = 0.00;

  if ( data.store.data.name_auth_file !== runningServerAuthFile){ // compared file content 
    return [false, JSON.stringify(`{isCardValid: fale, accountBalanceBeforePurchase: 0.00 }`)];
  }

  const cardExists = Array.from(users).some( user => user.vcc![0] === data.store.data.vcc);

  if (!cardExists){
    return [false, JSON.stringify(`{isCardValid: false, accountBalanceBeforePurchase: 0.00 }`)];
  }

  users.forEach((user) => {
    if (user.vcc![0] === data.store.data.vcc) {
      if(user.balance - data.store.data.shopping_value < 0.00){
        return
      }
      balanceBeforeOperation = user.balance;
      user.balance -= data.store.data.shopping_value!;
    }
  });
  
  const jsonMessage = JSON.stringify(`{isCardValid: true, accountBalanceBeforePurchase: ${balanceBeforeOperation}, auth_file_name: ${runningServerAuthFile} }`)
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

    p === undefined ? p = 3000 : p = p; // if p is not provided, use 3000 as default
    s === undefined ? s = "bank.auth" : s = s; // if s is not provided, use 'bank.auth' as default

    // check/create the auth file
    const authFilePath = path.join(__dirname, s);
    const authFileExists = existsSync(authFilePath);
    if (authFileExists) {
      //console.log("auth file already exists");
      return process.exit(125);
    }

    // create the auth file
    writeFile(authFilePath, generateRandomString(128), () => {
      console.log("created");
    });

    // create the server
    const server: net.Server = net.createServer(async (socket) => {
      socket.on("data", async (data: Buffer) => {
        // where I'm going to receive the data from the client
        const data_json = data.toString();
        const data_content = JSON.parse(data_json);

        if (data_content.store) {
          const store_content = data_content as StoreRequest;
          let [sucessful, message] = validatePurchase(store_content, s!);
          socket.write(message)
          socket.end();
        }

        if (data_content.mbec) {
          const mbec_content = data_content as MBECRequest;
          switch (mbec_content.mbec.operations) {
            case "create":
              let [sucessful, message] = createAccount(mbec_content);

              if (!sucessful) {
                return socket.write("Account creation failed");
              }
              socket.write(message);
              console.log(message);
              break;
            case "deposit":
              let [sucessfulDeposit, messageDeposit] = depositAccountBalance(mbec_content);
              if (!sucessfulDeposit) {
                return socket.write("Deposit failed");
              }
              socket.write(messageDeposit);
              console.log(messageDeposit);
              break;
            case "add_card":
              let [sucessfulAddCard, messageAddCard] = addCard(mbec_content);
              if (!sucessfulAddCard) {
                return socket.write("adding card failed");
              }
              socket.write(messageAddCard);
            case "get":
              let [sucessfulGet, messageGet] = getAccountBalance(mbec_content);
              if (!sucessfulGet) {
                return socket.write("Get balance failed");
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

    server.on("error", (err) => {
      console.error(err);
    });

    server.listen(p, () => {
      console.log(`Server is listening on port ${p}`);
    });

    process.on("SIGINT", () => {
      // processing ctrl + c
      console.log("\n Received SIGINT. Closing server...");
      // Perform any cleanup or additional actions as needed
      server.close(() => {
        console.log("Server closed. Exiting...");
        process.exit(0); // Exit the process with a status code of 0 (success)
      });
    });
  } catch (err) {
    console.error(err);
  }
};

main();
