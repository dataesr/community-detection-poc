import { dataToGraphology } from '../../graphology/graph';

function getNodesFromPublicationList(publicationList) {
  return publicationList.flatMap(({ authors, id: publicationId }) => {
    if (!authors) return [];
    return authors.filter((author) => author?.person).reduce((acc, author) => {
      const { person: authorId, fullName: name } = author;
      return [...acc, { id: authorId, attributes: { id: authorId, name, publicationId } }];
    }, []);
  });
}

function getEdgesFromPublicationList(publicationList) {
  return publicationList.flatMap(({ authors }) => {
    if (!authors) return [];
    const knownAuthors = authors.filter((author) => author?.person).map((author) => author.person);
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

  console.log(nodes, edges);

  return dataToGraphology(nodes, edges);
}

export function scanrToPublications(publicationList) {
  const publications = {};

  publicationList.forEach((publication) => {
    if ('id' in publication) {
      const topics = publication?.domains?.filter((domain) => domain.type === 'wikidata')
        .reduce(
          (acc, { code, label }) => ([
            ...acc,
            { code, label: label.default.toLowerCase() },
          ]),
          [],
        );
      const affiliationIds = publication?.affiliations?.filter((affiliation) => affiliation.id && affiliation.label)
        .map((affiliation) => affiliation.id);

      publications[publication.id] = {
        id: publication.id,
        title: publication?.title.default ?? 'undefined',
        type: publication?.type ?? 'undefined',
        year: publication?.year ?? null,
        isOa: publication?.isOa ?? false,
        topics,
        affiliations: affiliationIds,
      };
    }
  });

  return publications;
}

export function scanrToStructures(publicationList) {
  const structures = {};

  publicationList.forEach(({ affiliations = [] }) => {
    if (affiliations) {
      affiliations.forEach(({ id, label, address = [] }) => {
        if (id && !(id in structures) && label) {
          structures[id] = {
            name: label.default.toLowerCase(),
            country: address[0]?.country ?? 'undefined',
            city: address[0]?.city ?? 'undefined',
          };
        }
      });
    }
  });

  return structures;
}
