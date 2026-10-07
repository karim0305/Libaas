-- Run this file ALONE first (one statement), then run 008.
-- Postgres only lets a new enum value be used after it has been committed.
alter type order_status add value if not exists 'referred' before 'confirmed';
