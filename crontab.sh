* * * * * ES_CLIENT=https://vpc-wego-db-1-mz5tglq65ulqsc5p52nf7gy2ke.us-east-1.es.amazonaws.com:443 /usr/bin/env node /home/ubuntu/api/dist/scraper/scraper.assets.js --exec=saveAssets --onlyRequested=1 --linear=true --factor=.4 --errsToFile=/home/ubuntu/data/errors-to-assets.txt &>/tmp/mycommand.log
* * * * * ES_CLIENT=https://vpc-wego-db-1-mz5tglq65ulqsc5p52nf7gy2ke.us-east-1.es.amazonaws.com:443 /usr/bin/env node /home/ubuntu/api/dist/scraper/rank.js &>/tmp/mycommand.log