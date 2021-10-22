import json
import time
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium import webdriver
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities

"""
  example usage:
  python -m scrape-stats --sortby one_day_volume             --driverpath /usr/bin/chromedriver --pathtosave /home/ubuntu/scraper/data/slugs --category trading-cards
  # python -m scrape-stats --sortby one_day_volume     --new 1 --driverpath /usr/bin/chromedriver --pathtosave /home/ubuntu/scraper/data/slugs --category trading-cards

  python -m scrape-stats --sortby seven_day_volume           --driverpath /usr/bin/chromedriver --pathtosave /home/ubuntu/scraper/data/slugs --category trading-cards
  # python -m scrape-stats --sortby seven_day_volume   --new 1 --driverpath /usr/bin/chromedriver --pathtosave /home/ubuntu/scraper/data/slugs --category trading-cards

  python -m scrape-stats --sortby thirty_day_volume          --driverpath /usr/bin/chromedriver --pathtosave /home/ubuntu/scraper/data/slugs --category trading-cards
  # python -m scrape-stats --sortby thirty_day_volume  --new 1 --driverpath /usr/bin/chromedriver --pathtosave /home/ubuntu/scraper/data/slugs --category trading-cards

  python -m scrape-stats --sortby total_volume               --driverpath /usr/bin/chromedriver --pathtosave /home/ubuntu/scraper/data/slugs --category trading-cards
  # python -m scrape-stats --sortby total_volume       --new 1 --driverpath /usr/bin/chromedriver --pathtosave /home/ubuntu/scraper/data/slugs --category trading-cards
  
  python -m scrape-stats --sortby one_day_volume             --driverpath /usr/bin/chromedriver --pathtosave /home/ubuntu/scraper/data/slugs --category collectibles
  # python -m scrape-stats --sortby one_day_volume     --new 1 --driverpath /usr/bin/chromedriver --pathtosave /home/ubuntu/scraper/data/slugs --category collectibles

  python -m scrape-stats --sortby seven_day_volume           --driverpath /usr/bin/chromedriver --pathtosave /home/ubuntu/scraper/data/slugs --category collectibles
  # python -m scrape-stats --sortby seven_day_volume   --new 1 --driverpath /usr/bin/chromedriver --pathtosave /home/ubuntu/scraper/data/slugs --category collectibles

  python -m scrape-stats --sortby thirty_day_volume          --driverpath /usr/bin/chromedriver --pathtosave /home/ubuntu/scraper/data/slugs --category collectibles
  # python -m scrape-stats --sortby thirty_day_volume  --new 1 --driverpath /usr/bin/chromedriver --pathtosave /home/ubuntu/scraper/data/slugs --category collectibles

  python -m scrape-stats --sortby total_volume               --driverpath /usr/bin/chromedriver --pathtosave /home/ubuntu/scraper/data/slugs --category collectibles
  # python -m scrape-stats --sortby total_volume       --new 1 --driverpath /usr/bin/chromedriver --pathtosave /home/ubuntu/scraper/data/slugs --category collectibles
"""

import sys
import argparse
parser = argparse.ArgumentParser()
parser.add_argument('--sortby', help='sortby opensea query  ---- thirty_day_volume seven_day_volume one_day_volume total_volume')
parser.add_argument('--new', help='new opensea query')
parser.add_argument('--driverpath', help='chrome driver path')
parser.add_argument('--pathtosave', help='folder in which files are stored')
parser.add_argument('--category', help='category trading-cards | collectibles')
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
    # DRIVER_PATH = args.driverpath # '/Users/ivanflores/Downloads/chromedriver'
    caps = DesiredCapabilities.CHROME
    options = Options()
    # options.headless = True
    options.add_argument("--window-size=500,1200")
    service = Service(args.driverpath)

    print('caps', caps)
    caps['goog:loggingPrefs'] = {'performance': 'ALL'}

    driver = webdriver.Chrome(service=service, desired_capabilities=caps, chrome_options=options)

    # url = 'https://opensea.io/rankings?chain=ethereum&sortBy=seven_day_volume'
    # url = 'https://opensea.io/rankings?chain=ethereum&sortBy=seven_day_volume&category=new'
    # url = 'https://opensea.io/rankings?chain=ethereum&sortBy=one_day_volume'
    # url = 'https://opensea.io/rankings?sortBy=total_volume&chain=ethereum'  # ethereum all time
    # ethereum all time
    url = f'https://opensea.io/rankings?sortBy={args.sortby}&chain=ethereum&category={args.category}'
    if args.new:
        url += '&category=new'

    print('url: ', url)

    driver.get(url)

    fileName = args.sortby
    if args.new:
        fileName += '_new'

    # soup = BeautifulSoup(driver.page_source, "html.parser") # not needed

    hasNextPage = True

    while hasNextPage:
        links = list()
        elems = driver.find_elements_by_tag_name('a')

        links += [elem.get_attribute('href') for elem in elems]

        for scrollI in range(1, 5, 1):
            driver.execute_script(f'window.scrollTo(0, document.body.scrollHeight* ({scrollI}/4))')
            time.sleep(2)

            elems = driver.find_elements_by_tag_name('a')
            elems = set(elems)

            links += [elem.get_attribute('href') for elem in elems]

            file = open(f"{args.pathtosave}/{fileName}.json", 'a')
            file.write(json.dumps(links))
            file.close()

        links = list(filter(filterHrefs, links))

        print('links ------------', links)

        file = open(f"{args.pathtosave}/{fileName}.json", 'a')
        file.write(json.dumps(links))
        file.close()

        buttons = driver.find_elements_by_class_name('Buttonreact__StyledButton-sc-glfma3-0')
        lastPage = 'false';

        if (len(buttons)):
          lastPage = buttons[1].get_attribute('disabled')

        if (lastPage == 'true'):
          break

        if (len(buttons) == 0):
          break

        driver.execute_script("document.getElementsByClassName('Buttonreact__StyledButton-sc-glfma3-0')[1].click()")
        time.sleep(4)

    driver.quit()


main()
