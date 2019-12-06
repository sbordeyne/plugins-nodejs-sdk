import {core} from '@mediarithmics/plugins-nodejs-sdk';

export class MyBidOptimizerPlugin extends core.BidOptimizerPlugin {
  protected onBidDecisions(
    request: core.BidOptimizerRequest,
    instanceContext: core.BidOptimizerBaseInstanceContext
  ): Promise<core.BidOptimizerPluginResponse> {
    
    // Optimization, we only do the stringify  if we are really on debug / silly mode
    if (this.logger.level === "debug" || this.logger.level === "silly") {
      this.logger.debug(
        `Received inside plugin: ${JSON.stringify(request, null, 4)}`
      );
    }

    const bids: core.Bid[] = request.bid_info.placements.map(
      (placementInfo, index) => {
        return {
          index: index,
          bid_price: request.campaign_info.max_bid_price,
          sale_condition_id: this.findBestSalesConditions(
            request.campaign_info.max_bid_price,
            placementInfo.sales_conditions
          ).id
        };
      }
    );

    const response: core.BidOptimizerPluginResponse = {
      bids: bids
    };

    return Promise.resolve(response);
  }
}
