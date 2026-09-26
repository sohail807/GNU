import time
from selenium.webdriver.common.by import By
from lib_e2e import create_driver, login

driver = create_driver()
try:
    login(driver, "demo_rad1", "Rad2026!")
    time.sleep(2)
    # Check tree menu items on left sidebar
    menu_items = driver.find_elements(By.CSS_SELECTOR, "#menu .treeview-tree a, .menu-tree a")
    print(f"Total left menu items: {len(menu_items)}")
    for it in menu_items:
        print("Menu item:", it.text)
        
    # Also check groups of demo_rad1 in database via ssh
finally:
    driver.quit()
