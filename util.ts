import crypto from 'crypto';
import * as fs from 'node:fs';

export function verifyAuthFile(auth_file: string, origin: string,runningServerAuthFile: string): boolean {
    const auth_file_data = fs.readFileSync(`../${origin}/${auth_file}`, "utf-8");
    const runningServerAuthFile_data = fs.readFileSync(runningServerAuthFile, "utf-8");
    if(auth_file_data !== runningServerAuthFile_data){
      return false
    }
    return true
}

export function generateHash(request: string, auth_file_name: string): string{
    let file_content = fs.readFileSync(auth_file_name, "utf-8");
    file_content = file_content.slice(0,10)

    const hmac = crypto.createHmac('sha256', file_content);
    hmac.update(request);
    return hmac.digest('hex');
}

// {"store":{"operations":"get_valid","data":{"vcc": "5555.vcc","shopping_value":55.96 } } }###_hash_value: a2e689a1ac7ebbca5eac590075601615baaed36a3263c013e671f4667f838548

export function parseRequest(request: string): [string,string]{
    
    const [requestJson, hash] = request.split('###_')
    const [_, hashValue] = hash.split(': ')

    return [requestJson, hashValue]
}
