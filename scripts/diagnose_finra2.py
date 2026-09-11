import finra_treasury_volume as fv
import requests

token = fv._get_access_token()
print("Token obtained:", bool(token))

resp = requests.post(
    fv.DATA_URL_LIVE,
    headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    json={
        "limit": 5,
        "fields": ["tradeDate", "productCategory"],
        "compareFilters": [
            {"fieldName": "tradeDate", "fieldValue": fv._most_recent_weekday_before(1), "compareType": "equal"}
        ],
    },
    timeout=30,
)
print("Status:", resp.status_code)
print("Headers:", dict(resp.headers))
print("Raw text (first 500 chars):", repr(resp.text[:500]))
