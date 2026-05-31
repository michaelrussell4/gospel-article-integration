import json
import os
import re

def verify_parsing():
    json_path = "data/articles.json"
    if not os.path.exists(json_path):
        print(f"Error: {json_path} does not exist. Run parse_journals.py first.")
        return
        
    with open(json_path, "r", encoding="utf-8") as f:
        articles = json.load(f)
        
    print("=" * 60)
    print("PARSING VERIFICATION & DATA INTEGRITY REPORT")
    print("=" * 60)
    print(f"Total articles compiled: {len(articles)}")
    
    # Track statistics
    empty_titles = 0
    empty_dates = 0
    empty_bodies = 0
    short_bodies = 0
    title_counts = {}
    date_formats = {}
    
    for idx, art in enumerate(articles):
        title = art.get("title", "").strip()
        date = art.get("date", "")
        body = art.get("body", [])
        
        # 1. Check title
        if not title:
            empty_titles += 1
            print(f"[ERROR] Article {idx} (ID: {art.get('id')}) has an empty title!")
        else:
            title_counts[title] = title_counts.get(title, 0) + 1
            
        # 2. Check date
        if not date:
            empty_dates += 1
        else:
            # Check format (expected M/D/YY or M/D/YYYY)
            if re.match(r"^\d{1,2}/\d{1,2}/\d{2,4}$", date.strip()):
                date_formats["Standard"] = date_formats.get("Standard", 0) + 1
            else:
                date_formats["Non-Standard"] = date_formats.get("Non-Standard", 0) + 1
                
        # 3. Check body text
        if not body:
            empty_bodies += 1
            print(f"[WARNING] Article '{title}' (Date: {date}) has an empty body!")
        else:
            # Combine body text
            full_text = "".join(p.get("text", "") for p in body).strip()
            if len(full_text) < 50:
                short_bodies += 1
                print(f"[INFO] Article '{title}' has a very short body ({len(full_text)} chars): '{full_text[:50]}...'")
                
    # 4. Check for duplicate titles
    duplicates = {title: count for title, count in title_counts.items() if count > 1}
    
    print("\n--- Integrity Summary ---")
    print(f"Articles with empty titles: {empty_titles}")
    print(f"Articles with empty dates:  {empty_dates}")
    print(f"Articles with empty bodies: {empty_bodies}")
    print(f"Articles with short bodies (<50 chars): {short_bodies}")
    print(f"Date formats found: {date_formats}")
    
    if duplicates:
        print(f"\n--- Duplicate Titles Found ({len(duplicates)}) ---")
        for title, count in duplicates.items():
            print(f"  - '{title}': repeated {count} times")
            # Let's list dates of duplicates to see if they are separate entries
            dupe_dates = [art.get("date") for art in articles if art.get("title") == title]
            print(f"    Dates: {dupe_dates}")
    else:
        print("\n[SUCCESS] No duplicate article titles found!")
        
    print("=" * 60)

if __name__ == "__main__":
    verify_parsing()
