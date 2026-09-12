# Base provider interface — kept as a plain class (no ABC) to avoid
# Python's strict abstract method enforcement causing instantiation errors
# when method signatures don't match exactly.
class DataProvider:
    def name(self):
        raise NotImplementedError
    def get_daily_history(self, symbol, start_date):
        raise NotImplementedError
    def get_market_cap(self, symbol):
        raise NotImplementedError
    def get_key_stats(self, symbol):
        raise NotImplementedError
