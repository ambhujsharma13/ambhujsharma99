import json
import finra_corporate_debt as fcd

token = fcd._get_access_token()
print("Token obtained:", bool(token))

fields = ["tradeReportDate", "gradeCode", "totalTradeCount", "totalVolumeQuantity"]

print("\n--- Test 1: MOCK dataset, fixed date ---")
mock_records = fcd._fetch_raw_records(
    fcd.CAPPED_VOLUME_URL_LIVE, fcd.CAPPED_VOLUME_URL_MOCK, fields, fcd.MOCK_FIXED_DATE, use_mock=True
)
print("Mock records found:", len(mock_records))
print(json.dumps(mock_records[:3], indent=2))

print("\n--- Test 2: LIVE dataset, 30 days back ---")
import datetime
d = (datetime.datetime.now(datetime.timezone.utc).date() - datetime.timedelta(days=30)).strftime("%Y-%m-%d")
print("Trying date:", d)
live_records = fcd._fetch_raw_records(
    fcd.CAPPED_VOLUME_URL_LIVE, fcd.CAPPED_VOLUME_URL_MOCK, fields, d, use_mock=False
)
print("Live records found (30 days back):", len(live_records))
print(json.dumps(live_records[:3], indent=2))

print("\n--- Test 3: LIVE dataset, 90 days back ---")
d2 = (datetime.datetime.now(datetime.timezone.utc).date() - datetime.timedelta(days=90)).strftime("%Y-%m-%d")
print("Trying date:", d2)
live_records2 = fcd._fetch_raw_records(
    fcd.CAPPED_VOLUME_URL_LIVE, fcd.CAPPED_VOLUME_URL_MOCK, fields, d2, use_mock=False
)
print("Live records found (90 days back):", len(live_records2))
print(json.dumps(live_records2[:3], indent=2))
