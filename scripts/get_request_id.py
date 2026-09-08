import finra_treasury_volume as fv
import requests

token = fv._get_access_token()
print("Token obtained:", bool(token))

payload = {
    "limit": 5,
    "fields": ["yearsToMaturity", "dealerCustomerVolume", "atsInterdealerVolume", "tradeDate", "dealerCustomerCount"],
}

r = requests.post(
    fv.DATA_URL_MOCK,
    headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    json=payload,
    timeout=30,
)

print("Status:", r.status_code)
print("record-total:", r.headers.get("record-total", "MISSING"))
print("finra-api-request-id:", r.headers.get("finra-api-request-id", "MISSING"))
