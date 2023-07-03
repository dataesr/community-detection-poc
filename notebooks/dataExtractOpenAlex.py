#!/usr/bin/env python
# coding: utf-8

import requests
import pandas as pd
import math
import networkx as nx
from collections import Counter
from notebooks import mail

BASE_URL = f"https://api.openalex.org/works?filter=publication_year:2018-,"


def url_them(thematic: str) -> str:
    """
    This function create the URL string with the theme of the query and the cursor
    to get all the available pages on OpenAlex
    :param thematic: theme you are interested in
    :return: URL string
    """
    url = BASE_URL
    if thematic:
        url += f"title.search:{thematic},abstract.search:{thematic}&mailto={mail.EMAIL}&cursor="

    return url


def get_nb_page(nb: int, ppage: int) -> int:
    """
    This function gives you the number of pages your query will need for a given number of results per page
    :param nb: number of results on OpenAlex
    :param ppage: number of results per page (max 200)
    :return:
    """
    n_page = math.ceil(nb / ppage)

    return n_page


def create_edgelist(dt: pd.DataFrame, mn_pb: int):
    """
    This function creates a edgelist from the result of the query on a theme on OpenAlex
    :param dt: dataframe with every author for every publication regarding a theme
    :param mn_pb: minimum publication per author to get included in the results
    :return:
    """
    # count the number of authors per publication
    pub_compte = dt[["id_pub", "id"]].groupby("id_pub").nunique().reset_index().rename(columns={"id": "compte_auth"})
    # count the number of publications per author
    aut_compte = dt[["id_pub", "id"]].groupby("id").nunique().reset_index().rename(columns={"id_pub": "compte_pub"})
    # keep only the publication ID with 20 or few authors
    pub_compte2 = pub_compte.loc[pub_compte["compte_auth"] <= 20].reset_index().drop(columns="index")
    # keeps only the author ID with a minimum - mn_pb - of publications
    aut_compte2 = aut_compte.loc[aut_compte["compte_pub"] > mn_pb].reset_index().drop(columns="index")

    # filter on the publication and author ID we are interested in
    dt2 = dt.loc[(dt["id_pub"].isin(pub_compte2["id_pub"])) & (dt["id"].isin(aut_compte2["id"]))]

    # instantiate dictionary with source and target that will turn into edgelist
    co = {"source": [], "target": []}
    # instantiate list with single pairs source-target
    co_liste = []
    # instantiate list with every pairs source target (will use it for weight)
    co_liste2 = []

    for auth in set(dt2["id"]):
        # get all the publication ID for a author ID
        pub = list(dt2.loc[dt2["id"] == auth, "id_pub"])
        # get all the author ID for a list of publication ID
        coa = list(dt2.loc[dt2["id_pub"].isin(pub), "id"])
        for item in coa:
            # get all the pairs coauthors, remove initial ID, order the list so we can check pair a-b = pair b-a
            # keep all the pairs for the weights (to get how ofter coauthors work together)
            # get unique pairs for edgelist
            if item != auth:
                liste_coauth = [auth, item]
                liste_coauth.sort()
                co_liste2.append(", ".join(liste_coauth))
                if not liste_coauth in co_liste:
                    co_liste.append(liste_coauth)
                    co["source"].append(liste_coauth[0])
                    co["target"].append(liste_coauth[1])

    # calculate weights by counting how many times people are coauthoring
    co_liste2.sort()

    we = Counter(co_liste2)

    wed = pd.DataFrame(data={"coauthors": list(dict(we).keys()), "weight": list(dict(we).values())})
    # divide by 2 because we have pair a-b twice each time
    wed["weight"] = wed["weight"] / 2
    wed["weight"] = wed["weight"].astype(int)

    # create dataframe from dictionary source-target
    cauth = pd.DataFrame(data=co)
    cauth = cauth.drop_duplicates()

    # add columns with display_name and orcid
    # used ID to make sure people with similar but different ID did not get confused
    # edgelist with display name as source and target because more meaningful
    dt_auth = dt2[['id', 'display_name', 'orcid']].drop_duplicates()
    dt_auth = dt_auth.rename(columns={"id": "source"})

    cauth2 = pd.merge(cauth, dt_auth, on="source", how="left")
    cauth2 = cauth2.fillna("")
    cauth2 = cauth2.rename(columns={"source": "id_oa_source", "display_name": "source", "orcid": "orcid_source"})
    dt_auth2 = dt_auth.rename(columns={"source": "target"})
    cauth2 = pd.merge(cauth2, dt_auth2, on="target", how="left")
    cauth2 = cauth2.fillna("")
    cauth2 = cauth2.rename(columns={"target": "id_oa_target", "display_name": "target", "orcid": "orcid_target"})
    cauth2["coauthors"] = cauth2["id_oa_source"] + ", " + cauth2["id_oa_target"]
    cauth2 = pd.merge(cauth2, wed, on="coauthors", how="left")
    cauth2 = cauth2.drop(columns="coauthors")

    # create graph
    G = nx.Graph()

    G = nx.from_pandas_edgelist(cauth2, 'source', 'target', edge_attr=['id_oa_source', 'id_oa_target', 'orcid_source',
                                                                       'orcid_target', "weight"])

    # get the number of nodes of the graph
    nb_nodes = G.number_of_nodes()

    return G, nb_nodes

thematic = "athlete"
URL_THEME = url_them(thematic)
# first query where we get the number of results, number page and next_cursor for result pagination
res = requests.get(URL_THEME + "*&per_page=200").json()
cur = res["meta"]["next_cursor"]
cnt = res["meta"]["count"]
print(f"Le nombre de résultats est de {cnt}.")
nb_page = get_nb_page(cnt, 200)
print(f"Le nombre de pages est de {nb_page}.")

# instantiate list that will get all the author x publication info
authors = []
for i in range(len(res['results'])):
    for l in range(len(res["results"][i]["authorships"])):
        keys = res["results"][i]["authorships"][l].keys()
        dic = res["results"][i]["authorships"][l]["author"]
        dic["doi"] = res["results"][i]["doi"]
        dic["title"] = res["results"][i]["title"]
        dic["id_pub"] = res["results"][i]["id"]
        for key in keys:
            if key not in ["author", "institutions", "raw_affiliation_strings"]:
                dic[key] = res["results"][i]["authorships"][l][key]
        keys_ins = []
        if len(res["results"][i]["authorships"][l]["institutions"]) > 0:
            for li in range(len(res["results"][i]["authorships"][l]["institutions"])):
                for key in res["results"][i]["authorships"][l]["institutions"][li].keys():
                    key2 = key + "_ins"
                    keys_ins.append(key2)
                    dic[key2] = res["results"][i]["authorships"][l]["institutions"][li][key]
        for item in ["author", "institutions", "raw_affiliation_strings"]:
            if item in dic.keys():
                del dic[item]
        authors.append(dic)

for page in range(2, nb_page + 1):
    print(f"Page {page}.")
    res = requests.get(URL_THEME + cur+ "&per_page=200").json()
    cur = res["meta"]["next_cursor"]
    for i in range(len(res['results'])):
        for l in range(len(res["results"][i]["authorships"])):
            keys = res["results"][i]["authorships"][l].keys()
            dic = res["results"][i]["authorships"][l]["author"]
            dic["doi"] = res["results"][i]["doi"]
            dic["title"] = res["results"][i]["title"]
            dic["id_pub"] = res["results"][i]["id"]
            for key in keys:
                if key not in ["author", "institutions", "raw_affiliation_strings"]:
                    dic[key] = res["results"][i]["authorships"][l][key]
            keys_ins = []
            if len(res["results"][i]["authorships"][l]["institutions"]) > 0:
                for li in range(len(res["results"][i]["authorships"][l]["institutions"])):
                    for key in res["results"][i]["authorships"][l]["institutions"][li].keys():
                        key2 = key + "_ins"
                        keys_ins.append(key2)
                        dic[key2] = res["results"][i]["authorships"][l]["institutions"][li][key]
            for item in ["author", "institutions", "raw_affiliation_strings"]:
                if item in dic.keys():
                    del dic[item]
            authors.append(dic)

# turn author x publication info into dataframe
data = pd.DataFrame(data=authors)

# keep only publications with at least an institution an author is registered with is located in France
# instantiate list with publication ID with a relation to France
liste_pub = []
for pub in set(data["id_pub"]):
    l_pays = list(data.loc[data["id_pub"]==pub, "country_code_ins"])
    if "FR" in l_pays:
        liste_pub.append(pub)

data2 = data.loc[data["id_pub"].isin(liste_pub)]

# iterative process to get the minimum publication number we need to get a maximum number of nodes
min_publication = 1
graph_net, n_nodes = create_edgelist(data2, min_publication)

while n_nodes > 100:
    min_publication += 1
    graph_net, n_nodes = create_edgelist(data2, min_publication)

# write graph in graphml format
nx.write_graphml_lxml(graph_net, 'athleteOA.graphml')