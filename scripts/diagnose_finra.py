import finra_treasury_volume as fv
import requests

token = fv._get_access_token()
print("Token obtained:", bool(token))
print()

base_fields = ["yearsToMaturity", "dealerCustomerVolume", "atsInterdealerVolume", "tradeDate", "dealerCustomerCount"]

variations = {
    "lowercase 'equal'": {
        "limit": 5,
        "fields": base_fields,
        "compareFilters": [{"fieldName": "tradeDate", "fieldValue": "2023-02-13", "compareType": "equal"}],
    },
    "uppercase 'EQUAL'": {
        "limit": 5,
        "fields": base_fields,
        "compareFilters": [{"fieldName": "tradeDate", "fieldValue": "2023-02-13", "compareType": "EQUAL"}],
    },
    "'EQUALS' with S": {
        "limit": 5,
        "fields": base_fields,
        "compareFilters": [{"fieldName": "tradeDate", "fieldValue": "2023-02-13", "compareType": "EQUALS"}],
    },
    "no filter at all (baseline)": {
        "limit": 5,
        "fields": base_fields,
    },
    "no fields restriction, with lowercase filter": {
        "limit": 5,
        "compareFilters": [{"fieldName": "tradeDate", "fieldValue": "2023-02-13", "compareType": "equal"}],
    },
}

for label, payload in variations.items():
    r = requests.post(
        fv.DATA_URL_MOCK,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json=payload,
        timeout=30,
    )
    record_total = r.headers.get("record-total", "MISSING")
    print(f"{label}:")
    print(f"  status={r.status_code}  record-total={record_total}")
    if r.status_code == 200:
        print(f"  BODY: {r.text[:300]}")
    print()
