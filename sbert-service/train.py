from sentence_transformers import SentenceTransformer, InputExample, losses
from torch.utils.data import DataLoader

# 1. Load model
model = SentenceTransformer('all-MiniLM-L6-v2')

# 2. Training data (VERY IMPORTANT)
train_data = [
    ("Python developer with ML experience", "Machine Learning Engineer role", 0.9),
    ("React frontend developer", "Backend Node.js job", 0.2),
    ("Data analyst with SQL and Python", "Data Science role", 0.85),
    ("Java backend developer", "Frontend UI developer", 0.3),
    ("Deep learning engineer", "AI research engineer", 0.95),
]

# 3. Convert to InputExample
train_examples = [
    InputExample(texts=[t1, t2], label=score)
    for t1, t2, score in train_data
]

# 4. DataLoader
train_dataloader = DataLoader(train_examples, shuffle=True, batch_size=2)

# 5. Loss function
train_loss = losses.CosineSimilarityLoss(model)

# 6. Train model
model.fit(
    train_objectives=[(train_dataloader, train_loss)],
    epochs=3,
    warmup_steps=10
)

# 7. Save model
model.save("my_sbert_model")

print("Training complete and model saved!")