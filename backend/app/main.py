from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from app.core.database import engine, Base, get_db
from app.routers import auth, patients, dentists, services, appointments
from app.routers import prescriptions, allergies, payments, photos, chat
from app.routers import reviews, notifications, complaints, telegram
import traceback
import os
# Temporarily disabled - uncomment to enable notifications:
# from app.routers import notifications

app = FastAPI(title="OdontoHub API", version="1.0.0")

# Serve uploaded files (diplomas, photos, etc.)
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# CORS configuration - MUST be added before routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:3000",
        "https://odontohubapp.netlify.app",
        "https://odontohub.netlify.app",
        "https://odontohub-app.netlify.app",
        "https://statuesque-bonbon-133025.netlify.app",
        "https://gosmile.netlify.app",
        "https://odontohub-frontend.vercel.app",
    ],
    # Vercel generates a unique subdomain per preview deployment; allow them all.
    allow_origin_regex=r"https://odontohub-frontend.*\.vercel\.app",
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
    "http://127.0.0.1:3000",
    "https://odontohubapp.netlify.app",
    "https://odontohub.netlify.app",
    "https://odontohub-app.netlify.app",
    "https://statuesque-bonbon-133025.netlify.app",
    "https://gosmile.netlify.app",
    "https://odontohub-frontend.vercel.app",
]


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Return CORS headers even on 500 errors so the browser shows the real error."""
    origin = request.headers.get("origin", "")
    allow_origin = origin if origin in ALLOWED_ORIGINS else ""
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"},
        headers={
            "Access-Control-Allow-Origin": allow_origin,
            "Access-Control-Allow-Credentials": "true",
        },
    )

@app.on_event("startup")
def on_startup():
    """Create database tables on startup — safe for re-runs"""
    from sqlalchemy import text
    import os

    # Import all models to ensure they're registered with Base
    from app.models.user import User
    from app.models.patient import PatientProfile
    from app.models.dentist import DentistProfile
    from app.models.service import Service
    from app.models.appointment import Appointment
    from app.models.prescription import Prescription
    from app.models.allergy import Allergy
    from app.models.payment import Payment
    from app.models.photo import PatientPhoto
    from app.models.message import Message
    from app.models.review import Review
    from app.models.notification import Notification
    from app.models.complaint import Complaint

    # Register ALL remaining model modules so Base.metadata is complete
    # (medical_record, schedule, time_slot are not in the explicit list above).
    import importlib, pkgutil
    import app.models as _models_pkg
    for _m in pkgutil.iter_modules(_models_pkg.__path__):
        importlib.import_module(f"app.models.{_m.name}")

    db_url = str(engine.url)
    if "postgresql" in db_url or "postgres" in db_url:
        # Safely create enum types — won't fail if they already exist
        enum_types = [
            ("userrole", ["patient", "dentist"]),
            ("verificationstatus", ["pending", "approved", "rejected"]),
            ("appointment_status", ["pending", "confirmed", "in_progress", "moved", "cancelled", "completed"]),
            ("notificationtype", ["appointment_confirmed", "appointment_cancelled", "appointment_reminder", "payment_received", "review_received", "profile_approved", "profile_rejected", "system_message", "new_message"]),
        ]
        with engine.begin() as conn:
            for type_name, values in enum_types:
                values_sql = ", ".join(f"'{v}'" for v in values)
                conn.execute(text(
                    f"DO $$ BEGIN "
                    f"  CREATE TYPE {type_name} AS ENUM ({values_sql}); "
                    f"EXCEPTION WHEN duplicate_object THEN NULL; "
                    f"END $$;"
                ))

        # Add new_message to notificationtype enum if missing
        with engine.begin() as conn:
            conn.execute(text(
                "DO $$ BEGIN "
                "  ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'new_message'; "
                "EXCEPTION WHEN others THEN NULL; "
                "END $$;"
            ))

    # Migrate dentist profile fields if missing (before creating tables)
    try:
        from sqlalchemy import text, inspect
        inspector = inspect(engine)
        
        # Check if dentist_profiles table exists first
        if 'dentist_profiles' in inspector.get_table_names():
            existing_columns = [col['name'] for col in inspector.get_columns('dentist_profiles')]
            
            fields_to_add = []
            if 'birth_date' not in existing_columns:
                fields_to_add.append(('birth_date', 'TIMESTAMP'))
            if 'age' not in existing_columns:
                fields_to_add.append(('age', 'INTEGER'))
            if 'experience_years' not in existing_columns:
                fields_to_add.append(('experience_years', 'INTEGER'))
            if 'works_photos' not in existing_columns:
                fields_to_add.append(('works_photos', 'TEXT'))
            if 'latitude' not in existing_columns:
                fields_to_add.append(('latitude', 'DOUBLE PRECISION'))
            if 'longitude' not in existing_columns:
                fields_to_add.append(('longitude', 'DOUBLE PRECISION'))
            if 'created_at' not in existing_columns:
                fields_to_add.append(('created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'))
            if 'updated_at' not in existing_columns:
                fields_to_add.append(('updated_at', 'TIMESTAMP'))
            
            if fields_to_add:
                print(f"Adding missing dentist profile fields: {[f[0] for f in fields_to_add]}")
                with engine.begin() as conn:
                    for field_name, field_type in fields_to_add:
                        conn.execute(text(
                            f"ALTER TABLE dentist_profiles ADD COLUMN {field_name} {field_type}"
                        ))
                print("OK: Dentist profile fields migration completed")
            else:
                print("OK: All dentist profile fields already exist")

        # Add missing columns to appointments
        if 'appointments' in inspector.get_table_names():
            appt_cols = [col['name'] for col in inspector.get_columns('appointments')]
            appt_fields = []
            if 'actual_start_time' not in appt_cols:
                appt_fields.append(('actual_start_time', 'TIMESTAMP WITH TIME ZONE'))
            if 'visit_type' not in appt_cols:
                appt_fields.append(('visit_type', "VARCHAR DEFAULT 'primary'"))
            if 'diagnosis' not in appt_cols:
                appt_fields.append(('diagnosis', 'TEXT'))
            if 'treatment_notes' not in appt_cols:
                appt_fields.append(('treatment_notes', 'TEXT'))
            if 'price' not in appt_cols:
                appt_fields.append(('price', 'REAL'))
            if appt_fields:
                with engine.begin() as conn:
                    for field_name, field_type in appt_fields:
                        conn.execute(text(f"ALTER TABLE appointments ADD COLUMN {field_name} {field_type}"))
                print(f"OK: appointments migration — added {[f[0] for f in appt_fields]}")

        # Fix complaints.patient_id — make it nullable if not already
        if 'complaints' in inspector.get_table_names():
            complaint_cols = {c['name']: c for c in inspector.get_columns('complaints')}
            if 'patient_id' in complaint_cols and not complaint_cols['patient_id']['nullable']:
                with engine.begin() as conn:
                    conn.execute(text("ALTER TABLE complaints ALTER COLUMN patient_id DROP NOT NULL"))
                print("OK: complaints.patient_id is now nullable")

        if 'users' in inspector.get_table_names():
            user_cols = [col['name'] for col in inspector.get_columns('users')]
            if 'backup_phone' not in user_cols:
                with engine.begin() as conn:
                    conn.execute(text("ALTER TABLE users ADD COLUMN backup_phone VARCHAR"))
                print("OK: users migration - added backup_phone")

    except Exception as e:
        print(f"Warning: Could not migrate dentist fields: {e}")
        # Don't fail startup if migration fails

    # --- Generic schema auto-migration -------------------------------------
    # Supersedes the hand-maintained ALTER blocks above: on every boot, any
    # column declared on a model but missing from its (already-existing) table
    # is added automatically. This is the structural fix for the recurring
    # "column ... does not exist" drift. Conservative by design:
    #   * ADD COLUMN only — never drops or retypes anything
    #   * a NOT NULL column with no server_default is added as NULLable, so
    #     existing rows are not rejected (the ORM still applies Python-side
    #     defaults for new rows)
    #   * brand-new tables are left to create_all() below
    try:
        from sqlalchemy import inspect as _inspect, text as _text
        from sqlalchemy.schema import CreateColumn
        _insp = _inspect(engine)
        _db_tables = set(_insp.get_table_names())
        _is_pg = "postgresql" in db_url or "postgres" in db_url
        for _tname, _table in Base.metadata.tables.items():
            if _tname not in _db_tables:
                continue  # whole table missing → create_all() handles it
            _existing = {c["name"] for c in _insp.get_columns(_tname)}
            for _col in _table.columns:
                if _col.primary_key or _col.name in _existing:
                    continue
                _ddl = str(CreateColumn(_col).compile(dialect=engine.dialect)).strip()
                if not _col.nullable and _col.server_default is None:
                    _ddl = _ddl.replace(" NOT NULL", "")
                _add = "ADD COLUMN IF NOT EXISTS" if _is_pg else "ADD COLUMN"
                with engine.begin() as _conn:
                    _conn.execute(_text(f"ALTER TABLE {_tname} {_add} {_ddl}"))
                print(f"OK: auto-migrate added {_tname}.{_col.name} -> {_ddl}")
    except Exception as e:
        print(f"Warning: generic schema auto-migration failed: {e}")
        # Never fail startup on migration issues

    # Create all tables (checkfirst=True skips existing tables)
    Base.metadata.create_all(bind=engine, checkfirst=True)


# Include routers
app.include_router(telegram.router, prefix="/api", tags=["Telegram"])
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(patients.router, tags=["Patients"])
app.include_router(dentists.router, tags=["Dentists"])
app.include_router(services.router, tags=["Services"])
app.include_router(appointments.router, tags=["Appointments"])
app.include_router(chat.router, prefix="/api", tags=["Chat"])
app.include_router(notifications.router, tags=["Notifications"])  # Включили уведомления
app.include_router(prescriptions.router, prefix="/api", tags=["Prescriptions"])
app.include_router(allergies.router, prefix="/api", tags=["Allergies"])
app.include_router(payments.router, prefix="/api", tags=["Payments"])
app.include_router(photos.router, prefix="/api", tags=["Photos"])
app.include_router(reviews.router, tags=["Reviews"])
app.include_router(complaints.router, tags=["Complaints"])

@app.get("/")
def read_root():
    return {"message": "Welcome to OdontoHub API"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/migrate-dentist-fields")
def migrate_dentist_fields():
    """
    One-time migration endpoint to add missing dentist profile fields.
    Safe to call multiple times - checks if columns exist before adding.
    """
    from sqlalchemy import text, inspect

    try:
        inspector = inspect(engine)
        existing_columns = [col['name'] for col in inspector.get_columns('dentist_profiles')]

        fields_to_add = []
        if 'birth_date' not in existing_columns:
            fields_to_add.append(('birth_date', 'TIMESTAMP'))
        if 'age' not in existing_columns:
            fields_to_add.append(('age', 'INTEGER'))
        if 'experience_years' not in existing_columns:
            fields_to_add.append(('experience_years', 'INTEGER'))
        if 'works_photos' not in existing_columns:
            fields_to_add.append(('works_photos', 'TEXT'))
        if 'latitude' not in existing_columns:
            fields_to_add.append(('latitude', 'DOUBLE PRECISION'))
        if 'longitude' not in existing_columns:
            fields_to_add.append(('longitude', 'DOUBLE PRECISION'))

        if not fields_to_add:
            return {
                "status": "success",
                "message": "All fields already exist",
                "existing_fields": ["birth_date", "age", "experience_years", "works_photos", "latitude", "longitude"]
            }

        with engine.begin() as conn:
            for field_name, field_type in fields_to_add:
                conn.execute(text(
                    f"ALTER TABLE dentist_profiles ADD COLUMN {field_name} {field_type}"
                ))

        return {
            "status": "success",
            "message": "Migration completed successfully!",
            "added_fields": [f[0] for f in fields_to_add]
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            "status": "error",
            "message": f"Migration failed: {str(e)}"
        }


@app.get("/debug-db")
def debug_db():
    """Debug endpoint: shows DB connection info and existing tables."""
    from sqlalchemy import text
    import os
    raw_url = os.getenv("DATABASE_URL", "NOT SET")
    engine_url = str(engine.url)

    # Mask password for safety
    def mask(url):
        import re
        return re.sub(r'://([^:@]+):([^@]+)@', r'://\1:****@', url)

    try:
        with engine.connect() as conn:
            if "postgresql" in engine_url or "postgres" in engine_url:
                result = conn.execute(text(
                    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
                ))
                tables = [row[0] for row in result]
            else:
                result = conn.execute(text(
                    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
                ))
                tables = [row[0] for row in result]
        return {
            "db_type": "postgresql" if "postgresql" in engine_url or "postgres" in engine_url else "sqlite",
            "engine_url_masked": mask(engine_url),
            "env_DATABASE_URL_set": raw_url != "NOT SET",
            "tables_in_db": tables,
        }
    except Exception as e:
        return {"error": str(e), "engine_url_masked": mask(engine_url)}


@app.get("/init-db")
def init_database():
    """
    Initialize database tables - safe to call multiple times.
    Creates enum types first, then tables.
    """
    from sqlalchemy import text
    try:
        # Import all models to ensure they're registered
        from app.models.user import User
        from app.models.patient import PatientProfile
        from app.models.dentist import DentistProfile
        from app.models.service import Service
        from app.models.appointment import Appointment
        from app.models.prescription import Prescription
        from app.models.allergy import Allergy
        from app.models.payment import Payment
        from app.models.photo import PatientPhoto
        from app.models.message import Message
        from app.models.notification import Notification
        from app.models.complaint import Complaint

        db_url = str(engine.url)
        if "postgresql" in db_url or "postgres" in db_url:
            # Step 1: Create enum types safely (skip if already exist)
            enum_types = [
                ("userrole", ["patient", "dentist"]),
                ("verificationstatus", ["pending", "approved", "rejected"]),
                ("appointment_status", ["pending", "confirmed", "in_progress", "moved", "cancelled", "completed"]),
            ]
            with engine.begin() as conn:
                for type_name, values in enum_types:
                    values_sql = ", ".join(f"'{v}'" for v in values)
                    conn.execute(text(
                        f"DO $$ BEGIN "
                        f"  CREATE TYPE {type_name} AS ENUM ({values_sql}); "
                        f"EXCEPTION WHEN duplicate_object THEN NULL; "
                        f"END $$;"
                    ))

        # Step 2: Create all tables (skip existing ones)
        Base.metadata.create_all(bind=engine, checkfirst=True)

        return {
            "status": "success",
            "message": "Database tables created successfully!",
            "tables": [
                "users", "patient_profiles", "dentist_profiles",
                "services", "appointments", "prescriptions",
                "allergies", "payments", "patient_photos", "complaints"
            ]
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to create tables: {str(e)}"
        }


@app.get("/dentists/list")
async def get_all_dentists(db: Session = Depends(get_db)):
    """
    Get list of all dentists with user information
    Returns all dentist profiles from database with email and phone from user table
    """
    from app.models.dentist import DentistProfile
    from app.models.user import User
    from sqlalchemy.orm import joinedload
    
    try:
        # Query dentists with their user information
        dentists = db.query(DentistProfile).options(joinedload(DentistProfile.user)).all()

        dentists_list = []
        for dentist in dentists:
            # Get user info
            user = dentist.user
            
            dentist_dict = {
                "id": dentist.id,
                "user_id": dentist.user_id,
                "full_name": dentist.full_name,
                "phone": user.phone if user else None,
                "email": user.email if user else None,
                "specialization": dentist.specialization,
                "clinic": dentist.clinic,
                "address": dentist.address,
                "birth_date": dentist.birth_date.isoformat() if dentist.birth_date else None,
                "age": dentist.age,
                "experience_years": dentist.experience_years,
                "schedule": dentist.schedule,
                "work_hours": dentist.work_hours,
                "telegram": dentist.telegram,
                "instagram": dentist.instagram,
                "whatsapp": dentist.whatsapp,
                "works_photos": dentist.works_photos,
                "latitude": dentist.latitude,
                "longitude": dentist.longitude,
                "pinfl": dentist.pinfl,
                "diploma_number": dentist.diploma_number,
                "verification_status": dentist.verification_status.value,
                "created_at": dentist.created_at.isoformat() if hasattr(dentist, 'created_at') and dentist.created_at else None,
                "updated_at": dentist.updated_at.isoformat() if hasattr(dentist, 'updated_at') and dentist.updated_at else None
            }
            dentists_list.append(dentist_dict)

        return dentists_list

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching dentists: {str(e)}")


@app.delete("/dentists/{dentist_id}")
async def delete_dentist(dentist_id: int, db: Session = Depends(get_db)):
    """
    Delete a dentist by ID
    This will delete both the dentist profile and associated user account
    """
    from app.models.dentist import DentistProfile
    from app.models.user import User
    
    try:
        # Find the dentist profile
        dentist_profile = db.query(DentistProfile).filter(DentistProfile.id == dentist_id).first()
        
        if not dentist_profile:
            raise HTTPException(status_code=404, detail="Dentist not found")
        
        # Get the associated user
        user = db.query(User).filter(User.id == dentist_profile.user_id).first()
        
        # Store dentist info for response
        dentist_info = {
            "id": dentist_profile.id,
            "full_name": dentist_profile.full_name,
            "user_id": dentist_profile.user_id
        }
        
        # Delete the dentist profile first (due to foreign key constraints)
        db.delete(dentist_profile)
        
        # Delete the associated user account if it exists
        if user:
            db.delete(user)
        
        # Commit the transaction
        db.commit()
        
        return {
            "success": True,
            "message": f"Dentist '{dentist_info['full_name']}' deleted successfully",
            "deleted_dentist": dentist_info
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Rollback in case of error
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting dentist: {str(e)}")


@app.put("/dentists/{dentist_id}/status")
async def update_dentist_status(
    dentist_id: int, 
    status_data: dict,
    db: Session = Depends(get_db)
):
    """
    Update dentist verification status (block/unblock)
    Body: {"verification_status": "approved" | "pending" | "rejected"}
    """
    from app.models.dentist import DentistProfile, VerificationStatus
    
    try:
        # Find the dentist profile
        dentist_profile = db.query(DentistProfile).filter(DentistProfile.id == dentist_id).first()
        
        if not dentist_profile:
            raise HTTPException(status_code=404, detail="Dentist not found")
        
        # Validate status
        new_status = status_data.get("verification_status")
        if new_status not in ["approved", "pending", "rejected"]:
            raise HTTPException(status_code=400, detail="Invalid verification status")
        
        # Update status
        dentist_profile.verification_status = VerificationStatus(new_status)
        db.commit()
        db.refresh(dentist_profile)
        
        return {
            "success": True,
            "message": f"Dentist status updated to {new_status}",
            "dentist": {
                "id": dentist_profile.id,
                "full_name": dentist_profile.full_name,
                "verification_status": dentist_profile.verification_status.value
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating dentist status: {str(e)}")

