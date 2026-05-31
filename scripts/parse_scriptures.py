import re
import os
import json

def parse_volume(txt_path, volume_name):
    # Regex to match: [Book Name] [Chapter]:[Verse] [Verse Text]
    # Group 1: Book name (can contain spaces and numbers)
    # Group 2: Chapter number
    # Group 3: Verse number
    # Group 4: Verse text
    line_re = re.compile(r"^(.+?)\s+(\d+)\s*:\s*(\d+)\s+(.+)$")
    
    if not os.path.exists(txt_path):
        print(f"Warning: {txt_path} not found. Skipping...")
        return None
        
    print(f"Parsing scripture volume {volume_name} from {txt_path}...")
    
    volume_data = {
        "volume": volume_name,
        "books": {}
    }
    
    line_count = 0
    with open(txt_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
                
            m = line_re.match(line)
            if not m:
                # Some lines might have formatting issues, skip or print warning
                continue
                
            book_name, chapter_str, verse_str, verse_text = m.groups()
            chapter_num = int(chapter_str)
            verse_num = int(verse_str)
            
            if book_name not in volume_data["books"]:
                volume_data["books"][book_name] = {
                    "chapters": {}
                }
                
            chapters = volume_data["books"][book_name]["chapters"]
            if chapter_str not in chapters:
                chapters[chapter_str] = {
                    "verses": {}
                }
                
            chapters[chapter_str]["verses"][verse_str] = verse_text
            line_count += 1
            
    print(f"Finished parsing. Found {len(volume_data['books'])} books and {line_count} total verses in {volume_name}.")
    return volume_data

def main():
    os.makedirs("data/scriptures", exist_ok=True)
    
    volumes = [
        {"path": "assets/scriptures/ot.txt", "name": "Old Testament", "out": "data/scriptures/ot.json"},
        {"path": "assets/scriptures/nt.txt", "name": "New Testament", "out": "data/scriptures/nt.json"},
        {"path": "assets/scriptures/bofm.txt", "name": "Book of Mormon", "out": "data/scriptures/bofm.json"},
        {"path": "assets/scriptures/dc-testament.txt", "name": "Doctrine and Covenants", "out": "data/scriptures/dc.json"},
        {"path": "assets/scriptures/pgp.txt", "name": "Pearl of Great Price", "out": "data/scriptures/pgp.json"}
    ]
    
    for v in volumes:
        data = parse_volume(v["path"], v["name"])
        if data:
            with open(v["out"], "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print(f"Saved volume {v['name']} to {v['out']}")

if __name__ == "__main__":
    main()
