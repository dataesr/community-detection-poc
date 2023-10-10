import streamlit as st
from streamlit.components.v1 import html
from annotated_text import annotated_text
from community_detection_func_graph import graph_generate, graph_export_vos_json, graph_cluster_df
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

# Query condition
filter_condition = st.selectbox("Query condition", ["AND", "OR"], 0) if len(valid_queries) > 1 else "AND"

# Settings
with st.sidebar:
    filter_start_year, filter_end_year = st.select_slider(
        "Years range", options=[2018, 2019, 2020, 2021, 2022, 2023], value=(2018, 2023)
    )
    filter_max_coauthors = st.slider("Max coauthors", 0, 100, 20)
    filter_min_publications = st.slider("Min publications", 0, 10, 0) or None
    setting_enable_communities = st.toggle("Enable communities", True)
    setting_detection_algo = (
        st.selectbox("Detection algorithm", ("Louvain", "Girvan-Newman", "CPM"))
        if setting_enable_communities
        else None
    )
    setting_edge_types = st.multiselect(
        "Edge type", ["Copublications", "Similar topics", "Similar types"], ["Copublications"]
    )
    setting_visualizer = st.selectbox("Graph visualizer", ("Matplotlib", "Pyvis", "Sigma"))

# Filter dictionnary
filters = dict(
    {
        "and_condition": (filter_condition == "AND"),
        "start_year": filter_start_year,
        "end_year": filter_end_year,
        "max_coauthors": filter_max_coauthors,
        "min_works": filter_min_publications,
    }
)

# Generate graph
if st.button("Generate graph", disabled=not bool(valid_queries), type="primary"):
    with st.spinner():
        graph_html, graph, graph_df = graph_generate(
            data_source,
            search_types.index(search_by),
            valid_queries,
            filters,
            setting_enable_communities,
            setting_detection_algo,
            setting_edge_types,
            setting_visualizer,
        )

    if graph_html and graph:
        # Display graph
        st.markdown("Graph : ")

        if "sigma" in graph_html:
            st.markdown(f"Graph html downloaded at :{graph_html}")
        else:
            HtmlFile = open(graph_html, "r", encoding="utf-8")
            html(HtmlFile.read(), height=650, scrolling=True)

        # Display cluster info
        if graph_df is not None:
            st.write("Clusters information :")
            st.dataframe(
                graph_df,
                column_config={
                    "Published_years": st.column_config.BarChartColumn(),
                    "isOa": st.column_config.NumberColumn(format="%i %%"),
                },
            )

        # Hourraaa
        st.balloons()
        graph_export_vos_json(graph)

    else:
        st.toast("No results found for this query", icon="😥")
