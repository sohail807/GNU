import os
import json
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

REF_DIR = os.path.abspath(r"design/frontend_wireframes/reference")
os.makedirs(REF_DIR, exist_ok=True)

def inspect_tfsf():
    print("Launching Chrome to inspect TFSF Ventures reference site...")
    opts = Options()
    opts.add_argument("--headless=new")
    opts.add_argument("--window-size=1600,1200")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    
    driver = webdriver.Chrome(options=opts)
    try:
        url = "https://www.tfsfventures.com/#home"
        driver.get(url)
        time.sleep(5)
        
        # 1. Capture Full View Screenshots
        driver.set_window_size(1600, 1000)
        p1 = os.path.join(REF_DIR, "tfsf_01_hero.png")
        driver.save_screenshot(p1)
        print(f"Captured: {p1}")
        
        # Scroll down to Company & Purpose
        driver.execute_script("window.scrollTo(0, 900);")
        time.sleep(2)
        p2 = os.path.join(REF_DIR, "tfsf_02_company_purpose.png")
        driver.save_screenshot(p2)
        print(f"Captured: {p2}")
        
        # Scroll down to Our Story / Steps
        driver.execute_script("window.scrollTo(0, 1900);")
        time.sleep(2)
        p3 = os.path.join(REF_DIR, "tfsf_03_story_and_people.png")
        driver.save_screenshot(p3)
        print(f"Captured: {p3}")
        
        # Scroll down to Next 24 Months Roadmap / Accordeons
        driver.execute_script("window.scrollTo(0, 3100);")
        time.sleep(2)
        p4 = os.path.join(REF_DIR, "tfsf_04_roadmap_details.png")
        driver.save_screenshot(p4)
        print(f"Captured: {p4}")

        # Scroll to Footer
        driver.execute_script("window.scrollTo(0, 5200);")
        time.sleep(2)
        p5 = os.path.join(REF_DIR, "tfsf_05_footer.png")
        driver.save_screenshot(p5)
        print(f"Captured: {p5}")
        
        # 2. Extract Computed Styles
        style_script = """
        const getStyles = (selector) => {
            const el = document.querySelector(selector);
            if (!el) return null;
            const cs = window.getComputedStyle(el);
            return {
                tag: el.tagName,
                fontFamily: cs.fontFamily,
                fontSize: cs.fontSize,
                fontWeight: cs.fontWeight,
                lineHeight: cs.lineHeight,
                letterSpacing: cs.letterSpacing,
                color: cs.color,
                backgroundColor: cs.backgroundColor,
                border: cs.border,
                borderRadius: cs.borderRadius,
                padding: cs.padding,
                margin: cs.margin,
                textTransform: cs.textTransform
            };
        };
        
        return {
            body: getStyles('body'),
            header: getStyles('.global-header'),
            brandWordmark: getStyles('.brand-wordmark'),
            brandContext: getStyles('.brand-context'),
            navLinks: getStyles('.desktop-nav a'),
            heroKicker: getStyles('.hero-kicker'),
            h1: getStyles('h1'),
            heroAccent: getStyles('.hero-story-accent'),
            h2: getStyles('h2.chapter-heading'),
            chapterLabel: getStyles('.chapter-label'),
            leadParagraph: getStyles('.chapter-lead'),
            bodyCopy: getStyles('.chapter-copy p'),
            cardContainer: getStyles('.company-relation'),
            cardItem: getStyles('.company-relation div'),
            detailSummary: getStyles('details.chapter-detail summary'),
            roadmapProgram: getStyles('details.roadmap-program summary'),
            actionButton: getStyles('.primary-rescue-action, .flow-conversation-actions button'),
            footerRecord: getStyles('.footer-record')
        };
        """
        
        styles = driver.execute_script(style_script)
        json_path = os.path.join(REF_DIR, "tfsf_extracted_styles.json")
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(styles, f, indent=2)
        print(f"Saved computed styles to: {json_path}")
        
    finally:
        driver.quit()

if __name__ == "__main__":
    inspect_tfsf()
