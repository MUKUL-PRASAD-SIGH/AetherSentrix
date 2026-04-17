"""Data encryption utilities."""

import os
import logging
from typing import Optional
from cryptography.fernet import Fernet

logger = logging.getLogger(__name__)


class EncryptionManager:
    """Manage data encryption at rest."""

    def __init__(self, key_path: Optional[str] = None):
        """Initialize encryption manager."""
        if key_path is None:
            key_path = os.getenv('ENCRYPTION_KEY_PATH', '.encryption_key')
        
        self.key_path = key_path
        self._load_or_create_key()

    def _load_or_create_key(self):
        """Load existing key or create new one."""
        if os.path.exists(self.key_path):
            logger.info(f"Loading encryption key from {self.key_path}")
            with open(self.key_path, 'rb') as f:
                key = f.read()
        else:
            logger.info(f"Creating new encryption key at {self.key_path}")
            key = Fernet.generate_key()
            
            # Create directory if needed
            os.makedirs(os.path.dirname(self.key_path) or '.', exist_ok=True)
            
            # Save key with restricted permissions
            with open(self.key_path, 'wb') as f:
                f.write(key)
            os.chmod(self.key_path, 0o600)
        
        self.cipher = Fernet(key)

    def encrypt_data(self, plaintext: str) -> str:
        """Encrypt data."""
        if not plaintext:
            return ""
        
        try:
            encrypted = self.cipher.encrypt(plaintext.encode())
            return encrypted.decode()
        except Exception as e:
            logger.error(f"Encryption failed: {str(e)}")
            raise

    def decrypt_data(self, ciphertext: str) -> str:
        """Decrypt data."""
        if not ciphertext:
            return ""
        
        try:
            decrypted = self.cipher.decrypt(ciphertext.encode())
            return decrypted.decode()
        except Exception as e:
            logger.error(f"Decryption failed: {str(e)}")
            raise

    def encrypt_dict(self, data: dict, keys_to_encrypt: list) -> dict:
        """Encrypt specific keys in a dictionary."""
        result = data.copy()
        for key in keys_to_encrypt:
            if key in result:
                result[key] = self.encrypt_data(str(result[key]))
        return result

    def decrypt_dict(self, data: dict, keys_to_decrypt: list) -> dict:
        """Decrypt specific keys in a dictionary."""
        result = data.copy()
        for key in keys_to_decrypt:
            if key in result:
                result[key] = self.decrypt_data(result[key])
        return result


# Global encryption manager instance
_encryption_manager: Optional[EncryptionManager] = None


def get_encryption_manager() -> EncryptionManager:
    """Get global encryption manager instance."""
    global _encryption_manager
    if _encryption_manager is None:
        _encryption_manager = EncryptionManager()
    return _encryption_manager
