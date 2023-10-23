import { dataToGraphology } from '../../graphology/graph';

function getNodesFromPublicationList(publicationList) {
  return publicationList.flatMap(({ authorships, id: publicationId }) => {
    if (!authorships) return [];
    return authorships.reduce((acc, { author }) => {
      if (!author?.id) return acc;
      const { id: authorId, display_name: name } = author;
      return [
        ...acc,
        { id: authorId, attributes: { id: authorId, name, publicationId } },
      ];
    }, []);
  });
}

function getEdgesFromPublicationList(publicationList) {
  return publicationList.flatMap(({ authorships }) => {
    if (!authorships) return [];
    const knownAuthors = authorships.filter(({ author }) => author?.id).map(({ author }) => author.id);
    const coAuthorships = knownAuthors.flatMap(
      // Graphology undirected edges must be sorted, to avoid duplicated edges.
      (v, i) => knownAuthors.slice(i + 1).map((w) => (w < v ? { source: w, target: v } : { source: v, target: w })),
    );
    return coAuthorships;
  });
}

export function openAlexToGraphology(publicationList) {
  const nodes = getNodesFromPublicationList(publicationList);
  const edges = getEdgesFromPublicationList(publicationList);

  // Create graph
  return dataToGraphology(nodes, edges);
}

export function openAlexToPublications(publicationList) {
  const publications = {};

  publicationList.forEach((publication) => {
    if ('id' in publication) {
      const topics = publication?.concepts?.reduce(
        (acc, { wikidata, display_name: label }) => ([
          ...acc,
          { code: wikidata.split('/').filter(Boolean).pop(), label: label.toLowerCase() },
        ]),
        [],
      );
      const affiliationIds = publication?.authorships?.flatMap(({ institutions = [] }) => institutions.map(({ id }) => id));

      publications[publication.id] = {
        id: publication.id,
        title: publication?.title ?? 'undefined',
        type: publication?.type ?? 'undefined',
        year: publication?.publication_year ?? null,
        isOa: publication?.open_access.is_oa ?? false,
        topics,
        affiliations: affiliationIds,
      };
    }
  });

  return publications;
}

export function openAlexToStructures(publicationList) {
  const structures = {};

  publicationList.forEach(({ authorships = [] }) => {
    authorships.forEach(({ institutions = [] }) => {
      institutions.forEach(({ id, display_name: name, country_code: country }) => {
        if (!(id in structures)) {
          structures[id] = {
            name: name.toLowerCase(),
            country: country ?? 'undefined',
            city: 'undefined',
          };
        }
      });
    });
  });

  return structures;
}
