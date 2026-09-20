"""
Seed demo data. Run from repo root:

    cd backend
    python -m pip install -r requirements.txt
    python ../database/seed.py

Creates tables, a demo admin, menu, gallery, artist, and sample feedback.
"""

from __future__ import annotations

import sys
from datetime import date, datetime, timedelta
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from database import Base, SessionLocal, engine  # noqa: E402
from models import (  # noqa: E402
    Admin,
    ArtistOfMonth,
    Customer,
    Feedback,
    GalleryImage,
    MenuItem,
    Offer,
)
from auth import hash_password  # noqa: E402
from config import get_settings  # noqa: E402

MENU = [
    {
        "name": "Minimalist (Classic Salted)",
        "description": "Crisp, golden fries finished simply with a delicate touch of sea salt — clean, classic and comforting.",
        "category": "food",
        "price": 119,
        "image_url": "",
        "sort_order": 1,
    },
    {
        "name": "Ochre Dust (Peri-Peri Fries)",
        "description": "Golden crispy fries generously coated with our vibrant peri-peri seasoning, delivering the perfect balance of heat, spice and tang.",
        "category": "food",
        "price": 139,
        "image_url": "",
        "sort_order": 2,
    },
    {
        "name": "Molten Cheese Fries",
        "description": "Crisp golden fries generously coated with warm jalapeño cheese sauce and finished with artistically drizzled smooth garlic aioli.",
        "category": "food",
        "price": 179,
        "image_url": "",
        "sort_order": 3,
    },
    {
        "name": "The Ivory Silk (White Sauce Pasta)",
        "description": "Creamy white sauce, herbs, vegetables & parmesan-style finish.",
        "category": "food",
        "price": 189,
        "image_url": "",
        "sort_order": 4,
    },
    {
        "name": "The Crimson Toss (Red Sauce Pasta)",
        "description": "Rich tomato sauce, Italian herbs, vegetables & a touch of chili.",
        "category": "food",
        "price": 179,
        "image_url": "",
        "sort_order": 5,
    },
    {
        "name": "The Signature Canvas",
        "description": "Our house special creamy-tangy sauce, sautéed vegetables, herbs & signature seasoning. Add on chicken: ₹70.",
        "category": "food",
        "price": 199,
        "image_url": "",
        "sort_order": 6,
    },
    {
        "name": "The Forest Floor",
        "description": "A crispy deep-fried herb vegetable patty layered with earthy butter-sautéed mushrooms, smoky chipotle mayo and fresh garden vegetables, served in a soft toasted bun.",
        "category": "food",
        "price": 189,
        "image_url": "",
        "sort_order": 7,
    },
    {
        "name": "The Smoked Paneer Stack",
        "description": "A thick seared tandoori paneer slab stacked with crispy baby corn, smoky BBQ sauce, creamy tandoori mayo and fresh garden vegetables.",
        "category": "food",
        "price": 199,
        "image_url": "",
        "sort_order": 8,
    },
    {
        "name": "The Chicken & Egg Press",
        "description": "A hearty combination of seasoned shredded chicken, sliced boiled egg, creamy mayo and melted cheese, grilled until golden and crisp inside toasted bread.",
        "category": "food",
        "price": 199,
        "image_url": "",
        "sort_order": 9,
    },
    {
        "name": "The Meadow Melt",
        "description": "Sweet corn tossed in mild peri-peri seasoning with a generous layer of melted mozzarella, grilled inside crisp country bread for a warm, comforting cheese pull.",
        "category": "food",
        "price": 179,
        "image_url": "",
        "sort_order": 10,
    },
    {
        "name": "The Chipotle Veg Press",
        "description": "A smoky chipotle spread layered with fresh garden vegetables and melted cheese, pressed hot inside bread for a crisp, savoury finish.",
        "category": "food",
        "price": 179,
        "image_url": "",
        "sort_order": 11,
    },
    {
        "name": "Garlic Cheese Bread",
        "description": "Toasted garlic bread generously topped with melted mozzarella, aromatic herbs and a buttery garlic finish — crisp on the edges and soft inside.",
        "category": "food",
        "price": 149,
        "image_url": "",
        "sort_order": 12,
    },
    {
        "name": "Charcoal Velvet (Classic Cold Coffee)",
        "description": "A timeless café favourite made with rich coffee, chilled creamy milk and a smooth vanilla finish, blended thick and indulgent.",
        "category": "beverages",
        "price": 169,
        "image_url": "",
        "sort_order": 13,
    },
    {
        "name": "Hazelnut Hue (Hazelnut Cold Coffee)",
        "description": "Our creamy cold coffee infused with the warm, roasted sweetness of premium hazelnut, creating a smooth and nutty finish.",
        "category": "beverages",
        "price": 179,
        "image_url": "",
        "sort_order": 14,
    },
    {
        "name": "Liquid Amber (Salted Caramel Cold Coffee)",
        "description": "A rich and creamy cold coffee blended with buttery caramel and a delicate touch of salt for the perfect sweet-and-savoury balance.",
        "category": "beverages",
        "price": 169,
        "image_url": "",
        "sort_order": 15,
    },
    {
        "name": "Monochromatic Mocha (Chocolate Cold Coffee)",
        "description": "A decadent blend of bold coffee and rich dark chocolate, chilled into a smooth, creamy mocha with an indulgent chocolate finish.",
        "category": "beverages",
        "price": 189,
        "image_url": "",
        "sort_order": 16,
    },
    {
        "name": "Classic Hot Coffee",
        "description": "Freshly brewed hot coffee blended with smooth, creamy milk for a comforting everyday cup.",
        "category": "beverages",
        "price": 89,
        "image_url": "",
        "sort_order": 17,
    },
    {
        "name": "Hazelnut Coffee",
        "description": "Smooth hot coffee infused with the warm, roasted sweetness of hazelnut for a rich and aromatic finish.",
        "category": "beverages",
        "price": 99,
        "image_url": "",
        "sort_order": 18,
    },
    {
        "name": "Irish Coffee",
        "description": "Creamy hot coffee infused with smooth Irish liqueur flavour, creating a warm, aromatic and indulgent café favourite.",
        "category": "beverages",
        "price": 99,
        "image_url": "",
        "sort_order": 19,
    },
    {
        "name": "The Crimson",
        "description": "A refreshing combination of crisp tender coconut water and tart cranberry, finished with delicate soda pearls for a naturally vibrant experience.",
        "category": "beverages",
        "price": 149,
        "image_url": "",
        "sort_order": 20,
    },
    {
        "name": "The Emerald",
        "description": "A refreshing blend of crisp apple and bright citrus flavours, finished with sparkling soda for a light, fizzy and refreshing drink.",
        "category": "beverages",
        "price": 139,
        "image_url": "",
        "sort_order": 21,
    },
    {
        "name": "The Velvet Guava",
        "description": "Sweet pink guava blended with refreshing mint and a subtle touch of spice, finished with sparkling soda for a smooth yet refreshing sip.",
        "category": "beverages",
        "price": 139,
        "image_url": "",
        "sort_order": 22,
    },
    {
        "name": "The Amber Solstice",
        "description": "A glowing amber canvas featuring sun-ripened orange juice balanced beautifully against the sophisticated, bittersweet bite of premium tonic water and sweet peach undertones.",
        "category": "beverages",
        "price": 139,
        "image_url": "",
        "sort_order": 23,
    },
    {
        "name": "The Studio Canvas Kit",
        "description": "Your personal mini art experience, featuring a premium mini canvas, curated 6-colour acrylic palette, professional brushes, artist apron and protective table mat.",
        "category": "art",
        "price": 299,
        "image_url": "",
        "sort_order": 24,
    },
    {
        "name": "The Clay Studio Experience",
        "description": "150 g premium clay, choice of acrylic colour, some sculpting tools.",
        "category": "art",
        "price": 299,
        "image_url": "",
        "sort_order": 25,
    },
    {
        "name": "The Gallery Lounge",
        "description": "The perfect creative escape — includes 1 art kit, your choice of any Palette Fries and 1 refreshing Botanical Tint.",
        "category": "art",
        "price": 549,
        "image_url": "",
        "sort_order": 26,
    },
    {
        "name": "The Masterpiece Collection",
        "description": "Our signature creative experience — includes 1 art kit, your choice of any Signature Burger and 1 refreshing Botanical Tint.",
        "category": "art",
        "price": 599,
        "image_url": "",
        "sort_order": 27,
    },
]

GALLERY = [
    {
        "title": "Morning light",
        "image_url": "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200&q=80",
        "caption": "The east wall at 8am",
        "sort_order": 1,
    },
    {
        "title": "Bar still life",
        "image_url": "https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=1200&q=80",
        "caption": "Copper and ceramic",
        "sort_order": 2,
    },
    {
        "title": "Reading alcove",
        "image_url": "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=1200&q=80",
        "caption": "Where sketches happen",
        "sort_order": 3,
    },
    {
        "title": "Night gallery",
        "image_url": "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&q=80",
        "caption": "Lamps after last pour",
        "sort_order": 4,
    },
    {
        "title": "Workshop table",
        "image_url": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=80",
        "caption": "Sunday life drawing",
        "sort_order": 5,
    },
    {
        "title": "Pastry case",
        "image_url": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&q=80",
        "caption": "Honey and rye",
        "sort_order": 6,
    },
    {
        "title": "Courtyard",
        "image_url": "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=1200&q=80",
        "caption": "Ferns and terracotta",
        "sort_order": 7,
    },
    {
        "title": "Ink bar",
        "image_url": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=80",
        "caption": "Pour-over ritual",
        "sort_order": 8,
    },
]


def attach_uploaded_menu_images(db):
    upload_dir = BACKEND_DIR / "uploads"
    if not upload_dir.exists():
        return

    known_map = {
        "Minimalist (Classic Salted)": "b486ae2732e4423f9e6bb2afe6ceaf2e.jpg",
        "Ochre Dust (Peri-Peri Fries)": "9b469d2a0a9f4b6daab4e5a7d9b5b807.jpg",
        "Molten Cheese Fries": "c371662b8b614b349a475203351d24f0.jpg",
        "The Ivory Silk (White Sauce Pasta)": "917f1068d603401192c90baa63114101.jpg",
        "The Crimson Toss (Red Sauce Pasta)": "917f1068d603401192c90baa63114101.jpg",
        "The Signature Canvas": "9b469d2a0a9f4b6daab4e5a7d9b5b807.jpg",
        "The Forest Floor": "7658895f025c4bbba083445079ad55df.jpg",
        "The Smoked Paneer Stack": "7658895f025c4bbba083445079ad55df.jpg",
        "The Chicken & Egg Press": "5ab013bf0cfb47aebba956a058fc2a43.jpg",
        "The Meadow Melt": "5ab013bf0cfb47aebba956a058fc2a43.jpg",
        "The Chipotle Veg Press": "5ab013bf0cfb47aebba956a058fc2a43.jpg",
        "Garlic Cheese Bread": "c371662b8b614b349a475203351d24f0.jpg",
        "Charcoal Velvet (Classic Cold Coffee)": "7243f6b17a1b41b1925576d6a72d9809.jpg",
        "Hazelnut Hue (Hazelnut Cold Coffee)": "7243f6b17a1b41b1925576d6a72d9809.jpg",
        "Liquid Amber (Salted Caramel Cold Coffee)": "39764b989c8f4b5387bec5974bf5b6b7.jpg",
        "Monochromatic Mocha (Chocolate Cold Coffee)": "7e530bd9d2b6404b96f8982e6fe95f79.jpg",
        "Classic Hot Coffee": "5ab013bf0cfb47aebba956a058fc2a43.jpg",
        "Hazelnut Coffee": "7243f6b17a1b41b1925576d6a72d9809.jpg",
        "Irish Coffee": "5ab013bf0cfb47aebba956a058fc2a43.jpg",
        "The Crimson": "12a8d0578761490abeb6b5953709729a.jpg",
        "The Emerald": "12a8d0578761490abeb6b5953709729a.jpg",
        "The Velvet Guava": "12a8d0578761490abeb6b5953709729a.jpg",
        "The Amber Solstice": "12a8d0578761490abeb6b5953709729a.jpg",
        "The Studio Canvas Kit": "42186b2894c34679adeaf3db642ceeea.webp",
        "The Clay Studio Experience": "42186b2894c34679adeaf3db642ceeea.webp",
        "The Gallery Lounge": "42186b2894c34679adeaf3db642ceeea.webp",
        "The Masterpiece Collection": "42186b2894c34679adeaf3db642ceeea.webp",
    }

    menu_items = db.query(MenuItem).order_by(MenuItem.sort_order, MenuItem.id).all()
    for item in menu_items:
        item.image_url = f"/api/uploads/{known_map.get(item.name, 'cafe-hero.webp')}"
        if not (upload_dir / known_map.get(item.name, 'cafe-hero.webp')).exists():
            item.image_url = "/assets/cafe-hero.webp"

    # keep a safe fallback for any extra uploads that do not have a manual visual match
    extra_files = sorted(
        (
            p
            for p in upload_dir.iterdir()
            if p.is_file() and p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp", ".gif"}
        ),
        key=lambda p: p.stat().st_mtime,
    )
    for item in menu_items:
        if item.image_url == "/assets/cafe-hero.webp" and extra_files:
            item.image_url = f"/api/uploads/{extra_files[len(menu_items) % len(extra_files)].name}"


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    settings = get_settings()
    try:
        admin = db.query(Admin).filter(Admin.email == settings.admin_email.lower()).first()
        if not admin:
            db.add(
                Admin(
                    email=settings.admin_email.lower(),
                    hashed_password=hash_password(settings.admin_password),
                )
            )
        else:
            admin.hashed_password = hash_password(settings.admin_password)

        existing_menu = db.query(MenuItem).all()
        for item in existing_menu:
            db.delete(item)

        for item in MENU:
            db.add(MenuItem(**item, is_available=True))

        attach_uploaded_menu_images(db)

        if db.query(GalleryImage).count() == 0:
            for img in GALLERY:
                db.add(GalleryImage(**img))

        if db.query(ArtistOfMonth).count() == 0:
            db.add(
                ArtistOfMonth(
                    name="Meera Kulkarni",
                    medium="Ink & handmade paper",
                    bio=(
                        "Meera draws the city's quiet corners — bus stops at dusk, "
                        "steam from roadside chai, the geometry of drying laundry. "
                        "This month her works hang above the cortado bar."
                    ),
                    image_url="https://images.unsplash.com/photo-1460661411761-2e2729505be0?w=1200&q=80",
                    month_label="August",
                    is_current=True,
                )
            )

        demo_phone = "+919876543210"
        demo = db.query(Customer).filter(Customer.phone == demo_phone).first()
        if not demo:
            demo = Customer(
                name="Asha Rao",
                phone=demo_phone,
                date_of_birth=date.today().replace(year=date.today().year - 28),
                newsletter_opt_in=True,
            )
            db.add(demo)
            db.flush()

        if db.query(Feedback).count() == 0:
            samples = [
                ("Kabir", 5, "The saffron latte tastes like a sunset. I sketched for two hours."),
                ("Leela", 5, "Night mode lighting in the courtyard is a poem."),
                ("Dev", 4, "Wish the rye tart came in a larger slice. Still perfect."),
                ("Noor", 5, "Staff treated my notebook like it belonged here. It does."),
            ]
            for i, (name, rating, comment) in enumerate(samples):
                db.add(
                    Feedback(
                        guest_name=name,
                        rating=rating,
                        comment=comment,
                        created_at=datetime.utcnow() - timedelta(days=3 - min(i, 3)),
                    )
                )

        if db.query(Offer).count() == 0:
            db.add(
                Offer(
                    title="Rainy Tuesday pour-overs",
                    description="Any V60 is 15% off after 4pm when the sky cooperates.",
                    discount="15% off pour-over",
                    status="draft",
                )
            )

        db.commit()
        print("Seed complete.")
        print(f"  Admin: {settings.admin_email} / {settings.admin_password}")
        print(f"  Demo customer phone: {demo_phone}")
        print("  SQLite file: backend/database/fourth_place.db")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
