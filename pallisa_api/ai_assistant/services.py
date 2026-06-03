from langchain_groq import ChatGroq
from langchain_community.agent_toolkits import create_sql_agent
from langchain_community.utilities import SQLDatabase
from langchain_core.messages import AIMessage
import os
from django.conf import settings

class DatabaseAssistant:
    def __init__(self):
        from decouple import config
        api_key = config("GROQ_API_KEY", default="")
        if not api_key:
            raise ValueError("GROQ_API_KEY environment variable is not set")
        os.environ["GROQ_API_KEY"] = api_key
            
        db_path = settings.DATABASES['default']['NAME']
        db_uri = f"sqlite:///{db_path}"
        
        core_tables = [
            'accounts_customuser', 'accounts_school', 'accounts_userprofile',
            'members_student', 'members_teacher', 'members_parent',
            'members_class', 'members_stream', 'members_subject',
            'exams_exam', 'exams_activityofintegration',
            'expenses_expense', 'expenses_term', 'expenses_academicyear',
            'fees_feepayment', 'fees_feestructure'
        ]
        self.db = SQLDatabase.from_uri(db_uri, include_tables=core_tables, sample_rows_in_table_info=0)
        
        self.llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0)
        
        # We need a custom prompt for the query chain to give the LLM hints about our specific Django schema
        from langchain.chains import create_sql_query_chain
        from langchain_core.prompts import PromptTemplate
        
        template = '''You are a SQLite expert. Given an input question, first create a syntactically correct SQLite query to run, then look at the results of the query and return the answer to the input question.
Unless the user specifies in the question a specific number of examples to obtain, query for at most {top_k} results using the LIMIT clause as per SQLite. You can order the results to return the most informative data in the database.
Never query for all columns from a table. You must query only the columns that are needed to answer the question. Wrap each column name in double quotes (") to denote them as delimited identifiers.
Pay attention to use only the column names you can see in the tables below. Be careful to not query for columns that do not exist. Also, pay attention to which column is in which table.
Pay attention to use date('now') function to get the current date, if the question involves "today".

IMPORTANT SCHEMA HINTS:
- The `members_student` table DOES NOT have a `name` or `first_name` column.
- To get a student's name, you must join `members_student` to `accounts_userprofile` (on user_profile_id = accounts_userprofile.id), and then join `accounts_userprofile` to `accounts_customuser` (on user_id = accounts_customuser.id).
- The student's name is `accounts_customuser.first_name` and `accounts_customuser.last_name`.
- The same applies to `members_teacher` and `members_parent`.

Use the following format:
Question: Question here
SQLQuery: SQL Query to run
SQLResult: Result of the SQLQuery
Answer: Final answer here

Only use the following tables:
{table_info}

Question: {input}'''
        
        prompt = PromptTemplate.from_template(template)
        
        from langchain_community.tools.sql_database.tool import QuerySQLDataBaseTool
        from operator import itemgetter
        from langchain_core.output_parsers import StrOutputParser
        from langchain_core.runnables import RunnablePassthrough
        
        self.execute_query = QuerySQLDataBaseTool(db=self.db)
        self.write_query = create_sql_query_chain(self.llm, self.db, prompt=prompt)
        
        import re
        from langchain_core.runnables import RunnableLambda
        def clean_sql(query: str) -> str:
            q = re.sub(r'```(?:sql)?', '', query)
            q = re.sub(r'```', '', q)
            if 'SQLQuery:' in q:
                q = q.split('SQLQuery:')[1]
            return q.strip()
            
        clean_sql_runnable = RunnableLambda(clean_sql)
        
        self.answer_prompt = PromptTemplate.from_template(
            """Given the following user question, corresponding SQL query, and SQL result, answer the user question.
            Keep your answer professional, concise, and helpful. Do not output raw JSON or python unless explicitly requested.
            If the SQL Result says "Error:", explain that you couldn't retrieve the data due to a database issue.

Question: {question}
SQL Query: {query}
SQL Result: {result}
Answer: """
        )
        
        self.answer_chain = self.answer_prompt | self.llm | StrOutputParser()
        self.clean_sql = clean_sql_runnable

    def stream(self, question: str):
        try:
            query = ""
            result = ""
            current_question = question
            
            # Self-correcting Retry Loop (up to 3 tries)
            for attempt in range(3):
                # 1. Generate SQL
                raw_query = self.write_query.invoke({"question": current_question})
                query = self.clean_sql.invoke(raw_query)
                
                # 2. Execute SQL
                try:
                    result = self.execute_query.invoke(query)
                    if isinstance(result, str) and result.startswith("Error:"):
                        # Feed the error back into the prompt so the LLM can fix it on the next loop
                        current_question = f"{question}\n\nNote: Your previous query `{query}` failed with error: {result}. Please write a completely different and correct SQL query."
                        continue
                    else:
                        break # Success!
                except Exception as db_error:
                    result = f"Error: {db_error}"
                    current_question = f"{question}\n\nNote: Your previous query `{query}` failed with error: {result}. Please write a completely different and correct SQL query."
                    continue

            # 3. Stream the final human-readable answer
            for chunk in self.answer_chain.stream({"question": question, "query": query, "result": result}):
                if chunk:
                    yield chunk
                    
        except Exception as e:
            print(f"AI Assistant Error: {e}")
            yield f"\n[Error: {str(e)}]"
