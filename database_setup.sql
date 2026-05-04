-- Celio E-commerce Database Setup
-- This file contains all the necessary data to initialize your database

-- Insert Categories
INSERT INTO categories (id, name, slug, description, parent_id, is_active, created_at) VALUES 
(1, 'Abbigliamento', 'abbigliamento', 'Abbigliamento generale per uomo e donna', null, true, '2025-09-04 13:20:54.312905'),
(2, 'Camicie', 'camicie', 'Camicie eleganti e casual', null, true, '2025-09-04 13:20:54.312905'),
(3, 'Pantaloni', 'pantaloni', 'Pantaloni, jeans e chino', null, true, '2025-09-04 13:20:54.312905'),
(4, 'Scarpe', 'scarpe', 'Calzature per ogni occasione', null, true, '2025-09-04 13:20:54.312905'),
(5, 'Accessori', 'accessori', 'Accessori di moda e complementi', null, true, '2025-09-04 13:20:54.312905'),
(6, 'Profumi', 'profumi', 'Fragranze e profumi', null, true, '2025-09-04 13:20:54.312905'),
(7, 'Novità', 'nouveautes', 'Novità e nuovi arrivi', null, true, '2025-09-04 13:20:54.312905'),
(8, 'Costumes', 'costumes', 'Completi e abiti eleganti', null, true, '2025-09-04 13:20:54.312905'),
(9, 'T-shirt', 't-shirt', 'T-shirt e magliette', null, true, '2025-09-04 13:20:54.312905'),
(10, 'Polo', 'polo', 'Polo casual e sportive', null, true, '2025-09-04 13:20:54.312905'),
(11, 'Felpe', 'felpe', 'Felpe e hoodie', null, true, '2025-09-04 13:20:54.312905'),
(12, 'Pullover', 'pullover', 'Pullover e maglioni', null, true, '2025-09-04 13:20:54.312905'),
(13, 'Giubbotti', 'giubbotti', 'Giubbotti e giacche', null, true, '2025-09-04 13:20:54.312905'),
(14, 'Jeans', 'jeans', 'Jeans di ogni stile', null, true, '2025-09-04 13:20:54.312905'),
(15, 'Chino', 'chino', 'Pantaloni chino', null, true, '2025-09-04 13:20:54.312905'),
(16, 'Sneakers', 'sneakers', 'Sneakers e scarpe sportive', null, true, '2025-09-04 13:20:54.312905'),
(17, 'Cinture', 'cinture', 'Cinture e accessori', null, true, '2025-09-04 13:20:54.312905'),
(18, 'Cappelli', 'cappelli', 'Cappelli e berretti', null, true, '2025-09-04 13:20:54.312905'),
(19, 'Sciarpe', 'sciarpe', 'Sciarpe e foulard', null, true, '2025-09-04 13:20:54.312905'),
(20, 'Guanti', 'guanti', 'Guanti per tutte le stagioni', null, true, '2025-09-04 13:20:54.312905'),
(21, 'Calze', 'calze', 'Calze e calzini', null, true, '2025-09-04 13:20:54.312905'),
(22, 'Boxer', 'boxer', 'Intimo maschile', null, true, '2025-09-04 13:20:54.312905'),
(23, 'Baggy Party', 'baggy-party', 'Collezione Baggy Party', null, true, '2025-09-04 13:20:54.312905'),
(24, 'One Piece', 'one-piece', 'Collezione One Piece', null, true, '2025-09-04 13:20:54.312905'),
(25, 'Collabs', 'collabs', 'Collaborazioni speciali', null, true, '2025-09-04 13:20:54.312905')
ON CONFLICT (id) DO NOTHING;

-- Insert Hero Images for Homepage Carousel
INSERT INTO public_images (id, name, url, path, size, type, uploaded_at, created_at, section, position, is_active, title, subtitle, button_text, link_url, title_color, subtitle_color, button_color, button_bg_color, title_font, subtitle_font, button_font, title_size, subtitle_size, text_align, title_weight, subtitle_weight, button_size, media_type, autoplay, loop, muted, show_controls, poster_image, duration) VALUES 
(21, 'baggyita.jpg', 'https://i.postimg.cc/4xVTmdj0/baggyita.jpg', 'https://i.postimg.cc/4xVTmdj0/baggyita.jpg', 0, 'image/jpeg', '2025-09-08 09:05:33.296556', '2025-09-08 09:05:33.296556', 'hero', 0, true, 'la baggy', 'party', 'scopri', '/catalog', '#ffffff', '#ffffff', '#000000', '#ffffff', 'Inter', 'Inter', 'Inter', 'xl', 'lg', 'right', 'bold', 'normal', 'md', 'image', false, true, true, false, null, null),
(23, 'vierge.jpg', 'https://i.postimg.cc/SsqQy8sV/vierge.jpg', 'https://i.postimg.cc/SsqQy8sV/vierge.jpg', 0, 'image/jpeg', '2025-09-08 09:38:18.98171', '2025-09-08 09:38:18.98171', 'hero', 1, true, 'Gli essenzia ', 'per il rientro', 'scopri', '/catalog', '#080303', '#0c0303', '#f4ebeb', '#0e0101', 'Inter', 'Inter', 'Inter', 'xl', 'lg', 'right', 'bold', 'normal', 'md', 'image', false, true, true, false, null, null),
(28, '1eypd5ydqr', 'https://fast.wistia.com/embed/iframe/1eypd5ydqr', 'https://fast.wistia.com/embed/iframe/1eypd5ydqr', 0, 'video/mp4', '2025-09-09 09:17:51.313204', '2025-09-09 09:17:51.313204', 'hero', 2, true, '', '', 'Acquista Ora', '/catalog', '#ffffff', '#ffffff', '#000000', '#ffffff', 'system-ui', 'system-ui', 'system-ui', 'xl', 'lg', 'right', 'bold', 'normal', 'md', 'video', true, true, true, false, null, null)
ON CONFLICT (id) DO NOTHING;

-- Create Default Admin User (password: admin123)
-- Password hash for 'admin123' using bcrypt
INSERT INTO users (id, email, username, password_hash, first_name, last_name, role, is_active, created_at, updated_at) VALUES 
(1, 'admin@celio.com', 'admin', '$2b$10$rOzJqaQN1.VwVHDxHs5O1.4kUK9JXqJ8mKxN2qO8rJ5lQJ3K8xJVy', 'Admin', 'User', 'admin', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Reset sequences to avoid conflicts
SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));
SELECT setval('public_images_id_seq', (SELECT MAX(id) FROM public_images));  
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));