CREATE TABLE "addresses" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"customer_id" integer,
	"label" text,
	"type" text DEFAULT 'both',
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"company" text,
	"line1" text NOT NULL,
	"line2" text,
	"city" text NOT NULL,
	"state" text,
	"postal_code" text NOT NULL,
	"country" text DEFAULT 'Italia' NOT NULL,
	"phone" text,
	"is_default" boolean DEFAULT false,
	"is_default_shipping" boolean DEFAULT false,
	"is_default_billing" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"excerpt" text,
	"content" text NOT NULL,
	"featured_image" text,
	"category" text NOT NULL,
	"tags" json,
	"status" text DEFAULT 'draft',
	"published_at" timestamp,
	"scheduled_for" timestamp,
	"author_id" integer NOT NULL,
	"view_count" integer DEFAULT 0,
	"likes" integer DEFAULT 0,
	"meta_title" text,
	"meta_description" text,
	"reading_time" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "business_kpis" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" timestamp NOT NULL,
	"period" text NOT NULL,
	"revenue" numeric(12, 2) DEFAULT '0',
	"profit" numeric(12, 2) DEFAULT '0',
	"expenses" numeric(12, 2) DEFAULT '0',
	"gross_margin" numeric(5, 4) DEFAULT '0',
	"net_margin" numeric(5, 4) DEFAULT '0',
	"customer_acquisition_cost" numeric(10, 2) DEFAULT '0',
	"customer_lifetime_value" numeric(10, 2) DEFAULT '0',
	"inventory_turnover" numeric(8, 4) DEFAULT '0',
	"stock_value" numeric(12, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "carts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"guest_id" text,
	"items" json,
	"subtotal" numeric(10, 2) DEFAULT '0',
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"parent_id" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "categories_name_unique" UNIQUE("name"),
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "customer_journey_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"event_type" text NOT NULL,
	"event_value" numeric(10, 2) DEFAULT '0',
	"event_data" json,
	"points" integer DEFAULT 0,
	"stage_name" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customer_journey_stages" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"stage_name" text NOT NULL,
	"stage_title" text NOT NULL,
	"stage_description" text,
	"is_completed" boolean DEFAULT false,
	"completed_at" timestamp,
	"progress_percentage" integer DEFAULT 0,
	"milestone_data" json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"company" text,
	"notes" text,
	"address" text,
	"city" text,
	"postal_code" text,
	"country" text DEFAULT 'Italia',
	"tags" json,
	"total_spent" numeric(10, 2) DEFAULT '0',
	"order_count" integer DEFAULT 0,
	"last_order_date" timestamp,
	"default_shipping_address_id" integer,
	"default_billing_address_id" integer,
	"current_journey_stage" text DEFAULT 'visitor',
	"journey_score" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "customers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "discount_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"discount_type" text NOT NULL,
	"discount_value" numeric(10, 2) NOT NULL,
	"minimum_order_value" numeric(10, 2),
	"maximum_discount" numeric(10, 2),
	"usage_limit" integer,
	"usage_count" integer DEFAULT 0,
	"per_customer_limit" integer DEFAULT 1,
	"applicable_products" json,
	"applicable_categories" json,
	"is_active" boolean DEFAULT true,
	"valid_from" timestamp DEFAULT now(),
	"valid_to" timestamp,
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "discount_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"expense_number" text NOT NULL,
	"vendor_name" text NOT NULL,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'EUR',
	"expense_date" timestamp NOT NULL,
	"receipt_url" text,
	"is_recurring" boolean DEFAULT false,
	"recurrence_pattern" text,
	"accounting_code" text,
	"vat_amount" numeric(10, 2) DEFAULT '0',
	"status" text DEFAULT 'pending',
	"approved_by" integer,
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "expenses_expense_number_unique" UNIQUE("expense_number")
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_number" text NOT NULL,
	"order_id" integer,
	"customer_id" integer,
	"customer_email" text NOT NULL,
	"customer_name" text NOT NULL,
	"items" json NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"vat_amount" numeric(10, 2) NOT NULL,
	"tax_amount" numeric(10, 2) DEFAULT '0',
	"total" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'EUR',
	"status" text DEFAULT 'draft',
	"due_date" timestamp,
	"paid_date" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "loyalty_program" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"total_points" integer DEFAULT 0,
	"available_points" integer DEFAULT 0,
	"tier_level" text DEFAULT 'bronze',
	"total_spent" numeric(12, 2) DEFAULT '0',
	"points_earned" integer DEFAULT 0,
	"points_redeemed" integer DEFAULT 0,
	"last_activity" timestamp,
	"joined_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "loyalty_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"loyalty_id" integer NOT NULL,
	"transaction_type" text NOT NULL,
	"points" integer NOT NULL,
	"reason" text NOT NULL,
	"order_id" integer,
	"expiry_date" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "order_shipments" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"shipment_number" text NOT NULL,
	"provider_id" integer,
	"service_code" text,
	"tracking_number" text,
	"items" json,
	"weight" numeric(8, 2),
	"shipping_cost" numeric(10, 2),
	"status" text DEFAULT 'pending',
	"shipped_at" timestamp,
	"estimated_delivery" timestamp,
	"actual_delivery" timestamp,
	"shipping_label" text,
	"tracking_events" json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "order_shipments_shipment_number_unique" UNIQUE("shipment_number")
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_number" text NOT NULL,
	"user_id" integer,
	"customer_email" text NOT NULL,
	"customer_name" text NOT NULL,
	"items" json NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"shipping_cost" numeric(10, 2) DEFAULT '0',
	"tax_amount" numeric(10, 2) DEFAULT '0',
	"total" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'EUR',
	"status" text DEFAULT 'pending',
	"payment_status" text DEFAULT 'pending',
	"payment_method" text,
	"shipping_address" json NOT NULL,
	"billing_address" json,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "product_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"customer_id" integer,
	"order_id" integer,
	"customer_name" text NOT NULL,
	"customer_email" text NOT NULL,
	"rating" integer NOT NULL,
	"title" text,
	"content" text NOT NULL,
	"images" json,
	"is_verified_purchase" boolean DEFAULT false,
	"status" text DEFAULT 'pending',
	"helpful_votes" integer DEFAULT 0,
	"report_count" integer DEFAULT 0,
	"moderated_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"sku" varchar(100) NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"subcategory" text,
	"brand" text,
	"price" numeric(10, 2) NOT NULL,
	"cost" numeric(10, 2),
	"discount_percentage" numeric(5, 2) DEFAULT '0',
	"sale_price" numeric(10, 2),
	"stock" integer DEFAULT 0 NOT NULL,
	"reserved_stock" integer DEFAULT 0,
	"min_stock" integer DEFAULT 0,
	"max_stock" integer,
	"is_active" boolean DEFAULT true,
	"is_sold_out" boolean DEFAULT false,
	"is_on_sale" boolean DEFAULT false,
	"is_featured" boolean DEFAULT false,
	"main_image" text,
	"images" json,
	"color_images" json,
	"attributes" json,
	"variants" json,
	"slug" text,
	"meta_title" text,
	"meta_description" text,
	"tags" json,
	"weight" numeric(8, 2),
	"dimensions" json,
	"color" text,
	"size" text,
	"material" text,
	"language" varchar(5) DEFAULT 'it',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "products_sku_unique" UNIQUE("sku"),
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "public_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"url" varchar NOT NULL,
	"path" varchar NOT NULL,
	"size" integer DEFAULT 0 NOT NULL,
	"type" varchar DEFAULT 'image/jpeg' NOT NULL,
	"media_type" varchar DEFAULT 'image',
	"section" varchar,
	"position" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"title" varchar,
	"subtitle" varchar,
	"button_text" varchar,
	"link_url" varchar,
	"title_color" varchar(50) DEFAULT '#ffffff',
	"subtitle_color" varchar(50) DEFAULT '#ffffff',
	"button_color" varchar(50) DEFAULT '#000000',
	"button_bg_color" varchar(50) DEFAULT '#ffffff',
	"title_font" varchar(100) DEFAULT 'Inter',
	"subtitle_font" varchar(100) DEFAULT 'Inter',
	"button_font" varchar(100) DEFAULT 'Inter',
	"title_size" varchar(20) DEFAULT 'xl',
	"subtitle_size" varchar(20) DEFAULT 'lg',
	"text_align" varchar(20) DEFAULT 'right',
	"title_weight" varchar(20) DEFAULT 'bold',
	"subtitle_weight" varchar(20) DEFAULT 'normal',
	"button_size" varchar(20) DEFAULT 'md',
	"autoplay" boolean DEFAULT false,
	"loop" boolean DEFAULT true,
	"muted" boolean DEFAULT true,
	"show_controls" boolean DEFAULT false,
	"poster_image" varchar,
	"duration" integer,
	"uploaded_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "purchase_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"po_number" text NOT NULL,
	"supplier_id" integer,
	"warehouse_id" integer,
	"items" json NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"tax_amount" numeric(10, 2) DEFAULT '0',
	"shipping_cost" numeric(10, 2) DEFAULT '0',
	"total" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'EUR',
	"status" text DEFAULT 'draft',
	"expected_delivery" timestamp,
	"actual_delivery" timestamp,
	"created_by" integer,
	"approved_by" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "purchase_orders_po_number_unique" UNIQUE("po_number")
);
--> statement-breakpoint
CREATE TABLE "returns" (
	"id" serial PRIMARY KEY NOT NULL,
	"return_number" text NOT NULL,
	"order_id" integer NOT NULL,
	"customer_id" integer,
	"customer_email" text NOT NULL,
	"items" json NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"refund_amount" numeric(10, 2),
	"refund_method" text,
	"reason" text NOT NULL,
	"status" text DEFAULT 'requested',
	"return_shipping" json,
	"notes" text,
	"processed_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "returns_return_number_unique" UNIQUE("return_number")
);
--> statement-breakpoint
CREATE TABLE "sales_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" timestamp NOT NULL,
	"period" text NOT NULL,
	"total_orders" integer DEFAULT 0,
	"total_revenue" numeric(12, 2) DEFAULT '0',
	"avg_order_value" numeric(10, 2) DEFAULT '0',
	"new_customers" integer DEFAULT 0,
	"returning_customers" integer DEFAULT 0,
	"top_products" json,
	"top_categories" json,
	"conversion_rate" numeric(5, 4) DEFAULT '0',
	"refund_rate" numeric(5, 4) DEFAULT '0',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "shipping_providers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" varchar(20) NOT NULL,
	"website" text,
	"api_endpoint" text,
	"tracking_url" text,
	"supported_services" json,
	"is_active" boolean DEFAULT true,
	"configuration" json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "shipping_providers_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "shipping_rates" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider_id" integer NOT NULL,
	"service_name" text NOT NULL,
	"service_code" varchar(50) NOT NULL,
	"zone" text NOT NULL,
	"min_weight" numeric(8, 2) DEFAULT '0',
	"max_weight" numeric(8, 2),
	"base_rate" numeric(10, 2) NOT NULL,
	"per_kg_rate" numeric(10, 2) DEFAULT '0',
	"estimated_days" integer,
	"free_shipping_threshold" numeric(10, 2),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"warehouse_id" integer,
	"movement_type" text NOT NULL,
	"quantity" integer NOT NULL,
	"previous_stock" integer NOT NULL,
	"new_stock" integer NOT NULL,
	"unit_cost" numeric(10, 2),
	"total_cost" numeric(10, 2),
	"reason" text NOT NULL,
	"reference_type" text,
	"reference_id" text,
	"batch_number" text,
	"expiry_date" timestamp,
	"performed_by" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" varchar(20) NOT NULL,
	"email" text,
	"phone" text,
	"website" text,
	"address" text,
	"city" text,
	"postal_code" text,
	"country" text DEFAULT 'Italia',
	"contact_person" text,
	"payment_terms" text,
	"category" text,
	"rating" numeric(2, 1) DEFAULT '0',
	"total_orders" integer DEFAULT 0,
	"total_spent" numeric(12, 2) DEFAULT '0',
	"last_order_date" timestamp,
	"status" text DEFAULT 'active',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "suppliers_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "system_configurations" (
	"id" serial PRIMARY KEY NOT NULL,
	"section" text NOT NULL,
	"key" text NOT NULL,
	"value" text,
	"is_active" boolean DEFAULT true,
	"is_sensitive" boolean DEFAULT false,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tax_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"country" text NOT NULL,
	"region" text,
	"tax_name" text NOT NULL,
	"tax_rate" numeric(5, 4) NOT NULL,
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"effective_from" timestamp DEFAULT now(),
	"effective_to" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "team_audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"action" text NOT NULL,
	"resource" text,
	"resource_id" text,
	"details" json,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"email" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"role" text DEFAULT 'viewer',
	"permissions" json,
	"department" text,
	"position" text,
	"last_login" timestamp,
	"status" text DEFAULT 'pending',
	"invited_by" integer,
	"invitation_token" text,
	"invitation_expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "team_members_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "team_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"category" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "team_permissions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"username" text,
	"password_hash" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"phone" text,
	"role" text DEFAULT 'customer',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "warehouses" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" varchar(20) NOT NULL,
	"description" text,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"postal_code" text NOT NULL,
	"country" text DEFAULT 'Italia' NOT NULL,
	"phone" text,
	"email" text,
	"manager_id" integer,
	"is_active" boolean DEFAULT true,
	"is_default" boolean DEFAULT false,
	"capacity" integer,
	"current_utilization" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "warehouses_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_journey_events" ADD CONSTRAINT "customer_journey_events_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_journey_stages" ADD CONSTRAINT "customer_journey_stages_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount_codes" ADD CONSTRAINT "discount_codes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_program" ADD CONSTRAINT "loyalty_program_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_loyalty_id_loyalty_program_id_fk" FOREIGN KEY ("loyalty_id") REFERENCES "public"."loyalty_program"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_shipments" ADD CONSTRAINT "order_shipments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_shipments" ADD CONSTRAINT "order_shipments_provider_id_shipping_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."shipping_providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_moderated_by_users_id_fk" FOREIGN KEY ("moderated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "returns" ADD CONSTRAINT "returns_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "returns" ADD CONSTRAINT "returns_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "returns" ADD CONSTRAINT "returns_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_rates" ADD CONSTRAINT "shipping_rates_provider_id_shipping_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."shipping_providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_audit_log" ADD CONSTRAINT "team_audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;