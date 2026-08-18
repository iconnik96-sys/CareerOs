import math
import re
import hashlib
from typing import List, Dict, Any, Optional

# =====================================================================
# 1. PRE-SEEDED TECH JOBS CORPUS (For Job Matching RAG)
# =====================================================================
DEFAULT_SEED_JOBS = [
    {
        "id": "job-1",
        "title": "Junior Java Backend Engineer",
        "company": "Razorpay",
        "location": "Bangalore, India",
        "role_category": "Backend",
        "description": "We are looking for enthusiastic early-career Java developers for our Core Payments team. Responsibilities: Build high-throughput microservices using Java 17, Spring Boot, and PostgreSQL. Implement Redis caching layers and Kafka event queues for transactions. Containerize services with Docker and deploy to AWS. Requirements: Java, Spring Boot, REST APIs, SQL, Docker, Kafka, JUnit."
    },
    {
        "id": "job-2",
        "title": "Frontend Engineer (React / TypeScript)",
        "company": "Swiggy",
        "location": "Bangalore, India (Hybrid)",
        "role_category": "Frontend",
        "description": "Join our Customer Experience web team. Build high-performance Single Page Applications with React 18, TypeScript, Tailwind CSS, and Redux Toolkit. Optimize Core Web Vitals, implement real-time order tracking with WebSockets, and write unit tests with Jest. Requirements: React, TypeScript, JavaScript (ES6+), CSS/Tailwind, HTML5, REST APIs."
    },
    {
        "id": "job-3",
        "title": "AI/ML Engineer (LLMs & RAG Pipelines)",
        "company": "Postman",
        "location": "Remote, India",
        "role_category": "AI / ML",
        "description": "Build cutting-edge developer productivity copilots. Responsibilities: Design and deploy RAG (Retrieval-Augmented Generation) architectures using Python, FastAPI, LangChain, and vector databases (pgvector / ChromaDB). Fine-tune open-weight models with PyTorch and Hugging Face Transformers. Requirements: Python, PyTorch, LangChain, Vector Databases, FastAPI, Docker, Prompt Engineering."
    },
    {
        "id": "job-4",
        "title": "Full Stack Developer (Next.js & Node.js)",
        "company": "CRED",
        "location": "Bangalore, India",
        "role_category": "Full Stack",
        "description": "Build premium fintech consumer products. Full-stack development with Next.js App Router, React, Node.js, Express, and PostgreSQL. Architect distributed event-driven systems with Redis, BullMQ, and Docker. Requirements: React, Next.js, Node.js, TypeScript, PostgreSQL, Redis, REST APIs."
    },
    {
        "id": "job-5",
        "title": "DevOps & Cloud Platform Engineer",
        "company": "Zomato",
        "location": "Gurgaon, India",
        "role_category": "DevOps",
        "description": "Manage scalable Kubernetes clusters on AWS. Automate CI/CD pipelines with GitHub Actions and Terraform. Set up Prometheus/Grafana monitoring and maintain Docker container registries. Requirements: AWS, Kubernetes, Docker, Terraform, Linux, CI/CD, Python/Bash scripting, Prometheus."
    },
    {
        "id": "job-6",
        "title": "Data Engineer (Spark & Snowflake)",
        "company": "PhonePe",
        "location": "Bangalore, India",
        "role_category": "Data Engineering",
        "description": "Design massive-scale transaction ETL pipelines. Responsibilities: Build batch and real-time streaming pipelines using Apache Spark, Kafka, Python, and SQL. Model analytics warehouses in Snowflake and PostgreSQL. Requirements: Python, SQL, Apache Spark, Kafka, Snowflake, Data Warehousing."
    },
    {
        "id": "job-7",
        "title": "Python Backend Developer (FastAPI & Microservices)",
        "company": "Groww",
        "location": "Bangalore, India",
        "role_category": "Backend",
        "description": "Architect high-speed trading and financial ledger backend services. Build async REST APIs with Python, FastAPI, SQLAlchemy, PostgreSQL, and Redis caching. Deploy using Docker and Kubernetes on GCP. Requirements: Python, FastAPI, PostgreSQL, Redis, Docker, AsyncIO, PyTest."
    },
    {
        "id": "job-8",
        "title": "Mobile App Developer (React Native)",
        "company": "Zepto",
        "location": "Mumbai, India",
        "role_category": "Mobile",
        "description": "Develop 10-minute grocery delivery rider and customer mobile applications. Build cross-platform iOS and Android apps with React Native, TypeScript, Redux, and GraphQL. Requirements: React Native, JavaScript/TypeScript, Mobile Performance Optimization, Redux, REST/GraphQL."
    }
]

# =====================================================================
# 2. PRE-SEEDED COMPANY INTELLIGENCE CORPUS (For Cover Letter / InMail RAG)
# =====================================================================
DEFAULT_COMPANY_KNOWLEDGE = [
    {
        "company": "Razorpay",
        "domain": "Fintech & Payment Gateway Infrastructure",
        "tech_stack": ["Java 17", "Spring Boot", "MySQL Sharding", "Redis", "Apache Kafka", "Docker", "AWS"],
        "engineering_focus": "High-throughput payment idempotency, zero double-charge transaction guarantees, 99.999% gateway availability, sub-100ms API response latency.",
        "key_challenges": "Handling 10,000+ transaction queries per second (TPS) during flash sales, building resilient webhook retry mechanisms, and automated merchant reconciliation.",
        "culture_and_values": "Obsession with merchant reliability, transparent blameless post-mortems, writing clean self-documenting code with high unit test coverage."
    },
    {
        "company": "Swiggy",
        "domain": "Hyperlocal Food & Grocery Logistics (Instamart)",
        "tech_stack": ["Go", "Java", "React", "TypeScript", "Redis Geospatial", "Apache Kafka", "AWS Kubernetes"],
        "engineering_focus": "Real-time dynamic batching algorithms, GPS driver tracking and ETA calculation, microservice resilience under high concurrency dinner peaks.",
        "key_challenges": "Solving the traveling salesperson problem for 100k+ simultaneous delivery partners, sub-second search indexing for 500k restaurant menu items.",
        "culture_and_values": "Customer delight first, high ownership, fast iteration and data-driven A/B experimentation."
    },
    {
        "company": "Postman",
        "domain": "Developer Productivity & API Lifecycle Platform",
        "tech_stack": ["Node.js", "Go", "Python", "React", "TypeScript", "PostgreSQL", "Docker", "GraphQL"],
        "engineering_focus": "World-class developer experience (DX), collaborative API testing protocols, real-time collaboration engines, high-speed API mocking and telemetry.",
        "key_challenges": "Supporting 30+ million developers worldwide with offline-first client synchronization and enterprise cloud workspace security.",
        "culture_and_values": "Developer empathy, community-first open standards, clean API design."
    },
    {
        "company": "CRED",
        "domain": "High-Trust Credit & Premium Fintech Ecosystem",
        "tech_stack": ["Next.js", "React", "Node.js", "TypeScript", "PostgreSQL", "Redis", "BullMQ", "AWS"],
        "engineering_focus": "Ultra-smooth UI/UX animations, distributed ledger consistency, real-time rewards gamification engines, zero-latency payment processing.",
        "key_challenges": "Managing instant bank settlements with strict idempotency and sub-millisecond fraud detection heuristics.",
        "culture_and_values": "Design excellence, uncompromising code aesthetics, high trust and bias for action."
    },
    {
        "company": "Zomato",
        "domain": "Food Delivery, Restaurant Tech & Quick Commerce (Blinkit)",
        "tech_stack": ["Golang", "PHP/Laravel", "Python", "Kubernetes", "PostgreSQL", "Redis", "Kafka"],
        "engineering_focus": "10-minute quick-commerce warehouse inventory locking, ultra-high throughput surge order routing, and real-time live map tracking.",
        "key_challenges": "Handling 4,000+ orders per minute during New Year peaks with zero database bottlenecks and automated fallback circuits.",
        "culture_and_values": "Frugality, rapid shipping, continuous architectural refactoring."
    },
    {
        "company": "PhonePe",
        "domain": "UPI Payments Switch & Digital Financial Services",
        "tech_stack": ["Java 17", "Spring Boot", "HBase", "Aerospike", "Kafka", "PostgreSQL", "Docker"],
        "engineering_focus": "Ultra-low-latency transaction routing (<80ms), distributed state machines, multi-datacenter active-active disaster recovery.",
        "key_challenges": "Processing over 45% of India's entire UPI transaction volume with 99.99% success rate.",
        "culture_and_values": "Engineering rigor, massive scale architectural discipline, security-first mindset."
    },
    {
        "company": "Groww",
        "domain": "Investment, Stocks, Mutual Funds & Wealth Tech",
        "tech_stack": ["Python", "FastAPI", "Spring Boot", "PostgreSQL", "Kafka", "Redis", "Docker", "GCP"],
        "engineering_focus": "Real-time stock market ticker feeds (WebSockets), order placement microsecond execution, automated tax calculations and portfolio analytics.",
        "key_challenges": "Managing huge market opening spikes (9:15 AM IST) with zero order drops and real-time market data streaming.",
        "culture_and_values": "Simplicity in financial products, transparent communication, strong engineering foundations."
    },
    {
        "company": "Zepto",
        "domain": "10-Minute Dark Store Grocery Delivery",
        "tech_stack": ["Node.js", "TypeScript", "Python", "PostgreSQL", "Redis", "Kafka", "AWS"],
        "engineering_focus": "Predictive inventory forecasting, picker path optimization inside dark stores, dynamic rider dispatch algorithms.",
        "key_challenges": "Guaranteeing 10-minute delivery SLAs with millisecond-level stock synchronization and automated route optimization.",
        "culture_and_values": "Relentless speed, operational excellence, full-stack ownership."
    },
    {
        "company": "Stripe",
        "domain": "Global Internet Commerce & Financial Infrastructure",
        "tech_stack": ["Ruby", "Java", "Go", "TypeScript", "PostgreSQL", "Redis", "Kafka", "AWS"],
        "engineering_focus": "API elegance and precision, double-entry bookkeeping ledger guarantees, 99.9999% global payment availability, developer-first documentation.",
        "key_challenges": "Preventing financial discrepancies across billions of dollars in volume and managing global regulatory compliance automatically.",
        "culture_and_values": "Rigorous thinking, macroeconomic impact, craftsmanship in API design."
    },
    {
        "company": "Google",
        "domain": "Large-Scale Search, Cloud, AI & Distributed Infrastructure",
        "tech_stack": ["C++", "Java", "Go", "Python", "TypeScript", "Spanner", "Bigtable", "Borg/Kubernetes"],
        "engineering_focus": "Planetary-scale distributed consensus, sub-millisecond query latency, fault tolerance across global data centers, scalable ML infrastructure.",
        "key_challenges": "Scaling services to billions of active daily users with zero downtime and strict security isolation.",
        "culture_and_values": "Algorithmic excellence, foundational computer science principles, scalable design patterns."
    },
    {
        "company": "Amazon",
        "domain": "Cloud Computing (AWS), E-Commerce & Logistics",
        "tech_stack": ["Java", "C++", "Python", "DynamoDB", "AWS Lambda", "S3", "Kubernetes"],
        "engineering_focus": "Decoupled microservice architectures, high availability, multi-region database replication, event-driven serverless computing.",
        "key_challenges": "Managing millions of concurrent requests during Prime Day with automated elasticity and zero single-points-of-failure.",
        "culture_and_values": "Customer Obsession, Ownership, Bias for Action, Dive Deep (Leadership Principles)."
    }
]


# =====================================================================
# 3. SEMANTIC VECTOR ENGINE (384-Dimensional Embeddings)
# =====================================================================
class SemanticVectorEngine:
    DIMENSIONS = 384

    @staticmethod
    def _tokenize(text: str) -> List[str]:
        cleaned = re.sub(r"[^a-zA-Z0-9+#.\-_/]", " ", text.lower())
        tokens = [t.strip() for t in cleaned.split() if len(t.strip()) > 1]
        return tokens

    def embed_text(self, text: str) -> List[float]:
        """Generates a normalized 384-dimensional dense vector for a piece of text."""
        tokens = self._tokenize(text)
        if not tokens:
            return [0.0] * self.DIMENSIONS

        vector = [0.0] * self.DIMENSIONS

        # Domain tech weights to amplify critical matching tech keywords
        tech_boost = {
            "python": 2.5, "java": 2.5, "react": 2.5, "fastapi": 2.2, "spring": 2.2,
            "docker": 2.0, "kubernetes": 2.2, "postgres": 2.0, "postgresql": 2.0,
            "sql": 1.8, "redis": 2.0, "kafka": 2.2, "aws": 2.0, "typescript": 2.0,
            "javascript": 1.8, "pytorch": 2.2, "rag": 2.5, "llm": 2.5, "spark": 2.2,
            "graphql": 1.9, "rest": 1.5, "nextjs": 2.0, "devops": 2.0, "idempotency": 2.5,
            "fintech": 2.0, "payments": 2.2, "concurrency": 2.2, "microservices": 2.0
        }

        for token in tokens:
            weight = tech_boost.get(token, 1.0)
            
            # Multi-hash projection into 384 dimensions
            h1 = int(hashlib.md5(token.encode("utf-8")).hexdigest(), 16)
            h2 = int(hashlib.sha256((token + "_sub").encode("utf-8")).hexdigest(), 16)

            idx1 = h1 % self.DIMENSIONS
            idx2 = h2 % self.DIMENSIONS
            sign1 = 1.0 if ((h1 >> 8) & 1) else -1.0
            sign2 = 1.0 if ((h2 >> 8) & 1) else -1.0

            vector[idx1] += sign1 * weight
            vector[idx2] += sign2 * (weight * 0.7)

            if len(token) >= 4:
                for n in range(3, min(6, len(token) + 1)):
                    sub = token[:n]
                    sub_idx = int(hashlib.md5(sub.encode("utf-8")).hexdigest(), 16) % self.DIMENSIONS
                    vector[sub_idx] += 0.35 * weight

        # L2-normalization for exact Cosine Similarity
        magnitude = math.sqrt(sum(v * v for v in vector))
        if magnitude > 0:
            return [round(v / magnitude, 6) for v in vector]
        return [0.0] * self.DIMENSIONS

    @staticmethod
    def cosine_similarity(v1: List[float], v2: List[float]) -> float:
        """Calculates cosine similarity between two normalized vectors (Range: 0.0 to 1.0)."""
        if not v1 or not v2 or len(v1) != len(v2):
            return 0.0
        dot_product = sum(a * b for a, b in zip(v1, v2))
        return max(0.0, min(1.0, (dot_product + 1.0) / 2.0 if dot_product < 0 else dot_product))


# =====================================================================
# 4. JOB VECTOR STORE
# =====================================================================
class JobVectorStore:
    def __init__(self):
        self.engine = SemanticVectorEngine()
        self.index: List[Dict[str, Any]] = []
        self._initialize_index()

    def _initialize_index(self):
        for job in DEFAULT_SEED_JOBS:
            corpus = f"{job['title']} {job['company']} {job['role_category']} {job['description']}"
            vector = self.engine.embed_text(corpus)
            self.index.append({
                **job,
                "vector": vector
            })

    def search_similar_jobs(
        self,
        query_text: str,
        top_k: int = 4,
        role_filter: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        query_vector = self.engine.embed_text(query_text)
        results = []

        for item in self.index:
            if role_filter and role_filter.lower() not in ["all", ""]:
                if role_filter.lower() not in item.get("role_category", "").lower() and role_filter.lower() not in item.get("title", "").lower():
                    continue

            sim = self.engine.cosine_similarity(query_vector, item["vector"])
            match_percentage = round(sim * 100, 1)

            results.append({
                "id": item.get("id"),
                "title": item.get("title"),
                "company": item.get("company"),
                "location": item.get("location"),
                "role_category": item.get("role_category"),
                "description": item.get("description"),
                "cosine_similarity": sim,
                "match_percentage": match_percentage
            })

        results.sort(key=lambda x: x["cosine_similarity"], reverse=True)
        return results[:top_k]


# =====================================================================
# 5. COMPANY INTELLIGENCE VECTOR STORE (For Cover Letter RAG)
# =====================================================================
class CompanyKnowledgeStore:
    def __init__(self):
        self.engine = SemanticVectorEngine()
        self.index: List[Dict[str, Any]] = []
        self._initialize_index()

    def _initialize_index(self):
        for comp in DEFAULT_COMPANY_KNOWLEDGE:
            corpus = f"{comp['company']} {comp['domain']} {' '.join(comp['tech_stack'])} {comp['engineering_focus']} {comp['key_challenges']} {comp['culture_and_values']}"
            vector = self.engine.embed_text(corpus)
            self.index.append({
                **comp,
                "vector": vector
            })

    def get_all_companies(self) -> List[Dict[str, Any]]:
        return [
            {
                "company": c["company"],
                "domain": c["domain"],
                "tech_stack": c["tech_stack"],
                "engineering_focus": c["engineering_focus"]
            }
            for c in self.index
        ]

    def retrieve_company_context(
        self,
        company_name: str,
        query_text: str = "",
        top_k: int = 1
    ) -> Dict[str, Any]:
        """
        Retrieves matching company profile with vector relevance score.
        If direct company name matches, prioritizes exact company profile.
        """
        clean_name = (company_name or "").strip().lower()
        
        # 1. Exact or partial name match
        for item in self.index:
            if item["company"].lower() == clean_name or clean_name in item["company"].lower():
                return {
                    "company": item["company"],
                    "domain": item["domain"],
                    "tech_stack": item["tech_stack"],
                    "engineering_focus": item["engineering_focus"],
                    "key_challenges": item["key_challenges"],
                    "culture_and_values": item["culture_and_values"],
                    "relevance_score": 100.0,
                    "is_exact_match": True
                }

        # 2. Semantic vector search across all companies if company name is new / unknown
        query_corpus = f"{company_name} {query_text}"
        query_vector = self.engine.embed_text(query_corpus)
        scored = []
        for item in self.index:
            sim = self.engine.cosine_similarity(query_vector, item["vector"])
            scored.append({
                "company": item["company"],
                "domain": item["domain"],
                "tech_stack": item["tech_stack"],
                "engineering_focus": item["engineering_focus"],
                "key_challenges": item["key_challenges"],
                "culture_and_values": item["culture_and_values"],
                "relevance_score": round(sim * 100, 1),
                "is_exact_match": False
            })

        scored.sort(key=lambda x: x["relevance_score"], reverse=True)
        return scored[0] if scored else {
            "company": company_name,
            "domain": "Technology & Software Engineering",
            "tech_stack": ["Clean Architecture", "REST APIs", "Modern Engineering Practices"],
            "engineering_focus": "Building robust, scalable, and high-performance software systems.",
            "key_challenges": "Scaling distributed services with reliability and maintainability.",
            "culture_and_values": "Customer focus, continuous improvement, and engineering craftsmanship.",
            "relevance_score": 75.0,
            "is_exact_match": False
        }


job_vector_store = JobVectorStore()
company_knowledge_store = CompanyKnowledgeStore()
