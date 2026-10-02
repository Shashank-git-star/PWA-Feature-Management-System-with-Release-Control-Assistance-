import json
import os

import redis

redis_client = redis.Redis.from_url(
    os.getenv("REDIS_URL", "redis://localhost:6379/0"),
    decode_responses=True,
)

def get_cached_evaluation(flag_key, env, user_id, group_id=None):
    cache_key = f"eval:{flag_key}:{env}:user-{user_id or 'none'}:group-{group_id or 'none'}"
    cached_data = redis_client.get(cache_key)
    return json.loads(cached_data) if cached_data else None

def set_cached_evaluation(flag_key, env, user_id, result, group_id=None):
    cache_key = f"eval:{flag_key}:{env}:user-{user_id or 'none'}:group-{group_id or 'none'}"
    # TTL of 300 seconds
    redis_client.setex(cache_key, 300, json.dumps(result))

def invalidate_flag_cache(flag_key: str):
    # Search and delete all keys related to this flag
    keys = redis_client.keys(f"eval:{flag_key}:*")
    if keys:
        redis_client.delete(*keys)