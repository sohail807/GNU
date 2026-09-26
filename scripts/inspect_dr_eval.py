import sys, time
sys.path.append('scripts')
from lib_e2e import create_driver, login, open_menu
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains

driver = create_driver()
try:
    login(driver, 'demo_dr1', 'Doctor2026!')
    open_menu(driver, 'Evaluations')
    time.sleep(2.5)
    
    top_pane = driver.find_element(By.CSS_SELECTOR, "div.tab-content > div.tab-pane.active[id^='tab-']")
    rows = top_pane.find_elements(By.CSS_SELECTOR, 'table tbody tr')
    print(f"Evaluations count in list: {len(rows)}")
    for r in rows:
        if 'LIVE E2E' in r.text or '000050' in r.text:
            print("Found patient evaluation row:", r.text)
            ActionChains(driver).double_click(r).perform()
            break
    time.sleep(2.5)
    
    # Inspect tabs and form fields
    sub_tabs = top_pane.find_elements(By.CSS_SELECTOR, "ul.nav-tabs a")
    print("Sub tabs available:")
    for st in sub_tabs:
        print("  tab:", repr(st.text))
        
    # Inspect inputs and textareas
    inputs = top_pane.find_elements(By.TAG_NAME, "input")
    print("Inputs on form:")
    for inp in inputs:
        if inp.is_displayed():
            print("  input:", repr(inp.get_attribute("name")), repr(inp.get_attribute("placeholder")))
            
    textareas = top_pane.find_elements(By.TAG_NAME, "textarea")
    print("Textareas on form:")
    for ta in textareas:
        if ta.is_displayed():
            print("  textarea:", repr(ta.get_attribute("name")), repr(ta.get_attribute("placeholder")))
            
    # Inspect buttons (like Sign, Actions, etc.)
    btns = top_pane.find_elements(By.TAG_NAME, "button")
    print("Buttons on form:")
    for b in btns:
        if b.is_displayed() and (b.text or b.get_attribute("title")):
            print("  btn:", repr(b.text), "title:", repr(b.get_attribute("title")), "name:", repr(b.get_attribute("name")))

finally:
    driver.quit()
