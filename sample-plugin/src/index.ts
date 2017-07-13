import * as express from 'express';
import {
    AdRendererBasePlugin,
    AdRendererRequest
} from 'mediarithmics-plugins-typescript-helpers';

const plugin = new AdRendererBasePlugin();

plugin.addOnAdContentsListener((request: AdRendererRequest, res: express.Response) => {

    const creativeP = plugin.fetchCreative(request.creative_id);
    const creativePropsP = plugin.fetchCreativeProperties(request.creative_id);

    return Promise.all([creativeP, creativePropsP]).then((results) => {

        const creative = results[0];
        const creativeProps = results[1];

        const encodedClickUrl = plugin.getEncodedClickUrl(request.click_urls);
        const quantumTagProperty = creativeProps.find((prop) => {
            return prop.technical_name === 'quantum_tag'
        }).value.value;
        const additionalPixeltag = creativeProps.find((prop) => {
            return prop.technical_name === '3rd_party_pixel_tag'
        }).value.value;

        // We insert the Quantum TAG and the display pixel
        let js = `${quantumTagProperty}
document.write('<div style="display:none;"><img src="${request.display_tracking_url}" /></div>');`;

        if (additionalPixeltag) {
            js = js + `document.write('<div style="display:none;"><img src="${additionalPixeltag}" /></div>');`;
        }

        // Replacing macros
        const isInPreview = (request.context === 'STAGE' || request.context === 'PREVIEW') ? 1 : 0;

        js = js.replace(/{{TAG_ID}}/g, request.call_id.replace('auc:apx:', ''))
            .replace(/{{CLICK_URL}}/g, encodedClickUrl)
            .replace(/{{CACHE_BUSTER}}/g, Date.now().toString())
            .replace(/{{MEDIA_ID}}/g, request.media_id)
            .replace(/{{IS_PREVIEW}}/g, isInPreview.toString());

        return res.status(200).send(js);

    }).catch(reason => {
        this.logger.error(`Something bad happened : ${reason.message} - ${reason.stack}`);
        return res.status(500).send(reason.message + "\n" + reason.stack);
    });
});  