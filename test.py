import json
import socket
from Utils import *
COM_ENCRIPTACAO= True
def talkWithBankToGetBalanceAndIfTheCardIsActive(name_auth_file, vcc, shopping_value):
    try:
        host = socket.gethostbyaddr("127.0.0.1")[0]
        port = 3000
        #{"store":{"operations":["get","valid"],"data":{"name_auth_file": name_auth_file,"vcc":vcc,"shopping_value":shopping_value}}}
        message = "{{"store":{{"operations":"get_valid","data":{{"name_auth_file": "{}","vcc":"{}","shopping_value":{} }} }} }}".format(name_auth_file,vcc,shopping_value)
        if(COM_ENCRIPTACAO):
            message = encrypt(message, "abc.txt")
        print(message)
        client_socket = socket.socket()
        client_socket.connect((host, port))
        client_socket.settimeout(20)
        client_socket.send(message.encode())
        data = client_socket.recv(4096).decode()
        if(COM_ENCRIPTACAO):
            data= decrypt(data, "abc.txt").decode("utf-8")
        print("Sended: ", data)
        if len(data) > 0:
            #bank_response = processBankResponse(data, shopping_value, name_auth_file)
            #client_socket.close()
            #return bank_response
            # close the connection
            pass
        else:
            client_socket.close()
            exit(63)

    except socket.error:
        exit(63)


talkWithBankToGetBalanceAndIfTheCardIsActive(name_auth_file="bank.auth",vcc="abc.card",shopping_value=15.99)
