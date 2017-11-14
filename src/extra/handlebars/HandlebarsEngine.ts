import * as Handlebars from "handlebars";
import { TemplatingEngine } from "../../core/interfaces/mediarithmics/plugin/TemplatingEngineInterface";
import {
  AdRendererBaseInstanceContext,
  AdRendererRequest,
  Creative,
  ItemProposal
} from "../../core/index";

const handlebars = require("handlebars");
const numeral = require("numeral");
const _ = require("lodash");

export interface ClickableContent {
  item_id?: string;
  catalog_token: any;
  $content_id: number;
}

// Handlebar Context for URLs (not all macros are available)
export interface URLHandlebarsRootContext {
  request: AdRendererRequest;
  creative: HandlebarsRootContextCreative;
  // Viewability TAGs specific
  viewabilityTags?: string[];
  IAS_CLIENT_ID?: string;
  // Main mediarithmics macros
  ORGANISATION_ID: string;
  AD_GROUP_ID?: string;
  MEDIA_ID?: string;
  CAMPAIGN_ID?: string;
  CREATIVE_ID: string;
  CACHE_BUSTER: string;
  CB: string;
}

// Handlebar Context for the Template - without recommandations
export interface HandlebarsRootContext extends URLHandlebarsRootContext {
  ENCODED_CLICK_URL: string;
  CLICK_URL: string;
  ADDITIONAL_HTML?: string;
}

// Handlebar Context for the Template - with recommendations
export interface RecommendationsHandlebarsRootContext extends HandlebarsRootContext {
  redirectUrls: string[];
  clickableContents: ClickableContent[];
  recommendations: ItemProposal[];
}

export interface HandlebarsRootContextCreative {
  properties: Creative;
  click_url?: string;
  width: string;
  height: string;
}

function formatPrice(price: string, pattern: string) {
  const number = numeral(price);
  return number.format(pattern);
}

const encodeClickUrl = () => (redirectUrls: string[], clickUrl: string) => {
  let urls = redirectUrls.slice(0);
  urls.push(clickUrl);

  return urls.reduceRight((acc: string, current: string) => {
    return current + encodeURIComponent(acc);
  }, "");
};

const placeHolder = "{{MICS_AD_CONTENT_ID}}";
const uriEncodePlaceHolder = encodeURI(placeHolder);
const doubleEncodedUriPlaceHolder = encodeURI(encodeURI(placeHolder));

// Encode recommendation click url => contains the contentId of the recommendation that will be
// insrted into the campaign log
const encodeRecoClickUrlHelper = () => (
  idx: number,
  rootContext: RecommendationsHandlebarsRootContext,
  recommendation: ItemProposal
) => {
  rootContext.clickableContents.push({
    item_id: recommendation.$id,
    catalog_token: recommendation.$catalog_token,
    $content_id: idx
  });

  // recommendation.url replace placeHolder by idx
  const filledRedirectUrls = rootContext.redirectUrls.map((url: string) => {
    const url1 = _.replace(url, placeHolder, idx);
    const url2 = _.replace(url1, uriEncodePlaceHolder, idx);
    return _.replace(url2, doubleEncodedUriPlaceHolder, idx);
  });

  const recommendationUrl = recommendation.$url ? recommendation.$url : "";
  console.log(
    "URL : " + encodeClickUrl()(filledRedirectUrls, recommendationUrl)
  );
  return encodeClickUrl()(filledRedirectUrls, recommendationUrl);
};

export class HandlebarsEngine
  implements TemplatingEngine<void, string, HandlebarsTemplateDelegate<any>> {
  engine: typeof Handlebars;

  // Initialisation of the engine. Done once at every InstanceContext rebuild.
  init(): void {
    this.engine = Handlebars.create();

    /* Generic Helpers */
    this.engine.registerHelper("formatPrice", formatPrice);
    this.engine.registerHelper("toJson", (object: any) =>
      JSON.stringify(object)
    );
  }

  compile(template: string) {
    return this.engine.compile(template);
  }

  constructor() {}
}

export class RecommendationsHandlebarsEngine extends HandlebarsEngine {
  // Initialisation of the engine. Done once at every InstanceContext rebuild.
  init(): void {
    super.init();

    /* URL Encoding witchcraft */

    // We need to have 2 elements when doing the URL encoding:
    // 1. The "click tracking" array passed in the rootContext (for click tracking)
    // 2. The final URL (landing page, etc.) passed as a parameter of the helper
    //
    // In order to have both, we need to play smart and use an Handlebar partial
    // This handlebar partial is just a way to add "@root" as a parameter of the helper before calling it
    //
    // This is how the encodeClickUrl partial should be used in templates:
    // {{> encodeClickUrl url="http://www.mediarithmics.com/en/"}}
    const encodeClickUrlPartial =
      "{{encodeClickUrlInternal @root.redirectUrls url}}";
    this.engine.registerPartial("encodeClickUrl", encodeClickUrlPartial);
    this.engine.registerHelper("encodeClickUrlInternal", encodeClickUrl());

    // Same story than previously but this time the partial will inject:
    // @index -> the index of the recommendation, which is used to include it in the URL
    // @root -> the root context
    // this -> the recommendation item
    // Warning, this partial should only be used in a {{#each recommendations}}{{/each}} block
    // The $url field of the recommendation will be used as the final URL
    //
    // This is how the partial should be used in templates:
    // {{> encodeRecoClickUrl}}
    const encodeRecoClickUrlPartial =
      "{{encodeRecoClickUrlInternal @index @root this}}";
    this.engine.registerPartial(
      "encodeRecoClickUrl",
      encodeRecoClickUrlPartial
    );
    this.engine.registerHelper(
      "encodeRecoClickUrlInternal",
      encodeRecoClickUrlHelper()
    );
  }

  constructor() {
    super();
  }
}
