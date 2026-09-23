"""Legacy helper module.

This module is written in a deliberately old-fashioned Python style for a course
exercise ("Modernize the Python Scripts"). Smells include:

* %-style string formatting instead of f-strings.
* Manual file path construction with os.path.join instead of pathlib.
* No type hints.
* Verbose if/else where ternaries or comprehensions would be clearer.
* Inconsistent return types.
"""

import os
import datetime


def format_warranty_label(asset_tag, expiry_date):
    today = datetime.date.today()
    days_remaining = (expiry_date - today).days

    if days_remaining < 0:
        return "%s: EXPIRED %d days ago" % (asset_tag, abs(days_remaining))
    elif days_remaining < 30:
        return "%s: expires in %d days (URGENT)" % (asset_tag, days_remaining)
    else:
        return "%s: expires %s" % (asset_tag, expiry_date.strftime("%Y-%m-%d"))


def read_lines_old_style(filename):
    # Builds the path the old-fashioned way.
    full_path = os.path.join(os.path.dirname(__file__), filename)
    f = open(full_path, "r")
    lines = []
    for line in f.readlines():
        line = line.rstrip("\n")
        if len(line) > 0:
            lines.append(line)
    f.close()
    return lines


def summarize_status_counts(counts):
    out = ""
    for k in counts.keys():
        out = out + "%s=%d " % (k, counts[k])
    return out.strip()
