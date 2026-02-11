from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, status, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import shutil
import uuid
from pathlib import Path

from . import models, schemas, database
from .database import SessionLocal, engine

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Bug Tracker API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Admin password from env
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Admin authentication helper
def verify_admin(password: Optional[str] = None, x_admin_password: Optional[str] = Header(None)):
    pwd = password or x_admin_password
    if not pwd or pwd != ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="Invalid or missing password")
    return pwd

# File storage setup
UPLOAD_DIR = Path("/uploads") if os.path.exists("/uploads") else Path("./uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@app.get("/")
def read_root():
    return {"message": "Bug Tracker API", "version": "1.1.0"}

# Auth endpoint
@app.post("/api/auth/validate")
def validate_auth(password: str = Form(...)):
    """Validate admin password and return token"""
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="Invalid password")
    return {"valid": True, "token": "authenticated"}

# Products Endpoints
@app.get("/api/products", response_model=List[schemas.ProductResponse])
def get_products(db: Session = Depends(get_db)):
    """Get all active products (for bug submission form)"""
    products = db.query(models.Product).filter(models.Product.active == True).order_by(models.Product.name).all()
    return products

@app.get("/api/admin/products", response_model=List[schemas.ProductResponse])
def get_all_products(
    password: Optional[str] = None,
    x_admin_password: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Get all products including inactive (admin only)"""
    verify_admin(password, x_admin_password)
    products = db.query(models.Product).order_by(models.Product.name).all()
    return products

@app.post("/api/admin/products", response_model=schemas.ProductResponse)
def create_product(
    product: schemas.ProductCreate,
    password: Optional[str] = None,
    x_admin_password: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Create new product (admin only)"""
    verify_admin(password, x_admin_password)
    db_product = models.Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@app.patch("/api/admin/products/{product_id}", response_model=schemas.ProductResponse)
def update_product(
    product_id: str,
    product: schemas.ProductUpdate,
    password: Optional[str] = None,
    x_admin_password: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Update product (admin only)"""
    verify_admin(password, x_admin_password)
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    for key, value in product.dict(exclude_unset=True).items():
        setattr(db_product, key, value)
    
    db.commit()
    db.refresh(db_product)
    return db_product

@app.delete("/api/admin/products/{product_id}")
def delete_product(
    product_id: str,
    password: Optional[str] = None,
    x_admin_password: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Delete product if no bugs reference it (admin only)"""
    verify_admin(password, x_admin_password)
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check if any bugs use this product
    bug_count = db.query(models.Bug).filter(models.Bug.product_id == product_id).count()
    if bug_count > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete product with {bug_count} existing bugs")
    
    db.delete(db_product)
    db.commit()
    return {"message": "Product deleted"}

# Statuses Endpoints
@app.get("/api/statuses", response_model=List[schemas.StatusResponse])
def get_statuses(db: Session = Depends(get_db)):
    """Get all statuses ordered by order field"""
    statuses = db.query(models.Status).order_by(models.Status.order).all()
    return statuses

@app.post("/api/admin/statuses", response_model=schemas.StatusResponse)
def create_status(
    status: schemas.StatusCreate,
    password: Optional[str] = None,
    x_admin_password: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Create new status (admin only)"""
    verify_admin(password, x_admin_password)
    
    # Set order to end if not provided
    if status.order is None:
        max_order = db.query(models.Status).order_by(models.Status.order.desc()).first()
        status.order = (max_order.order + 1) if max_order else 0
    
    db_status = models.Status(**status.dict())
    db.add(db_status)
    db.commit()
    db.refresh(db_status)
    return db_status

@app.patch("/api/admin/statuses/{status_id}", response_model=schemas.StatusResponse)
def update_status(
    status_id: str,
    status: schemas.StatusUpdate,
    password: Optional[str] = None,
    x_admin_password: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Update status (admin only)"""
    verify_admin(password, x_admin_password)
    db_status = db.query(models.Status).filter(models.Status.id == status_id).first()
    if not db_status:
        raise HTTPException(status_code=404, detail="Status not found")
    
    for key, value in status.dict(exclude_unset=True).items():
        setattr(db_status, key, value)
    
    db.commit()
    db.refresh(db_status)
    return db_status

@app.delete("/api/admin/statuses/{status_id}")
def delete_status(
    status_id: str,
    password: Optional[str] = None,
    x_admin_password: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Delete status if no bugs use it (admin only)"""
    verify_admin(password, x_admin_password)
    db_status = db.query(models.Status).filter(models.Status.id == status_id).first()
    if not db_status:
        raise HTTPException(status_code=404, detail="Status not found")
    
    # Check if any bugs use this status
    bug_count = db.query(models.Bug).filter(models.Bug.status_id == status_id).count()
    if bug_count > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete status with {bug_count} existing bugs")
    
    db.delete(db_status)
    db.commit()
    return {"message": "Status deleted"}

@app.patch("/api/admin/statuses/reorder")
def reorder_statuses(
    orders: List[schemas.StatusOrder],
    password: Optional[str] = None,
    x_admin_password: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Reorder statuses (admin only)"""
    verify_admin(password, x_admin_password)
    
    for item in orders:
        db_status = db.query(models.Status).filter(models.Status.id == item.id).first()
        if db_status:
            db_status.order = item.order
    
    db.commit()
    return {"message": "Statuses reordered"}

# Bugs Endpoints
@app.get("/api/bugs", response_model=schemas.BugListResponse)
def get_bugs(
    skip: int = 0,
    limit: int = 20,
    status_id: Optional[str] = None,
    product_id: Optional[str] = None,
    severity: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    db: Session = Depends(get_db)
):
    """Get bugs with filtering and pagination"""
    query = db.query(models.Bug)
    
    # Apply filters
    if status_id:
        query = query.filter(models.Bug.status_id == status_id)
    if product_id:
        query = query.filter(models.Bug.product_id == product_id)
    if severity:
        query = query.filter(models.Bug.severity == severity)
    
    # Apply sorting
    sort_column = getattr(models.Bug, sort_by, models.Bug.created_at)
    if sort_order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())
    
    # Get total count for pagination
    total = query.count()
    
    # Apply pagination
    bugs = query.offset(skip).limit(limit).all()
    
    return {
        "bugs": bugs,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@app.get("/api/bugs/{bug_id}", response_model=schemas.BugDetailResponse)
def get_bug(bug_id: str, db: Session = Depends(get_db)):
    """Get single bug details"""
    bug = db.query(models.Bug).filter(models.Bug.id == bug_id).first()
    if not bug:
        raise HTTPException(status_code=404, detail="Bug not found")
    return bug

@app.post("/api/bugs", response_model=schemas.BugResponse)
async def create_bug(
    product_id: str = Form(...),
    summary: str = Form(...),
    description: str = Form(...),
    severity: str = Form(...),
    reporter_name: Optional[str] = Form(None),
    reporter_email: Optional[str] = Form(None),
    screenshots: List[UploadFile] = File(default=[]),
    db: Session = Depends(get_db)
):
    """Create new bug with optional screenshots"""
    # Validate severity
    if severity not in ["Low", "Medium", "High", "Critical"]:
        raise HTTPException(status_code=400, detail="Invalid severity")
    
    # Get default "OPEN" status (lowest order)
    default_status = db.query(models.Status).order_by(models.Status.order).first()
    if not default_status:
        raise HTTPException(status_code=500, detail="No statuses configured")
    
    # Create bug
    bug = models.Bug(
        product_id=product_id,
        summary=summary,
        description=description,
        severity=severity,
        status_id=default_status.id,
        reporter_name=reporter_name,
        reporter_email=reporter_email
    )
    db.add(bug)
    db.commit()
    db.refresh(bug)
    
    # Handle file uploads
    for screenshot in screenshots:
        if screenshot.filename:
            # Validate file type
            ext = Path(screenshot.filename).suffix.lower()
            if ext not in [".png", ".jpg", ".jpeg"]:
                continue
            
            # Validate file size (5MB max)
            contents = await screenshot.read()
            if len(contents) > 5 * 1024 * 1024:
                continue
            
            # Generate unique filename
            filename = f"{uuid.uuid4()}{ext}"
            bug_upload_dir = UPLOAD_DIR / str(bug.id)
            bug_upload_dir.mkdir(exist_ok=True)
            file_path = bug_upload_dir / filename
            
            # Save file
            with open(file_path, "wb") as f:
                f.write(contents)
            
            # Create screenshot record
            db_screenshot = models.Screenshot(
                bug_id=bug.id,
                filename=filename,
                original_filename=screenshot.filename,
                file_size=len(contents)
            )
            db.add(db_screenshot)
    
    db.commit()
    db.refresh(bug)
    return bug

@app.patch("/api/bugs/{bug_id}", response_model=schemas.BugResponse)
def update_bug(
    bug_id: str,
    bug_update: schemas.BugUpdate,
    password: Optional[str] = None,
    x_admin_password: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Update bug status/severity (admin only)"""
    verify_admin(password, x_admin_password)
    
    bug = db.query(models.Bug).filter(models.Bug.id == bug_id).first()
    if not bug:
        raise HTTPException(status_code=404, detail="Bug not found")
    
    for key, value in bug_update.dict(exclude_unset=True).items():
        setattr(bug, key, value)
    
    db.commit()
    db.refresh(bug)
    return bug

@app.delete("/api/bugs/{bug_id}")
def delete_bug(
    bug_id: str,
    password: Optional[str] = None,
    x_admin_password: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Delete bug and its screenshots (admin only)"""
    verify_admin(password, x_admin_password)
    
    bug = db.query(models.Bug).filter(models.Bug.id == bug_id).first()
    if not bug:
        raise HTTPException(status_code=404, detail="Bug not found")
    
    # Delete screenshot files
    bug_upload_dir = UPLOAD_DIR / str(bug.id)
    if bug_upload_dir.exists():
        shutil.rmtree(bug_upload_dir)
    
    db.delete(bug)
    db.commit()
    return {"message": "Bug deleted"}

@app.get("/api/bugs/{bug_id}/screenshots/{filename}")
def get_screenshot(bug_id: str, filename: str):
    """Serve screenshot file"""
    file_path = UPLOAD_DIR / bug_id / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Screenshot not found")
    
    from fastapi.responses import FileResponse
    return FileResponse(file_path)
