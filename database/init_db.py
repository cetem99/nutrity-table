import sqlite3
import os

# Caminho absoluto para o arquivo nutrity.db dentro da pasta database
BASE_DIR = os.path.dirname(__file__)
DB_PATH = os.path.join(BASE_DIR, "nutrity.db")

# Usuário padrão (para desenvolvimento)
DEFAULT_USER = {
    "nome": "admin",
    "email": "admin@nutrity.local",
    "senha": "admin123"  # sem hash
}

def create_database():
    """Cria o banco de dados e a tabela users, se ainda não existirem.
       Insere um usuário padrão se ele ainda não existir.
    """
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # Cria a tabela se não existir
    c.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        senha TEXT NOT NULL
    )
    """)

    # Verifica se o usuário padrão já existe
    c.execute("SELECT * FROM users WHERE email = ?", (DEFAULT_USER["email"],))
    user_exists = c.fetchone()

    if not user_exists:
        c.execute(
            "INSERT INTO users (nome, email, senha) VALUES (?, ?, ?)",
            (DEFAULT_USER["nome"], DEFAULT_USER["email"], DEFAULT_USER["senha"])
        )
        conn.commit()
        print(f"Usuário padrão criado (email: {DEFAULT_USER['email']}, senha: {DEFAULT_USER['senha']})")
    else:
        print(f"Usuário padrão já existe (email: {DEFAULT_USER['email']})")

    conn.close()
    print(f"Banco de dados criado/verificado em: {DB_PATH}")

if __name__ == "__main__":
    create_database()
