"""Отправка и получение сообщений в чате (polling для реального времени)"""
import json, os, psycopg2

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def auth(event, cur):
    sid = (event.get('headers') or {}).get('x-session-id')
    if not sid:
        return None
    cur.execute('SELECT u.id, u.username, u.display_name, u.color FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = %s', (sid,))
    row = cur.fetchone()
    if not row:
        return None
    return {'id': row[0], 'username': row[1], 'display_name': row[2], 'color': row[3]}

def is_member(cur, chat_id, user_id):
    cur.execute('SELECT 1 FROM chat_members WHERE chat_id = %s AND user_id = %s', (chat_id, user_id))
    return cur.fetchone() is not None

def handler(event: dict, context) -> dict:
    headers = {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id', 'Content-Type': 'application/json'}
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**headers, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'}, 'body': ''}

    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')
    body = json.loads(event.get('body') or '{}')

    conn = get_conn()
    cur = conn.cursor()

    try:
        me = auth(event, cur)
        if not me:
            return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'error': 'Необходима авторизация'})}

        # GET ?action=poll&chat_id=X&after_id=Y — polling новых сообщений
        if action == 'poll':
            chat_id = params.get('chat_id')
            after_id = params.get('after_id', '0')
            if not chat_id:
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Укажите chat_id'})}

            chat_id = int(chat_id)
            if not is_member(cur, chat_id, me['id']):
                return {'statusCode': 403, 'headers': headers, 'body': json.dumps({'error': 'Нет доступа к чату'})}

            cur.execute('''
                SELECT m.id, m.sender_id, m.text, to_char(m.created_at, 'HH24:MI'), u.display_name, u.color
                FROM messages m
                JOIN users u ON u.id = m.sender_id
                WHERE m.chat_id = %s AND m.id > %s
                ORDER BY m.created_at ASC
                LIMIT 100
            ''', (chat_id, int(after_id)))
            rows = cur.fetchall()
            msgs = [{'id': r[0], 'sender_id': r[1], 'text': r[2], 'time': r[3], 'sender_name': r[4], 'sender_color': r[5]} for r in rows]
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'messages': msgs})}

        # GET ?action=history&chat_id=X — история сообщений (последние 50)
        if action == 'history':
            chat_id = params.get('chat_id')
            if not chat_id:
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Укажите chat_id'})}

            chat_id = int(chat_id)
            if not is_member(cur, chat_id, me['id']):
                return {'statusCode': 403, 'headers': headers, 'body': json.dumps({'error': 'Нет доступа к чату'})}

            cur.execute('''
                SELECT m.id, m.sender_id, m.text, to_char(m.created_at, 'HH24:MI'), u.display_name, u.color
                FROM messages m
                JOIN users u ON u.id = m.sender_id
                WHERE m.chat_id = %s
                ORDER BY m.created_at DESC
                LIMIT 50
            ''', (chat_id,))
            rows = cur.fetchall()
            msgs = [{'id': r[0], 'sender_id': r[1], 'text': r[2], 'time': r[3], 'sender_name': r[4], 'sender_color': r[5]} for r in reversed(rows)]
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'messages': msgs})}

        # POST ?action=send — отправить сообщение
        if action == 'send':
            chat_id = body.get('chat_id')
            text = (body.get('text') or '').strip()
            if not chat_id or not text:
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Укажите chat_id и text'})}
            if len(text) > 2000:
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Сообщение слишком длинное'})}

            chat_id = int(chat_id)
            if not is_member(cur, chat_id, me['id']):
                return {'statusCode': 403, 'headers': headers, 'body': json.dumps({'error': 'Нет доступа к чату'})}

            cur.execute('INSERT INTO messages (chat_id, sender_id, text) VALUES (%s, %s, %s) RETURNING id, to_char(created_at, \'HH24:MI\')', (chat_id, me['id'], text))
            msg_id, msg_time = cur.fetchone()
            conn.commit()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({
                'message': {
                    'id': msg_id,
                    'sender_id': me['id'],
                    'text': text,
                    'time': msg_time,
                    'sender_name': me['display_name'],
                    'sender_color': me['color'],
                }
            })}

        return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Not found'})}
    finally:
        cur.close()
        conn.close()