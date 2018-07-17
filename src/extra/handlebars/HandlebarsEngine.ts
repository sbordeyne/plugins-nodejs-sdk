import * as Handlebars from "handlebars";
import numeral = require("numeral");
import _ = require("lodash");

import {
  AdRendererRequest,
  AdRendererTemplateInstanceContext
} from "../../mediarithmics/plugins/ad-renderer";

import {
  Creative
} from "../../mediarithmics/api/core/creative";

import {
  ItemProposal
} from "../../mediarithmics/api/datamart";
import { ExploreableInternalsTemplatingEngine, TemplateMacro, ProfileDataTemplater } from "../../mediarithmics/plugins/common/TemplatingInterface";
import {ClickUrlInfo} from "../../mediarithmics/plugins/ad-renderer/base/AdRendererInterface";
import {generateEncodedClickUrl} from "../../mediarithmics/plugins/ad-renderer/utils/index";

// Handlebar Context for URLs (not all macros are available)
export interface URLHandlebarsRootContext {
  REQUEST: AdRendererRequest;
  CREATIVE: HandlebarsRootContextCreative;
  // Viewability TAGs specific
  IAS_CLIENT_ID?: string;
  // Main mediarithmics macros
  ORGANISATION_ID: string;
  AD_GROUP_ID?: string;
  MEDIA_ID?: string;
  ENCODED_MEDIA_ID?: string;
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
export interface RecommendationsHandlebarsRootContext
  extends HandlebarsRootContext {
  private: {
    redirectUrls: ClickUrlInfo[];
    clickableContents: ClickableContent[];
  };
  RECOMMENDATIONS: ItemProposal[];
}

export interface ClickableContent {
  item_id?: string;
  catalog_token: any;
  $content_id: number;
}

export interface HandlebarsRootContextCreative {
  CLICK_URL?: string;
  WIDTH: string;
  HEIGHT: string;
}

function formatPrice(price: string, pattern: string) {
  const number = numeral(price);
  return number.format(pattern);
}

const encodeClickUrl = () => (redirectUrls: ClickUrlInfo[], clickUrl: string) => {
  let urls = redirectUrls.slice(0);
  urls.push({
    url: clickUrl,
    redirect_count: 0
  });

  return generateEncodedClickUrl(urls);
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
  rootContext.private.clickableContents.push({
    item_id: recommendation.$id,
    catalog_token: recommendation.$catalog_token,
    $content_id: idx
  });

  // recommendation.url replace placeHolder by idx
  const filledRedirectUrls: ClickUrlInfo[] = rootContext.private.redirectUrls.map(
    (clickUrlInfo: ClickUrlInfo) => {
      const cloned = _.clone(clickUrlInfo);
      const url1 = _.replace(cloned.url, placeHolder, idx.toString());
      const url2 = _.replace(url1, uriEncodePlaceHolder, idx.toString());
      cloned.url = _.replace(url2, doubleEncodedUriPlaceHolder, idx.toString());
      return cloned;
    }
  );

  const recommendationUrl = recommendation.$url ? recommendation.$url : "";

  return encodeClickUrl()(filledRedirectUrls, recommendationUrl);
};

export function buildURLHandlebarsRootContext(
  adRenderRequest: AdRendererRequest,
  instanceContext: AdRendererTemplateInstanceContext
): URLHandlebarsRootContext {

  return {
    REQUEST: adRenderRequest,
    CREATIVE: {
      CLICK_URL: instanceContext.creative_click_url,
      WIDTH: instanceContext.width,
      HEIGHT: instanceContext.height
    },
    ORGANISATION_ID: instanceContext.displayAd.organisation_id, // Hack, it should come from the AdRendererRequest
    AD_GROUP_ID: adRenderRequest.ad_group_id,
    MEDIA_ID: adRenderRequest.media_id,
    ENCODED_MEDIA_ID: adRenderRequest.media_id ? encodeURIComponent(adRenderRequest.media_id) : undefined,
    CAMPAIGN_ID: adRenderRequest.campaign_id,
    CREATIVE_ID: adRenderRequest.creative_id,
    CACHE_BUSTER: Date.now().toString(),
    IAS_CLIENT_ID: instanceContext.ias_client_id,
    CB: Date.now().toString()
  }

}

export interface ProfileEmailHandlebarsRootContext {
  private: {
    profileData: ProfileDataLayer
  }
}

export interface ProfileDataLayer {
  [propsName: string]: string;
}

export interface ProfileDataArgs {
  defaultValue: string;
  fieldName: string;
}

export interface ProfileDataHelperOptions {
  name: string;
  hash: ProfileDataArgs;
  data: { root: ProfileEmailHandlebarsRootContext }
}

export class HandlebarsEngine
  implements ExploreableInternalsTemplatingEngine<void, string, HandlebarsTemplateDelegate<any>, hbs.AST.Program>, ProfileDataTemplater {

  // Initialisation of the engine. Done once at every InstanceContext rebuild.
  init(): void {
    this.engine = Handlebars.create();

    /* Generic Helpers */
    this.engine.registerHelper("formatPrice", formatPrice);
    this.engine.registerHelper("toJson", (object: any) =>
      JSON.stringify(object)
    );
  }

  enableProfileDataLayer(): void {

    this.engine.registerHelper("profileData", function (opts: ProfileDataHelperOptions) {

      // See https://blog.osteele.com/2007/12/cheap-monads/
      const $N = {};
      // Check if we have the value in the DataLayer
      if ((((((opts || $N).data || $N).root || $N).private || $N).profileData || $N)[opts.hash.fieldName]) {
        return opts.data.root.private.profileData[opts.hash.fieldName];
      } else {
        return opts.hash.defaultValue;
      }

    });
  };

  parse(template: string): hbs.AST.Program {
    return Handlebars.parse(template)
  };

  // TODO: Test this thing
  getMacros(internals: hbs.AST.Program): TemplateMacro[] {

    class MacroScanner extends Handlebars.Visitor {
      macros: TemplateMacro[] = [];
    }

    // The Handlebars Compiler library is documented there: https://github.com/wycats/handlebars.js/blob/master/docs/compiler-api.md
    MacroScanner.prototype.MustacheStatement = function (macro: hbs.AST.MustacheStatement) {
      
      if (macro.type === "MustacheStatement") {
        const pathExpression = macro.path as hbs.AST.PathExpression
        this.macros.push({parts: pathExpression.parts});
      }

      // We're just here to visit, we don't want to break anything, so let's call the "default function" to process MustacheStatement
      Handlebars.Visitor.prototype.MustacheStatement.call(this, macro);
    };

    var scanner = new MacroScanner();
    scanner.accept(internals);

    return scanner.macros;

  };

  engine: typeof Handlebars;

  compile(template: string | hbs.AST.Program) {
    // Handlebars.compile() can take a string or an AST
    return this.engine.compile(template);
  }

  constructor() { }
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
      "{{encodeClickUrlInternal @root.private.redirectUrls url}}";
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
