import re
import sys
import json
import os

def parse_rtf(file_path):
    # Regex to tokenize RTF
    rtf_re = re.compile(
        r"\\([a-zA-Z*]+)(-?\d+)? ?|"
        r"\\\'([0-9a-fA-F]{2})|"
        r"\\([^a-zA-Z])|"
        r"([{}])|"
        r"([^{}\\\r\n]+)"
    )

    with open(file_path, "r", encoding="latin-1") as f:
        content = f.read()

    paragraphs = []
    current_para = {"style": 0, "text": []}
    
    stack = []
    current_state = {"skip": False, "style": 0}
    
    ignored_destinations = {
        "fonttbl", "colortbl", "stylesheet", "info", "listtable", "listoverridetable",
        "revtbl", "generator", "author", "operator", "creatim", "revtim", "printim",
        "buptim", "comment", "header", "footer", "headerl", "headerr", "headerf",
        "footerl", "footerr", "footerf", "footnote", "annotation", "field"
    }

    for m in rtf_re.finditer(content):
        control_word, param, hex_char, escaped, bracket, text = m.groups()
        
        if bracket == "{":
            stack.append(current_state.copy())
        elif bracket == "}":
            if stack:
                current_state = stack.pop()
        elif control_word:
            if control_word == "*":
                current_state["skip"] = True
            elif control_word in ignored_destinations:
                current_state["skip"] = True
            elif control_word == "pard":
                if not current_state["skip"]:
                    if current_para["text"]:
                        paragraphs.append({
                            "style": current_para["style"],
                            "text": "".join(current_para["text"]).strip()
                        })
                    current_para = {"style": 0, "text": []}
            elif control_word == "s":
                if param is not None and not current_state["skip"]:
                    current_para["style"] = int(param)
            elif control_word in ("par", "line"):
                if not current_state["skip"]:
                    if current_para["text"]:
                        paragraphs.append({
                            "style": current_para["style"],
                            "text": "".join(current_para["text"]).strip()
                        })
                    current_para = {"style": current_para["style"], "text": []}
            elif control_word == "u":
                if param is not None and not current_state["skip"]:
                    val = int(param)
                    if val < 0:
                        val += 65536
                    try:
                        current_para["text"].append(chr(val))
                    except ValueError:
                        pass
        elif hex_char:
            if not current_state["skip"]:
                try:
                    b = bytes.fromhex(hex_char)
                    current_para["text"].append(b.decode("ansi", errors="ignore"))
                except Exception:
                    pass
        elif escaped:
            if not current_state["skip"]:
                current_para["text"].append(escaped)
        elif text:
            if not current_state["skip"]:
                current_para["text"].append(text)

    if current_para["text"]:
        paragraphs.append({
            "style": current_para["style"],
            "text": "".join(current_para["text"]).strip()
        })
        
    return paragraphs

def extract_articles(paras, source_file):
    articles = []
    current_date = None
    current_article = None
    
    for p in paras:
        style = p["style"]
        text = p["text"]
        
        if not text:
            continue
            
        if style == 1:
            # Date
            current_date = text
        elif style == 2:
            # Start new article
            if current_article:
                articles.append(current_article)
            
            current_article = {
                "title": text,
                "date": current_date,
                "metadata_raw": "",
                "refs_raw": "",
                "tags": [],
                "body": [],
                "source": source_file
            }
        elif style == 16:
            # Metadata
            if current_article:
                current_article["metadata_raw"] = text
                if "|" in text:
                    parts = text.split("|", 1)
                    refs = parts[0].strip()
                    tags_raw = parts[1].strip()
                else:
                    if text.strip().startswith("#"):
                        refs = ""
                        tags_raw = text.strip()
                    else:
                        refs = text.strip()
                        tags_raw = ""
                        
                current_article["refs_raw"] = refs
                tags = [t.strip("# ") for t in tags_raw.split() if t.strip().startswith("#")]
                current_article["tags"] = tags
        else:
            if current_article:
                current_article["body"].append({
                    "style": f"s{style}",
                    "text": text
                })
                
    if current_article:
        articles.append(current_article)
        
    return articles

def main():
    os.makedirs("data", exist_ok=True)
    
    # Process both journals
    journals = [
        {"path": "assets/journals/Gospel Study Journal ARCHIVE.rtf", "name": "Archive"},
        {"path": "assets/journals/Gospel Study Journal_ Michael Russell.rtf", "name": "Recent"}
    ]
    
    all_articles = []
    
    for j in journals:
        path = j["path"]
        name = j["name"]
        
        if not os.path.exists(path):
            print(f"Warning: {path} not found. Skipping...")
            continue
            
        print(f"Parsing RTF: {path}...")
        paras = parse_rtf(path)
        print(f"Parsed {len(paras)} paragraphs from {name}. Extracting articles...")
        
        articles = extract_articles(paras, name)
        print(f"Extracted {len(articles)} articles from {name}.")
        all_articles.extend(articles)
        
    print(f"Total articles extracted: {len(all_articles)}")
    
    # Clean up empty bodies and standardize IDs
    valid_articles = []
    for idx, art in enumerate(all_articles):
        # We assign a unique ID
        art["id"] = f"art-{idx}"
        valid_articles.append(art)
        
    with open("data/articles.json", "w", encoding="utf-8") as f:
        json.dump(valid_articles, f, indent=2, ensure_ascii=False)
        
    print(f"Saved {len(valid_articles)} articles to data/articles.json")

if __name__ == "__main__":
    main()
