import os
import requests

from dotenv import load_dotenv

import networkx as nx
from netgraph import Graph, InteractiveGraph
from pyvis.network import Network

import matplotlib
import matplotlib.pyplot as plt
import mpld3

import itertools


def data_source_credentials(source):
    """get data source url and token"""

    # Load server environment
    load_dotenv(os.path.dirname(os.path.dirname(__file__)) + "/server/.env")

    # Elastic search info
    url = os.environ.get("SCANR_API_URL")
    token = os.environ.get("SCANR_API_TOKEN")

    return url, token


def query_by_keywords(keywords):
    """create json query for search by keywords"""

    # Make sure keywords is a list
    if not isinstance(keywords, list):
        keywords = [keywords]

    # Create query block
    must_block = []
    for q in keywords:
        must_block.append(
            {
                "query_string": {
                    "fields": [
                        "title.default",
                        "title.fr",
                        "title.en",
                        "keywords.en",
                        "keywords.fr",
                        "keywords.default",
                        "domains.label.default",
                        "domains.label.fr",
                        "domains.label.en",
                        "summary.default",
                        "summary.fr",
                        "summary.en",
                        "alternativeSummary.default",
                        "alternativeSummary.fr",
                        "alternativeSummary.en",
                    ],
                    "query": f'"{q}"',
                }
            }
        )

    # Query json
    json_query = {
        "size": 10000,
        "query": {
            "bool": {
                "filter": [
                    {"terms": {"authors.role.keyword": ["author", "directeurthese"]}},
                    {"terms": {"year": [2018, 2019, 2020, 2021, 2022, 2023]}},
                ],
                "must": must_block,
            }
        },
        "aggs": {"idref": {"terms": {"field": "authors.person.id.keyword", "size": 10}}},
    }

    return json_query


def query_by_authors(idrefs):
    """create json query for search by authors"""

    # Make sure idrefs is a list
    if not isinstance(idrefs, list):
        idrefs = [idrefs]

    idrefs = ["idref" + str(id) for id in idrefs]

    # Query json
    json_query = {
        "size": 10000,
        "query": {
            "bool": {
                "filter": [
                    {"terms": {"authors.role.keyword": ["author", "directeurthese"]}},
                    {"terms": {"authors.person.id.keyword": idrefs}},
                ]
            }
        },
    }

    return json_query


def create_graph(json, max_coauthors=20, min_publications=5):
    """create graph element from json request"""

    # Init arrays
    fullNameIdref = {}
    topicWikidata = {}
    all_edges = {}
    nb_pub_removed = 0
    nb_aut_removed = 0

    # Create graph
    graph = nx.Graph()

    # Filter data
    # 1. Loop over answers
    for hit in json["hits"]["hits"]:
        elt = hit["_source"]
        authors = elt.get("authors")

        # 2. Loop over authors and remove publication if too many coauthors
        if len(authors) > max_coauthors:
            print("{}: removing publication ({} authors)".format(hit["_source"]["id"], len(authors)))
            nb_pub_removed += 1
            continue

        # 3. Define a node for each author if fullname exists
        currentNodes = []
        for aut in elt.get("authors"):
            if "person" in aut:
                idref = aut["person"]["id"]
                if idref not in fullNameIdref:
                    fullNameIdref[idref] = aut["fullName"]
                currentNode = fullNameIdref[idref]
            elif "fullName" in aut:
                currentNode = aut["fullName"]
            else:
                continue
            currentNodes.append(currentNode)

        # 4. Update nodes informations
        for node in currentNodes:
            # Add node or increment publication number
            if node not in all_edges:
                all_edges[node] = {"nb_publis": 0, "coauthors": {}, "topics": {}}
            all_edges[node]["nb_publis"] += 1
            # Compute number of coauthors
            for node_ in currentNodes:
                if node != node_:
                    if node_ not in all_edges[node]["coauthors"]:
                        all_edges[node]["coauthors"][node_] = 0
                    all_edges[node]["coauthors"][node_] += 1
            # Get wikidata
            if elt.get("domains") is None:
                continue
            for topic in elt.get("domains"):
                if "code" in topic:
                    code = topic.get("code")
                    if code not in topicWikidata:
                        topicWikidata[code] = topic.get("label").get("default").lower()
                    label = topicWikidata[code]
                    if label not in all_edges[node]["topics"]:
                        all_edges[node]["topics"][label] = 0
                    all_edges[node]["topics"][label] += 1

        # 5. Add nodes to graph object
        for n in all_edges:
            # Filter by number of publications
            if all_edges[n]["nb_publis"] < min_publications:
                nb_aut_removed += 1
                continue
            # Add nodes
            graph.add_node(n, size=all_edges[n]["nb_publis"])
            # Add weights (number of co publications)
            for m in all_edges[n]["coauthors"]:
                graph.add_edge(n, m, weight=all_edges[n]["coauthors"][m])

    print("\nNumber of publications :", len(json["hits"]["hits"]))
    print("Number of publications removed (too many coauthors) :", nb_pub_removed)
    print("Number of authors removed (too few publications) :", nb_aut_removed)
    print("\nGraph - number of nodes (authors) :", graph.number_of_nodes())
    print("Graph - number of edges (copublications) :", graph.number_of_edges())

    return graph


def graph_find_communities(graph, detection_algo):
    """find graph communities"""

    match detection_algo:
        case "Louvain":
            # Louvain algorithm
            node_groups = graph_find_louvain_communities(graph)
        case "Girvan-Newman":
            # Girvan-Newman algorithm
            node_groups = graph_find_girvan_newman(graph)
        case "CPM":
            # Clique Percolation Method
            node_groups = graph_find_cpm_communities(graph)
        case _:
            raise ValueError("Incorrect detection algorithm")

    return node_groups


def graph_find_louvain_communities(graph):
    """find graph communitites with the louvain algorithm"""

    # Networkx louvain algo
    communities = nx.community.louvain_communities(graph, seed=42)
    node_groups = {n: c for c in range(len(communities)) for n in communities[c]}

    return node_groups


def graph_find_girvan_newman(graph):
    """find graph communitites with the girvan-newman algorithm"""

    # Find best modularity with girvan newman
    communities = list(nx.community.girvan_newman(graph))
    modularities = [nx.community.modularity(graph, communities[k]) for k in range(len(communities))]
    max_modularity = max(modularities)
    max_modularity_idx = modularities.index(max_modularity)

    best_communities = communities[max_modularity_idx]
    node_groups = {n: c for c in range(len(best_communities)) for n in best_communities[c]}

    return node_groups


def graph_find_cpm_communities(graph):
    """find graph communities with the clique percolation method"""

    # Networkx k clique algo
    cliques = list(nx.community.k_clique_communities(graph, 3))
    communities = [list(c) for c in cliques]
    node_groups = {n: c for c in range(len(communities)) for n in communities[c]}
    return node_groups


def graph_generate_html(graph, node_groups, visualizer):
    """generate graph html file"""

    match visualizer:
        case "Matplotlib":
            # Matplotlib
            graph_html = "pyplot_graph.html"
            cmap = matplotlib.colormaps["turbo"].resampled(max(node_groups.values()) + 1)
            fig = plt.figure(figsize=(10, 10), layout="tight")
            pos = nx.spring_layout(graph)
            nx.draw_networkx(graph, pos, cmap=cmap, nodelist=node_groups.keys(), node_color=list(node_groups.values()))
            mpld3.save_html(fig, graph_html)

        case "Pyvis":
            # Pyvis library
            graph_html = "pyvis_graph.html"
            net = Network()
            nx.set_node_attributes(graph, node_groups, "group")
            net.from_nx(graph)
            net.toggle_physics(False)
            net.show_buttons(filter_=["physics"])
            net.write_html(graph_html)

        case _:
            raise ValueError("Incorrect visualizer")

    return graph_html


def graph_generate(
    source, search_type, queries, max_coauthors, min_publications, enable_communities, detection_algo, visualizer
):
    """generate graph from request"""

    # Get api url and token
    url, token = data_source_credentials(source)

    # Create query
    json_query = query_by_keywords(queries) if (search_type == 0) else query_by_authors(queries)

    # Request answer
    json_answer = requests.post(url, json=json_query, headers={"Authorization": token}, timeout=5).json()

    # Create graph
    graph = create_graph(json_answer, max_coauthors, min_publications)

    # Add communities
    node_groups = None
    if enable_communities:
        node_groups = graph_find_communities(graph, detection_algo)

    # Generate html
    graph_html = graph_generate_html(graph, node_groups, visualizer)

    return graph_html, json_query, json_answer
