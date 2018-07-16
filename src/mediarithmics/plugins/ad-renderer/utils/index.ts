import * as _ from 'lodash';
import {ClickUrlInfo} from '../base/AdRendererInterface';

export function generateEncodedClickUrl(redirectUrls: ClickUrlInfo[]) {
  const urls = _.clone(redirectUrls);
  return urls.reduceRight(
    (acc, current, index) => {
      if (index == urls.length - 1)
        return current.url;
      return current.url + encodeUrlInfo(acc, current.encoding_count);
    },
    ''
  );
}

function encodeUrlInfo(url: string, encodingCount: number) {
  while (encodingCount > 0) {
    url = encodeURIComponent(url);
    encodingCount--;
  }
  return url;
}