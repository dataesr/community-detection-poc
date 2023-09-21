import os
import requests

from dotenv import load_dotenv

import networkx as nx
from netgraph import Graph, InteractiveGraph
from pyvis.network import Network

import matplotlib
import matplotlib.pyplot as plt
import mpld3

from community_detection_func_scanr import scanr_get_results, scanr_filter_results
from community_detection_func_alex import alex_get_results, alex_filter_results


def api_get_data(source: str, search_type: str, args: list[str], max_coauthors: int) -> tuple[dict, dict]:
    """Get search results data from api

    Returns:
        tuple[dict, dict]: authors data and authors names
    """
    match source:
        case "scanR":
            # scanr api search
            results = scanr_get_results(search_type, args)
            authors_data = scanr_filter_results(results, max_coauthors)

        case "OpenAlex":
            # openalex api search
            results = alex_get_results(search_type, args)
            authors_data = alex_filter_results(results, max_coauthors)

        case _:
            raise ValueError("Api name has to be 'scanR' or 'OpenAlex'")

    return authors_data


def graph_create(authors_data: dict, min_works: int = None, max_order: int = 100) -> Graph:
    """Create a graph object from the authors data

    Args:
        authors_data (dict): authors informations
        min_works (int, optional): minimal number of works - forced filtering
        max_order (int, optional): maximal graph order for - auto filtering

    Returns:
        Graph: graph object
    """
    # Create graph
    graph = nx.Graph()

    # 1. Loop over all authors
    for author in authors_data.values():
        # 2. Add node
        graph.add_node(author.get("name"), size=author.get("work_count"))

        # 3. Add edges between author and coauthors
        for coauthor, cowork_count in author.get("coauthors").items():
            author_name = author.get("name")
            coauthor_name = authors_data.get(coauthor).get("name") if coauthor in authors_data else coauthor
            graph.add_edge(author_name, coauthor_name, weight=cowork_count)

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

    if not graph.nodes:
        raise ValueError("Graph is empty, please select a proper minimal number of works!")

    return graph


def graph_find_communities(graph: Graph, detection_algo: str) -> dict:
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

    return node_groups


def graph_find_louvain_communities(graph: Graph) -> dict:
    """Find graph communitites with the louvain algorithm

    Args:
        graph (Graph): network graph

    Returns:
        dict: nodes groups
    """
    print(graph)

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


def graph_generate_html(graph: Graph, node_groups: dict, visualizer: str) -> str:
    """Generate html graph and save it

    Args:
        graph (Graph): network graph
        node_groups (dict): nodes groups
        visualizer (str): graph visualizer

    Returns:
        str: filename of the saved graph
    """

    match visualizer:
        case "Matplotlib":
            # Matplotlib
            graph_html = "pyplot_graph.html"
            cmap = matplotlib.colormaps["turbo"].resampled(max(node_groups.values() or 0) + 1)
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
    source: str,
    search_type: str,
    args: list[str],
    max_coauthors: int,
    min_works: int,
    enable_communities: bool,
    detection_algo: str,
    visualizer: str,
) -> str:
    """Generate graph with api search

    Args:
        source (str): api source
        search_type (str): type of search
        args (list[str]): list of arguments
        max_coauthors (int): max number of coauthors
        min_works (int): min number of publications
        enable_communities (bool): communities detection toggle
        detection_algo (str): communities detection algorithm
        visualizer (str): visualizer

    Returns:
        str: name of html graph
    """
    authors_data = api_get_data(source, search_type, args, max_coauthors)

    # Create graph
    graph = graph_create(authors_data, min_works)

    # Add communities
    node_groups = None
    if enable_communities:
        node_groups = graph_find_communities(graph, detection_algo)

    # Generate html
    graph_html = graph_generate_html(graph, node_groups, visualizer)

    return graph_html, authors_data
