import os
import sys
import json
import urllib.parse
import http.server
import socketserver
import shutil

# Configure console encoding to UTF-8
sys.stdout.reconfigure(encoding='utf-8')

PORT = 8000
MUSIC_DIR = r"C:\Users\USER\Music\Cobra Moto Radio\COBRA MOTORADIO"
PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))

# Path to local folders
CATEGORIES = {
    "rock": os.path.join(MUSIC_DIR, "PASTA MASTER 1 ROCK CLÁSSICO"),
    "blues": os.path.join(MUSIC_DIR, "PASTA MASTER 2 BLUES-FOLK"),
    "nacional": os.path.join(MUSIC_DIR, "PASTA MASTER 3 NACIONAL")
}

# Copy the generated logo to the project directory if it exists
logo_src = r"C:\Users\USER\.gemini\antigravity\brain\be7bf329-f6aa-4d7f-842b-81aac1cade9e\cobra_motoradio_logo_1780135110524.png"
logo_dest = os.path.join(PROJECT_DIR, "logo.png")
if os.path.exists(logo_src) and not os.path.exists(logo_dest):
    try:
        shutil.copy(logo_src, logo_dest)
        print("Logo copiado com sucesso para a pasta do projeto.")
    except Exception as e:
        print(f"Erro ao copiar o logo: {e}")

class CobraRadioHandler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        # Default behavior for standard web assets (index.html, style.css, app.js, logo.png)
        return super().translate_path(path)

    def do_GET(self):
        # Handle API playlist request
        if self.path == "/api/playlist":
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            
            playlist_data = self.get_playlist_data()
            self.wfile.write(json.dumps(playlist_data, ensure_ascii=False).encode('utf-8'))
            return

        # Handle Audio file requests
        # Paths will be /audio/rock/..., /audio/blues/..., /audio/nacional/...
        if self.path.startswith("/audio/"):
            normalized_path = urllib.parse.unquote(self.path)
            parts = normalized_path.split("/", 3) # ['', 'audio', 'category', 'relative_file_path']
            if len(parts) >= 4:
                category = parts[2]
                rel_file_path = parts[3]
                
                if category in CATEGORIES:
                    # Resolve to the actual folder path
                    actual_dir = CATEGORIES[category]
                    file_path = os.path.abspath(os.path.join(actual_dir, rel_file_path))
                    
                    # Security check: ensure path is inside the category directory
                    if file_path.startswith(os.path.abspath(actual_dir)) and os.path.exists(file_path):
                        self.send_response(200)
                        self.send_header("Content-Type", "audio/mpeg")
                        self.send_header("Access-Control-Allow-Origin", "*")
                        self.send_header("Accept-Ranges", "bytes")
                        
                        # Get file size for content-length header
                        stat = os.stat(file_path)
                        self.send_header("Content-Length", str(stat.st_size))
                        self.end_headers()
                        
                        # Stream the file
                        with open(file_path, "rb") as f:
                            shutil.copyfileobj(f, self.wfile)
                        return
            
            self.send_error(404, "Arquivo de audio nao encontrado")
            return

        # Serve static frontend files from PROJECT_DIR
        # We temporarily change the current working directory to PROJECT_DIR
        # so that SimpleHTTPRequestHandler serves files from there
        old_cwd = os.getcwd()
        os.chdir(PROJECT_DIR)
        try:
            super().do_GET()
        finally:
            os.chdir(old_cwd)

    def get_playlist_data(self):
        """Scans the music directories and returns the song list as JSON"""
        data = {
            "rock": [],
            "blues": [],
            "nacional": []
        }
        
        for category, directory in CATEGORIES.items():
            if not os.path.exists(directory):
                continue
                
            # Scan recursively using os.walk
            for root, _, files in os.walk(directory):
                for file in files:
                    if file.lower().endswith(".mp3"):
                        # Get path relative to the category directory
                        rel_path = os.path.relpath(os.path.join(root, file), directory)
                        # Construct a URL-friendly path
                        url_rel_path = urllib.parse.quote(rel_path.replace(os.path.sep, "/"))
                        url = f"/audio/{category}/{url_rel_path}"
                        
                        # Extract artist and title for clean UI display
                        # Format is 'Artist - Title - Cobra Motoradio...' or 'Artist - Title.mp3'
                        name_without_ext = os.path.splitext(file)[0]
                        clean_name = name_without_ext
                        
                        # Strip Cobra Moto Radio branding in name if present for beautiful UI
                        for suffix in [" - Cobra Motoradio - A Radio Rock do Motociclista", 
                                       " - Cobra MotoRadio - A Radio Rock do Motociclista", 
                                       " - Cobra Motoradio - A Rario Rock do Motociclista",
                                       " - Cobra Moto Radio - A Radio Rock do Motociclista",
                                       " - A Radio Rock do Motociclista"]:
                            if suffix.lower() in clean_name.lower():
                                idx = clean_name.lower().find(suffix.lower())
                                clean_name = clean_name[:idx]
                                break
                        
                        parts = clean_name.split(" - ")
                        artist = parts[0].strip() if len(parts) >= 2 else "Artista Desconhecido"
                        title = parts[1].strip() if len(parts) >= 2 else clean_name
                        
                        data[category].append({
                            "name": clean_name,
                            "artist": artist,
                            "title": title,
                            "url": url
                        })
                        
        print(f"API Playlist: Rock={len(data['rock'])}, Blues={len(data['blues'])}, Nacional={len(data['nacional'])}")
        return data

# Start the server
os.chdir(PROJECT_DIR)
with socketserver.TCPServer(("", PORT), CobraRadioHandler) as httpd:
    print(f"Servidor Cobra Motoradio ativo em: http://localhost:{PORT}")
    print(f"Lendo musicas de: {MUSIC_DIR}")
    print("Pressione Ctrl+C para encerrar.")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor encerrado pelo usuario.")
