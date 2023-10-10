export const getThematicFromCluster = (cluster) => {
    const clusterTopics = {};
    cluster.forEach((node) => {
        Object.keys(node?.topics || []).forEach((topic) => {
            if (!(Object.keys(clusterTopics).includes(topic))) {
                clusterTopics[topic] = { code: topic, label: node.topics[topic].label, publicationIds: [] };
            }
            clusterTopics[topic].publicationIds.push([node.topics[topic].publicationId]);
        });
    });
    return Object.values(clusterTopics).map((clusterTopic) => {
        // eslint-disable-next-line no-param-reassign
        clusterTopic.publicationIds = [...new Set(clusterTopic.publicationIds)];
        return clusterTopic;
    }).sort((a, b) => b.publicationIds.length - a.publicationIds.length).slice(0, 5);
};

export const dataEncodeToJson = (data) => {

    const items = []
    const links = []

    // Add nodes
    data.nodes.forEach((node) => {
        items.push({
            "id": node?.key,
            "label": node?.attributes?.label,
            "cluster": node?.attributes?.community + 1,
            "weights": { "Works": node?.attributes?.weight, "Topics": node?.attributes?.topics.length },
            "scores": { "Topics/work ": node?.attributes?.topics.length / (node?.attributes?.weight || 1) },
        });
    });

    // Add edges
    data.edges.forEach((edge) => {
        links.push({ "source_id": edge?.source, "target_id": edge?.target, "strength": edge?.attributes?.weight });
    });

    const network = { "network": { "items": items, "links": links } };
    const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(JSON.stringify(network))}`

    return jsonString
};