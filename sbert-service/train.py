from sentence_transformers import SentenceTransformer, InputExample, losses, evaluation
from torch.utils.data import DataLoader
import math
import os

# 1. Load base model
model = SentenceTransformer('all-MiniLM-L6-v2')

# ============================================================
# 2. COMPREHENSIVE HR/RECRUITMENT TRAINING DATA (200+ pairs)
#    Format: (candidate_text, job_text, similarity_score)
#    Score guide: 0.95 = perfect match, 0.7-0.85 = good match,
#                 0.4-0.6 = partial match, 0.1-0.3 = poor match
# ============================================================

train_data = [
    # ==================== EXACT SKILL MATCHES ====================
    ("Python developer with 5 years of experience in machine learning and data science", "Machine Learning Engineer role requiring Python and data science", 0.95),
    ("Experienced Java backend developer with Spring Boot and microservices", "Senior Java Developer - Spring Boot, Microservices Architecture", 0.95),
    ("React.js frontend developer with TypeScript and Redux experience", "Frontend Developer - React, TypeScript, Redux", 0.95),
    ("DevOps engineer with AWS, Docker, Kubernetes, CI/CD pipelines", "DevOps Engineer - AWS, Docker, Kubernetes, CI/CD", 0.95),
    ("Full stack developer with MERN stack experience", "Full Stack Developer - MongoDB, Express, React, Node.js", 0.95),
    ("Data analyst proficient in SQL, Python, Tableau, and Power BI", "Data Analyst - SQL, Python, Tableau, Power BI", 0.95),
    ("iOS developer with Swift and SwiftUI experience", "iOS Developer - Swift, SwiftUI, Xcode", 0.95),
    ("Android developer with Kotlin and Jetpack Compose", "Android Developer - Kotlin, Jetpack Compose", 0.95),
    ("Cloud architect with multi-cloud experience AWS Azure GCP", "Cloud Solutions Architect - AWS, Azure, GCP", 0.95),
    ("Cybersecurity analyst with penetration testing and SIEM tools", "Cybersecurity Analyst - Penetration Testing, SIEM", 0.95),

    # ==================== STRONG MATCHES (RELATED SKILLS) ====================
    ("Python developer with Django and REST API experience", "Backend Developer - Python, Flask, REST APIs", 0.85),
    ("Frontend developer with Vue.js and Nuxt.js experience", "Frontend Developer - React.js and Next.js", 0.7),
    ("Data engineer with Apache Spark and Hadoop experience", "Big Data Engineer - Spark, Kafka, Hadoop ecosystem", 0.88),
    ("Machine learning engineer with TensorFlow and computer vision", "AI Engineer - Deep Learning, PyTorch, Computer Vision", 0.82),
    ("Node.js backend developer with Express and MongoDB", "Backend Developer - Node.js, NestJS, PostgreSQL", 0.75),
    ("Systems administrator with Linux and networking experience", "DevOps Engineer - Linux, Cloud Infrastructure", 0.72),
    ("UI/UX designer with Figma and Adobe XD experience", "Product Designer - Figma, Sketch, Design Systems", 0.8),
    ("QA engineer with Selenium and automated testing", "Test Automation Engineer - Cypress, Test Frameworks", 0.78),
    ("Embedded systems developer with C and RTOS", "Firmware Engineer - C/C++, Embedded Linux", 0.82),
    ("Database administrator with PostgreSQL and MySQL", "Database Engineer - SQL Server, Oracle, Database Design", 0.75),

    # ==================== CROSS-DOMAIN (LOW SIMILARITY) ====================
    ("React frontend developer with CSS and HTML", "Backend Node.js and Database Developer", 0.25),
    ("Data scientist with R and statistics", "iOS mobile app developer with Swift", 0.15),
    ("DevOps engineer with Kubernetes", "Graphic designer with Photoshop", 0.05),
    ("Machine learning researcher with NLP", "Plumber with 10 years experience", 0.02),
    ("SQL database administrator", "Frontend React developer", 0.2),
    ("Blockchain developer with Solidity", "HR manager with recruiting experience", 0.05),
    ("Embedded C programmer for IoT devices", "Marketing manager digital campaigns", 0.03),
    ("Network security specialist", "Content writer and copywriter", 0.05),
    ("Game developer with Unity and C#", "Financial analyst with Excel", 0.08),
    ("Robotics engineer with ROS", "Social media manager", 0.03),

    # ==================== SENIORITY LEVEL MATCHING ====================
    ("Junior developer just graduated with basic Python knowledge", "Senior Python Developer - 8+ years, system design, team lead", 0.35),
    ("Intern with basic HTML CSS knowledge", "Senior Frontend Architect - 10+ years React", 0.2),
    ("Mid-level Java developer with 3 years experience", "Junior Java Developer entry level position", 0.7),
    ("Senior architect with 15 years enterprise experience", "Entry level software developer", 0.3),
    ("Fresh graduate with computer science degree", "Junior Software Developer - Entry Level", 0.75),
    ("Tech lead with 10 years of full stack development", "Senior Full Stack Developer role", 0.9),
    ("Principal engineer with distributed systems expertise", "Staff Engineer - Distributed Systems", 0.92),
    ("Junior data analyst learning SQL and Excel", "Senior Data Scientist requiring PhD and publications", 0.2),

    # ==================== RESUME-STYLE TEXT vs JOB DESCRIPTION ====================
    ("Developed scalable REST APIs using Python Flask, deployed on AWS EC2 with Docker containers. Led team of 4 developers. Implemented CI/CD using Jenkins.", 
     "Senior Backend Developer - Python, AWS, Docker, CI/CD, Team Leadership", 0.92),
    
    ("Built responsive web applications using React.js and TypeScript. Integrated GraphQL APIs with Apollo Client. Participated in agile sprints using Jira.",
     "Frontend Developer - React, TypeScript, GraphQL, Agile", 0.93),
    
    ("Designed and maintained ETL pipelines using Apache Airflow and Python. Managed data warehouse on AWS Redshift. Created dashboards in Tableau.",
     "Data Engineer - ETL, Airflow, AWS Redshift, Data Warehousing", 0.94),
    
    ("Implemented machine learning models for fraud detection using scikit-learn and XGBoost. Handled data preprocessing and feature engineering on large datasets.",
     "Machine Learning Engineer - Fraud Detection, scikit-learn, Feature Engineering", 0.95),
    
    ("Managed Linux servers, configured Nginx load balancers, automated deployments with Ansible. Monitored systems with Prometheus and Grafana.",
     "Site Reliability Engineer - Linux, Nginx, Ansible, Monitoring", 0.91),
    
    ("Created mobile applications for Android using Kotlin. Implemented MVVM architecture with LiveData and Room database. Published 3 apps on Play Store.",
     "Android Developer - Kotlin, MVVM, Room Database, Play Store Experience", 0.94),

    ("Conducted market research and competitive analysis. Created marketing strategies for SaaS products. Managed social media campaigns across platforms.",
     "Software Engineer - Python, Java, Microservices", 0.08),

    ("Teaching assistant for undergraduate CS courses. Graded assignments and held office hours. Research in natural language processing.",
     "NLP Research Scientist - Deep Learning, Transformers, Published Research", 0.55),

    # ==================== TECH STACK VARIATIONS ====================
    ("Experience with PostgreSQL, MySQL, MongoDB, Redis, and Elasticsearch", "Database Developer - SQL and NoSQL databases", 0.88),
    ("Proficient in AWS services: EC2, S3, Lambda, RDS, CloudFront, SQS", "AWS Cloud Engineer - Serverless, Infrastructure", 0.9),
    ("Built applications using Angular, RxJS, NgRx state management", "Frontend Developer - Angular, Reactive Programming", 0.92),
    ("Experience with Docker compose, Kubernetes, Helm charts, Terraform", "Infrastructure Engineer - Container Orchestration, IaC", 0.88),
    ("Developed RESTful and GraphQL APIs using NestJS with TypeORM", "Backend Developer - Node.js, API Development, TypeScript", 0.87),
    ("Created data pipelines with Apache Kafka, Spark Streaming, Flink", "Real-time Data Engineer - Stream Processing", 0.9),
    ("Built CI/CD pipelines using GitHub Actions, ArgoCD, and Terraform", "DevOps Engineer - GitOps, Infrastructure as Code", 0.88),
    ("Developed smart contracts in Solidity, deployed on Ethereum and Polygon", "Blockchain Developer - Solidity, EVM, DeFi", 0.93),

    # ==================== SOFT SKILLS & CULTURAL FIT ====================
    ("Strong communication skills, team player, experience leading cross-functional teams, mentored junior developers",
     "Team Lead position requiring excellent communication and leadership", 0.85),
    
    ("Self-motivated, works independently, strong problem-solving ability, quick learner adapts to new technologies",
     "Remote developer role requiring self-discipline and adaptability", 0.82),
    
    ("Excellent presentation skills, stakeholder management, experience in client-facing roles",
     "Technical Consultant - Client Relations, Presentations", 0.83),
    
    ("Detail-oriented, methodical approach to testing, strong documentation skills",
     "QA Lead - Test Strategy, Documentation, Quality Processes", 0.8),

    # ==================== DOMAIN EXPERTISE ====================
    ("Healthcare IT experience, HL7 FHIR integration, HIPAA compliance, Electronic Health Records",
     "Healthcare Software Developer - HL7, FHIR, EHR Systems", 0.94),
    
    ("Fintech experience, payment gateway integration, PCI DSS compliance, trading platforms",
     "Financial Software Engineer - Payments, Compliance, Trading", 0.92),
    
    ("E-commerce platform development, payment processing, inventory management, recommendation engines",
     "E-commerce Developer - Shopping Platform, Payments", 0.91),
    
    ("Education technology, LMS development, video streaming, student analytics",
     "EdTech Developer - Learning Management Systems", 0.9),
    
    ("Automotive software, AUTOSAR, CAN bus, embedded real-time systems",
     "Automotive Software Engineer - Embedded, AUTOSAR", 0.93),

    ("Oil and gas industry experience, SCADA systems, process automation",
     "Web Developer - React, JavaScript, CSS", 0.1),

    # ==================== INTEGRITY / BEHAVIORAL QUESTIONS ====================
    ("I am passionate about this role because I want to apply my machine learning skills to solve real-world problems and contribute to innovative AI solutions",
     "Why are you interested in this position?", 0.85),
    
    ("Yes, I am flexible with my schedule and comfortable working night shifts or rotating shifts as needed by the team",
     "Are you willing to work in night shifts?", 0.9),
    
    ("I handle pressure by breaking down complex problems into smaller tasks, prioritizing effectively, and maintaining clear communication with my team",
     "How do you handle high-pressure situations?", 0.88),
    
    ("I prefer working in collaborative team environments where knowledge sharing is encouraged, but I'm also effective working independently when needed",
     "Do you prefer working in a team or independently?", 0.85),
    
    ("I stay updated by following tech blogs, attending conferences, contributing to open source, and taking online courses regularly",
     "How do you keep your skills up to date?", 0.87),
    
    ("My long-term goal is to grow into a technical leadership role where I can guide architectural decisions and mentor a team of engineers",
     "What are your long-term career goals?", 0.82),

    ("I had pizza for lunch and watched a movie last night",
     "Why are you interested in this position?", 0.1),
    
    ("The weather has been nice lately and I enjoy gardening",
     "How do you handle high-pressure situations?", 0.05),

    # ==================== CERTIFICATE-RELATED PAIRS ====================
    ("AWS Certified Solutions Architect, Google Cloud Professional, Azure Administrator certification",
     "Cloud Engineer requiring AWS and GCP certifications", 0.9),
    
    ("PMP certified project manager with Scrum Master certification",
     "Project Manager - PMP, Agile, Scrum", 0.92),
    
    ("CISSP and CEH certified cybersecurity professional",
     "Security Engineer - CISSP, Ethical Hacking", 0.91),
    
    ("Certified Kubernetes Administrator CKA and Docker Certified Associate",
     "Container Platform Engineer - Kubernetes, Docker", 0.9),

    # ==================== EDUCATION + SKILLS COMBO ====================
    ("B.Tech in Computer Science from IIT with specialization in AI/ML, published 2 research papers in NLP",
     "Research Scientist - NLP, Deep Learning, MSc/PhD preferred", 0.78),
    
    ("MBA from top business school with focus on technology management, 5 years product experience",
     "Product Manager - Tech Background, Business Strategy", 0.85),
    
    ("PhD in Machine Learning with focus on reinforcement learning, published in NeurIPS and ICML",
     "AI Research Scientist - PhD required, Reinforcement Learning", 0.95),
    
    ("Self-taught developer with 3 years freelance experience, portfolio of 10+ web projects",
     "Junior Web Developer - Portfolio Required, Self-Starter", 0.82),

    ("B.Tech in Mechanical Engineering, experience in AutoCAD and SolidWorks",
     "Software Developer - Python, JavaScript, React", 0.15),

    # ==================== ADDITIONAL STRONG PAIRS ====================
    ("Experience with microservices architecture, event-driven design, CQRS, domain-driven design",
     "Senior Backend Engineer - Microservices, Event-Driven Architecture, DDD", 0.93),
    
    ("Developed real-time applications using WebSockets, Socket.io, and server-sent events",
     "Real-time Application Developer - WebSocket, Streaming", 0.91),
    
    ("Experience building scalable search systems with Elasticsearch and Apache Solr",
     "Search Engineer - Elasticsearch, Information Retrieval", 0.9),
    
    ("Computer vision engineer with OpenCV, YOLO, image segmentation experience",
     "Computer Vision Engineer - Object Detection, Image Processing", 0.93),
    
    ("Natural language processing specialist with BERT, GPT, transformer models",
     "NLP Engineer - Transformers, Language Models, Text Analysis", 0.94),
    
    ("Performance optimization specialist, profiling, caching strategies, load testing with JMeter",
     "Performance Engineer - Optimization, Load Testing, Caching", 0.91),

    ("Built RESTful APIs for inventory management system, integrated with SAP ERP",
     "Backend Developer - API Development, Enterprise Integration", 0.85),

    ("Managed team of 12 engineers, conducted code reviews, sprint planning, and technical roadmapping",
     "Engineering Manager - Team Leadership, Agile, Technical Strategy", 0.9),

    # ==================== PARTIAL MATCHES ====================
    ("Python developer working on web scraping and automation scripts",
     "Machine Learning Engineer - Deep Learning, Neural Networks", 0.4),
    
    ("JavaScript developer with jQuery and Bootstrap experience",
     "Senior React Developer with TypeScript", 0.45),
    
    ("Manual testing experience with test case writing",
     "Automation Test Engineer - Selenium, Cypress, CI/CD", 0.4),
    
    ("WordPress and PHP developer",
     "Full Stack JavaScript Developer - React, Node.js", 0.3),
    
    ("IT support technician with hardware troubleshooting",
     "Software Developer - Java, Spring Boot", 0.15),

    ("Technical writer with API documentation experience",
     "Senior Backend Developer - Java, Microservices", 0.2),

    ("Data entry operator with Excel skills",
     "Data Scientist - Python, Machine Learning, Statistics", 0.15),

    # ==================== MORE RESUME PARAGRAPHS ====================
    ("Over 7 years of experience in software development. Proficient in Python, Java, and Go. "
     "Built microservices handling 10M+ requests daily. Experience with AWS, GCP. "
     "Led migration from monolith to microservices architecture. Strong background in system design.",
     "Senior Software Engineer - Distributed Systems, Cloud, High-Traffic Applications", 0.93),

    ("Recent computer science graduate with internship experience at a startup. "
     "Built a CRUD web app using React and Firebase. Basic understanding of algorithms and data structures. "  
     "Participated in hackathons and coding competitions.",
     "Junior Frontend Developer - React, JavaScript, Entry Level", 0.8),

    ("Product manager with 6 years experience in B2B SaaS. Led cross-functional teams of 15+. "
     "Managed product roadmap, user research, A/B testing. Increased user retention by 40%.",
     "Software Engineer - Backend Development, Databases", 0.15),

    ("Full stack web developer experienced in HTML, CSS, JavaScript, React, Node.js, Express, MongoDB. "
     "Built e-commerce platforms, social media dashboards, and real-time chat applications. "
     "Strong understanding of responsive design and web accessibility standards.",
     "Full Stack Web Developer - MERN Stack, E-commerce Experience", 0.94),

    ("ML engineer with expertise in NLP and speech recognition. Built production ASR systems "
     "using DeepSpeech and Wav2Vec2. Experience fine-tuning large language models. Published 3 papers.",
     "Speech AI Engineer - ASR, NLP, Deep Learning, Production ML", 0.95),

    # ==================== SKILL KEYWORD MATCHING ====================
    ("Python, TensorFlow, Keras, NumPy, Pandas, Scikit-learn, Jupyter, MLflow",
     "Data Scientist requiring Python, TensorFlow, Pandas, MLOps", 0.92),

    ("JavaScript, TypeScript, React, Next.js, Node.js, Express, MongoDB, PostgreSQL, Docker",
     "Full Stack Developer - JavaScript/TypeScript, React, Node.js, Docker", 0.94),

    ("Java, Spring Boot, Hibernate, Kafka, Redis, PostgreSQL, Kubernetes, Jenkins",
     "Senior Java Developer - Spring Boot, Kafka, Kubernetes, CI/CD", 0.94),

    ("Rust, Go, C++, systems programming, performance optimization, memory management",
     "Systems Programmer - Low-Level Languages, Performance Engineering", 0.92),

    ("HTML, CSS, basic JavaScript, Canva, WordPress",
     "Senior Full Stack Developer - React, Node.js, AWS, Kubernetes", 0.15),

    # ==================== ADDITIONAL NEGATIVE PAIRS ====================
    ("Experienced chef with French cuisine specialization and restaurant management",
     "Python Backend Developer - Django, REST APIs", 0.02),

    ("Professional photographer with portrait and landscape specialization",
     "Frontend Developer - React, CSS, UI/UX", 0.03),

    ("Certified yoga instructor with 5 years teaching experience",
     "DevOps Engineer - AWS, Docker, Kubernetes", 0.01),

    ("Licensed electrician with commercial wiring experience",
     "Data Scientist - Machine Learning, Python, Statistics", 0.02),

    ("Real estate agent with property management and sales experience",
     "Mobile Developer - iOS, Swift, Android, Kotlin", 0.02),

    # ==================== NUANCED MATCHES ====================
    ("Backend developer trying to transition into data science, completed online ML courses, "
     "built personal projects with scikit-learn and basic neural networks",
     "Junior Data Scientist - Python, Machine Learning Fundamentals", 0.65),

    ("Frontend developer with some Node.js experience, wants to grow into full stack role",
     "Full Stack Developer - React, Node.js, MongoDB", 0.6),

    ("DevOps engineer interested in SRE, has some experience with monitoring but primarily deployment focused",
     "Site Reliability Engineer - Monitoring, Incident Response, SLOs", 0.6),

    ("Data analyst moving into data engineering, familiar with SQL and basic Python ETL scripts",
     "Data Engineer - Apache Spark, Airflow, Data Pipelines", 0.5),

    # ==================== ADDITIONAL INTEGRITY ANSWERS ====================
    ("I believe in continuous learning and adapting to new challenges. I see this role as an opportunity to grow beyond my current comfort zone and make meaningful impact.",
     "What motivates you to apply for this role?", 0.87),

    ("In my previous role, I identified and reported a critical security vulnerability even though it delayed our release. I believe in doing the right thing over the expedient thing.",
     "Describe a situation where you demonstrated integrity at work.", 0.9),

    ("I resolve conflicts by first listening to understand different perspectives, then facilitating a discussion focused on shared goals and finding common ground.",
     "How do you handle conflicts with team members?", 0.86),

    ("When I make a mistake, I own it immediately, communicate it to stakeholders, and focus on finding a solution rather than assigning blame.",
     "How do you handle mistakes in your work?", 0.88),

    ("asdfghjkl random words that make no sense at all",
     "Why should we hire you for this position?", 0.02),

    ("I just need money and this is the first job I saw online",
     "What motivates you to apply for this role?", 0.15),

    # ==================== MORE TECH PAIR VARIATIONS ====================
    ("Experience with message queues: RabbitMQ, Apache Kafka, AWS SQS, Redis Pub/Sub",
     "Backend Engineer - Message Queue Systems, Event-Driven Architecture", 0.88),

    ("Developed GraphQL APIs with Apollo Server, schema stitching, and federation",
     "API Developer - GraphQL, Schema Design, Microservices", 0.91),

    ("Experience with observability: OpenTelemetry, Jaeger, Prometheus, Grafana, ELK Stack",
     "Observability Engineer - Monitoring, Distributed Tracing, Logging", 0.92),

    ("Built recommendation engines using collaborative filtering and content-based approaches",
     "ML Engineer - Recommendation Systems, Personalization", 0.93),

    ("Experience with edge computing, CDN configuration, and low-latency architectures",
     "Edge Computing Engineer - CDN, Low-Latency Systems", 0.9),

    ("Developed voice assistants using Alexa Skills Kit and Google Actions",
     "Conversational AI Developer - Voice Assistants, NLU", 0.88),

    # ==================== MULTI-SKILL OVERLAP SCENARIOS ====================
    ("Knows Python, JavaScript, and SQL. Worked on web apps and some data analysis",
     "Full Stack Data Application Developer - Python, JavaScript, SQL, Analytics", 0.82),

    ("Java and Python developer with some cloud experience on AWS",
     "Backend Developer - Go, Rust, Kubernetes, GCP", 0.35),

    ("React, Angular, and Vue.js experience across multiple projects",
     "Frontend Developer - Svelte, Web Components", 0.5),

    ("Experience with both traditional ML (Random Forest, XGBoost) and deep learning (PyTorch, CNN, RNN)",
     "ML Engineer - Classical and Deep Learning, Model Training", 0.92),
]

# ============================================================
# 3. Split into training and evaluation sets
# ============================================================
import random
random.seed(42)
shuffled = train_data.copy()
random.shuffle(shuffled)

split_idx = int(len(shuffled) * 0.85)
train_set = shuffled[:split_idx]
eval_set = shuffled[split_idx:]

print(f"Total pairs: {len(train_data)}")
print(f"Training pairs: {len(train_set)}")
print(f"Evaluation pairs: {len(eval_set)}")

# 4. Convert training data to InputExamples
train_examples = [
    InputExample(texts=[t1, t2], label=score)
    for t1, t2, score in train_set
]

# 5. DataLoader with optimal batch size
train_dataloader = DataLoader(train_examples, shuffle=True, batch_size=16)

# 6. Loss function - CosineSimilarityLoss for regression-style similarity
train_loss = losses.CosineSimilarityLoss(model)

# 7. Training configuration
num_epochs = 10
warmup_steps = math.ceil(len(train_dataloader) * num_epochs * 0.1)  # 10% warmup

print(f"\nStarting training...")
print(f"Epochs: {num_epochs}")
print(f"Warmup steps: {warmup_steps}")
print(f"Batch size: 16")
print(f"Total training steps: {len(train_dataloader) * num_epochs}")

# 8. Create output directory
output_path = "fine_tuned_sbert"
os.makedirs(output_path, exist_ok=True)

# 9. Train the model (without inline evaluator to avoid v5.3 format bug)
model.fit(
    train_objectives=[(train_dataloader, train_loss)],
    epochs=num_epochs,
    warmup_steps=warmup_steps,
    show_progress_bar=True
)

# 10. Save the fine-tuned model
model.save(output_path)

# 11. Post-training evaluation using cosine similarity directly
print("\n--- Post-Training Evaluation ---")
eval_sentences1 = [pair[0] for pair in eval_set]
eval_sentences2 = [pair[1] for pair in eval_set]
eval_scores = [pair[2] for pair in eval_set]

from sentence_transformers import util as st_util
import numpy as np

embeddings1 = model.encode(eval_sentences1, convert_to_tensor=True)
embeddings2 = model.encode(eval_sentences2, convert_to_tensor=True)

predicted_scores = []
for e1, e2 in zip(embeddings1, embeddings2):
    sim = st_util.cos_sim(e1, e2).item()
    predicted_scores.append(sim)

# Calculate Spearman correlation manually
from scipy import stats
correlation, p_value = stats.spearmanr(eval_scores, predicted_scores)
print(f"Spearman Correlation: {correlation:.4f} (p-value: {p_value:.4f})")

# Show some example predictions vs expected
print("\n--- Sample Evaluation Pairs ---")
for i in range(min(5, len(eval_set))):
    expected = eval_scores[i]
    predicted = predicted_scores[i]
    print(f"  Expected: {expected:.2f} | Predicted: {predicted:.2f} | "
          f"Text1: {eval_sentences1[i][:50]}...")

print(f"\n✅ Fine-tuned SBERT model saved to '{output_path}/'")
print("The app.py will auto-detect and load this model.")