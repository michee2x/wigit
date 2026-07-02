-- Seed data for Wigit AI Business Assistant

-- Clean up existing data (useful for resetting dev environment)
TRUNCATE TABLE logs, requests, sessions, businesses RESTART IDENTITY CASCADE;

-- Insert a test business (e.g., a hotel)
INSERT INTO businesses (id, name, email, password_hash, api_key, webhook_url)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Eko Pearl Hotel',
    'admin@ekopearl.com',
    -- password is "password123"
    '$2a$10$wN9Q7b.E/X8P1rW3O2hSWeqD60uA0vG6zI83214oK0x8rDk7kP4jO',
    'test_api_key_12345',
    'https://example.com/webhook'
);

-- Insert a test session for a guest
INSERT INTO sessions (id, business_id, phone_number, customer_ref)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    '2348000000001',
    '101'
);

-- Insert some pending and completed service requests
INSERT INTO requests (id, session_id, business_id, room, items, raw_message, status)
VALUES 
(
    '33333333-3333-3333-3333-333333333331',
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    '101',
    '["2 Bottles of Water", "Extra Towels"]',
    'I need some water and extra towels please',
    'pending'
),
(
    '33333333-3333-3333-3333-333333333332',
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    '101',
    '["Room Cleaning"]',
    'Can someone come clean my room while I am out?',
    'done'
);

-- Insert some logs to show conversation history
INSERT INTO logs (session_id, role, message)
VALUES
(
    '22222222-2222-2222-2222-222222222222',
    'user',
    'ROOM:101|KEY:test_api_key_12345'
),
(
    '22222222-2222-2222-2222-222222222222',
    'assistant',
    'Welcome to Eko Pearl Hotel! How can I assist you today?'
),
(
    '22222222-2222-2222-2222-222222222222',
    'user',
    'I need some water and extra towels please'
),
(
    '22222222-2222-2222-2222-222222222222',
    'assistant',
    'Got it! Your request for 2 bottles of water and extra towels has been logged. A member of staff will attend to you shortly. 🛎️'
);
