import { GetColorName } from 'hex-color-to-color-name';
import { objectMerge, objEntriesToString } from './utils';
import { getPalette } from '../styles/colors';

// Get node with max attribute value
const communityGetNodeMaxAttribute = (community, attribute) => community.reduce((acc, node) => (acc.attributes[attribute] > node.attributes[attribute] ? acc : node));

// Get all domains
const communityGetDomains = (community) => community.reduce((acc, node) => ((node.attributes?.domains) ? objectMerge(acc, node.attributes.domains) : acc), {});

export function fillMainCommunities(communities, { communitiesLimit = 0, domainsLimit = 0 }) {
  const filledCommunities = {};

  // Get colors
  const palette = getPalette(Object.keys(communities).length);

  // Get main communities
  let sortedCommunities = Object.entries(communities).sort((a, b) => b[1].length - a[1].length);
  if (communitiesLimit > 0) sortedCommunities = sortedCommunities.slice(0, communitiesLimit);

  // Fill communities
  sortedCommunities.forEach(([key, values]) => {
    filledCommunities[key] = {
      // Community: key,
      Name: GetColorName(palette[key]),
      Size: values.length,
      'Latest activity': communityGetNodeMaxAttribute(values, 'maxYear').attributes.maxYear,
      'Top element': communityGetNodeMaxAttribute(values, 'weight').attributes.name,
      Domains: objEntriesToString(communityGetDomains(values), domainsLimit),
    };
  });

  return filledCommunities;
}
