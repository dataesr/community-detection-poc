import os
import sys
import requests

import mercury
from dotenv import load_dotenv

import networkx as nx
from netgraph import Graph, InteractiveGraph
from ipysigma import Sigma

import pandas as pd
from pandas import json_normalize

import matplotlib
import matplotlib.pyplot as plt

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


def generate_graph(source, type, queries):
    """generate graph from request"""

    # Get api url and token
    url, token = data_source_credentials(source)

    # Create query
    json_query = query_by_keywords(queries) if (type == 0) else query_by_authors(queries)

    # Request answer
    json_answer = requests.post(url, json=json_query, headers={"Authorization": token}, timeout=5).json()

    # Create graph
    graph = create_graph(json_answer)

    return graph, json_query, json_answer
