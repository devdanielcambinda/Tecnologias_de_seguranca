# Installation Guide: Node.js, TypeScript, ts-node, app dependencies

This guide provides step-by-step instructions for installing Node.js, TypeScript, and ts-node and the app dependencies on your machine.

## Installation Steps

### Step 1: Install Node.js

1. Go to the official Node.js website at https://nodejs.org/en/download/ in your web browser.
2. Choose the appropriate version of Node.js for your operating system (Windows, macOS, or Linux) and download the installer.
3. Run the installer with administrative privileges and follow the on-screen instructions to install Node.js on your machine.

### Step 2: Install TypeScript

1. Open a command-line interface (CLI) or terminal on your machine.
2. Run the following command to install TypeScript globally using npm, the Node.js package manager:
3. Wait for the installation to complete.

```shell
npm install -g typescript
```

### Step 3: Install ts-node

1. Open a command-line interface (CLI) or terminal on your machine.
2. Run the following command to install ts-node globally using npm:
3. Wait for the installation to complete.

```shell
npm install -g ts-node
```

### Step 4: Verification

After completing the installation steps, you can verify if Node.js, TypeScript, and ts-node are installed correctly on your machine.

1. Open a command-line interface (CLI) or terminal on your machine.
2. Run the following commands to check the versions of Node.js, TypeScript, and ts-node:
3. If you see the versions of Node.js, TypeScript, and ts-node printed in the output, it means that the installation was successful.

```shell
node -v
tsc -v
ts-node -v
```
### Step 5: Install app dependencies

After making sure that you have Node.js, TypeScript and ts-node installed it's finally possible to install the app dependencies.

1. Open a command-line interface (CLI) or terminal on your machine.
2. Get inside the app folder
3. Execute the following command:

```shell 
npm i
```

or 

```shell
npm install
```

### Step 6: Run the app

After installing the app dependencies it is finally possible to run the app using the command 

```shell
npm start
``` 

This command will execute the app with the default settings ( port = 3000, auth_file = auth.bank).

There are a couple of pre-defined scripts that can be execute, this scripts are in the file package.json that is the file that also has the app dependencies. To run the scripts execute the following command:

```shell
npm run <scriptname>
 ```


You can also run the app giving your prefered parameters. To do so you have to give the program the inputs:

```shell 
ts-node bank.ts [-s] [-p]
```
The -p argument corresponds to the server port number and the -s name of the auth file.
