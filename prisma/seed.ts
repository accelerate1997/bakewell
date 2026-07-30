import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning existing data...");
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.banner.deleteMany();
  await prisma.coupon.deleteMany();

  console.log("Seeding Categories...");
  const breads = await prisma.category.create({
    data: { 
      name: "Breads & Loaves", 
      slug: "breads",
      description: "Freshly baked artisanal sourdoughs and classic daily loaves.",
      imageUrl: "/hero-image-v3.png"
    },
  });
  const cakes = await prisma.category.create({
    data: { 
      name: "Cakes & Pastries", 
      slug: "cakes",
      description: "Rich, decadent cakes and flaky buttery French pastries.",
      imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=1000&auto=format&fit=crop"
    },
  });
  const fmcg = await prisma.category.create({
    data: { 
      name: "FMCG Essentials", 
      slug: "fmcg",
      description: "Premium natural pantry essentials, pure honey, and spreads.",
      imageUrl: "https://images.unsplash.com/photo-1587049352847-4a4224e1451f?q=80&w=1000&auto=format&fit=crop"
    },
  });
  const snacks = await prisma.category.create({
    data: { 
      name: "Snacks & Cookies", 
      slug: "snacks",
      description: "Crunchy twice-baked biscotti, healthy cookies, and savory bites.",
      imageUrl: "https://images.unsplash.com/photo-1519869325930-281384150729?q=80&w=1000&auto=format&fit=crop"
    },
  });

  console.log("Seeding Products & Variants...");
  // Breads
  await prisma.product.create({
    data: {
      name: "Classic Country Sourdough",
      slug: "classic-country-sourdough",
      description: "Our signature open-crumb sourdough, slow-fermented for 36 hours. Crisp blistered crust with a beautiful chewy, tangy interior.",
      categoryId: breads.id,
      status: "ACTIVE",
      images: [
        "https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?q=80&w=1000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?q=80&w=1000&auto=format&fit=crop"
      ],
      nutritionTags: ["No Maida", "Vegan", "High Protein", "Fresh Baked"],
      metaTitle: "Classic Country Sourdough | Bakewell™",
      metaDescription: "Freshly baked authentic country sourdough bread with zero preservatives.",
      variants: {
        create: [
          { label: "400g Loaf", price: 220, stock: 25, sku: "SD-CL-400" },
          { label: "800g Boule", price: 380, stock: 15, sku: "SD-CL-800" },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: "Multigrain & Seeded Sourdough",
      slug: "multigrain-seeded-sourdough",
      description: "Nutrient-dense sourdough packed with toasted sunflower, pumpkin, flax, and sesame seeds. Rich, nutty flavour profile.",
      categoryId: breads.id,
      status: "ACTIVE",
      images: [
        "/hero-image-v3.png"
      ],
      nutritionTags: ["No Maida", "Vegan", "High Protein", "Fresh Baked"],
      metaTitle: "Multigrain Seeded Sourdough | Bakewell™",
      variants: {
        create: [
          { label: "450g Loaf", price: 260, stock: 20, sku: "SD-MG-450" },
        ],
      },
    },
  });

  // Cakes
  await prisma.product.create({
    data: {
      name: "Belgian Dark Truffle Cake",
      slug: "belgian-dark-truffle-cake",
      description: "Intense 70% Belgian dark chocolate ganache layered between moist, rich cocoa sponges. The ultimate indulgence for chocolate connoisseurs.",
      categoryId: cakes.id,
      status: "ACTIVE",
      images: [
        "https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=1000&auto=format&fit=crop"
      ],
      nutritionTags: ["Fresh Baked", "No Preservatives"],
      metaTitle: "Belgian Dark Truffle Cake | Bakewell™",
      variants: {
        create: [
          { label: "500g (Half Kg)", price: 750, stock: 10, sku: "CK-TR-500" },
          { label: "1000g (One Kg)", price: 1400, stock: 5, sku: "CK-TR-1000" },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: "French Butter Croissants (Box of 4)",
      slug: "french-butter-croissants",
      description: "Flaky, golden, honeycombed interior laminated with pure French sheet butter. Best enjoyed warm with your morning brew.",
      categoryId: cakes.id,
      status: "ACTIVE",
      images: [
        "https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=1000&auto=format&fit=crop"
      ],
      nutritionTags: ["Fresh Baked", "No Preservatives"],
      metaTitle: "French Butter Croissants | Bakewell™",
      variants: {
        create: [
          { label: "Box of 4", price: 360, stock: 18, sku: "PS-CR-004" },
        ],
      },
    },
  });

  // FMCG
  await prisma.product.create({
    data: {
      name: "Raw Wildflower Honey",
      slug: "raw-wildflower-honey",
      description: "100% pure, unprocessed raw honey ethically sourced from wild bee hives. Retains all natural pollen, enzymes, and medicinal benefits.",
      categoryId: fmcg.id,
      status: "ACTIVE",
      images: [
        "https://images.unsplash.com/photo-1587049352847-4a4224e1451f?q=80&w=1000&auto=format&fit=crop"
      ],
      nutritionTags: ["Sugar Free", "No Preservatives", "Vegan"],
      metaTitle: "Raw Wildflower Honey | Bakewell™",
      variants: {
        create: [
          { label: "250g Glass Jar", price: 290, stock: 30, sku: "FM-HN-250" },
          { label: "500g Glass Jar", price: 520, stock: 20, sku: "FM-HN-500" },
        ],
      },
    },
  });

  // Snacks
  await prisma.product.create({
    data: {
      name: "Almond & Cranberry Biscotti",
      slug: "almond-cranberry-biscotti",
      description: "Twice-baked Italian style crunchy biscuits packed with roasted Californian almonds and tart dried cranberries. Perfect dipping companion.",
      categoryId: snacks.id,
      status: "ACTIVE",
      images: [
        "https://images.unsplash.com/photo-1519869325930-281384150729?q=80&w=1000&auto=format&fit=crop"
      ],
      nutritionTags: ["High Protein", "No Preservatives"],
      metaTitle: "Almond Cranberry Biscotti | Bakewell™",
      variants: {
        create: [
          { label: "200g Pack", price: 240, stock: 25, sku: "SN-BS-200" },
        ],
      },
    },
  });

  console.log("Seeding Banners...");
  await prisma.banner.create({
    data: {
      title: "Fresh Bakes at your Door Step",
      imageUrl: "/hero-image-v3.png",
      linkUrl: "/products",
      position: "HERO",
      isActive: true,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });

  console.log("Seeding Coupons...");
  await prisma.coupon.create({
    data: {
      code: "FRESHBAKE",
      type: "PERCENTAGE",
      value: 15, // 15% off
      minOrderAmount: 499,
      isActive: true,
      usedCount: 0,
      maxUses: 100,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
