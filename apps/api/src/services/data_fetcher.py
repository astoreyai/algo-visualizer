from abc import ABC, abstractmethod
import pandas as pd
import yfinance as yf
import vectorbt as vbt
from typing import Optional

class DataFetcher(ABC):
    @abstractmethod
    async def fetch_ohlcv(self, symbol: str, period: str, interval: str) -> pd.DataFrame:
        pass

class YFinanceFetcher(DataFetcher):
    async def fetch_ohlcv(self, symbol: str, period: str = "1y", interval: str = "1d") -> pd.DataFrame:
        # Use vectorbt's YF wrapper for convenience as it handles some cleaning
        # But for async/custom control, we might use yf.download
        # Let's use vbt.YFData for now as it's powerful
        
        # vbt.YFData.download(symbol, period=period, interval=interval)
        # However, vbt might be synchronous in standard calls. 
        # For an API, we should ensure it doesn't block. 
        # Standard yfinance is blocking. We'll run it in a thread or use a wrapper.
        
        # For simplicity in this V1, we will call it directly, but in prod use run_in_executor
        data = vbt.YFData.download(symbol, period=period, interval=interval)
        df = data.get() # Get the DataFrame
        
        # Ensure standard columns (Open, High, Low, Close, Volume)
        # vbt usually returns a MultiIndex if multiple symbols, or standard DF if single.
        
        return df

from src.services.cache import cache_service

class DataService:
    def __init__(self):
        self.fetcher = YFinanceFetcher()

    async def get_data(self, symbol: str, period: str, interval: str) -> pd.DataFrame:
        cache_key = cache_service.generate_key("ohlcv", symbol=symbol, period=period, interval=interval)
        
        cached_df = cache_service.get_data(cache_key)
        if cached_df is not None:
            return cached_df
            
        df = await self.fetcher.fetch_ohlcv(symbol, period, interval)
        
        # Cache for 1 hour by default
        cache_service.set_data(cache_key, df)
        
        return df
