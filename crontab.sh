# wego-scraper
*/3 * * * * cd ~/api; node -r dotenv/config scraper/scraper.assets.js  --exec=saveAssets --forceScrape=1 --limitCollections=2 --linear=true --factor=3 --errsToFile=/home/ubuntu/data/errors-to-assets.txt;
*/3 * * * * cd ~/api; node -r dotenv/config scraper/rank.js --execrank=run --limitCollections=5;
# wego-scraper-10k
0/5 0-21 * * * cd ~/api; node -r dotenv/config scraper/scraper.assets.js  --exec=saveAssets --forceScrape=1 --limitCollections=1 --linear=true --factor=3 --above10k=1 --errsToFile=/home/ubuntu/data/errors-to-assets.txt;
0 22 * * * cd ~/api; node -r dotenv/config scraper/scraper.collectibles.js;
30 22 * * * cd ~/api; node -r dotenv/config lib/;
0 23 * * * cd ~/api; node -r dotenv/config scraper/scraper.collections.js;