"""
Generate RSA key pair for JWT and message encryption
"""
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.backends import default_backend
import os

def generate_keys():
    # Create keys directory if it doesn't exist
    os.makedirs('config/keys', exist_ok=True)
    
    # Generate private key
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
        backend=default_backend()
    )
    
    # Get public key from private key
    public_key = private_key.public_key()
    
    # Serialize private key
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )
    
    # Serialize public key
    public_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    
    # Write private key
    with open('config/keys/private.pem', 'wb') as f:
        f.write(private_pem)
    
    # Write public key
    with open('config/keys/public.pem', 'wb') as f:
        f.write(public_pem)
    
    print("Keys generated successfully!")
    print(f"Private key saved to: {os.path.abspath('config/keys/private.pem')}")
    print(f"Public key saved to: {os.path.abspath('config/keys/public.pem')}")

if __name__ == "__main__":
    generate_keys()
