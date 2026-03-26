"""Управление чатами: список, создание личного и группового чата"""
import json, os, psycopg2

COLORS = ['#7c6df8','#4f9cf9','#34d399','#f59e0b','#f87171','#a78bfa','#fb923c','#38bdf8']

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

def handler(event: dict, context) -> dict:
    headers = {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id', 'Content-Type': 'application/json'}
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**headers, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'}, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')
    body = json.loads(event.get('body') or '{}')

    conn = get_conn()
    cur = conn.cursor()

    try:
        me = auth(event, cur)
        if not me:
            return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'error': 'Необходима авторизация'})}

        # GET ?action=list — список моих чатов с последним сообщением
        if action == 'list':
            cur.execute('''
                SELECT c.id, c.type, c.name, c.color,
                       (SELECT m.text FROM messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_text,
                       (SELECT to_char(m.created_at, 'HH24:MI') FROM messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_time,
                       (SELECT m.sender_id FROM messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_sender_id,
                       (SELECT u2.display_name FROM chat_members cm2 JOIN users u2 ON u2.id = cm2.user_id WHERE cm2.chat_id = c.id AND cm2.user_id != %s LIMIT 1) as other_name,
                       (SELECT u2.color FROM chat_members cm2 JOIN users u2 ON u2.id = cm2.user_id WHERE cm2.chat_id = c.id AND cm2.user_id != %s LIMIT 1) as other_color,
                       (SELECT u2.username FROM chat_members cm2 JOIN users u2 ON u2.id = cm2.user_id WHERE cm2.chat_id = c.id AND cm2.user_id != %s LIMIT 1) as other_username
                FROM chats c
                JOIN chat_members cm ON cm.chat_id = c.id
                WHERE cm.user_id = %s
                ORDER BY (SELECT created_at FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) DESC NULLS LAST
            ''', (me['id'], me['id'], me['id'], me['id']))
            rows = cur.fetchall()

            chats = []
            for r in rows:
                cid, ctype, cname, ccolor, last_text, last_time, last_sender_id, other_name, other_color, other_username = r
                # Для личного чата — имя и цвет собеседника
                if ctype == 'direct' and other_name:
                    display_name = other_name
                    display_color = other_color or '#7c6df8'
                    avatar = other_name[0].upper()
                else:
                    display_name = cname or 'Группа'
                    display_color = ccolor or '#7c6df8'
                    avatar = (cname or 'Г')[0].upper()

                chats.append({
                    'id': cid,
                    'type': ctype,
                    'name': display_name,
                    'color': display_color,
                    'avatar': avatar,
                    'last_text': last_text,
                    'last_time': last_time,
                    'last_sender_id': last_sender_id,
                    'other_username': other_username,
                })
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'chats': chats, 'me': me})}

        # POST ?action=direct — создать личный чат с пользователем
        if action == 'direct':
            target_id = body.get('user_id')
            if not target_id:
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Укажите user_id'})}
            if target_id == me['id']:
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Нельзя написать самому себе'})}

            # Проверить — уже есть такой чат?
            cur.execute('''
                SELECT c.id FROM chats c
                JOIN chat_members a ON a.chat_id = c.id AND a.user_id = %s
                JOIN chat_members b ON b.chat_id = c.id AND b.user_id = %s
                WHERE c.type = 'direct'
                LIMIT 1
            ''', (me['id'], target_id))
            existing = cur.fetchone()
            if existing:
                return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'chat_id': existing[0], 'existed': True})}

            cur.execute('INSERT INTO chats (type, created_by) VALUES (%s, %s) RETURNING id', ('direct', me['id']))
            chat_id = cur.fetchone()[0]
            cur.execute('INSERT INTO chat_members (chat_id, user_id) VALUES (%s, %s), (%s, %s)', (chat_id, me['id'], chat_id, target_id))
            conn.commit()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'chat_id': chat_id, 'existed': False})}

        # POST ?action=group — создать групповой чат
        if action == 'group':
            name = (body.get('name') or '').strip()
            member_ids = body.get('member_ids', [])
            if not name:
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Укажите название группы'})}
            if len(member_ids) < 1:
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Добавьте хотя бы одного участника'})}

            color_idx = sum(ord(c) for c in name) % len(COLORS)
            color = COLORS[color_idx]
            cur.execute('INSERT INTO chats (type, name, color, created_by) VALUES (%s, %s, %s, %s) RETURNING id', ('group', name, color, me['id']))
            chat_id = cur.fetchone()[0]

            all_members = list(set([me['id']] + member_ids))
            for uid in all_members:
                cur.execute('INSERT INTO chat_members (chat_id, user_id) VALUES (%s, %s)', (chat_id, uid))

            # Стартовое сообщение
            cur.execute('INSERT INTO messages (chat_id, sender_id, text) VALUES (%s, %s, %s)', (chat_id, me['id'], f'Группа "{name}" создана!'))
            conn.commit()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'chat_id': chat_id})}

        # GET ?action=members&chat_id=X — список участников чата
        if action == 'members':
            chat_id = params.get('chat_id')
            if not chat_id:
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Укажите chat_id'})}
            cur.execute('''
                SELECT u.id, u.username, u.display_name, u.color
                FROM chat_members cm JOIN users u ON u.id = cm.user_id
                WHERE cm.chat_id = %s
            ''', (int(chat_id),))
            rows = cur.fetchall()
            members = [{'id': r[0], 'username': r[1], 'display_name': r[2], 'color': r[3]} for r in rows]
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'members': members})}

        return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Not found'})}
    finally:
        cur.close()
        conn.close()