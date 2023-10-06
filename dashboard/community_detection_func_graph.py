from dotenv import load_dotenv

import json
import networkx as nx
from networkx import Graph

from pyvis.network import Network
from ipysigma import Sigma

import pandas as pd
import numpy as np

import matplotlib
import matplotlib.pyplot as plt
import mpld3

from community_detection_func_scanr import scanr_get_results, scanr_filter_results
from community_detection_func_alex import alex_get_results, alex_filter_results
from community_detection_func_tools import *

from itertools import combinations
from collections import Counter


def api_get_data(source: str, search_type: str, args: list[str], filters: dict) -> dict:
    """Get search results data from api request

    Args:
        source (str): api
        search_type (str): type of search
        args (list[str]): list of arguments
        filters (dict): search filters

    Returns:
        dict: authors data
    """
    match source:
        case "scanR":
            # scanr api search
            results = scanr_get_results(search_type, args, filters)
            authors_data = scanr_filter_results(results, filters.get("max_coauthors"))

        case "OpenAlex":
            # openalex api search
            results = alex_get_results(search_type, args, filters)
            authors_data = alex_filter_results(results, filters.get("max_coauthors"))

        case _:
            raise ValueError("Api name has to be 'scanR' or 'OpenAlex'")

    return authors_data


def graph_create(
    authors_data: dict,
    edge_types: list[str] = [],
    min_works: int = None,
    max_order: int = 150,
) -> Graph:
    """Create a graph object from the authors data

    Args:
        authors_data (dict): authors informations
        min_works (int, optional): minimal number of works - forced filtering
        max_order (int, optional): maximal graph order for - auto filtering

    Returns:
        Graph: graph object
    """

    # Create graph
    graph = nx.MultiGraph()

    # 1. Loop over all authors
    for author in authors_data.values():
        # 2. Add node
        graph.add_node(
            author.get("name"),
            size=author.get("work_count"),
            coauthors=len(author.get("coauthors") or {}),
            work_ids=author.get("work_ids"),
            work_years=author.get("work_years"),
            work_isoa=author.get("work_isoa"),
            topics=author.get("wikidata"),
            types=author.get("types"),
        )

        if "Copublications" in edge_types:
            # 3.1. Add edges between author and coauthors
            for coauthor, cowork_count in author.get("coauthors").items():
                author_name = author.get("name")
                coauthor_name = authors_data.get(coauthor).get("name") if coauthor in authors_data else coauthor
                graph.add_edge(author_name, coauthor_name, weight=cowork_count)

    if "Similar topics" in edge_types:
        # 3.2. Add edges between all authors if same topic
        for source, target in combinations(authors_data.values(), 2):
            similar_topics = set(source.get("wikidata")) & set(target.get("wikidata"))
            if similar_topics:
                source_name = source.get("name")
                target_name = target.get("name")
                graph.add_edge(source_name, target_name, weight=len(similar_topics))

    if "Similar types" in edge_types:
        # 3.3 Add edges between all authors if same topic
        for source, target in combinations(authors_data.values(), 2):
            similar_types = set(source.get("types")) & set(target.get("types"))
            if similar_types:
                source_name = source.get("name")
                target_name = target.get("name")
                graph.add_edge(source_name, target_name, weight=len(similar_types))

    # 4. Filter authors by minimun works
    if min_works:
        # User input
        graph = graph.subgraph([node for node, attrdict in graph.nodes.items() if attrdict.get("size") >= min_works])
        print(f"Miniumun number of works forced : {min_works} (order={graph.order()})")

    else:
        # Auto computed
        auto_min_works = 1

        while graph.order() > max_order:
            auto_min_works += 1

            graph = graph.subgraph(
                [node for node, attrdict in graph.nodes.items() if attrdict.get("size") >= auto_min_works]
            )
            print(f"Minimum number of works auto computed : {auto_min_works} (order={graph.order()})")

    print(f"Graph filtered : {len(graph.nodes) or 0}/{len(authors_data)}")
    print(graph)

    return graph


def graph_find_communities(graph: Graph, detection_algo: str) -> Graph:
    """Find communities of a network

    Args:
        graph (Graph): network graph
        detection_algo (str): community detection algorithm

    Returns:
        dict: nodes groups
    """

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

    # Add communities to graph
    nx.set_node_attributes(graph, node_groups, "group")

    return graph


def graph_find_louvain_communities(graph: Graph) -> dict:
    """Find graph communitites with the louvain algorithm

    Args:
        graph (Graph): network graph

    Returns:
        dict: nodes groups
    """

    # Networkx louvain algo
    communities = nx.community.louvain_communities(graph, seed=42)
    node_groups = {n: c for c in range(len(communities)) for n in communities[c]}

    return node_groups


def graph_find_girvan_newman(graph: Graph) -> dict:
    """Find graph communitites with the girvan-newman algorithm

    Args:
        graph (Graph): network graph

    Returns:
        dict: nodes groups
    """

    # Find best modularity with girvan newman
    communities = list(nx.community.girvan_newman(graph))
    modularities = [nx.community.modularity(graph, communities[k]) for k in range(len(communities))]
    max_modularity = max(modularities)
    max_modularity_idx = modularities.index(max_modularity)

    best_communities = communities[max_modularity_idx]
    node_groups = {n: c for c in range(len(best_communities)) for n in best_communities[c]}

    return node_groups


def graph_find_cpm_communities(graph: Graph) -> dict:
    """Find graph communities with the clique percolation method

    Args:
        graph (Graph): network graph

    Returns:
        dict: nodes groups
    """

    # Networkx k clique algo
    cliques = list(nx.community.k_clique_communities(graph, 3))
    communities = [list(c) for c in cliques]
    node_groups = {n: c for c in range(len(communities)) for n in communities[c]}
    return node_groups


def graph_generate_html(graph: Graph, visualizer: str) -> str:
    """Generate html graph and save it

    Args:
        graph (Graph): network graph
        visualizer (str): graph visualizer

    Returns:
        str: filename of the saved graph
    """

    # Community groups for visualization
    node_groups = {n: items.get("group") for n, items in graph.nodes.items()}

    match visualizer:
        case "Matplotlib":
            # Matplotlib
            graph_html = "dashboard/html/pyplot_graph.html"
            cmap = matplotlib.colormaps["turbo"].resampled(max(node_groups.values() or 0) + 1)
            fig = plt.figure(figsize=(10, 10), layout="tight")
            pos = nx.spring_layout(graph)
            nx.draw_networkx(
                graph,
                pos,
                cmap=cmap,
                nodelist=graph.nodes.keys(),
                node_color=list(node_groups.values()),
            )
            mpld3.save_html(fig, graph_html)

        case "Pyvis":
            # Pyvis library
            graph_html = "dashboard/html/pyvis_graph.html"
            net = Network(height="600px", width="100%")
            net.from_nx(graph)
            net.toggle_physics(True)
            net.write_html(graph_html)

        case "Sigma":
            # Sigma library

            graph_html = "dashboard/html/sigma_graph.html"
            Sigma.write_html(
                graph,
                path=graph_html,
                fullscreen=True,
                start_layout=5,
                # layout_settings={
                #     "adjustSizes": True,
                #     "gravity": 0.05,
                #     "linLogMode": True,
                #     "scalingRatio": 10,
                #     "slowDown": 5.442651256490317,
                #     "strongGravityMode": True,
                # },
                node_label_size=graph.degree,
                node_size=graph.degree,
                node_color=node_groups,
                node_border_color_from="node",
                default_edge_types="curve",
            )

        case _:
            raise ValueError("Incorrect visualizer")

    return graph_html


def graph_generate(
    source: str,
    search_type: str,
    args: list[str],
    filters: dict,
    enable_communities: bool,
    detection_algo: str,
    edge_types: list[str],
    visualizer: str,
) -> str:
    """Generate graph with api search

    Args:
        source (str): api source
        search_type (str): type of search
        args (list[str]): list of arguments
        filters (dict): search filters
        enable_communities (bool): communities detection toggle
        detection_algo (str): communities detection algorithm
        edge_types (list[str]): type of edge
        visualizer (str): visualizer

    Returns:
        str: name of html graph
    """
    authors_data = api_get_data(source, search_type, args, filters)

    # Create graph
    graph = graph_create(authors_data, edge_types, filters.get("min_works"))

    # Check graph
    if not graph:
        return None, None

    # Add communities
    if enable_communities:
        graph = graph_find_communities(graph, detection_algo)

    # Generate html
    graph_html = graph_generate_html(graph, visualizer)

    return graph_html, graph


def graph_export_vos_json(graph: Graph):
    """Save network as json file for vos viewer

    Args:
        graph (Graph): network graph
    """

    items = [
        {
            "id": n,
            "label": n,
            "cluster": v.get("group") + 1,
            "weights": {"Works": v.get("size"), "Coauthors": v.get("coauthors")},
            "scores": {"Coauthors/work ": v.get("coauthors") / v.get("size")},
        }
        for n, v in graph.nodes.items()
    ]
    links = [{"source_id": u, "target_id": v, "strength": w} for u, v, w in graph.edges.data("weight")]

    network = {"network": {"items": items, "links": links}}

    with open("graph_vos.json", "w") as f:
        json.dump(network, f)


def graph_cluster_df(graph: Graph) -> pd.DataFrame:
    YEARS = [2018, 2019, 2020, 2021]

    # Create df from nodes
    nodes = [
        {
            "Community": v.get("group"),
            "Name": n,
            "Works": v.get("size"),
            "WorkIds": v.get("work_ids"),
            "WorkYears": v.get("work_years"),
            "WorkIsOa": v.get("work_isoa"),
            "Coauthors": v.get("coauthors"),
            "Coauthors/work": v.get("coauthors") / v.get("size"),
            "Last publication year": max(v.get("work_years").values()),
            "Topics": v.get("topics"),
            "Types": v.get("types"),
        }
        for n, v in graph.nodes.items()
    ]
    nodes_df = pd.DataFrame(nodes).sort_values("Works", ascending=False)

    # Group by community
    group_df = nodes_df.groupby("Community").agg(
        Works=pd.NamedAgg(column="WorkIds", aggfunc=lambda x: x.explode().nunique()),
        Authors=pd.NamedAgg(column="Name", aggfunc="count"),
        Top_author=pd.NamedAgg(column="Name", aggfunc="first"),
        Top_author_works=pd.NamedAgg(column="Works", aggfunc="first"),
        Last_publication_year=pd.NamedAgg(column="Last publication year", aggfunc=lambda x: str(max(x))),
        Work_years=pd.NamedAgg(
            column="WorkYears",
            aggfunc=lambda x: [count_from_dicts(x, year) for year in YEARS],
        ),
        Top_topic=pd.NamedAgg(column="Topics", aggfunc=lambda x: max_from_dicts(x)),
        Top_type=pd.NamedAgg(column="Types", aggfunc=lambda x: max_from_dicts(x)),
        isOa=pd.NamedAgg(
            column="WorkIsOa", aggfunc=lambda x: int((count_from_dicts(x, True) / (count_from_dicts(x) or 1)) * 100)
        ),
    )

    return group_df.sort_values(by="Works", ascending=False).head(5)


def test(x):
    print("ROW :", x)
