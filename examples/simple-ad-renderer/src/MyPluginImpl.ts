import { core } from "@mediarithmics/plugins-nodejs-sdk";

export class MySimpleAdRenderer extends core.AdRendererBasePlugin<
  core.AdRendererBaseInstanceContext
> {
  protected async onAdContents(
    request: core.AdRendererRequest,
    instanceContext: core.AdRendererBaseInstanceContext
  ): Promise<core.AdRendererPluginResponse> {
    const result: core.AdRendererPluginResponse = {
      html: `<html>
    <body>
    <h1>Creative: ${instanceContext.displayAd.name}</h1>
    <br/>
    <p>
    Powered by the Ad Renderer: ${instanceContext.displayAd
      .renderer_group_id}:${instanceContext.displayAd
        .renderer_artifact_id} v.${instanceContext.displayAd
        .renderer_version_value}
    </p>
    <!-- We always need to include the mediarithmics impression tracking pixel -->
    <img src="${request.display_tracking_url}" />
    </body>
    </html>`,
    displayContext: { hello: "❤" }
    };

    return Promise.resolve(result);
  }
}
