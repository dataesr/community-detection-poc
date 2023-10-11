import { dataToGraphology } from "../../graphology/graph";

function getNodesFromPublicationList(publicationList) {
  return publicationList.flatMap(({ authors, id: publicationId }) => {
    if (!authors) return [];
    return authors.reduce((acc, { person }) => {
      if (!person?.id) return acc;
      const { id: authorId, fullName: name } = person;
      return [...acc, { id: authorId, attributes: { id: authorId, name: name, publicationId: publicationId } }];
    }, []);
  });
}

function getEdgesFromPublicationList(publicationList) {
  return publicationList.flatMap(({ authors }) => {
    if (!authors) return [];
    const knownAuthors = authors.filter(({ person }) => person?.id).map(({ person }) => person.id);
    const coAuthorships = knownAuthors.flatMap(
      // Graphology undirected edges must be sorted, to avoid duplicated edges.
      (v, i) => knownAuthors.slice(i + 1).map((w) => (w < v ? { source: w, target: v } : { source: v, target: w }))
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
  return publicationList.flatMap(({ id, title, type, year, isOa, domains = [], affiliations = [] }) => {
    if (!id) return [];
    const topics = domains
      .filter((domain) => domain.type === "wikidata")
      .reduce(
        (acc, { code, label }) => ({
          ...acc,
          [code]: { label: label.default.toLowerCase() },
        }),
        {}
      );
    const affiliationIds = affiliations.reduce((acc, { id }) => ({ ...acc, id }), []);

    return {
      id: id,
      attributes: {
        title: title.default,
        type: type,
        year: year,
        isOa: isOa,
        topics: topics,
        affiliations: affiliationIds,
      },
    };
  });
}

export function scanrToStructures(publicationList) {
  return publicationList.flatMap(({ affiliations = [] }) => {
    if (!affiliations) return {};
    return affiliations.reduce(
      (acc, { id, label, address = [] }) => ({
        ...acc,
        id: id,
        attributes: { name: label.default.toLowerCase(), country: address[0]?.country, city: address[0]?.city },
      }),
      {}
    );
  });
}
