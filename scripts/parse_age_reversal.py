"""
Recovery Compass — Age Reversal Program Parser
Parses New_Female_Age_Reversal_90_Day_Program.docx
Outputs card JSON matching the v2 card schema
Usage: python3 parse_age_reversal.py [--days 1-7] [--dry-run]
"""

import re
import json
import sys
from docx import Document

DOCX_PATH = "/Users/shubh/Development/recovery-compass/documents/New Female_Age_Reversal_90_Day_Program.docx"
PROGRAM_SLUG = 'age_reversal'

# ─── PHASE LOOKUP ────────────────────────────────────────────────────────────
PHASES = [
    (1, 21,  "Phase 1 · Foundation",  1, 2, 3,  8, 25),
    (22, 45, "Phase 2 · Activation",  2, 3, 4, 10, 25),
    (46, 70, "Phase 3 · Strength",    3, 3, 5, 12, 25),
    (71, 90, "Phase 4 · Mastery",     4, 4, 5, 15, 30),
]

def get_phase(day_number):
    for start, end, label, num, sets, reps, hold, duration in PHASES:
        if start <= day_number <= end:
            return {
                "label": label,
                "number": num,
                "sets": sets,
                "reps": reps,
                "holdSeconds": hold,
                "durationMinutes": duration
            }
    return None

# ─── CARD BUILDERS ───────────────────────────────────────────────────────────

def build_intro_card(day_number, day_title, phase):
    return {
        "type": "intro",
        "dayNumber": day_number,
        "dayTitle": day_title,
        "phase": phase["label"],
        "phaseNumber": phase["number"],
        "goal": f"Complete Day {day_number} with steady, consistent action.",
        "estimatedMinutes": phase["durationMinutes"],
        "parameters": {
            "sets": phase["sets"],
            "reps": phase["reps"],
            "holdSeconds": phase["holdSeconds"],
            "durationMinutes": phase["durationMinutes"]
        }
    }

def build_lesson_card(science_text):
    # The "Why This Works Today" section becomes the lesson card
    return {
        "type": "lesson",
        "pullQuote": None,
        "paragraphs": [science_text],
        "highlight": None
    }

def build_walking_card():
    return {
        "type": "action_step",
        "stepLabel": "Step 1 · Body Circulation",
        "title": "20-Minute Walk",
        "subtitle": "Wakes up circulation before facial exercises",
        "instructions": [
            "Walk at a comfortable pace for 20 minutes.",
            "Keep your posture upright, shoulders relaxed.",
            "Breathe naturally through the nose if possible."
        ],
        "purpose": "Improves blood circulation, supports cellular energy production, and reduces physical tension before facial work."
    }

def build_exercise_card(name, target_muscle, category, steps, sets, reps, hold_seconds):
    # Build a clean science note based on category
    science_notes = {
        "Isometric Hold": "Trains the SMAS layer — the same muscle layer facelift surgery targets — through consistent isometric activation.",
        "Finger Resistance": "Adds progressive load against resistance, stimulating muscle growth the same way body training does.",
        "Lymphatic Drainage": "Pumps stagnant fluid out through the neck lymph chain, reducing puffiness and improving circulation.",
        "Gua Sha and Rolling": "Creates micro-tension on facial skin, signalling fibroblasts to produce new collagen.",
        "Facial Yoga Flow": "Creates dynamic movement across multiple muscle groups simultaneously for functional facial fitness.",
        "Tongue Posture": "Subtly reshapes the submental area through consistent tongue positioning against the palate."
    }

    return {
        "type": "exercise_routine",
        "category": category,
        "name": name,
        "targetMuscle": target_muscle,
        "steps": steps,
        "sets": sets,
        "reps": reps,
        "holdSeconds": hold_seconds,
        "scienceNote": science_notes.get(category, "Consistent daily practice produces cumulative results over 6–12 weeks.")
    }

def build_calm_card():
    return {
        "type": "mindfulness_exercise",
        "title": "Calm Session",
        "subtitle": "Nervous system reset",
        "steps": [
            "Open the app and tap the Calm button.",
            "Complete today's guided calm session.",
            "If offline: sit quietly and take 20 slow breaths — inhale for 4 counts, exhale for 6 counts."
        ],
        "benefits": [
            "Relaxes the nervous system",
            "Lowers cortisol — which directly slows skin aging",
            "Supports hormonal balance"
        ],
        "timerSeconds": None,
        "completionMessage": "Stay with the practice until your body feels steadier."
    }

def build_sleep_card():
    return {
        "type": "action_step",
        "stepLabel": "Step 4 · Sleep Preparation",
        "title": "Sleep Before 11 PM",
        "subtitle": "Growth hormone releases in deep sleep before midnight",
        "instructions": [
            "Aim to sleep before 11 PM tonight.",
            "Turn off screens 30 minutes before bed.",
            "Allow your body and mind to relax.",
            "Maintain a consistent sleep time."
        ],
        "purpose": "Growth hormone — the body's main skin repair hormone — is released primarily in deep sleep before midnight. Consistent sleep timing also supports female hormone balance."
    }

def build_close_card(day_number, day_title):
    return {
        "type": "close",
        "message": f"Day {day_number} complete.",
        "secondaryMessage": f"You showed up for {day_title.lower()} today. Every day you return, the results compound."
    }

# ─── REST DAY BUILDER ────────────────────────────────────────────────────────

def build_rest_day_cards(day_number, day_title, phase, science_text):
    return [
        build_intro_card(day_number, day_title, phase),
        {
            "type": "lesson",
            "pullQuote": "Your muscles grow stronger during rest, not during effort.",
            "paragraphs": [
                "Today is an active recovery day. Your facial muscles adapt and strengthen during rest.",
                science_text if science_text else "Consistent sleep and calm signal the body to consolidate the gains from the past weeks."
            ],
            "highlight": None
        },
        build_walking_card(),
        build_calm_card(),
        build_sleep_card(),
        {
            "type": "journal",
            "prompt": f"Looking back at the past phase, what change have you noticed most?",
            "helperText": "Even subtle changes count — skin texture, how you hold your face, energy levels.",
            "followUpPrompt": "What do you want to focus on in the next phase?"
        },
        build_close_card(day_number, day_title)
    ]

# ─── DOCX PARSER ─────────────────────────────────────────────────────────────

def parse_exercise_block(lines, start_idx, sets, reps, hold_seconds):
    """
    Parse an exercise block starting at 'Exercise N: Name' line.
    Returns (exercise_card, next_idx)
    """
    header = lines[start_idx]

    # Extract name after "Exercise N: "
    name_match = re.match(r'Exercise \d+:\s*(.+)', header)
    if not name_match:
        return None, start_idx + 1
    name = name_match.group(1).strip()

    idx = start_idx + 1
    target_muscle = ""
    category = ""
    steps = []

    # Next line: "Target: X   •   Category: Y"
    if idx < len(lines):
        target_line = lines[idx]
        target_match = re.search(r'Target:\s*(.+?)\s*[•·]\s*Category:\s*(.+)', target_line)
        if target_match:
            target_muscle = target_match.group(1).strip()
            category = target_match.group(2).strip()
        idx += 1

    # Skip "How to do it:" line
    if idx < len(lines) and lines[idx].lower().startswith('how to do it'):
        idx += 1

    # Collect steps until we hit "Perform:" or next exercise or next section
    while idx < len(lines):
        line = lines[idx]
        if (line.startswith('Perform:') or
            re.match(r'Exercise \d+:', line) or
            line.startswith('STEP ') or
            line.startswith('WHY THIS WORKS') or
            re.match(r'DAY \d+', line)):
            break
        steps.append(line)
        idx += 1

    # Parse "Perform: N sets of N reps, holding each rep for N sec."
    # (we already have sets/reps/hold from phase, but verify)
    if idx < len(lines) and lines[idx].startswith('Perform:'):
        perform_line = lines[idx]
        sets_match = re.search(r'(\d+)\s+sets', perform_line)
        reps_match = re.search(r'(\d+)\s+reps', perform_line)
        hold_match = re.search(r'(\d+)\s+sec', perform_line)
        if sets_match: sets = int(sets_match.group(1))
        if reps_match: reps = int(reps_match.group(1))
        if hold_match: hold_seconds = int(hold_match.group(1))
        idx += 1

    card = build_exercise_card(name, target_muscle, category, steps, sets, reps, hold_seconds)
    return card, idx


def parse_days(docx_path, day_range=None):
    doc = Document(docx_path)

    # Extract all non-empty paragraph texts
    lines = [p.text.strip() for p in doc.paragraphs if p.text.strip()]

    days = {}
    i = 0

    while i < len(lines):
        line = lines[i]

        # ── Day header: "DAY N   •   Phase X: Label"
        day_match = re.match(r'DAY (\d+)\s*[•·]\s*(.+)', line)
        if not day_match:
            i += 1
            continue

        day_number = int(day_match.group(1))

        # Filter to requested range
        if day_range and day_number not in day_range:
            i += 1
            continue

        phase = get_phase(day_number)
        if not phase:
            i += 1
            continue

        i += 1

        # Day title — next non-empty line that isn't a section header
        day_title = ""
        if i < len(lines) and not lines[i].startswith("TODAY"):
            day_title = lines[i]
            i += 1

        # Skip "TODAY'S PARAMETERS" and "TODAY'S GOAL" lines
        while i < len(lines) and (lines[i].startswith("TODAY'S") or lines[i].startswith("Sets")):
            i += 1

        # Detect rest day
        is_rest_day = (day_title.lower().startswith("rest") or
                       day_number in [21, 45, 70, 90])

        if is_rest_day:
            # Collect science text
            science_text = ""
            while i < len(lines):
                if re.match(r'DAY \d+', lines[i]):
                    break
                if lines[i].startswith("WHY") or lines[i].startswith("WHY THIS"):
                    i += 1
                    if i < len(lines) and not re.match(r'DAY \d+', lines[i]):
                        science_text = lines[i]
                        i += 1
                    break
                i += 1

            cards = build_rest_day_cards(day_number, day_title, phase, science_text)
            days[day_number] = {
                "dayNumber": day_number,
                "dayTitle": day_title,
                "estimatedMinutes": phase["durationMinutes"],
                "cards": cards
            }
            continue

        # ── Parse normal day sections
        walking_done = False
        exercises = []
        calm_done = False
        sleep_done = False
        science_text = ""

        while i < len(lines):
            line = lines[i]

            # Stop at next day
            if re.match(r'DAY \d+\s*[•·]', line):
                break

            # STEP 1 — WALKING
            if 'STEP 1' in line and 'WALKING' in line:
                walking_done = True
                # Skip walking description lines
                i += 1
                while i < len(lines):
                    l = lines[i]
                    if (l.startswith('STEP 2') or
                        re.match(r'Exercise \d+:', l) or
                        l.startswith('STEP 3')):
                        break
                    i += 1
                continue

            # STEP 2 — FACIAL EXERCISES
            if 'STEP 2' in line and 'FACIAL' in line:
                i += 1
                continue

            # Exercise blocks
            if re.match(r'Exercise \d+:', line):
                card, i = parse_exercise_block(
                    lines, i,
                    phase["sets"], phase["reps"], phase["holdSeconds"]
                )
                if card:
                    exercises.append(card)
                continue

            # STEP 3 — CALM SESSION
            if 'STEP 3' in line and 'CALM' in line:
                calm_done = True
                # Skip calm description lines
                i += 1
                while i < len(lines):
                    l = lines[i]
                    if l.startswith('STEP 4') or l.startswith('WHY') or re.match(r'DAY \d+', l):
                        break
                    i += 1
                continue

            # STEP 4 — SLEEP PREPARATION
            if 'STEP 4' in line and 'SLEEP' in line:
                sleep_done = True
                i += 1
                while i < len(lines):
                    l = lines[i]
                    if l.startswith('WHY') or re.match(r'DAY \d+', l):
                        break
                    i += 1
                continue

            # WHY THIS WORKS TODAY
            if line.startswith('WHY THIS WORKS') or line.startswith('WHY REST'):
                i += 1
                if i < len(lines) and not re.match(r'DAY \d+', lines[i]):
                    science_text = lines[i]
                    i += 1
                break

            i += 1

        # ── Assemble cards for this day
        cards = []
        cards.append(build_intro_card(day_number, day_title, phase))

        if science_text:
            cards.append(build_lesson_card(science_text))

        if walking_done:
            cards.append(build_walking_card())

        for ex in exercises:
            cards.append(ex)

        if calm_done:
            cards.append(build_calm_card())

        if sleep_done:
            cards.append(build_sleep_card())

        cards.append(build_close_card(day_number, day_title))

        days[day_number] = {
            "dayNumber": day_number,
            "dayTitle": day_title,
            "estimatedMinutes": phase["durationMinutes"],
            "cards": cards
        }

    return days


# ─── MAIN ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    # Parse args
    day_range = range(1, 8)  # default: days 1-7
    dry_run = True

    for arg in sys.argv[1:]:
        if arg == '--all':
            day_range = range(1, 91)
        elif arg.startswith('--days='):
            parts = arg.replace('--days=', '').split('-')
            day_range = range(int(parts[0]), int(parts[1]) + 1)
        elif arg == '--no-dry-run':
            dry_run = False

    print(f"Parsing days {min(day_range)}-{max(day_range)} from {DOCX_PATH}")
    print(f"Mode: {'DRY RUN (no Supabase writes)' if dry_run else 'LIVE (will write to Supabase)'}\n")

    days = parse_days(DOCX_PATH, set(day_range))

    for day_num in sorted(days.keys()):
        day = days[day_num]
        card_types = [c['type'] for c in day['cards']]
        print(f"Day {day_num:2d} | {day['dayTitle']:<30} | {len(day['cards'])} cards: {', '.join(card_types)}")

    print(f"\nTotal days parsed: {len(days)}")

    if not dry_run:
        import os
        import urllib.request
        import urllib.parse

        supabase_url = os.environ.get('SUPABASE_URL', 'https://uzlaomhohhzrmznlvlxy.supabase.co')
        supabase_key = os.environ.get('SUPABASE_SERVICE_KEY', '')

        if not supabase_key:
            print("\nERROR: SUPABASE_SERVICE_KEY env var required for live run")
            sys.exit(1)

        print(f"\nWriting to Supabase...")
        for day_num, day in sorted(days.items()):
            # Use Supabase REST API to update
            url = f"{supabase_url}/rest/v1/program_days"
            params = f"program_slug=eq.{PROGRAM_SLUG}&day_number=eq.{day_num}"
            payload = json.dumps({
                "cards": day["cards"],
                "day_title": day["dayTitle"],
                "estimated_minutes": day["estimatedMinutes"]
            }).encode()

            req = urllib.request.Request(
                f"{url}?{params}",
                data=payload,
                method='PATCH',
                headers={
                    'apikey': supabase_key,
                    'Authorization': f'Bearer {supabase_key}',
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                }
            )
            try:
                with urllib.request.urlopen(req) as res:
                    print(f"  ✓ Day {day_num} updated (HTTP {res.status})")
            except Exception as e:
                print(f"  ✗ Day {day_num} failed: {e}")

    else:
        # In dry run, output the JSON for inspection
        import os
        output_dir = '/Users/shubh/Development/recovery-compass/app/content'
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, 'age_reversal_parsed_output.json')
        with open(output_path, 'w') as f:
            json.dump(days, f, indent=2, ensure_ascii=False)
        print(f"\nDry run complete. JSON written to {output_path}")
        print("Review the output, then run with --no-dry-run to write to Supabase.")
