# wego-scraper
*/3 * * * * ES_CLIENT=https://vpc-wego-db-1-mz5tglq65ulqsc5p52nf7gy2ke.us-east-1.es.amazonaws.com:443 /usr/bin/env node /home/ubuntu/api/scraper/scraper.assets.js  --exec=saveAssets --forceScrape=1 --limitCollections=2 --linear=true --factor=3 --errsToFile=/home/ubuntu/data/errors-to-assets.txt # >>/home/ubuntu/scrape.log
*/3 * * * * ES_CLIENT=https://vpc-wego-db-1-mz5tglq65ulqsc5p52nf7gy2ke.us-east-1.es.amazonaws.com:443 /usr/bin/env node /home/ubuntu/api/scraper/rank.js --execrank=run --limitCollections=5 # >>/home/ubuntu/rank.log --limitCollections=5

# wego-scraper-10k
0/5 0-22 * * * ES_CLIENT=https://vpc-wego-db-1-mz5tglq65ulqsc5p52nf7gy2ke.us-east-1.es.amazonaws.com:443 /usr/bin/env node /home/ubuntu/api/scraper/scraper.assets.js  --exec=saveAssets --forceScrape=1 --limitCollections=1 --linear=true --factor=3 --above10k=1 --errsToFile=/home/ubuntu/data/errors-to-assets.txt
0 23 * * * ES_CLIENT=https://vpc-wego-db-1-mz5tglq65ulqsc5p52nf7gy2ke.us-east-1.es.amazonaws.com:443 /usr/bin/env node /home/ubuntu/api/scraper/scraper.collections.js