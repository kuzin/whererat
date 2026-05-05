/** Attempt a higher-res CDN variant for stretched hero crops (Amazon / IMDb art). */
export function upsizeAmazonPosterUrl(url: string): string {
  if (!url.includes("media-amazon.com")) {
    return url;
  }

  let upgraded = url;
  upgraded = upgraded.replace(/(_UX)(\d+)(?=_(?:CR|SY|QL))/g, `$1${1400}`);
  upgraded = upgraded.replace(/(_UY)(\d+)(?=_(?:CR|SX|QL))/g, `$1${1400}`);
  upgraded = upgraded.replace(/(_SX)(\d{2,4})(?=_|\.)/g, "$11280");
  upgraded = upgraded.replace(/(_SY)(\d{2,4})(?=_|\.)/g, "$1720");

  return upgraded === url ? url : upgraded;
}
