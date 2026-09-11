import json

d = json.load(open("_market_activity.json"))
for key in [
    "corporate_bond_market_sentiment_history",
    "housing_starts_history",
    "building_permits_history",
    "upcoming_treasury_auctions",
    "past_treasury_auctions",
]:
    val = d.get(key)
    print(f"{key}: {len(val) if val else 0} entries")
    if val:
        print(json.dumps(val[:2], indent=2))
    print()
