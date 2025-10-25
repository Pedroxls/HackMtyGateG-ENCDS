from supabase import create_client, Client
from dotenv import load_dotenv
import os

load_dotenv()  # Carga las variables desde un archivo .env si existe

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(url, key)

print("URL:", url)
print("KEY:", key[:10], "...")  # Solo para confirmar sin imprimir todo
