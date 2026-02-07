from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum

# Enums
class SeverityEnum(str, Enum):
    Low = "Low"
    Medium = "Medium"
    High = "High"
    Critical = "Critical"

# Product Schemas
class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    active: bool = True

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    active: Optional[bool] = None

class ProductResponse(ProductBase):
    id: str
    created_at: datetime
    
    class Config:
        orm_mode = True

# Status Schemas
class StatusBase(BaseModel):
    name: str
    color: str = "#3b82f6"
    order: int = 0

class StatusCreate(StatusBase):
    pass

class StatusUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    order: Optional[int] = None

class StatusResponse(StatusBase):
    id: str
    created_at: datetime
    
    class Config:
        orm_mode = True

class StatusOrder(BaseModel):
    id: str
    order: int

# Screenshot Schemas
class ScreenshotResponse(BaseModel):
    id: str
    filename: str
    original_filename: str
    file_size: int
    uploaded_at: datetime
    
    class Config:
        orm_mode = True

# Bug Schemas
class BugBase(BaseModel):
    product_id: str
    summary: str
    description: str
    severity: SeverityEnum = SeverityEnum.Medium
    reporter_name: Optional[str] = None
    reporter_email: Optional[str] = None

class BugCreate(BugBase):
    pass

class BugUpdate(BaseModel):
    status_id: Optional[str] = None
    severity: Optional[SeverityEnum] = None

class BugResponse(BaseModel):
    id: str
    product_id: str
    summary: str
    description: str
    severity: SeverityEnum
    status_id: str
    reporter_name: Optional[str]
    reporter_email: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True

class BugDetailResponse(BaseModel):
    id: str
    product_id: str
    product: ProductResponse
    summary: str
    description: str
    severity: SeverityEnum
    status_id: str
    status: StatusResponse
    reporter_name: Optional[str]
    reporter_email: Optional[str]
    created_at: datetime
    updated_at: datetime
    screenshots: List[ScreenshotResponse]
    
    class Config:
        orm_mode = True

class BugListResponse(BaseModel):
    bugs: List[BugDetailResponse]
    total: int
    skip: int
    limit: int
