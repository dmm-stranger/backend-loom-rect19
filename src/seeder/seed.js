import dotenv from "dotenv";
dotenv.config();

import connectDB from "../config/db.js";
import User from "../models/User.model.js";
import Category from "../models/Category.model.js";
import Product from "../models/Product.model.js";

// ─────────────────────────────────────────────
//  USERS
// ─────────────────────────────────────────────
const users = [
  {
    name: process.env.ADMIN_NAME || "Admin User",
    email: process.env.ADMIN_EMAIL || "[email protected]",
    password: process.env.ADMIN_PASSWORD || "Admin@12345",
    role: "admin",
  },
  {
    name: "Demo Customer",
    email: "[email protected]",
    password: "Customer@123",
    role: "customer",
  },
];

// ─────────────────────────────────────────────
//  CATEGORIES
// ─────────────────────────────────────────────
const categories = [
  { name: "Laptops",     image: { url: "https://placehold.co/400x300?text=Laptops",     public_id: "seed_cat_laptops" } },
  { name: "Smartphones", image: { url: "https://placehold.co/400x300?text=Smartphones", public_id: "seed_cat_smartphones" } },
  { name: "Monitors",    image: { url: "https://placehold.co/400x300?text=Monitors",    public_id: "seed_cat_monitors" } },
  { name: "Audio",       image: { url: "https://placehold.co/400x300?text=Audio",       public_id: "seed_cat_audio" } },
  { name: "Accessories", image: { url: "https://placehold.co/400x300?text=Accessories", public_id: "seed_cat_accessories" } },
  { name: "Gaming",      image: { url: "https://placehold.co/400x300?text=Gaming",      public_id: "seed_cat_gaming" } },
];

// ─────────────────────────────────────────────
//  PRODUCTS
// ─────────────────────────────────────────────
const buildProducts = (categoryMap) => [
  // ── LAPTOPS
  {
    name: "Apple MacBook Pro 14-inch M3",
    description: "The MacBook Pro 14-inch with M3 chip delivers exceptional performance for professionals. Features a stunning Liquid Retina XDR display, up to 22 hours of battery life, and the power to handle demanding workloads with ease.",
    brand: "Apple",
    category: categoryMap["Laptops"],
    price: 1999.99,
    discountPrice: 1849.99,
    stock: 25,
    isFeatured: true,
    images: [
      { url: "https://placehold.co/800x600?text=MacBook+Pro+Front", public_id: "seed_mbp_1" },
      { url: "https://placehold.co/800x600?text=MacBook+Pro+Side",  public_id: "seed_mbp_2" },
    ],
    specs: new Map([["Processor","Apple M3 (8-core CPU, 10-core GPU)"],["RAM","18GB Unified Memory"],["Storage","512GB SSD"],["Display","14.2-inch Liquid Retina XDR, 3024x1964"],["Battery","Up to 22 hours"],["OS","macOS Sonoma"],["Weight","1.55 kg"]]),
  },
  {
    name: "Dell XPS 15 OLED",
    description: "The Dell XPS 15 combines InfinityEdge OLED display with Intel Core i9 power in a premium aluminium chassis. Ideal for creative professionals who need colour-accurate visuals and desktop-class performance on the go.",
    brand: "Dell",
    category: categoryMap["Laptops"],
    price: 2299.99,
    discountPrice: 0,
    stock: 18,
    isFeatured: false,
    images: [
      { url: "https://placehold.co/800x600?text=Dell+XPS+15+Front", public_id: "seed_xps_1" },
      { url: "https://placehold.co/800x600?text=Dell+XPS+15+Open",  public_id: "seed_xps_2" },
    ],
    specs: new Map([["Processor","Intel Core i9-13900H"],["RAM","32GB DDR5"],["Storage","1TB NVMe SSD"],["Display","15.6-inch OLED 3.5K, 60Hz"],["GPU","NVIDIA RTX 4070 8GB"],["Battery","Up to 13 hours"],["OS","Windows 11 Pro"]]),
  },
  // ── SMARTPHONES
  {
    name: "iPhone 15 Pro Max",
    description: "iPhone 15 Pro Max features a titanium design with the powerful A17 Pro chip, a 48MP main camera with 5x optical zoom, and the new Action button for instant access to your favourite feature.",
    brand: "Apple",
    category: categoryMap["Smartphones"],
    price: 1199.99,
    discountPrice: 1099.99,
    stock: 60,
    isFeatured: true,
    images: [
      { url: "https://placehold.co/800x600?text=iPhone+15+Pro+Max+Front", public_id: "seed_iphone_1" },
      { url: "https://placehold.co/800x600?text=iPhone+15+Pro+Max+Back",  public_id: "seed_iphone_2" },
    ],
    specs: new Map([["Processor","Apple A17 Pro (6-core)"],["RAM","8GB"],["Storage","256GB"],["Display","6.7-inch Super Retina XDR, 2796x1290, 120Hz"],["Camera","48MP main + 12MP ultrawide + 12MP 5x telephoto"],["Battery","4422 mAh"],["OS","iOS 17"]]),
  },
  {
    name: "Samsung Galaxy S24 Ultra",
    description: "The Galaxy S24 Ultra integrates the S Pen natively, packing a 200MP camera, Snapdragon 8 Gen 3 processor, and a 5000mAh battery into a sleek titanium frame built for power users.",
    brand: "Samsung",
    category: categoryMap["Smartphones"],
    price: 1299.99,
    discountPrice: 1199.99,
    stock: 45,
    isFeatured: false,
    images: [
      { url: "https://placehold.co/800x600?text=Galaxy+S24+Ultra+Front", public_id: "seed_s24_1" },
      { url: "https://placehold.co/800x600?text=Galaxy+S24+Ultra+Back",  public_id: "seed_s24_2" },
    ],
    specs: new Map([["Processor","Snapdragon 8 Gen 3"],["RAM","12GB"],["Storage","256GB"],["Display","6.8-inch Dynamic AMOLED 2X, 3088x1440, 120Hz"],["Camera","200MP main + 12MP ultrawide + 50MP 5x telephoto"],["Battery","5000 mAh"],["OS","Android 14 / One UI 6.1"]]),
  },
  // ── MONITORS
  {
    name: "LG UltraWide 34WP85C-B",
    description: "This 34-inch curved UltraWide QHD monitor delivers immersive visuals with HDR10 support and USB-C 96W Power Delivery. Perfect for multitasking professionals and creative workflows.",
    brand: "LG",
    category: categoryMap["Monitors"],
    price: 799.99,
    discountPrice: 699.99,
    stock: 30,
    isFeatured: false,
    images: [
      { url: "https://placehold.co/800x600?text=LG+UltraWide+Front", public_id: "seed_lg_1" },
      { url: "https://placehold.co/800x600?text=LG+UltraWide+Side",  public_id: "seed_lg_2" },
    ],
    specs: new Map([["Size","34 inches"],["Resolution","3440x1440 (UWQHD)"],["Panel","IPS, Curved 1800R"],["Refresh Rate","160Hz"],["HDR","HDR10"],["Ports","USB-C 96W, HDMI 2.0 x2, DisplayPort 1.4"],["Response","1ms GtG"]]),
  },
  {
    name: "Samsung Odyssey G7 32-inch",
    description: "The Odyssey G7 gaming monitor features a 240Hz refresh rate, 1ms response time, and 1000R curved VA panel with QLED technology for vibrant colours and deep blacks in every game.",
    brand: "Samsung",
    category: categoryMap["Monitors"],
    price: 649.99,
    discountPrice: 549.99,
    stock: 22,
    isFeatured: false,
    images: [
      { url: "https://placehold.co/800x600?text=Odyssey+G7+Front", public_id: "seed_g7_1" },
      { url: "https://placehold.co/800x600?text=Odyssey+G7+Back",  public_id: "seed_g7_2" },
    ],
    specs: new Map([["Size","32 inches"],["Resolution","2560x1440 (QHD)"],["Panel","VA QLED, Curved 1000R"],["Refresh Rate","240Hz"],["HDR","DisplayHDR 600"],["Ports","HDMI 2.1, DisplayPort 1.4, USB Hub"],["Response","1ms GtG"]]),
  },
  // ── AUDIO
  {
    name: "Sony WH-1000XM5 Wireless Headphones",
    description: "Industry-leading noise cancellation meets exceptional sound quality in the WH-1000XM5. With 30-hour battery life, multipoint Bluetooth, and speak-to-chat technology, these are the ultimate wireless headphones.",
    brand: "Sony",
    category: categoryMap["Audio"],
    price: 399.99,
    discountPrice: 349.99,
    stock: 50,
    isFeatured: false,
    images: [
      { url: "https://placehold.co/800x600?text=Sony+XM5+Front",  public_id: "seed_xm5_1" },
      { url: "https://placehold.co/800x600?text=Sony+XM5+Folded", public_id: "seed_xm5_2" },
    ],
    specs: new Map([["Driver","30mm"],["Frequency","4Hz - 40,000Hz"],["Noise Cancel","Yes - Industry leading ANC"],["Battery","30 hours (ANC on)"],["Bluetooth","5.2, Multipoint"],["Weight","250g"],["Mic","8 microphones"]]),
  },
  {
    name: "Apple AirPods Pro 2nd Gen",
    description: "AirPods Pro 2nd generation deliver up to 2x more Active Noise Cancellation than the previous generation, along with Adaptive Transparency, Personalised Spatial Audio, and an H2 chip for extraordinary sound.",
    brand: "Apple",
    category: categoryMap["Audio"],
    price: 249.99,
    discountPrice: 229.99,
    stock: 80,
    isFeatured: false,
    images: [
      { url: "https://placehold.co/800x600?text=AirPods+Pro+Case", public_id: "seed_app_1" },
      { url: "https://placehold.co/800x600?text=AirPods+Pro+Buds", public_id: "seed_app_2" },
    ],
    specs: new Map([["Chip","Apple H2"],["ANC","Adaptive Active Noise Cancellation"],["Battery","6hrs (30hrs with case)"],["Bluetooth","5.3"],["Water Resist","IPX4"],["Fit","3 sizes silicone ear tips"]]),
  },
  // ── ACCESSORIES
  {
    name: "Logitech MX Master 3S Mouse",
    description: "The MX Master 3S is the master of mice — precise, quiet, and built for professionals. Features an 8000 DPI sensor, MagSpeed electromagnetic scroll wheel, and connects to up to 3 devices simultaneously.",
    brand: "Logitech",
    category: categoryMap["Accessories"],
    price: 99.99,
    discountPrice: 84.99,
    stock: 100,
    isFeatured: false,
    images: [
      { url: "https://placehold.co/800x600?text=MX+Master+3S+Top",  public_id: "seed_mx_1" },
      { url: "https://placehold.co/800x600?text=MX+Master+3S+Side", public_id: "seed_mx_2" },
    ],
    specs: new Map([["Sensor","Darkfield 8000 DPI"],["Buttons","7 programmable"],["Battery","70 days on full charge"],["Connection","Bluetooth / USB Receiver (Logi Bolt)"],["Multi-Device","Up to 3 devices"],["Weight","141g"]]),
  },
  {
    name: "Keychron K2 Wireless Mechanical Keyboard",
    description: "The Keychron K2 is a compact 75% wireless mechanical keyboard compatible with Mac and Windows. Available in multiple switch options with hot-swappable PCB, RGB backlight, and up to 72 hours battery life.",
    brand: "Keychron",
    category: categoryMap["Accessories"],
    price: 89.99,
    discountPrice: 0,
    stock: 75,
    isFeatured: false,
    images: [
      { url: "https://placehold.co/800x600?text=Keychron+K2+Top",  public_id: "seed_k2_1" },
      { url: "https://placehold.co/800x600?text=Keychron+K2+Side", public_id: "seed_k2_2" },
    ],
    specs: new Map([["Layout","75% (84 keys)"],["Switch","Gateron Red (hot-swappable)"],["Backlight","RGB"],["Battery","4000mAh, up to 72 hours"],["Connection","Bluetooth 5.1 / USB-C"],["Compatible","macOS, Windows, iOS, Android"]]),
  },
  // ── GAMING
  {
    name: "PlayStation 5 Console",
    description: "The PS5 console unleashes a new generation of gaming with ultra-high speed SSD, ray tracing, 4K gaming up to 120fps, 3D audio, and the revolutionary DualSense wireless controller.",
    brand: "Sony",
    category: categoryMap["Gaming"],
    price: 499.99,
    discountPrice: 0,
    stock: 15,
    isFeatured: true,
    images: [
      { url: "https://placehold.co/800x600?text=PS5+Front", public_id: "seed_ps5_1" },
      { url: "https://placehold.co/800x600?text=PS5+Side",  public_id: "seed_ps5_2" },
    ],
    specs: new Map([["CPU","AMD Zen 2, 8-core 3.5GHz"],["GPU","AMD RDNA 2, 10.28 TFLOPS"],["RAM","16GB GDDR6"],["Storage","825GB Custom NVMe SSD"],["Resolution","Up to 8K (4K @ 120fps)"],["Optical","4K UHD Blu-ray"],["Audio","Tempest 3D Audio"]]),
  },
  {
    name: "ASUS ROG Rapture GT-AX11000 Gaming Router",
    description: "The ROG Rapture GT-AX11000 is a tri-band Wi-Fi 6 gaming router delivering 11000Mbps speeds. Features Game Acceleration, VPN Fusion, and 2.5G WAN port for the ultimate low-latency gaming experience.",
    brand: "ASUS",
    category: categoryMap["Gaming"],
    price: 449.99,
    discountPrice: 399.99,
    stock: 20,
    isFeatured: false,
    images: [
      { url: "https://placehold.co/800x600?text=ROG+Router+Top",  public_id: "seed_rog_1" },
      { url: "https://placehold.co/800x600?text=ROG+Router+Side", public_id: "seed_rog_2" },
    ],
    specs: new Map([["Wi-Fi","Wi-Fi 6 (802.11ax)"],["Bands","Tri-band (2.4GHz + 5GHz + 5GHz)"],["Speed","11000 Mbps total"],["WAN Port","2.5G"],["LAN Ports","8x Gigabit"],["USB","USB 3.1 Gen 1 + USB 2.0"],["Antennas","8 external"]]),
  },
];

// ─────────────────────────────────────────────
//  IMPORT
// ─────────────────────────────────────────────
const importData = async () => {
  try {
    await connectDB();

    await Product.deleteMany();
    await Category.deleteMany();
    await User.deleteMany();

    await User.create(users);
    console.log("✅ Users seeded");

    const createdCategories = await Category.create(categories);
    const categoryMap = {};
    createdCategories.forEach((cat) => { categoryMap[cat.name] = cat._id; });
    console.log("✅ Categories seeded:", Object.keys(categoryMap).join(", "));

    await Product.create(buildProducts(categoryMap));
    console.log("✅ Products seeded: 12 products across 6 categories");

    console.log("\n📋 Seeded accounts:");
    users.forEach((u) =>
      console.log(`   ${u.role.padEnd(10)} ${u.email}  /  ${u.password}`)
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    process.exit(1);
  }
};

// ─────────────────────────────────────────────
//  DESTROY
// ─────────────────────────────────────────────
const destroyData = async () => {
  try {
    await connectDB();
    await Product.deleteMany();
    await Category.deleteMany();
    await User.deleteMany();
    console.log("🗑️  All data removed (users, categories, products)");
    process.exit(0);
  } catch (error) {
    console.error("❌ Destroy failed:", error.message);
    process.exit(1);
  }
};

if (process.argv[2] === "-d") {
  destroyData();
} else {
  importData();
}
