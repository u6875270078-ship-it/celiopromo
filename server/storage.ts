import { 
  users, type User, type InsertUser,
  products, type Product, type InsertProduct,
  categories, type Category, type InsertCategory,
  carts, type Cart, type InsertCart,
  orders, type Order, type InsertOrder,
  customers, type Customer, type InsertCustomer,
  addresses, type Address, type InsertAddress,
  customerJourneyStages, type CustomerJourneyStage, type InsertCustomerJourneyStage,
  customerJourneyEvents, type CustomerJourneyEvent, type InsertCustomerJourneyEvent,
  teamMembers, type TeamMember, type InsertTeamMember
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, ilike, or, sql } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Product methods
  getAllProducts(limit?: number, offset?: number): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  getProductBySku(sku: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  searchProducts(query: string): Promise<Product[]>;
  getProductsByCategory(category: string): Promise<Product[]>;
  getLowStockProducts(threshold?: number): Promise<Product[]>;
  updateProductColorImages(id: number, colorImages: { [color: string]: string[] }): Promise<Product | undefined>;
  
  // Category methods
  getAllCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, updates: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;

  // Cart methods
  getCart(userId?: number, guestId?: string): Promise<Cart | undefined>;
  createCart(cart: InsertCart): Promise<Cart>;
  updateCart(id: number, updates: Partial<InsertCart>): Promise<Cart | undefined>;
  clearCart(id: number): Promise<boolean>;

  // Order methods
  getAllOrders(limit?: number, offset?: number): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  getOrdersByUser(userId: number): Promise<Order[]>;
  getCustomerOrders(customerId: number): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, updates: Partial<InsertOrder>): Promise<Order | undefined>;
  deleteOrder(id: number): Promise<boolean>;

  // Customer methods (CRM)
  getAllCustomers(limit?: number, offset?: number): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  getCustomerByEmail(email: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, updates: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: number): Promise<boolean>;

  // Address methods
  getUserAddresses(userId: number): Promise<Address[]>;
  getCustomerAddresses(customerId: number): Promise<Address[]>;
  createAddress(address: InsertAddress): Promise<Address>;
  updateAddress(id: number, updates: Partial<InsertAddress>): Promise<Address | undefined>;
  deleteAddress(id: number): Promise<boolean>;
  setDefaultShippingAddress(customerId: number, addressId: number): Promise<void>;
  setDefaultBillingAddress(customerId: number, addressId: number): Promise<void>;

  // Statistics methods
  getOrderStats(): Promise<{
    totalOrders: number;
    totalRevenue: number;
    recentOrders: Order[];
  }>;

  // Customer Journey methods
  getCustomerJourneyStages(customerId: number): Promise<CustomerJourneyStage[]>;
  getCustomerJourneyEvents(customerId: number, limit?: number): Promise<CustomerJourneyEvent[]>;
  createJourneyStage(stage: InsertCustomerJourneyStage): Promise<CustomerJourneyStage>;
  updateJourneyStage(id: number, updates: Partial<InsertCustomerJourneyStage>): Promise<CustomerJourneyStage | undefined>;
  recordJourneyEvent(event: InsertCustomerJourneyEvent): Promise<CustomerJourneyEvent>;
  updateCustomerJourneyProgress(customerId: number): Promise<void>;
  initializeCustomerJourney(customerId: number): Promise<void>;

  // Team member methods
  getAllTeamMembers(): Promise<TeamMember[]>;
  getTeamMember(id: number): Promise<TeamMember | undefined>;
  getTeamMemberByEmail(email: string): Promise<TeamMember | undefined>;
  createTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  updateTeamMember(id: number, updates: Partial<InsertTeamMember>): Promise<TeamMember | undefined>;
  deleteTeamMember(id: number): Promise<boolean>;
  activateTeamMember(id: number): Promise<TeamMember | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      ...insertUser,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Product methods
  async getAllProducts(limit: number = 2000, offset: number = 0): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async getProductBySku(sku: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.sku, sku));
    return product || undefined;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values({
      ...product,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return newProduct;
  }

  async updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updatedProduct] = await db
      .update(products)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(products.id, id))
      .returning();
    return updatedProduct || undefined;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return (result.rowCount || 0) > 0;
  }

  async searchProducts(query: string): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(
        or(
          ilike(products.name, `%${query}%`),
          ilike(products.sku, `%${query}%`),
          ilike(products.category, `%${query}%`),
          ilike(products.brand, `%${query}%`)
        )
      )
      .orderBy(desc(products.createdAt));
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    const allProducts = await db
      .select()
      .from(products)
      .orderBy(desc(products.createdAt));

    const normalize = (s: string) =>
      s.toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[&]+/g, '')
        .replace(/\s+/g, '-')
        .replace(/-{2,}/g, '-')
        .replace(/^-|-$/g, '');

    const searchNorm = normalize(category);

    // "What's new" — newest 48 across all categories (query is already ORDER BY createdAt DESC)
    if (searchNorm === 'novita' || searchNorm === 'nouveautes') {
      return allProducts.slice(0, 48);
    }

    // Themed collections that aren't real DB categories — match by product name.
    const nameRegex: Record<string, RegExp> = {
      'baggy-party': /baggy/i,
      'one-piece':   /one\s*piece/i,
    };
    if (nameRegex[searchNorm]) {
      return allProducts.filter(p => nameRegex[searchNorm].test(p.name || ''));
    }

    // Slug → (category, subcategory) aliases from the scraper
    const aliasMap: Record<string, { cats?: string[]; subs?: string[] }> = {
      'pulls':         { cats: ['pulls & sweat'] },
      'pulls-sweat':   { cats: ['pulls & sweat'] },
      'sweats':        { cats: ['pulls & sweat'], subs: ['sweatshirts'] },
      'maglioni':      { cats: ['Maglioni & Felpe'] },
      'shorts':        { cats: ['Pantaloncini'] },
      'manteaux':      { subs: ['manteaux'] },
      'bermudas':      { subs: ['Bermuda'] },
      'sous-vetements': { cats: ['sous-vetements', 'sous-vêtements'] },
      't-shirts':      { cats: ['t-shirts'] },
    };

    const alias = aliasMap[searchNorm];

    const filtered = allProducts.filter(product => {
      if (!product.category) return false;

      const catNorm = normalize(product.category);
      const subNorm = product.subcategory ? normalize(product.subcategory) : '';

      // Direct match on category
      if (catNorm === searchNorm) return true;

      // Alias-based match
      if (alias) {
        if (alias.cats?.some(c => catNorm === normalize(c))) return true;
        if (alias.subs?.some(s => subNorm === normalize(s))) return true;
      }

      return false;
    });

    return filtered;
  }

  async getLowStockProducts(threshold: number = 10): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(sql`${products.stock} <= ${threshold}`)
      .orderBy(products.stock);
  }

  // Category methods
  async getAllCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.name);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || undefined;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values({
      ...category,
      createdAt: new Date()
    }).returning();
    return newCategory;
  }

  async updateCategory(id: number, updates: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updatedCategory] = await db
      .update(categories)
      .set(updates)
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory || undefined;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Cart methods
  async getCart(userId?: number, guestId?: string): Promise<Cart | undefined> {
    if (userId) {
      const [cart] = await db.select().from(carts).where(eq(carts.userId, userId));
      return cart || undefined;
    } else if (guestId) {
      const [cart] = await db.select().from(carts).where(eq(carts.guestId, guestId));
      return cart || undefined;
    }
    return undefined;
  }

  async createCart(cart: InsertCart): Promise<Cart> {
    const [newCart] = await db.insert(carts).values({
      ...cart,
      updatedAt: new Date()
    }).returning();
    return newCart;
  }

  async updateCart(id: number, updates: Partial<InsertCart>): Promise<Cart | undefined> {
    const [cart] = await db
      .update(carts)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(carts.id, id))
      .returning();
    return cart || undefined;
  }

  async clearCart(id: number): Promise<boolean> {
    const result = await db.delete(carts).where(eq(carts.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Order methods
  async getAllOrders(limit: number = 100, offset: number = 0): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async getOrdersByUser(userId: number): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
  }

  async getCustomerOrders(customerId: number): Promise<Order[]> {
    // Get customer email first
    const customer = await this.getCustomer(customerId);
    if (!customer) {
      return [];
    }
    
    return await db
      .select()
      .from(orders)
      .where(eq(orders.customerEmail, customer.email))
      .orderBy(desc(orders.createdAt));
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values({
      ...order,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return newOrder;
  }

  async updateOrder(id: number, updates: Partial<InsertOrder>): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(orders.id, id))
      .returning();
    return order || undefined;
  }

  async deleteOrder(id: number): Promise<boolean> {
    const result = await db.delete(orders).where(eq(orders.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Customer methods (CRM)
  async getAllCustomers(limit: number = 100, offset: number = 0): Promise<Customer[]> {
    return await db
      .select()
      .from(customers)
      .orderBy(desc(customers.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.email, email));
    return customer || undefined;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values({
      ...customer,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return newCustomer;
  }

  async updateCustomer(id: number, updates: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [customer] = await db
      .update(customers)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(customers.id, id))
      .returning();
    return customer || undefined;
  }

  async deleteCustomer(id: number): Promise<boolean> {
    const result = await db.delete(customers).where(eq(customers.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Address methods
  async getUserAddresses(userId: number): Promise<Address[]> {
    return await db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, userId))
      .orderBy(desc(addresses.isDefault), addresses.label);
  }

  async getCustomerAddresses(customerId: number): Promise<Address[]> {
    return await db
      .select()
      .from(addresses)
      .where(eq(addresses.customerId, customerId))
      .orderBy(desc(addresses.isDefaultShipping), desc(addresses.isDefaultBilling), addresses.label);
  }

  async createAddress(address: InsertAddress): Promise<Address> {
    const [newAddress] = await db.insert(addresses).values({
      ...address,
      createdAt: new Date()
    }).returning();
    
    // If this is a default shipping or billing address, update customer record
    if (address.customerId && (address.isDefaultShipping || address.isDefaultBilling)) {
      const updates: any = {};
      if (address.isDefaultShipping) updates.defaultShippingAddressId = newAddress.id;
      if (address.isDefaultBilling) updates.defaultBillingAddressId = newAddress.id;
      
      await db.update(customers)
        .set(updates)
        .where(eq(customers.id, address.customerId));
    }
    
    return newAddress;
  }

  async updateAddress(id: number, updates: Partial<InsertAddress>): Promise<Address | undefined> {
    const [address] = await db
      .update(addresses)
      .set(updates)
      .where(eq(addresses.id, id))
      .returning();
      
    // Update customer default addresses if needed
    if (address && address.customerId && (updates.isDefaultShipping || updates.isDefaultBilling)) {
      const customerUpdates: any = {};
      if (updates.isDefaultShipping) customerUpdates.defaultShippingAddressId = id;
      if (updates.isDefaultBilling) customerUpdates.defaultBillingAddressId = id;
      
      await db.update(customers)
        .set(customerUpdates)
        .where(eq(customers.id, address.customerId));
    }
      
    return address || undefined;
  }

  async deleteAddress(id: number): Promise<boolean> {
    const result = await db.delete(addresses).where(eq(addresses.id, id));
    return (result.rowCount || 0) > 0;
  }

  async setDefaultShippingAddress(customerId: number, addressId: number): Promise<void> {
    // First unset all default shipping for this customer
    await db.update(addresses)
      .set({ isDefaultShipping: false })
      .where(eq(addresses.customerId, customerId));
    
    // Set the new default
    await db.update(addresses)
      .set({ isDefaultShipping: true })
      .where(eq(addresses.id, addressId));
      
    // Update customer record
    await db.update(customers)
      .set({ defaultShippingAddressId: addressId })
      .where(eq(customers.id, customerId));
  }

  async setDefaultBillingAddress(customerId: number, addressId: number): Promise<void> {
    // First unset all default billing for this customer
    await db.update(addresses)
      .set({ isDefaultBilling: false })
      .where(eq(addresses.customerId, customerId));
    
    // Set the new default
    await db.update(addresses)
      .set({ isDefaultBilling: true })
      .where(eq(addresses.id, addressId));
      
    // Update customer record
    await db.update(customers)
      .set({ defaultBillingAddressId: addressId })
      .where(eq(customers.id, customerId));
  }

  // Statistics methods
  async getOrderStats(): Promise<{
    totalOrders: number;
    totalRevenue: number;
    recentOrders: Order[];
  }> {
    // Get total orders and revenue
    const [totalOrdersResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders);
    
    const [totalRevenueResult] = await db
      .select({ sum: sql<string>`coalesce(sum(total), 0)` })
      .from(orders)
      .where(eq(orders.paymentStatus, 'paid'));

    // Get recent orders
    const recentOrders = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(10);

    return {
      totalOrders: totalOrdersResult?.count || 0,
      totalRevenue: parseFloat(totalRevenueResult?.sum || '0'),
      recentOrders
    };
  }

  // Customer Journey methods implementation
  async getCustomerJourneyStages(customerId: number): Promise<CustomerJourneyStage[]> {
    return await db
      .select()
      .from(customerJourneyStages)
      .where(eq(customerJourneyStages.customerId, customerId))
      .orderBy(customerJourneyStages.createdAt);
  }

  async getCustomerJourneyEvents(customerId: number, limit: number = 50): Promise<CustomerJourneyEvent[]> {
    return await db
      .select()
      .from(customerJourneyEvents)
      .where(eq(customerJourneyEvents.customerId, customerId))
      .orderBy(desc(customerJourneyEvents.createdAt))
      .limit(limit);
  }

  async createJourneyStage(stage: InsertCustomerJourneyStage): Promise<CustomerJourneyStage> {
    const [newStage] = await db
      .insert(customerJourneyStages)
      .values({
        ...stage,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return newStage;
  }

  async updateJourneyStage(id: number, updates: Partial<InsertCustomerJourneyStage>): Promise<CustomerJourneyStage | undefined> {
    const [stage] = await db
      .update(customerJourneyStages)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(customerJourneyStages.id, id))
      .returning();
    return stage || undefined;
  }

  async recordJourneyEvent(event: InsertCustomerJourneyEvent): Promise<CustomerJourneyEvent> {
    const [newEvent] = await db
      .insert(customerJourneyEvents)
      .values({
        ...event,
        createdAt: new Date()
      })
      .returning();
    
    // Update customer journey progress after recording event
    if (event.customerId) {
      await this.updateCustomerJourneyProgress(event.customerId);
    }
    
    return newEvent;
  }

  async initializeCustomerJourney(customerId: number): Promise<void> {
    const journeyStages = [
      {
        stageName: 'visitor',
        stageTitle: 'Visitatore',
        stageDescription: 'Cliente che ha visitato il sito web',
        isCompleted: true,
        completedAt: new Date(),
        progressPercentage: 100
      },
      {
        stageName: 'interested',
        stageTitle: 'Interessato',
        stageDescription: 'Ha visualizzato prodotti e mostrato interesse',
        progressPercentage: 0
      },
      {
        stageName: 'first_purchase',
        stageTitle: 'Primo Acquisto',
        stageDescription: 'Ha completato il primo ordine',
        progressPercentage: 0
      },
      {
        stageName: 'returning',
        stageTitle: 'Cliente Ricorrente', 
        stageDescription: 'Ha effettuato più acquisti',
        progressPercentage: 0
      },
      {
        stageName: 'loyal',
        stageTitle: 'Cliente Fedele',
        stageDescription: 'Cliente con alta frequenza di acquisto',
        progressPercentage: 0
      },
      {
        stageName: 'vip',
        stageTitle: 'Cliente VIP',
        stageDescription: 'Cliente di altissimo valore',
        progressPercentage: 0
      }
    ];

    for (const stage of journeyStages) {
      await this.createJourneyStage({
        customerId,
        ...stage
      });
    }

    // Record initial visit event
    await this.recordJourneyEvent({
      customerId,
      eventType: 'customer_registered',
      eventValue: '0',
      eventData: { timestamp: new Date().toISOString() },
      points: 10,
      stageName: 'visitor'
    });
  }

  async updateCustomerJourneyProgress(customerId: number): Promise<void> {
    // Get customer data
    const customer = await this.getCustomer(customerId);
    if (!customer) return;

    const stages = await this.getCustomerJourneyStages(customerId);
    const events = await this.getCustomerJourneyEvents(customerId);

    // Calculate progress based on customer data and events
    let currentStage = 'visitor';
    let journeyScore = 0;

    // Calculate total journey score from events
    journeyScore = events.reduce((total, event) => total + (event.points || 0), 0);

    // Determine current stage based on customer behavior
    const totalSpent = parseFloat(customer.totalSpent || '0');
    const orderCount = customer.orderCount || 0;

    if (totalSpent > 1000 && orderCount > 10) {
      currentStage = 'vip';
    } else if (totalSpent > 500 && orderCount > 5) {
      currentStage = 'loyal'; 
    } else if (orderCount > 2) {
      currentStage = 'returning';
    } else if (orderCount > 0) {
      currentStage = 'first_purchase';
    } else if (events.some(e => e.eventType === 'product_view' || e.eventType === 'cart_add')) {
      currentStage = 'interested';
    }

    // Update completed stages
    const stageOrder = ['visitor', 'interested', 'first_purchase', 'returning', 'loyal', 'vip'];
    const currentStageIndex = stageOrder.indexOf(currentStage);

    for (let i = 0; i <= currentStageIndex; i++) {
      const stage = stages.find(s => s.stageName === stageOrder[i]);
      if (stage && !stage.isCompleted) {
        await this.updateJourneyStage(stage.id, {
          isCompleted: true,
          completedAt: new Date(),
          progressPercentage: 100
        });
      }
    }

    // Update customer record
    await this.updateCustomer(customerId, {
      currentJourneyStage: currentStage,
      journeyScore
    });
  }

  async updateProductColorImages(id: number, colorImages: { [color: string]: string[] }): Promise<Product | undefined> {
    const [updatedProduct] = await db
      .update(products)
      .set({ 
        colorImages: JSON.stringify(colorImages),
        updatedAt: new Date()
      })
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  // Team member methods
  async getAllTeamMembers(): Promise<TeamMember[]> {
    return await db
      .select()
      .from(teamMembers)
      .orderBy(desc(teamMembers.createdAt));
  }

  async getTeamMember(id: number): Promise<TeamMember | undefined> {
    const [member] = await db.select().from(teamMembers).where(eq(teamMembers.id, id));
    return member || undefined;
  }

  async getTeamMemberByEmail(email: string): Promise<TeamMember | undefined> {
    const [member] = await db.select().from(teamMembers).where(eq(teamMembers.email, email));
    return member || undefined;
  }

  async createTeamMember(member: InsertTeamMember): Promise<TeamMember> {
    const [newMember] = await db.insert(teamMembers).values({
      ...member,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return newMember;
  }

  async updateTeamMember(id: number, updates: Partial<InsertTeamMember>): Promise<TeamMember | undefined> {
    const [member] = await db
      .update(teamMembers)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(teamMembers.id, id))
      .returning();
    return member || undefined;
  }

  async deleteTeamMember(id: number): Promise<boolean> {
    const result = await db.delete(teamMembers).where(eq(teamMembers.id, id));
    return (result.rowCount || 0) > 0;
  }

  async activateTeamMember(id: number): Promise<TeamMember | undefined> {
    return this.updateTeamMember(id, { 
      status: 'active',
      lastLogin: new Date()
    });
  }
}

export const storage = new DatabaseStorage();
