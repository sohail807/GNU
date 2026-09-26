import os, sys, time
sys.path.append("scripts")
from selenium.webdriver.common.by import By
from lib_e2e import create_driver, login, OUT_DIR

driver = create_driver()
try:
    login(driver, "demo_nurse1", "Nurse2026!")
    time.sleep(2)
    
    # Click Health icon/text in left sidebar to expand tree
    sidebar_items = driver.find_elements(By.CSS_SELECTOR, ".sidebar, .tree, ul.nav")
    # Find any chevron or folder
    health_items = driver.find_elements(By.XPATH, "//div[contains(@class, 'tree')]//li | //ul[contains(@class, 'nav')]//li")
    print(f"Tree items: {len(health_items)}")
    for hi in health_items:
        if "Health" in hi.text and hi.is_displayed():
            print("Clicking:", repr(hi.text))
            hi.click()
            time.sleep(1)
            
    time.sleep(2)
    driver.save_screenshot(os.path.join(OUT_DIR, "debug_nurse_expanded_tree.png"))
    print("Saved debug_nurse_expanded_tree.png")
    
    # Check all visible links
    links = driver.find_elements(By.TAG_NAME, "a")
    print(f"All links on page ({len(links)}):")
    for l in links:
        if l.is_displayed() and l.text:
            print("  link:", repr(l.text))
            
finally:
    driver.quit()
