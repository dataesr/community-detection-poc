import { dataToGraphology } from '../../graphology/graph';

function getNodesFromPublicationList(publicationList) {
  return publicationList.flatMap(({ authors, id: publicationId }) => {
    if (!authors) return [];
    return authors.reduce((acc, { person }) => {
      if (!person?.id) return acc;
      const { id: authorId, fullName: name } = person;
      return [...acc, { id: authorId, attributes: { id: authorId, name, publicationId } }];
    }, []);
  });
}

function getEdgesFromPublicationList(publicationList) {
  return publicationList.flatMap(({ authors }) => {
    if (!authors) return [];
    const knownAuthors = authors.filter(({ person }) => person?.id).map(({ person }) => person.id);
    const coAuthorships = knownAuthors.flatMap(
      // Graphology undirected edges must be sorted, to avoid duplicated edges.
      (v, i) => knownAuthors.slice(i + 1).map((w) => (w < v ? { source: w, target: v } : { source: v, target: w })),
    );
    return coAuthorships;
  });
}

export function scanrToGraphology(publicationList) {
  const nodes = getNodesFromPublicationList(publicationList);
  const edges = getEdgesFromPublicationList(publicationList);

  return dataToGraphology(nodes, edges);
}

export function scanrToPublications(publicationList) {
  const publications = {};

  console.log('publicationList', publicationList);

  publicationList.forEach((publication) => {
    console.log('publication', publication);
    if (!('id' in publication)) return {};
    const topics = publication?.domains
      .filter((domain) => domain.type === 'wikidata')
      .reduce(
        (acc, { code, label }) => ([
          ...acc,
          { code, label: label.default.toLowerCase() },
        ]),
        [],
      );
    const affiliationIds = publication?.affiliations.reduce((acc, { id: affiliationId }) => ({ ...acc, affiliationId }), []);

    publications[publication.id] = {
      id: publication.id,
      title: publication?.title.default,
      type: publication?.type,
      year: publication?.year,
      isOa: publication?.isOa,
      topics,
      affiliations: affiliationIds,
    };
  });

  console.log('scanr publications', publications);

  return publications;
}

export function scanrToStructures(publicationList) {
  return publicationList.flatMap(({ affiliations = [] }) => {
    if (!affiliations) return {};
    return affiliations.reduce(
      (acc, { id, label, address = [] }) => ({
        ...acc,
        id,
        attributes: { name: label.default.toLowerCase(), country: address[0]?.country, city: address[0]?.city },
      }),
      {},
    );
  });
}
