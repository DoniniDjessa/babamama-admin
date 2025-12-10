-- Remove driver fields from delivery vehicles table
-- Chauffeur will be selected from employees list when editing orders

alter table public."ali-delivery-vehicles"
drop column if exists driver_name,
drop column if exists driver_phone;

