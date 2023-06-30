import requests
import pandas as pd
import math
import networkx as nx
from collections import Counter
from notebooks import mail

BASE_URL = f"https://api.openalex.org/works?filter=publication_year:2018-,"


def url_them(thematic):
    url = BASE_URL
    if thematic:
        url += f"title.search:{thematic},abstract.search:{thematic}&mailto={mail.EMAIL}&cursor="

    return url


def get_nb_page(nb, ppage):
    n_page = math.ceil(nb / ppage)

    return n_page


def create_edgelist(dt, mx_pb):
    pub_compte = dt[["id_pub", "id"]].groupby("id_pub").nunique().reset_index().rename(columns={"id": "compte_auth"})
    aut_compte = dt[["id_pub", "id"]].groupby("id").nunique().reset_index().rename(columns={"id_pub": "compte_pub"})
    pub_compte2 = pub_compte.loc[pub_compte["compte_auth"] <= 20].reset_index().drop(columns="index")
    aut_compte2 = aut_compte.loc[aut_compte["compte_pub"] > mx_pb].reset_index().drop(columns="index")

    dt2 = dt.loc[(dt["id_pub"].isin(pub_compte2["id_pub"])) & (dt["id"].isin(aut_compte2["id"]))]

    compte = dt2[["id", "id_pub"]].groupby("id_pub").nunique().reset_index().rename(columns={"id": "compte"})
    # compte = compte.loc[compte["compte"] > 1]

    dt3 = dt2.loc[dt2["id_pub"].isin(compte["id_pub"])]

    co = {"source": [], "target": []}
    co_liste = []
    co_liste2 = []

    for auth in set(dt3["id"]):
        pub = list(dt3.loc[dt3["id"] == auth, "id_pub"])
        coa = list(dt3.loc[dt3["id_pub"].isin(pub), "id"])
        for item in coa:
            if item != auth:
                liste = [auth, item]
                liste.sort()
                co_liste2.append(", ".join(liste))
                if not liste in co_liste:
                    co_liste.append(liste)
                    co["source"].append(liste[0])
                    co["target"].append(liste[1])

    co_liste2.sort()

    we = Counter(co_liste2)

    wed = pd.DataFrame(data={"coauthors": list(dict(we).keys()), "weight": list(dict(we).values())})
    wed["weight"] = wed["weight"] / 2
    wed["weight"] = wed["weight"].astype(int)

    cauth = pd.DataFrame(data=co)
    cauth = cauth.drop_duplicates()

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

    G = nx.Graph()

    G = nx.from_pandas_edgelist(cauth2, 'source', 'target', edge_attr=['id_oa_source', 'id_oa_target', 'orcid_source',
                                                                       'orcid_target', "weight"])

    nb_nodes = G.number_of_nodes()

    return G, nb_nodes

thematic = "athlete"
URL_THEME = url_them(thematic)
res = requests.get(URL_THEME + "*&per_page=200").json()
cur = res["meta"]["next_cursor"]
cnt = res["meta"]["count"]
print(f"Le nombre de résultats est de {cnt}.")
nb_page = get_nb_page(cnt, 200)
print(f"Le nombre de pages est de {nb_page}.")

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
data = pd.DataFrame(data=authors)

liste_pub = []
for pub in set(data["id_pub"]):
    l_pays = list(data.loc[data["id_pub"]==pub, "country_code_ins"])
    if "FR" in l_pays:
        liste_pub.append(pub)

data2 = data.loc[data["id_pub"].isin(liste_pub)]

min_publication = 1
graph_net, n_nodes = create_edgelist(data2, min_publication)

while n_nodes > 100:
    min_publication += 1
    graph_net, n_nodes = create_edgelist(data2, min_publication)

nx.write_graphml_lxml(graph_net, 'athleteOA.graphml')