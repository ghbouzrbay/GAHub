#!/usr/bin/python3

import sqlite3

def create_database(database_name):
    conn = sqlite3.connect(database_name)
    return conn

def create_user_table(conn):
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            username TEXT NOT NULL,
            email TEXT NOT NULL,
            password TEXT NOT NULL
        )
    ''')
    conn.commit()

def main():
    conn = create_database('users.db')
    create_user_table(conn)
    conn.close()

if __name__ == '__main__':
    main()
