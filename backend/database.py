# backend/database.py
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import datetime

DATABASE_URL = "sqlite:///./audits.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(String, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Store data findings
    title_value = Column(Text)
    title_status = Column(String)
    title_message = Column(Text)
    
    desc_value = Column(Text)
    desc_status = Column(String)
    desc_message = Column(Text)
    
    h1_value = Column(Integer)
    h1_status = Column(String)
    h1_message = Column(Text)
    
    img_value = Column(String)
    img_status = Column(String)
    img_message = Column(Text)
    
    link_value = Column(String)
    link_status = Column(String)
    link_message = Column(Text)
    
    perf_value = Column(String)
    perf_status = Column(String)
    perf_message = Column(Text)
    
    # NEW: Keep track of manual user saves
    is_saved = Column(Boolean, default=False)

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()