import { expect } from "chai";
import "mocha";
import { core } from "@mediarithmics/plugins-nodejs-sdk";
import * as request from "supertest";
import * as sinon from "sinon";
import * as rp from "request-promise-native";
import { MySimpleAdRenderer } from '../MyPluginImpl'

// Creative stub
const creative: core.CreativeResponse = {
  status: "ok",
  data: {
    type: "DISPLAY_AD",
    id: "7168",
    organisation_id: "1126",
    name: "Toto",
    technical_name: null,
    archived: false,
    editor_version_id: "5",
    editor_version_value: "1.0.0",
    editor_group_id: "com.mediarithmics.creative.display",
    editor_artifact_id: "default-editor",
    editor_plugin_id: "5",
    renderer_version_id: "1054",
    renderer_version_value: "1.0.0",
    renderer_group_id: "com.trololo.creative.display",
    renderer_artifact_id: "multi-advertisers-display-ad-renderer",
    renderer_plugin_id: "1041",
    creation_date: 1492785056278,
    subtype: "BANNER",
    format: "300x250",
    published_version: 1,
    creative_kit: null,
    ad_layout: null,
    locale: null,
    destination_domain: "splendia.com",
    audit_status: "NOT_AUDITED",
    available_user_audit_actions: ["START_AUDIT"]
  },
  count: 1
};

// Activity Analyzer properties stub
const creativePropertiesResponse: core.PluginPropertyResponse = {
  status: "ok",
  data: [
    {
      technical_name: "click_url",
      value: {
        url:
          "http://www.april.fr/mon-assurance-de-pret-formulaire?cmpid=disp_datacomp_formadp_bann_300x250"
      },
      property_type: "URL",
      origin: "PLUGIN",
      writable: true,
      deletable: false
    },
    {
      technical_name: "ad_layout",
      value: { id: "144", version: "145" },
      property_type: "AD_LAYOUT",
      origin: "PLUGIN",
      writable: true,
      deletable: false
    },
    {
      technical_name: "backup_image",
      value: { original_file_name: null, asset_id: null, file_path: null },
      property_type: "ASSET",
      origin: "PLUGIN",
      writable: true,
      deletable: false
    },
    {
      technical_name: "datamart_id",
      value: { value: null },
      property_type: "STRING",
      origin: "PLUGIN",
      writable: true,
      deletable: false
    },
    {
      technical_name: "default_items",
      value: { value: null },
      property_type: "STRING",
      origin: "PLUGIN",
      writable: true,
      deletable: false
    },
    {
      technical_name: "style_sheet",
      value: { id: null, version: null },
      property_type: "STYLE_SHEET",
      origin: "PLUGIN",
      writable: true,
      deletable: false
    },
    {
      technical_name: "recommender_id",
      value: { value: "1" },
      property_type: "STRING",
      origin: "PLUGIN",
      writable: true,
      deletable: false
    },
    {
      technical_name: "tag_type",
      value: { value: null },
      property_type: "STRING",
      origin: "PLUGIN_STATIC",
      writable: false,
      deletable: false
    }
  ],
  count: 8
};

function buildRpMockup(templateContent: string): sinon.SinonStub {
  const rpMockup: sinon.SinonStub = sinon.stub();

  rpMockup
    .withArgs(
      sinon.match.has(
        "uri",
        sinon.match(function(value: string) {
          return value.match(/\/v1\/data_file\/data/) !== null;
        })
      )
    )
    .returns(templateContent);

  rpMockup
    .withArgs(
      sinon.match.has(
        "uri",
        sinon.match(function(value: string) {
          return value.match(/\/v1\/creatives\/(.){1,10}/) !== null;
        })
      )
    )
    .returns(creative);

  rpMockup
    .withArgs(
      sinon.match.has(
        "uri",
        sinon.match(function(value: string) {
          return (
            value.match(/\/v1\/creatives\/(.){1,10}\/renderer_properties/) !==
            null
          );
        })
      )
    )
    .returns(creativePropertiesResponse);

  return rpMockup;
}

// Fake AdCall

const adRequest: core.AdRendererRequest = {
  call_id: "auc:goo:58346725000689de0a16ac4f120ecc41-0",
  context: "LIVE",
  creative_id: "2757",
  campaign_id: "1537",
  ad_group_id: "1622",
  protocol: "https",
  user_agent_id: "vec:42000",
  user_agent:
    "Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; MALCJS; rv:11.0) like Gecko",
  user_agent_info: {
    form_factor: "PERSONAL_COMPUTER",
    os_family: "WINDOWS",
    browser_family: "IE",
    brand: null,
    model: null,
    os_version: null,
    carrier: null
  },
  placeholder_id: "mics_ed54e0e",
  user_campaign_id: "toto",
  click_urls: [
    "https://ads.mediarithmics.com/ads/event?caid=auc%3Agoo%3A58346725000689de0a16ac4f120ecc41-0&ctx=LIVE&tid=1093&gid=1622&rid=2757&uaid=tech%3Agoo%3ACAESEANnikq25sbChKLHU7-o7ls&type=clk&ctid=%7B%7BMICS_AD_CONTENT_ID%7D%7D&redirect=",
    "https://adclick.g.doubleclick.net/aclk?sa=L&ai=CDypOJWc0WN6TGs_YWsGYu5AB4Kmf9UbfuK_coAPAjbcBEAEgAGDVjdOCvAiCARdjYS1wdWItNjE2Mzg1Nzk5Mjk1Njk2NMgBCakCNKXJyWPNsT7gAgCoAwGqBOkBT9DCltAKPa0ltaiH2E0CxRF2Jee8ykOBqRGHBbE8aYS7jODKKPHE3KkGbenZXwSan1UZekvmuIfSdRUg6DFQhnbJnMR_bK57BQlMaMnmd71MXTv6P9Hh0m5cuoj7SlpOoyMX9IG8mNomIve031sZUPKOb5QA_tVKhtrlnm2hYJ7KSVZJH_83YmpK_ShxuxIwiAwQKMhYBnM4tnbvEinl3fROiwH1FFNOlqNJPaNgU4z9kEGCHIpj3RLErIcrxmT5OFLZ3q5AELXCYBJP1zB-UvscTkLrfc3Vl-sOe5f5_Tkkn-MpcijM_Z_gBAGABvDqk_ivqMjMFaAGIagHpr4b2AcA0ggFCIBhEAE&num=1&sig=AOD64_3iMhOr3Xh-A4bP1jvMzeEMGFfwtw&client=ca-pub-6163857992956964&adurl="
  ],
  display_tracking_url:
    "https://ads.mediarithmics.com/ads/event?caid=auc%3Agoo%3A58346725000689de0a16ac4f120ecc41-0&ctx=LIVE&tid=1093&gid=1622&rid=2757&uaid=tech%3Agoo%3ACAESEANnikq25sbChKLHU7-o7ls&type=imp&vid=4080&cb=ef3933a2-591b-4b1e-8fe2-4d9fd75980c4",
  latitude: null,
  longitude: null,
  restrictions: { animation_max_duration: 25 }
};

describe("Test Example Handlebar Ad Renderer", function() {
  it("Check overall execution of dummy handlebar adRenderer", function(done) {
    // All the magic is here

    // Template File stub
    const templateContent: string = `Hello World!`;
    const rpMockup = buildRpMockup(templateContent);

    const plugin = new MySimpleAdRenderer();
    const runner = new core.TestingPluginRunner(plugin, rpMockup);

    // Plugin init
    request(runner.plugin.app)
      .post("/v1/init")
      .send({ authentication_token: "Manny", worker_id: "Calavera" })
      .end((err, res) => {
        expect(res.status).to.equal(200);

        // Plugin log level to debug
        request(runner.plugin.app)
          .put("/v1/log_level")
          .send({ level: "silly" })
          .end((err, res) => {
            expect(res.status).to.equal(200);

            // Activity to process
            request(runner.plugin.app)
              .post("/v1/ad_contents")
              .send(adRequest)
              .end((err, res) => {
                expect(res.status).to.eq(200);

                done();
              });
          });
      });
  });
});
