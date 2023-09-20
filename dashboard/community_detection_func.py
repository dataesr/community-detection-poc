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

    match source:
        case "SCANR":
            # SCANR api
            url = os.environ.get("SCANR_API_URL")
            token = os.environ.get("SCANR_API_TOKEN")
        case "OpenAlex":
            url = os.environ.get("OPENALEX_API_URL")
            token = None
        case _:
            url = None
            token = None
            raise ValueError("Incorrect data source")

    return url, token


def scanr_query_by_keywords(keywords):
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


def scanr_query_by_authors(idrefs):
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


def scanr_filter_results(json, max_coauthors=20):
    """Filter results from json request

    Args:
        json: request answer from api
        max_coauthors: works max of coauthors to considere

    Returns:
        dict with authors data
    """


def create_graph(json, max_coauthors=20, min_publications=5):
    """create graph element from json request"""

    # Init arrays
    idref_fullname = {}
    wikidata_topics = {}
    all_edges = {}
    nb_pub_removed = 0
    nb_aut_removed = 0

    # Create graph
    graph = nx.Graph()

    # Filter data
    # 1. Loop over answers
    for hit in json.get("hits").get("hits"):
        elt = hit.get("_source")
        authors = elt.get("authors")

        # 2. Loop over authors and remove publication if too many coauthors
        if len(authors) > max_coauthors:
            print(f"{elt.get('id')}: removing publication ({len(authors)} authors)")
            nb_pub_removed += 1
            continue

        # 3. Define a node for each author if fullname exists
        current_nodes = []
        for aut in elt.get("authors"):
            if "person" in aut:
                idref = aut.get("person").get("id")
                if idref not in idref_fullname:
                    idref_fullname[idref] = aut.get("fullName")
                current_author = idref_fullname.get(idref)
            elif "fullName" in aut:
                current_author = aut.get("fullName")
            else:
                continue
            current_nodes.append(current_author)

        # 4. Update nodes informations
        for node in current_nodes:
            # Add node or increment publication number
            if node not in all_edges:
                all_edges[node] = {"nb_publis": 0, "coauthors": {}, "topics": {}}
            all_edges.get(node)["nb_publis"] += 1
            # Compute number of coauthors
            for node_ in current_nodes:
                if node != node_:
                    if node_ not in all_edges.get(node).get("coauthors"):
                        all_edges.get(node)["coauthors"][node_] = 0
                    all_edges.get(node)["coauthors"][node_] += 1
            # Get wikidata
            if elt.get("domains") is None:
                continue
            for topic in elt.get("domains"):
                if "code" in topic:
                    code = topic.get("code")
                    if code not in wikidata_topics:
                        wikidata_topics[code] = topic.get("label").get("default").lower()
                    label = wikidata_topics.get(code)
                    if label not in all_edges.get(node).get("topics"):
                        all_edges.get(node)["topics"][label] = 0
                    all_edges.get(node)["topics"][label] += 1

        # 5. Add nodes to graph object
        for n, edge in all_edges.items():
            # Filter by number of publications
            if edge.get("nb_publis") < min_publications:
                nb_aut_removed += 1
                continue
            # Add nodes
            graph.add_node(n, size=edge.get("nb_publis"))
            # Add weights (number of co publications)
            for m in edge.get("coauthors"):
                graph.add_edge(n, m, weight=edge.get("coauthors")[m])

    print("\nNumber of publications :", len(json.get("hits").get("hits")))
    print("Number of publications removed (too many coauthors) :", nb_pub_removed)
    print("Number of authors removed (too few publications) :", nb_aut_removed)
    print("\nGraph - number of nodes (authors) :", graph.number_of_nodes())
    print("Graph - number of edges (copublications) :", graph.number_of_edges())

    return graph


def url_last_segment(url: str) -> str:
    """Remove last segment of an url
    example : http://ww.test.com/TEST1
    --> returns TEST1
    """

    if not url:
        return None

    for split in reversed(url.rsplit("/")):
        if split:
            return split

    return None


def alex_url_thematic(url: str, thematic: list[str], cursor: str = "", per_page: int = 100) -> str:
    """This function create the URL string with the theme of the query and the cursor
    to get all the available pages on OpenAlex

    Args:
        thematic: theme(s) you are interested in
        cursor: next page cursor
        per_page: number of results per page

    Returns:
        url string
    """

    if thematic:
        thematic = " AND ".join(thematic)
        url = url + "," if url[-1] != "," else url
        url += f"title.search:{thematic},abstract.search:{thematic}&mailto=bso@recherche.gouv.fr&cursor={cursor}*&per_page={per_page}"

    return url


# def alex_request():
#     # Search url
#     request_url = url_thematic(OPENALEX_API_URL, keywords, cursor=cursor, per_page=per_page)
#     print(request_url)

#     # Request answer
#     json_answer = requests.get(request_url).json()


def alex_filter_results(json: dict, max_coauthors: int = 20) -> dict:
    """Filter results from json request

    Args:
        json: request answer from api
        max_coauthors: works max of coauthors to considere

    Returns:
        dict with authors data
    """

    # Init arrays
    nb_pub_removed = 0
    authors_data = {}
    authors_names = {}
    wikidata_names = {}
    # print("Number of works : " + str(len(json.get("results"))))

    # Filter data
    # 1. Loop over works
    for work in json.get("results"):
        work_id = url_last_segment(work.get("id"))
        authorships = work.get("authorships")

        # 2. Loop over authors and remove publication if too many coauthors
        if len(authorships) > max_coauthors:
            print(f"{work.get('id')}: removing publication ({len(authorships)} authors)")
            nb_pub_removed += 1
            continue

        # 3. Get author information
        for authorship in authorships:
            author = authorship.get("author")
            author_id = url_last_segment(author.get("id"))
            author_orcid = url_last_segment(author.get("orcid"))
            author_name = author.get("display_name")
            authors_names.setdefault(author_id, author_name)

            # Add author
            author_data = {"name": author_name, "orcid": author_orcid}
            authors_data.setdefault(
                author_id, {"work_count": 0, "work_id": [], "coauthors": {}, "wikidata": {}}
            ).update(author_data)
            authors_data.get(author_id)["work_count"] += 1
            authors_data.get(author_id)["work_id"].append(work_id)

            # print(f"{author_name}: number of coauthors = {len(authorships) - 1}")

            # 4. Add coauthors information
            for coauthorship in authorships:
                coauthor = coauthorship.get("author")
                coauthor_id = url_last_segment(coauthor.get("id"))
                coauthor_name = coauthor.get("display_name")
                if coauthor_id != author_id:
                    authors_data.get(author_id).get("coauthors").setdefault(coauthor_id, 0)
                    authors_data.get(author_id).get("coauthors")[coauthor_id] += 1

            # 5. Get wikidata topics information
            for concept in work.get("concepts"):
                wikidata = url_last_segment(concept.get("wikidata"))
                wikidata_names.setdefault(wikidata, concept.get("display_name"))
                authors_data.get(author_id).get("wikidata").setdefault(wikidata, 0)
                authors_data.get(author_id).get("wikidata")[wikidata] += 1

    return authors_data


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
