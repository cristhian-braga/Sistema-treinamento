import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="senha",
    database="meu_banco"
)

print("Conectado!" if conn.is_connected() else "Falha na conexão")

conn.close()