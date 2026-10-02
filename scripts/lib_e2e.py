import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

BASE_URL = "http://34.7.237.8/"
OUT_DIR = os.path.join("reports", "live_browser_test")
os.makedirs(OUT_DIR, exist_ok=True)

def create_driver():
    opts = Options()
    opts.add_argument("--headless=new")
    opts.add_argument("--window-size=1600,1000")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    return webdriver.Chrome(options=opts)

def login(driver, username, password):
    print(f"Logging in as {username}...")
    driver.get(BASE_URL)
    wait = WebDriverWait(driver, 20)
    
    # Wait for login input
    login_inp = wait.until(EC.element_to_be_clickable((By.NAME, "login")))
    login_inp.clear()
    login_inp.send_keys(username)
    time.sleep(1)
    login_inp.send_keys(Keys.ENTER)
    time.sleep(2)
    
    try:
        pwd_inp = WebDriverWait(driver, 5).until(EC.visibility_of_element_located((By.NAME, "password")))
    except Exception:
        btns = driver.find_elements(By.CSS_SELECTOR, "form button[type='submit'], .modal button[type='submit']")
        if btns:
            driver.execute_script("arguments[0].click();", btns[0])
        pwd_inp = wait.until(EC.visibility_of_element_located((By.NAME, "password")))
        
    pwd_inp.clear()
    pwd_inp.send_keys(password)
    time.sleep(1)
    
    # Click OK button on ask-dialog modal
    ok_btns = driver.find_elements(By.CSS_SELECTOR, ".ask-dialog button.btn-primary, .ask-dialog button[title='OK']")
    if ok_btns:
        driver.execute_script("arguments[0].click();", ok_btns[0])
    else:
        pwd_inp.send_keys(Keys.ENTER)
    time.sleep(2)
    
    try:
        wait.until(EC.visibility_of_element_located((By.ID, "global-search-entry")))
    except Exception:
        ok_btns = driver.find_elements(By.CSS_SELECTOR, ".ask-dialog button.btn-primary, .ask-dialog button[title='OK']")
        if ok_btns:
            driver.execute_script("arguments[0].click();", ok_btns[0])
        wait.until(EC.visibility_of_element_located((By.ID, "global-search-entry")))
        
    time.sleep(2)
    print(f"Successfully logged in as {username}.")

def logout(driver):
    print("Logging out...")
    try:
        # Click user dropdown / logout button in top right
        logout_btn = driver.find_element(By.CSS_SELECTOR, "a.navbar-brand[title='Logout'], button[title='Logout'], a[title='Logout'], .glyphicon-log-out")
        logout_btn.click()
    except Exception:
        # Fallback to reloading base URL
        driver.delete_all_cookies()
        driver.get(BASE_URL)
    time.sleep(2)
    print("Logged out.")

def open_menu(driver, item_name):
    print(f"Opening menu: {item_name}...")
    wait = WebDriverWait(driver, 10)
    search_entry = wait.until(EC.element_to_be_clickable((By.ID, "global-search-entry")))
    search_entry.click()
    search_entry.clear()
    search_entry.send_keys(item_name)
    time.sleep(1.5)
    
    items = driver.find_elements(By.CSS_SELECTOR, "#global-search ul.dropdown-menu li a")
    clicked = False
    for it in items:
        if item_name.lower() in it.text.lower():
            it.click()
            clicked = True
            break
    if not clicked and items:
        items[0].click()
    time.sleep(3)
    print(f"Opened menu {item_name}.")

def get_active_pane(driver, timeout=10):
    wait = WebDriverWait(driver, timeout)
    time.sleep(1.5)
    pane = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".tab-pane.active, .tab-content > .active, div[role='tabpanel'].active")))
    return pane

def click_new(driver):
    pane = get_active_pane(driver)
    new_btn = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, ".tab-pane.active button[title='New'], .tab-content > .active button[title='New']"))
    )
    new_btn.click()
    time.sleep(2.5)
    print("Clicked New (+).")

def click_save(driver):
    pane = get_active_pane(driver)
    save_btn = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, ".tab-pane.active button[title='Save'], .tab-content > .active button[title='Save']"))
    )
    save_btn.click()
    time.sleep(3)
    print("Clicked Save.")
