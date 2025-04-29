import os
from langchain.schema.retriever import BaseRetriever
from typing_extensions import TypedDict, List
from IPython.display import Image, display
from langchain_core.pydantic_v1 import BaseModel, Field
from langchain.schema import Document
from langgraph.graph import START, END, StateGraph
from langchain.prompts import PromptTemplate,ChatPromptTemplate
import uuid
from langchain_groq import ChatGroq
from langchain_community.utilities import GoogleSerperAPIWrapper
from langchain_community.document_loaders import NewsURLLoader
from langchain_community.retrievers.wikipedia import WikipediaRetriever
from sentence_transformers import SentenceTransformer
from langchain.vectorstores import Chroma
from langchain_community.document_loaders import UnstructuredURLLoader, NewsURLLoader
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import WebBaseLoader
from langchain_core.output_parsers import StrOutputParser
from langchain_core.output_parsers import JsonOutputParser
from langchain_community.vectorstores.utils import filter_complex_metadata
from langchain.schema import Document
from langchain_community.document_loaders.directory import DirectoryLoader
from langchain.document_loaders import TextLoader
from langgraph.graph import START, END, StateGraph
from langchain.retrievers import WebResearchRetriever
from langchain.callbacks.manager import CallbackManager
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from exa_py import Exa
from dotenv import load_dotenv
from langchain_core.documents import Document
import logging

logger = logging.getLogger(__name__)





load_dotenv()

# Get API keys from environment variables
LANGCHAIN_API_KEY = os.environ.get('LANGCHAIN_API_KEY')
LANGCHAIN_TRACING_V2 = os.environ.get('LANGCHAIN_TRACING_V2')
LANGCHAIN_ENDPOINT = os.environ.get('LANGCHAIN_ENDPOINT')
LANGCHAIN_PROJECT = os.environ.get('LANGCHAIN_PROJECT')
GROQ_API_KEY = os.environ.get('GROQ_API_KEY')
SERPER_API_KEY = os.environ.get('SERPER_API_KEY')
EXA_API_KEY = os.environ.get('EXA_API_KEY')





task_description = "Raskite teisinius straipsnius ir nuostatas, kurie tiesiogiai susiję su užklausa apie darbo teisę Lietuvoje"



def create_vectorstore_chroma(vectorstore_path="docs/chroma/", chunk_size=300, chunk_overlap=30):
    
    model_name = "intfloat/multilingual-e5-large-instruct"
    model_kwargs = {'device': 'cpu',
                   "trust_remote_code": False}  # Changed to boolean instead of string
    encode_kwargs = {'normalize_embeddings': True}
    embeddings = HuggingFaceEmbeddings(
        model_name=model_name,
        model_kwargs=model_kwargs,
        encode_kwargs=encode_kwargs
    )

    try:
        if os.path.exists(vectorstore_path) and os.listdir(vectorstore_path):
            st.write("Trying to load existing vectorstore...")
            vectorstore = Chroma(persist_directory=vectorstore_path, embedding_function=embeddings,
                                )
            # Test if it works
            vectorstore._collection.count()
            st.write("Successfully loaded existing vectorstore!")
            return vectorstore
        else:
            st.error("Vectorstore does not exist.")
            return None
    except Exception as e:
        st.error(f"Could not initialize vectorstore: {e}")
        return None





from typing import Annotated

def create_deomposition_grader_web_workflow(vectorstore, k, search_type,generator_name, generator_temperature, helper_name, helper_temperature):
    class GraphState(TypedDict):
        """
        Represents the state of our graph.
        Attributes:
            question: question
            generation: LLM generation
            search: whether to add search
            documents: list of documents
            generations_count : generations count
        """
        question: Annotated[str, "Single"]
        questions: Annotated[List[str], "Multiple"]  # Ensuring only one value per step
        generation: str
        search: str
        documents: List[str]
        steps: List[str]
        generation_count: int
        decomposed_documents: dict[str, List[str]] 
        processed_question: Annotated[str, "Single"]
        sub_questions : List[str]
        

    
    llm = ChatGroq(
            model=generator_name,  
           temperature=generator_temperature,
            max_tokens=600,
            max_retries=3,

        )
    llm_checker = ChatGroq(
            model=helper_name,
            temperature=helper_temperature,
            max_tokens=400,
            max_retries=3,
       )

    llm_question_enricher = ChatGroq(
            model=helper_name,
            temperature=helper_temperature,
            max_tokens=400,
            max_retries=3,
       )   



        

    


    workflow = StateGraph(GraphState)

    # Define the nodes
    workflow.add_node("ask_question", lambda state: ask_question(state))
    workflow.add_node("process_question_for_chroma", lambda state : process_question_for_chroma (state,llm_question_enricher))
    workflow.add_node("decompose_question", lambda state : decompose_question (state,llm_question_enricher))
    workflow.add_node("retrieve", lambda state: retrieve(state, vectorstore,k, search_type))
    workflow.add_node("grade_documents", lambda state: grade_documents(state, retrieval_grader_grader(llm_checker)))
    workflow.add_node("generate", lambda state: generate(state, QA_chain(llm)))
    workflow.add_node("web_search", web_search)
    #workflow.add_node("transform_query", lambda state: transform_query(state, create_question_rewriter(llm)))

    # Build graph
    workflow.set_entry_point("ask_question")
   
    
    workflow.add_conditional_edges(
        "ask_question",
        lambda state: decomposition_checker(state, llm_checker),
        {
            "True": "decompose_question",
            "False": "process_question_for_chroma",
        
        },
    )
    workflow.add_edge("process_question_for_chroma", "retrieve")
    workflow.add_edge("decompose_question", "retrieve")
    

    
    workflow.add_edge("retrieve", "grade_documents")
    
    

    workflow.add_conditional_edges(
        "grade_documents",
        decide_to_generate,
        {
            "search": "web_search",
            "generate": "generate",
        
        },
    )

    
    
   
    workflow.add_edge("web_search", "generate")
    workflow.add_edge("generate", END)
    
   
    
    


    custom_graph = workflow.compile()

    return custom_graph


from langchain_core.prompts import PromptTemplate
from pydantic import BaseModel, Field

def create_only_asnwer_checker_workflow(vectorstore, k, search_type,generator_name, generator_temperature, helper_name, helper_temperature):
    class GraphState(TypedDict):
        """
        Represents the state of our graph.
        Attributes:
            question: question
            generation: LLM generation
            search: whether to add search
            documents: list of documents
            steps: List[str]
            generation_count: int
        """
        question: Annotated[str, "Single"]
        
        generation: str
        search: str
        documents: List[str]
        steps: List[str]
        generation_count: int
        
        

    
    llm = ChatGroq(
        model=generator_name,  
        temperature=generator_temperature,
        max_tokens=1200,
        max_retries=3,

        )
    



        

    


    workflow = StateGraph(GraphState)

    # Define the nodes
    workflow.add_node("ask_question", lambda state: ask_question(state))
    
    workflow.add_node("retrieve", lambda state: retrieve(state, vectorstore,k, search_type))
    
    workflow.add_node("generate", lambda state: generate(state, QA_chain(llm)))
    #workflow.add_node("grade_documents", lambda state: grade_documents(state, retrieval_grader_grader(llm_checker)))
    workflow.add_node("web_search", web_search)
    workflow.add_node("transform_query", lambda state: transform_query(state, create_question_rewriter(llm)))

    # Build graph
    workflow.set_entry_point("ask_question")
   
    
    
    workflow.add_edge("ask_question", "retrieve")
    

    

    
    workflow.add_edge("retrieve", "generate")

    workflow.add_conditional_edges(
        "generate",
        lambda state: grade_generation_v_documents_and_question(state, create_hallucination_checker(llm)),
        {
            "retry": "generate",
            "useful": END,
            "transform query": "transform_query",
        },
    )


    
   

    
    
    workflow.add_edge("transform_query", "retrieve")

    #workflow.add_edge("web_search", "generate")
    #workflow.add_edge("generate", END)
    
   
    
    


    custom_graph = workflow.compile()

    return custom_graph

def create_minimal_workflow(vectorstore, k, search_type,generator_name, generator_temperature, helper_name, helper_temperature):
    class GraphState(TypedDict):
        """
        Represents the state of our graph.
        Attributes:
            question: question
            generation: LLM generation
            search: whether to add search
            documents: list of documents
            steps: List[str]
            generation_count: int
        """
        question: Annotated[str, "Single"]
        
        generation: str
        search: str
        documents: List[str]
        steps: List[str]
        generation_count: int
        chat_history: List[dict] 
        

    
    llm = ChatGroq(
        model=generator_name,  
        temperature=generator_temperature,
        max_tokens=1200,
        max_retries=3,

        )
    



        

    


    workflow = StateGraph(GraphState)

    # Define the nodes
    workflow.add_node("ask_question", lambda state: ask_question(state))
    workflow.add_node("contextualize_user_query", lambda state: contextualize_user_query(state, llm))
    workflow.add_node("answer_chit_chat", lambda state: answer_chit_chat(state, llm))
    workflow.add_node("retrieve", lambda state: retrieve(state, vectorstore, k, search_type))
    workflow.add_node("generate", lambda state: generate(state, QA_chain(llm)))
    workflow.add_node("web_search", web_search)
    
    # Build graph - REVISED FLOW
    workflow.set_entry_point("ask_question")
    
    
    
    # Second decision point: check if chit-chat or work question
    workflow.add_conditional_edges(
        "ask_question", # Coming FROM check_chit_chat node 
        lambda state: check_chit_chat(state, llm), # Function directly returns "chit_chat" or "work_related"
        {
            "chit_chat": "answer_chit_chat", # If chit_chat, go to answer node
            "work_related": "contextualize_user_query" # If work_related, start normal workflow
        }
    )
    

    workflow.add_edge("contextualize_user_query", "retrieve")
    # Continue normal workflow for work-related questions
    workflow.add_edge("retrieve", "generate")
    
    # End both paths
    workflow.add_edge("answer_chit_chat", END)  
    workflow.add_edge("generate", END)

    # REMOVE THIS EDGE - it creates a conflict with the conditional edge above
    # workflow.add_edge("ask_question", "retrieve")
    
    # REMOVE THIS MISPLACED CONDITIONAL EDGE
    # workflow.add_conditional_edges(
    #     "generate",
    #     lambda state: grade_generation_v_documents_and_question(state, create_hallucination_checker(llm)),
    #     {
    #         "work_related": "retrieve",
    #         "chit_chat": "answer_chit_chat",
    #     },
    # )

    custom_graph = workflow.compile()
    return custom_graph

def create_only_decomposition_workflow(vectorstore, k, search_type,generator_name, generator_temperature, helper_name, helper_temperature):
    
    class GraphState(TypedDict):
        """
        Represents the state of our graph.
        Attributes:
            question: question
            generation: LLM generation
            search: whether to add search
            documents: list of documents
            generations_count : generations count
        """
        question: Annotated[str, "Single"]
        questions: Annotated[List[str], "Multiple"]  # Ensuring only one value per step
        generation: str
        search: str
        documents: List[str]
        steps: List[str]
        generation_count: int
        decomposed_documents: dict[str, List[str]] 
        processed_question: Annotated[str, "Single"]
        sub_questions : List[str]
        

    
    llm = ChatGroq(
            model=generator_name,  
           temperature=generator_temperature,
            max_tokens=1000,
            max_retries=3,

        )
    llm_checker = ChatGroq(
            model=helper_name,
            temperature=helper_temperature,
            max_tokens=400,
            max_retries=3,
       )

    llm_question_enricher = ChatGroq(
            model=helper_name,
            temperature=helper_temperature,
            max_tokens=400,
            max_retries=3,
       )   



        

    


    workflow = StateGraph(GraphState)

    # Define the nodes
    workflow.add_node("ask_question", lambda state: ask_question(state))
    workflow.add_node("process_question_for_chroma", lambda state : process_question_for_chroma (state,llm_question_enricher))
    workflow.add_node("decompose_question", lambda state : decompose_question (state,llm_question_enricher))
    workflow.add_node("retrieve", lambda state: retrieve(state, vectorstore,k, search_type))
    
    workflow.add_node("generate", lambda state: generate(state, QA_chain(llm)))
    
    workflow.add_node("transform_query", lambda state: transform_query(state, create_question_rewriter(llm)))

    # Build graph
    workflow.set_entry_point("ask_question")
   
    
    workflow.add_conditional_edges(
        "ask_question",
        lambda state: decomposition_checker(state, llm_checker),
        {
            "True": "decompose_question",
            "False": "process_question_for_chroma",
        
        },
    )
    workflow.add_edge("process_question_for_chroma", "retrieve")
    workflow.add_edge("decompose_question", "retrieve")
    

    
    workflow.add_edge("retrieve", "generate")

    workflow.add_conditional_edges(
        "generate",
        lambda state: grade_generation_v_documents_and_question(state, create_hallucination_checker(llm)),
        {
            "retry": "generate",
            "useful": END,
            "transform query": "transform_query",
        },
    )
    
    
    workflow.add_conditional_edges(
        "transform",
        lambda state: decomposition_checker(state, llm_checker),
        {
            "True": "decompose_question",
            "False": "process_question_for_chroma",
        
        },
    )
    
    
    
   
    
    


    custom_graph = workflow.compile()

    return custom_graph


def create_only_question_rewrite_workflow(vectorstore, k, search_type):
    pass

def create_full_with_transformation_at_end_workflow(vectorstore, k, search_type,generator_name, generator_temperature, helper_name, helper_temperature):
    class GraphState(TypedDict):
        """
        Represents the state of our graph.
        Attributes:
            question: question
            generation: LLM generation
            search: whether to add search
            documents: list of documents
            generations_count : generations count
        """
        question: Annotated[str, "Single"]
        questions: Annotated[List[str], "Multiple"]  # Ensuring only one value per step
        generation: str
        search: str
        documents: List[str]
        steps: List[str]
        generation_count: int
        decomposed_documents: dict[str, List[str]] 
        processed_question: Annotated[str, "Single"]
        sub_questions : List[str]
        

    
    llm = ChatGroq(
            model=generator_name,  
           temperature=generator_temperature,
            max_tokens=600,
            max_retries=3,

        )
    llm_checker = ChatGroq(
            model=helper_name,
            temperature=helper_temperature,
            max_tokens=400,
            max_retries=3,
       )

    llm_question_enricher = ChatGroq(
            model=helper_name,
            temperature=helper_temperature,
            max_tokens=400,
            max_retries=3,
       )   



        

    


    workflow = StateGraph(GraphState)
    # Define the nodes
    workflow.add_node("ask_question", lambda state: ask_question(state))
    workflow.add_node("process_question_for_chroma", lambda state : process_question_for_chroma (state,llm_question_enricher))
    workflow.add_node("decompose_question", lambda state : decompose_question (state,llm_question_enricher))
    workflow.add_node("retrieve", lambda state: retrieve(state, vectorstore,k, search_type))
    workflow.add_node("grade_documents", lambda state: grade_documents(state, retrieval_grader_grader(llm_checker)))
    workflow.add_node("generate", lambda state: generate(state, QA_chain(llm)))
    workflow.add_node("web_search", web_search)
    workflow.add_node("transform_query", lambda state: transform_query(state, create_question_rewriter(llm)))

    # Build graph
    workflow.set_entry_point("ask_question")
   
    
    workflow.add_conditional_edges(
        "ask_question",
        lambda state: decomposition_checker(state, llm_checker),
        {
            "True": "decompose_question",
            "False": "process_question_for_chroma",
        
        },
    )
    workflow.add_edge("process_question_for_chroma", "retrieve")
    workflow.add_edge("decompose_question", "retrieve")
    

    
    workflow.add_edge("retrieve", "grade_documents")
    
    

    workflow.add_conditional_edges(
        "grade_documents",
        decide_to_generate,
        {
            "search": "web_search",
            "generate": "generate",
        
        },
    )

    workflow.add_edge("web_search", "generate")

    workflow.add_conditional_edges(
        "generate",
        lambda state: grade_generation_v_documents_and_question(state, create_hallucination_checker(llm)),
        {
            "retry": "generate",
            "useful": END,
            "transform query": "transform_query",
        },
    )
    
   
    workflow.add_edge("web_search", "generate")
    workflow.add_conditional_edges(
        "transform_query",
        lambda state: decomposition_checker(state, llm_checker),
        {
            "True": "decompose_question",
            "False": "process_question_for_chroma",
        
        },
    )
    workflow.add_edge("process_question_for_chroma", "retrieve")
    workflow.add_edge("decompose_question", "retrieve")
   
    workflow.add_edge("generate", END)
    
   
    
    


    custom_graph = workflow.compile()

    return custom_graph


def create_websearch_workflow(vectorstore, k, search_type,generator_name, generator_temperature, helper_name, helper_temperature):
    class GraphState(TypedDict):
        """
        Represents the state of our graph.
        Attributes:
            question: question
            generation: LLM generation
            search: whether to add search
            documents: list of documents
            generations_count : generations count
        """
        question: Annotated[str, "Single"]
        questions: Annotated[List[str], "Multiple"]  # Ensuring only one value per step
        generation: str
        search: str
        documents: List[str]
        steps: List[str]
        generation_count: int
        decomposed_documents: dict[str, List[str]] 
        processed_question: Annotated[str, "Single"]
        sub_questions : List[str]
        

    
    llm = ChatGroq(
            model=generator_name,  
           temperature=generator_temperature,
            max_tokens=600,
            max_retries=3,

        )
    
    llm_checker = ChatGroq(
            model=helper_name,
            temperature=helper_temperature,
            max_tokens=400,
            max_retries=3,
       )


        

    


    workflow = StateGraph(GraphState)

    # Define the nodes
    workflow.add_node("ask_question", lambda state: ask_question(state))
    
    workflow.add_node("retrieve", lambda state: retrieve(state, vectorstore,k, search_type))
    workflow.add_node("grade_documents", lambda state: grade_documents(state, retrieval_grader_grader(llm_checker)))
    workflow.add_node("generate", lambda state: generate(state, QA_chain(llm)))
    workflow.add_node("web_search", web_search)
    workflow.add_node("transform_query", lambda state: transform_query(state, create_question_rewriter(llm)))

    # Build graph
    workflow.set_entry_point("ask_question")
   
    
    
    workflow.add_edge("ask_question", "retrieve")
    workflow.add_edge("retrieve", "grade_documents")
    workflow.add_conditional_edges(
        "grade_documents",
        decide_to_generate,
        {
            "search": "web_search",
            "generate": "generate",
        
        },
    )
    
    

    
    
    
   

    
    
   
    workflow.add_edge("web_search", "generate")
    workflow.add_edge("generate", END)
    
   
    
    


    custom_graph = workflow.compile()

    return custom_graph



def decompose_question(state, llm) -> list[str]:
    """
    Decomposes a complex question into smaller, clear sub-questions.
    """

    question = state["question"]
    steps = state["steps"]
    steps.append("Question Decomposition")


    class DecomposedQuestionsOutput(BaseModel):
        sub_questions: list[str] = Field(
            description="List of smaller questions derived from the original question."
        )
    
    structured_llm = llm.with_structured_output(DecomposedQuestionsOutput)
    
    prompt = PromptTemplate(
        template="""Jūs esate Lietuvos teisės ekspertas. 
Jūsų užduotis – pateiktą klausima įvertinti ar jam išgauti informacijos reikia klausimą suskaidyti i mažesnius klausimus, efektyviausiam informacijos išgavimui iš chroma vectorstores. Informacija iš chromos vectorstore geriausiai išgaunama kai yra  glausta užklausa. Pavyzdžiui: Kaip yra reguliuojamas paveldėjimas, paverčiama į paveldėjimo reguliavimas. tokios glaustos užklausos efektyviausiai veikia duomenų išgavime.
 .








Išskaidykite klausimą į aiškius, glaustus mažesnius klausimus,  kaip sąrašą.
Mažesni klausimai turi būti vienaskaitoje.
Kekviename mažesniame klausime išskirkite vieną pagrindinį komponentą:
1. Subjektą – kas yra klausimo pagrindinė tema? Tai gali būti žmogus, organizacija ar teisinė sąvoka.

Nepridek jokių nereikalingų žodžių, kuo glausciau tuo geriau! Tik Subjektas  išskirtas.
Klausimuose nereikia išskirti kad tai susije su teise, nes viskas sioje probramoje susije su teise.
Klausimas turi būti kiek įmanoma apstraktesnis ir jų turi būti kiek imanoma mažiau .
iškirti klausimai turi būti labiau kaip abstrakcios temos.

Pvz.:
1. Uždarosios akcines bendrovės ir individualios įmonės skirtumai?"
   Išskirti klausimai : ["Įndividuali įmonė" ,"Uždaroji akcinė bendrovė" ;
2. Neblaivumo limitai vairuojant  ir galimos baudos?"
   Išskirti klausimai : ["Leistinas alkoholio kiekis kraujyje vairuojant." ,"Nuobaudos už važiavimą išgerus." ;
    ]



  

Klausimas: {question}
Atsakymas turi būti sąrašas.""",
        input_variables=["question"]
    )
    decompositioneer= prompt | structured_llm
    result = decompositioneer.invoke({"question": question})
    
    return {'sub_questions':result.sub_questions, "steps": steps}



def decomposition_checker(state, llm_checker) :
    """
    Agent that evaluates whether a question needs decomposition into smaller questions.
    Returns a binary score: True (needs decomposition) or False (does not).
    """

    question = state["question"]
    steps = state["steps"]
    steps.append("Decomposition Check")


    class DecompositionCheckOutput(BaseModel):
        needs_decomposition: bool = Field(
            description="True if the question is complex and requires decomposition; otherwise, False."
        )
    
    structured_llm = llm_checker.with_structured_output(DecompositionCheckOutput)
    
    prompt = PromptTemplate(
        template="""Jūs esate Lietuvos teisės ekspertas. 
Jūsų užduotis – įvertinti, ar klausimas yra sudėtingas ir  jį reikia suskaidyti į mažesnius klausimus.

Klausimo sudėtingumo kriterijai:
1. Klausimas apima kelias temas ar subjektus.

3. Klausimas nėra pakankamai konkretus, kad būtų galima tiesiogiai atsakyti.

Dažniausiu atveju nereikia klausimo iškirti i kelis, tai daroma nebent klausime pastebimos skirtingos temos su skirtingais subjektais

Pvz1: Klausimas: Kaip yra reguliuojamas paveldėjimas ? ;
Atsakymas: "False"  ;  
Paaiškinimas : Nes kalbama tik apie paveldėjio reguliavimą. ;

Pvz2: Klausimas: Skirtumai tarp individualios veiklos ir uždarosios akcinės bendrovės? ;
Atsakymas: „True“  ;
Paaiškinimas: Klausiama apie Uždarają akcinę bendrovę ir individualia įmonę. ;

Pvz3: Klausimas: Aš vairavau girtas pirma karta automobili , mane sustabde policija ir man buvo užfiksuotas  0.6 promiles girtumas , kokia atsakomybe manes laukia? ;
Atsakymas: "False"  ;
Paaiškinimas: Klausiama konkreciai apie vieną dalyką, baudą už vairavimą girtam , neturint už tai nuobaudos ir kraujyje turint 0.6promiles girtuma. ;

Klausimas: {question}

Jei klausimas atitinka bent vieną iš šių kriterijų, atsakykite „True“. 
Jei klausimas yra aiškus, konkretus ir nereikalauja išskaidymo, atsakykite „False“.""",
        input_variables=["question"]
    )
    
    # Invoke the agent with the question
    
    decomposition_grader = prompt | structured_llm
    result = decomposition_grader.invoke({"question": question})
    result = result.needs_decomposition
    result = str(result)
    return result







def process_question_for_chroma(state, llm):
    """
    Processes the question for Chroma vectorstore by simplifying it or generating sub-questions if needed.
    """
    steps = state["steps"]
    steps.append("Question Decomposition")
    question = state["question"]

    class ProcessedQuestionOutput(BaseModel):
        """
        Defines the output with a simplified question for Chroma vectorstore search.
        """
        processed_question: str = Field(
            description="Simplified question adapted for Chroma vectorstore search."
        )

    structured_llm = llm.with_structured_output(ProcessedQuestionOutput)

    prompt = PromptTemplate(
        template="""Jūs esate Lietuvos teisės ekspertas, padedantis optimizuoti klausimus paieškai dokumentuose. 
        Klausimuose nereikia išskirti kad tai susije su teise, nes viskas sioje probramoje susije su teise.
Pirmiausia, išanalizuokite pateiktą klausimą ir išskirkite du pagrindinius komponentus:
1. Subjektą – kas yra klausimo pagrindinė tema? Tai gali būti žmogus, organizacija ar teisinė sąvoka.
2. Veiksmą – kas vyksta su tuo subjektu? Tai gali būti veiksmas, procedūra ar teisinė situacija.
3. Detalę kuri labai iškiria iškart situacija , kaip vairavimas neblaiviam.

Pavyzdžiai:
1. Klausimas: "Kokios yra pagrindinės teisės ir pareigos, kurias turi tėvai, auginantys nepilnamečius vaikus Lietuvoje?"
   Atsakymas: "Tėvai auginantys nepilnamečius vaikus";

2. Klausimas: "Kokius veiksmus turi atlikti darbuotojas, kad galėtų teikti pretenziją dėl nelegalaus atleidimo iš darbo Lietuvoje?"
   Atsakymas: "Darbuotojo pretenziją dėl nelegalaus atleidimo";

3. Klausimas: "Kokie teisiniai pavojai gali atsitikti skirybų metu??"
   Atsakymas: "Sutuoktiniu skirybų procesas";

4. Klausimas: " Nuo kokio alkoholio kiekio nebegalima vairuoti?"
   Atsakymas: "Bauda už vairavimą išgėrus" ;  
5. Klausimas: "Kaip yra reguliuojamas paveldėjimas pagal Lietuvos civilinį kodeksą??"
   Atsakymas: "Paveldėjimo teisė" 
6. Klausimas: "Baudos už vairavima išgerus?"
   Atsakymas: "Baudos už vairavimą neblaiviam" 
7. Klausimas: "Aš vairavau girtas pirma karta automobili , mane sustabde policija ir man buvo užfiksuotas  0.6 promiles girtumas , kokia atsakomybe manes laukia?"
   Atsakymas: "Vairavimas girtam, baudos už 0.6 promiles girtumą"         
Klausimas: {question}

Atsakymas turi būti supaprastintas ir susidėti iš dviejų komponentų – subjekto ir veiksmo, atskirtų tarpais.
""",
        input_variables=["question"]
    )

    question_processing_pipeline = prompt | structured_llm 

    result = question_processing_pipeline.invoke({"question": question})
    refined_question = result.processed_question

    return {
        "processed_question": refined_question,
        "steps": steps
    }
    




def retrieval_grader_grader(llm):
    """
    Function to create a grader object using a passed LLM model.
    
    Args:
        llm: The language model to be used for grading.
        
    Returns:
        Callable: A pipeline function that grades relevance based on the LLM.
    """
    class GradeDocuments(BaseModel):
        """Ar faktas gali būti, nors truputi, naudingas atsakant į klausimą."""
        binary_score: str = Field(
            description="Documentai yra aktualūs klausimui, 'yes' arba 'no'"
        )
    
    # Create the structured LLM grader using the passed LLM
    structured_llm_grader = llm.with_structured_output(GradeDocuments) 
  
   


    # Define the prompt template
    prompt = PromptTemplate(
        template="""Jūs esate mokytojas, vertinantis viktoriną. Jums bus suteikta: 
        1/ KLAUSIMAS
        2/ Studento pateiktas FAKTAS
        
        Jūs vertinate RELEVANCE RECALL:
        yes reiškia, kad FAKTAS yra susijęs su KLAUSIMU. 
        no reiškia, kad FAKTAS nesusijęs su KLAUSIMU. 
        yes yra aukščiausias (geriausias) balas. no yra žemiausias balas, kurį galite duoti. 
        
        Žingsnis po žingsnio paaiškinkite savo samprotavimus. Įsitikinkite, kad jūsų samprotavimai ir išvados yra teisingi. 
        
        Iš pradžių venkite tiesiog nurodyti teisingą atsakymą.
        
        Klausimas: {question} \n
        FAKTAS: \n\n {documents} \n\n
        
        Suteikite dvejetainį balą „yes“ arba „no“, kad nurodytumėte, ar dokumentas yra susijęs su klausimu. \n
        Pateikite dvejetainį balą kaip JSON su vienu raktu „balu“ ir be įžangos ar paaiškinimo.
        """,
        input_variables=['documents', 'question'],
    )
    
    # Combine the prompt with the structured LLM grader
    retrieval_grader = prompt | structured_llm_grader

    # Return the grader object
    return retrieval_grader    


def create_toxicity_checker(llm):
    """
    Function to create a toxicity checker object using a passed LLM model.
    
    Args:
        llm: The language model to be used for toxicity checking.
        
    Returns:
        Callable: A pipeline function that checks for toxicity based on the LLM.
    """
    
    # Define the class for toxicity check inside the function
    class PromtGuard(BaseModel):
        """Binary score for toxicity check on question."""
        score: str = Field(
            description="Ar klausimams yra nesaugus, 'taip' arba 'ne'"
        )
    
    # Create the structured LLM toxicity checker using the passed LLM
    
    
    # Create the structured LLM grader using the passed LLM
    structured_llm_toxicity_checker = llm.with_structured_output(PromtGuard)


    # Define the prompt template
    prompt = PromptTemplate(
        template="""Jūs esate klasifikatorius, kuris įvertins tekstą pagal pateiktus kriterijus. 
        Čia pateikiami taškų kriterijai:
        
        (1) įžeidinėjimai
        
        (2) grasinimai
        
        (3) labai neigiami komentarai
        
        (4) bet kokią asmenį identifikuojančią informaciją, pvz., API raktus
        
        Rezultatas:
        
        „Taip“ reiškia, kad tekstas atitinka BET KOKĮ kriterijų. 
        
        Įvertinimas „ne“ reiškia, kad tekstas neatitinka VISŲ kriterijų. 
        
        Štai klausimas: {question}
        
        Suteikite dvejetainį balą „taip“ arba „ne“, kad nurodytumėte, ar atsakymas yra naudingas norint išspręsti klausimą.
        Jei atsakyme yra pasikartojančių frazių, kartojimas, tada grąžinkite „ne“\n
        Pateikite dvejetainį balą kaip JSON su vienu raktu „balu“ ir be įžangos ar paaiškinimo.
        """,
        input_variables=["question"],
    )
    
    # Combine the prompt with the structured LLM toxicity checker
    toxicity_grader = prompt | structured_llm_toxicity_checker

    # Return the toxicity checker object
    return toxicity_grader






def create_helpfulness_checker(llm):
    """
    Function to create a helpfulness checker object using a passed LLM model.
    
    Args:
        llm: The language model to be used for checking the helpfulness of answers.
        
    Returns:
        Callable: A pipeline function that checks if the student's answer is helpful.
    """
    
    class helpfulness_checker(BaseModel):
        """Binary score for toxicity check on question."""
        score: str = Field(
            description="Ar atsakymas yra naudingas?, 'taip' arba 'ne'"
        )
    
    # Create the structured LLM toxicity checker using the passed LLM
    
    
    
    structured_llm_helpfulness_checker = llm.with_structured_output(helpfulness_checker)


    # Create the structured LLM helpfulness checker using the passed LLM

    # Define the prompt template
    prompt = PromptTemplate(
    template="""Jums bus pateiktas KLAUSIMAS {question} ir ATSAKYMAS {generation}.

Įvertinkite ATSAKYMAS pagal šiuos kriterijus:

ATSAKYMAS turi būti tiesiogiai susijęs su KLAUSIMU ir  į jį atsakyti.


„Taip“ reiškia, kad ATSAKYMAS atitinka   kriteriju ir tiesiogiai susijęs su KLAUSIMU.
Įvertinimas „ne“ reiškia, kad ATSAKYMAS neatitinka visų šių kriterijų.
Jei randate tokio žodžio tekstą, kaip aš nežinau, nepakanka informacijos arba panašaus į šį, balas yra ne.
Pateikite balą kaip JSON su vienu raktu "balas" ir be papildomo teksto""",
    input_variables=["generation", "question"]
)
    
    # Combine the prompt with the structured LLM helpfulness checker
    helpfulness_grader = prompt | structured_llm_helpfulness_checker

    # Return the helpfulness checker object
    return helpfulness_grader





def create_hallucination_checker(llm):
    """
    Function to create a hallucination checker object using a passed LLM model.
    
    Args:
        llm: The language model to be used for checking hallucinations in the student's answer.
        
    Returns:
        Callable: A pipeline function that checks if the student's answer contains hallucinations.
    """
    

    class hallucination_checker(BaseModel):
        """Binary score for toxicity check on question."""
        score: str = Field(
            description="Ar atsakymas yra naudingas?, 'taip' arba 'ne'"
        )
    
    # Create the structured LLM toxicity checker using the passed LLM
    
    
    
    structured_llm_hallucination_checker = llm.with_structured_output(hallucination_checker)

    # Define the prompt template
    prompt = PromptTemplate(
    template="""Jūs esate profesionalus vertintojas. 
    Jūsų užduotis – patikrinti, ar ATSAKYMAS atsako į pateiktą KLAUSIMĄ. 
    
    
    Rezultatas:
    - „Taip“: Atsakymas atsako į klausimą 
    - „Ne“: Atsakymas neatsako į klausimą 

    ATSAKYMAS: {generation}
    KLAUSIMAS: {question}
    
    Grąžinkite rezultatą JSON formatu:
    ```json
    {{
        "balu": "taip" arba "ne"
    }}
    ```""",
    input_variables=["generation", "question"],
)
    
    # Combine the prompt with the structured LLM hallucination checker
    hallucination_grader = prompt | structured_llm_hallucination_checker

    # Return the hallucination checker object
    return hallucination_grader


def create_question_rewriter(llm):
    """
    Function to create a question rewriter object using a passed LLM model.
    
    Args:
        llm: The language model to be used for rewriting questions.
        
    Returns:
        Callable: A pipeline function that rewrites questions for optimized vector store retrieval.
    """
    
    # Define the prompt template for question rewriting
    re_write_prompt = PromptTemplate(
        template="""Esate klausimų perrašytojas, kurio specializacija yra Lietuvos teisė, tobulinanti klausimus, kad būtų galima optimizuoti jų paiešką iš teisinių dokumentų. Jūsų tikslas – išaiškinti teisinę intenciją, pašalinti dviprasmiškumą ir pakoreguoti formuluotes taip, kad jos atspindėtų teisinę kalbą, daugiausia dėmesio skiriant atitinkamiems raktiniams žodžiams. Daryk tai apstrakciai, kadangi taip efektyviausai gaunama informacija iš vectorstore.

Klausimas turi būti kiek įmanoma abstraktesnis. Kuo abstrakčiau tuo geresnis informacijos išgavimas.
Man nereikia paaiškinimų, tik perrašyto klausimo.
pvz:
Klausimas : Asmens dokumento paemimas svetimo asmens?
Atsakymas: Svetimo asmens dokumento pasisavinimas

Štai pradinis klausimas: \n\n {question}. Patobulintas klausimas be paaiškinimų : \n""",
        input_variables=["question"],
    )
    
    # Combine the prompt with the LLM and output parser
    question_rewriter = re_write_prompt | llm | StrOutputParser()

    # Return the question rewriter object
    return question_rewriter


def transform_query(state, question_rewriter):
    """
    Transform the query to produce a better question.
    Args:
        state (dict): The current graph state
    Returns:
        state (dict): Updates question key with a re-phrased question
    """

    print("---TRANSFORM QUERY---")
    question = state["question"]
    documents = state["documents"]
    steps = state["steps"]
    steps.append("question_transformation")
    generation_count = state["generation_count"]
    
    generation_count = 0

    # Re-write question
    better_question = question_rewriter.invoke({"question": question})
    print(f" Transformed question:  {better_question}")
    return {"documents": documents, "question": better_question,"generation_count": generation_count}



def format_google_results_search(google_results):
    formatted_documents = []

    # Extract data from answerBox
    answer_box = google_results.get("answerBox", {})
    answer_box_title = answer_box.get("title", "No title")
    answer_box_answer = answer_box.get("answer", "No text")

   

    

    # Extract and add organic results as separate Documents
    for result in google_results.get("organic", []):
        title = result.get("title", "No title")
        link = result.get("link", "Nėra svetainės adreso")
        snippet = result.get("snippet", "No snippet available")
        

        document = Document(
            metadata={
                "Organinio rezultato pavadinimas": title,
                
            },
            page_content=(
                f"Pavadinimas: {title}     "
                f"Straipsnio ištrauka: {snippet}     "
                f"Nuoroda: {link}      "
                
            )
        )
        formatted_documents.append(document)

    return formatted_documents



def format_google_results_news(google_results):
    formatted_documents = []
    
    # Loop through each organic result and create a Document for it
    for result in google_results['organic']:
        title = result.get('title', 'No title')
        link = result.get('link', 'No link')
        descripsion = result.get('description', 'No link')
        snippet = result.get('snippet', 'No summary available')
        text = result.get('text' , 'no text')

        # Create a Document object with similar metadata structure to WikipediaRetriever
        document = Document(
            metadata={
                'Title': title,
                'Description': descripsion,
                'Text' : text,
                'Snippet': snippet,
                'Source': link
            },
            page_content=snippet  # Using the snippet as the page content
        )
        
        formatted_documents.append(document)
    
    return formatted_documents


def QA_chain(llm):
    """
    Creates a question-answering chain using the provided language model.
    Args:
        llm: The language model to use for generating answers.
    Returns:
        An LLMChain configured with the question-answering prompt and the provided model.
    """
    # Define the prompt template
    prompt = PromptTemplate(
        template="""Esi teisės asistentas, turintis prieigą prie naujausios informacijos iš Lietuvos teisės kodeksų bei interneto šaltinių. 
        
        Tau pateikiamos teisės kodeksų ištraukos yra naujausios redakcijos ir neginčijamos susijusios su klausimu.
        Klausimai yra susije su  Lietuvos teise ir dokumentai iš lietuvos teises šaltinių. 
        Tavo užduotis yra paaiškinti, atsakyti  išsamiai ir tuo pačiu glaustai į klausimą: {question}, remiantis pateiktais dokumentais: {documents}, tau šitų dokumentų turi užtekti, jei vartotojas matys kad atsakymas per mažas ar informacijos per mažai, jis padidint informacijos kiekį.
        Turi suformuluoti atsakymą pagal pateiktus dokumentus ir tau jų turi užtekti. 
        
        Atsakyk tik remdamasis pateiktais dokumentais. Jei atsakymo negalima rasti dokumentuose, pasakyk, iš kur žinai atsakymą. 
        Jei negali atsakyti į klausimą, pasakyk: „Atsiprašau, nežinau atsakymo į jūsų klausimą.“ 
        Nepateik papildomų klausimų ir nesikartok atsakyme.
        
        Atsakymas:
        """,
        input_variables=["question", "documents"],
    )

    rag_chain = prompt | llm | StrOutputParser()
    
    return rag_chain


def grade_generation_v_documents_and_question(state, hallucination_grader):
    """
    Determines whether the generation is grounded in the document and answers the question.
    """
    print("---CHECK HALLUCINATIONS---")
    question = state.get("question")
    documents = state.get("documents")
    generation = state.get("generation")
    generation_count = state.get("generation_count", 0)  # Default to 0 if not provided

    print(f"Generation number: {generation_count}")

    # Grading hallucinations
    score = hallucination_grader.invoke(
        {"documents": documents, "generation": generation, "question": question}
    )
    grade = getattr(score, "score", None)

    # Check hallucination
    if grade in {"taip", "Taip", "yes", "Yes"}:
        print("---DECISION: GENERATION IS GROUNDED IN DOCUMENTS---")
        # Check question-answering
        print("---GRADE GENERATION vs QUESTION---")
        return "useful"
    elif generation_count > 1:
        print("---DECISION: GENERATION IS NOT GROUNDED IN DOCUMENTS, TRANSFORM QUERY---")
        return "transform query"
    else:
        print("---DECISION: GENERATION DOES NOT ADDRESS QUESTION---")
        return "retry"
        
    

def ask_question(state):
    """
    Initialize question
    Args:
        state (dict): The current graph state
    Returns:
        state (dict): Question
    """
    steps = state["steps"]
    question = state["question"]
    generations_count = state.get("generations_count", 0) 
    
    
    steps.append("question_asked")
    return {"question": question, "steps": steps,"generation_count": generations_count}
        
        
def retrieve(state, vectorstore, k, search_type):
    """
    Retrieve documents based on the processed question.
    """
    steps = state["steps"]
    sub_questions = state.get("sub_questions")
    processed_question = state.get("processed_question")
    question = state["question"]

    if sub_questions is None:
        if processed_question is not None:
            basic_retriever = vectorstore.as_retriever(
                search_type=search_type,
                search_kwargs={"k": k}
            )
            

# Instruction-based retriever
            instruct_retriever = InstructRetriever(
                base_retriever=basic_retriever,
                task_description=task_description
            )
            documents = instruct_retriever.invoke(processed_question)

            steps.append("retrieve_documents")
            return {
                "documents": documents,
                "steps": steps
            }
        else:
            basic_retriever = vectorstore.as_retriever(
                search_type=search_type,
                search_kwargs={"k": k}
            )
            instruct_retriever = InstructRetriever(
                base_retriever=basic_retriever,
                task_description=task_description
            )
            documents = instruct_retriever.invoke(question)

            steps.append("retrieve_documents")
            return {
                "documents": documents,
                "steps": steps
            }
    else:
        documents = []
        import math
        
        k = math.ceil(k / 2)
        retriever = vectorstore.as_retriever(
            search_type=search_type,
            search_kwargs={"k": k}
        )
        
        for q in sub_questions:
            # Ensure each sub-question is a string
            if not isinstance(q, str):
                raise TypeError(f"Each sub-question must be a string, got {type(q)} for question: {q}")
            
            document = retriever.invoke(q)
            documents.extend(document)  # Append the documents retrieved for this sub-question

        steps.append("retrieve_documents")
        return {
            "documents": documents,
            "steps": steps
        }


def generate(state,QA_chain):
    """
    Generate answer
    """
    question = state["question"]
    documents = state["documents"]
    generation = QA_chain.invoke({"documents": documents, "question": question})
    steps = state["steps"]
    steps.append("generate_answer")
    generation_count = state["generation_count"]
    
    generation_count += 1
        
    return {
        "documents": documents,
        "question": question,
        "generation": generation,
        "steps": steps,
        "generation_count": generation_count  # Include generation_count in return
    }


def grade_documents(state, retrieval_grader):
    question = state["question"]
    documents = state["documents"]
    decomposed_documents = state.get('decomposed_documents')
    steps = state["steps"]
    steps.append("grade_document_retrieval")
    
    filtered_docs = []
    web_results_list = []
    search = "No"
    
    if decomposed_documents is None:


        for d in documents:
             # Call the grading function
            score = retrieval_grader.invoke({"question": question, "documents": d})
            print(f"Grader output for document: {score}")  # Detailed debugging output
        
        # Extract the grade
            grade = getattr(score, 'binary_score', None)
            if grade and grade.lower() in ["yes", "true", "1",'taip']:
                filtered_docs.append(d)
            elif len(filtered_docs) < 4:  
                search = "Yes"
            
    # Check the decision-making process
        print(f"Final decision - Perform web search: {search}")
        print(f"Filtered documents count: {len(filtered_docs)}")
    
        

    else:
        # Handle decomposed documents (dictionary with question-document pairs)
        for q, d in decomposed_documents.items():
            # Call the grading function
            score = retrieval_grader.invoke({"question": q, "documents": d})
            print(f"Grader output for question '{q}' and document: {score}")  # Debugging output

            # Extract the grade
            grade = getattr(score, 'binary_score', None)
            if grade and grade.lower() in ["yes", "true", "1", 'taip']:
                filtered_docs.append(d)
            elif len(filtered_docs) < 4:  
                search = "Yes"


            



        # Debugging output
        print(f"Final decision - Perform web search: {search}")
        print(f"Filtered decomposed documents count: {len(filtered_docs)}")


    return {
            "documents": filtered_docs,
            "question": question,
            "search": search,
            "steps": steps,
        }    
    
    


def clean_exa_document(doc):
    """
    Extracts and retains only the title, url, text, and summary from the exa result document.
    """
    return {
        "Pavadinimas:    ": doc.title,
        "        Straipnsio internetinis adresas:    ": doc.url,
        "Tekstas:    ": doc.text,
        "                                   Apibendrinimas:    ": doc.summary,
    }

def web_search(state):
    question = state["question"]
    documents = state.get("documents", [])
    steps = state["steps"]
    steps.append("web_search")
    k = 8 - len(documents)
    web_results_list = []

    # Fetch results from exa
    exa_results_raw = exa.search_and_contents(
        query=question,
        #start_published_date="2020-01-01T22:00:01.000Z",

        type="keyword",
        num_results=2,
        text={"max_characters": 1000},
        summary={
            "query": "Tell in summary a meaning about what is article written. Provide facts, be concise. Do it in Lithuanian language."
        },
        include_domains=[ "infolex.lt", "vmi.lt", "lrs.lt", "e-seimas.lrs.lt", "teise.pro",'lt.wikipedia.org', 'teismai.lt' ],
        
    )
    # Extract results
    exa_results = exa_results_raw.results if hasattr(exa_results_raw, "results") else []
    cleaned_exa_results = [clean_exa_document(doc) for doc in exa_results]
    print(cleaned_exa_results)
    
  
    #web_results = GoogleSerperAPIWrapper(k=2, gl="lt", hl="lt", type="search").results(question)
    #print(web_results)
    #formatted_documents = format_google_results_search(web_results)
    #web_results_list.extend(formatted_documents if isinstance(formatted_documents, list) else [formatted_documents])

    combined_documents = documents + cleaned_exa_results 
    

    return {"documents": combined_documents, "question": question, "steps": steps}

def decide_to_generate(state):
    """
    Determines whether to generate an answer, or re-generate a question.
    Args:
        state (dict): The current graph state
    Returns:
        str: Binary decision for next node to call
    """
    search = state["search"]
    if search == "Yes":
        return "search"
    else:
        return "generate"
    
def decide_to_generate2(state):
    """
    Determines whether to generate an answer, or re-generate a question.
    Args:
        state (dict): The current graph state
    Returns:
        str: Binary decision for next node to call
    """
    search = state["search"]
    if search == "Yes":
        return "search"
    else:
        return "generate"
    


# Helper function to add instructions to the query
def get_detailed_instruct(task_description: str, query: str) -> str:
    """Format a query with a task description to guide the model."""
    return f'Instruct: {task_description}\nQuery: {query}'

# Custom Retriever class with instruction-augmented queries
class InstructRetriever(BaseRetriever):
    """Retriever that adds instruction to queries before retrieval."""
    
    base_retriever: BaseRetriever = Field(...)
    task_description: str = Field(...)

    def _get_relevant_documents(self, query: str) -> List[Document]:
        """Add instruction to the query before passing to the base retriever."""
        formatted_query = get_detailed_instruct(self.task_description, query)
        return self.base_retriever.invoke(formatted_query)


def check_chit_chat(state, llm):
    """
    Classifies the query as 'chit_chat' or 'work_related'.
    Simple version without using structured output which causes Groq API issues.
    """
    question = state["question"]
    steps = state["steps"]
    steps.append("Chit Chat check")
    logger.info(f"Checking if query is chit-chat: '{question}'")
    
    # Quick dictionary check first for common greetings
    CHIT_CHAT_PATTERNS = [
        "labas", "hi", "hello", "sveiki", "laba diena", "kaip sekasi", 
        "how are you", "sveikas", "heyo", "hey", "hola"
    ]
    
    # Check if the question contains any chit-chat patterns
    question_lower = question.lower().strip()
    for pattern in CHIT_CHAT_PATTERNS:
        if pattern in question_lower or question_lower == pattern:
            logger.info(f"Query '{question}' matched chit-chat pattern: {pattern}")
            return "chit_chat"
    
    # For more complex classification, use a simpler prompt approach
    prompt = PromptTemplate(
        template="""You are an expert classifier. Your task is to determine if a user's query is simple chit-chat or a substantive question.

Chit-chat includes greetings (like hi, hello, labas, sveiki), simple pleasantries (like how are you?, kaip sekasi?), and other non-work-related small talk.

Substantive questions are those asking about work rights, labor law, or specific employment situations.

User query: {question}

Respond with ONLY ONE WORD: either "chit_chat" or "work_related".
""",
        input_variables=["question"],
    )
    
    # Use a simple chain with string output
    chit_chat_checker = prompt | llm | StrOutputParser()
    
    try:
        # Get the classification result
        result = chit_chat_checker.invoke({"question": question})
        logger.info(f"LLM classification result for '{question}': {result}")
        
        # Clean up and normalize the result
        result = result.lower().strip()
        
        if "chit" in result or "chat" in result or result.startswith("chit"):
            logger.info("Query classified as: chit_chat")
            return "chit_chat"
        else:
            logger.info("Query classified as: work_related")
            return "work_related"
            
    except Exception as e:
        logger.error(f"Error during chit-chat classification: {e}", exc_info=True)
        # Default to work_related on error
        return "work_related"
    


def answer_chit_chat(state, llm):
    """
    Generates a simple response for chit-chat queries.
    """
    question = state["question"]
    steps = state["steps"]
    steps.append("answer_chit_chat")
    logger.info(f"Answering chit-chat: '{question}'")
    
    # Quick dictionary lookup for common greetings
    CHIT_CHAT_RESPONSES = {
        "labas": "Labas! Kuo galėčiau padėti?",
        "hi": "Hi! How can I assist you?",
        "hello": "Hello! How can I help you today?",
        "sveiki": "Sveiki! Kuo galėčiau jums padėti?",
        "laba diena": "Laba diena! Kuo galėčiau padėti?",
        "kaip sekasi?": "Man sekasi puikiai! O kaip jums? Kuo galėčiau padėti?",
        "how are you?": "I'm doing well, thank you! How can I assist you?",
    }
    
    # Try to find direct match in dictionary
    question_lower = question.lower().strip()
    response = CHIT_CHAT_RESPONSES.get(question_lower)
    
    # If no direct match, use the LLM
    if not response:
        logger.info("No direct dictionary response, generating with LLM...")
        prompt = PromptTemplate(
            template="""You are a friendly assistant. Respond naturally to this casual greeting or small talk.
Respond in the same language as the user's message. Keep your response friendly, brief and conversational.
Add a prompt encouraging the user to ask about work-related legal questions since you're specialized in Lithuanian labor law.

User message: {question}

Your response:""",
            input_variables=["question"],
        )
        
        chit_chat_chain = prompt | llm | StrOutputParser()
        
        try:
            response = chit_chat_chain.invoke({"question": question})
        except Exception as e:
            logger.error(f"Error generating chit-chat response: {e}", exc_info=True)
            response = "Atsiprašau, įvyko klaida. Kuo galėčiau padėti?"
    
    logger.info(f"Generated chit-chat response: '{response}'")
    
    # Return updated state with the generation
    return {
        "question": question,
        "generation": response,
        "steps": steps,
        "documents": [] # Empty documents for chit-chat
    }


def create_hallucination_checker(llm):
    """
    Function to create a hallucination checker object using a passed LLM model.
    
    Args:
        llm: The language model to be used for checking hallucinations in the student's answer.
        
    Returns:
        Callable: A pipeline function that checks if the student's answer contains hallucinations.
    """
    

    class hallucination_checker(BaseModel):
        """Binary score for toxicity check on question."""
        score: str = Field(
            description="Ar atsakymas yra naudingas?, 'taip' arba 'ne'"
        )
    
    # Create the structured LLM toxicity checker using the passed LLM
    
    
    
    structured_llm_hallucination_checker = llm.with_structured_output(hallucination_checker)

    # Define the prompt template
    prompt = PromptTemplate(
    template="""Jūs esate profesionalus vertintojas. 
    Jūsų užduotis – patikrinti, ar ATSAKYMAS atsako į pateiktą KLAUSIMĄ. 
    
    
    Rezultatas:
    - „Taip“: Atsakymas atsako į klausimą 
    - „Ne“: Atsakymas neatsako į klausimą 

    ATSAKYMAS: {generation}
    KLAUSIMAS: {question}
    
    Grąžinkite rezultatą JSON formatu:
    ```json
    {{
        "balu": "taip" arba "ne"
    }}
    ```""",
    input_variables=["generation", "question"],
)
    
    # Combine the prompt with the structured LLM hallucination checker
    hallucination_grader = prompt | structured_llm_hallucination_checker

    # Return the hallucination checker object
    return hallucination_grader


def create_question_rewriter(llm):
    """
    Function to create a question rewriter object using a passed LLM model.
    
    Args:
        llm: The language model to be used for rewriting questions.
        
    Returns:
        Callable: A pipeline function that rewrites questions for optimized vector store retrieval.
    """
    
    # Define the prompt template for question rewriting
    re_write_prompt = PromptTemplate(
        template="""Esate klausimų perrašytojas, kurio specializacija yra Lietuvos teisė, tobulinanti klausimus, kad būtų galima optimizuoti jų paiešką iš teisinių dokumentų. Jūsų tikslas – išaiškinti teisinę intenciją, pašalinti dviprasmiškumą ir pakoreguoti formuluotes taip, kad jos atspindėtų teisinę kalbą, daugiausia dėmesio skiriant atitinkamiems raktiniams žodžiams. Daryk tai apstrakciai, kadangi taip efektyviausai gaunama informacija iš vectorstore.

Klausimas turi būti kiek įmanoma abstraktesnis. Kuo abstrakčiau tuo geresnis informacijos išgavimas.
Man nereikia paaiškinimų, tik perrašyto klausimo.
pvz:
Klausimas : Asmens dokumento paemimas svetimo asmens?
Atsakymas: Svetimo asmens dokumento pasisavinimas

Štai pradinis klausimas: \n\n {question}. Patobulintas klausimas be paaiškinimų : \n""",
        input_variables=["question"],
    )
    
    # Combine the prompt with the LLM and output parser
    question_rewriter = re_write_prompt | llm | StrOutputParser()

    # Return the question rewriter object
    return question_rewriter


def transform_query(state, question_rewriter):
    """
    Transform the query to produce a better question.
    Args:
        state (dict): The current graph state
    Returns:
        state (dict): Updates question key with a re-phrased question
    """

    print("---TRANSFORM QUERY---")
    question = state["question"]
    documents = state["documents"]
    steps = state["steps"]
    steps.append("question_transformation")
    generation_count = state["generation_count"]
    
    generation_count = 0

    # Re-write question
    better_question = question_rewriter.invoke({"question": question})
    print(f" Transformed question:  {better_question}")
    return {"documents": documents, "question": better_question,"generation_count": generation_count}



def format_google_results_search(google_results):
    formatted_documents = []

    # Extract data from answerBox
    answer_box = google_results.get("answerBox", {})
    answer_box_title = answer_box.get("title", "No title")
    answer_box_answer = answer_box.get("answer", "No text")

   

    

    # Extract and add organic results as separate Documents
    for result in google_results.get("organic", []):
        title = result.get("title", "No title")
        link = result.get("link", "Nėra svetainės adreso")
        snippet = result.get("snippet", "No snippet available")
        

        document = Document(
            metadata={
                "Organinio rezultato pavadinimas": title,
                
            },
            page_content=(
                f"Pavadinimas: {title}     "
                f"Straipsnio ištrauka: {snippet}     "
                f"Nuoroda: {link}      "
                
            )
        )
        formatted_documents.append(document)

    return formatted_documents



def format_google_results_news(google_results):
    formatted_documents = []
    
    # Loop through each organic result and create a Document for it
    for result in google_results['organic']:
        title = result.get('title', 'No title')
        link = result.get('link', 'No link')
        descripsion = result.get('description', 'No link')
        snippet = result.get('snippet', 'No summary available')
        text = result.get('text' , 'no text')

        # Create a Document object with similar metadata structure to WikipediaRetriever
        document = Document(
            metadata={
                'Title': title,
                'Description': descripsion,
                'Text' : text,
                'Snippet': snippet,
                'Source': link
            },
            page_content=snippet  # Using the snippet as the page content
        )
        
        formatted_documents.append(document)
    
    return formatted_documents


def QA_chain(llm):
    """
    Creates a question-answering chain using the provided language model.
    Args:
        llm: The language model to use for generating answers.
    Returns:
        An LLMChain configured with the question-answering prompt and the provided model.
    """
    # Define the prompt template
    prompt = PromptTemplate(
        template="""Esi teisės asistentas, turintis prieigą prie naujausios informacijos iš Lietuvos teisės kodeksų bei interneto šaltinių. 
        
        Tau pateikiamos teisės kodeksų ištraukos yra naujausios redakcijos ir neginčijamos susijusios su klausimu.
        Klausimai yra susije su  Lietuvos teise ir dokumentai iš lietuvos teises šaltinių. 
        Tavo užduotis yra paaiškinti, atsakyti  išsamiai ir tuo pačiu glaustai į klausimą: {question}, remiantis pateiktais dokumentais: {documents}, tau šitų dokumentų turi užtekti, jei vartotojas matys kad atsakymas per mažas ar informacijos per mažai, jis padidint informacijos kiekį.
        Turi suformuluoti atsakymą pagal pateiktus dokumentus ir tau jų turi užtekti. 
        
        Atsakyk tik remdamasis pateiktais dokumentais. Jei atsakymo negalima rasti dokumentuose, pasakyk, iš kur žinai atsakymą. 
        Jei negali atsakyti į klausimą, pasakyk: „Atsiprašau, nežinau atsakymo į jūsų klausimą.“ 
        Nepateik papildomų klausimų ir nesikartok atsakyme.
        
        Atsakymas:
        """,
        input_variables=["question", "documents"],
    )

    rag_chain = prompt | llm | StrOutputParser()
    
    return rag_chain


def grade_generation_v_documents_and_question(state, hallucination_grader):
    """
    Determines whether the generation is grounded in the document and answers the question.
    """
    print("---CHECK HALLUCINATIONS---")
    question = state.get("question")
    documents = state.get("documents")
    generation = state.get("generation")
    generation_count = state.get("generation_count", 0)  # Default to 0 if not provided

    print(f"Generation number: {generation_count}")

    # Grading hallucinations
    score = hallucination_grader.invoke(
        {"documents": documents, "generation": generation, "question": question}
    )
    grade = getattr(score, "score", None)

    # Check hallucination
    if grade in {"taip", "Taip", "yes", "Yes"}:
        print("---DECISION: GENERATION IS GROUNDED IN DOCUMENTS---")
        # Check question-answering
        print("---GRADE GENERATION vs QUESTION---")
        return "useful"
    elif generation_count > 1:
        print("---DECISION: GENERATION IS NOT GROUNDED IN DOCUMENTS, TRANSFORM QUERY---")
        return "transform query"
    else:
        print("---DECISION: GENERATION DOES NOT ADDRESS QUESTION---")
        return "retry"
        
    

def ask_question(state):
    """
    Initialize question
    Args:
        state (dict): The current graph state
    Returns:
        state (dict): Question
    """
    steps = state["steps"]
    question = state["question"]
    generations_count = state.get("generations_count", 0) 
    
    
    steps.append("question_asked")
    return {"question": question, "steps": steps,"generation_count": generations_count}
        
        
def retrieve(state, vectorstore, k, search_type):
    """
    Retrieve documents based on the processed question.
    """
    steps = state["steps"]
    sub_questions = state.get("sub_questions")
    processed_question = state.get("processed_question")
    question = state["question"]

    if sub_questions is None:
        if processed_question is not None:
            basic_retriever = vectorstore.as_retriever(
                search_type=search_type,
                search_kwargs={"k": k}
            )
            

# Instruction-based retriever
            instruct_retriever = InstructRetriever(
                base_retriever=basic_retriever,
                task_description=task_description
            )
            documents = instruct_retriever.invoke(processed_question)

            steps.append("retrieve_documents")
            return {
                "documents": documents,
                "steps": steps
            }
        else:
            basic_retriever = vectorstore.as_retriever(
                search_type=search_type,
                search_kwargs={"k": k}
            )
            instruct_retriever = InstructRetriever(
                base_retriever=basic_retriever,
                task_description=task_description
            )
            documents = instruct_retriever.invoke(question)

            steps.append("retrieve_documents")
            return {
                "documents": documents,
                "steps": steps
            }
    else:
        documents = []
        import math
        
        k = math.ceil(k / 2)
        retriever = vectorstore.as_retriever(
            search_type=search_type,
            search_kwargs={"k": k}
        )
        
        for q in sub_questions:
            # Ensure each sub-question is a string
            if not isinstance(q, str):
                raise TypeError(f"Each sub-question must be a string, got {type(q)} for question: {q}")
            
            document = retriever.invoke(q)
            documents.extend(document)  # Append the documents retrieved for this sub-question

        steps.append("retrieve_documents")
        return {
            "documents": documents,
            "steps": steps
        }


def generate(state,QA_chain):
    """
    Generate answer
    """
    question = state["question"]
    documents = state["documents"]
    generation = QA_chain.invoke({"documents": documents, "question": question})
    steps = state["steps"]
    steps.append("generate_answer")
    generation_count = state["generation_count"]
    
    generation_count += 1
        
    return {
        "documents": documents,
        "question": question,
        "generation": generation,
        "steps": steps,
        "generation_count": generation_count  # Include generation_count in return
    }


def grade_documents(state, retrieval_grader):
    question = state["question"]
    documents = state["documents"]
    decomposed_documents = state.get('decomposed_documents')
    steps = state["steps"]
    steps.append("grade_document_retrieval")
    
    filtered_docs = []
    web_results_list = []
    search = "No"
    
    if decomposed_documents is None:


        for d in documents:
             # Call the grading function
            score = retrieval_grader.invoke({"question": question, "documents": d})
            print(f"Grader output for document: {score}")  # Detailed debugging output
        
        # Extract the grade
            grade = getattr(score, 'binary_score', None)
            if grade and grade.lower() in ["yes", "true", "1",'taip']:
                filtered_docs.append(d)
            elif len(filtered_docs) < 4:  
                search = "Yes"
            
    # Check the decision-making process
        print(f"Final decision - Perform web search: {search}")
        print(f"Filtered documents count: {len(filtered_docs)}")
    
        

    else:
        # Handle decomposed documents (dictionary with question-document pairs)
        for q, d in decomposed_documents.items():
            # Call the grading function
            score = retrieval_grader.invoke({"question": q, "documents": d})
            print(f"Grader output for question '{q}' and document: {score}")  # Debugging output

            # Extract the grade
            grade = getattr(score, 'binary_score', None)
            if grade and grade.lower() in ["yes", "true", "1", 'taip']:
                filtered_docs.append(d)
            elif len(filtered_docs) < 4:  
                search = "Yes"


            



        # Debugging output
        print(f"Final decision - Perform web search: {search}")
        print(f"Filtered decomposed documents count: {len(filtered_docs)}")


    return {
            "documents": filtered_docs,
            "question": question,
            "search": search,
            "steps": steps,
        }    
    
    


def clean_exa_document(doc):
    """
    Extracts and retains only the title, url, text, and summary from the exa result document.
    """
    return {
        "Pavadinimas:    ": doc.title,
        "        Straipnsio internetinis adresas:    ": doc.url,
        "Tekstas:    ": doc.text,
        "                                   Apibendrinimas:    ": doc.summary,
    }

def web_search(state):
    question = state["question"]
    documents = state.get("documents", [])
    steps = state["steps"]
    steps.append("web_search")
    k = 8 - len(documents)
    web_results_list = []

    # Fetch results from exa
    exa_results_raw = exa.search_and_contents(
        query=question,
        #start_published_date="2020-01-01T22:00:01.000Z",

        type="keyword",
        num_results=2,
        text={"max_characters": 1000},
        summary={
            "query": "Tell in summary a meaning about what is article written. Provide facts, be concise. Do it in Lithuanian language."
        },
      
        include_domains=[ "infolex.lt", "vmi.lt", "lrs.lt", "e-seimas.lrs.lt", "teise.pro",'lt.wikipedia.org', 'teismai.lt' ],
        
    )
    # Extract results
    exa_results = exa_results_raw.results if hasattr(exa_results_raw, "results") else []
    cleaned_exa_results = [clean_exa_document(doc) for doc in exa_results]
    print(cleaned_exa_results)
    
  
    #web_results = GoogleSerperAPIWrapper(k=2, gl="lt", hl="lt", type="search").results(question)
    #print(web_results)
    #formatted_documents = format_google_results_search(web_results)
    #web_results_list.extend(formatted_documents if isinstance(formatted_documents, list) else [formatted_documents])

    combined_documents = documents + cleaned_exa_results 
    

    return {"documents": combined_documents, "question": question, "steps": steps}

def decide_to_generate(state):
    """
    Determines whether to generate an answer, or re-generate a question.
    Args:
        state (dict): The current graph state
    Returns:
        str: Binary decision for next node to call
    """
    search = state["search"]
    if search == "Yes":
        return "search"
    else:
        return "generate"
    
def decide_to_generate2(state):
    """
    Determines whether to generate an answer, or re-generate a question.
    Args:
        state (dict): The current graph state
    Returns:
        str: Binary decision for next node to call
    """
    search = state["search"]
    if search == "Yes":
        return "search"
    else:
        return "generate"
    


# Helper function to add instructions to the query
def get_detailed_instruct(task_description: str, query: str) -> str:
    """Format a query with a task description to guide the model."""
    return f'Instruct: {task_description}\nQuery: {query}'

# Custom Retriever class with instruction-augmented queries
class InstructRetriever(BaseRetriever):
    """Retriever that adds instruction to queries before retrieval."""
    
    base_retriever: BaseRetriever = Field(...)
    task_description: str = Field(...)

    def _get_relevant_documents(self, query: str) -> List[Document]:
        """Add instruction to the query before passing to the base retriever."""
        formatted_query = get_detailed_instruct(self.task_description, query)
        return self.base_retriever.invoke(formatted_query)


def check_chit_chat(state, llm):
    """
    Classifies the query as 'chit_chat' or 'work_related'.
    Simple version without using structured output which causes Groq API issues.
    """
    question = state["question"]
    steps = state["steps"]
    steps.append("Chit Chat check")
    logger.info(f"Checking if query is chit-chat: '{question}'")
    
    # Quick dictionary check first for common greetings
    CHIT_CHAT_PATTERNS = [
        "labas", "hi", "hello", "sveiki", "laba diena", "kaip sekasi", 
        "how are you", "sveikas", "heyo", "hey", "hola"
    ]
    
    # Check if the question contains any chit-chat patterns
    question_lower = question.lower().strip()
    for pattern in CHIT_CHAT_PATTERNS:
        if pattern in question_lower or question_lower == pattern:
            logger.info(f"Query '{question}' matched chit-chat pattern: {pattern}")
            return "chit_chat"
    
    # For more complex classification, use a simpler prompt approach
    prompt = PromptTemplate(
        template="""You are an expert classifier. Your task is to determine if a user's query is simple chit-chat or a substantive question.

Chit-chat includes greetings (like hi, hello, labas, sveiki), simple pleasantries (like how are you?, kaip sekasi?), and other non-work-related small talk.

Substantive questions are those asking about work rights, labor law, or specific employment situations.

User query: {question}

Respond with ONLY ONE WORD: either "chit_chat" or "work_related".
""",
        input_variables=["question"],
    )
    
    # Use a simple chain with string output
    chit_chat_checker = prompt | llm | StrOutputParser()
    
    try:
        # Get the classification result
        result = chit_chat_checker.invoke({"question": question})
        logger.info(f"LLM classification result for '{question}': {result}")
        
        # Clean up and normalize the result
        result = result.lower().strip()
        
        if "chit" in result or "chat" in result or result.startswith("chit"):
            logger.info("Query classified as: chit_chat")
            return "chit_chat"
        else:
            logger.info("Query classified as: work_related")
            return "work_related"
            
    except Exception as e:
        logger.error(f"Error during chit-chat classification: {e}", exc_info=True)
        # Default to work_related on error
        return "work_related"
    


def answer_chit_chat(state, llm):
    """
    Generates a simple response for chit-chat queries.
    """
    question = state["question"]
    steps = state["steps"]
    steps.append("answer_chit_chat")
    logger.info(f"Answering chit-chat: '{question}'")
    
    # Quick dictionary lookup for common greetings
    CHIT_CHAT_RESPONSES = {
        "labas": "Labas! Kuo galėčiau padėti?",
        "hi": "Hi! How can I assist you?",
        "hello": "Hello! How can I help you today?",
        "sveiki": "Sveiki! Kuo galėčiau jums padėti?",
        "laba diena": "Laba diena! Kuo galėčiau padėti?",
        "kaip sekasi?": "Man sekasi puikiai! O kaip jums? Kuo galėčiau padėti?",
        "how are you?": "I'm doing well, thank you! How can I assist you?",
    }
    
    # Try to find direct match in dictionary
    question_lower = question.lower().strip()
    response = CHIT_CHAT_RESPONSES.get(question_lower)
    
    # If no direct match, use the LLM
    if not response:
        logger.info("No direct dictionary response, generating with LLM...")
        prompt = PromptTemplate(
            template="""You are a friendly assistant. Respond naturally to this casual greeting or small talk.
Respond in the same language as the user's message. Keep your response friendly, brief and conversational.
Add a prompt encouraging the user to ask about work-related legal questions since you're specialized in Lithuanian labor law.

User message: {question}

Your response:""",
            input_variables=["question"],
        )
        
        chit_chat_chain = prompt | llm | StrOutputParser()
        
        try:
            response = chit_chat_chain.invoke({"question": question})
        except Exception as e:
            logger.error(f"Error generating chit-chat response: {e}", exc_info=True)
            response = "Atsiprašau, įvyko klaida. Kuo galėčiau padėti?"
    
    logger.info(f"Generated chit-chat response: '{response}'")
    
    # Return updated state with the generation
    return {
        "question": question,
        "generation": response,
        "steps": steps,
        "documents": [] # Empty documents for chit-chat
    }


def create_hallucination_checker(llm):
    """
    Function to create a hallucination checker object using a passed LLM model.
    
    Args:
        llm: The language model to be used for checking hallucinations in the student's answer.
        
    Returns:
        Callable: A pipeline function that checks if the student's answer contains hallucinations.
    """
    

    class hallucination_checker(BaseModel):
        """Binary score for toxicity check on question."""
        score: str = Field(
            description="Ar atsakymas yra naudingas?, 'taip' arba 'ne'"
        )
    
    # Create the structured LLM toxicity checker using the passed LLM
    
    
    
    structured_llm_hallucination_checker = llm.with_structured_output(hallucination_checker)

    # Define the prompt template
    prompt = PromptTemplate(
    template="""Jūs esate profesionalus vertintojas. 
    Jūsų užduotis – patikrinti, ar ATSAKYMAS atsako į pateiktą KLAUSIMĄ. 
    
    
    Rezultatas:
    - „Taip“: Atsakymas atsako į klausimą 
    - „Ne“: Atsakymas neatsako į klausimą 

    ATSAKYMAS: {generation}
    KLAUSIMAS: {question}
    
    Grąžinkite rezultatą JSON formatu:
    ```json
    {{
        "balu": "taip" arba "ne"
    }}
    ```""",
    input_variables=["generation", "question"],
)
    
    # Combine the prompt with the structured LLM hallucination checker
    hallucination_grader = prompt | structured_llm_hallucination_checker

    # Return the hallucination checker object
    return hallucination_grader


def create_question_rewriter(llm):
    """
    Function to create a question rewriter object using a passed LLM model.
    
    Args:
        llm: The language model to be used for rewriting questions.
        
    Returns:
        Callable: A pipeline function that rewrites questions for optimized vector store retrieval.
    """
    
    # Define the prompt template for question rewriting
    re_write_prompt = PromptTemplate(
        template="""Esate klausimų perrašytojas, kurio specializacija yra Lietuvos teisė, tobulinanti klausimus, kad būtų galima optimizuoti jų paiešką iš teisinių dokumentų. Jūsų tikslas – išaiškinti teisinę intenciją, pašalinti dviprasmiškumą ir pakoreguoti formuluotes taip, kad jos atspindėtų teisinę kalbą, daugiausia dėmesio skiriant atitinkamiems raktiniams žodžiams. Daryk tai apstrakciai, kadangi taip efektyviausai gaunama informacija iš vectorstore.

Klausimas turi būti kiek įmanoma abstraktesnis. Kuo abstrakčiau tuo geresnis informacijos išgavimas.
Man nereikia paaiškinimų, tik perrašyto klausimo.
pvz:
Klausimas : Asmens dokumento paemimas svetimo asmens?
Atsakymas: Svetimo asmens dokumento pasisavinimas

Štai pradinis klausimas: \n\n {question}. Patobulintas klausimas be paaiškinimų : \n""",
        input_variables=["question"],
    )
    
    # Combine the prompt with the LLM and output parser
    question_rewriter = re_write_prompt | llm | StrOutputParser()

    # Return the question rewriter object
    return question_rewriter


def transform_query(state, question_rewriter):
    """
    Transform the query to produce a better question.
    Args:
        state (dict): The current graph state
    Returns:
        state (dict): Updates question key with a re-phrased question
    """

    print("---TRANSFORM QUERY---")
    question = state["question"]
    documents = state["documents"]
    steps = state["steps"]
    steps.append("question_transformation")
    generation_count = state["generation_count"]
    
    generation_count = 0

    # Re-write question
    better_question = question_rewriter.invoke({"question": question})
    print(f" Transformed question:  {better_question}")
    return {"documents": documents, "question": better_question,"generation_count": generation_count}



def format_google_results_search(google_results):
    formatted_documents = []

    # Extract data from answerBox
    answer_box = google_results.get("answerBox", {})
    answer_box_title = answer_box.get("title", "No title")
    answer_box_answer = answer_box.get("answer", "No text")

   

    

    # Extract and add organic results as separate Documents
    for result in google_results.get("organic", []):
        title = result.get("title", "No title")
        link = result.get("link", "Nėra svetainės adreso")
        snippet = result.get("snippet", "No snippet available")
        

        document = Document(
            metadata={
                "Organinio rezultato pavadinimas": title,
                
            },
            page_content=(
                f"Pavadinimas: {title}     "
                f"Straipsnio ištrauka: {snippet}     "
                f"Nuoroda: {link}      "
                
            )
        )
        formatted_documents.append(document)

    return formatted_documents



def format_google_results_news(google_results):
    formatted_documents = []
    
    # Loop through each organic result and create a Document for it
    for result in google_results['organic']:
        title = result.get('title', 'No title')
        link = result.get('link', 'No link')
        descripsion = result.get('description', 'No link')
        snippet = result.get('snippet', 'No summary available')
        text = result.get('text' , 'no text')

        # Create a Document object with similar metadata structure to WikipediaRetriever
        document = Document(
            metadata={
                'Title': title,
                'Description': descripsion,
                'Text' : text,
                'Snippet': snippet,
                'Source': link
            },
            page_content=snippet  # Using the snippet as the page content
        )
        
        formatted_documents.append(document)
    
    return formatted_documents


def QA_chain(llm):
    """
    Creates a question-answering chain using the provided language model.
    Args:
        llm: The language model to use for generating answers.
    Returns:
        An LLMChain configured with the question-answering prompt and the provided model.
    """
    # Define the prompt template
    prompt = PromptTemplate(
        template="""Esi teisės asistentas, turintis prieigą prie naujausios informacijos iš Lietuvos teisės kodeksų bei interneto šaltinių. 
        
        Tau pateikiamos teisės kodeksų ištraukos yra naujausios redakcijos ir neginčijamos susijusios su klausimu.
        Klausimai yra susije su  Lietuvos teise ir dokumentai iš lietuvos teises šaltinių. 
        Tavo užduotis yra paaiškinti, atsakyti  išsamiai ir tuo pačiu glaustai į klausimą: {question}, remiantis pateiktais dokumentais: {documents}, tau šitų dokumentų turi užtekti, jei vartotojas matys kad atsakymas per mažas ar informacijos per mažai, jis padidint informacijos kiekį.
        Turi suformuluoti atsakymą pagal pateiktus dokumentus ir tau jų turi užtekti. 
        
        Atsakyk tik remdamasis pateiktais dokumentais. Jei atsakymo negalima rasti dokumentuose, pasakyk, iš kur žinai atsakymą. 
        Jei negali atsakyti į klausimą, pasakyk: „Atsiprašau, nežinau atsakymo į jūsų klausimą.“ 
        Nepateik papildomų klausimų ir nesikartok atsakyme.
        
        Atsakymas:
        """,
        input_variables=["question", "documents"],
    )

    rag_chain = prompt | llm | StrOutputParser()
    
    return rag_chain


def grade_generation_v_documents_and_question(state, hallucination_grader):
    """
    Determines whether the generation is grounded in the document and answers the question.
    """
    print("---CHECK HALLUCINATIONS---")
    question = state.get("question")
    documents = state.get("documents")
    generation = state.get("generation")
    generation_count = state.get("generation_count", 0)  # Default to 0 if not provided

    print(f"Generation number: {generation_count}")

    # Grading hallucinations
    score = hallucination_grader.invoke(
        {"documents": documents, "generation": generation, "question": question}
    )
    grade = getattr(score, "score", None)

    # Check hallucination
    if grade in {"taip", "Taip", "yes", "Yes"}:
        print("---DECISION: GENERATION IS GROUNDED IN DOCUMENTS---")
        # Check question-answering
        print("---GRADE GENERATION vs QUESTION---")
        return "useful"
    elif generation_count > 1:
        print("---DECISION: GENERATION IS NOT GROUNDED IN DOCUMENTS, TRANSFORM QUERY---")
        return "transform query"
    else:
        print("---DECISION: GENERATION DOES NOT ADDRESS QUESTION---")
        return "retry"
        
    

def ask_question(state):
    """
    Initialize question
    Args:
        state (dict): The current graph state
    Returns:
        state (dict): Question
    """
    steps = state["steps"]
    question = state["question"]
    generations_count = state.get("generations_count", 0) 
    
    
    steps.append("question_asked")
    return {"question": question, "steps": steps,"generation_count": generations_count}
        
        
def retrieve(state, vectorstore, k, search_type):
    """
    Retrieve documents based on the processed question.
    """
    steps = state["steps"]
    sub_questions = state.get("sub_questions")
    processed_question = state.get("processed_question")
    question = state["question"]

    if sub_questions is None:
        if processed_question is not None:
            basic_retriever = vectorstore.as_retriever(
                search_type=search_type,
                search_kwargs={"k": k}
            )
            

# Instruction-based retriever
            instruct_retriever = InstructRetriever(
                base_retriever=basic_retriever,
                task_description=task_description
            )
            documents = instruct_retriever.invoke(processed_question)

            steps.append("retrieve_documents")
            return {
                "documents": documents,
                "steps": steps
            }
        else:
            basic_retriever = vectorstore.as_retriever(
                search_type=search_type,
                search_kwargs={"k": k}
            )
            instruct_retriever = InstructRetriever(
                base_retriever=basic_retriever,
                task_description=task_description
            )
            documents = instruct_retriever.invoke(question)

            steps.append("retrieve_documents")
            return {
                "documents": documents,
                "steps": steps
            }
    else:
        documents = []
        import math
        
        k = math.ceil(k / 2)
        retriever = vectorstore.as_retriever(
            search_type=search_type,
            search_kwargs={"k": k}
        )
        
        for q in sub_questions:
            # Ensure each sub-question is a string
            if not isinstance(q, str):
                raise TypeError(f"Each sub-question must be a string, got {type(q)} for question: {q}")
            
            document = retriever.invoke(q)
            documents.extend(document)  # Append the documents retrieved for this sub-question

        steps.append("retrieve_documents")
        return {
            "documents": documents,
            "steps": steps
        }


def generate(state,QA_chain):
    """
    Generate answer
    """
    question = state["question"]
    documents = state["documents"]
    generation = QA_chain.invoke({"documents": documents, "question": question})
    steps = state["steps"]
    steps.append("generate_answer")
    generation_count = state["generation_count"]
    
    generation_count += 1
        
    return {
        "documents": documents,
        "question": question,
        "generation": generation,
        "steps": steps,
        "generation_count": generation_count  # Include generation_count in return
    }


def grade_documents(state, retrieval_grader):
    question = state["question"]
    documents = state["documents"]
    decomposed_documents = state.get('decomposed_documents')
    steps = state["steps"]
    steps.append("grade_document_retrieval")
    
    filtered_docs = []
    web_results_list = []
    search = "No"
    
    if decomposed_documents is None:


        for d in documents:
             # Call the grading function
            score = retrieval_grader.invoke({"question": question, "documents": d})
            print(f"Grader output for document: {score}")  # Detailed debugging output
        
        # Extract the grade
            grade = getattr(score, 'binary_score', None)
            if grade and grade.lower() in ["yes", "true", "1",'taip']:
                filtered_docs.append(d)
            elif len(filtered_docs) < 4:  
                search = "Yes"
            
    # Check the decision-making process
        print(f"Final decision - Perform web search: {search}")
        print(f"Filtered documents count: {len(filtered_docs)}")
    
        

    else:
        # Handle decomposed documents (dictionary with question-document pairs)
        for q, d in decomposed_documents.items():
            # Call the grading function
            score = retrieval_grader.invoke({"question": q, "documents": d})
            print(f"Grader output for question '{q}' and document: {score}")  # Debugging output

            # Extract the grade
            grade = getattr(score, 'binary_score', None)
            if grade and grade.lower() in ["yes", "true", "1", 'taip']:
                filtered_docs.append(d)
            elif len(filtered_docs) < 4:  
                search = "Yes"


            



        # Debugging output
        print(f"Final decision - Perform web search: {search}")
        print(f"Filtered decomposed documents count: {len(filtered_docs)}")


    return {
            "documents": filtered_docs,
            "question": question,
            "search": search,
            "steps": steps,
        }    
    
    


def clean_exa_document(doc):
    """
    Extracts and retains only the title, url, text, and summary from the exa result document.
    """
    return {
        "Pavadinimas:    ": doc.title,
        "        Straipnsio internetinis adresas:    ": doc.url,
        "Tekstas:    ": doc.text,
        "                                   Apibendrinimas:    ": doc.summary,
    }

def web_search(state):
    question = state["question"]
    documents = state.get("documents", [])
    steps = state["steps"]
    steps.append("web_search")
    k = 8 - len(documents)
    web_results_list = []

    # Fetch results from exa
    exa_results_raw = exa.search_and_contents(
        query=question,
        #start_published_date="2020-01-01T22:00:01.000Z",

        type="keyword",
        num_results=2,
        text={"max_characters": 1000},
        summary={
            "query": "Tell in summary a meaning about what is article written. Provide facts, be concise. Do it in Lithuanian language."
        },
        include_domains=[ "infolex.lt", "vmi.lt", "lrs.lt", "e-seimas.lrs.lt", "teise.pro",'lt.wikipedia.org', 'teismai.lt' ],
        
    )
    # Extract results
    exa_results = exa_results_raw.results if hasattr(exa_results_raw, "results") else []
    cleaned_exa_results = [clean_exa_document(doc) for doc in exa_results]
    print(cleaned_exa_results)
    
  
    #web_results = GoogleSerperAPIWrapper(k=2, gl="lt", hl="lt", type="search").results(question)
    #print(web_results)
    #formatted_documents = format_google_results_search(web_results)
    #web_results_list.extend(formatted_documents if isinstance(formatted_documents, list) else [formatted_documents])

    combined_documents = documents + cleaned_exa_results 
    

    return {"documents": combined_documents, "question": question, "steps": steps}

def decide_to_generate(state):
    """
    Determines whether to generate an answer, or re-generate a question.
    Args:
        state (dict): The current graph state
    Returns:
        str: Binary decision for next node to call
    """
    search = state["search"]
    if search == "Yes":
        return "search"
    else:
        return "generate"
    
def decide_to_generate2(state):
    """
    Determines whether to generate an answer, or re-generate a question.
    Args:
        state (dict): The current graph state
    Returns:
        str: Binary decision for next node to call
    """
    search = state["search"]
    if search == "Yes":
        return "search"
    else:
        return "generate"
    


# Helper function to add instructions to the query
def get_detailed_instruct(task_description: str, query: str) -> str:
    """Format a query with a task description to guide the model."""
    return f'Instruct: {task_description}\nQuery: {query}'

# Custom Retriever class with instruction-augmented queries
class InstructRetriever(BaseRetriever):
    """Retriever that adds instruction to queries before retrieval."""
    
    base_retriever: BaseRetriever = Field(...)
    task_description: str = Field(...)

    def _get_relevant_documents(self, query: str) -> List[Document]:
        """Add instruction to the query before passing to the base retriever."""
        formatted_query = get_detailed_instruct(self.task_description, query)
        return self.base_retriever.invoke(formatted_query)
    



class ContextualizedUserQuery(BaseModel):
    """Structure for a contextualized user query."""
    rewritten_question: str = Field(description="The rewritten question based on chat history and context")
    has_context: bool = Field(description="Whether this question has relevant context from previous exchanges")

# Define the prompt template for contextualization
contextualize_query_prompt = ChatPromptTemplate.from_messages([
    ("system", """As a legal assistant specializing in Lithuanian labor law, your task is to contextualize the user's current question based on the chat history.
If the current question refers to previous context or builds on previous questions, incorporate that context to make a self-contained question.
If the current question stands alone and doesn't need previous context, simply leave it as is.
Only modify the question if it clearly references something from the chat history that would make it unclear on its own."""),
    ("human", """Chat History:
{chat_history}

Current Question: {question}

Provide a structured response with:
1. The rewritten, contextualized question (or the original if no contextualization is needed)
2. Whether this question has relevant context from previous exchanges (true/false)"""),
])

# Define the contextualization function
def contextualize_user_query(state, llm):
    """
    Contextualizes the user query based on chat history (if available).
    """
    question = state["question"]
    steps = state["steps"]
    steps.append("contextualize_user_query")
    
    # Get chat history if available
    chat_history = state.get("chat_history", [])
    
    # If no chat history, skip contextualization
    if not chat_history:
        logger.info("No chat history available, skipping contextualization")
        return {
            "question": question,
            "steps": steps
        }
    
    logger.info(f"Contextualizing query with chat history of {len(chat_history)} messages")
    
    # Use structured output
    structured_output = llm.with_structured_output(ContextualizedUserQuery)
    
    # Create the chain
    contextualization_chain = (
        {
            "question": lambda x: x["question"],
            "chat_history": lambda x: x["chat_history"],
        }
        | contextualize_query_prompt
        | structured_output
    )
    
    try:
        # Get the contextualized query
        result = contextualization_chain.invoke({
            "question": question,
            "chat_history": chat_history
        })
        
        if result.has_context:
            logger.info(f"Contextualized query: '{result.rewritten_question}'")
            return {
                "question": result.rewritten_question,  # Replace the original question
                "original_question": question,  # Store the original for reference
                "steps": steps
            }
        else:
            logger.info("No contextualization needed")
            return {
                "question": question,
                "steps": steps
            }
    except Exception as e:
        logger.error(f"Error contextualizing query: {e}", exc_info=True)
        # On error, use the original question
        return {
            "question": question,
            "steps": steps
        }    



