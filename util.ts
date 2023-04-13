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

function generateDataToHashFromFile(file_name: string): Buffer {
    const len_file = fs.statSync(file_name).size;
    let file_data = verifyIfKeyNeedsPadding(file_name, len_file);
    if (file_data !== null) {
        file_data = file_data.slice(0, 32);
    } else {
        const file = fs.readFileSync(file_name, "utf-8");
        file_data = Buffer.from(file.slice(0, 32));
    }
    return file_data;
}

function verifyIfKeyNeedsPadding(file_to_work: string, len_file_to_work: number): Buffer | null {
    const KEY_SIZE = 32;
    if (len_file_to_work < 32) {
        const diff = KEY_SIZE - len_file_to_work;
        let appending = "";
        for (let i = 0; i < diff; i++) {
            appending += " ";
        }
        let file_0 = fs.readFileSync(file_to_work, "utf-8");
        file_0 = file_0 + appending;
        return Buffer.from(file_0);
    } else {
        return null;
    }
}

function padding(s: string): string {
    const block_size = 16;
    const padding_to_add = block_size - (s.length % block_size);
    return s + Array(padding_to_add + 1).join(' ');
}

export function encrypt(command_to_encrypt: string, name_auth_file: string): string {
    const iv = crypto.randomBytes(16);

    const key = generateDataToHashFromFile(name_auth_file).toString("utf-8");
    const final_key = crypto.createHash("sha256").update(key).digest();

    let padded_text:any = padding(command_to_encrypt);
    padded_text = Buffer.from(padded_text, "utf-8");

    const cipher_config = crypto.createCipheriv("aes-256-cbc", final_key, iv);

    const ciphertext = Buffer.concat([cipher_config.update(padded_text), cipher_config.final()]);

    const ret = `{"ciphertext": "${ciphertext.toString("base64")}", "iv": "${iv.toString("base64")}"}`;
    return ret;
}

export function decrypt(enc_dict: string, name_auth_file: string): string {
    const enc_dict_obj = JSON.parse(enc_dict);
    const enc_text = Buffer.from(enc_dict_obj.ciphertext, "base64");
    const enc_iv = Buffer.from(enc_dict_obj.iv, "base64");

    console.log(enc_iv);

    const key = generateDataToHashFromFile(name_auth_file).toString("utf-8");
    const final_key = crypto.createHash("sha256").update(key).digest();

    console.log(key);
    console.log(final_key);

    const decipher = crypto.createDecipheriv("aes-256-cbc", final_key, enc_iv);

    let decrypted_text = Buffer.concat([decipher.update(enc_text), decipher.final()]);

    decrypted_text = Buffer.from(decrypted_text.toString().trim());

    return decrypted_text.toString();
}