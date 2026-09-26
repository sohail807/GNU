import time
from selenium.webdriver.common.by import By
from lib_e2e import create_driver, login, get_active_pane

driver = create_driver()
try:
    print("Logging in as demo_nurse1...")
    login(driver, "demo_nurse1", "Nurse2026!")
    time.sleep(3)
    
    # Check left menu items
    menu_links = driver.find_elements(By.CSS_SELECTOR, "#menu .treeview-tree a, .menu-tree a")
    print(f"Total left menu links found: {len(menu_links)}")
    eval_link = None
    for link in menu_links:
        txt = link.text.strip()
        if "Evaluation" in txt:
            print(f"FOUND EVALUATION MENU: '{txt}'")
            eval_link = link
            break
            
    if not eval_link:
        # Check global search or expanding Health
        print("Menu text list:")
        for link in menu_links[:15]:
            print(" -", link.text.strip())
            
    if eval_link:
        print("Clicking Evaluation menu link...")
        eval_link.click()
        time.sleep(3)
        pane = get_active_pane(driver)
        print("Active pane title/text snippet:", pane.text[:150])
        driver.save_screenshot("reports/nurse_eval_menu_verified.png")
        print("Saved reports/nurse_eval_menu_verified.png")
    else:
        # Try search box
        search_entry = driver.find_element(By.ID, "global-search-entry")
        search_entry.click()
        search_entry.clear()
        search_entry.send_keys("Patient Evaluations")
        time.sleep(2)
        items = driver.find_elements(By.CSS_SELECTOR, "#global-search ul.dropdown-menu li a")
        print(f"Search results for 'Patient Evaluations': {len(items)}")
        for it in items:
            print("Search item:", it.text)
        if items:
            items[0].click()
            time.sleep(3)
            pane = get_active_pane(driver)
            print("Opened via search:", pane.text[:150])
            driver.save_screenshot("reports/nurse_eval_menu_verified.png")

finally:
    driver.quit()
