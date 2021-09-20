import * as ElasticSearch from '@elastic/elasticsearch';
import { Express } from 'express';
import axios from 'axios';
import { arrayFetch } from '../../lib/network';
import { object, string } from '@ailabs/ts-utils/dist/decoder';

const params = {
  getAsset: object('AssetParams', {
    contractAddress: string,
    tokenId: string
  })
}

// def statistical_rarity(_trait_counts):
//     stat = 1
//     for x in _trait_counts:
//         x /= g_token_count
//         stat *= x
//     return stat

// #This works
// def single_trait_rarity(_trait_counts):
//     print("single_trait_rarity...")
//     stat = 1
//     for x in _trait_counts:
//         x /= g_token_count
//         if x < stat:
//             stat = x
//     print(stat)
//     return stat

// #This works
// def avg_trait_rarity(_trait_counts):
//     print("avg_trait_rarity...")
//     stat = 0
//     trait_count = 0
//     for x in _trait_counts:
//         x /= g_token_count
//         stat += x
//         trait_count += 1
//     stat /= trait_count
//     print(stat)
//     return stat

// #This works
// def rarity_score(_trait_counts):
//     print("rarity_score...")
//     stat = 0
//     for x in _trait_counts:
//         x = 1/(x/g_token_count)
//         stat += x
//     print(stat)
//     return stat

// #This works
// def check_exists(_contract_id): #checks to see if the JSON file has been written and if the collection_count matches
//     global g_token_count
//     g_token_count = get_collection_count(_contract_id)
//     if os.path.isfile(f"{_contract_id}-{g_token_count}"):
//         print('something')
//         return True
//     else:
//         return False
//         print('something else')     

// #This works
// def get_collection_count(_contract_id): # retrieves the number of tokens in that contracts collection
//     url = "https://api.opensea.io/api/v1/asset/" + _contract_id + "/1"
//     response = requests.request("GET", url)
//     json_text = json.loads(response.text)
//     return int(json_text['collection']['stats']['count']) 
//     #print(token_count)

// #This works
// def get_ranked_asset(_contract_id, _NFT_id):
//     if not check_exists(_contract_id):
//         rank_collection(_contract_id)

//     file = open(f"{_contract_id}-{g_token_count}")
//     rarity_collection = json.loads(file.read())
//     print(rarity_collection)
//     for NFT in rarity_collection['rarity_scores']:
//         #print(f"\n{NFT['NFT_token_id']}")
//         if int(NFT['NFT_token_id']) == int(_NFT_id):
//             result = (
//                 f"{NFT['NFT_name']} Ranks:\n"
//                 f"Stat Rarity = {NFT['stat_rarity_rank']}/{g_token_count}\n"
//                 f"Trait Rarity = {NFT['trait_rarity_rank']}/{g_token_count}\n"
//                 f"Avg Rarity = {NFT['avg_rarity_rank']}/{g_token_count}\n"
//                 f"Score = {NFT['rarity_score_rank']}/{g_token_count}\n"
//                 )
//             #print(result)
//     return result

// #This works
// def rank_collection(_contract_id):
//     global g_token_count
//     g_token_count = get_collection_count(_contract_id)
//     rarity_collection = {'contract_id': _contract_id} #a new top level dictipnary that holds all of the new data for rarity
//     url = "https://api.opensea.io/api/v1/assets"
//     page = 1
//     page_limit = g_token_count
//     count=0 # number of NFTs processed
//     rarity_traits = []     #this list will be added to rarity_collection{} as a list of dictionaries{} of each nft with its rarity calculations

//     while page <= page_limit:
//         try:
//             querystring = {"asset_contract_address":_contract_id,"offset":str(page),"limit":"50"} # max limit is 50, max offset =10000
//             response = requests.request("GET", url, params =querystring)

//             json_text = json.loads(response.text)
//             #print(json.dumps(json_text, indent = 4, sort_keys = True))
//             page += 50
//             time.sleep(.2)
//             #traits=json_text['assets'][0].get('traits')

//             for NFT in json_text['assets']:   # each NFT is everything associated with a single NFT in the collection. Assets is a list[] of dictionarys{}from the OS json
//                 #print(NFT.get('traits'))

//                 trait_counts = [] # this is a list of all the trait_counts for each NFT to be passed to the calculator methods
//                 next_NFT = {'NFT_name': NFT['name'], 'NFT_id': NFT['id'], 'NFT_token_id': NFT['token_id']} #dictionary to be added to rarity_traits[] list
//                 #ii = 0
//                 print(next_NFT)
//                 if len(NFT.get('traits')) > 0:
//                     for trait in NFT.get('traits'): # do the math after we loop through this
//                         trait_counts.append(trait.get('trait_count'))

//                         #print(f"{NFT['asset_contract'].get('name')} - {trait.get('trait_type')} - {trait.get('value')} - {trait.get('trait_count')}")
//                         #traits[ii]={'trait_type':trait.get('trait_type'), 'value':trait.get('value'),'trait_count':trait.get('trait_count')}

//                     next_NFT['stat_rarity'] = statistical_rarity(trait_counts)
//                     next_NFT['trait_rarity'] = single_trait_rarity(trait_counts)
//                     next_NFT['avg_rarity'] = avg_trait_rarity(trait_counts)
//                     next_NFT['rarity_score'] = rarity_score(trait_counts)
//                     rarity_traits.append(next_NFT)
//                 else:
//                     next_NFT['stat_rarity'] = 0
//                     next_NFT['trait_rarity'] = 0
//                     next_NFT['avg_rarity'] = 0
//                     next_NFT['rarity_score'] = 0
//                     rarity_traits.append(next_NFT)                    
//                 count += 1
//         except:
//             print("bogus")
//             break        

//     rarity_collection['rarity_scores'] = rarity_traits
//     #print(rarity_collection)
//     print (sorted(rarity_collection['rarity_scores'], key = lambda i: i['stat_rarity']))
//     rank_counter = 1
//     for ranked_NFT in sorted(rarity_traits, key = lambda i: i['stat_rarity']):
//         ranked_NFT.update({'stat_rarity_rank':rank_counter})
//         rank_counter += 1
//     rank_counter = 1
//     for ranked_NFT in sorted(rarity_traits, key = lambda i: i['trait_rarity']):
//         ranked_NFT.update({'trait_rarity_rank':rank_counter})
//         rank_counter += 1
//     rank_counter = 1
//     for ranked_NFT in sorted(rarity_traits, key = lambda i: i['avg_rarity']):
//         ranked_NFT.update({'avg_rarity_rank':rank_counter})
//         rank_counter += 1
//     rank_counter = 1
//     for ranked_NFT in sorted(rarity_traits, key = lambda i: i['rarity_score'],reverse=True):
//         ranked_NFT.update({'rarity_score_rank':rank_counter})
//         rank_counter += 1
//     tweet_text =  ""   
//     rarity_collection['rarity_scores'] = rarity_traits
//     with open(f"{_contract_id}-{g_token_count}", 'w') as outfile:
//         json.dump(rarity_collection, outfile)


export default ({ app, db }: { app: Express, db: ElasticSearch.Client }) => {
  app.get('/api/assets/:contractAddress/:tokenId/score')

};
