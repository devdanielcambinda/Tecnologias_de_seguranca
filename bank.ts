import * as yargs from 'yargs'
import path from 'path'
import net from 'net'
import * as fs from 'node:fs/promises'


//get arguments from argv
const args = yargs.options({
    p:{
        describe:'bank server port',
        type: 'number',
    },
    s: {
        describe: 'Name of the auth file',
        type:"string"
    }
  }).check( (argv) : true | void =>  {

    const argvKeys = Object.keys(argv)
    const permitedKeys = ['p','s','_','$0']
    const validArgs = argvKeys.every( key => permitedKeys.includes(key))

    console.log("validArgs: ", validArgs)

    // if there are any invalid arguments
    if (!validArgs){
        console.log("invalid args")
        return process.exit(125)
    }

    //p can not be provided
    // if there are duplicate p arguments p is an array
    if ( argv.p && Array.isArray(argv.p) ){
        console.log("invalid p")
       return process.exit(125) 
    }
    //s can not be provided
    // if there are duplicate s arguments s is an array 
    if ( argv.s && Array.isArray(argv.s) ){
        console.log("invalid s")
        return process.exit(125) 
    }

    return true
  }).parseSync()

// get the port number and the auth file name
let { p, s } = args

p == undefined ? p = 3000 : p = p // if p is not provided, use 3000 as default
s == undefined ? s = 'bank.auth' : s = s // if s is not provided, use 'bank.auth' as default

//server excution
const main = async (p: number, s: string) =>  {
    const server = net.createServer(async (socket) => {

        socket.on('data', (data) => { // where I'm going to receive the data from the client
            const message = data.toString().split(' ')
            console.log(JSON.stringify({message}))
        })

    })

    server.listen(p, () => {
        console.log(`Server is listening on port ${p}`) 
    })
}

main(p,s)
