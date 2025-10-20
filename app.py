import os
import sqlite3
from flask import Flask, render_template, g, request, redirect, url_for, session, flash
from functools import wraps

app = Flask(__name__)
app.secret_key = "segredo"

# ========================
# Caminho absoluto para o banco de dados
# ========================
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DB_PATH = os.path.join(BASE_DIR, "database", "nutrity.db")

# ========================
# Conexão com o banco
# ========================
def get_db():
    """Obtém uma conexão com o banco de dados SQLite."""
    if 'db' not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db

@app.teardown_appcontext
def close_db(exception):
    """Fecha a conexão com o banco após o request."""
    db = g.pop('db', None)
    if db is not None:
        db.close()

# ========================
# Autenticação
# ========================
@app.route('/', methods=['GET', 'POST'])
@app.route('/login', methods=['GET', 'POST'])
def login():
    """Tela de login e autenticação do usuário."""
    if request.method == 'POST':
        email = request.form.get('email')
        senha = request.form.get('senha')

        db = get_db()
        user = db.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()

        if user and user['senha'] == senha:
            session['user_id'] = user['id']
            session['user_name'] = user['nome']
            flash(f"Bem-vindo de volta, {user['nome']}!", "success")
            return redirect(url_for('dashboard'))
        else:
            flash("E-mail ou senha inválidos.", "danger")

    return render_template('login.html')

@app.route('/cadastro', methods=['GET', 'POST'])
def cadastro():
    """Tela de cadastro de novo usuário."""
    if request.method == 'POST':
        nome = request.form.get('nome')
        email = request.form.get('email')
        senha = request.form.get('senha')

        if not nome or not email or not senha:
            flash("Preencha todos os campos.", "warning")
            return render_template('cadastro.html')

        db = get_db()
        try:
            db.execute("INSERT INTO users (nome, email, senha) VALUES (?, ?, ?)", (nome, email, senha))
            db.commit()
            flash("Cadastro realizado com sucesso! Faça login para continuar.", "success")
            return redirect(url_for('login'))
        except sqlite3.IntegrityError:
            flash("Este e-mail já está cadastrado.", "danger")

    return render_template('cadastro.html')

@app.route('/logout')
def logout():
    """Encerra a sessão do usuário."""
    session.clear()
    flash("Você saiu da conta.", "info")
    return redirect(url_for('login'))

# ========================
# Proteção de rotas
# ========================
def login_required(view_func):
    """Decorator simples para rotas que exigem login."""
    @wraps(view_func)
    def wrapped(*args, **kwargs):
        if 'user_id' not in session:
            flash("Faça login para acessar esta página.", "warning")
            return redirect(url_for('login'))
        return view_func(*args, **kwargs)
    return wrapped

# ========================
# Rotas principais
# ========================
@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html', nome=session.get('user_name'))

@app.route('/configuracoes')
@login_required
def configuracoes():
    return render_template('configuracoes.html')

@app.route('/criar_tabela')
@login_required
def criar_tabela():
    return render_template('criar_tabela.html')

@app.route('/historico')
@login_required
def historico():
    return render_template('historico.html')

@app.route('/perfil', methods=['GET', 'POST'])
@login_required
def perfil():
    db = get_db()
    user_id = session.get('user_id')
    user = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()

    if request.method == 'POST':
        # Exclusão da conta
        if 'delete_account' in request.form:
            db.execute("DELETE FROM users WHERE id = ?", (user_id,))
            db.commit()
            session.clear()
            return redirect(url_for('login'))

        # Atualização das informações pessoais
        if request.form.get('action') == 'update_info':
            nome = request.form.get('nome')
            email = request.form.get('email')

            db.execute(
                "UPDATE users SET nome = ?, email = ? WHERE id = ?",
                (nome, email, user_id)
            )
            db.commit()
            session['user_name'] = nome

        # Alteração de senha
        elif request.form.get('action') == 'update_password':
            senha_atual = request.form.get('senha_atual')
            nova_senha = request.form.get('nova_senha')
            confirmar = request.form.get('confirmar_senha')

            if senha_atual == user['senha'] and nova_senha == confirmar and nova_senha:
                db.execute(
                    "UPDATE users SET senha = ? WHERE id = ?",
                    (nova_senha, user_id)
                )
                db.commit()

        # Atualiza os dados recarregados
        user = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()

    return render_template('perfil.html', user=user)

@app.route('/tabela_resultado')
@login_required
def tabela_resultado():
    return render_template('tabela-resultado.html')

# ========================
# Inicialização
# ========================
if __name__ == '__main__':
    if not os.path.exists(DB_PATH):
        print("Banco de dados não encontrado.")
        print("Execute o comando: python database/init_db.py")
    else:
        print("Banco de dados localizado, iniciando servidor Flask...")

    app.run(debug=True)
