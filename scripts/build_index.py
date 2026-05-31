import re
import json
import os

# LDS Standard Works books and common abbreviations
LDS_BOOKS = {
    # Old Testament
    "Genesis": ["Genesis", "Gen", "Ge"],
    "Exodus": ["Exodus", "Exod", "Ex"],
    "Leviticus": ["Leviticus", "Lev", "Le"],
    "Numbers": ["Numbers", "Num", "Nu"],
    "Deuteronomy": ["Deuteronomy", "Deut", "De"],
    "Joshua": ["Joshua", "Josh", "Jos"],
    "Judges": ["Judges", "Judg", "Jg"],
    "Ruth": ["Ruth", "Ru"],
    "1 Samuel": ["1 Samuel", "1 Sam", "1Sa"],
    "2 Samuel": ["2 Samuel", "2 Sam", "2Sa"],
    "1 Kings": ["1 Kings", "1 King", "1Ki"],
    "2 Kings": ["2 Kings", "2 King", "2Ki"],
    "1 Chronicles": ["1 Chronicles", "1 Chron", "1Ch"],
    "2 Chronicles": ["2 Chronicles", "2 Chron", "2Ch"],
    "Ezra": ["Ezra", "Ez"],
    "Nehemiah": ["Nehemiah", "Neh", "Ne"],
    "Esther": ["Esther", "Esth", "Es"],
    "Job": ["Job", "Jb"],
    "Psalms": ["Psalms", "Psalm", "Psa", "Ps"],
    "Proverbs": ["Proverbs", "Prov", "Pr"],
    "Ecclesiastes": ["Ecclesiastes", "Eccl", "Ec"],
    "Song of Solomon": ["Song of Solomon", "Song", "So"],
    "Isaiah": ["Isaiah", "Isa", "Is"],
    "Jeremiah": ["Jeremiah", "Jer", "Je"],
    "Lamentations": ["Lamentations", "Lam", "La"],
    "Ezekiel": ["Ezekiel", "Ezek", "Ez"],
    "Daniel": ["Daniel", "Dan", "Da"],
    "Hosea": ["Hosea", "Hos", "Ho"],
    "Joel": ["Joel", "Jl"],
    "Amos": ["Amos", "Am"],
    "Obadiah": ["Obadiah", "Obad", "Ob"],
    "Jonah": ["Jonah", "Jon"],
    "Micah": ["Micah", "Mic", "Mi"],
    "Nahum": ["Nahum", "Na"],
    "Habakkuk": ["Habakkuk", "Hab", "Ha"],
    "Zephaniah": ["Zephaniah", "Zeph", "Ze"],
    "Haggai": ["Haggai", "Hag", "Hg"],
    "Zechariah": ["Zechariah", "Zech", "Zc"],
    "Malachi": ["Malachi", "Mal", "Ml"],

    # New Testament
    "Matthew": ["Matthew", "Matt", "Mt"],
    "Mark": ["Mark", "Mk", "Mr"],
    "Luke": ["Luke", "Lk", "Lu"],
    "John": ["John", "Jn", "Jo"],
    "Acts": ["Acts", "Ac"],
    "Romans": ["Romans", "Rom", "Ro"],
    "1 Corinthians": ["1 Corinthians", "1 Cor", "1Co"],
    "2 Corinthians": ["2 Corinthians", "2 Cor", "2Co"],
    "Galatians": ["Galatians", "Gal", "Ga"],
    "Ephesians": ["Ephesians", "Eph", "Ep"],
    "Philippians": ["Philippians", "Phil", "Ph"],
    "Colossians": ["Colossians", "Col", "Co"],
    "1 Thessalonians": ["1 Thessalonians", "1 Thes", "1 Thess", "1Th"],
    "2 Thessalonians": ["2 Thessalonians", "2 Thes", "2 Thess", "2Th"],
    "1 Timothy": ["1 Timothy", "1 Tim", "1Ti"],
    "2 Timothy": ["2 Timothy", "2 Tim", "2Ti"],
    "Titus": ["Titus", "Ti"],
    "Philemon": ["Philemon", "Philem", "Phm"],
    "Hebrews": ["Hebrews", "Heb", "He"],
    "James": ["James", "Jas", "Ja"],
    "1 Peter": ["1 Peter", "1 Pet", "1Pe"],
    "2 Peter": ["2 Peter", "2 Pet", "2Pe"],
    "1 John": ["1 John", "1 Jn", "1Jo"],
    "2 John": ["2 John", "2 Jn", "2Jo"],
    "3 John": ["3 John", "3 Jn", "3Jo"],
    "Jude": ["Jude", "Ju"],
    "Revelation": ["Revelation", "Rev", "Re"],

    # Book of Mormon
    "1 Nephi": ["1 Nephi", "1 Ne", "1Ne", "1Nf"],
    "2 Nephi": ["2 Nephi", "2 Ne", "2Ne", "2Nf"],
    "Jacob": ["Jacob", "Jac", "Jb"],
    "Enos": ["Enos", "En"],
    "Jarom": ["Jarom", "Jar"],
    "Omni": ["Omni", "Om"],
    "Words of Mormon": ["Words of Mormon", "W of M", "WoM", "WobM"],
    "Mosiah": ["Mosiah", "Mos", "Ms"],
    "Alma": ["Alma", "Al"],
    "Helaman": ["Helaman", "Hel", "He"],
    "3 Nephi": ["3 Nephi", "3 Ne", "3Ne", "3Nf"],
    "4 Nephi": ["4 Nephi", "4 Ne", "4Ne", "4Nf"],
    "Mormon": ["Mormon", "Morm", "Mn"],
    "Ether": ["Ether", "Eth", "Et"],
    "Moroni": ["Moroni", "Mor", "Mr"],

    # Doctrine & Covenants
    "Doctrine and Covenants": [
        "Doctrine and Covenants", "D&C", "D. & C.", "D and C", "D&c", "DC",
        "Doctrine & Covenants", "Section", "D. and C."
    ],

    # Pearl of Great Price
    "Moses": ["Moses", "Mos"],
    "Abraham": ["Abraham", "Abr", "Ab"],
    "Joseph Smith—Matthew": ["Joseph Smith—Matthew", "Joseph Smith - Matthew", "JS-M", "JS—M", "JSM"],
    "Joseph Smith—History": ["Joseph Smith—History", "Joseph Smith - History", "JS-H", "JS—H", "JSH"],
    "Articles of Faith": ["Articles of Faith", "A of F", "AoF"]
}

# Book to Volume mapping
BOOK_TO_VOLUME = {}
VOLUMES_INFO = {
    "Old Testament": ["ot.json", [
        "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth",
        "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra",
        "Nehemiah", "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon",
        "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos",
        "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah",
        "Malachi"
    ]],
    "New Testament": ["nt.json", [
        "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians",
        "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians",
        "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter",
        "1 John", "2 John", "3 John", "Jude", "Revelation"
    ]],
    "Book of Mormon": ["bofm.json", [
        "1 Nephi", "2 Nephi", "Jacob", "Enos", "Jarom", "Omni", "Words of Mormon", "Mosiah",
        "Alma", "Helaman", "3 Nephi", "4 Nephi", "Mormon", "Ether", "Moroni"
    ]],
    "Doctrine and Covenants": ["dc.json", ["Doctrine and Covenants"]],
    "Pearl of Great Price": ["pgp.json", [
        "Moses", "Abraham", "Joseph Smith—Matthew", "Joseph Smith—History", "Articles of Faith"
    ]]
}

for vol_name, (file_name, books) in VOLUMES_INFO.items():
    for bk in books:
        BOOK_TO_VOLUME[bk] = vol_name

# Generate reverse mapping lowercase
ABBREV_TO_BOOK = {}
for book, abbrevs in LDS_BOOKS.items():
    for abbrev in abbrevs:
        ABBREV_TO_BOOK[abbrev.lower().replace(".", "")] = book
    ABBREV_TO_BOOK[book.lower().replace(".", "")] = book

# Create optimized dynamic regex pattern
patterns = []
for book, abbrevs in LDS_BOOKS.items():
    patterns.append(re.escape(book))
    for abbrev in abbrevs:
        # Also clean up punctuation
        patterns.append(re.escape(abbrev))

# Sort by length descending
patterns.sort(key=len, reverse=True)
book_pattern = "|".join(patterns)

# Regex to capture scripture references (e.g. Matthew 18:3-4, Ether 12:27, 3 Nephi 17)
# Note: we handle D&C by escaping the & sign, or standardizing it in matching
REF_RE = re.compile(
    r"\b(" + book_pattern + r")\s+(\d+)(?:\s*:\s*(\d+)(?:\s*[-–]\s*(\d+))?)?\b",
    re.IGNORECASE
)

def clean_book_key(bk):
    return bk.lower().replace(".", "").strip()

def parse_references_from_text(text):
    refs = []
    if not text:
        return refs
        
    for m in REF_RE.finditer(text):
        full_match = m.group(0)
        book_candidate = m.group(1).strip()
        chapter = int(m.group(2))
        verse_start = int(m.group(3)) if m.group(3) else None
        verse_end = int(m.group(4)) if m.group(4) else None
        
        book_key = clean_book_key(book_candidate)
        if book_key in ABBREV_TO_BOOK:
            resolved_book = ABBREV_TO_BOOK[book_key]
            
            # Formulate coordinates
            ref_dict = {
                "match": full_match,
                "book": resolved_book,
                "chapter": chapter,
                "verse_start": verse_start,
                "verse_end": verse_end
            }
            refs.append(ref_dict)
            
    return refs

def main():
    if not os.path.exists("data/articles.json"):
        print("Error: data/articles.json does not exist. Run parse_journals.py first!")
        return
        
    with open("data/articles.json", "r", encoding="utf-8") as f:
        articles = json.load(f)
        
    print(f"Loaded {len(articles)} articles. Scanning for scripture references...")
    
    # Verse-to-articles cross-reference map
    # Key: "Book Chapter:Verse" (e.g. "1 Nephi 3:7") -> List of article IDs
    # Key: "Book Chapter" (e.g. "3 Nephi 17") -> List of article IDs (for chapter-level refs)
    scripture_refs = {}
    
    # Track statistics for stats.json
    stats = {
        "total_articles": len(articles),
        "articles_with_refs": 0,
        "volume_counts": {
            "Old Testament": 0,
            "New Testament": 0,
            "Book of Mormon": 0,
            "Doctrine and Covenants": 0,
            "Pearl of Great Price": 0
        },
        "book_counts": {},
        "tag_counts": {},
        "top_books": [],
        "top_tags": []
    }
    
    for art in articles:
        art_id = art["id"]
        
        # Combine references found in metadata (pipe structure) and headings/body
        metadata_refs = parse_references_from_text(art["refs_raw"])
        
        # We also scan the article body (paragraphs of styles s3, s4, and s0) for references
        body_refs = []
        for p in art["body"]:
            # If it's a heading (s3, s4) or body text (s0), scan it!
            p_refs = parse_references_from_text(p["text"])
            body_refs.extend(p_refs)
            
        # Combine and deduplicate references by their canonical form
        all_refs = metadata_refs + body_refs
        unique_refs = {}
        for r in all_refs:
            ref_str = f"{r['book']} {r['chapter']}"
            if r['verse_start']:
                ref_str += f":{r['verse_start']}"
                if r['verse_end']:
                    ref_str += f"-{r['verse_end']}"
            
            unique_refs[ref_str] = r
            
        resolved_list = list(unique_refs.values())
        art["references"] = resolved_list
        
        if resolved_list:
            stats["articles_with_refs"] += 1
            
        # Populate indexes
        for ref in resolved_list:
            book = ref["book"]
            chapter = ref["chapter"]
            v_start = ref["verse_start"]
            v_end = ref["verse_end"]
            
            # Map book to volume
            volume = BOOK_TO_VOLUME.get(book, "Unknown")
            if volume in stats["volume_counts"]:
                stats["volume_counts"][volume] += 1
                
            stats["book_counts"][book] = stats["book_counts"].get(book, 0) + 1
            
            # Indexing for the footnoting reader
            if v_start is not None:
                # Reference has verses
                v_stop = v_end if v_end is not None else v_start
                # Index under every verse in the range
                for v in range(v_start, v_stop + 1):
                    verse_key = f"{book} {chapter}:{v}"
                    if verse_key not in scripture_refs:
                        scripture_refs[verse_key] = []
                    if art_id not in scripture_refs[verse_key]:
                        scripture_refs[verse_key].append(art_id)
            else:
                # Chapter level reference
                chapter_key = f"{book} {chapter}"
                if chapter_key not in scripture_refs:
                    scripture_refs[chapter_key] = []
                if art_id not in scripture_refs[chapter_key]:
                    scripture_refs[chapter_key].append(art_id)
                    
        # Tag counts
        for tag in art["tags"]:
            stats["tag_counts"][tag] = stats["tag_counts"].get(tag, 0) + 1

    # Format Top Books & Tags lists for charting
    sorted_books = sorted(stats["book_counts"].items(), key=lambda x: x[1], reverse=True)
    stats["top_books"] = [{"name": name, "count": count} for name, count in sorted_books[:15]]
    
    sorted_tags = sorted(stats["tag_counts"].items(), key=lambda x: x[1], reverse=True)
    stats["top_tags"] = [{"name": name, "count": count} for name, count in sorted_tags[:30]]
    
    # Save files
    with open("data/articles.json", "w", encoding="utf-8") as f:
        json.dump(articles, f, indent=2, ensure_ascii=False)
    print("Updated data/articles.json with resolved scripture coordinates.")
    
    with open("data/scripture_refs.json", "w", encoding="utf-8") as f:
        json.dump(scripture_refs, f, indent=2, ensure_ascii=False)
    print(f"Saved {len(scripture_refs)} unique verse/chapter mappings to data/scripture_refs.json")
    
    with open("data/stats.json", "w", encoding="utf-8") as f:
        json.dump(stats, f, indent=2, ensure_ascii=False)
    print("Saved statistics to data/stats.json")

if __name__ == "__main__":
    main()
