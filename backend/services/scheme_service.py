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

    disaster = disaster.lower()

    if disaster not in data:
        return []

    eligible = []

    for scheme in data[disaster]:

        if (
            scheme["min_damage"] <= damage
            and (
                scheme["state"].lower() == state.lower()
                or scheme["state"].lower() == "all"
            )
        ):
            eligible.append(scheme)

    return eligible