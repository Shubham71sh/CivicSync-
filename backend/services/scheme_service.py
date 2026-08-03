import json
import os

DATA_FILE = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "data",
    "government_schemes.json"
)


def get_eligible_schemes(disaster, damage, state):
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    req_d = (disaster or "").lower().replace("_", "").replace(" ", "")

    for k in data:
        clean_k = k.lower().replace("_", "").replace(" ", "")
        if clean_k in req_d or req_d in clean_k:
            return data[k]

    return []