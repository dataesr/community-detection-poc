import requests
import pandas as pd
import math
import networkx as nx

BASE_URL = "https://api.openalex.org/works?filter=publication_year:2023-"


def url_them(thematic):
    url = BASE_URL
    if thematic:
        url += f"&search={thematic}&cursor="

    return url


def get_nb_page(nb, ppage):
    n_page = math.ceil(nb / ppage)

    return n_page

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

co = {"source": [], "target": []}
co_liste = []
data["id_doi"] = data["title"] + data["doi"].astype(str)
for auth in set(data["id"]):
    pub = list(data.loc[data["id"]==auth, "id_doi"])
    coa = list(data.loc[data["id_doi"].isin(pub), "id"])
    for item in coa:
        if item != auth:
            liste = [auth, item]
            liste.sort()
            if not liste in co_liste:
                co_liste.append(liste)
                co["source"].append(liste[0])
                co["target"].append(liste[1])

coauth = pd.DataFrame(data=co)
coauth = coauth.drop_duplicates()

G = nx.Graph()

G = nx.from_pandas_edgelist(coauth, 'source', 'target')

nx.write_graphml_lxml(G, './notebooks/atheleteOA.graphml')