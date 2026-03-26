"""Регистрация, вход и поиск пользователей. action через query: ?action=register|login|me|search"""
import json, os, secrets, psycopg2, re

COLORS = ['#7c6df8','#4f9cf9','#34d399','#f59e0b','#f87171','#a78bfa','#fb923c','#38bdf8']

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: dict, context) -> dict:
    hdrs = {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id', 'Content-Type': 'application/json'}
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**hdrs, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'}, 'body': ''}

    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')
    body = json.loads(event.get('body') or '{}')

    conn = get_conn()
    cur = conn.cursor()
    try:
        if action == 'register':
            username = (body.get('username') or '').strip().lower()
            display_name = (body.get('display_name') or '').strip()
            if not username or not display_name:
                return {'statusCode': 400, 'headers': hdrs, 'body': json.dumps({'error': 'Заполните все поля'})}
            if len(username) < 3 or len(username) > 32:
                return {'statusCode': 400, 'headers': hdrs, 'body': json.dumps({'error': 'Логин: 3-32 символа'})}
            if not re.match(r'^[a-z0-9_]+$', username):
                return {'statusCode': 400, 'headers': hdrs, 'body': json.dumps({'error': 'Логин: только латиница, цифры и _'})}
            cur.execute('SELECT id FROM users WHERE username = %s', (username,))
            if cur.fetchone():
                return {'statusCode': 409, 'headers': hdrs, 'body': json.dumps({'error': 'Этот логин уже занят'})}
            color = COLORS[len(username) % len(COLORS)]
            cur.execute('INSERT INTO users (username, display_name, color) VALUES (%s, %s, %s) RETURNING id', (username, display_name, color))
            user_id = cur.fetchone()[0]
            session_id = secrets.token_hex(32)
            cur.execute('INSERT INTO sessions (id, user_id) VALUES (%s, %s)', (session_id, user_id))
            conn.commit()
            return {'statusCode': 200, 'headers': hdrs, 'body': json.dumps({
                'session_id': session_id,
                'user': {'id': user_id, 'username': username, 'display_name': display_name, 'color': color}
            })}

        if action == 'login':
            username = (body.get('username') or '').strip().lower()
            if not username:
                return {'statusCode': 400, 'headers': hdrs, 'body': json.dumps({'error': 'Введите логин'})}
            cur.execute('SELECT id, username, display_name, color FROM users WHERE username = %s', (username,))
            row = cur.fetchone()
            if not row:
                return {'statusCode': 404, 'headers': hdrs, 'body': json.dumps({'error': 'Пользователь не найден'})}
            user_id, uname, dname, color = row
            session_id = secrets.token_hex(32)
            cur.execute('INSERT INTO sessions (id, user_id) VALUES (%s, %s)', (session_id, user_id))
            conn.commit()
            return {'statusCode': 200, 'headers': hdrs, 'body': json.dumps({
                'session_id': session_id,
                'user': {'id': user_id, 'username': uname, 'display_name': dname, 'color': color}
            })}

        if action == 'me':
            session_id = (event.get('headers') or {}).get('x-session-id') or params.get('session_id')
            if not session_id:
                return {'statusCode': 401, 'headers': hdrs, 'body': json.dumps({'error': 'Нет сессии'})}
            cur.execute('SELECT u.id, u.username, u.display_name, u.color FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = %s', (session_id,))
            row = cur.fetchone()
            if not row:
                return {'statusCode': 401, 'headers': hdrs, 'body': json.dumps({'error': 'Сессия устарела'})}
            return {'statusCode': 200, 'headers': hdrs, 'body': json.dumps({
                'user': {'id': row[0], 'username': row[1], 'display_name': row[2], 'color': row[3]}
            })}

        if action == 'search':
            q = params.get('q', '').strip()
            session_id = (event.get('headers') or {}).get('x-session-id')
            me_id = None
            if session_id:
                cur.execute('SELECT user_id FROM sessions WHERE id = %s', (session_id,))
                r = cur.fetchone()
                if r:
                    me_id = r[0]
            if len(q) < 2:
                return {'statusCode': 200, 'headers': hdrs, 'body': json.dumps({'users': []})}
            if me_id:
                cur.execute("SELECT id, username, display_name, color FROM users WHERE (username ILIKE %s OR display_name ILIKE %s) AND id != %s LIMIT 10", (f'%{q}%', f'%{q}%', me_id))
            else:
                cur.execute("SELECT id, username, display_name, color FROM users WHERE username ILIKE %s OR display_name ILIKE %s LIMIT 10", (f'%{q}%', f'%{q}%'))
            rows = cur.fetchall()
            users = [{'id': r[0], 'username': r[1], 'display_name': r[2], 'color': r[3]} for r in rows]
            return {'statusCode': 200, 'headers': hdrs, 'body': json.dumps({'users': users})}

        return {'statusCode': 404, 'headers': hdrs, 'body': json.dumps({'error': 'Unknown action'})}
    finally:
        cur.close()
        conn.close()