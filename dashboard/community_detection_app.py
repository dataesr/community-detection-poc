import streamlit as st
from streamlit.components.v1 import html
from annotated_text import annotated_text
from community_detection_func_graph import graph_generate
from community_detection_func_tools import *

st.title("Community detection application")

# Choose data source
data_sources = ["scanR", "OpenAlex"]
data_source = st.selectbox("Data source", data_sources, 0)

# Choose search by
search_types = ["Co-authoring by keywords", "Co-authoring by authors ids", "Co-authoring by structures ids"]
search_by = st.selectbox("Search by", search_types, 0)

# Choose query
match search_types.index(search_by):
    case 0:
        # Keywords
        queries = st.text_input("Keywords")
        valid_queries = [query.strip() for query in queries.split(",") if query]
        print(valid_queries)
        annotated_text([(keyword, "", tag_get_color("keyword")) for keyword in valid_queries])

    case 1:
        # Authors ids
        queries = st.text_input("Authors ids")
        queries = [query.strip() for query in queries.split(",") if query]
        print(queries)

        if data_source == "scanR":
            valid_queries = [id for id in queries if id_get_type(id) == "idref"]

        if data_source == "OpenAlex":
            queries = [idref_find_orcid(idref_get(id)) or id for id in queries if id]
            valid_queries = [id for id in queries if id_get_type(id) == "orcid"]

        annotated_text(
            [
                (
                    id,
                    id_get_type(id),
                    tag_get_color(id_get_type(id)) if id in valid_queries else tag_get_color("bad_id"),
                )
                for id in queries
            ]
        )

    case 2:
        # Structures ids
        queries = st.text_input("Structures ids")
        valid_queries = [query.strip() for query in queries.split(",") if query]
        annotated_text([(structure, "", tag_get_color("keyword")) for structure in valid_queries])

    case _:
        raise ValueError("Incorrect search type")

# Settings
with st.sidebar:
    setting_max_coauthors = st.slider("Max coauthors", 0, 100, 20)
    setting_min_publications = st.slider("Min publications", 0, 10, 0) or None
    setting_enable_communities = st.toggle("Enable communities", True)
    setting_detection_algo = st.selectbox("Detection algorithm", ("Louvain", "Girvan-Newman", "CPM"))
    setting_visualizer = st.selectbox("Graph visualizer", ("Matplotlib", "Pyvis"))

# Generate graph
if st.button("Generate graph", disabled=not bool(valid_queries), type="primary"):
    graph_html, authors_data = graph_generate(
        data_source,
        search_types.index(search_by),
        valid_queries,
        setting_max_coauthors,
        setting_min_publications,
        setting_enable_communities,
        setting_detection_algo,
        setting_visualizer,
    )

    if graph_html and authors_data:
        with st.expander("See authors data"):
            st.json(authors_data, expanded=True)

        # Display graph
        st.markdown("Graph : ")
        HtmlFile = open(graph_html, "r", encoding="utf-8")
        html(HtmlFile.read(), height=600, scrolling=True)

        st.balloons()
    else:
        st.toast("No results found for this query", icon="😥")
