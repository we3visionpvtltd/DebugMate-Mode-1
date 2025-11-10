import os
import jwt
import datetime
from functools import wraps
from flask import request, jsonify
from pathlib import Path

# Load keys
KEY_DIR = os.path.join(os.path.dirname(__file__), '..', 'config', 'keys')
PRIVATE_KEY_PATH = os.getenv('PRIVATE_KEY_PATH', os.path.join(KEY_DIR, 'private.pem'))
PUBLIC_KEY_PATH = os.getenv('PUBLIC_KEY_PATH', os.path.join(KEY_DIR, 'public.pem'))

# Load keys
with open(PRIVATE_KEY_PATH, 'r') as f:
    PRIVATE_KEY = f.read()

with open(PUBLIC_KEY_PATH, 'r') as f:
    PUBLIC_KEY = f.read()

# JWT configuration
JWT_ALGORITHM = 'RS256'
JWT_ISSUER = os.getenv('JWT_ISSUER', 'your-company')
JWT_AUDIENCE = os.getenv('JWT_AUDIENCE', 'your-audience')
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', '15'))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv('REFRESH_TOKEN_EXPIRE_DAYS', '7'))

def create_access_token(user_id, additional_claims=None):
    """Create a new access token"""
    now = datetime.datetime.utcnow()
    payload = {
        'sub': str(user_id),
        'iat': now,
        'exp': now + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        'iss': JWT_ISSUER,
        'aud': JWT_AUDIENCE,
        'type': 'access'
    }
    
    if additional_claims:
        payload.update(additional_claims)
    
    return jwt.encode(payload, PRIVATE_KEY, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id):
    """Create a new refresh token"""
    now = datetime.datetime.utcnow()
    payload = {
        'sub': str(user_id),
        'iat': now,
        'exp': now + datetime.timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
        'iss': JWT_ISSUER,
        'aud': JWT_AUDIENCE,
        'type': 'refresh'
    }
    return jwt.encode(payload, PRIVATE_KEY, algorithm=JWT_ALGORITHM)

def verify_token(token):
    """Verify a JWT token and return the payload if valid"""
    try:
        payload = jwt.decode(
            token,
            PUBLIC_KEY,
            algorithms=[JWT_ALGORITHM],
            issuer=JWT_ISSUER,
            audience=JWT_AUDIENCE
        )
        return payload
    except jwt.ExpiredSignatureError:
        return {'error': 'Token expired'}
    except jwt.InvalidTokenError as e:
        return {'error': f'Invalid token: {str(e)}'}

def token_required(f):
    """Decorator to protect routes that require authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Check for token in Authorization header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
        
        # If not in header, check cookies
        if not token and 'token' in request.cookies:
            token = request.cookies.get('token')
        
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        
        # Verify token
        payload = verify_token(token)
        if 'error' in payload:
            return jsonify({'message': payload['error']}), 401
        
        # Add user info to request
        request.user = payload
        
        return f(*args, **kwargs)
    
    return decorated
