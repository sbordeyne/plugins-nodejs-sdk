import {
  AdRendererBasePlugin,
  AdRendererRequest,
  AdRendererBaseInstanceContext
} from "@mediarithmics/plugins-nodejs-sdk";
import * as winston from "winston";

// All the magic is here
const plugin = new AdRendererBasePlugin(
  (
    request: AdRendererRequest,
    instanceContext: AdRendererBaseInstanceContext,
    logger: winston.LoggerInstance
  ) => {
    let html = `<html>
    <body>
    <h1>Creative: ${instanceContext.creative.name}</h1>
    <br/>
    <p>
    Powered by the Ad Renderer: ${instanceContext.creative
      .renderer_group_id}:${instanceContext.creative
      .renderer_artifact_id} v.${instanceContext.creative
      .renderer_version_value}
    </p>
    <!-- We always need to include the mediarithmics impression tracking pixel -->
    <img src="${request.display_tracking_url}" />
    </body>
    </html>`;

    return html;
  }
);

plugin.start();
