import json
import time
from selenium.webdriver.chrome.options import Options
from selenium import webdriver
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities

"""
  example usage:
  python -m opensea.scrapeStats --sortby seven_day_volume --driverpath /usr/bin/chromedriver
  python -m opensea.scrapeStats --sortby seven_day_volume --new 1 --driverpath /usr/bin/chromedriver

  python -m opensea.scrapeStats --sortby one_day_volume --driverpath /usr/bin/chromedriver
  python -m opensea.scrapeStats --sortby one_day_volume --new 1 --driverpath /usr/bin/chromedriver

  python -m opensea.scrapeStats --sortby thirty_day_volume --driverpath /usr/bin/chromedriver
  python -m opensea.scrapeStats --sortby thirty_day_volume --new 1 --driverpath /usr/bin/chromedriver

  python -m opensea.scrapeStats --sortby total_volume --driverpath /usr/bin/chromedriver
  python -m opensea.scrapeStats --sortby total_volume --new 1 --driverpath /usr/bin/chromedriver
"""

import sys
import argparse
parser = argparse.ArgumentParser()
parser.add_argument(
    '--sortby', help='sortby opensea query  ---- thirty_day_volume seven_day_volume one_day_volume total_volume')
parser.add_argument('--new', help='new opensea query')
parser.add_argument(
    '--driverpath', help='chrome driver path')
args = parser.parse_args()


def mapToText(obj):
    return obj.text


def mapProp(obj):
    return obj['href'].split('/')[2]


datos = {
    0: 'items',
    1: 'owners',
    2: 'floorPrice',
    3: 'volumeTraded',
}


def filterHrefs(href):
    print('href', href)
    if '/collection/' in href:
        return True
    return False


def main():
    DRIVER_PATH = args.driverpath  # '/usr/bin/chromedriver'
    options = Options()
    options.headless = True
    options.add_argument("--window-size=1200,1200")

    caps = DesiredCapabilities.CHROME

    print('caps', caps)
    caps['goog:loggingPrefs'] = {'performance': 'ALL'}

    driver = webdriver.Chrome(
        executable_path=DRIVER_PATH, desired_capabilities=caps)

    # url = 'https://opensea.io/rankings?chain=ethereum&sortBy=seven_day_volume'
    # url = 'https://opensea.io/rankings?chain=ethereum&sortBy=seven_day_volume&category=new'
    # url = 'https://opensea.io/rankings?chain=ethereum&sortBy=one_day_volume'
    # url = 'https://opensea.io/rankings?sortBy=total_volume&chain=ethereum'  # ethereum all time
    # ethereum all time
    url = f'https://opensea.io/rankings?sortBy={args.sortby}&chain=ethereum'
    if args.new:
        url += '&category=new'

    print('url: ', url)

    driver.get(url)

    # soup = BeautifulSoup(driver.page_source, "html.parser") # not needed

    hasNextPage = True

    while hasNextPage:
        links = list()
        elems = driver.find_elements_by_tag_name('a')

        links += [elem.get_attribute('href') for elem in elems]

        # print('links ------------', links)

        for scrollI in range(1, 5, 1):
            driver.execute_script(
                f'window.scrollTo(0, document.body.scrollHeight* ({scrollI}/4))')
            time.sleep(1)

            elems = driver.find_elements_by_tag_name('a')
            elems = set(elems)

            links += [elem.get_attribute('href') for elem in elems]
            print('links ------------', links)

        # print('text ------------', text)
        # print('text ------------', text2)

        links = list(filter(filterHrefs, links))

        print('links ------------', links)

        fileName = args.sortby
        if args.new:
            fileName += '_new'
        linksFile = open(f"data/slugs/{fileName}.json", 'a')
        linksFile.write(json.dumps(links))
        linksFile.close()

        lastPage = driver.find_elements_by_class_name(
            'Buttonreact__StyledButton-sc-glfma3-0')[1].get_attribute('disabled')
        # print('lastPage', lastPage, type(lastPage), lastPage == True, lastPage is True, lastPage == 'true', lastPage is 'true')
        if (lastPage == 'true'):
            break

        driver.execute_script(
            "document.getElementsByClassName('Buttonreact__StyledButton-sc-glfma3-0')[1].click()")
        time.sleep(3)

    driver.quit()


main()
