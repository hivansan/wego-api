wego scrape

1. python run for scrapping opensea/ranking stats with filtered data (collection tags)

python -m opensea.scrapeStats --sortby seven_day_volume
python -m opensea.scrapeStats --sortby seven_day_volume --new 1

python -m opensea.scrapeStats --sortby one_day_volume
python -m opensea.scrapeStats --sortby one_day_volume --new 1

python -m opensea.scrapeStats --sortby thirty_day_volume
python -m opensea.scrapeStats --sortby thirty_day_volume --new 1

python -m opensea.scrapeStats --sortby total_volume
python -m opensea.scrapeStats --sortby total_volume --new 1

2. get collection info from opensea. this puts the collections with the addedAt and updatedAt. 
also this gets the data from the ones that has no info - just slug:
/home/ubuntu/api/current/node_modules/.bin/ts-node /home/ubuntu/api/current/scraper/scraper.ts --exec=loadCollections --dir=/home/ubuntu/scraper/data/slugs --errsToFile=/home/ubuntu/scraper/data/errors-to.txt

3. run download assets (this stores them in files):
brew services tor restart
/home/ubuntu/api/current/node_modules/.bin/ts-node /home/ubuntu/api/current/scraper/scraper.ts --exec=saveAssetsFromCollections --bots=4 --errsToFile=/home/ubuntu/scraper/data/errors-to.txt

4 run scrape from links that failed
/home/ubuntu/api/current/node_modules/.bin/ts-node /home/ubuntu/api/current/scraper/scraper.ts --exec=fromFile --errsFromFile=/home/ubuntu/scraper/data/errors-to.txt --bots=4

-- extra: this can be useful to load assets from directory
/home/ubuntu/api/current/node_modules/.bin/ts-node /home/ubuntu/api/current/bin/load-chunks.ts --dir=/home/ubuntu/partials --index=assets