import { expect } from "chai";
import "mocha";
import { core } from "../";
import * as request from "supertest";
import * as sinon from "sinon";
import * as mockery from "mockery";
import * as rp from "request-promise-native";

describe("Fetch recommender API", () => {
  class MyFakeRecommenderPlugin extends core.RecommenderPlugin {
    protected onRecommendationRequest(
      request: core.RecommenderRequest,
      instanceContext: core.RecommenderBaseInstanceContext
    ) {
      const proposal: core.ItemProposal = {
        $type: "ITEM_PROPOSAL",
        $id: "42"
      };

      const response: core.RecommenderPluginResponse = {
        ts: Date.now(),
        proposals: [proposal],
        recommendation_log: "yolo"
      };

      return Promise.resolve(response);
    }
  }

  const rpMockup: sinon.SinonStub = sinon.stub().returns(
    new Promise((resolve, reject) => {
      resolve("Yolo");
    })
  );

  // All the magic is here
  const plugin = new MyFakeRecommenderPlugin();
  const runner = new core.TestingPluginRunner(plugin, rpMockup);

  it("Check that recommenderId is passed correctly in fetchRecommenderProperties", function(done) {
    const fakeRecommenderId = "42000000";

    // We try a call to the Gateway
    (runner.plugin as MyFakeRecommenderPlugin)
      .fetchRecommenderProperties(fakeRecommenderId)
      .then(() => {
        expect(rpMockup.args[0][0].uri).to.be.eq(
          `${
            runner.plugin.outboundPlatformUrl
          }/v1/recommenders/${fakeRecommenderId}/properties`
        );
        done();
      });
  });

  it("Check that RecommenderId is passed correctly in fetchRecommenderCatalogs", function(done) {
    const fakeRecommenderId = "4255";

    // We try a call to the Gateway
    (runner.plugin as MyFakeRecommenderPlugin)
      .fetchRecommenderCatalogs(fakeRecommenderId)
      .then(() => {
        expect(rpMockup.args[1][0].uri).to.be.eq(
          `${
            plugin.outboundPlatformUrl
          }/v1/recommenders/${fakeRecommenderId}/catalogs`
        );
        done();
      });
  });
});

describe("Recommender API test", function() {
  class MyFakeSimpleRecommenderPlugin extends core.RecommenderPlugin {
    protected onRecommendationRequest(
      request: core.RecommenderRequest,
      instanceContext: core.RecommenderBaseInstanceContext
    ) {
      const response: core.RecommenderPluginResponse = {
        ts: Date.now(),
        recommendation_log: "",
        proposals: []
      };
      return Promise.resolve(response);
    }
  }

  // All the magic is here
  const plugin = new MyFakeSimpleRecommenderPlugin();

  it("Check that the plugin is giving good results with a simple onRecommendationRequest handler", function(done) {
    const rpMockup = sinon.stub();

    const fakeRecommenderProperties = {
      status: "ok",
      count: 45,
      data: [
        {
          technical_name: "hello_world",
          value: {
            value: "Yay"
          },
          property_type: "STRING",
          origin: "PLUGIN",
          writable: true,
          deletable: false
        }
      ]
    };

    rpMockup
    .withArgs(
      sinon.match.has(
        "uri",
        sinon.match(function(value: string) {
          return (
            value.match(/\/v1\/recommenders\/(.){1,10}\/properties/) !==
            null
          );
        })
      )
    )
    .returns(fakeRecommenderProperties);

    const runner = new core.TestingPluginRunner(plugin, rpMockup);

    // We init the plugin
    request(runner.plugin.app)
      .post("/v1/init")
      .send({ authentication_token: "Manny", worker_id: "Calavera" })
      .end((err, res) => {
        expect(res.status).to.equal(200);
      });

    const requestBody = {
      recommender_id: "5",
      datamart_id: "1089",
      user_identifiers: [],
      input_data: {
        user_agent_id: "vec:971677694"
      }
    };

    request(runner.plugin.app)
      .post("/v1/recommendations")
      .send(requestBody)
      .end(function(err, res) {
        expect(res.status).to.equal(200);

        // We clear the cache so that we don't have any processing still running in the background
        runner.plugin.pluginCache.clear();
        done();
      });
  });
});
