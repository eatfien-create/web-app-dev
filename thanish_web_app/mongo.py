"""MongoDB storage for chat logs and feedback.

Falls back to a local JSON-lines file when MongoDB is unreachable so the site
keeps working in development; production should set MONGO_URI.
"""
import json
import logging
import os
from datetime import datetime, timezone
from pathlib import Path

logger = logging.getLogger(__name__)

_client = None
FALLBACK_DIR = Path(__file__).resolve().parent.parent / 'logs'


def _db():
    global _client
    uri = os.environ.get('MONGO_URI')
    if not uri:
        return None
    try:
        if _client is None:
            from pymongo import MongoClient
            _client = MongoClient(uri, serverSelectionTimeoutMS=2000)
        return _client[os.environ.get('MONGO_DB', 'vivaria')]
    except Exception:
        logger.exception('MongoDB unavailable')
        return None


def save(collection, doc):
    doc = {**doc, 'created_at': datetime.now(timezone.utc)}
    db = _db()
    if db is not None:
        try:
            db[collection].insert_one(dict(doc))
            return 'mongodb'
        except Exception:
            logger.exception('Mongo insert failed, using file fallback')
    FALLBACK_DIR.mkdir(exist_ok=True)
    with open(FALLBACK_DIR / f'{collection}.jsonl', 'a') as f:
        f.write(json.dumps(doc, default=str) + '\n')
    return 'file'


def ping():
    db = _db()
    if db is None:
        return False
    try:
        db.command('ping')
        return True
    except Exception:
        return False
