import mysql.connector


def get_connection():

    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="YOUR_MYSQL_PASSWORD",
        database="edumentor"
    )