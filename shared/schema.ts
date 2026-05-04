import { pgTable, text, serial, integer, boolean, decimal, timestamp, varchar, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enhanced user system for e-commerce
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username"),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  profilePhoto: text("profile_photo"),
  role: text("role", { enum: ["admin", "customer", "team_member", "manager", "viewer"] }).default("customer"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Team members table for ERP access control
export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role", { enum: ["admin", "manager", "editor", "viewer"] }).default("viewer"),
  permissions: json("permissions"), // Array of permission strings
  department: text("department"),
  position: text("position"),
  lastLogin: timestamp("last_login"),
  status: text("status", { enum: ["active", "inactive", "pending"] }).default("pending"),
  invitedBy: integer("invited_by").references(() => users.id),
  invitationToken: text("invitation_token"),
  invitationExpiresAt: timestamp("invitation_expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Team permissions table
export const teamPermissions = pgTable("team_permissions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  category: text("category", { enum: ["inventory", "orders", "customers", "analytics", "settings", "team"] }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Team audit log table
export const teamAuditLog = pgTable("team_audit_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(),
  resource: text("resource"),
  resourceId: text("resource_id"),
  details: json("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Shopping cart table
export const carts = pgTable("carts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  guestId: text("guest_id"), // For non-logged-in users
  items: json("items"), // Array of {productId, quantity, price}
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).default('0'),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customer addresses table
export const addresses = pgTable("addresses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  customerId: integer("customer_id").references(() => customers.id),
  label: text("label"), // "Home", "Work", etc.
  type: text("type", { enum: ["shipping", "billing", "both"] }).default("both"), // Address type
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  company: text("company"),
  line1: text("line1").notNull(),
  line2: text("line2"),
  city: text("city").notNull(),
  state: text("state"),
  postalCode: text("postal_code").notNull(),
  country: text("country").notNull().default('Italia'),
  phone: text("phone"),
  isDefault: boolean("is_default").default(false),
  isDefaultShipping: boolean("is_default_shipping").default(false),
  isDefaultBilling: boolean("is_default_billing").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Orders table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  userId: integer("user_id").references(() => users.id),
  customerEmail: text("customer_email").notNull(),
  customerName: text("customer_name").notNull(),
  items: json("items").notNull(), // Snapshot of cart items with prices
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }).default('0'),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default('0'),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default('EUR'),
  status: text("status", { enum: ["pending", "paid", "processing", "shipped", "delivered", "cancelled"] }).default("pending"),
  paymentStatus: text("payment_status", { enum: ["pending", "paid", "failed", "refunded"] }).default("pending"),
  paymentMethod: text("payment_method"),
  shippingAddress: json("shipping_address").notNull(),
  billingAddress: json("billing_address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customers table (for CRM - separate from users)
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  company: text("company"),
  notes: text("notes"),
  // Address fields
  address: text("address"),
  city: text("city"),
  postalCode: text("postal_code"),
  country: text("country").default('Italia'),
  tags: json("tags"), // Array of tags
  totalSpent: decimal("total_spent", { precision: 10, scale: 2 }).default('0'),
  orderCount: integer("order_count").default(0),
  lastOrderDate: timestamp("last_order_date"),
  defaultShippingAddressId: integer("default_shipping_address_id"),
  defaultBillingAddressId: integer("default_billing_address_id"),
  // Customer journey progress
  currentJourneyStage: text("current_journey_stage").default('visitor'), // Current stage
  journeyScore: integer("journey_score").default(0), // Overall engagement score
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customer journey stages tracking
export const customerJourneyStages = pgTable("customer_journey_stages", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  stageName: text("stage_name").notNull(), // visitor, interested, first_purchase, returning, loyal, vip
  stageTitle: text("stage_title").notNull(), // User-friendly stage name
  stageDescription: text("stage_description"), // Description of what this stage means
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  progressPercentage: integer("progress_percentage").default(0), // 0-100
  milestoneData: json("milestone_data"), // Additional data for this stage
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customer journey milestones/events
export const customerJourneyEvents = pgTable("customer_journey_events", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  eventType: text("event_type").notNull(), // visit, product_view, cart_add, purchase, return_visit, etc.
  eventValue: decimal("event_value", { precision: 10, scale: 2 }).default('0'), // Order value, etc.
  eventData: json("event_data"), // Additional event details
  points: integer("points").default(0), // Points earned for journey score
  stageName: text("stage_name"), // Which stage this event contributed to
  createdAt: timestamp("created_at").defaultNow(),
});

// Updated user schema
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email("Email format invalide"),
  passwordHash: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCartSchema = createInsertSchema(carts).omit({
  id: true,
  updatedAt: true,
});

export const insertAddressSchema = createInsertSchema(addresses).omit({
  id: true,
  createdAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Team types
export type InsertTeamMember = typeof teamMembers.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamPermission = typeof teamPermissions.$inferInsert;  
export type TeamPermission = typeof teamPermissions.$inferSelect;
export type InsertTeamAuditLog = typeof teamAuditLog.$inferInsert;
export type TeamAuditLog = typeof teamAuditLog.$inferSelect;

export type Cart = typeof carts.$inferSelect;
export type InsertCart = z.infer<typeof insertCartSchema>;
export type Address = typeof addresses.$inferSelect;
export type InsertAddress = z.infer<typeof insertAddressSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export const insertCustomerJourneyStageSchema = createInsertSchema(customerJourneyStages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomerJourneyEventSchema = createInsertSchema(customerJourneyEvents).omit({
  id: true,
  createdAt: true,
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type CustomerJourneyStage = typeof customerJourneyStages.$inferSelect;
export type InsertCustomerJourneyStage = z.infer<typeof insertCustomerJourneyStageSchema>;
export type CustomerJourneyEvent = typeof customerJourneyEvents.$inferSelect;
export type InsertCustomerJourneyEvent = z.infer<typeof insertCustomerJourneyEventSchema>;

// Products table with comprehensive ERP features
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  sku: varchar("sku", { length: 100 }).notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  subcategory: text("subcategory"),
  brand: text("brand"),
  
  // Pricing
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }).default('0'),
  salePrice: decimal("sale_price", { precision: 10, scale: 2 }),
  
  // Stock management
  stock: integer("stock").notNull().default(0),
  reservedStock: integer("reserved_stock").default(0),
  minStock: integer("min_stock").default(0),
  maxStock: integer("max_stock"),
  
  // Product status
  isActive: boolean("is_active").default(true),
  isSoldOut: boolean("is_sold_out").default(false),
  isOnSale: boolean("is_on_sale").default(false),
  isFeatured: boolean("is_featured").default(false),
  
  // Images and media
  mainImage: text("main_image"), // URL to main product image
  images: json("images"), // Array of additional image URLs
  colorImages: json("color_images"), // Object mapping colors to image URLs: {color: [urls]}
  
  // Product attributes and variants
  attributes: json("attributes"), // Flexible attributes: {sizes: [], colors: [], materials: []}
  variants: json("variants"), // Array of product variants: [{id, size, color, quantity, sku, price}]
  
  // SEO and metadata
  slug: text("slug").unique(),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  tags: json("tags"), // Array of tags
  
  // Physical attributes
  weight: decimal("weight", { precision: 8, scale: 2 }), // in grams
  dimensions: json("dimensions"), // {length, width, height}
  color: text("color"),
  size: text("size"),
  material: text("material"),
  language: varchar("language", { length: 5 }).default('it'),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Per-customer history of AI virtual try-on generations.
export const tryOnHistory = pgTable("try_on_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  productId: integer("product_id"),
  productName: text("product_name").notNull(),
  productImage: text("product_image"),
  resultImage: text("result_image").notNull(),
  category: text("category"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Categories table for better organization
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  parentId: integer("parent_id"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Product validation schemas
export const insertProductSchema = createInsertSchema(products, {
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(1, "Product name is required"),
  category: z.string().min(1, "Category is required"),
  price: z.union([
    z.string().min(1, "Price is required"),
    z.number().positive("Price must be positive")
  ]).transform(val => typeof val === 'string' ? val : val.toString()),
  cost: z.union([
    z.string().optional(),
    z.number().optional(),
    z.null()
  ]).optional().transform(val => val === null || val === undefined ? null : (typeof val === 'string' ? val : val.toString())),
  salePrice: z.union([
    z.string().optional(),
    z.number().optional(),
    z.null()
  ]).optional().transform(val => val === null || val === undefined ? null : (typeof val === 'string' ? val : val.toString())),
  discountPercentage: z.union([
    z.string().optional(),
    z.number().optional(),
    z.null()
  ]).optional().transform(val => val === null || val === undefined ? null : (typeof val === 'string' ? val : val.toString())),
  weight: z.union([
    z.string().optional(),
    z.number().optional(),
    z.null()
  ]).optional().transform(val => val === null || val === undefined ? null : (typeof val === 'string' ? val : val.toString())),
  stock: z.number().min(0, "Stock cannot be negative"),
  reservedStock: z.number().min(0, "Reserved stock cannot be negative").optional(),
  minStock: z.number().min(0, "Min stock cannot be negative").optional(),
  maxStock: z.number().min(0, "Max stock cannot be negative").optional().nullable(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCategorySchema = createInsertSchema(categories, {
  name: z.string().min(1, "Category name is required"),
  slug: z.string().min(1, "Slug is required"),
}).omit({
  id: true,
  createdAt: true,
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

// System configurations table for managing API keys and integrations
export const systemConfigurations = pgTable("system_configurations", {
  id: serial("id").primaryKey(),
  section: text("section").notNull(), // stripe, email, database, storage, etc.
  key: text("key").notNull(), // api_key, secret_key, url, etc.
  value: text("value"), // encrypted value
  isActive: boolean("is_active").default(true),
  isSensitive: boolean("is_sensitive").default(false), // whether to hide the value in UI
  description: text("description"), // human readable description
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSystemConfigurationSchema = createInsertSchema(systemConfigurations, {
  section: z.string().min(1, "Section is required"),
  key: z.string().min(1, "Key is required"),
  value: z.string().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSystemConfiguration = z.infer<typeof insertSystemConfigurationSchema>;
export type SystemConfiguration = typeof systemConfigurations.$inferSelect;

// Public Images and Videos storage table with full text styling capabilities
export const publicImages = pgTable("public_images", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  url: varchar("url").notNull(),
  path: varchar("path").notNull(),
  size: integer("size").notNull().default(0),
  type: varchar("type").notNull().default("image/jpeg"),
  mediaType: varchar("media_type", { enum: ["image", "video"] }).default("image"),
  section: varchar("section"), // hero, banner, promotion, etc.
  position: integer("position").default(0), // order within section
  isActive: boolean("is_active").default(true),
  title: varchar("title"), // overlay title
  subtitle: varchar("subtitle"), // overlay subtitle
  buttonText: varchar("button_text"), // button text
  linkUrl: varchar("link_url"), // button link
  // Advanced styling options for complete promotional text control
  titleColor: varchar("title_color", { length: 50 }).default("#ffffff"),
  subtitleColor: varchar("subtitle_color", { length: 50 }).default("#ffffff"),
  buttonColor: varchar("button_color", { length: 50 }).default("#000000"),
  buttonBgColor: varchar("button_bg_color", { length: 50 }).default("#ffffff"),
  titleFont: varchar("title_font", { length: 100 }).default("Inter"),
  subtitleFont: varchar("subtitle_font", { length: 100 }).default("Inter"),
  buttonFont: varchar("button_font", { length: 100 }).default("Inter"),
  titleSize: varchar("title_size", { length: 20 }).default("xl"),
  subtitleSize: varchar("subtitle_size", { length: 20 }).default("lg"),
  textAlign: varchar("text_align", { length: 20 }).default("right"),
  titleWeight: varchar("title_weight", { length: 20 }).default("bold"),
  subtitleWeight: varchar("subtitle_weight", { length: 20 }).default("normal"),
  buttonSize: varchar("button_size", { length: 20 }).default("md"),
  // Video-specific settings
  autoplay: boolean("autoplay").default(false),
  loop: boolean("loop").default(true),
  muted: boolean("muted").default(true),
  showControls: boolean("show_controls").default(false),
  posterImage: varchar("poster_image"), // thumbnail for videos
  duration: integer("duration"), // video duration in seconds
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPublicImageSchema = createInsertSchema(publicImages, {
  name: z.string().min(1, "Name is required"),
  url: z.string().min(1, "URL is required"),
  path: z.string().min(1, "Path is required"),
  size: z.number().min(0, "Size must be positive"),
  type: z.string().min(1, "Type is required"),
  mediaType: z.enum(["image", "video"]).optional(),
  section: z.string().optional(),
  position: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  buttonText: z.string().optional(),
  linkUrl: z.string().optional(),
  // Video settings
  autoplay: z.boolean().optional(),
  loop: z.boolean().optional(),
  muted: z.boolean().optional(),
  showControls: z.boolean().optional(),
  posterImage: z.string().optional(),
  duration: z.number().optional(),
}).omit({
  id: true,
  uploadedAt: true,
  createdAt: true,
});

export type InsertPublicImage = z.infer<typeof insertPublicImageSchema>;
export type PublicImage = typeof publicImages.$inferSelect;

// ========== COMPREHENSIVE ERP EXTENSIONS ==========

// 1. FINANCIAL MANAGEMENT
// Invoices table for financial tracking
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  orderId: integer("order_id").references(() => orders.id),
  customerId: integer("customer_id").references(() => customers.id),
  customerEmail: text("customer_email").notNull(),
  customerName: text("customer_name").notNull(),
  items: json("items").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  vatAmount: decimal("vat_amount", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default('0'),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default('EUR'),
  status: text("status", { enum: ["draft", "sent", "paid", "overdue", "cancelled"] }).default("draft"),
  dueDate: timestamp("due_date"),
  paidDate: timestamp("paid_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Expenses table for business expense tracking
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  expenseNumber: text("expense_number").notNull().unique(),
  vendorName: text("vendor_name").notNull(),
  category: text("category").notNull(), // office, supplies, marketing, etc.
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default('EUR'),
  expenseDate: timestamp("expense_date").notNull(),
  receiptUrl: text("receipt_url"),
  isRecurring: boolean("is_recurring").default(false),
  recurrencePattern: text("recurrence_pattern"), // monthly, yearly
  accountingCode: text("accounting_code"),
  vatAmount: decimal("vat_amount", { precision: 10, scale: 2 }).default('0'),
  status: text("status", { enum: ["pending", "approved", "rejected", "paid"] }).default("pending"),
  approvedBy: integer("approved_by").references(() => users.id),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tax settings and calculations
export const taxSettings = pgTable("tax_settings", {
  id: serial("id").primaryKey(),
  country: text("country").notNull(),
  region: text("region"), // state/province
  taxName: text("tax_name").notNull(), // VAT, Sales Tax, etc.
  taxRate: decimal("tax_rate", { precision: 5, scale: 4 }).notNull(), // 0.22 for 22%
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  effectiveFrom: timestamp("effective_from").defaultNow(),
  effectiveTo: timestamp("effective_to"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 2. ADVANCED INVENTORY MANAGEMENT
// Warehouses for multi-location inventory
export const warehouses = pgTable("warehouses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  description: text("description"),
  address: text("address").notNull(),
  city: text("city").notNull(),
  postalCode: text("postal_code").notNull(),
  country: text("country").notNull().default('Italia'),
  phone: text("phone"),
  email: text("email"),
  managerId: integer("manager_id").references(() => users.id),
  isActive: boolean("is_active").default(true),
  isDefault: boolean("is_default").default(false),
  capacity: integer("capacity"), // total capacity
  currentUtilization: integer("current_utilization").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Stock movements for inventory tracking
export const stockMovements = pgTable("stock_movements", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  warehouseId: integer("warehouse_id").references(() => warehouses.id),
  movementType: text("movement_type", { enum: ["in", "out", "transfer", "adjustment", "return", "damaged"] }).notNull(),
  quantity: integer("quantity").notNull(),
  previousStock: integer("previous_stock").notNull(),
  newStock: integer("new_stock").notNull(),
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }),
  reason: text("reason").notNull(),
  referenceType: text("reference_type"), // order, purchase_order, return, adjustment
  referenceId: text("reference_id"),
  batchNumber: text("batch_number"),
  expiryDate: timestamp("expiry_date"),
  performedBy: integer("performed_by").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Purchase Orders for supplier management
export const purchaseOrders = pgTable("purchase_orders", {
  id: serial("id").primaryKey(),
  poNumber: text("po_number").notNull().unique(),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  warehouseId: integer("warehouse_id").references(() => warehouses.id),
  items: json("items").notNull(), // [{productId, quantity, unitCost, total}]
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default('0'),
  shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }).default('0'),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default('EUR'),
  status: text("status", { enum: ["draft", "sent", "confirmed", "partial", "received", "cancelled"] }).default("draft"),
  expectedDelivery: timestamp("expected_delivery"),
  actualDelivery: timestamp("actual_delivery"),
  createdBy: integer("created_by").references(() => users.id),
  approvedBy: integer("approved_by").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Suppliers table
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  email: text("email"),
  phone: text("phone"),
  website: text("website"),
  address: text("address"),
  city: text("city"),
  postalCode: text("postal_code"),
  country: text("country").default('Italia'),
  contactPerson: text("contact_person"),
  paymentTerms: text("payment_terms"), // Net 30, Net 15, etc.
  category: text("category"), // textile, accessories, etc.
  rating: decimal("rating", { precision: 2, scale: 1 }).default('0'),
  totalOrders: integer("total_orders").default(0),
  totalSpent: decimal("total_spent", { precision: 12, scale: 2 }).default('0'),
  lastOrderDate: timestamp("last_order_date"),
  status: text("status", { enum: ["active", "inactive", "blacklisted"] }).default("active"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 3. MARKETING & PROMOTIONS
// Discount codes and coupons
export const discountCodes = pgTable("discount_codes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  discountType: text("discount_type", { enum: ["percentage", "fixed_amount", "buy_x_get_y", "free_shipping"] }).notNull(),
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  minimumOrderValue: decimal("minimum_order_value", { precision: 10, scale: 2 }),
  maximumDiscount: decimal("maximum_discount", { precision: 10, scale: 2 }),
  usageLimit: integer("usage_limit"),
  usageCount: integer("usage_count").default(0),
  perCustomerLimit: integer("per_customer_limit").default(1),
  applicableProducts: json("applicable_products"), // product IDs
  applicableCategories: json("applicable_categories"), // category names
  isActive: boolean("is_active").default(true),
  validFrom: timestamp("valid_from").defaultNow(),
  validTo: timestamp("valid_to"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Loyalty program
export const loyaltyProgram = pgTable("loyalty_program", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  totalPoints: integer("total_points").default(0),
  availablePoints: integer("available_points").default(0),
  tierLevel: text("tier_level", { enum: ["bronze", "silver", "gold", "platinum"] }).default("bronze"),
  totalSpent: decimal("total_spent", { precision: 12, scale: 2 }).default('0'),
  pointsEarned: integer("points_earned").default(0),
  pointsRedeemed: integer("points_redeemed").default(0),
  lastActivity: timestamp("last_activity"),
  joinedAt: timestamp("joined_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Loyalty point transactions
export const loyaltyTransactions = pgTable("loyalty_transactions", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  loyaltyId: integer("loyalty_id").references(() => loyaltyProgram.id).notNull(),
  transactionType: text("transaction_type", { enum: ["earned", "redeemed", "expired", "bonus"] }).notNull(),
  points: integer("points").notNull(),
  reason: text("reason").notNull(),
  orderId: integer("order_id").references(() => orders.id),
  expiryDate: timestamp("expiry_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 4. RETURNS & REFUNDS
// Returns management
export const returns = pgTable("returns", {
  id: serial("id").primaryKey(),
  returnNumber: text("return_number").notNull().unique(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  customerId: integer("customer_id").references(() => customers.id),
  customerEmail: text("customer_email").notNull(),
  items: json("items").notNull(), // [{productId, quantity, reason, condition}]
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }),
  refundMethod: text("refund_method", { enum: ["original_payment", "store_credit", "exchange"] }),
  reason: text("reason", { enum: ["defective", "wrong_item", "not_as_described", "changed_mind", "damaged_shipping"] }).notNull(),
  status: text("status", { enum: ["requested", "approved", "rejected", "received", "processed", "refunded"] }).default("requested"),
  returnShipping: json("return_shipping"), // shipping details for return
  notes: text("notes"),
  processedBy: integer("processed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 5. CONTENT MANAGEMENT SYSTEM
// Blog posts for SEO and content marketing
export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  featuredImage: text("featured_image"),
  category: text("category").notNull(),
  tags: json("tags"), // array of tag strings
  status: text("status", { enum: ["draft", "published", "scheduled"] }).default("draft"),
  publishedAt: timestamp("published_at"),
  scheduledFor: timestamp("scheduled_for"),
  authorId: integer("author_id").references(() => users.id).notNull(),
  viewCount: integer("view_count").default(0),
  likes: integer("likes").default(0),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  readingTime: integer("reading_time"), // estimated reading time in minutes
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Product reviews
export const productReviews = pgTable("product_reviews", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  customerId: integer("customer_id").references(() => customers.id),
  orderId: integer("order_id").references(() => orders.id),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  rating: integer("rating").notNull(), // 1-5
  title: text("title"),
  content: text("content").notNull(),
  images: json("images"), // array of review image URLs
  isVerifiedPurchase: boolean("is_verified_purchase").default(false),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).default("pending"),
  helpfulVotes: integer("helpful_votes").default(0),
  reportCount: integer("report_count").default(0),
  moderatedBy: integer("moderated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 6. ADVANCED SHIPPING & FULFILLMENT
// Shipping providers and methods
export const shippingProviders = pgTable("shipping_providers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  website: text("website"),
  apiEndpoint: text("api_endpoint"),
  trackingUrl: text("tracking_url"),
  supportedServices: json("supported_services"), // array of service types
  isActive: boolean("is_active").default(true),
  configuration: json("configuration"), // API keys, credentials, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Shipping rates and zones
export const shippingRates = pgTable("shipping_rates", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").references(() => shippingProviders.id).notNull(),
  serviceName: text("service_name").notNull(),
  serviceCode: varchar("service_code", { length: 50 }).notNull(),
  zone: text("zone").notNull(), // domestic, eu, international
  minWeight: decimal("min_weight", { precision: 8, scale: 2 }).default('0'),
  maxWeight: decimal("max_weight", { precision: 8, scale: 2 }),
  baseRate: decimal("base_rate", { precision: 10, scale: 2 }).notNull(),
  perKgRate: decimal("per_kg_rate", { precision: 10, scale: 2 }).default('0'),
  estimatedDays: integer("estimated_days"),
  freeShippingThreshold: decimal("free_shipping_threshold", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Order shipments tracking
export const orderShipments = pgTable("order_shipments", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  shipmentNumber: text("shipment_number").notNull().unique(),
  providerId: integer("provider_id").references(() => shippingProviders.id),
  serviceCode: text("service_code"),
  trackingNumber: text("tracking_number"),
  items: json("items"), // subset of order items if partial shipment
  weight: decimal("weight", { precision: 8, scale: 2 }),
  shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }),
  status: text("status", { enum: ["pending", "shipped", "in_transit", "delivered", "exception", "returned"] }).default("pending"),
  shippedAt: timestamp("shipped_at"),
  estimatedDelivery: timestamp("estimated_delivery"),
  actualDelivery: timestamp("actual_delivery"),
  shippingLabel: text("shipping_label"), // URL to shipping label
  trackingEvents: json("tracking_events"), // array of tracking events
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 7. ADVANCED ANALYTICS & REPORTING
// Sales analytics data
export const salesAnalytics = pgTable("sales_analytics", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  period: text("period", { enum: ["daily", "weekly", "monthly", "yearly"] }).notNull(),
  totalOrders: integer("total_orders").default(0),
  totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).default('0'),
  avgOrderValue: decimal("avg_order_value", { precision: 10, scale: 2 }).default('0'),
  newCustomers: integer("new_customers").default(0),
  returningCustomers: integer("returning_customers").default(0),
  topProducts: json("top_products"), // array of {productId, quantity, revenue}
  topCategories: json("top_categories"),
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 4 }).default('0'),
  refundRate: decimal("refund_rate", { precision: 5, scale: 4 }).default('0'),
  createdAt: timestamp("created_at").defaultNow(),
});

// Business KPIs tracking
export const businessKpis = pgTable("business_kpis", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  period: text("period", { enum: ["daily", "weekly", "monthly", "quarterly", "yearly"] }).notNull(),
  revenue: decimal("revenue", { precision: 12, scale: 2 }).default('0'),
  profit: decimal("profit", { precision: 12, scale: 2 }).default('0'),
  expenses: decimal("expenses", { precision: 12, scale: 2 }).default('0'),
  grossMargin: decimal("gross_margin", { precision: 5, scale: 4 }).default('0'),
  netMargin: decimal("net_margin", { precision: 5, scale: 4 }).default('0'),
  customerAcquisitionCost: decimal("customer_acquisition_cost", { precision: 10, scale: 2 }).default('0'),
  customerLifetimeValue: decimal("customer_lifetime_value", { precision: 10, scale: 2 }).default('0'),
  inventoryTurnover: decimal("inventory_turnover", { precision: 8, scale: 4 }).default('0'),
  stockValue: decimal("stock_value", { precision: 12, scale: 2 }).default('0'),
  createdAt: timestamp("created_at").defaultNow(),
});

// ========== INSERT SCHEMAS FOR NEW TABLES ==========

// Financial Management schemas
export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTaxSettingSchema = createInsertSchema(taxSettings).omit({
  id: true,
  createdAt: true,
});

// Advanced Inventory schemas
export const insertWarehouseSchema = createInsertSchema(warehouses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStockMovementSchema = createInsertSchema(stockMovements).omit({
  id: true,
  createdAt: true,
});

export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Marketing schemas
export const insertDiscountCodeSchema = createInsertSchema(discountCodes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLoyaltyProgramSchema = createInsertSchema(loyaltyProgram).omit({
  id: true,
  joinedAt: true,
  updatedAt: true,
});

// Returns schemas
export const insertReturnSchema = createInsertSchema(returns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// CMS schemas
export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductReviewSchema = createInsertSchema(productReviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Shipping schemas
export const insertShippingProviderSchema = createInsertSchema(shippingProviders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderShipmentSchema = createInsertSchema(orderShipments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ========== TYPE EXPORTS ==========

// Financial types
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type TaxSetting = typeof taxSettings.$inferSelect;
export type InsertTaxSetting = z.infer<typeof insertTaxSettingSchema>;

// Inventory types
export type Warehouse = typeof warehouses.$inferSelect;
export type InsertWarehouse = z.infer<typeof insertWarehouseSchema>;
export type StockMovement = typeof stockMovements.$inferSelect;
export type InsertStockMovement = z.infer<typeof insertStockMovementSchema>;
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;
export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;

// Marketing types
export type DiscountCode = typeof discountCodes.$inferSelect;
export type InsertDiscountCode = z.infer<typeof insertDiscountCodeSchema>;
export type LoyaltyProgram = typeof loyaltyProgram.$inferSelect;
export type InsertLoyaltyProgram = z.infer<typeof insertLoyaltyProgramSchema>;
export type LoyaltyTransaction = typeof loyaltyTransactions.$inferSelect;

// Returns types
export type Return = typeof returns.$inferSelect;
export type InsertReturn = z.infer<typeof insertReturnSchema>;

// CMS types
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type ProductReview = typeof productReviews.$inferSelect;
export type InsertProductReview = z.infer<typeof insertProductReviewSchema>;

// Shipping types
export type ShippingProvider = typeof shippingProviders.$inferSelect;
export type InsertShippingProvider = z.infer<typeof insertShippingProviderSchema>;
export type ShippingRate = typeof shippingRates.$inferSelect;
export type OrderShipment = typeof orderShipments.$inferSelect;
export type InsertOrderShipment = z.infer<typeof insertOrderShipmentSchema>;

// Analytics types
export type SalesAnalytics = typeof salesAnalytics.$inferSelect;
export type BusinessKpis = typeof businessKpis.$inferSelect;

// ========== LOOKBOOK / OUTFIT COMBINATIONS ==========

export const lookbooks = pgTable("lookbooks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  season: text("season"), // "Estate 2025", "Inverno 2025", etc.
  style: text("style"), // "Casual", "Elegante", "Sportivo", etc.
  productIds: json("product_ids").notNull(), // Array of product IDs in this outfit
  mainImage: text("main_image"), // Cover image URL
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }),
  isPublished: boolean("is_published").default(false),
  isFeatured: boolean("is_featured").default(false),
  position: integer("position").default(0),
  instagramCaption: text("instagram_caption"),
  hashtags: text("hashtags"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLookbookSchema = createInsertSchema(lookbooks, {
  name: z.string().min(1, "Il nome e obbligatorio"),
  productIds: z.array(z.number()).min(1, "Almeno un prodotto richiesto"),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Lookbook = typeof lookbooks.$inferSelect;
export type InsertLookbook = z.infer<typeof insertLookbookSchema>;

// ========== STORES / PUNTI VENDITA ==========

export const stores = pgTable("stores", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  address: text("address").notNull(),
  phone: text("phone"),
  email: text("email"),
  image: text("image"),
  mapQuery: text("map_query"),
  isActive: boolean("is_active").default(true),
  position: integer("position").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertStoreSchema = createInsertSchema(stores, {
  name: z.string().min(1, "Il nome è obbligatorio"),
  city: z.string().min(1, "La città è obbligatoria"),
  address: z.string().min(1, "L'indirizzo è obbligatorio"),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Store = typeof stores.$inferSelect;
export type InsertStore = z.infer<typeof insertStoreSchema>;
