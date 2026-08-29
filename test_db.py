import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        print("\n✅ Success! Connected to PostgreSQL successfully!")
except Exception as e:
    print("\n❌ Connection failed! Error details:")
    print(e)