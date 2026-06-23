# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
from bs4 import BeautifulSoup
import asyncio
import os
from dotenv import load_dotenv
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db, AuditLog
import datetime

# Load the environment variables from the .env file
load_dotenv()

app = FastAPI(title="Web Auditor API")

@app.get("/")
def home():
    return {"status": "healthy", "message": "Web Performance Auditor API Engine is fully operational"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AuditRequest(BaseModel):
    url: str

async def check_single_link(client: httpx.AsyncClient, url: str) -> bool:
    try:
        if not url or url.startswith("#") or url.startswith("javascript:"):
            return True
        response = await client.head(url, timeout=3.0, follow_redirects=True)
        if response.status_code >= 400:
            response = await client.get(url, timeout=3.0, follow_redirects=True)
        return response.status_code < 400
    except Exception:
        return False

import random

async def get_pagespeed_metrics(url: str, html_content: str = "") -> dict:
    """Fetches real Core Web Vitals and performance scores using spoofed human network signatures."""
    PAGESPEED_API_KEY = os.getenv("PAGESPEED_API_KEY") 
    
    try:
        api_url = f"https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url={url}&category=PERFORMANCE"
        
        if PAGESPEED_API_KEY:
            api_url += f"&key={PAGESPEED_API_KEY}"
            
        print("[LOG] Querying Google PageSpeed API with high-priority browser signatures...")
        
        # We spoof standard browser headers so Google doesn't classify the script as a malicious bot
        spoofed_headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Connection": "keep-alive"
        }
        
        # Give it 25 seconds to complete the simulation, but run safely inside our parallel architecture
        async with httpx.AsyncClient(timeout=55.0) as client:
            response = await client.get(api_url, headers=spoofed_headers)
            
        if response.status_code == 200:
            data = response.json()
            score = int(data['lighthouseResult']['categories']['performance']['score'] * 100)
            fcp = data['lighthouseResult']['audits']['first-contentful-paint']['displayValue']
            
            status = "Good" if score >= 80 else "Warning"
            return {
                "value": f"{score}/100", 
                "status": status, 
                "message": f"Google Lighthouse Performance Score: {score}/100. First Contentful Paint takes {fcp}."
            }
        else:
            print(f"[DEBUG LOG] Google API responded with status code: {response.status_code}")
    except Exception as e:
        print(f"[DEBUG LOG] Google API connection exception: {str(e)}")
        pass

    # --- FALLBACK ENGINE (Kept as safety fallback) ---
    soup = BeautifulSoup(html_content, 'html.parser')
    img_count = len(soup.find_all('img'))
    script_count = len(soup.find_all('script'))
    css_count = len(soup.find_all('link', attrs={"rel": "stylesheet"}))
    
    deduction = (img_count * 0.15) + (script_count * 0.25) + (css_count * 0.2)
    calculated_score = max(35, min(99, int(98 - deduction)))
    simulated_fcp = round(max(0.4, (100 - calculated_score) * 0.045), 1)
    
    return {
        "value": f"{calculated_score}/100", 
        "status": "Good" if calculated_score >= 80 else "Warning", 
        "message": f"Performance Score: {calculated_score}/100. Estimated First Contentful Paint: {simulated_fcp}s. (Local Diagnostic Engine)"
    }

async def analyze_seo_and_links(html_content: str, base_url: str) -> dict:
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # 1. Title Tag
    title_tag = soup.find('title')
    title_text = title_tag.text.strip() if title_tag else None
    title_status = "Good" if title_text and 10 <= len(title_text) <= 60 else "Warning"
    title_message = "Title tag looks well-optimized." if title_status == "Good" else "Title should be 10-60 chars."
    if not title_text: title_message = "Missing critical <title> tag."

    # 2. Meta Description
    meta_desc_tag = soup.find('meta', attrs={"name": "description"})
    desc_text = meta_desc_tag.get('content', '').strip() if meta_desc_tag else None
    desc_status = "Good" if desc_text and 50 <= len(desc_text) <= 160 else "Warning"
    desc_message = "Meta description is optimized." if desc_status == "Good" else "Description should be 50-160 chars."
    if not desc_text: desc_message = "Missing critical meta description tag."

    # 3. H1 Counter
    h1_tags = soup.find_all('h1')
    h1_count = len(h1_tags)
    h1_status = "Good" if h1_count == 1 else "Warning"
    h1_message = "Perfect. Exactly one <h1> tag found." if h1_count == 1 else f"Found {h1_count} <h1> tags. Should be exactly 1."

    # 4. Image Auditor
    img_tags = soup.find_all('img')
    total_images = len(img_tags)
    missing_alt_count = 0
    legacy_format_count = 0
    for img in img_tags:
        if not img.get('alt', '').strip(): missing_alt_count += 1
        src = img.get('src', '').lower()
        if [ext for ext in ['.png', '.jpg', '.jpeg'] if ext in src]: legacy_format_count += 1
    img_status = "Good" if missing_alt_count == 0 else "Warning"
    img_message = f"Analyzed {total_images} images. {missing_alt_count} missing alt text, {legacy_format_count} are legacy formats."

    # 5. Hyperlink Health
    a_tags = soup.find_all('a')
    raw_urls = []
    for tag in a_tags:
        href = tag.get('href')
        if href and (href.startswith('http://') or href.startswith('https://')): raw_urls.append(href)
        elif href and href.startswith('/'):
            from urllib.parse import urljoin
            raw_urls.append(urljoin(base_url, href))
    unique_urls = list(set(raw_urls))[:10] # Reduced to 10 for speed alongside pagespeed api
    broken_links_count = 0
    async with httpx.AsyncClient() as client:
        tasks = [check_single_link(client, link) for link in unique_urls]
        results = await asyncio.gather(*tasks)
        broken_links_count = results.count(False)
    link_status = "Good" if broken_links_count == 0 else "Warning"
    link_message = f"Scanned {len(unique_urls)} unique page links. Found {broken_links_count} broken URLs."

    # 6. Performance Fetch (Google API)
    perf_report = await get_pagespeed_metrics(base_url, html_content)

    return {
        "title": {"value": title_text, "status": title_status, "message": title_message},
        "description": {"value": desc_text, "status": desc_status, "message": desc_message},
        "h1_count": {"value": h1_count, "status": h1_status, "message": h1_message},
        "images": {"value": f"{missing_alt_count}/{total_images} Issues", "status": img_status, "message": img_message},
        "links": {"value": f"{broken_links_count} Broken", "status": link_status, "message": link_message},
        "performance": perf_report
    }

# Update your request schema to receive whether they want to toggle it or not
class AuditRequest(BaseModel):
    url: str

class SaveToggleRequest(BaseModel):
    log_id: int

@app.post("/api/audit")
async def start_audit(request: AuditRequest, db: Session = Depends(get_db)):
    # Clean up trailing slashes for uniform database URL queries
    target_url = request.url.strip().rstrip("/")
    
    # --- 1. THE CACHING LAYER ENGINE ---
    # Check if this exact URL was audited in the last 10 minutes
    ten_minutes_ago = datetime.datetime.utcnow() - datetime.timedelta(minutes=10)
    cached_entry = db.query(AuditLog).filter(
        AuditLog.url == target_url, 
        AuditLog.timestamp >= ten_minutes_ago
    ).order_by(AuditLog.timestamp.desc()).first()
    
    if cached_entry:
        print(f"[CACHE HIT] Serving recent cached metrics for: {target_url}")
        return {
            "success": True,
            "url": cached_entry.url,
            "log_id": cached_entry.id,
            "is_saved": cached_entry.is_saved,
            "report": {
                "title": {"value": cached_entry.title_value, "status": cached_entry.title_status, "message": cached_entry.title_message},
                "description": {"value": cached_entry.desc_value, "status": cached_entry.desc_status, "message": cached_entry.desc_message},
                "h1_count": {"value": cached_entry.h1_value, "status": cached_entry.h1_status, "message": cached_entry.h1_message},
                "images": {"value": cached_entry.img_value, "status": cached_entry.img_status, "message": cached_entry.img_message},
                "links": {"value": cached_entry.link_value, "status": cached_entry.link_status, "message": cached_entry.link_message},
                "performance": {"value": cached_entry.perf_value, "status": cached_entry.perf_status, "message": cached_entry.perf_message}
            }
        }
        
    print(f"[CACHE MISS] Compiling new live parallel audit pipelines for: {target_url}")
    
    # --- 2. THE PIPELINE EXECUTION ENGINE ---
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Connection": "keep-alive"
        }
        
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(target_url, headers=headers, follow_redirects=True)
            
        if response.status_code != 200:
            return {"success": False, "message": f"Failed to reach target site. Status code: {response.status_code}"}
            
        html_content = response.text

        seo_and_links_task = asyncio.create_task(analyze_seo_and_links(html_content, target_url))
        performance_task = asyncio.create_task(get_pagespeed_metrics(target_url, html_content))
        
        report_data, perf_data = await asyncio.gather(seo_and_links_task, performance_task)
        report_data["performance"] = perf_data
        
        # --- 3. SAVE TEMP REPORT ENTRY ---
        new_log = AuditLog(
            url=target_url,
            title_value=report_data["title"]["value"],
            title_status=report_data["title"]["status"],
            title_message=report_data["title"]["message"],
            desc_value=report_data["description"]["value"],
            desc_status=report_data["description"]["status"],
            desc_message=report_data["description"]["message"],
            h1_value=report_data["h1_count"]["value"],
            h1_status=report_data["h1_count"]["status"],
            h1_message=report_data["h1_count"]["message"],
            img_value=report_data["images"]["value"],
            img_status=report_data["images"]["status"],
            img_message=report_data["images"]["message"],
            link_value=report_data["links"]["value"],
            link_status=report_data["links"]["status"],
            link_message=report_data["links"]["message"],
            perf_value=perf_data["value"],
            perf_status=perf_data["status"],
            perf_message=perf_data["message"],
            is_saved=False # Defaults to unpinned/unsaved
        )
        db.add(new_log)
        db.commit()
        db.refresh(new_log)
        
        return {"success": True, "url": target_url, "log_id": new_log.id, "is_saved": False, "report": report_data}

    except Exception as e:
        return {"success": False, "message": f"An error occurred: {str(e)}"}

# ENDPOINT: Let the user pin/unpin a report from history log
@app.post("/api/history/toggle")
def toggle_history_save(request: SaveToggleRequest, db: Session = Depends(get_db)):
    log_entry = db.query(AuditLog).filter(AuditLog.id == request.log_id).first()
    if not log_entry:
        raise HTTPException(status_code=404, detail="Audit record not found")
        
    # Flip the boolean value toggle switch
    log_entry.is_saved = not log_entry.is_saved
    db.commit()
    return {"success": True, "is_saved": log_entry.is_saved}

# ENDPOINT: Fetch only the rows manually saved/pinned by team members
@app.get("/api/history")
def get_audit_history(db: Session = Depends(get_db)):
    logs = db.query(AuditLog).filter(AuditLog.is_saved == True).order_by(AuditLog.timestamp.desc()).limit(10).all()
    return [
        {
            "id": log.id,
            "url": log.url,
            "timestamp": log.timestamp.strftime("%Y-%m-%d %H:%M"),
            "perf_value": log.perf_value
        } for log in logs
    ]