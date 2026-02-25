## to install

python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

## start the app

uvicorn main:app --reload --port 8001
