export GATEWAY_HOST="localhost"
export GATEWAY_PORT="8123"

export PLUGIN_HOST="localhost"
export PLUGIN_PORT="8080"

node gatewayMockup.js &

sleep 1

node build/index.js &

sleep 1

curl -X POST -H "Content-Type: application/json" -d '{"authentication_token":"123", "worker_id":"123"}' http://${PLUGIN_HOST}:${PLUGIN_PORT}/v1/init
curl -X PUT -H "Content-Type: application/json" -d '{"level":"debug"}' http://${PLUGIN_HOST}:${PLUGIN_PORT}/v1/log_level
curl -v -X POST http://${PLUGIN_HOST}:${PLUGIN_PORT}/v1/ad_contents  -d '
    {
        "call_id":"auc:apx:58346725000689de0a16ac4f120ecc41-0",
        "context":"LIVE",
        "creative_id":"2757",
        "campaign_id":"1537",
        "ad_group_id":"1622",
        "media_id": "site:web:lemonde.fr",
        "protocol":"https",
        "user_agent":"Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; MALCJS; rv:11.0) like Gecko",
        "user_agent_info":{"form_factor":"PERSONAL_COMPUTER","os_family":"WINDOWS","browser_family":"IE","brand":null,"model":null,"os_version":null,"carrier":null},
        "placeholder_id":"mics_ed54e0e",
        "user_campaign_id":"toto",
        "click_urls":["https://ads.mediarithmics.com/ads/event?caid=auc%3Agoo%3A58346725000689de0a16ac4f120ecc41-0&ctx=LIVE&tid=1093&gid=1622&rid=2757&uaid=tech%3Agoo%3ACAESEANnikq25sbChKLHU7-o7ls&type=clk&ctid=%7B%7BMICS_AD_CONTENT_ID%7D%7D&redirect=","https://adclick.g.doubleclick.net/aclk?sa=L&ai=CDypOJWc0WN6TGs_YWsGYu5AB4Kmf9UbfuK_coAPAjbcBEAEgAGDVjdOCvAiCARdjYS1wdWItNjE2Mzg1Nzk5Mjk1Njk2NMgBCakCNKXJyWPNsT7gAgCoAwGqBOkBT9DCltAKPa0ltaiH2E0CxRF2Jee8ykOBqRGHBbE8aYS7jODKKPHE3KkGbenZXwSan1UZekvmuIfSdRUg6DFQhnbJnMR_bK57BQlMaMnmd71MXTv6P9Hh0m5cuoj7SlpOoyMX9IG8mNomIve031sZUPKOb5QA_tVKhtrlnm2hYJ7KSVZJH_83YmpK_ShxuxIwiAwQKMhYBnM4tnbvEinl3fROiwH1FFNOlqNJPaNgU4z9kEGCHIpj3RLErIcrxmT5OFLZ3q5AELXCYBJP1zB-UvscTkLrfc3Vl-sOe5f5_Tkkn-MpcijM_Z_gBAGABvDqk_ivqMjMFaAGIagHpr4b2AcA0ggFCIBhEAE&num=1&sig=AOD64_3iMhOr3Xh-A4bP1jvMzeEMGFfwtw&client=ca-pub-6163857992956964&adurl="],
        "display_tracking_url":"https://ads.mediarithmics.com/ads/event?caid=auc%3Agoo%3A58346725000689de0a16ac4f120ecc41-0&ctx=LIVE&tid=1093&gid=1622&rid=2757&uaid=tech%3Agoo%3ACAESEANnikq25sbChKLHU7-o7ls&type=imp&vid=4080&cb=ef3933a2-591b-4b1e-8fe2-4d9fd75980c4",
        "latitude":null,
        "longitude":null,
        "restrictions":{"animation_max_duration":25}
    }
' -H "Content-Type: application/json"
killall -SIGTERM node