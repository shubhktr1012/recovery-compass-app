import json

with open("../content/canonical/age_reversal.json", "r") as f:
    days = json.load(f)

sql = []
for day_num_str, day_data in days.items():
    cards_json = json.dumps(day_data["cards"]).replace("'", "''")
    est_mins = day_data["estimatedMinutes"]
    day_num = day_data["dayNumber"]
    
    query = f"UPDATE program_days SET cards = '{cards_json}'::jsonb, estimated_minutes = {est_mins} WHERE program_slug = 'age_reversal' AND day_number = {day_num};"
    sql.append(query)

with open("update_cards.sql", "w") as f:
    f.write("\n".join(sql))

print("SQL generated.")
