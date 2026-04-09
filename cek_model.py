import requests

# Ganti dengan GEMINI_API_KEY Anda
API_KEY = "AI...."

def cek_model_tersedia():
    print("Sedang mengambil daftar model dari Google AI Studio (v1beta)...")
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={API_KEY}"
    
    response = requests.get(url)
    
    if response.status_code == 200:
        data = response.json()
        models = data.get("models", [])
        
        print(f"\nBerhasil menemukan {len(models)} model.")
        print("-" * 50)
        
        imagen_found = False
        
        for model in models:
            name = model.get('name', '')
            methods = model.get('supportedGenerationMethods', [])
            
            # Highlight jika model mengandung kata 'imagen'
            if 'imagen' in name.lower():
                print(f"✅ MODEL IMAGEN DITEMUKAN: {name}")
                print(f"   Metode yang didukung: {methods}")
                imagen_found = True
            else:
                # Tampilkan model lain (opsional, bisa di-comment jika terlalu panjang)
                print(f"- {name}")
        
        print("-" * 50)
        if not imagen_found:
            print("❌ TIDAK ADA MODEL IMAGEN YANG TERSEDIA UNTUK API KEY INI.")
            
    else:
        print(f"Gagal mengambil data! Status Code: {response.status_code}")
        print("Pesan Error:", response.text)

if __name__ == "__main__":
    cek_model_tersedia()