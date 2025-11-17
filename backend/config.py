"""Load environment variables from .env file."""

from pathlib import Path
from dotenv import load_dotenv

# Load .env file from backend directory
env_file = Path(__file__).parent / ".env"
load_dotenv(env_file)
