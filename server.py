import subprocess
import tempfile
import os
import json
from flask import Flask, request, Response
from flask_cors import CORS

app = Flask(__name__, static_folder=".", static_url_path="")

CORS(app, origins=["https://val-delamere-website.pages.dev/", "https://valdelamere.com/"])

@app.route("/generate", methods=["POST"])
def generate():
    data = request.get_json()

    with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
        json.dump(data, f)
        json_path = f.name

    svg_path = json_path.replace(".json", ".svg")

    try:
        subprocess.run(
            ["python", "-m", "parliamentarch", json_path, "-o", svg_path],
            check=True
        )
        with open(svg_path, "r") as f:
            svg = f.read()
        return Response(svg, mimetype="image/svg+xml")
    except subprocess.CalledProcessError as e:
        return Response(f"Script error: {e}", status=500)
    finally:
        os.unlink(json_path)
        if os.path.exists(svg_path):
            os.unlink(svg_path)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)