import json
import redis
import pandas as pd
from typing import Optional, Any
from src.core.config import settings

class CacheService:
    def __init__(self):
        try:
            self.redis = redis.from_url(settings.REDIS_URL)
            self.redis.ping()
            self.use_redis = True
        except Exception:
            self.use_redis = False
            self.memory_cache = {}

    def get_data(self, key: str) -> Optional[pd.DataFrame]:
        if self.use_redis:
            data = self.redis.get(key)
            if data:
                # Decode bytes to string for pandas
                return pd.read_json(data.decode('utf-8'))
        else:
            return self.memory_cache.get(key)
        return None

    def set_data(self, key: str, df: pd.DataFrame, expire: int = 3600):
        if self.use_redis:
            self.redis.setex(key, expire, df.to_json())
        else:
            self.memory_cache[key] = df

    def generate_key(self, prefix: str, **kwargs) -> str:
        # Sort kwargs to ensure deterministic key
        items = sorted(kwargs.items())
        suffix = ":".join([f"{k}={v}" for k, v in items])
        return f"{prefix}:{suffix}"

cache_service = CacheService()
