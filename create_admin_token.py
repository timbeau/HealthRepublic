# create_admin_token.py

from getpass import getpass

from src.database import SessionLocal
from src.users.models import User
from src.auth.utils import hash_password, create_access_token


def main():
    db = SessionLocal()

    email = input("Admin email: ").strip()
    if not email:
        print("Email is required")
        return

    password = getpass("Admin password (will be set if user is new): ").strip()
    if not password:
        print("Password is required")
        return

    # Look for existing user
    user = db.query(User).filter(User.email == email).first()

    if not user:
        # Create a brand new admin user
        user = User(
            email=email,
            hashed_password=hash_password(password),
            full_name="Admin",
            role="admin",
            user_type="individual",  # adjust if your enum/logic differs
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"✅ Created new admin user with id={user.id}")
    else:
        # Ensure they are an admin and their password is set
        user.hashed_password = hash_password(password)
        user.role = "admin"
        if not user.user_type:
            user.user_type = "individual"
        db.commit()
        db.refresh(user)
        print(f"✅ Updated existing user {user.email} to admin")

    # Now create a JWT access token for this admin
    token = create_access_token(
        user.id,
        role=user.role,
        user_type=user.user_type,
    )

    print("\n=== Admin Bearer Token ===")
    print(token)
    print("\nUse it as:")
    print(f"Authorization: Bearer {token}")


if __name__ == "__main__":
    main()
