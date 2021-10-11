wego scrape

1. in PY run files

python -m opensea.scrapeStats --sortby seven_day_volume
python -m opensea.scrapeStats --sortby seven_day_volume --new 1

python -m opensea.scrapeStats --sortby one_day_volume
python -m opensea.scrapeStats --sortby one_day_volume --new 1

python -m opensea.scrapeStats --sortby thirty_day_volume
python -m opensea.scrapeStats --sortby thirty_day_volume --new 1

python -m opensea.scrapeStats --sortby total_volume
python -m opensea.scrapeStats --sortby total_volume --new 1

2. in API run Scraper.collectionTags
curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' 'http://localhost:3000/api/Scrapers/collectionTags'

3. in API run Scraper.populateCollections
curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' 'http://localhost:3000/api/Scrapers/populateCollections'

4. run download assets:
/home/ubuntu/api/current/node_modules/.bin/ts-node /home/ubuntu/api/current/bin/load-chunks.ts --dir=/home/ubuntu/partials --index=assets