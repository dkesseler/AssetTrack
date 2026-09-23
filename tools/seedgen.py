#!/usr/bin/env python3
"""
Regenerate fictionalized seed data for AssetTrack.

Outputs:
  - services/assets-svc/Data/SeedData.cs   (500 assets)
  - services/workforce-svc/src/main/resources/data.sql  (120 employees, ~340 assignments)
  - services/reporting-svc/sample_import.csv (10 fictional rows)

Determinism: seeded RNG so rebuilds produce stable IDs.
Preserves intentional messiness:
  - Manufacturer casing variations (Fabrikam / FABRIKAM / Fabrikam Inc., Litware / litware)
  - ~12% null serial numbers
  - Some warranties already expired
  - A few inactive employees still holding active assignments
  - A couple of lost/retired assets still on active assignments (business-rule bug)
"""

import random
import os
from pathlib import Path

random.seed(20260515)

REPO = Path(__file__).resolve().parent.parent
ASSETS_FILE = REPO / "services/assets-svc/Data/SeedData.cs"
WORKFORCE_FILE = REPO / "services/workforce-svc/src/main/resources/data.sql"
CSV_FILE = REPO / "services/reporting-svc/sample_import.csv"

# ---------- Employees ----------

FIRST_NAMES = [
    "Maya", "Marcus", "Sofia", "Wei", "Aaliyah", "Diego", "Priya", "Liam", "Nadia", "Jordan",
    "Camila", "Tyrone", "Hiroshi", "Rebecca", "Chukwu", "Anna", "Ravi", "Emma", "Khaled", "Sandra",
    "Ben", "Yuki", "Olivia", "Carlos", "Naomi", "David", "Aisha", "Bryan", "Chloe", "Dmitri",
    "Esme", "Fatima", "Gabriel", "Hana", "Imani", "Jamal", "Kira", "Leo", "Mei", "Noah",
    "Oscar", "Padma", "Quentin", "Rosa", "Sven", "Tariq", "Uma", "Victor", "Wren", "Xiao",
    "Yara", "Zane", "Amara", "Beau", "Cora", "Devon", "Elena", "Felix", "Gita", "Henry",
    "Iris", "Jonas", "Kai", "Lucia", "Mateo", "Nora", "Owen", "Paloma", "Quinn", "Rosa",
    "Sasha", "Theo", "Una", "Vince", "Willa", "Xander", "Yuna", "Zoe", "Asha", "Bruno",
    "Cleo", "Darius", "Eira", "Finn", "Greta", "Harper", "Idris", "Juno", "Kenji", "Lila",
    "Mira", "Nico", "Otis", "Polly", "Reza", "Selma", "Tobin", "Ulla", "Vera", "Wade",
    "Xavi", "Yael", "Zara", "Ada", "Bodhi", "Cyrus", "Dara", "Enzo", "Faye", "Gus",
    "Halle", "Iggy", "Junia", "Kit", "Leif", "Maeve", "Nile", "Opal", "Pax", "Rhea",
]

LAST_NAMES = [
    "Patel", "Johnson", "Rossi", "Chen", "Williams", "Hernandez", "Sharma", "OConnor", "Hassan", "Lee",
    "Garcia", "Brooks", "Tanaka", "Goldberg", "Okafor", "Kowalski", "Krishnan", "Thompson", "Mansour", "Mwangi",
    "Carter", "Nakamura", "Bennett", "Mendoza", "Reyes", "Park", "Nguyen", "Ahmed", "Lopez", "Singh",
    "Murphy", "Cohen", "Petrov", "Diallo", "Walker", "Schmidt", "Costa", "Yamamoto", "Andersen", "Khan",
    "Rivera", "Adeyemi", "Fernandez", "Bauer", "Holloway", "Iqbal", "Jensen", "Kobayashi", "Larsen", "Morales",
    "Nair", "Ortiz", "Palmer", "Quinn", "Reddy", "Sato", "Torres", "Underwood", "Vasquez", "Wagner",
    "Xu", "Yates", "Zaman", "Abbott", "Bishop", "Cruz", "Doyle", "Ellis", "Fischer", "Gomez",
    "Hayes", "Ito", "Joshi", "Klein", "Lam", "Mahmoud", "Novak", "Oliveira", "Park", "Reyes",
    "Suzuki", "Tran", "Ueda", "Vance", "Whitaker", "Yoon", "Zheng", "Acosta", "Bryant", "Calderon",
    "Drew", "Egwu", "Forsythe", "Gallagher", "Hooper", "Imamura", "Jacobs", "Kapoor", "Lindgren", "Mbeki",
    "Naidu", "Olsen", "Padilla", "Roy", "Stanton", "Toledo", "Ueno", "Vidal", "Watanabe", "Yusuf",
    "Aziz", "Barros", "Carvalho", "DeLuca", "Eskildsen", "Fonseca", "Greco", "Hayek", "Innes", "Jelinek",
]

DEPTS = [
    ("Engineering", ["Software Engineer", "Senior Engineer", "Staff Engineer", "Engineering Manager",
                     "Tech Lead", "Principal Engineer", "QA Engineer", "DevOps Engineer", "Site Reliability Engineer"]),
    ("Sales", ["Account Executive", "Sales Engineer", "VP, Sales", "Sales Development Rep",
               "Regional Sales Manager", "Customer Success Manager"]),
    ("Marketing", ["Marketing Manager", "Content Strategist", "Marketing Specialist", "Designer",
                   "Brand Manager", "Marketing Analyst"]),
    ("Operations", ["Operations Manager", "IT Support", "Facilities", "Office Manager",
                    "Operations Analyst", "Supply Chain Coordinator"]),
    ("Finance", ["CFO", "Senior Accountant", "Financial Analyst", "Accountant",
                 "Controller", "Treasury Analyst"]),
    ("Human Resources", ["VP, People", "HR Business Partner", "Recruiter",
                          "People Operations Specialist", "Talent Manager"]),
]

DEPT_COUNTS = {"Engineering": 44, "Sales": 19, "Marketing": 14, "Operations": 15, "Finance": 12, "Human Resources": 13}
assert sum(DEPT_COUNTS.values()) == 117

def gen_employees():
    emps = []
    used_emails = set()
    eid = 1
    rng = random.Random(1)
    for dept, count in DEPT_COUNTS.items():
        titles = dict(DEPTS)[dept]
        for _ in range(count):
            first = rng.choice(FIRST_NAMES)
            last = rng.choice(LAST_NAMES)
            email_base = f"{first.lower()}.{last.lower().replace(chr(39),'')}"
            email = f"{email_base}@contoso.example"
            suffix = 2
            while email in used_emails:
                email = f"{email_base}{suffix}@contoso.example"
                suffix += 1
            used_emails.add(email)
            title = rng.choice(titles)
            year = rng.randint(2014, 2025)
            month = rng.randint(1, 12)
            day = rng.randint(1, 28)
            hire = f"{year:04d}-{month:02d}-{day:02d}"
            is_active = 0 if rng.random() < 0.10 else 1
            emps.append((eid, first, last, email, dept, title, hire, is_active))
            eid += 1
    return emps

# ---------- Assets ----------

# Per-type catalog: list of (brand_options, model_options)
# brand_options can include casing variants for messiness
CATALOG = {
    "Laptop": [
        (["Fabrikam", "Fabrikam", "Fabrikam", "FABRIKAM", "Fabrikam Inc."],
         ["Vector V14", "Vector V15", "Vector V14", "Vector Pro 17", "WorkPro 14", "WorkPro 15"]),
        (["Wingtip"], ["WingBook 13", "WingBook 14 Pro", "WingFlex Convert", "WingBook 14 Pro", "WingPad Y9"]),
        (["Litware", "Litware", "Litware", "litware"],
         ["StudioBook Air 13", "StudioBook Pro 14", "StudioBook Pro 16", "StudioBook Air 13"]),
        (["Proseware"], ["EliteCore 14", "EliteCore 15", "ProBook Z2", "EliteCore 15"]),
    ],
    "Monitor": [
        (["Fabrikam"], ["Vista 24", "Vista 27", "Vista 27", "Vista 32 UltraWide"]),
        (["Trey"], ["ViewLite 24", "ViewLite 27", "ViewLite 32 4K"]),
        (["Adatum"], ["PanoView 27", "PanoView 34 UltraWide", "PanoView 27 4K"]),
        (["Litware"], ["StudioDisplay 27"]),
    ],
    "Docking Station": [
        (["Fabrikam"], ["DockMaster D20", "DockMaster D30", "DockMaster D20"]),
        (["Proseware"], ["DockStation P3", "DockStation P5"]),
    ],
    "Keyboard": [
        (["Tailspin"], ["WaveBoard Pro", "WaveBoard Compact", "WaveBoard Pro"]),
        (["Northwind"], ["MechBoard 75", "MechBoard TKL", "QuietBoard"]),
        (["Litware"], ["StudioKey Slim"]),
    ],
    "Phone": [
        (["Relecloud"], ["VoxPhone 7841", "VoxPhone 9851", "VoxPhone Lite", "VoxPhone 7841"]),
        (["Litware"], ["StudioPhone 12", "StudioPhone 13 Pro"]),
    ],
    "Keycard": [
        (["Lucerne"], ["AccessCard Pro", "AccessCard Lite"]),
    ],
}

TYPE_COUNTS = {"Laptop": 162, "Monitor": 128, "Docking Station": 64, "Keyboard": 86, "Phone": 53, "Keycard": 45}
assert sum(TYPE_COUNTS.values()) == 538

TAG_PREFIX = {"Laptop": "LPT", "Monitor": "MON", "Docking Station": "DCK", "Keyboard": "KBD", "Phone": "PHN", "Keycard": "BDG"}

# Status distribution
STATUS_TARGET = {"assigned": 322, "available": 135, "retired": 54, "lost": 27}
assert sum(STATUS_TARGET.values()) == 538

def gen_assets():
    rng = random.Random(2)
    rows = []
    aid = 1
    counters = {t: 1 for t in TYPE_COUNTS}
    # Pre-build status pool to shuffle
    status_pool = []
    for s, n in STATUS_TARGET.items():
        status_pool += [s] * n
    rng.shuffle(status_pool)
    si = 0
    for atype, count in TYPE_COUNTS.items():
        for _ in range(count):
            family = rng.choice(CATALOG[atype])
            brand = rng.choice(family[0])
            model = rng.choice(family[1])
            tag = f"CON-{TAG_PREFIX[atype]}-{counters[atype]:03d}"
            counters[atype] += 1
            # Purchase + warranty
            py = rng.randint(2018, 2025)
            pm = rng.randint(1, 12)
            pd = rng.randint(1, 28)
            purchase = f"{py:04d}-{pm:02d}-{pd:02d}"
            # 80% of warranty present, 3-year typical
            if rng.random() < 0.85:
                warranty = f"{py+rng.choice([2,3,3,3,4]):04d}-{pm:02d}-{pd:02d}"
            else:
                warranty = None
            # Keycards typically have no warranty
            if atype == "Keycard" and rng.random() < 0.7:
                warranty = None
            # Serial — 12% null
            if rng.random() < 0.12:
                serial = None
            else:
                brand_letters = "".join([c for c in brand if c.isupper()])[:2] or brand[:2].upper()
                serial = f"{brand_letters}-{rng.randint(1000, 99999)}"
            status = status_pool[si]; si += 1
            notes = None
            if status == "retired":
                notes = rng.choice([None, "Battery swelling", "End of life", "Replaced"])
            elif status == "lost":
                notes = rng.choice([None, "Lost on travel", "Not returned at offboarding", None])
            rows.append((aid, tag, atype, brand, model, serial, purchase, warranty, status, notes))
            aid += 1
    return rows

# ---------- Assignments ----------

def gen_assignments(assets, employees):
    rng = random.Random(3)
    rows = []
    active_employee_ids = [e[0] for e in employees if e[7] == 1]
    inactive_employee_ids = [e[0] for e in employees if e[7] == 0]

    # Active assignments: every "assigned" asset gets exactly one active assignment
    assigned_assets = [a for a in assets if a[8] == "assigned"]
    # 3 messy: 2 active assignments for inactive employees, 1 for a lost asset (intentional bug)
    rng.shuffle(assigned_assets)
    asg_id = 1
    for a in assigned_assets:
        emp_id = rng.choice(active_employee_ids)
        # Assign date after purchase
        py, pm, pd = [int(x) for x in a[6].split("-")]
        ay = rng.randint(py, max(py, 2025))
        am = rng.randint(1, 12)
        ad = rng.randint(1, 28)
        assigned_date = f"{ay:04d}-{am:02d}-{ad:02d}"
        rows.append((asg_id, a[0], emp_id, assigned_date, None, "helpdesk@contoso.example", None))
        asg_id += 1

    # Bug bait: re-point 2 assignments at inactive employees
    for idx in range(min(2, len(rows))):
        old = rows[idx]
        rows[idx] = (old[0], old[1], rng.choice(inactive_employee_ids), old[3], old[4], old[5], "Holdover from offboarding")

    # Bug bait: add an active assignment to one lost and one retired asset
    for status in ("lost", "retired"):
        candidates = [a for a in assets if a[8] == status]
        if candidates:
            a = rng.choice(candidates)
            rows.append((asg_id, a[0], rng.choice(active_employee_ids),
                         "2024-02-12", None, "helpdesk@contoso.example",
                         f"Still in {status} bucket but never collected"))
            asg_id += 1

    # Historical returned assignments: ~40 across available/retired/lost assets
    history_pool = [a for a in assets if a[8] in ("available", "retired", "lost")]
    rng.shuffle(history_pool)
    for a in history_pool[:40]:
        emp_id = rng.choice([e[0] for e in employees])
        py = int(a[6].split("-")[0])
        ay = rng.randint(py, max(py, 2024))
        am = rng.randint(1, 12)
        ad = rng.randint(1, 28)
        ry = rng.randint(ay, 2025)
        rm = rng.randint(1, 12)
        rd = rng.randint(1, 28)
        if (ry, rm, rd) <= (ay, am, ad):
            ry = ay + 1
        assigned_date = f"{ay:04d}-{am:02d}-{ad:02d}"
        returned_date = f"{ry:04d}-{rm:02d}-{rd:02d}"
        note = None
        if a[8] == "lost":
            note = "Lost while travelling"
        elif a[8] == "retired":
            note = "Returned, then retired"
        rows.append((asg_id, a[0], emp_id, assigned_date, returned_date, "helpdesk@contoso.example", note))
        asg_id += 1

    return rows

# ---------- Writers ----------

def cs_literal(s):
    if s is None:
        return "null"
    return '"' + s.replace("\\", "\\\\").replace('"', '\\"') + '"'

def write_assets_cs(assets):
    lines = [
        "using Dapper;",
        "using Microsoft.Data.Sqlite;",
        "",
        "namespace Contoso.Assets.Data;",
        "",
        "internal static class SeedData",
        "{",
        "    // Generated by tools/seedgen.py — do not hand-edit individual rows. Rerun the script to regenerate.",
        "    // Intentionally messy: inconsistent manufacturer casing (Fabrikam / FABRIKAM / Fabrikam Inc.,",
        "    // Litware / litware), ~12% null serials, some warranties already expired. Mirrors real legacy data.",
        "    public static void Apply(SqliteConnection conn)",
        "    {",
        "        var rows = new (string tag, string type, string manuf, string model, string? serial, string? purchase, string? warranty, string status, string? notes)[]",
        "        {",
    ]
    for a in assets:
        _, tag, atype, brand, model, serial, purchase, warranty, status, notes = a
        lines.append(
            f"            ({cs_literal(tag)}, {cs_literal(atype)}, {cs_literal(brand)}, {cs_literal(model)}, {cs_literal(serial)}, {cs_literal(purchase)}, {cs_literal(warranty)}, {cs_literal(status)}, {cs_literal(notes)}),"
        )
    lines += [
        "        };",
        "",
        "        const string sql = \"\"\"",
        "            INSERT INTO assets (asset_tag, asset_type, manufacturer, model, serial_number,",
        "                                purchase_date, warranty_expiry, status, notes)",
        "            VALUES (@tag, @type, @manuf, @model, @serial, @purchase, @warranty, @status, @notes);",
        "        \"\"\";",
        "",
        "        foreach (var r in rows)",
        "        {",
        "            conn.Execute(sql, new {",
        "                tag = r.tag, type = r.type, manuf = r.manuf, model = r.model,",
        "                serial = r.serial, purchase = r.purchase, warranty = r.warranty,",
        "                status = r.status, notes = r.notes",
        "            });",
        "        }",
        "    }",
        "}",
        "",
    ]
    ASSETS_FILE.write_text("\n".join(lines))

def sql_literal(s):
    if s is None:
        return "NULL"
    return "'" + s.replace("'", "''") + "'"

def write_workforce_sql(employees, assignments):
    lines = [
        "-- Seed data for workforce-svc. Loaded once on first start because spring.sql.init.mode=always",
        "-- combined with ddl-auto=update is idempotent only if we guard inserts.",
        "-- Generated by tools/seedgen.py — do not hand-edit individual rows. Rerun the script to regenerate.",
        "",
        "INSERT OR IGNORE INTO employees (id, first_name, last_name, email, department, title, hire_date, is_active) VALUES",
    ]
    emp_rows = []
    for e in employees:
        eid, first, last, email, dept, title, hire, active = e
        emp_rows.append(
            f"  ({eid}, {sql_literal(first)}, {sql_literal(last)}, {sql_literal(email)}, {sql_literal(dept)}, {sql_literal(title)}, {sql_literal(hire)}, {active})"
        )
    lines.append(",\n".join(emp_rows) + ";")
    lines.append("")
    lines.append("INSERT OR IGNORE INTO assignments (id, asset_id, employee_id, assigned_date, returned_date, assigned_by, notes) VALUES")
    asg_rows = []
    for r in assignments:
        aid, asset_id, emp_id, adate, rdate, by, notes = r
        asg_rows.append(
            f"  ({aid}, {asset_id}, {emp_id}, {sql_literal(adate)}, {sql_literal(rdate)}, {sql_literal(by)}, {sql_literal(notes)})"
        )
    lines.append(",\n".join(asg_rows) + ";")
    lines.append("")
    WORKFORCE_FILE.write_text("\n".join(lines))

def write_sample_csv():
    # 10 fictional rows for the legacy CSV importer
    rows = [
        ("CON-CSV-001", "Laptop", "Fabrikam", "Vector V14", "FB-CSV-001", "2023-04-10", "2026-04-10", "available", ""),
        ("CON-CSV-002", "Monitor", "Adatum", "PanoView 27", "AT-CSV-002", "2022-08-22", "2025-08-22", "available", ""),
        ("CON-CSV-003", "Keyboard", "Tailspin", "WaveBoard Pro", "TS-CSV-003", "2023-01-15", "2025-01-15", "available", ""),
        ("CON-CSV-004", "Phone", "Relecloud", "VoxPhone 7841", "", "2021-11-04", "2024-11-04", "retired", "End of life"),
        ("CON-CSV-005", "Docking Station", "Proseware", "DockStation P3", "PW-CSV-005", "2023-06-01", "2026-06-01", "available", ""),
        ("CON-CSV-006", "Monitor", "Trey", "ViewLite 27", "TR-CSV-006", "2022-03-14", "2025-03-14", "assigned", ""),
        ("CON-CSV-007", "Keycard", "Lucerne", "AccessCard Pro", "", "2023-09-01", "", "available", ""),
        ("CON-CSV-008", "Laptop", "Wingtip", "WingBook 14 Pro", "WT-CSV-008", "2024-02-20", "2027-02-20", "available", ""),
        ("CON-CSV-009", "Laptop", "Litware", "StudioBook Pro 14", "LW-CSV-009", "2023-10-11", "2026-10-11", "assigned", ""),
        ("CON-CSV-010", "Keyboard", "Northwind", "QuietBoard", "", "2022-12-05", "2024-12-05", "available", "Missing serial"),
    ]
    header = "asset_tag,asset_type,manufacturer,model,serial_number,purchase_date,warranty_expiry,status,notes"
    lines = [header]
    for r in rows:
        lines.append(",".join(r))
    CSV_FILE.write_text("\n".join(lines) + "\n")

def main():
    emps = gen_employees()
    assets = gen_assets()
    asgs = gen_assignments(assets, emps)
    write_assets_cs(assets)
    write_workforce_sql(emps, asgs)
    write_sample_csv()
    status_counts = {}
    for a in assets:
        status_counts[a[8]] = status_counts.get(a[8], 0) + 1
    active_count = sum(1 for r in asgs if r[4] is None)
    returned_count = len(asgs) - active_count
    print(f"Employees: {len(emps)} ({sum(1 for e in emps if e[7]==0)} inactive)")
    print(f"Assets:    {len(assets)}  status mix: {status_counts}")
    print(f"Assignments: {len(asgs)} ({active_count} active, {returned_count} returned)")

if __name__ == "__main__":
    main()
