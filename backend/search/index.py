'''
Business: Google Custom Search API proxy - searches web using Google API
Args: event with httpMethod GET, queryStringParameters with 'q' (search query)
Returns: HTTP response with search results from Google
'''

import json
import os
import urllib.request
import urllib.parse
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    params = event.get('queryStringParameters', {})
    query = params.get('q', '').strip()
    
    if not query:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Search query required'}),
            'isBase64Encoded': False
        }
    
    api_key = 'AIzaSyCVAXiUzRBvOYT3OV5yF7ijNPLGGqz7LYI'
    cx = '4452bb97441214b1d'
    
    search_url = f'https://www.googleapis.com/customsearch/v1?key={api_key}&cx={cx}&q={urllib.parse.quote(query)}'
    
    req = urllib.request.Request(search_url)
    response = urllib.request.urlopen(req)
    data = json.loads(response.read().decode())
    
    if 'items' not in data:
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'items': []}),
            'isBase64Encoded': False
        }
    
    results = []
    for item in data['items']:
        results.append({
            'title': item.get('title', ''),
            'link': item.get('link', ''),
            'snippet': item.get('snippet', ''),
            'displayLink': item.get('displayLink', '')
        })
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'items': results, 'total': len(results)}),
        'isBase64Encoded': False
    }