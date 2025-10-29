'''
Business: User authentication - registration and login with password hashing
Args: event with httpMethod, body containing email, password, username
Returns: HTTP response with user data or error message
'''

import json
import os
import hashlib
import psycopg2
from typing import Dict, Any

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    body_data = json.loads(event.get('body', '{}'))
    action = body_data.get('action')
    email = body_data.get('email', '').strip().lower()
    password = body_data.get('password', '')
    username = body_data.get('username', '').strip()
    
    if not email or not password:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Email and password required'}),
            'isBase64Encoded': False
        }
    
    database_url = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(database_url)
    cur = conn.cursor()
    
    try:
        if action == 'register':
            if not username:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Username required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("SELECT id FROM users WHERE email = %s", (email,))
            existing_user = cur.fetchone()
            
            if existing_user:
                return {
                    'statusCode': 409,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'User already exists'}),
                    'isBase64Encoded': False
                }
            
            password_hash = hash_password(password)
            cur.execute(
                "INSERT INTO users (email, password_hash, username) VALUES (%s, %s, %s) RETURNING id, email, username, created_at",
                (email, password_hash, username)
            )
            user_data = cur.fetchone()
            conn.commit()
            
            return {
                'statusCode': 201,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'success': True,
                    'user': {
                        'id': user_data[0],
                        'email': user_data[1],
                        'username': user_data[2],
                        'created_at': str(user_data[3])
                    }
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'login':
            password_hash = hash_password(password)
            cur.execute(
                "SELECT id, email, username, created_at FROM users WHERE email = %s AND password_hash = %s",
                (email, password_hash)
            )
            user_data = cur.fetchone()
            
            if not user_data:
                return {
                    'statusCode': 401,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Invalid credentials'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = %s",
                (user_data[0],)
            )
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'success': True,
                    'user': {
                        'id': user_data[0],
                        'email': user_data[1],
                        'username': user_data[2],
                        'created_at': str(user_data[3])
                    }
                }),
                'isBase64Encoded': False
            }
        
        else:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Invalid action'}),
                'isBase64Encoded': False
            }
    
    finally:
        cur.close()
        conn.close()
