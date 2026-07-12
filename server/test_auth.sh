#!/bin/bash
echo "--- 1. Register a tenant user ---"
curl -s -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Tenant", "email": "tenant@test.com", "password": "password123", "role": "tenant"}'

echo -e "\n\n--- 2. Login tenant user & save cookie ---"
curl -s -c cookies_tenant.txt -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "tenant@test.com", "password": "password123"}'

echo -e "\n\n--- 3. Tenant hitting /api/admin/ping (Should fail 403) ---"
curl -s -b cookies_tenant.txt http://localhost:5001/api/admin/ping

echo -e "\n\n--- 4. Login admin & save cookie ---"
curl -s -c cookies_admin.txt -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "adminpassword123"}'

echo -e "\n\n--- 5. Admin hitting /api/admin/ping (Should succeed 200) ---"
curl -s -b cookies_admin.txt http://localhost:5001/api/admin/ping

echo -e "\n\n--- 6. Get Me (Admin) ---"
curl -s -b cookies_admin.txt http://localhost:5001/api/auth/me

echo -e "\n\n--- 7. Logout (Admin) ---"
curl -s -b cookies_admin.txt -X POST http://localhost:5001/api/auth/logout

echo -e "\n"
