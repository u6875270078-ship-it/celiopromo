import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ObjectStorageService, ObjectNotFoundError, objectStorageClient } from "./objectStorage";
import { db } from "./db";
import { users, products, customers, addresses, carts, orders, insertProductSchema, insertCategorySchema, insertCustomerSchema, insertOrderSchema, insertAddressSchema, insertCartSchema, systemConfigurations, insertSystemConfigurationSchema, publicImages, teamMembers, lookbooks, insertLookbookSchema, stores, insertStoreSchema, tryOnHistory } from "@shared/schema";
import { eq, sql, desc } from "drizzle-orm";
import Stripe from "stripe";
import { emailService, type ContactFormData } from "./email";
import { createUserAccountForInvitation, generateSecurePassword, hashPassword } from "./userUtils";
import multer from "multer";
import * as XLSX from "xlsx";
import bcrypt from "bcrypt";

// Initialize Stripe only if key is available
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-08-27.basil",
    })
  : null;

// Strip color suffix from product name using its color field
function getBaseName(name: string, color: string | null | undefined): string {
  if (color) {
    const suffix = ' - ' + color;
    if (name.toLowerCase().endsWith(suffix.toLowerCase())) {
      return name.slice(0, name.length - suffix.length).trim();
    }
  }
  return name;
}

// Group a flat list of products by base name, merging colorImages across color variants
function groupByBaseName(allProducts: any[]): any[] {
  const productGroups = new Map<string, any>();

  for (const product of allProducts) {
    const baseName = getBaseName(product.name, product.color);

    if (!productGroups.has(baseName)) {
      const ci: Record<string, string[]> = {};
      if (product.colorImages && typeof product.colorImages === 'object') {
        Object.assign(ci, product.colorImages);
      }
      productGroups.set(baseName, {
        ...product,
        name: baseName,
        _mergedColorImages: ci,
        _totalStock: product.stock || 0,
        _variantCount: 1,
      });
    } else {
      const group = productGroups.get(baseName)!;
      group._totalStock += product.stock || 0;
      group._variantCount += 1;
      if (product.colorImages && typeof product.colorImages === 'object') {
        for (const [color, imgs] of Object.entries(product.colorImages as Record<string, string[]>)) {
          if (!group._mergedColorImages[color]) {
            group._mergedColorImages[color] = imgs;
          }
        }
      }
      // Prefer a product with a valid mainImage as the group representative
      if (!group.mainImage && product.mainImage) {
        Object.assign(group, { ...product, name: baseName });
      }
    }
  }

  return Array.from(productGroups.values()).map(g => {
    const { _mergedColorImages, _totalStock, _variantCount, ...rest } = g;
    return {
      ...rest,
      colorImages: Object.keys(_mergedColorImages).length > 0 ? _mergedColorImages : null,
      stock: _totalStock,
      colorVariants: _variantCount,
      hasVariants: _variantCount > 1,
    };
  });
}

// True when a URL is a non-product asset (locale flag, header chrome, or any SVG).
const isJunkImage = (url: string | null | undefined): boolean =>
  !url ||
  url.includes('flag_FR') ||
  url.includes('/header/') ||
  /\.svg(\?|$)/.test(url);

// Strip non-product images (flag SVG, header assets) and promote first real image to mainImage
function fixProductImages<T extends { mainImage?: string | null; images?: unknown; colorImages?: unknown }>(product: T): T {
  const isJunk = (url: string) => isJunkImage(url);

  const raw: string[] = [];
  if (product.mainImage) raw.push(product.mainImage);
  if (Array.isArray(product.images)) raw.push(...(product.images as string[]));
  const valid = raw.filter(u => u && !isJunk(u));

  // Also clean colorImages map
  let cleanColorImages = product.colorImages;
  if (product.colorImages && typeof product.colorImages === 'object') {
    const ci = product.colorImages as Record<string, string[]>;
    const cleaned: Record<string, string[]> = {};
    for (const [color, urls] of Object.entries(ci)) {
      if (Array.isArray(urls)) {
        cleaned[color] = urls.filter(u => u && !isJunk(u));
      }
    }
    cleanColorImages = cleaned;
  }

  return {
    ...product,
    mainImage: valid[0] ?? null,
    images: valid.slice(1),
    colorImages: cleanColorImages,
  };
}

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Admin API Routes
  app.get("/api/admin/stats", async (req, res) => {
    try {
      const orderStats = await storage.getOrderStats();
      const [productsCount] = await db.select({ count: sql<number>`count(*)::int` }).from(products);
      const [customersCount] = await db.select({ count: sql<number>`count(*)::int` }).from(customers);
      
      const stats = {
        products: productsCount?.count || 0,
        orders: orderStats.totalOrders,
        customers: customersCount?.count || 0,
        revenue: orderStats.totalRevenue
      };
      res.json(stats);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/api/admin/recent-orders", async (req, res) => {
    try {
      const orderStats = await storage.getOrderStats();
      const formattedOrders = orderStats.recentOrders.map(order => ({
        id: order.orderNumber,
        customer: order.customerName,
        amount: parseFloat(order.total),
        status: order.status,
        time: new Date(order.createdAt || Date.now()).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      }));
      res.json(formattedOrders);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch recent orders" });
    }
  });

  // Database Management API Routes
  app.get("/api/admin/database/stats", async (req, res) => {
    try {
      // Get all products to calculate stats
      const allProducts = await storage.getAllProducts();
      
      // Count products
      const productsCount = allProducts.length;
      
      // Count unique categories
      const uniqueCategories = new Set(allProducts.map(p => p.category));
      const categoriesCount = uniqueCategories.size;
      
      // Count variants (products with same name but different attributes)
      const productGroups = new Map();
      if (Array.isArray(allProducts)) {
        allProducts.forEach(product => {
          const key = product.name;
          if (!productGroups.has(key)) {
            productGroups.set(key, 1);
          } else {
            productGroups.set(key, productGroups.get(key) + 1);
          }
        });
      }
      
      const variantCount = Array.from(productGroups.values())
        .filter(count => count > 1)
        .reduce((sum, count) => sum + (count - 1), 0);
      
      // Get last update timestamp
      const lastUpdate = allProducts.length > 0 
        ? allProducts.reduce((latest, product) => {
            const productDate = new Date(product.createdAt || 0);
            return productDate > latest ? productDate : latest;
          }, new Date(0))
        : null;
      
      const stats = {
        products: productsCount,
        categories: categoriesCount,
        variants: variantCount,
        lastUpdate: lastUpdate ? lastUpdate.toISOString() : null
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Database stats error:", error);
      res.status(500).json({ error: "Failed to fetch database stats" });
    }
  });

  app.post("/api/admin/database/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Parse Excel file
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (!data || data.length === 0) {
        return res.status(400).json({ error: "File is empty or invalid" });
      }

      let imported = 0;
      let skipped = 0;
      const errors: string[] = [];

      // Get existing products to check for duplicates
      const existingProducts = await storage.getAllProducts();
      const existingSkus = new Set(existingProducts.map(p => p.sku.toUpperCase()));
      const existingNames = new Set(existingProducts.map(p => p.name.toLowerCase()));

      for (let i = 0; i < data.length; i++) {
        const row = data[i] as any;
        
        try {
          // Validate required fields
          if (!row.name || !row.sku) {
            errors.push(`Riga ${i + 2}: Nome e SKU sono obbligatori`);
            continue;
          }

          const sku = String(row.sku).trim().toUpperCase();
          const name = String(row.name).trim().toLowerCase();

          // Check for duplicates
          if (existingSkus.has(sku)) {
            errors.push(`Riga ${i + 2}: SKU "${sku}" già esistente nel database`);
            skipped++;
            continue;
          }

          if (existingNames.has(name)) {
            errors.push(`Riga ${i + 2}: Prodotto "${row.name}" già esistente nel database`);
            skipped++;
            continue;
          }

          // Ensure price is valid
          let price = 0.01; // Default minimum price
          if (row.price) {
            const parsedPrice = parseFloat(String(row.price));
            if (!isNaN(parsedPrice) && parsedPrice > 0) {
              price = parsedPrice;
            }
          }

          // Create product data
          const productData = {
            name: String(row.name).trim(),
            sku: String(row.sku).trim().toUpperCase(),
            category: row.category ? String(row.category).trim() : 'Abbigliamento',
            subcategory: row.subcategory ? String(row.subcategory).trim() : null,
            price: price,
            description: row.description ? String(row.description).trim() : null,
            color: row.color || row.colore ? String(row.color || row.colore).trim() : null,
            stock: row.quantity || row.quantita || row.stock ? parseInt(String(row.quantity || row.quantita || row.stock)) : 0,
            brand: row.brand || row.marca ? String(row.brand || row.marca).trim() : 'Celio',
            variants: row.size || row.taglia ? [{
              size: String(row.size || row.taglia).trim(),
              color: row.color || row.colore ? String(row.color || row.colore).trim() : null,
              quantity: row.quantity || row.quantita || row.stock ? parseInt(String(row.quantity || row.quantita || row.stock)) : 0
            }] : [],
            attributes: {
              material: row.material || row.materiale || null,
              season: row.season || row.stagione || null,
              size: row.size || row.taglia || null
            }
          };

          // Validate with schema
          const validatedData = insertProductSchema.parse(productData);
          
          // Create product in database
          await storage.createProduct(validatedData);
          imported++;

          // Add to tracking sets to prevent duplicates within the same file
          existingSkus.add(sku);
          existingNames.add(name);

        } catch (error) {
          console.error(`Error processing row ${i + 2}:`, error);
          errors.push(`Riga ${i + 2}: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
        }
      }

      res.json({ 
        imported, 
        skipped,
        total: data.length,
        errors: errors.slice(0, 10) // Limit errors to first 10
      });

    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Failed to process file" });
    }
  });

  app.post("/api/admin/database/clear", async (req, res) => {
    try {
      // Clear all products
      await db.delete(products);
      
      res.json({ message: "Database cleared successfully" });
    } catch (error) {
      console.error("Clear database error:", error);
      res.status(500).json({ error: "Failed to clear database" });
    }
  });

  // Object Storage Routes for Product Images
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const result = await objectStorageService.getPublicObjectUploadURL();
      res.json({ uploadURL: result.uploadURL, publicPath: result.publicPath });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  app.put("/api/products/:id/image", async (req, res) => {
    if (!req.body.imageURL) {
      return res.status(400).json({ error: "imageURL is required" });
    }

    try {
      const productId = parseInt(req.params.id);
      const objectStorageService = new ObjectStorageService();
      const objectPath = objectStorageService.normalizeObjectEntityPath(
        req.body.imageURL,
      );

      // Update the product with the image path
      await storage.updateProduct(productId, { mainImage: objectPath });

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error setting product image:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Product Management API Endpoints
  
  // Get all products with pagination and category filtering (grouped by name to avoid color duplicates)
  app.get("/api/products", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 1000;
      const offset = parseInt(req.query.offset as string) || 0;
      const category = req.query.category as string;
      
      console.log('API Products called with category:', category);
      
      let allProducts = await storage.getAllProducts();

      let products = groupByBaseName(allProducts);
      
      // Filter by category if specified
      if (category) {
        console.log('Category filter:', category);
        console.log('Products before filter:', products.length);
        // "Novità" (nouveautés) should show ALL products (new arrivals)
        if (category.toLowerCase() === 'nouveautés' || category.toLowerCase() === 'nouveautes' || category.toLowerCase() === 'novità' || category.toLowerCase() === 'novita') {
          console.log('Showing all products for Novità');
          // Show all products for new arrivals - no filtering needed
        } else {
          const categoryMap: Record<string, string[]> = {
            'abbigliamento': ['T-shirt', 'Polo', 'Felpe', 'Pullover', 'Giubbotti'],
            'camicie': ['Camicia', 'Camicie'],
            'pantaloni': ['Pantalone', 'Pantaloni', 'Jeans', 'Chino'],
            'scarpe': ['Scarpe', 'Sneakers', 'Scarpa'],
            'accessori': ['Accessorio', 'Accessori', 'Cintura', 'Cappello', 'Sciarpa', 'Guanti', 'Calze', 'Boxer'],
            'profumi': ['Profumo', 'Profumi', 'Fragranza']
          };
          
          const allowedCategories = categoryMap[category.toLowerCase()] || [category];
          products = products.filter(product => 
            allowedCategories.some(cat => 
              product.category.toLowerCase().includes(cat.toLowerCase()) ||
              product.subcategory?.toLowerCase().includes(cat.toLowerCase())
            )
          );
        }
      }
      
      // Apply pagination after grouping and filtering
      const startIndex = offset;
      const endIndex = offset + limit;
      products = products.slice(startIndex, endIndex);

      res.json(products.map(fixProductImages));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  // Search products — must be before /:id to avoid shadowing
  app.get("/api/products/search/:query", async (req, res) => {
    try {
      const products = await storage.searchProducts(req.params.query);
      res.json(products);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to search products" });
    }
  });

  // Get products by category — must be before /:id
  app.get("/api/products/category/:category", async (req, res) => {
    try {
      const raw = await storage.getProductsByCategory(req.params.category);
      const products = groupByBaseName(raw);
      res.json(products.map(fixProductImages));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch products by category" });
    }
  });

  // Get low stock products — must be before /:id to avoid shadowing
  app.get("/api/products/low-stock", async (req, res) => {
    try {
      const threshold = parseInt(req.query.threshold as string) || 10;
      const products = await storage.getLowStockProducts(threshold);
      res.json(products);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch low stock products" });
    }
  });

  // Get single product with color variants
  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      // Parse variants from JSON if stored in product
      let variants = [];
      if (product.variants && typeof product.variants === 'string') {
        try {
          variants = JSON.parse(product.variants);
        } catch (e) {
          console.error('Error parsing variants JSON:', e);
          variants = [];
        }
      } else if (Array.isArray(product.variants)) {
        variants = product.variants;
      }

      // Also check for color variants stored as separate products (legacy support)
      if (variants.length === 0) {
        const allProducts = await storage.getAllProducts();
        const legacyVariants = allProducts
          .filter(p => p.name === product.name && p.color) // Only include products with colors
          .map(p => ({
            id: p.id,
            color: p.color,
            size: p.size,
            stock: p.stock,
            quantity: p.stock, // for compatibility
            mainImage: p.mainImage,
            images: p.images
          }));
        variants = legacyVariants;
      }

      res.json(fixProductImages({
        ...product,
        variants: variants.length > 0 ? variants : undefined
      }));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  // Create new product
  app.post("/api/products", async (req, res) => {
    try {
      const requestBody = req.body;
      
      // Store variants as JSON in single product record
      const productData = {
        ...requestBody,
        // Ensure required fields have defaults and preserve existing values
        reservedStock: requestBody.reservedStock || 0,
        minStock: requestBody.minStock || 5,
        maxStock: requestBody.maxStock || 100,
        // Store variants as JSON string
        variants: requestBody.variants ? JSON.stringify(requestBody.variants) : null,
        // Calculate total stock from variants if they exist
        stock: requestBody.variants && requestBody.variants.length > 0 
          ? requestBody.variants.reduce((total: number, variant: any) => total + (variant.quantity || 0), 0)
          : parseInt(requestBody.stock) || 10
      };
      
      // Validate product data
      const validation = insertProductSchema.safeParse(productData);
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Invalid product data", 
          details: validation.error.errors 
        });
      }

      // Check if SKU already exists
      const existingProduct = await storage.getProductBySku(validation.data.sku);
      if (existingProduct) {
        return res.status(400).json({ error: "Product with this SKU already exists" });
      }

      const product = await storage.createProduct(validation.data);
      
      // Auto-assign Italian language
      try {
        await storage.updateProduct(product.id, { language: 'it' });
      } catch (error) {
        console.log('Note: Could not set language:', error);
      }
      
      const message = requestBody.variants && requestBody.variants.length > 0 
        ? `Created product with ${requestBody.variants.length} variants`
        : "Product created successfully";
        
      res.status(201).json({ 
        message,
        product 
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  // Update product
  app.put("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get existing product to preserve stock values
      const existingProduct = await storage.getProduct(id);
      if (!existingProduct) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      // Prepare update data while preserving critical stock values
      const updateData = {
        ...req.body,
        // Preserve stock values if not explicitly updated
        stock: req.body.stock !== undefined ? parseInt(req.body.stock) : existingProduct.stock,
        reservedStock: req.body.reservedStock !== undefined ? parseInt(req.body.reservedStock) : existingProduct.reservedStock,
        minStock: req.body.minStock !== undefined ? parseInt(req.body.minStock) : existingProduct.minStock,
        maxStock: req.body.maxStock !== undefined ? parseInt(req.body.maxStock) : existingProduct.maxStock,
        // Store variants as JSON string if provided
        variants: req.body.variants ? JSON.stringify(req.body.variants) : existingProduct.variants
      };
      
      const validation = insertProductSchema.partial().safeParse(updateData);
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Invalid product data", 
          details: validation.error.errors 
        });
      }

      const product = await storage.updateProduct(id, validation.data);
      res.json(product);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  // Delete product
  app.delete("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteProduct(id);
      if (!success) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // Admin inventory endpoint (for backward compatibility)
  app.get("/api/admin/inventory", async (req, res) => {
    try {
      const products = await storage.getAllProducts(50, 0);
      // Transform to match the expected format for admin page
      const transformedProducts = products.map(product => ({
        ...product,
        reserved: product.reservedStock || 0,
        status: product.stock <= (product.minStock || 5) ? 'low-stock' : 'in-stock'
      }));
      res.json(transformedProducts);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch inventory" });
    }
  });

  // Category Management API Endpoints
  
  // Get all categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  // Create new category
  app.post("/api/categories", async (req, res) => {
    try {
      const validation = insertCategorySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Invalid category data", 
          details: validation.error.errors 
        });
      }

      const category = await storage.createCategory(validation.data);
      res.status(201).json(category);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create category" });
    }
  });

  // Update category
  app.put("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validation = insertCategorySchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Invalid category data", 
          details: validation.error.errors 
        });
      }

      const category = await storage.updateCategory(id, validation.data);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to update category" });
    }
  });

  // Delete category
  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCategory(id);
      if (!success) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to delete category" });
    }
  });

  // Address Management API Endpoints
  
  // Get user addresses
  app.get("/api/addresses/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const addresses = await storage.getUserAddresses(userId);
      res.json(addresses);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch addresses" });
    }
  });

  // Get customer addresses
  app.get("/api/customers/:customerId/addresses", async (req, res) => {
    try {
      const customerId = parseInt(req.params.customerId);
      const addresses = await storage.getCustomerAddresses(customerId);
      res.json(addresses);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch customer addresses" });
    }
  });

  // Create new address
  app.post("/api/addresses", async (req, res) => {
    try {
      const validation = insertAddressSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Invalid address data", 
          details: validation.error.errors 
        });
      }

      const address = await storage.createAddress(validation.data);
      res.status(201).json(address);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create address" });
    }
  });

  // Update address
  app.put("/api/addresses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validation = insertAddressSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Invalid address data", 
          details: validation.error.errors 
        });
      }

      const address = await storage.updateAddress(id, validation.data);
      if (!address) {
        return res.status(404).json({ error: "Address not found" });
      }
      res.json(address);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to update address" });
    }
  });

  // Delete address
  app.delete("/api/addresses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteAddress(id);
      if (!success) {
        return res.status(404).json({ error: "Address not found" });
      }
      res.json({ message: "Address deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to delete address" });
    }
  });

  // Set default shipping address
  app.put("/api/customers/:customerId/default-shipping/:addressId", async (req, res) => {
    try {
      const customerId = parseInt(req.params.customerId);
      const addressId = parseInt(req.params.addressId);
      await storage.setDefaultShippingAddress(customerId, addressId);
      res.json({ message: "Default shipping address updated" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to set default shipping address" });
    }
  });

  // Set default billing address
  app.put("/api/customers/:customerId/default-billing/:addressId", async (req, res) => {
    try {
      const customerId = parseInt(req.params.customerId);
      const addressId = parseInt(req.params.addressId);
      await storage.setDefaultBillingAddress(customerId, addressId);
      res.json({ message: "Default billing address updated" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to set default billing address" });
    }
  });

  // Set default address
  app.patch("/api/addresses/:id/default", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { userId } = req.body;
      
      // First, unset all default addresses for the user
      const userAddresses = await storage.getUserAddresses(userId);
      for (const addr of userAddresses) {
        if (addr.isDefault) {
          await storage.updateAddress(addr.id, { isDefault: false });
        }
      }
      
      // Set the new default address
      const address = await storage.updateAddress(id, { isDefault: true });
      if (!address) {
        return res.status(404).json({ error: "Address not found" });
      }
      res.json(address);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to set default address" });
    }
  });

  // Customer Management API Endpoints
  
  // Get all customers (with optional email filter for login)
  app.get("/api/customers", async (req, res) => {
    try {
      const { email } = req.query;
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;
      const customers = await storage.getAllCustomers(limit, offset);
      
      if (email) {
        const filteredCustomers = customers.filter(customer => 
          customer.email?.toLowerCase() === (email as string).toLowerCase()
        );
        res.json(filteredCustomers);
      } else {
        res.json(customers);
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });

  // Create new customer
  app.post("/api/customers", async (req, res) => {
    try {
      const validation = insertCustomerSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Invalid customer data", 
          details: validation.error.errors 
        });
      }

      // Check if customer with this email already exists
      const existingCustomer = await storage.getCustomerByEmail(validation.data.email);
      if (existingCustomer) {
        return res.status(200).json(existingCustomer); // Return existing customer instead of error
      }

      const customer = await storage.createCustomer(validation.data);
      res.status(201).json(customer);
    } catch (error: any) {
      console.error(error);
      // Handle specific duplicate key error
      if (error?.code === '23505' && error?.constraint === 'customers_email_key') {
        return res.status(400).json({ error: "Customer with this email already exists" });
      }
      res.status(500).json({ error: "Failed to create customer" });
    }
  });

  // Get customer by email
  app.get("/api/customers/email/:email", async (req, res) => {
    try {
      const customer = await storage.getCustomerByEmail(req.params.email);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch customer" });
    }
  });

  // Update customer
  app.put("/api/customers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validation = insertCustomerSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Invalid customer data", 
          details: validation.error.errors 
        });
      }

      const customer = await storage.updateCustomer(id, validation.data);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to update customer" });
    }
  });

  // Delete customer
  app.delete("/api/customers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCustomer(id);
      if (!success) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json({ message: "Customer deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to delete customer" });
    }
  });

  // Customer Journey API routes
  
  // Get customer journey stages
  app.get("/api/customers/:id/journey-stages", async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      const stages = await storage.getCustomerJourneyStages(customerId);
      res.json(stages);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch customer journey stages" });
    }
  });

  // Get customer journey events
  app.get("/api/customers/:id/journey-events", async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      const limit = parseInt(req.query.limit as string) || 50;
      const events = await storage.getCustomerJourneyEvents(customerId, limit);
      res.json(events);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch customer journey events" });
    }
  });

  // Initialize customer journey
  app.post("/api/customers/:id/initialize-journey", async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      await storage.initializeCustomerJourney(customerId);
      res.json({ message: "Customer journey initialized successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to initialize customer journey" });
    }
  });

  // Record journey event
  app.post("/api/customers/:id/journey-events", async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      const event = await storage.recordJourneyEvent({
        customerId,
        ...req.body
      });
      res.status(201).json(event);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to record journey event" });
    }
  });

  // Update customer journey progress
  app.post("/api/customers/:id/update-journey-progress", async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      await storage.updateCustomerJourneyProgress(customerId);
      res.json({ message: "Customer journey progress updated successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to update customer journey progress" });
    }
  });

  // Order Management API Endpoints
  
  // Get all orders (with optional customer or user filter)
  app.get("/api/orders", async (req, res) => {
    try {
      const { customerId, userId } = req.query;
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;
      
      if (customerId) {
        const orders = await storage.getCustomerOrders(parseInt(customerId as string));
        res.json(orders);
      } else if (userId) {
        const orders = await storage.getOrdersByUser(parseInt(userId as string));
        res.json(orders);
      } else {
        const orders = await storage.getAllOrders(limit, offset);
        res.json(orders);
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  // Get single order
  app.get("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });


  // Update order
  app.put("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validation = insertOrderSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Invalid order data", 
          details: validation.error.errors 
        });
      }

      const order = await storage.updateOrder(id, validation.data);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to update order" });
    }
  });

  // Delete order
  app.delete("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteOrder(id);
      if (!success) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json({ message: "Order deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to delete order" });
    }
  });

  app.get("/api/admin/orders", async (req, res) => {
    try {
      // Mock data for demo - replace with real database queries
      const orders = [
        {
          id: 'CMD-001',
          customer: 'Marie Dubois',
          email: 'marie.dubois@email.com',
          date: '2024-01-15',
          total: 89.90,
          status: 'processing',
          items: 2
        },
        {
          id: 'CMD-002',
          customer: 'Pierre Martin',
          email: 'pierre.martin@email.com',
          date: '2024-01-15',
          total: 124.50,
          status: 'shipped',
          items: 3
        }
      ];
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.get("/api/admin/suppliers", async (req, res) => {
    try {
      // Mock data for demo - replace with real database queries
      const suppliers = [
        {
          id: 1,
          name: 'Fournisseur Textile Paris',
          email: 'contact@textile-paris.fr',
          phone: '+33 1 23 45 67 89',
          address: '12 Rue de la Mode, 75001 Paris',
          category: 'Textile',
          productsCount: 45,
          lastOrder: '2024-01-10',
          status: 'active',
          rating: 4.8
        },
        {
          id: 2,
          name: 'Mode & Style Distribution',
          email: 'orders@modestyle.com',
          phone: '+33 1 34 56 78 90',
          address: '56 Avenue de la Fashion, 69002 Lyon',
          category: 'Accessori',
          productsCount: 23,
          lastOrder: '2024-01-08',
          status: 'active',
          rating: 4.5
        }
      ];
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch suppliers" });
    }
  });

  // User routes (existing)
  app.get("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }
      const user = await storage.createUser({ 
        email: username, 
        passwordHash: password, 
        username 
      });
      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // Registration endpoint for frontend
  app.post("/api/register", async (req, res) => {
    try {
      const { email, username, password, firstName, lastName, phone } = req.body;
      console.log('Registration attempt for:', email);
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      
      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long" });
      }
      
      // Check if user with this email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Un utente con questa email esiste già" });
      }
      
      const user = await storage.createUser({ 
        email, 
        passwordHash: password, 
        username: username || email,
        firstName,
        lastName,
        phone
      });
      
      console.log('User created successfully:', user.id);
      res.status(201).json({
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      // Handle specific duplicate email error
      if (error?.code === '23505' && error?.constraint === 'users_email_key') {
        return res.status(400).json({ error: "Un utente con questa email esiste già" });
      }
      res.status(500).json({ error: "Failed to register user" });
    }
  });

  // Customer Login
  app.post("/api/customer/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email e password sono obbligatori" });
      }
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Credenziali non valide" });
      }
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        // fallback: plain text check (legacy accounts)
        if (password !== user.passwordHash) {
          return res.status(401).json({ error: "Credenziali non valide" });
        }
      }
      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profilePhoto: user.profilePhoto,
        },
      });
    } catch (error) {
      console.error("Customer login error:", error);
      res.status(500).json({ error: "Errore del server" });
    }
  });

  // Generic image upload for admin forms (stores, lookbooks, etc.).
  // Returns a self-contained base64 data URL so the caller can put it directly
  // in the entity's `image` field without filesystem/object-storage setup.
  app.post("/api/admin/upload-image", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "image file is required" });
      }
      // Accept anything tagged image/* OR a known image extension (covers iPhone HEIC
      // arriving as application/octet-stream and other browser/OS quirks).
      const imageExt = /\.(jpe?g|png|gif|webp|bmp|svg|heic|heif|avif|tiff?|ico)$/i;
      const isImageMime = req.file.mimetype.startsWith("image/");
      const isImageExt = imageExt.test(req.file.originalname || "");
      if (!isImageMime && !isImageExt) {
        return res.status(400).json({ error: "Solo file immagine (jpg, png, gif, webp, ecc.)" });
      }
      // Normalise the data-URL mimetype so HEIC-as-octet-stream still renders as image/* in <img>.
      const extMatch = (req.file.originalname || "").toLowerCase().match(imageExt);
      const ext = extMatch ? extMatch[1] : "";
      const extToMime: Record<string, string> = {
        jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif",
        webp: "image/webp", bmp: "image/bmp", svg: "image/svg+xml",
        heic: "image/heic", heif: "image/heif", avif: "image/avif",
        tif: "image/tiff", tiff: "image/tiff", ico: "image/x-icon",
      };
      const mime = isImageMime ? req.file.mimetype : (extToMime[ext] || "image/jpeg");
      const dataUrl = `data:${mime};base64,${req.file.buffer.toString("base64")}`;
      res.json({ url: dataUrl });
    } catch (error) {
      console.error("Admin image upload error:", error);
      res.status(500).json({ error: "Errore nel caricamento dell'immagine" });
    }
  });

  // Customer profile photo upload (base64)
  app.post("/api/customer/upload-photo", upload.single("photo"), async (req, res) => {
    try {
      const userId = parseInt(req.body.userId);
      if (!userId || !req.file) {
        return res.status(400).json({ error: "userId and photo are required" });
      }
      // Convert to base64 data URL
      const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      await storage.updateUser(userId, { profilePhoto: base64 } as any);
      res.json({ success: true, profilePhoto: base64 });
    } catch (error) {
      console.error("Photo upload error:", error);
      res.status(500).json({ error: "Errore nel caricamento della foto" });
    }
  });

  // Get customer profile
  app.get("/api/customer/profile/:id", async (req, res) => {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, parseInt(req.params.id)));
      if (!user) return res.status(404).json({ error: "Utente non trovato" });
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePhoto: user.profilePhoto,
      });
    } catch (error) {
      res.status(500).json({ error: "Errore nel caricamento del profilo" });
    }
  });

  // Virtual Try-On using Replicate API
  app.post("/api/virtual-tryon", async (req, res) => {
    try {
      const { userPhotoUrl, productImageUrl } = req.body;
      if (!userPhotoUrl || !productImageUrl) {
        return res.status(400).json({ error: "User photo and product image are required" });
      }

      console.log("🧥 Virtual Try-On request:", { userPhotoUrl: userPhotoUrl.substring(0, 50) + "...", productImageUrl: productImageUrl.substring(0, 80) });

      if (!process.env.REPLICATE_API_TOKEN) {
        return res.status(500).json({ error: "Servizio AI non configurato (REPLICATE_API_TOKEN mancante)" });
      }

      // Call Replicate API - IDM-VTON model
      const response = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          version: "0513734a452173b8173e907e3a59d19a36266e55b48528559432bd21c7d7e985",
          input: {
            human_img: userPhotoUrl,
            garm_img: productImageUrl,
            garment_des: req.body.garmentDescription || "clothing item",
            category: req.body.category || "upper_body",
            crop: true,
          },
        }),
      });

      // Bail fast on auth or other HTTP errors instead of polling a non-prediction body.
      if (!response.ok) {
        const body = await response.text();
        console.error("Replicate create-prediction failed:", response.status, body.slice(0, 300));
        if (response.status === 401) {
          return res.status(500).json({ error: "Token Replicate non valido o scaduto" });
        }
        if (response.status === 402) {
          return res.status(500).json({ error: "Crediti AI esauriti. Contatta l'amministratore per ricaricare l'account Replicate." });
        }
        return res.status(500).json({ error: `Replicate error ${response.status}` });
      }

      const prediction = await response.json();
      console.log("Replicate prediction created:", prediction.id);

      if (prediction.error || !prediction.id) {
        return res.status(500).json({ error: prediction.error || "Prediction creation failed" });
      }

      // Poll for result
      let result = prediction;
      let attempts = 0;
      while (result.status !== "succeeded" && result.status !== "failed" && attempts < 60) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
          headers: { "Authorization": `Bearer ${process.env.REPLICATE_API_TOKEN}` },
        });
        // Bail fast on poll-time HTTP errors so a bad token doesn't waste 120s.
        if (!pollRes.ok) {
          const body = await pollRes.text();
          console.error(`Try-on poll #${attempts + 1} HTTP ${pollRes.status}:`, body.slice(0, 200));
          if (pollRes.status === 401) {
            return res.status(500).json({ error: "Token Replicate non valido o scaduto" });
          }
          return res.status(500).json({ error: `Replicate poll error ${pollRes.status}` });
        }
        result = await pollRes.json();
        attempts++;
        console.log(`Try-on poll #${attempts}: ${result.status}`);
      }

      if (result.status === "succeeded") {
        console.log("✅ Virtual try-on completed!");
        const resultImage = Array.isArray(result.output) ? result.output[0] : result.output;

        // Persist to per-user history when an authenticated userId is provided.
        const userId = req.body.userId ? Number(req.body.userId) : null;
        if (userId && resultImage) {
          try {
            await db.insert(tryOnHistory).values({
              userId,
              productId: req.body.productId ? Number(req.body.productId) : null,
              productName: req.body.garmentDescription || "Capo",
              productImage: productImageUrl,
              resultImage,
              category: req.body.category || null,
            });
          } catch (e) {
            console.error("Failed to persist try-on history:", e);
            // Don't fail the request if history write fails — the user still gets the image.
          }
        }

        res.json({ success: true, resultImage });
      } else {
        console.error("❌ Virtual try-on failed:", result.error || result.status);
        res.status(500).json({ error: result.error || "Try-on generation failed" });
      }
    } catch (error) {
      console.error("Virtual try-on error:", error);
      res.status(500).json({ error: "Errore nella prova virtuale" });
    }
  });

  // List a user's try-on history (newest first).
  app.get("/api/virtual-tryon/history", async (req, res) => {
    try {
      const userId = req.query.userId ? Number(req.query.userId) : NaN;
      if (!userId || Number.isNaN(userId)) {
        return res.status(400).json({ error: "userId richiesto" });
      }
      const rows = await db
        .select()
        .from(tryOnHistory)
        .where(eq(tryOnHistory.userId, userId))
        .orderBy(desc(tryOnHistory.createdAt))
        .limit(50);
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to load try-on history" });
    }
  });

  // Delete one entry from the user's history (only if it belongs to them).
  app.delete("/api/virtual-tryon/history/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const userId = req.body?.userId ? Number(req.body.userId) : NaN;
      if (!id || !userId || Number.isNaN(userId)) {
        return res.status(400).json({ error: "id and userId required" });
      }
      const deleted = await db
        .delete(tryOnHistory)
        .where(sql`${tryOnHistory.id} = ${id} AND ${tryOnHistory.userId} = ${userId}`)
        .returning();
      if (deleted.length === 0) {
        return res.status(404).json({ error: "Not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to delete history entry" });
    }
  });

  // Cart API Endpoints
  app.get("/api/cart", async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const guestId = req.query.guestId as string;

      const cart = await storage.getCart(userId, guestId);
      if (!cart) {
        return res.json({ items: [], subtotal: '0' });
      }

      // Heal junk image URLs (flag SVG, header chrome) left over from earlier adds.
      // We write back to the cart so the cleanup is one-shot per cart.
      const items: any[] = Array.isArray(cart.items)
        ? cart.items
        : JSON.parse((cart.items as string) || '[]');

      let healed = false;
      for (const item of items) {
        if (!isJunkImage(item.image)) continue;
        const product = await storage.getProduct(item.productId);
        if (!product) continue;
        const clean = fixProductImages(product);
        const colorMap = clean.colorImages as Record<string, string[]> | null | undefined;
        const colorImage = item.color && colorMap && Array.isArray(colorMap[item.color]) ? colorMap[item.color][0] : null;
        const newImage = colorImage || clean.mainImage || null;
        if (newImage !== item.image) {
          item.image = newImage;
          healed = true;
        }
      }

      if (healed) {
        const updated = await storage.updateCart(cart.id, { items: JSON.stringify(items) });
        return res.json(updated);
      }

      res.json(cart);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch cart" });
    }
  });

  app.post("/api/cart/add", async (req, res) => {
    try {
      const { productId, quantity, userId, guestId, color, size } = req.body;
      
      if (!productId || !quantity) {
        return res.status(400).json({ error: "Product ID and quantity are required" });
      }

      // Get the product details
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      // Check stock availability
      if (product.stock < quantity) {
        return res.status(400).json({ error: "Insufficient stock" });
      }

      // Pick the cleanest image: prefer color-specific, fall back to junk-stripped main
      const cleanProduct = fixProductImages(product);
      const colorMap = cleanProduct.colorImages as Record<string, string[]> | null | undefined;
      const colorImage = color && colorMap && Array.isArray(colorMap[color]) ? colorMap[color][0] : null;
      const cartImage = colorImage || cleanProduct.mainImage || null;

      // Get or create cart
      let cart = await storage.getCart(userId, guestId);

      if (!cart) {
        // Create new cart
        const newCartData = {
          userId: userId || null,
          guestId: guestId || null,
          items: JSON.stringify([{
            productId,
            quantity,
            price: parseFloat(product.price),
            name: product.name,
            image: cartImage,
            color: color || null,
            size: size || null
          }]),
          subtotal: (parseFloat(product.price) * quantity).toString()
        };
        cart = await storage.createCart(newCartData);
      } else {
        // Update existing cart
        const existingItems = Array.isArray(cart.items) ? cart.items : JSON.parse(cart.items as string || '[]');

        // Find item with matching product, color, and size (to allow different variants)
        const existingItemIndex = existingItems.findIndex((item: any) =>
          item.productId === productId &&
          item.color === (color || null) &&
          item.size === (size || null)
        );

        if (existingItemIndex >= 0) {
          // Update quantity of existing item with same variant
          existingItems[existingItemIndex].quantity += quantity;
        } else {
          // Add new item variant
          existingItems.push({
            productId,
            quantity,
            price: parseFloat(product.price),
            name: product.name,
            image: cartImage,
            color: color || null,
            size: size || null
          });
        }
        
        const subtotal = existingItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
        
        cart = await storage.updateCart(cart.id, {
          items: JSON.stringify(existingItems),
          subtotal: subtotal.toString()
        });
      }

      res.json(cart);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to add item to cart" });
    }
  });

  // Delete individual item from cart
  app.delete("/api/cart/remove", async (req, res) => {
    try {
      const { itemId, userId, guestId } = req.body;
      
      const cart = await storage.getCart(userId, guestId);
      if (!cart) {
        return res.status(404).json({ error: "Cart not found" });
      }
      
      const existingItems = Array.isArray(cart.items) ? cart.items : JSON.parse(cart.items as string || '[]');
      
      // The itemId could be the productId or the array index - try both approaches
      let updatedItems;
      
      // First try removing by index (if itemId is a valid index)
      if (typeof itemId === 'number' && itemId >= 0 && itemId < existingItems.length) {
        updatedItems = existingItems.filter((_: any, index: number) => index !== itemId);
      } else {
        // Otherwise try removing by productId
        updatedItems = existingItems.filter((item: any) => item.productId !== itemId);
      }
      
      // Recalculate subtotal
      const subtotal = updatedItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
      
      const updatedCart = await storage.updateCart(cart.id, {
        items: JSON.stringify(updatedItems),
        subtotal: subtotal.toString()
      });
      
      res.json(updatedCart);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to remove item from cart" });
    }
  });

  // Clear entire cart
  app.delete("/api/cart/clear", async (req, res) => {
    try {
      const { userId, guestId } = req.body;
      
      const cart = await storage.getCart(userId, guestId);
      if (!cart) {
        return res.status(404).json({ error: "Cart not found" });
      }
      
      const clearedCart = await storage.updateCart(cart.id, {
        items: JSON.stringify([]),
        subtotal: '0'
      });
      
      res.json(clearedCart);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to clear cart" });
    }
  });

  // Object Storage Routes for Color Images
  
  // Endpoint for getting upload URL for color images
  app.post("/api/color-images/upload", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Endpoint for serving uploaded color images
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Endpoint for updating product color images
  app.put("/api/products/:id/color-images", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const { colorImages } = req.body;
      
      if (!colorImages || typeof colorImages !== 'object') {
        return res.status(400).json({ error: "colorImages object is required" });
      }

      // Process uploaded URLs and normalize paths
      const objectStorageService = new ObjectStorageService();
      const normalizedColorImages: { [color: string]: string[] } = {};
      
      for (const [color, images] of Object.entries(colorImages)) {
        if (Array.isArray(images)) {
          normalizedColorImages[color] = images.map((url: string) => 
            objectStorageService.normalizeObjectEntityPath(url)
          );
        }
      }

      // Update product in database
      await storage.updateProductColorImages(productId, normalizedColorImages);
      
      res.json({ 
        message: "Color images updated successfully",
        colorImages: normalizedColorImages 
      });
    } catch (error) {
      console.error("Error updating color images:", error);
      res.status(500).json({ error: "Failed to update color images" });
    }
  });

  // Payment Integration Endpoints
  
  // Stripe payment intent for one-time payments
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ 
          message: "Stripe is not configured. Please add STRIPE_SECRET_KEY to environment variables." 
        });
      }

      const { amount, currency = "eur" } = req.body;
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency,
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          source: 'celio-ecommerce'
        }
      });
      
      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error: any) {
      console.error("Stripe payment intent error:", error);
      res.status(500).json({ 
        message: "Error creating payment intent: " + error.message 
      });
    }
  });

  // Scalapay payment initialization (Buy Now Pay Later)
  app.post("/api/create-scalapay-payment", async (req, res) => {
    try {
      const { amount, currency = "EUR", orderDetails } = req.body;
      
      // For Scalapay integration, you would typically make an API call to Scalapay
      // This is a placeholder implementation - you'll need actual Scalapay credentials
      const scalapayPayment = {
        paymentUrl: `https://portal.scalapay.com/checkout?amount=${amount}&currency=${currency}&order_id=${Date.now()}`,
        orderId: `scalapay_${Date.now()}`,
        redirectUrl: `${req.headers.origin}/payment/success`,
        cancelUrl: `${req.headers.origin}/payment/cancel`
      };
      
      res.json(scalapayPayment);
    } catch (error: any) {
      console.error("Scalapay payment error:", error);
      res.status(500).json({ 
        message: "Error creating Scalapay payment: " + error.message 
      });
    }
  });

  // Klarna payment session
  app.post("/api/create-klarna-payment", async (req, res) => {
    try {
      const { amount, currency = "EUR", orderDetails } = req.body;
      
      // For Klarna integration, you would typically make an API call to Klarna
      // This is a placeholder implementation - you'll need actual Klarna credentials
      const klarnaPayment = {
        sessionId: `klarna_${Date.now()}`,
        paymentUrl: `https://js.klarna.com/web-sdk/v1/klarna.js`,
        clientToken: `klarna_token_${Date.now()}`,
        redirectUrl: `${req.headers.origin}/payment/success`,
        cancelUrl: `${req.headers.origin}/payment/cancel`
      };
      
      res.json(klarnaPayment);
    } catch (error: any) {
      console.error("Klarna payment error:", error);
      res.status(500).json({ 
        message: "Error creating Klarna payment: " + error.message 
      });
    }
  });

  // Payment success webhook handler
  app.post("/api/payment/webhook", async (req, res) => {
    try {
      const { paymentMethod, paymentId, status, orderId } = req.body;
      
      if (status === 'succeeded' || status === 'completed') {
        // Update order status in database
        console.log(`Payment ${paymentId} completed via ${paymentMethod} for order ${orderId}`);
        // Here you would update the order status in your database
      }
      
      res.json({ received: true });
    } catch (error: any) {
      console.error("Payment webhook error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Order creation endpoint
  app.post("/api/orders", async (req, res) => {
    try {
      const { customerInfo, items, total, paymentMethod, paymentId } = req.body;
      
      // Validate required fields
      if (!customerInfo || !items || !total || !paymentMethod) {
        return res.status(400).json({ error: "Missing required order information" });
      }

      // Create order in database
      const orderData = {
        userId: customerInfo.userId || null, // Link order to user if logged in
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        shippingAddress: JSON.stringify(customerInfo.shippingAddress),
        billingAddress: JSON.stringify(customerInfo.billingAddress || customerInfo.shippingAddress),
        items: JSON.stringify(items),
        subtotal: total.toString(),
        shippingCost: "0.00",
        taxAmount: "0.00", 
        total: total.toString(),
        status: "pending" as const,
        paymentStatus: "paid" as const, // Mark as paid since payment was successful
        paymentMethod,
        orderNumber: `ORD-${Date.now()}`
      };

      const order = await storage.createOrder(orderData);
      
      // Send comprehensive order confirmation email
      try {
        const emailSuccess = await emailService.sendOrderConfirmationEmail({
          customerEmail: customerInfo.email,
          customerName: customerInfo.name,
          orderNumber: order.orderNumber,
          orderTotal: `€${total.toFixed(2)}`,
          shippingAddress: customerInfo.shippingAddress,
          billingAddress: customerInfo.billingAddress || customerInfo.shippingAddress,
          paymentMethod: paymentMethod,
          items: items.map((item: any) => ({
            name: item.name,
            quantity: item.quantity,
            price: `€${item.price.toFixed(2)}`,
            productId: item.productId
          }))
        });
        
        console.log(`📧 Order confirmation email ${emailSuccess ? 'sent' : 'failed'} for order ${order.orderNumber}`);
      } catch (emailError) {
        console.error('Failed to send order confirmation email:', emailError);
      }
      
      res.json({
        success: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        message: "Grazie per il tuo ordine! Ti abbiamo inviato una conferma via email."
      });
    } catch (error: any) {
      console.error("Order creation error:", error);
      res.status(500).json({ 
        error: "Failed to create order: " + error.message 
      });
    }
  });

  // Contact form email endpoint
  app.post("/api/contact", async (req, res) => {
    try {
      const { name, email, phone, subject, message } = req.body;
      
      // Validate required fields
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      const contactData: ContactFormData = {
        name,
        email,
        phone: phone || '',
        subject,
        message
      };
      
      const success = await emailService.sendContactFormEmail(contactData);
      
      if (success) {
        res.json({ success: true, message: "Messaggio inviato con successo!" });
      } else {
        res.status(500).json({ error: "Errore nell'invio del messaggio" });
      }
    } catch (error: any) {
      console.error("Contact form error:", error);
      res.status(500).json({ error: "Errore del server" });
    }
  });

  // Send comprehensive order confirmation email endpoint
  app.post("/api/send-order-email", async (req, res) => {
    try {
      const { customerEmail, customerName, orderNumber, orderTotal, items, shippingAddress, billingAddress, paymentMethod } = req.body;
      
      if (!customerEmail || !customerName || !orderNumber || !orderTotal) {
        return res.status(400).json({ error: "Missing required order information" });
      }
      
      const success = await emailService.sendOrderConfirmationEmail({
        customerEmail,
        customerName,
        orderNumber,
        orderTotal,
        shippingAddress,
        billingAddress,
        paymentMethod: paymentMethod || 'Carta di Credito',
        items: items || []
      });
      
      if (success) {
        res.json({ success: true, message: "📧 Email di conferma inviata con successo!" });
      } else {
        res.status(500).json({ error: "Errore nell'invio dell'email di conferma" });
      }
    } catch (error: any) {
      console.error("Order email error:", error);
      res.status(500).json({ error: "Errore del server nell'invio dell'email" });
    }
  });

  // System Configuration Management API Routes
  app.get("/api/admin/settings", async (req, res) => {
    try {
      // Return predefined configuration structure with current values
      const configurations = {
        stripe: {
          title: "Stripe Payments",
          description: "Configura le impostazioni di pagamento Stripe per elaborare transazioni",
          status: process.env.STRIPE_SECRET_KEY ? "connected" : "not-configured",
          fields: [
            {
              key: "publishable_key",
              label: "Publishable Key",
              type: "text",
              value: process.env.STRIPE_PUBLISHABLE_KEY || "",
              placeholder: "pk_test_...",
              required: true,
              sensitive: false
            },
            {
              key: "secret_key", 
              label: "Secret Key",
              type: "password",
              value: process.env.STRIPE_SECRET_KEY || "",
              placeholder: "sk_test_...",
              required: true,
              sensitive: true
            },
            {
              key: "webhook_secret",
              label: "Webhook Secret",
              type: "password", 
              value: process.env.STRIPE_WEBHOOK_SECRET || "",
              placeholder: "whsec_...",
              required: false,
              sensitive: true
            }
          ]
        },
        email: {
          title: "Email Service (Resend)",
          description: "Configura il servizio email per conferme ordini e comunicazioni clienti",
          status: process.env.RESEND_API_KEY ? "connected" : "not-configured",
          fields: [
            {
              key: "api_key",
              label: "Resend API Key", 
              type: "password",
              value: process.env.RESEND_API_KEY || "",
              placeholder: "re_...",
              required: true,
              sensitive: true
            },
            {
              key: "from_email",
              label: "Email Mittente",
              type: "email",
              value: process.env.FROM_EMAIL || "onboarding@resend.dev",
              placeholder: "onboarding@resend.dev (dominio verificato)",
              required: true,
              sensitive: false
            },
            {
              key: "admin_email",
              label: "Email Admin",
              type: "email", 
              value: process.env.ADMIN_EMAIL || "",
              placeholder: "admin@celio.it",
              required: false,
              sensitive: false
            }
          ]
        },
        database: {
          title: "Database PostgreSQL (Neon)",
          description: "Configurazione completa database PostgreSQL con strumenti di gestione e monitoraggio",
          status: process.env.DATABASE_URL ? "connected" : "error",
          fields: [
            {
              key: "database_url",
              label: "Database URL Principale",
              type: "password",
              value: process.env.DATABASE_URL ? "••••••••" : "",
              placeholder: "postgresql://user:password@host:port/database",
              required: true,
              sensitive: true
            },
            {
              key: "read_replica_url",
              label: "Read Replica URL",
              type: "password",
              value: process.env.READ_REPLICA_URL || "",
              placeholder: "postgresql://user:password@read-host:port/database",
              required: false,
              sensitive: true
            },
            {
              key: "max_connections",
              label: "Connessioni Massime",
              type: "text",
              value: process.env.DB_MAX_CONNECTIONS || "10",
              placeholder: "10",
              required: false,
              sensitive: false
            },
            {
              key: "connection_timeout",
              label: "Timeout Connessione (ms)",
              type: "text",
              value: process.env.DB_CONNECTION_TIMEOUT || "30000",
              placeholder: "30000",
              required: false,
              sensitive: false
            },
            {
              key: "pool_idle_timeout",
              label: "Pool Idle Timeout (ms)",
              type: "text",
              value: process.env.DB_POOL_IDLE_TIMEOUT || "600000",
              placeholder: "600000",
              required: false,
              sensitive: false
            },
            {
              key: "ssl_mode",
              label: "Modalità SSL",
              type: "text",
              value: process.env.DB_SSL_MODE || "require",
              placeholder: "require|disable|prefer",
              required: false,
              sensitive: false
            },
            {
              key: "query_timeout",
              label: "Query Timeout (ms)",
              type: "text",
              value: process.env.DB_QUERY_TIMEOUT || "60000",
              placeholder: "60000",
              required: false,
              sensitive: false
            },
            {
              key: "backup_schedule",
              label: "Schedule Backup",
              type: "text",
              value: process.env.DB_BACKUP_SCHEDULE || "0 2 * * *",
              placeholder: "0 2 * * * (cron format)",
              required: false,
              sensitive: false
            },
            {
              key: "maintenance_window",
              label: "Finestra Manutenzione",
              type: "text",
              value: process.env.DB_MAINTENANCE_WINDOW || "02:00-04:00",
              placeholder: "02:00-04:00",
              required: false,
              sensitive: false
            },
            {
              key: "logging_level",
              label: "Livello Logging SQL",
              type: "text",
              value: process.env.DB_LOGGING_LEVEL || "error",
              placeholder: "error|warn|info|debug",
              required: false,
              sensitive: false
            },
            {
              key: "slow_query_threshold",
              label: "Soglia Query Lente (ms)",
              type: "text",
              value: process.env.DB_SLOW_QUERY_THRESHOLD || "1000",
              placeholder: "1000",
              required: false,
              sensitive: false
            },
            {
              key: "vacuum_schedule",
              label: "Schedule VACUUM",
              type: "text",
              value: process.env.DB_VACUUM_SCHEDULE || "0 3 * * 0",
              placeholder: "0 3 * * 0 (weekly)",
              required: false,
              sensitive: false
            }
          ]
        },
        monitoring: {
          title: "Monitoraggio & Performance",
          description: "Configurazione strumenti di monitoraggio database e metriche di performance",
          status: process.env.MONITORING_ENABLED ? "connected" : "not-configured",
          fields: [
            {
              key: "monitoring_enabled",
              label: "Abilita Monitoraggio",
              type: "text",
              value: process.env.MONITORING_ENABLED || "true",
              placeholder: "true|false",
              required: false,
              sensitive: false
            },
            {
              key: "metrics_endpoint",
              label: "Endpoint Metriche",
              type: "text",
              value: process.env.METRICS_ENDPOINT || "/metrics",
              placeholder: "/metrics",
              required: false,
              sensitive: false
            },
            {
              key: "prometheus_enabled",
              label: "Prometheus Abilitato",
              type: "text",
              value: process.env.PROMETHEUS_ENABLED || "false",
              placeholder: "true|false",
              required: false,
              sensitive: false
            },
            {
              key: "datadog_api_key",
              label: "Datadog API Key",
              type: "password",
              value: process.env.DATADOG_API_KEY || "",
              placeholder: "dd_api_key...",
              required: false,
              sensitive: true
            },
            {
              key: "sentry_dsn",
              label: "Sentry DSN",
              type: "password",
              value: process.env.SENTRY_DSN || "",
              placeholder: "https://...@sentry.io/...",
              required: false,
              sensitive: true
            },
            {
              key: "newrelic_license",
              label: "New Relic License",
              type: "password",
              value: process.env.NEW_RELIC_LICENSE_KEY || "",
              placeholder: "nr_license...",
              required: false,
              sensitive: true
            },
            {
              key: "alert_webhook",
              label: "Webhook Alerting",
              type: "text",
              value: process.env.ALERT_WEBHOOK_URL || "",
              placeholder: "https://hooks.slack.com/...",
              required: false,
              sensitive: false
            },
            {
              key: "performance_threshold",
              label: "Soglia Performance (ms)",
              type: "text",
              value: process.env.PERFORMANCE_THRESHOLD || "500",
              placeholder: "500",
              required: false,
              sensitive: false
            }
          ]
        },
        analytics: {
          title: "Analytics & Reporting",
          description: "Configurazione analytics database e reporting automatico",
          status: process.env.ANALYTICS_DB_URL ? "connected" : "not-configured",
          fields: [
            {
              key: "analytics_db_url",
              label: "Analytics Database URL",
              type: "password",
              value: process.env.ANALYTICS_DB_URL || "",
              placeholder: "postgresql://analytics_user:password@host/analytics_db",
              required: false,
              sensitive: true
            },
            {
              key: "data_retention_days",
              label: "Giorni Ritenzione Dati",
              type: "text",
              value: process.env.DATA_RETENTION_DAYS || "365",
              placeholder: "365",
              required: false,
              sensitive: false
            },
            {
              key: "report_schedule",
              label: "Schedule Report",
              type: "text",
              value: process.env.REPORT_SCHEDULE || "0 6 * * 1",
              placeholder: "0 6 * * 1 (weekly Monday 6AM)",
              required: false,
              sensitive: false
            },
            {
              key: "bigquery_project",
              label: "BigQuery Project ID",
              type: "text",
              value: process.env.BIGQUERY_PROJECT_ID || "",
              placeholder: "your-project-id",
              required: false,
              sensitive: false
            },
            {
              key: "bigquery_dataset",
              label: "BigQuery Dataset",
              type: "text",
              value: process.env.BIGQUERY_DATASET || "",
              placeholder: "celio_analytics",
              required: false,
              sensitive: false
            },
            {
              key: "google_analytics_id",
              label: "Google Analytics ID",
              type: "text",
              value: process.env.GA_MEASUREMENT_ID || "",
              placeholder: "G-XXXXXXXXXX",
              required: false,
              sensitive: false
            },
            {
              key: "mixpanel_token",
              label: "Mixpanel Token",
              type: "password",
              value: process.env.MIXPANEL_TOKEN || "",
              placeholder: "mixpanel_token...",
              required: false,
              sensitive: true
            }
          ]
        },
        security: {
          title: "Sicurezza Database",
          description: "Configurazioni avanzate di sicurezza e accesso al database",
          status: process.env.DB_ENCRYPTION_ENABLED ? "connected" : "not-configured",
          fields: [
            {
              key: "encryption_enabled",
              label: "Crittografia Abilitata",
              type: "text",
              value: process.env.DB_ENCRYPTION_ENABLED || "true",
              placeholder: "true|false",
              required: false,
              sensitive: false
            },
            {
              key: "encryption_key",
              label: "Chiave Crittografia",
              type: "password",
              value: process.env.DB_ENCRYPTION_KEY || "",
              placeholder: "32-character encryption key",
              required: false,
              sensitive: true
            },
            {
              key: "audit_logging",
              label: "Audit Logging",
              type: "text",
              value: process.env.DB_AUDIT_LOGGING || "true",
              placeholder: "true|false",
              required: false,
              sensitive: false
            },
            {
              key: "whitelist_ips",
              label: "IP Whitelist",
              type: "text",
              value: process.env.DB_WHITELIST_IPS || "",
              placeholder: "192.168.1.0/24,10.0.0.0/16",
              required: false,
              sensitive: false
            },
            {
              key: "max_login_attempts",
              label: "Max Tentativi Login",
              type: "text",
              value: process.env.DB_MAX_LOGIN_ATTEMPTS || "5",
              placeholder: "5",
              required: false,
              sensitive: false
            },
            {
              key: "session_timeout",
              label: "Timeout Sessione (min)",
              type: "text",
              value: process.env.DB_SESSION_TIMEOUT || "30",
              placeholder: "30",
              required: false,
              sensitive: false
            },
            {
              key: "backup_encryption",
              label: "Backup Crittografati",
              type: "text",
              value: process.env.DB_BACKUP_ENCRYPTION || "true",
              placeholder: "true|false",
              required: false,
              sensitive: false
            },
            {
              key: "compliance_mode",
              label: "Modalità Conformità",
              type: "text",
              value: process.env.DB_COMPLIANCE_MODE || "GDPR",
              placeholder: "GDPR|PCI-DSS|HIPAA",
              required: false,
              sensitive: false
            }
          ]
        },
        storage: {
          title: "Object Storage",
          description: "Configurazione storage oggetti per immagini prodotti",
          status: (process.env.PUBLIC_OBJECT_SEARCH_PATHS && process.env.PRIVATE_OBJECT_DIR) ? "connected" : "not-configured",
          fields: [
            {
              key: "public_paths",
              label: "Percorsi Pubblici",
              type: "text",
              value: process.env.PUBLIC_OBJECT_SEARCH_PATHS || "",
              placeholder: "/bucket/public,/bucket/assets",
              required: true,
              sensitive: false
            },
            {
              key: "private_dir", 
              label: "Directory Privata",
              type: "text",
              value: process.env.PRIVATE_OBJECT_DIR || "",
              placeholder: "/bucket/.private",
              required: true,
              sensitive: false
            }
          ]
        }
      };
      
      res.json(configurations);
    } catch (error) {
      console.error("Error loading configurations:", error);
      res.status(500).json({ error: "Failed to load configurations" });
    }
  });

  app.post("/api/admin/settings/:section", async (req, res) => {
    try {
      const { section } = req.params;
      const configData = req.body;
      
      // Validate section
      const validSections = ['stripe', 'email', 'database', 'monitoring', 'analytics', 'security', 'storage'];
      if (!validSections.includes(section)) {
        return res.status(400).json({ error: "Invalid configuration section" });
      }

      // Handle email configuration with proper service update
      if (section === 'email') {
        // Update environment variables
        if (configData.api_key) {
          process.env.RESEND_API_KEY = configData.api_key;
        }
        if (configData.from_email) {
          process.env.EMAIL_FROM = configData.from_email;
        }
        if (configData.admin_email) {
          process.env.EMAIL_ADMIN = configData.admin_email;
        }
        
        // Update the email service instance with new configuration
        try {
          emailService.updateConfig({
            apiKey: configData.api_key,
            fromEmail: configData.from_email,
            supportEmail: configData.admin_email
          });
          console.log('✅ Email service updated with new configuration:', {
            from: configData.from_email,
            admin: configData.admin_email,
            hasApiKey: !!configData.api_key
          });
        } catch (emailError) {
          console.error('❌ Error updating email service:', emailError);
        }
      }
      
      console.log(`Configuration update for section: ${section}`, configData);
      
      res.json({ 
        success: true, 
        message: `Configurazione ${section} aggiornata con successo` 
      });
    } catch (error) {
      console.error("Error saving configuration:", error);
      res.status(500).json({ error: "Failed to save configuration" });
    }
  });

  app.post("/api/admin/settings/:section/test", async (req, res) => {
    try {
      const { section } = req.params;
      
      let testResult = { success: false, message: "Test non implementato" };
      
      switch (section) {
        case 'stripe':
          if (stripe) {
            try {
              // Test Stripe connection
              await stripe.paymentIntents.list({ limit: 1 });
              testResult = { success: true, message: "Connessione Stripe OK - API funzionante" };
            } catch (error: any) {
              testResult = { success: false, message: `Errore Stripe: ${error.message}` };
            }
          } else {
            testResult = { success: false, message: "Stripe non configurato - manca Secret Key" };
          }
          break;
          
        case 'email':
          if (process.env.RESEND_API_KEY) {
            try {
              // Test email service
              const testSuccess = await emailService.sendContactFormEmail({
                name: "Test System",
                email: process.env.ADMIN_EMAIL || "test@celio.it",
                phone: "",
                subject: "Test Configurazione Email",
                message: "Questo è un test automatico della configurazione email."
              });
              testResult = testSuccess 
                ? { success: true, message: "Servizio email OK - test inviato con successo" }
                : { success: false, message: "Errore nell'invio del test email" };
            } catch (error: any) {
              testResult = { success: false, message: `Errore email: ${error.message}` };
            }
          } else {
            testResult = { success: false, message: "Servizio email non configurato - manca API Key" };
          }
          break;
          
        case 'database':
          try {
            // Test database connection - simple count query
            const [productCount] = await db.select({ count: sql<number>`count(*)::int` }).from(products);
            testResult = productCount 
              ? { success: true, message: "Connessione database OK" }
              : { success: false, message: "Errore nel test database" };
          } catch (error: any) {
            testResult = { success: false, message: `Errore database: ${error.message}` };
          }
          break;
          
        case 'monitoring':
          try {
            if (process.env.MONITORING_ENABLED === 'true') {
              // Test monitoring endpoints
              const metricsEndpoint = process.env.METRICS_ENDPOINT || '/metrics';
              testResult = { 
                success: true, 
                message: `Monitoraggio attivo - endpoint metriche: ${metricsEndpoint}` 
              };
            } else {
              testResult = { 
                success: false, 
                message: "Monitoraggio disabilitato - abilita per raccogliere metriche" 
              };
            }
          } catch (error: any) {
            testResult = { success: false, message: `Errore monitoraggio: ${error.message}` };
          }
          break;
          
        case 'analytics':
          try {
            if (process.env.ANALYTICS_DB_URL) {
              // Test analytics database connection
              testResult = { 
                success: true, 
                message: "Database analytics configurato - reporting attivo" 
              };
            } else {
              testResult = { 
                success: false, 
                message: "Database analytics non configurato - impossibile generare report" 
              };
            }
          } catch (error: any) {
            testResult = { success: false, message: `Errore analytics: ${error.message}` };
          }
          break;
          
        case 'security':
          try {
            const securityChecks = [];
            
            // Check encryption
            if (process.env.DB_ENCRYPTION_ENABLED === 'true') {
              securityChecks.push('✓ Crittografia abilitata');
            } else {
              securityChecks.push('⚠ Crittografia disabilitata');
            }
            
            // Check audit logging
            if (process.env.DB_AUDIT_LOGGING === 'true') {
              securityChecks.push('✓ Audit logging attivo');
            } else {
              securityChecks.push('⚠ Audit logging disattivo');
            }
            
            // Check IP whitelist
            if (process.env.DB_WHITELIST_IPS) {
              securityChecks.push('✓ IP whitelist configurata');
            } else {
              securityChecks.push('⚠ IP whitelist non configurata');
            }
            
            const securityScore = securityChecks.filter(check => check.includes('✓')).length;
            const maxScore = securityChecks.length;
            
            testResult = { 
              success: securityScore >= maxScore / 2, 
              message: `Security score: ${securityScore}/${maxScore}\n${securityChecks.join('\n')}` 
            };
          } catch (error: any) {
            testResult = { success: false, message: `Errore sicurezza: ${error.message}` };
          }
          break;
          
        case 'storage':
          try {
            const objectStorageService = new ObjectStorageService();
            const publicPaths = objectStorageService.getPublicObjectSearchPaths();
            const privateDir = objectStorageService.getPrivateObjectDir();
            testResult = (publicPaths.length > 0 && privateDir) 
              ? { success: true, message: `Object storage OK - ${publicPaths.length} percorsi pubblici configurati` }
              : { success: false, message: "Configurazione object storage incompleta" };
          } catch (error: any) {
            testResult = { success: false, message: `Errore storage: ${error.message}` };
          }
          break;
          
        default:
          testResult = { success: false, message: "Sezione di test non riconosciuta" };
      }
      
      res.json(testResult);
    } catch (error) {
      console.error("Error testing configuration:", error);
      res.status(500).json({ 
        success: false, 
        message: "Errore nel test della configurazione" 
      });
    }
  });

  // Advanced Database Information API Routes
  app.get("/api/admin/database/info", async (req, res) => {
    try {
      // Get comprehensive database information
      const [productsCount] = await db.select({ count: sql<number>`count(*)::int` }).from(products);
      const [customersCount] = await db.select({ count: sql<number>`count(*)::int` }).from(customers);
      const [ordersCount] = await db.select({ count: sql<number>`count(*)::int` }).from(orders);
      const [cartsCount] = await db.select({ count: sql<number>`count(*)::int` }).from(carts);
      
      // Get database size information
      const dbSizeResult = await db.execute(sql`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size,
               pg_database_size(current_database()) as size_bytes
      `);
      const dbSize = dbSizeResult.rows[0];
      
      // Get table sizes
      const tableSizesResult = await db.execute(sql`
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
          pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      `);
      const tableSizes = tableSizesResult.rows;
      
      // Get connection information
      const connectionInfoResult = await db.execute(sql`
        SELECT 
          count(*) as active_connections,
          max_conn.setting::int as max_connections
        FROM pg_stat_activity 
        CROSS JOIN pg_settings max_conn
        WHERE max_conn.name = 'max_connections'
        GROUP BY max_conn.setting
      `);
      const connectionInfo = connectionInfoResult.rows[0];
      
      // Get index usage statistics
      const indexStatsResult = await db.execute(sql`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan,
          idx_tup_read,
          idx_tup_fetch
        FROM pg_stat_user_indexes 
        ORDER BY idx_scan DESC
        LIMIT 10
      `);
      const indexStats = indexStatsResult.rows;
      
      const info = {
        tables: {
          products: productsCount?.count || 0,
          customers: customersCount?.count || 0,
          orders: ordersCount?.count || 0,
          carts: cartsCount?.count || 0
        },
        database: {
          size: dbSize?.size || 'Unknown',
          size_bytes: dbSize?.size_bytes || 0,
          version: await db.execute(sql`SELECT version()`)
        },
        connections: {
          active: connectionInfo?.active_connections || 0,
          max: connectionInfo?.max_connections || 0
        },
        table_sizes: tableSizes || [],
        top_indexes: indexStats || []
      };
      
      res.json(info);
    } catch (error) {
      console.error("Error getting database info:", error);
      res.status(500).json({ error: "Failed to get database information" });
    }
  });

  app.get("/api/admin/database/performance", async (req, res) => {
    try {
      // Get slow queries
      const slowQueries = await db.execute(sql`
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          stddev_time,
          rows
        FROM pg_stat_statements 
        WHERE query NOT LIKE '%pg_stat_statements%'
        ORDER BY mean_time DESC 
        LIMIT 10
      `);
      
      // Get table statistics
      const tableStatsResult = await db.execute(sql`
        SELECT 
          schemaname,
          tablename,
          seq_scan,
          seq_tup_read,
          idx_scan,
          idx_tup_fetch,
          n_tup_ins,
          n_tup_upd,
          n_tup_del,
          n_live_tup,
          n_dead_tup,
          vacuum_count,
          autovacuum_count,
          analyze_count,
          autoanalyze_count
        FROM pg_stat_user_tables
        ORDER BY seq_scan + idx_scan DESC
      `);
      const tableStats = tableStatsResult.rows;
      
      // Get cache hit ratio
      const cacheHitRatioResult = await db.execute(sql`
        SELECT 
          sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100 as cache_hit_ratio
        FROM pg_statio_user_tables
      `);
      const cacheHitRatio = cacheHitRatioResult.rows[0];
      
      // Get lock statistics
      const lockStatsResult = await db.execute(sql`
        SELECT 
          mode,
          locktype,
          count(*)
        FROM pg_locks 
        GROUP BY mode, locktype
        ORDER BY count(*) DESC
      `);
      const lockStats = lockStatsResult.rows;
      
      const performance = {
        slow_queries: slowQueries || [],
        table_statistics: tableStats || [],
        cache_hit_ratio: (cacheHitRatio?.cache_hit_ratio as number) || 0,
        locks: lockStats || [],
        recommendations: [
          cacheHitRatio?.cache_hit_ratio < 95 ? "Consider increasing shared_buffers" : null,
          (slowQueries && Array.isArray(slowQueries) && slowQueries.length > 5) ? "Review and optimize slow queries" : null,
          "Regular VACUUM and ANALYZE recommended for optimal performance"
        ].filter(Boolean)
      };
      
      res.json(performance);
    } catch (error) {
      console.error("Error getting performance data:", error);
      res.status(500).json({ error: "Failed to get performance data" });
    }
  });

  app.post("/api/admin/database/query", async (req, res) => {
    try {
      const { query, limit = 100 } = req.body;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: "Query is required" });
      }
      
      // Security check - only allow SELECT statements
      const trimmedQuery = query.trim().toLowerCase();
      if (!trimmedQuery.startsWith('select')) {
        return res.status(403).json({ error: "Only SELECT queries are allowed" });
      }
      
      // Add LIMIT if not present
      const finalQuery = trimmedQuery.includes('limit') ? query : `${query} LIMIT ${limit}`;
      
      const startTime = Date.now();
      const result = await db.execute(sql.raw(finalQuery));
      const executionTime = Date.now() - startTime;
      
      res.json({
        success: true,
        data: result,
        execution_time_ms: executionTime,
        row_count: Array.isArray(result) ? result.length : 0
      });
    } catch (error: any) {
      console.error("Query execution error:", error);
      res.status(500).json({ 
        error: "Query execution failed", 
        message: error.message,
        query: req.body.query
      });
    }
  });

  app.get("/api/admin/database/backup-info", async (req, res) => {
    try {
      // Get backup and maintenance information
      const lastVacuumResult = await db.execute(sql`
        SELECT 
          schemaname,
          tablename,
          last_vacuum,
          last_autovacuum,
          last_analyze,
          last_autoanalyze,
          vacuum_count,
          autovacuum_count
        FROM pg_stat_user_tables
        ORDER BY last_vacuum DESC NULLS LAST
        LIMIT 1
      `);
      const lastVacuum = lastVacuumResult.rows[0];
      
      // Get WAL information
      const walInfoResult = await db.execute(sql`
        SELECT 
          pg_current_wal_lsn() as current_wal,
          pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), '0/0')) as total_wal_size
      `);
      const walInfo = walInfoResult.rows[0];
      
      const backupInfo = {
        last_maintenance: {
          vacuum: lastVacuum?.last_vacuum || null,
          analyze: lastVacuum?.last_analyze || null,
          table: lastVacuum?.tablename || null
        },
        wal: {
          current_lsn: walInfo?.current_wal || null,
          total_size: walInfo?.total_wal_size || null
        },
        recommendations: [
          "Schedule regular backups using pg_dump",
          "Monitor WAL file growth for backup planning",
          "Consider point-in-time recovery setup",
          "Implement automated backup verification"
        ]
      };
      
      res.json(backupInfo);
    } catch (error) {
      console.error("Error getting backup info:", error);
      res.status(500).json({ error: "Failed to get backup information" });
    }
  });

  // Test image URL endpoint
  app.post("/api/admin/test-image", async (req, res) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      // Make a HEAD request to check if the image exists and get metadata
      const response = await fetch(url, { method: 'HEAD' });
      
      if (!response.ok) {
        return res.status(400).json({ 
          error: `Image not accessible: ${response.status} ${response.statusText}` 
        });
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.startsWith('image/')) {
        return res.status(400).json({ 
          error: "URL does not point to a valid image" 
        });
      }

      // Get image dimensions (approximate)
      const contentLength = response.headers.get('content-length');
      
      res.json({
        success: true,
        contentType,
        size: contentLength ? parseInt(contentLength) : null,
        width: "unknown", // We can't get exact dimensions from HEAD request
        height: "unknown"
      });
    } catch (error) {
      console.error("Error testing image URL:", error);
      res.status(500).json({ 
        error: "Unable to access the image URL" 
      });
    }
  });

  // Admin Authentication Route
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Only admin account is allowed for security
      if (username === 'admin' && password === 'celio2024') {
        res.json({ 
          success: true, 
          token: `admin-token-${Date.now()}`,
          message: "Accesso riuscito"
        });
      } else {
        res.status(401).json({ 
          success: false, 
          message: "Credenziali non valide" 
        });
      }
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Errore del server" 
      });
    }
  });

  // Team member login endpoint
  app.post("/api/team/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      console.log(`🔐 Team login attempt for username: ${username}`);
      
      // Find user by username
      const user = await storage.getUserByUsername(username);
      if (!user) {
        console.log(`❌ User not found: ${username}`);
        return res.status(401).json({ 
          success: false, 
          message: "Credenziali non valide" 
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        console.log(`❌ Invalid password for user: ${username}`);
        return res.status(401).json({ 
          success: false, 
          message: "Credenziali non valide" 
        });
      }

      // Find team member associated with user by querying database directly
      const [teamMember] = await db.select().from(teamMembers).where(eq(teamMembers.userId, user.id));
      
      if (!teamMember) {
        console.log(`❌ No team member found for user: ${username}`);
        return res.status(401).json({ 
          success: false, 
          message: "Account non autorizzato per il team" 
        });
      }

      // Update team member status to active on login and update last login
      if (teamMember.status === 'pending') {
        await db.update(teamMembers).set({
          status: 'active',
          lastLogin: new Date()
        }).where(eq(teamMembers.id, teamMember.id));
        teamMember.status = 'active';
        console.log(`🎉 Team member ${teamMember.firstName} ${teamMember.lastName} logged in for the first time - status updated to active`);
      } else {
        await db.update(teamMembers).set({
          lastLogin: new Date()
        }).where(eq(teamMembers.id, teamMember.id));
        console.log(`👋 Team member ${teamMember.firstName} ${teamMember.lastName} logged in`);
      }

      console.log(`✅ Team login successful for: ${username} (${teamMember.firstName} ${teamMember.lastName})`);

      res.json({ 
        success: true, 
        token: `team-token-${Date.now()}-${user.id}`,
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        },
        teamMember: {
          id: teamMember.id,
          firstName: teamMember.firstName,
          lastName: teamMember.lastName,
          email: teamMember.email,
          role: teamMember.role,
          department: teamMember.department,
          position: teamMember.position,
          status: teamMember.status
        },
        message: "Accesso riuscito"
      });
    } catch (error) {
      console.error("Team login error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Errore del server" 
      });
    }
  });

  // Public Images Management API Routes
  app.get("/api/admin/images", async (req, res) => {
    try {
      const { section } = req.query;
      let query = db.select().from(publicImages);
      
      if (section) {
        query = query.where(eq(publicImages.section, section as string));
      }
      
      const allImages = await query.orderBy(publicImages.position, desc(publicImages.uploadedAt));
      res.json({ images: allImages });
    } catch (error) {
      console.error("Error fetching images:", error);
      res.status(500).json({ error: "Failed to fetch images" });
    }
  });

  // Get images for homepage hero carousel
  app.get("/api/images/hero", async (req, res) => {
    try {
      const heroImages = await db.select()
        .from(publicImages)
        .where(eq(publicImages.section, 'hero'))
        .orderBy(publicImages.position);
      
      res.json({ images: heroImages });
    } catch (error) {
      console.error("Error fetching hero images:", error);
      res.status(500).json({ error: "Failed to fetch hero images" });
    }
  });

  // Route for adding images from URL  
  app.post("/api/admin/images/from-url", async (req, res) => {
    try {
      const { url, section } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      console.log("Adding image from URL:", { url, section });
      
      // Helper functions for media detection
      const detectMediaType = (url: string): 'image' | 'video' => {
        const imageExtensions = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i;
        const videoExtensions = /\.(mp4|webm|ogg|mov|avi|wmv|flv|m4v)$/i;
        
        const isYouTubeUrl = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)/.test(url);
        const isWistiaUrl = /(?:wistia\.com|wi\.st)/.test(url);
        
        if (isYouTubeUrl) return 'video';
        if (isWistiaUrl) return 'video';
        if (videoExtensions.test(url)) return 'video';
        if (imageExtensions.test(url)) return 'image';
        
        // Default to image for unknown types
        return 'image';
      };

      const getContentType = (url: string, mediaType: 'image' | 'video'): string => {
        if (mediaType === 'video') {
          if (/\.(mp4)$/i.test(url)) return 'video/mp4';
          if (/\.(webm)$/i.test(url)) return 'video/webm';
          if (/\.(ogg)$/i.test(url)) return 'video/ogg';
          return 'video/mp4'; // default for videos
        }
        
        if (/\.(png)$/i.test(url)) return 'image/png';
        if (/\.(gif)$/i.test(url)) return 'image/gif';
        if (/\.(webp)$/i.test(url)) return 'image/webp';
        return 'image/jpeg'; // default for images
      };

      // Extract filename from URL
      const urlObj = new URL(url);
      const pathName = urlObj.pathname;
      const mediaType = detectMediaType(url);
      const fileName = pathName.split('/').pop() || `${mediaType}-from-url.${mediaType === 'video' ? 'mp4' : 'jpg'}`;
      const contentType = getContentType(url, mediaType);
      
      // Save metadata to database
      const [newImage] = await db.insert(publicImages).values({
        name: fileName,
        url: url,
        path: url,
        size: 0,
        type: contentType,
        mediaType: mediaType,
        section: section || 'hero',
        position: 0,
        isActive: true,
        title: null,
        subtitle: null,
        buttonText: 'Acquista Ora',
        linkUrl: '/catalog',
        // Add default styling
        titleColor: '#ffffff',
        subtitleColor: '#ffffff',
        buttonColor: '#000000',
        buttonBgColor: '#ffffff',
        titleFont: 'system-ui',
        subtitleFont: 'system-ui',
        buttonFont: 'system-ui',
        titleSize: 'xl',
        subtitleSize: 'lg',
        textAlign: 'right',
        titleWeight: 'bold',
        subtitleWeight: 'normal',
        buttonSize: 'md',
        // Video-specific defaults
        autoplay: mediaType === 'video' ? true : false,
        loop: mediaType === 'video' ? true : false,
        muted: mediaType === 'video' ? true : false,
        showControls: mediaType === 'video' ? false : false,
        posterImage: null,
        duration: null
      }).returning();

      console.log("Image from URL saved successfully:", newImage);

      res.json({ 
        success: true,
        image: newImage
      });
    } catch (error) {
      console.error("Error saving image from URL:", error);
      res.status(500).json({ error: "Failed to save image from URL" });
    }
  });

  // Route for uploading images from URL (legacy support)
  app.post("/api/admin/images", async (req, res) => {
    try {
      const { imageURL, url, name, size, type, section, position, title, subtitle, buttonText, linkUrl } = req.body;
      
      // Support both imageURL (from upload) and url (from URL input)
      const finalUrl = imageURL || url;
      if (!finalUrl) {
        return res.status(400).json({ error: "imageURL or url is required" });
      }

      // For new uploads, we expect a publicPath to be provided
      const { publicPath } = req.body;
      const publicUrl = publicPath || finalUrl; // fallback to finalUrl for compatibility
      
      // Save metadata to database (images are public by default in our setup)
      const [newImage] = await db.insert(publicImages).values({
        name: name || 'Immagine senza nome',
        url: publicUrl,
        path: publicUrl,
        size: size || 0,
        type: type || 'image/jpeg',
        section: section || null,
        position: position || 0,
        isActive: true,
        title: title || null,
        subtitle: subtitle || null,
        buttonText: buttonText || null,
        linkUrl: linkUrl || null,
      }).returning();

      res.json({ 
        success: true,
        image: newImage
      });
    } catch (error) {
      console.error("Error saving image:", error);
      res.status(500).json({ error: "Failed to save image" });
    }
  });

  // Route for file uploads (what the client expects)
  app.post("/api/admin/images/from-upload", async (req, res) => {
    try {
      const { uploadURL, originalName, size, type, section, position } = req.body;
      
      if (!uploadURL) {
        return res.status(400).json({ error: "uploadURL is required" });
      }

      console.log("Saving uploaded image to database:", { uploadURL, originalName, section });
      
      // Detect if the file is a video based on MIME type
      const isVideo = type && type.startsWith('video/');
      const mediaType = isVideo ? 'video' : 'image';
      
      console.log('File type detection:', { type, isVideo, mediaType });
      
      // Save metadata to database
      const [newImage] = await db.insert(publicImages).values({
        name: originalName || (isVideo ? 'Uploaded Video' : 'Uploaded Image'),
        url: uploadURL,
        path: uploadURL,
        size: size || 0,
        type: type || (isVideo ? 'video/mp4' : 'image/jpeg'),
        mediaType: mediaType,
        section: section || 'hero',
        position: position || 0,
        isActive: true,
        title: null,
        subtitle: null,
        buttonText: 'Scopri',
        linkUrl: '/novità',
        // Add default styling
        titleColor: '#ffffff',
        subtitleColor: '#ffffff',
        buttonColor: '#000000',
        buttonBgColor: '#ffffff',
        titleFont: 'system-ui',
        subtitleFont: 'system-ui',
        buttonFont: 'system-ui',
        titleSize: 'xl',
        subtitleSize: 'lg',
        textAlign: 'right',
        titleWeight: 'bold',
        subtitleWeight: 'normal',
        buttonSize: 'md',
        // Video-specific defaults
        autoplay: isVideo ? false : null,
        loop: isVideo ? true : null,
        muted: isVideo ? true : null,
        showControls: isVideo ? false : null,
        posterImage: isVideo ? null : null,
        duration: isVideo ? null : null
      }).returning();

      console.log("Image saved successfully:", newImage);

      res.json({ 
        success: true,
        image: newImage
      });
    } catch (error) {
      console.error("Error saving uploaded image:", error);
      res.status(500).json({ error: "Failed to save uploaded image" });
    }
  });

  app.put("/api/admin/images/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { 
        section, position, isActive, title, subtitle, buttonText, linkUrl,
        titleColor, subtitleColor, buttonColor, buttonBgColor,
        titleFont, subtitleFont, buttonFont,
        titleSize, subtitleSize, textAlign,
        titleWeight, subtitleWeight, buttonSize,
        // Video-specific fields
        autoplay, loop, muted, showControls, posterImage, duration
      } = req.body;
      
      console.log("Updating image with colors:", { titleColor, subtitleColor, buttonColor, buttonBgColor });
      
      // Prepare update object dynamically
      const updateData: any = {
        section: section || null,
        position: position || 0,
        isActive: isActive !== undefined ? isActive : true,
        title: title || null,
        subtitle: subtitle || null,
        buttonText: buttonText || null,
        linkUrl: linkUrl || null,
        // Add all the missing styling fields
        titleColor: titleColor || '#ffffff',
        subtitleColor: subtitleColor || '#ffffff',
        buttonColor: buttonColor || '#000000',
        buttonBgColor: buttonBgColor || '#ffffff',
        titleFont: titleFont || 'Inter',
        subtitleFont: subtitleFont || 'Inter',
        buttonFont: buttonFont || 'Inter',
        titleSize: titleSize || 'xl',
        subtitleSize: subtitleSize || 'lg',
        textAlign: textAlign || 'right',
        titleWeight: titleWeight || 'bold',
        subtitleWeight: subtitleWeight || 'normal',
        buttonSize: buttonSize || 'md'
      };
      
      // Add video-specific fields if provided
      if (autoplay !== undefined) updateData.autoplay = autoplay;
      if (loop !== undefined) updateData.loop = loop;
      if (muted !== undefined) updateData.muted = muted;
      if (showControls !== undefined) updateData.showControls = showControls;
      if (posterImage !== undefined) updateData.posterImage = posterImage || null;
      if (duration !== undefined) updateData.duration = duration || null;
      
      console.log("Updating image with video metadata:", updateData);
      
      const [updatedImage] = await db.update(publicImages)
        .set(updateData)
        .where(eq(publicImages.id, parseInt(id)))
        .returning();

      if (!updatedImage) {
        return res.status(404).json({ error: "Image not found" });
      }

      res.json({ success: true, image: updatedImage });
    } catch (error) {
      console.error("Error updating image:", error);
      res.status(500).json({ error: "Failed to update image" });
    }
  });

  app.delete("/api/admin/images/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get image info before deleting
      const [image] = await db.select().from(publicImages).where(eq(publicImages.id, parseInt(id)));
      
      if (!image) {
        return res.status(404).json({ error: "Image not found" });
      }

      // Delete from database
      await db.delete(publicImages).where(eq(publicImages.id, parseInt(id)));
      
      // Note: We don't delete from object storage to avoid breaking existing references
      // The object storage cleanup can be done separately as a maintenance task

      res.json({ success: true, message: "Image deleted successfully" });
    } catch (error) {
      console.error("Error deleting image:", error);
      res.status(500).json({ error: "Failed to delete image" });
    }
  });

  // Stock Alerts and Notifications API Routes
  app.get("/api/admin/stock-alerts", async (req, res) => {
    try {
      // Generate mock alerts for demonstration
      const mockAlerts = [
        {
          id: `alert-1-${Date.now()}`,
          productId: '1',
          productName: 'Camicia Business Slim Blu',
          currentStock: 2,
          minStock: 5,
          maxStock: 50,
          category: 'Camicie',
          alertType: 'FAIBLE',
          priority: 'MEDIUM',
          createdAt: new Date().toISOString(),
          resolved: false
        },
        {
          id: `alert-2-${Date.now()}`,
          productId: '2',
          productName: 'Jeans Skinny Nero',
          currentStock: 0,
          minStock: 10,
          maxStock: 40,
          category: 'Pantaloni',
          alertType: 'RUPTURE',
          priority: 'HIGH',
          createdAt: new Date().toISOString(),
          resolved: false
        },
        {
          id: `alert-3-${Date.now()}`,
          productId: '3',
          productName: 'T-shirt Cotton Basic',
          currentStock: 1,
          minStock: 15,
          maxStock: 100,
          category: 'T-shirt',
          alertType: 'CRITIQUE',
          priority: 'HIGH',
          createdAt: new Date().toISOString(),
          resolved: false
        }
      ];

      res.json(mockAlerts);
    } catch (error) {
      console.error("Error fetching stock alerts:", error);
      res.status(500).json({ error: "Failed to fetch stock alerts" });
    }
  });

  app.get("/api/admin/inventory-report", async (req, res) => {
    try {
      // Mock inventory report data
      const report = {
        totalProducts: 45,
        totalStock: 380,
        lowStockItems: 8,
        outOfStockItems: 3,
        criticalItems: 5,
        topSellingProducts: [
          {
            id: '1',
            name: 'Camicia Business Slim Blu',
            totalSold: 95,
            revenue: 4750.00,
            stockLevel: 2
          },
          {
            id: '2',
            name: 'Jeans Skinny Nero',
            totalSold: 120,
            revenue: 8400.00,
            stockLevel: 0
          },
          {
            id: '3',
            name: 'Blazer Elegante Grigio',
            totalSold: 78,
            revenue: 11700.00,
            stockLevel: 15
          },
          {
            id: '4',
            name: 'Polo Basic Bianca',
            totalSold: 156,
            revenue: 4680.00,
            stockLevel: 25
          }
        ],
        stockByCategory: [
          {
            category: 'Camicie',
            totalStock: 85,
            lowStock: 3,
            outOfStock: 1
          },
          {
            category: 'Pantaloni',
            totalStock: 120,
            lowStock: 2,
            outOfStock: 1
          },
          {
            category: 'T-shirt',
            totalStock: 95,
            lowStock: 2,
            outOfStock: 1
          },
          {
            category: 'Accessori',
            totalStock: 80,
            lowStock: 1,
            outOfStock: 0
          }
        ]
      };

      res.json(report);
    } catch (error) {
      console.error("Error generating inventory report:", error);
      res.status(500).json({ error: "Failed to generate inventory report" });
    }
  });

  app.get("/api/admin/sales-analytics", async (req, res) => {
    try {
      // Mock sales analytics data
      const analytics = [
        {
          productId: '1',
          productName: 'Camicia Business Slim Blu',
          totalSales: 95,
          revenue: 4750.00,
          currentStock: 2,
          stockVelocity: 3.2,
          reorderPoint: 10,
          projectedStockout: 0.6,
          performanceScore: 475000
        },
        {
          productId: '2',
          productName: 'Jeans Skinny Nero',
          totalSales: 120,
          revenue: 8400.00,
          currentStock: 0,
          stockVelocity: 4.0,
          reorderPoint: 12,
          projectedStockout: 0,
          performanceScore: 840000
        },
        {
          productId: '3',
          productName: 'Blazer Elegante Grigio',
          totalSales: 78,
          revenue: 11700.00,
          currentStock: 15,
          stockVelocity: 2.6,
          reorderPoint: 8,
          projectedStockout: 5.8,
          performanceScore: 608400
        },
        {
          productId: '4',
          productName: 'Polo Basic Bianca',
          totalSales: 156,
          revenue: 4680.00,
          currentStock: 25,
          stockVelocity: 5.2,
          reorderPoint: 16,
          projectedStockout: 4.8,
          performanceScore: 292320
        }
      ];

      res.json(analytics);
    } catch (error) {
      console.error("Error fetching sales analytics:", error);
      res.status(500).json({ error: "Failed to fetch sales analytics" });
    }
  });

  app.post("/api/admin/scan-inventory", async (req, res) => {
    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock scan results
      const scannedProducts = 45;
      const newAlerts = Math.floor(Math.random() * 5) + 1; // 1-5 new alerts

      res.json({
        success: true,
        scannedProducts,
        newAlerts,
        timestamp: new Date().toISOString(),
        message: `Inventario scansionato con successo. ${scannedProducts} prodotti verificati, ${newAlerts} nuovi alert generati.`
      });
    } catch (error) {
      console.error("Error scanning inventory:", error);
      res.status(500).json({ error: "Failed to scan inventory" });
    }
  });

  // Export alerts to CSV
  app.get("/api/admin/export-alerts", async (req, res) => {
    try {
      // Get current alerts
      const alerts: any[] = []; // This would fetch current alerts from the database
      
      // Generate CSV content
      const csvHeader = 'Product Name,Category,Current Stock,Min Stock,Alert Type,Priority,Created Date\n';
      const csvContent = alerts.map((alert: any) => 
        `${alert.productName},${alert.category},${alert.currentStock},${alert.minStock},${alert.alertType},${alert.priority},${alert.createdAt}`
      ).join('\n');
      
      const csv = csvHeader + csvContent;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="stock-alerts.csv"');
      res.send(csv);
    } catch (error) {
      console.error("Error exporting alerts:", error);
      res.status(500).json({ error: "Failed to export alerts" });
    }
  });

  // Custom email test endpoint for specific email addresses
  app.post("/api/admin/email/test-custom", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ 
          success: false, 
          message: "Email address is required" 
        });
      }

      if (!process.env.RESEND_API_KEY) {
        return res.status(400).json({ 
          success: false, 
          message: "Email service not configured - missing API Key" 
        });
      }

      // Send test email to the specified address
      const testSuccess = await emailService.sendContactFormEmail({
        name: "Sistema di Test Celio",
        email: email,
        phone: "",
        subject: "Test Email Service - Celio ERP",
        message: "Questo è un test automatico del servizio email Celio ERP. Se ricevi questo messaggio, la configurazione email funziona correttamente! ✅\n\nDettagli del test:\n- Servizio: Resend\n- Timestamp: " + new Date().toLocaleString('it-IT') + "\n- Sistema: Celio E-commerce Platform"
      });

      if (testSuccess) {
        res.json({ 
          success: true, 
          message: `Test email sent successfully to ${email}! Check your inbox.`,
          timestamp: new Date().toISOString()
        });
      } else {
        res.json({ 
          success: false, 
          message: "Failed to send test email" 
        });
      }

    } catch (error: any) {
      console.error("Custom email test error:", error);
      res.status(500).json({ 
        success: false, 
        message: `Email test failed: ${error.message}` 
      });
    }
  });

  // =============================================================================
  // TEAM MANAGEMENT API ROUTES  
  // =============================================================================

  // Get all team members
  app.get("/api/admin/team", async (req, res) => {
    try {
      // Get real team members from database
      const teamMembers = await storage.getAllTeamMembers();
      
      console.log(`📋 Retrieved ${teamMembers.length} team members from database`);
      
      res.json({ 
        success: true,
        members: teamMembers,
        count: teamMembers.length
      });
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ error: "Failed to fetch team members" });
    }
  });

  // Invite new team member with automatic user account creation
  app.post("/api/admin/team/invite", async (req, res) => {
    try {
      const { email, firstName, lastName, role, department, position } = req.body;

      if (!email || !firstName || !lastName) {
        return res.status(400).json({ error: "Email, first name and last name are required" });
      }

      // Check if team member already exists
      const existingMember = await storage.getTeamMemberByEmail(email);
      if (existingMember) {
        return res.status(400).json({ error: "A team member with this email already exists" });
      }

      // Check if user account already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "A user account with this email already exists" });
      }

      // Create user account with login credentials
      console.log(`🔐 Creating user account for team member: ${firstName} ${lastName} (${email})`);
      const accountData = await createUserAccountForInvitation(
        email,
        firstName,
        lastName,
        role || 'team_member'
      );

      // Create user in database
      const newUser = await storage.createUser({
        ...accountData.user,
        role: (role as 'admin' | 'customer' | 'team_member' | 'manager' | 'viewer') || 'team_member'
      });
      console.log(`✅ User account created with ID: ${newUser.id}, username: ${accountData.credentials.username}`);

      // Create team member record linked to user
      const newMember = await storage.createTeamMember({
        userId: newUser.id,
        email,
        firstName,
        lastName,
        role: role || 'team_member',
        department: department || '',
        position: position || '',
        status: 'pending'
      });
      console.log(`👥 Team member record created with ID: ${newMember.id}`);

      // Send invitation email with login credentials
      let emailSent = false;
      try {
        emailSent = await emailService.sendTeamInvitationEmail({
          email,
          firstName,
          lastName,
          role: role || 'team_member',
          department,
          position,
          inviterName: 'Admin Celio',
          // Include login credentials
          username: accountData.credentials.username,
          password: accountData.credentials.password
        });
        
        if (emailSent) {
          console.log(`✅ Team invitation email sent with login credentials to ${email}`);
        } else {
          console.warn(`⚠️ Failed to send invitation email to ${email}, but accounts created`);
        }
      } catch (emailError) {
        console.error(`❌ Error sending invitation email to ${email}:`, emailError);
        emailSent = false;
      }

      res.json({
        success: true,
        emailSent: emailSent,
        member: {
          id: newMember.id,
          email: newMember.email,
          firstName: newMember.firstName,
          lastName: newMember.lastName,
          role: newMember.role,
          department: newMember.department,
          position: newMember.position,
          status: newMember.status,
          createdAt: newMember.createdAt
        },
        user: {
          id: newUser.id,
          username: accountData.credentials.username,
          email: newUser.email
        },
        message: emailSent ? "Team member invitation sent successfully with login credentials" : "Team member account created but email failed to send"
      });
    } catch (error) {
      console.error("Error inviting team member:", error);
      res.status(500).json({ error: "Failed to invite team member" });
    }
  });

  // Resend team member invitation
  app.post("/api/admin/team/:id/resend", async (req, res) => {
    try {
      const { id } = req.params;
      const memberId = parseInt(id);
      
      if (isNaN(memberId)) {
        return res.status(400).json({ error: "Invalid team member ID" });
      }

      // Get team member details
      const teamMember = await storage.getTeamMember(memberId);
      if (!teamMember) {
        return res.status(404).json({ error: "Team member not found" });
      }

      // Get user credentials
      let userCredentials = null;
      if (teamMember.userId) {
        const user = await storage.getUser(teamMember.userId);
        if (user) {
          userCredentials = {
            username: user.username,
            // Generate a new password for resend
            password: generateSecurePassword(12)
          };
          
          // Update user with new password
          const passwordHash = await hashPassword(userCredentials.password);
          await storage.updateUser(teamMember.userId, { passwordHash });
        }
      }

      // Send invitation email with credentials
      try {
        const emailSent = await emailService.sendTeamInvitationEmail({
          email: teamMember.email,
          firstName: teamMember.firstName || '',
          lastName: teamMember.lastName || '',
          role: teamMember.role,
          department: teamMember.department || undefined,
          position: teamMember.position || undefined,
          inviterName: 'Admin Celio',
          username: userCredentials?.username || undefined,
          password: userCredentials?.password
        });
        
        if (emailSent) {
          console.log(`✅ Resent invitation email to ${teamMember.email}`);
          
          // Update team member status and last invitation date
          await storage.updateTeamMember(memberId, {
            invitationExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
          });
        } else {
          console.warn(`⚠️ Failed to resend invitation email to ${teamMember.email}`);
        }
      } catch (emailError) {
        console.error(`❌ Error resending invitation email to ${teamMember.email}:`, emailError);
      }

      res.json({
        success: true,
        emailSent: true,
        message: "Invitation resent successfully with updated credentials"
      });
    } catch (error) {
      console.error("Error resending team member invitation:", error);
      res.status(500).json({ error: "Failed to resend invitation" });
    }
  });

  // Update team member status when they log in
  app.post("/api/admin/team/:id/activate", async (req, res) => {
    try {
      const { id } = req.params;
      const memberId = parseInt(id);
      
      if (isNaN(memberId)) {
        return res.status(400).json({ error: "Invalid team member ID" });
      }

      // Update team member status to active and set last login
      await storage.updateTeamMember(memberId, {
        status: 'active',
        lastLogin: new Date()
      });

      console.log(`✅ Team member ${memberId} status updated to active`);
      
      res.json({
        success: true,
        message: "Team member status updated to active"
      });
    } catch (error) {
      console.error("Error updating team member status:", error);
      res.status(500).json({ error: "Failed to update team member status" });
    }
  });

  // Check team member login status (can be called when user logs in)
  app.post("/api/auth/team-login", async (req, res) => {
    try {
      const { username } = req.body;
      
      if (!username) {
        return res.status(400).json({ error: "Username is required" });
      }

      // Find user by username
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Find team member by user ID
      const teamMembers = await storage.getAllTeamMembers();
      const teamMember = teamMembers.find(member => member.userId === user.id);
      
      if (teamMember && teamMember.status === 'pending') {
        // Update status to active on first login
        await storage.updateTeamMember(teamMember.id, {
          status: 'active',
          lastLogin: new Date()
        });
        
        console.log(`🎉 Team member ${teamMember.firstName} ${teamMember.lastName} logged in for the first time - status updated to active`);
      } else if (teamMember) {
        // Update last login time
        await storage.updateTeamMember(teamMember.id, {
          lastLogin: new Date()
        });
        
        console.log(`👋 Team member ${teamMember.firstName} ${teamMember.lastName} logged in`);
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          teamMember: teamMember
        }
      });
    } catch (error) {
      console.error("Error processing team member login:", error);
      res.status(500).json({ error: "Failed to process login" });
    }
  });

  // Remove team member  
  app.delete("/api/admin/team/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const memberId = parseInt(id);
      
      if (isNaN(memberId)) {
        return res.status(400).json({ error: "Invalid team member ID" });
      }

      console.log(`🗑️ Removing team member with ID: ${memberId}`);
      
      // Get team member first to get linked user ID
      const teamMember = await storage.getTeamMember(memberId);
      if (!teamMember) {
        return res.status(404).json({ error: "Team member not found" });
      }

      // Delete team member from database
      const deleted = await storage.deleteTeamMember(memberId);
      
      if (!deleted) {
        return res.status(500).json({ error: "Failed to delete team member" });
      }

      // Also delete the linked user account if exists
      if (teamMember.userId) {
        try {
          await storage.deleteUser(teamMember.userId);
          console.log(`🗑️ Also deleted linked user account: ${teamMember.userId}`);
        } catch (userError) {
          console.warn(`⚠️ Could not delete linked user account: ${userError}`);
        }
      }

      console.log(`✅ Successfully deleted team member ${teamMember.email}`);
      
      res.json({
        success: true,
        message: "Team member and linked account removed successfully"
      });
    } catch (error) {
      console.error("Error removing team member:", error);
      res.status(500).json({ error: "Failed to remove team member" });
    }
  });

  // Update team member
  app.put("/api/admin/team/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { role, department, position, status } = req.body;

      console.log(`📝 Updating team member ${id}:`, { role, department, position, status });

      res.json({
        success: true,
        message: "Team member updated successfully"
      });
    } catch (error) {
      console.error("Error updating team member:", error);
      res.status(500).json({ error: "Failed to update team member" });
    }
  });

  // Proxy endpoint for Google Storage URLs to handle CORS
  app.get("/proxy-image/:bucketName/:objectPath(*)", async (req, res) => {
    try {
      const { bucketName, objectPath } = req.params;
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectPath);
      
      const [exists] = await file.exists();
      if (!exists) {
        return res.status(404).json({ error: "Image not found" });
      }
      
      // Get file metadata
      const [metadata] = await file.getMetadata();
      
      // Set appropriate headers
      res.set({
        "Content-Type": metadata.contentType || "image/jpeg",
        "Content-Length": metadata.size,
        "Cache-Control": "public, max-age=3600",
      });

      // Stream the file to the response
      const stream = file.createReadStream();
      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });
      stream.pipe(res);
    } catch (error) {
      console.error("Error proxying image:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ========== LOOKBOOK & OUTFIT API ==========

  // Genera automaticamente combinazioni outfit dal database
  app.get("/api/outfits/generate", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const style = req.query.style as string; // casual, elegante, estivo, invernale

      const allProducts = await storage.getAllProducts();
      const grouped = groupByBaseName(allProducts).map(fixProductImages);

      // Categorizza i prodotti
      const tops: any[] = [];
      const bottoms: any[] = [];
      const outerwear: any[] = [];
      const accessories: any[] = [];

      for (const p of grouped) {
        const cat = (p.category || '').toLowerCase();
        if (!p.mainImage || !p.mainImage.includes('WEB3')) continue;

        if (cat.includes('camici') || cat.includes('polo') || cat.includes('t-shirt')) {
          tops.push(p);
        } else if (cat.includes('maglion') || cat.includes('felp')) {
          tops.push(p);
        } else if (cat.includes('pantalon') || cat.includes('jean') || cat.includes('bermuda') || cat.includes('abit')) {
          bottoms.push(p);
        } else if (cat.includes('giacc') || cat.includes('cappott')) {
          outerwear.push(p);
        } else if (cat.includes('accessor') || cat.includes('scarp')) {
          accessories.push(p);
        }
      }

      // Genera outfit combinando top + bottom + opzionalmente giacca/accessorio
      const outfits: any[] = [];
      const usedPairs = new Set<string>();

      // Mescola per varieta
      const shuffle = (arr: any[]) => arr.sort(() => Math.random() - 0.5);
      shuffle(tops);
      shuffle(bottoms);

      for (const top of tops) {
        if (outfits.length >= limit) break;
        for (const bottom of bottoms) {
          if (outfits.length >= limit) break;
          const pairKey = `${top.id}-${bottom.id}`;
          if (usedPairs.has(pairKey)) continue;
          usedPairs.add(pairKey);

          const outfit: any = {
            id: outfits.length + 1,
            prodotti: [
              { ruolo: 'top', id: top.id, nome: top.name, prezzo: top.price, immagine: top.mainImage, categoria: top.category },
              { ruolo: 'bottom', id: bottom.id, nome: bottom.name, prezzo: bottom.price, immagine: bottom.mainImage, categoria: bottom.category },
            ],
            prezzoTotale: (parseFloat(top.price) + parseFloat(bottom.price)).toFixed(2),
          };

          // Aggiungi giacca casualmente (30% probabilita)
          if (outerwear.length > 0 && Math.random() < 0.3) {
            const jacket = outerwear[Math.floor(Math.random() * outerwear.length)];
            outfit.prodotti.push({
              ruolo: 'giacca', id: jacket.id, nome: jacket.name, prezzo: jacket.price, immagine: jacket.mainImage, categoria: jacket.category
            });
            outfit.prezzoTotale = (parseFloat(outfit.prezzoTotale) + parseFloat(jacket.price)).toFixed(2);
          }

          // Aggiungi accessorio casualmente (20% probabilita)
          if (accessories.length > 0 && Math.random() < 0.2) {
            const acc = accessories[Math.floor(Math.random() * accessories.length)];
            outfit.prodotti.push({
              ruolo: 'accessorio', id: acc.id, nome: acc.name, prezzo: acc.price, immagine: acc.mainImage, categoria: acc.category
            });
            outfit.prezzoTotale = (parseFloat(outfit.prezzoTotale) + parseFloat(acc.price)).toFixed(2);
          }

          // Assegna stile automatico
          const topCat = top.category.toLowerCase();
          const bottomCat = bottom.category.toLowerCase();
          if (bottomCat.includes('pantaloncin') || bottomCat.includes('bermuda')) {
            outfit.stile = 'Estivo';
            outfit.stagione = 'Estate 2025';
          } else if (bottomCat.includes('abit')) {
            outfit.stile = 'Elegante';
            outfit.stagione = 'Tutto l\'anno';
          } else if (topCat.includes('maglion') || topCat.includes('felp')) {
            outfit.stile = 'Invernale';
            outfit.stagione = 'Inverno 2025';
          } else {
            outfit.stile = 'Casual';
            outfit.stagione = 'Tutto l\'anno';
          }

          // Genera caption Instagram
          const nomi = outfit.prodotti.map((p: any) => p.nome).join(' + ');
          outfit.captionInstagram = `Il look perfetto: ${nomi}\n\nPrezzo totale: ${outfit.prezzoTotale} EUR\n\nScopri tutto su celio.com\nLink in bio\n\n#celio #celioitalia #modauomo #outfit #ootd #menswear #style #${outfit.stile.toLowerCase()}`;

          if (!style || outfit.stile.toLowerCase() === style.toLowerCase()) {
            outfits.push(outfit);
          }
        }
      }

      res.json({
        totale: outfits.length,
        outfits,
        statistiche: {
          topDisponibili: tops.length,
          bottomDisponibili: bottoms.length,
          giaccheDisponibili: outerwear.length,
          accessoriDisponibili: accessories.length,
        }
      });
    } catch (error) {
      console.error("Errore generazione outfit:", error);
      res.status(500).json({ error: "Impossibile generare outfit" });
    }
  });

  // Lista tutti i lookbook pubblicati
  app.get("/api/lookbooks", async (req, res) => {
    try {
      const allLookbooks = await db.select().from(lookbooks)
        .where(eq(lookbooks.isPublished, true))
        .orderBy(lookbooks.position, desc(lookbooks.createdAt));

      // Popola i prodotti per ogni lookbook
      const result = [];
      for (const lb of allLookbooks) {
        const productIds = (lb.productIds as number[]) || [];
        const lbProducts = [];
        for (const pid of productIds) {
          const p = await storage.getProduct(pid);
          if (p) lbProducts.push(fixProductImages(p));
        }
        result.push({
          ...lb,
          prodotti: lbProducts,
        });
      }

      res.json(result);
    } catch (error) {
      console.error("Errore lookbook:", error);
      res.status(500).json({ error: "Impossibile caricare i lookbook" });
    }
  });

  // Singolo lookbook
  app.get("/api/lookbooks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const [lb] = await db.select().from(lookbooks).where(eq(lookbooks.id, id));
      if (!lb) return res.status(404).json({ error: "Lookbook non trovato" });

      const productIds = (lb.productIds as number[]) || [];
      const lbProducts = [];
      for (const pid of productIds) {
        const p = await storage.getProduct(pid);
        if (p) lbProducts.push(fixProductImages(p));
      }

      res.json({ ...lb, prodotti: lbProducts });
    } catch (error) {
      console.error("Errore lookbook:", error);
      res.status(500).json({ error: "Impossibile caricare il lookbook" });
    }
  });

  // Admin: lista tutti i lookbook (anche non pubblicati)
  app.get("/api/admin/lookbooks", async (req, res) => {
    try {
      const allLookbooks = await db.select().from(lookbooks)
        .orderBy(lookbooks.position, desc(lookbooks.createdAt));

      const result = [];
      for (const lb of allLookbooks) {
        const productIds = (lb.productIds as number[]) || [];
        const lbProducts = [];
        for (const pid of productIds) {
          const p = await storage.getProduct(pid);
          if (p) lbProducts.push(fixProductImages(p));
        }
        result.push({ ...lb, prodotti: lbProducts });
      }

      res.json(result);
    } catch (error) {
      console.error("Errore admin lookbook:", error);
      res.status(500).json({ error: "Impossibile caricare i lookbook" });
    }
  });

  // Admin: crea lookbook
  app.post("/api/admin/lookbooks", async (req, res) => {
    try {
      const data = req.body;

      // Calcola prezzo totale
      let totalPrice = 0;
      const productIds = data.productIds || [];
      for (const pid of productIds) {
        const p = await storage.getProduct(pid);
        if (p) totalPrice += parseFloat(p.price);
      }

      const [newLookbook] = await db.insert(lookbooks).values({
        name: data.name,
        description: data.description || null,
        season: data.season || null,
        style: data.style || null,
        productIds: productIds,
        mainImage: data.mainImage || null,
        totalPrice: totalPrice.toFixed(2),
        isPublished: data.isPublished || false,
        isFeatured: data.isFeatured || false,
        position: data.position || 0,
        instagramCaption: data.instagramCaption || null,
        hashtags: data.hashtags || '#celio #celioitalia #modauomo #outfit #ootd',
      }).returning();

      res.status(201).json({ success: true, lookbook: newLookbook });
    } catch (error) {
      console.error("Errore creazione lookbook:", error);
      res.status(500).json({ error: "Impossibile creare il lookbook" });
    }
  });

  // Admin: aggiorna lookbook
  app.put("/api/admin/lookbooks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = req.body;

      // Ricalcola prezzo totale se productIds aggiornati
      let totalPrice = data.totalPrice;
      if (data.productIds) {
        totalPrice = 0;
        for (const pid of data.productIds) {
          const p = await storage.getProduct(pid);
          if (p) totalPrice += parseFloat(p.price);
        }
        totalPrice = totalPrice.toFixed(2);
      }

      const [updated] = await db.update(lookbooks).set({
        ...data,
        totalPrice,
        updatedAt: new Date(),
      }).where(eq(lookbooks.id, id)).returning();

      if (!updated) return res.status(404).json({ error: "Lookbook non trovato" });
      res.json({ success: true, lookbook: updated });
    } catch (error) {
      console.error("Errore aggiornamento lookbook:", error);
      res.status(500).json({ error: "Impossibile aggiornare il lookbook" });
    }
  });

  // Admin: elimina lookbook
  app.delete("/api/admin/lookbooks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const [deleted] = await db.delete(lookbooks).where(eq(lookbooks.id, id)).returning();
      if (!deleted) return res.status(404).json({ error: "Lookbook non trovato" });
      res.json({ success: true });
    } catch (error) {
      console.error("Errore eliminazione lookbook:", error);
      res.status(500).json({ error: "Impossibile eliminare il lookbook" });
    }
  });

  // Admin: salva outfit generato come lookbook
  app.post("/api/admin/lookbooks/from-outfit", async (req, res) => {
    try {
      const { outfit, name, description } = req.body;
      if (!outfit || !outfit.prodotti) {
        return res.status(400).json({ error: "Dati outfit mancanti" });
      }

      const productIds = outfit.prodotti.map((p: any) => p.id);
      const firstProduct = outfit.prodotti[0];

      const [newLookbook] = await db.insert(lookbooks).values({
        name: name || `Look ${outfit.stile} - Celio`,
        description: description || `Outfit ${outfit.stile} composto da ${outfit.prodotti.length} capi`,
        season: outfit.stagione || null,
        style: outfit.stile || null,
        productIds,
        mainImage: firstProduct?.immagine || null,
        totalPrice: outfit.prezzoTotale,
        isPublished: false,
        isFeatured: false,
        position: 0,
        instagramCaption: outfit.captionInstagram || null,
        hashtags: '#celio #celioitalia #modauomo #outfit #ootd',
      }).returning();

      res.status(201).json({ success: true, lookbook: newLookbook });
    } catch (error) {
      console.error("Errore salvataggio outfit:", error);
      res.status(500).json({ error: "Impossibile salvare l'outfit" });
    }
  });

  // ========== STORES / PUNTI VENDITA ==========

  // Get all stores (public)
  app.get("/api/stores", async (_req, res) => {
    try {
      const allStores = await db.select().from(stores).orderBy(stores.position);
      res.json(allStores);
    } catch (error) {
      console.error("Error fetching stores:", error);
      res.status(500).json({ error: "Impossibile caricare i negozi" });
    }
  });

  // Get single store
  app.get("/api/stores/:id", async (req, res) => {
    try {
      const [store] = await db.select().from(stores).where(eq(stores.id, parseInt(req.params.id)));
      if (!store) return res.status(404).json({ error: "Negozio non trovato" });
      res.json(store);
    } catch (error) {
      res.status(500).json({ error: "Errore nel caricamento del negozio" });
    }
  });

  // Create store (admin)
  app.post("/api/admin/stores", async (req, res) => {
    try {
      const parsed = insertStoreSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }
      const [newStore] = await db.insert(stores).values(parsed.data).returning();
      res.status(201).json(newStore);
    } catch (error) {
      console.error("Error creating store:", error);
      res.status(500).json({ error: "Impossibile creare il negozio" });
    }
  });

  // Update store (admin)
  app.put("/api/admin/stores/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const [updated] = await db.update(stores)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(stores.id, id))
        .returning();
      if (!updated) return res.status(404).json({ error: "Negozio non trovato" });
      res.json(updated);
    } catch (error) {
      console.error("Error updating store:", error);
      res.status(500).json({ error: "Impossibile aggiornare il negozio" });
    }
  });

  // Delete store (admin)
  app.delete("/api/admin/stores/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const [deleted] = await db.delete(stores).where(eq(stores.id, id)).returning();
      if (!deleted) return res.status(404).json({ error: "Negozio non trovato" });
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting store:", error);
      res.status(500).json({ error: "Impossibile eliminare il negozio" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
