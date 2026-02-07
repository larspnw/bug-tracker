from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models

def seed_database():
    db = SessionLocal()
    try:
        # Seed statuses if none exist
        if db.query(models.Status).count() == 0:
            statuses = [
                models.Status(name="New", color="#3b82f6", order=0),
                models.Status(name="In Progress", color="#eab308", order=1),
                models.Status(name="Resolved", color="#22c55e", order=2),
                models.Status(name="Closed", color="#6b7280", order=3),
                models.Status(name="Won't Fix", color="#ef4444", order=4),
            ]
            for status in statuses:
                db.add(status)
            print("Seeded statuses")
        
        # Seed products if none exist
        if db.query(models.Product).count() == 0:
            products = [
                models.Product(name="Calorie Tracker", description="Track daily calories and macros", active=True),
                models.Product(name="Wheel app", description="Options wheel trading tracker", active=True),
                models.Product(name="Bug tracker", description="This bug tracking system", active=True),
            ]
            for product in products:
                db.add(product)
            print("Seeded products")
        
        db.commit()
        print("Database seeded successfully!")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
