from sqlalchemy import create_engine, Column, String, DateTime, ForeignKey, Integer, Enum, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
import uuid

Base = declarative_base()

def generate_uuid():
    return str(uuid.uuid4())

class Severity(str, enum.Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"

class Product(Base):
    __tablename__ = "products"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    
    bugs = relationship("Bug", back_populates="product")

class Status(Base):
    __tablename__ = "statuses"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String(50), unique=True, nullable=False)
    color = Column(String(7), default="#3b82f6")  # hex color
    order = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    
    bugs = relationship("Bug", back_populates="status")

class Bug(Base):
    __tablename__ = "bugs"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    summary = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(Enum(Severity), default=Severity.MEDIUM)
    status_id = Column(String, ForeignKey("statuses.id"), nullable=False)
    reporter_name = Column(String(100), nullable=True)
    reporter_email = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    product = relationship("Product", back_populates="bugs")
    status = relationship("Status", back_populates="bugs")
    screenshots = relationship("Screenshot", back_populates="bug", cascade="all, delete-orphan")

class Screenshot(Base):
    __tablename__ = "screenshots"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    bug_id = Column(String, ForeignKey("bugs.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)
    uploaded_at = Column(DateTime, server_default=func.now())
    
    bug = relationship("Bug", back_populates="screenshots")
