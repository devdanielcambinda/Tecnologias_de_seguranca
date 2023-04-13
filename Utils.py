import re
import ipaddress
import os
from Crypto.Cipher import AES
from Crypto.Hash import SHA256
import base64
import json
import math
import string
import random
from collections import namedtuple
from Crypto import Random
import sys
def findElementsInArray(element, array:list):
    """
    Permite determinar se um elemento se encontra no array
    """
    for e in array:
        if e.__eq__(element):
            return True
    return False

def findHowManyTimesElementsAppearInString(element, string):
    """
    Conta quantas vezes um elemento surge numa string, permitindo encontrar duplicados
    """
    counter=0
    for e in string:
        if e.__eq__(element):
            counter=counter+1
    return counter
def verifyFileNames(file_name):
    """
    Verifica a conformidade do nome do ficheiro de autenticacao
    """
    regexes= ['[a-z]', '_', '\\-', '\\.', '[0-9]']
    ret_list=list()
    counter=0
    if not 1 <= len(file_name) <= 127 or file_name.__eq__("\\.") or file_name.__eq__("\\.."):
        return False
    for char in file_name:
        for reg in regexes:
            #print("Reg-Char",reg+" - "+char)
            ret_list=re.findall(reg,char)
            #print("ret_list",ret_list)
            if ret_list:
                counter = counter+1
        if counter>0:
            counter = 0
            continue
        else:
            return False
    return True

def verifyIPAddress(ip_address):
    """
    Verificar se o endereço providenciado é um endereço IPV4 válido
    :param ip_address:
    :return:
    """
    try:
        ip = ipaddress.IPv4Address(ip_address)
        return True
    except ipaddress.AddressValueError:
        return False

def verifyIfIsDecimalAndPositive(port):
    """
    verificar se o número providenciado é positivo e é decimal (e não é hexadecimal e não octal)
    """
    prefix_hexa="0x"
    prefix_octa="0"
    try:
        if int(port) > 0 and str(port).isdecimal() and not str(port).startswith(prefix_hexa.casefold()) and not str(port).startswith(prefix_octa):
            return True
        else:
            return False
    except ValueError:
        return False

#print(verifyFileNames("55555_2.card"))

#print(verifyIPAddress("1930.000.000.111"))

#print(verifyIfOctalOrHexa("1000"))

def findValidCMDOptionsInMbecRequest(data):
    return True

def verifyShoppingValue(shopping_value):
    prefix_hexa = "0x"
    prefix_octa = "0"
    try:
        if 0.00 <= float(shopping_value) <= 4294967295.99 \
                and not str(shopping_value).startswith(prefix_hexa.casefold()) \
                and not str(shopping_value).startswith(prefix_octa):
            return True
        else:
            return False
    except ValueError:
        return False


def handleSigTerm(signum, frame):
    print("CTRL+C was pressed")
    sys.exit(1)

def generateDataToHashFromFile(file_name):
    len_file=os.path.getsize(file_name)
    file_data=verifyIfKeyNeedsPadding(file_to_work=file_name, len_file_to_work=len_file)
    if file_data is not None:
        data_to_hash=file_data[:32]
    else:
        with open(file_name, "r") as file:
            data_to_hash=file.read(32)
    return data_to_hash

def verifyIfKeyNeedsPadding(file_to_work, len_file_to_work):
    KEY_SIZE=32
    if len_file_to_work<32:
        diff=KEY_SIZE-len_file_to_work
        appending=""
        for i in range(diff):
            appending+=" "
        with open(file_to_work, "r") as file_0:
            file_0=file_0.read()
        file_0=file_0+appending
        return file_0
    else:
        return None
    
def padding(s):
    block_size = 16
    padding_to_add = block_size - (len(s) % block_size)
    return str(s + padding_to_add * ' ')


def encrypt(command_to_encrypt, name_auth_file):
    iv = Random.new().read(AES.block_size)
    
    key=generateDataToHashFromFile(name_auth_file)

    final_key = SHA256.new(key.encode("utf-8")).digest()
    
    padded_text = padding(command_to_encrypt)

    padded_text = padded_text.encode("utf-8")

    cipher_config = AES.new(final_key, AES.MODE_CBC, iv)

    ret="{{\"ciphertext\": \"{}\", \"iv\": \"{}\"}}".format(base64.b64encode(cipher_config.encrypt(padded_text)).decode("utf-8"), base64.b64encode(iv).decode("utf-8"))
    return ret



def decrypt(enc_dict:str, name_auth_file):

    print("enc_dict: ", enc_dict)
    
    enc_dict = json.loads(enc_dict)
    #print(enc_dict)
    
    enc_text = base64.b64decode(enc_dict["ciphertext"].encode("utf-8"))

    #print(enc_text)

    enc_iv = base64.b64decode(enc_dict["iv"].encode("utf-8"))
    #print(enc_iv)

    key = generateDataToHashFromFile(name_auth_file)

    final_key = SHA256.new(key.encode("utf-8")).digest()

    cipher = AES.new(final_key, AES.MODE_CBC, enc_iv)

    decrypted_text = cipher.decrypt(enc_text)

    decrypted_unpadded_text = decrypted_text.rstrip()
    

    return decrypted_unpadded_text
    
Response = namedtuple('Response', ['success', 'result'])
SEED = f"|{math.pi:.8f}|{math.e:.8f}"


def get_random_string(length: int):
    letters = list(string.ascii_lowercase)
    result_str = ''.join(random.choice(letters) for i in range(length))
    #random.shuffle(result_str)
    result = "".join(result_str)
    #print(f'result {result}')
    return result
#TESTAR A ENCRIPTAÇÃO
"""
def main():
    encrypted = encrypt(name_auth_file="abc.txt",command_to_encrypt="shhh -p 1000 s- auth.txt")
    print("First:",encrypted)

    decrypted = decrypt(encrypted, "abc.txt")
    print("Second:", bytes.decode(decrypted))
"""
#main()








